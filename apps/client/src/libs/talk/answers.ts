import "server-only";

import { ANSWERS } from "@/components/agent-blob/talk/answers";

/** 정해 둔 대답(components/agent-blob/talk/answers.ts)을 에이전트 규칙에 넣을 글로 */
export function answersText() {
  return ANSWERS.map(
    (a) => `- When asked: ${a.when}\n  KO: ${a.ko}\n  EN: ${a.en}`,
  ).join("\n");
}
