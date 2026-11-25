// 사람인지 가늠하는 판정. 브라우저(대화를 시작할 때)와 서버(/api/talk/pass)가 같은 함수를 씁니다.
// 입력은 숫자로 된 요약뿐입니다 — 좌표나 입력한 글자는 들어오지 않습니다.
// (예전 사이트 human · humanScore 를 옮긴 것. 봇 차단 서비스로 바꿀지는 5단계에서 정합니다)
//
// 사람의 손은 고르지 않습니다. 그 고르지 않음을 봅니다:
//   커서  — 이벤트가 촘촘하고, 길이 휘고, 속도가 들쭉날쭉합니다. 자동화는 순간 이동하거나 곧은 선으로 움직입니다.
//   휠    — 값이나 간격이 조금씩 다릅니다(트랙패드 관성). 자동화는 같은 값을 같은 간격으로 보냅니다.
//   터치  — 스크롤 한 번에 touchmove 가 여러 번 옵니다. 간격이 고르지 않은 탭이 세 번 넘어도 사람으로 봅니다.
//   타자  — 글자 사이 간격이 흔들립니다. 같은 간격의 비율도 봅니다.
//   둘러보기 — 섹션에 머물고 페이지를 옮겨 다닙니다. 혼자서는 약한 증거라 휠과 함께만 씁니다.
//   열기  — 에이전트 구를 직접 눌러 열었습니다(스크립트가 보낸 클릭은 세지 않음). 사이트를 열자마자
//           구를 누른 사람은 다른 손길이 거의 없어, 이것만으로도 사람으로 봅니다. (예전 사이트의 메뉴 신호)
// 자동화 표지(navigator.webdriver)나 크롤러 · AI 에이전트의 User-Agent 는 바로 아니라고 봅니다.
//
// 이것은 비용을 지키는 문턱이지 보안 경계는 아닙니다. 요약은 브라우저가 보내므로 꾸밀 수 있고,
// 마음먹은 공격은 서버의 횟수 한도와 계정 예산 한도가 막습니다.

export const BOT_UA =
  /\b(?:bot|crawler|spider)\b|GPTBot|ChatGPT-User|OAI-SearchBot|ClaudeBot|Claude-User|Claude-SearchBot|anthropic-ai|PerplexityBot|Perplexity-User|Google-Extended|CCBot|Bytespider|Amazonbot|Applebot|meta-externalagent|HeadlessChrome|PhantomJS|python-requests|python-httpx|aiohttp|curl\/|Wget|node-fetch|axios\/|Go-http-client|Scrapy/i;

/** 브라우저가 보내는 입력 요약 */
export interface HumanSummary {
  elapsed?: number;
  webdriver?: boolean;
  mouse?: {
    moves?: number;
    path?: number;
    turns?: number;
    cv?: number;
    jumps?: number;
  };
  wheel?: { n?: number; distinct?: number; gapStd?: number };
  touch?: { seqs?: number; taps?: number; tapGapStd?: number };
  keys?: { n?: number; gapStd?: number; uniform?: number };
  views?: number;
  pages?: number;
  opened?: number;
}

const num = (v: unknown) => (Number.isFinite(Number(v)) ? Number(v) : 0);

export function scoreHuman(raw: HumanSummary = {}, ua = "") {
  const x = {
    elapsed: num(raw.elapsed),
    webdriver: raw.webdriver === true,
    mouse: {
      moves: num(raw.mouse?.moves),
      path: num(raw.mouse?.path),
      turns: num(raw.mouse?.turns),
      cv: num(raw.mouse?.cv),
      jumps: num(raw.mouse?.jumps),
    },
    wheel: {
      n: num(raw.wheel?.n),
      distinct: num(raw.wheel?.distinct),
      gapStd: num(raw.wheel?.gapStd),
    },
    touch: {
      seqs: num(raw.touch?.seqs),
      taps: num(raw.touch?.taps),
      tapGapStd: num(raw.touch?.tapGapStd),
    },
    keys: {
      n: num(raw.keys?.n),
      gapStd: num(raw.keys?.gapStd),
      uniform: num(raw.keys?.uniform),
    },
    views: num(raw.views),
    pages: num(raw.pages),
    opened: num(raw.opened),
  };
  if (x.webdriver || BOT_UA.test(ua))
    return { human: false, why: "automation" };
  if (x.elapsed < 2500) return { human: false, why: "too-soon" };

  const mouse =
    x.mouse.moves >= 20 &&
    x.mouse.path >= 300 &&
    x.mouse.turns >= 3 &&
    x.mouse.cv >= 0.3 &&
    x.mouse.jumps <= Math.max(2, x.mouse.moves * 0.1);
  const touch =
    x.touch.seqs >= 1 || (x.touch.taps >= 3 && x.touch.tapGapStd >= 60);
  const keys = x.keys.n >= 8 && x.keys.gapStd >= 18 && x.keys.uniform <= 0.45;
  const wheel =
    x.wheel.n >= 3 && (x.wheel.distinct >= 2 || x.wheel.gapStd >= 25);
  const browse = x.views >= 2 || x.pages >= 2;
  const opened = x.opened >= 1;

  const human = mouse || touch || keys || (wheel && browse) || opened;
  const why = human
    ? [
        mouse && "mouse",
        touch && "touch",
        keys && "keys",
        wheel && browse && "wheel+browse",
        opened && "opened",
      ]
        .filter(Boolean)
        .join(",")
    : "no-signal";
  return { human, why };
}
