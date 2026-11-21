/**
 * 사이트 위에 남기는 디자인 피드백 코멘트 (개발 서버 전용).
 * 루트 .feedback/comments.json 에 배열로 저장됩니다. (git 에 올리지 않음)
 */
export type FeedbackStatus = "open" | "done";

/** 코멘트를 단 요소 — 사람과 Claude 가 코드에서 다시 찾을 수 있게 남기는 정보 */
export type FeedbackTarget = {
  /** 요소를 다시 찾는 CSS 선택자 */
  selector: string;
  /** 태그 이름 (h3, img …) */
  tag: string;
  /** 요소 안 글자 앞부분 (없으면 빈 문자열) */
  text: string;
  /** 요소를 그린 React 컴포넌트 이름 (안쪽 → 바깥) */
  components: string[];
};

export type FeedbackComment = {
  id: string;
  /** 화면에 보이는 번호 (지금 있는 가장 큰 번호 + 1) */
  number: number;
  status: FeedbackStatus;
  /** 주소창 경로 (/research, /en/people) */
  page: string;
  comment: string;
  target: FeedbackTarget;
  /** 요소 안에서 누른 위치 (왼쪽 위 0 · 오른쪽 아래 1) */
  point: { x: number; y: number };
  /** 코멘트를 남길 때 화면 크기 (모바일 · 데스크톱 구분용) */
  viewport: { width: number; height: number };
  createdAt: string;
  /** 반영한 뒤 남기는 한 줄 메모 */
  note?: string;
};

/** 새 코멘트를 만들 때 화면이 보내는 값 (id · 번호 · 상태 · 시각은 서버가 정함) */
export type FeedbackInput = Pick<
  FeedbackComment,
  "page" | "comment" | "target" | "point" | "viewport"
>;
