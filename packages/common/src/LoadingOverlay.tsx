import type { ReactNode } from "react";
import classNames from "classnames";
import { Spinner } from "./Spinner";

/**
 * 화면 전체를 덮는 로딩 팝업 (업로드처럼 끝날 때까지 기다려야 하는 작업).
 * open 동안 뒤 화면을 누를 수 없습니다.
 *   <LoadingOverlay open={uploading} message="이미지 올리는 중" detail="2 / 5" />
 */
export function LoadingOverlay({
  open,
  message,
  detail,
}: {
  open: boolean;
  message: string;
  detail?: ReactNode;
}) {
  if (!open) return null;
  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-live="assertive"
      aria-label={message}
      className={classNames(
        "fixed inset-0 z-100 flex items-center justify-center",
        "p-5",
        "bg-black/30 backdrop-blur-sm",
      )}
    >
      <div
        className={classNames(
          "w-full max-w-xs",
          "flex flex-col items-center gap-4",
          "p-6",
          "rounded-3xl bg-white shadow-xl",
          "text-center",
        )}
      >
        <Spinner size="lg" label="" />
        <div>
          <p className={classNames("text-sm font-medium")}>{message}</p>
          {detail ? (
            <p className={classNames("mt-1", "text-xs text-sub")}>{detail}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
