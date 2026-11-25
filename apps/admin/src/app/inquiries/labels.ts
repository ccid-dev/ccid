/** 문의 처리 상태 (DB check 제약과 같은 목록) */
export const INQUIRY_STATUSES = ["new", "read", "done"] as const;
export type InquiryStatus = (typeof INQUIRY_STATUSES)[number];

export const INQUIRY_STATUS_LABEL: Record<InquiryStatus, string> = {
  new: "새 문의",
  read: "읽음",
  done: "처리 완료",
};

/** 에이전트가 고른 주제 (사이트 libs/talk/inquiry.ts 의 TOPICS 와 같게) */
export const INQUIRY_TOPIC_LABEL: Record<string, string> = {
  collaboration: "연구 · 협력 제안",
  advisory: "자문",
  careers: "채용 · 인턴십",
  other: "기타",
};
