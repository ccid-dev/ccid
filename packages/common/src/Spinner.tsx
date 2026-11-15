import classNames from "classnames";

/** [크기, 테두리 두께] */
const sizes = {
  sm: ["size-4", "border-2"],
  md: ["size-6", "border-2"],
  lg: ["size-10", "border-[3px]"],
} as const;

export type SpinnerSize = keyof typeof sizes;

/**
 * 로딩 스피너 (두 앱 공통). 색은 글자색(currentColor)을 따라갑니다.
 *   <Spinner />                 → 화면 읽기 프로그램에 "불러오는 중"을 알림
 *   <Spinner size="sm" label="" /> → 버튼 안 등 장식용 (알림 없음)
 *   <Spinner className="text-primary" /> → 색 바꾸기
 */
export function Spinner({
  size = "md",
  label = "불러오는 중…",
  className,
}: {
  size?: SpinnerSize;
  /** 화면 읽기 프로그램용 문구. 빈 문자열이면 장식으로 취급합니다. */
  label?: string;
  className?: string;
}) {
  const [box, border] = sizes[size];
  return (
    <span
      role={label ? "status" : undefined}
      aria-hidden={label ? undefined : true}
      className={classNames("inline-flex", className)}
    >
      <span
        className={classNames(["shrink-0", box], "block", [
          "animate-spin rounded-full border-current/20 border-t-current",
          border,
        ])}
      />
      {label ? <span className={classNames("sr-only")}>{label}</span> : null}
    </span>
  );
}
