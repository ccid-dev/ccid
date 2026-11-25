import "server-only";

/**
 * 보이스 에이전트(/api/talk) 서버 설정. 모두 서버 전용 값이라 NEXT_PUBLIC_ 을 붙이지 않습니다.
 * 꼭 필요한 것은 OPENAI_API_KEY(대답) · ELEVENLABS_API_KEY(받아 적기 · 목소리) 두 개이고,
 * 나머지는 비워 두면 아래 기본값을 씁니다. (루트 .env.example 참고)
 */

// .env 에 `KEY = "value"` 처럼 적어도 되도록 따옴표 · 앞뒤 공백을 다듬습니다.
const clean = (value: string | undefined, fallback = "") =>
  (value ?? "").trim().replace(/^["']|["']$/g, "") || fallback;

// NODE_ENV 는 next dev/build 가 직접 설정하므로 turbo env 선언이 필요 없습니다.
export const isDev = process.env.NODE_ENV === "development"; // eslint-disable-line turbo/no-undeclared-env-vars

export const talkEnv = {
  openai: {
    key: () => clean(process.env.OPENAI_API_KEY),
    /** 대답 모델 */
    model: () => clean(process.env.OPENAI_AGENT_MODEL, "gpt-6-luna"),
    /** 처리 등급: priority(빠름 · 비쌈) | default */
    tier: () => clean(process.env.OPENAI_AGENT_TIER, "priority"),
    /** 추론 정도: none(가장 빠름) | low … | default(모델 기본) */
    reasoning: () => clean(process.env.OPENAI_AGENT_REASONING, "none"),
  },
  elevenlabs: {
    key: () => clean(process.env.ELEVENLABS_API_KEY),
    sttModel: () => clean(process.env.ELEVENLABS_STT_MODEL, "scribe_v2"),
    ttsModel: () =>
      clean(process.env.ELEVENLABS_TTS_MODEL, "eleven_multilingual_v2"),
  },
  /** 대화 통행증 서명 키의 바탕. 없으면(로컬) 서버를 켤 때마다 새로 만듭니다. */
  passSecret: () => clean(process.env.TALK_PASS_SECRET),
  /**
   * 개발 서버에서만: 1 이면 OpenAI 를 부르지 않고 연습용 대답을 흘려보냅니다.
   * OPENAI_API_KEY 가 없을 때도 개발 서버에서는 연습용 대답으로 바뀝니다.
   */
  fake: () =>
    isDev && (clean(process.env.TALK_FAKE) === "1" || !talkEnv.openai.key()),
  /**
   * 개발 서버에서만: 받아 적기를 연습용 문장으로 대신합니다(TALK_FAKE=1 이거나 ELEVENLABS_API_KEY 가 없을 때).
   * 목소리(speak)는 연습용이 없어, 키가 없으면 글자만 보입니다.
   */
  fakeListen: () =>
    isDev &&
    (clean(process.env.TALK_FAKE) === "1" || !talkEnv.elevenlabs.key()),
};
