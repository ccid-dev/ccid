// 목소리 부품: 소리 내기(AudioOut) · 마이크와 음성 감지(startMic) · 소리 형식 바꾸기.
// 대화 흐름(언제 듣고 언제 말할지)은 chat.ts 가 맡고, 여기는 소리만 다룹니다. (예전 사이트 engine.js 에서 옮김)
//
// 음성 감지(Silero VAD)는 마이크를 켤 때만 CDN 에서 불러옵니다(버전 고정). 사이트를 보는 데에는 아무 비용이 없습니다.

const CDN = {
  ort: "https://cdn.jsdelivr.net/npm/onnxruntime-web@1.30.0/dist/",
  vad: "https://cdn.jsdelivr.net/npm/@ricky0123/vad-web@0.0.31/dist/",
};

/** 대답 목소리(ElevenLabs pcm_24000) */
export const SAMPLE_RATE = 24000;

/** 듣기 · 끼어들기 · 맞장구 감도 (예전 사이트에서 귀로 맞춘 값) */
export const TUNE = {
  threshold: 0.5, // 말로 보는 VAD 확률
  bargeThreshold: 0.8, // 에이전트가 말하는 중엔 더 확실해야 끼어들기로 봅니다(스피커 소리가 새어 들어올 수 있음)
  endSilenceMs: 650, // 이만큼 조용하면 말이 끝났다
  minSpeechMs: 250,
  bargeMinSpeechMs: 350,
  duck: 0.3, // 말 같은 소리가 들리면 먼저 이만큼으로 낮춤
  fadeOut: 0.4, // 끼어들면 이 시간(초) 동안 줄이며 멈춤
  nodPauseMs: 380, // 말하다 이만큼 쉬면 맞장구 후보
  nodAfterSpeechMs: 2800, // 이만큼은 말한 뒤에만
  nodGapMs: 6500, // 맞장구 사이 간격
  nodChance: 0.7,
  thinkAfterMs: 1100, // 말이 끝나고 이만큼 지나도 대답 소리가 없으면 "음~"
  quietStopMs: 75_000, // 마이크를 켠 채 이만큼 조용하면 끔
};

// public/talk/{lang}-{n}.mp3 — 예전 사이트에서 eleven_v3 로 만든 짧은 소리(0.3~1.5초).
// ko: 0 음~ 1 네~ 2 아~ 3 네, 네 4 으음 5 흠~ 6 음, 음 / en: 0 Mm-hmm 1 Yeah 2 Right 3 I see 4 Mm 5 Hmm 6 Hm-hmm
const CLIPS = {
  ko: { nod: [1, 3, 2, 4, 6], think: [0, 5] },
  en: { nod: [0, 1, 2, 3, 4, 6], think: [5] },
} as const;
type ClipLang = keyof typeof CLIPS;
export type ClipKind = "nod" | "think";

function loadScript(src: string) {
  return new Promise<void>((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) return resolve();
    const el = document.createElement("script");
    el.src = src;
    el.async = true;
    el.crossOrigin = "anonymous";
    el.onload = () => resolve();
    el.onerror = () => reject(new Error(`load ${src}`));
    document.head.appendChild(el);
  });
}

/** 16kHz Float32 → 16bit WAV. 받아 적기로 보내는 소리. */
export function wav(samples: Float32Array, rate = 16000) {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);
  const text = (o: number, s: string) =>
    [...s].forEach((c, i) => view.setUint8(o + i, c.charCodeAt(0)));
  text(0, "RIFF");
  view.setUint32(4, 36 + samples.length * 2, true);
  text(8, "WAVE");
  text(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, rate, true);
  view.setUint32(28, rate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  text(36, "data");
  view.setUint32(40, samples.length * 2, true);
  for (let i = 0; i < samples.length; i++)
    view.setInt16(
      44 + i * 2,
      Math.max(-1, Math.min(1, samples[i] ?? 0)) * 0x7fff,
      true,
    );
  return new Blob([buffer], { type: "audio/wav" });
}

/** base64 16bit PCM → Float32 */
export function pcmFromBase64(b64: string) {
  const bin = atob(b64);
  const out = new Float32Array(bin.length >> 1);
  for (let i = 0; i < out.length; i++) {
    const v = bin.charCodeAt(i * 2) | (bin.charCodeAt(i * 2 + 1) << 8);
    out[i] = (v >= 0x8000 ? v - 0x10000 : v) / 0x8000;
  }
  return out;
}

/** 들린 비율만큼 글자를 단어 끝까지 드러낼 위치 */
export function revealTo(text: string, fraction: number) {
  if (fraction >= 1) return text.length;
  const n = Math.round(text.length * Math.max(0, fraction));
  const gap = text.slice(n).search(/\s/);
  return gap < 0 ? text.length : n + gap;
}

/** 소리 내기: 대답 목소리 · 맞장구 · 생각 소리. 소리 크기(구 반응용)도 여기서 잽니다. */
export class AudioOut {
  readonly ctx: AudioContext;
  readonly master: GainNode;
  private analyser: AnalyserNode;
  private probe: Float32Array<ArrayBuffer>;
  private clips: Partial<Record<ClipLang, Record<number, AudioBuffer>>> = {};
  private lastClip = -1;

  /** 사람이 누른 직후(버튼 클릭 안)에 만들어야 소리를 낼 수 있습니다. 못 만들면 null. */
  static create(): AudioOut | null {
    const Ctx =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctx) return null;
    return new AudioOut(new Ctx({ latencyHint: "interactive" }));
  }

  private constructor(ctx: AudioContext) {
    this.ctx = ctx;
    this.master = ctx.createGain();
    this.analyser = ctx.createAnalyser();
    this.analyser.fftSize = 512;
    this.master.connect(this.analyser);
    this.analyser.connect(ctx.destination);
    this.probe = new Float32Array(this.analyser.fftSize);
    this.loadClips();
  }

  async resume() {
    if (this.ctx.state === "suspended") await this.ctx.resume().catch(() => {});
  }

  private loadClips() {
    for (const lang of Object.keys(CLIPS) as ClipLang[]) {
      const ids = [...new Set([...CLIPS[lang].nod, ...CLIPS[lang].think])];
      const bank: Record<number, AudioBuffer> = {};
      this.clips[lang] = bank;
      for (const n of ids) {
        void fetch(`/talk/${lang}-${n}.mp3`)
          .then((r) => r.arrayBuffer())
          .then((data) => this.ctx.decodeAudioData(data))
          .then((buffer) => {
            bank[n] = buffer;
          })
          .catch(() => {
            /* 없으면 그 소리만 건너뜀 */
          });
      }
    }
  }

  /** 맞장구 · 생각 소리 한 번. 끝나는 시각(ctx 시간)을 돌려줍니다. 못 내면 0. */
  playClip(lang: ClipLang, kind: ClipKind, volume: number) {
    const bank = this.clips[lang];
    const pool = CLIPS[lang][kind].filter(
      (n) => n !== this.lastClip && bank?.[n],
    );
    const n = pool[Math.floor(Math.random() * pool.length)];
    const buffer = n === undefined ? undefined : bank?.[n];
    if (n === undefined || !buffer) return 0;
    this.lastClip = n;
    const src = this.ctx.createBufferSource();
    const gain = this.ctx.createGain();
    src.buffer = buffer;
    gain.gain.value = volume;
    src.connect(gain).connect(this.master);
    src.start();
    return this.ctx.currentTime + buffer.duration;
  }

  /** 지금 나가는 소리 크기 0–1 */
  outputLevel() {
    this.analyser.getFloatTimeDomainData(this.probe);
    let sum = 0;
    for (const v of this.probe) sum += v * v;
    return Math.min(1, Math.sqrt(sum / this.probe.length) * 5);
  }

  close() {
    void this.ctx.close().catch(() => {});
  }
}

// ── 마이크 · 음성 감지 ──

interface VadProbs {
  isSpeech: number;
}
interface MicVadOptions {
  positiveSpeechThreshold: number;
  negativeSpeechThreshold: number;
  minSpeechMs: number;
}
interface MicVadInstance {
  start(): Promise<void> | void;
  destroy(): Promise<void> | void;
  setOptions(options: Partial<MicVadOptions>): void;
}
declare global {
  interface Window {
    vad?: {
      MicVAD: {
        new: (options: Record<string, unknown>) => Promise<MicVadInstance>;
      };
    };
  }
}

export interface MicHandlers {
  /** 말 같은 소리가 시작됨 (아직 확실하지 않음) */
  onSpeechStart: () => void;
  /** 진짜 말로 확인됨 (minSpeechMs 넘김) */
  onSpeechRealStart: () => void;
  /** 말이 아니었음 (기침 등) */
  onMisfire: () => void;
  /** 말이 끝남: 그 구간의 16kHz 소리 */
  onSpeechEnd: (audio: Float32Array) => void;
  /** 프레임마다: 말일 확률 · 소리 */
  onFrame: (probs: VadProbs, frame: Float32Array) => void;
}

export interface Mic {
  /** 에이전트가 말하는 중이면 true — 더 확실한 말만 끼어들기로 봅니다. */
  setBarge(speaking: boolean): void;
  stop(): void;
}

export type MicError = "unsupported" | "blocked" | "failed";

/** 마이크를 열고 음성 감지를 시작합니다. 여기서 브라우저가 마이크 허용을 묻습니다. */
export async function startMic(
  audio: AudioOut,
  handlers: MicHandlers,
): Promise<Mic | MicError> {
  if (!navigator.mediaDevices?.getUserMedia) return "unsupported";
  let stream: MediaStream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        channelCount: 1,
      },
    });
  } catch {
    return "blocked";
  }
  try {
    await loadScript(`${CDN.ort}ort.wasm.min.js`);
    await loadScript(`${CDN.vad}bundle.min.js`);
    if (!window.vad) throw new Error("vad");
    const vad = await window.vad.MicVAD.new({
      model: "v5",
      baseAssetPath: CDN.vad,
      onnxWASMBasePath: CDN.ort,
      audioContext: audio.ctx,
      getStream: async () => stream,
      pauseStream: async () => {},
      resumeStream: async () => stream,
      positiveSpeechThreshold: TUNE.threshold,
      negativeSpeechThreshold: TUNE.threshold - 0.15,
      redemptionMs: TUNE.endSilenceMs,
      minSpeechMs: TUNE.minSpeechMs,
      preSpeechPadMs: 300,
      ...handlers,
      onVADMisfire: handlers.onMisfire,
      onFrameProcessed: handlers.onFrame,
    });
    await vad.start();
    return {
      setBarge(speaking) {
        const threshold = speaking ? TUNE.bargeThreshold : TUNE.threshold;
        vad.setOptions({
          positiveSpeechThreshold: threshold,
          negativeSpeechThreshold: threshold - 0.15,
          minSpeechMs: speaking ? TUNE.bargeMinSpeechMs : TUNE.minSpeechMs,
        });
      },
      stop() {
        void Promise.resolve(vad.destroy()).catch(() => {});
        stream.getTracks().forEach((t) => t.stop());
      },
    };
  } catch {
    stream.getTracks().forEach((t) => t.stop());
    return "failed";
  }
}
