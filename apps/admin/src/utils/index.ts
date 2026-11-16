/** 쉼표 · 줄바꿈으로 구분된 글을 목록으로 ("A, B\nC" → ["A", "B", "C"]) */
export const parseList = (value: string) =>
  value
    .split(/[,\n]/)
    .map((item) => item.trim())
    .filter(Boolean);

/** 줄바꿈으로만 구분 (쉼표가 들어갈 수 있는 값: 이미지 키 등) */
export const parseLines = (value: string) =>
  value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);

/** FormData 의 글 값 (앞뒤 공백 제거) */
export const formText = (formData: FormData, key: string) =>
  String(formData.get(key) ?? "").trim();

/** FormData 의 정수 값. 비었거나 숫자가 아니면 null */
export const formInt = (formData: FormData, key: string) => {
  const value = formText(formData, key);
  if (!value) return null;
  const number = Number(value);
  return Number.isInteger(number) ? number : null;
};

/** FormData 의 체크박스 값 */
export const formBool = (formData: FormData, key: string) =>
  formData.get(key) === "on";

/** 날짜 표시 (한국 시간) "2026. 11. 16." */
export const formatDate = (value: string) =>
  new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Asia/Seoul",
  }).format(new Date(value));

/** 날짜 · 시각 표시 (한국 시간) "2026. 11. 16. 오후 3:20" */
export const formatDateTime = (value: string) =>
  new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Asia/Seoul",
  }).format(new Date(value));
