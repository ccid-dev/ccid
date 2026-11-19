"use client";

import { useCallback, useEffect, useRef } from "react";

/**
 * 마이크(또는 다른 MediaStream) 소리 크기를 0–1 로 돌려주는 함수를 만듭니다. <BlobCanvas level={...} /> 에 넘기세요.
 * 값은 구의 애니메이션 루프 안에서 읽어서, React 가 매 프레임 다시 그리지 않습니다.
 * enabled 가 true 일 때만 마이크 권한을 요청합니다.
 *
 *   const getLevel = useMicLevel(voice && state === "listening");
 *   <BlobCanvas state={state} level={getLevel} />
 *
 * 에이전트 자신의 목소리(TTS · WebRTC 오디오)에 반응시키려면 마이크 대신 그 stream 을 넘기세요.
 */
export function useMicLevel(
  enabled: boolean,
  stream?: MediaStream | null,
  sensitivity = 4,
): () => number {
  const levelRef = useRef(0);
  // 항상 같은 함수 (orb 가 매 프레임 호출해 최신 값을 읽습니다)
  const getter = useCallback(() => levelRef.current, []);

  useEffect(() => {
    if (!enabled) {
      levelRef.current = 0;
      return;
    }
    let ctx: AudioContext | null = null;
    let own: MediaStream | null = null;
    let raf = 0;
    let cancelled = false;

    (async () => {
      try {
        const src =
          stream ??
          (own = await navigator.mediaDevices.getUserMedia({ audio: true }));
        if (cancelled) return;
        ctx = new AudioContext();
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 512;
        ctx.createMediaStreamSource(src).connect(analyser);
        const buf = new Float32Array(analyser.fftSize);
        const tick = () => {
          analyser.getFloatTimeDomainData(buf);
          let sum = 0;
          for (const v of buf) sum += v * v;
          levelRef.current = Math.min(
            1,
            Math.sqrt(sum / buf.length) * sensitivity,
          );
          raf = requestAnimationFrame(tick);
        };
        tick();
      } catch (e) {
        console.warn("[useMicLevel]", e);
      }
    })();

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      own?.getTracks().forEach((t) => t.stop());
      ctx?.close();
      levelRef.current = 0;
    };
  }, [enabled, stream, sensitivity]);

  return getter;
}
