"use client";

import classNames from "classnames";
import { useRef } from "react";

/**
 * Join 버튼. 모집 중이면 지원 링크(새 창), 아니면 누를 때 "모집 기간이 아닙니다" 안내 모달.
 */
export function JoinButton({
  label,
  url,
  open,
  closed,
}: {
  label: string;
  url: string;
  open: boolean;
  closed: { title: string; message: string; close: string };
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const arrow = (
    <span
      aria-hidden
      className={classNames(
        "transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5",
      )}
    >
      ↗
    </span>
  );

  if (open && url)
    return (
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        cursor-label="Apply"
        className={classNames(
          "h-11 shrink-0 self-start md:self-auto",
          "group inline-flex items-center gap-2",
          "px-6",
          "rounded-full bg-black transition hover:bg-black/85",
          "font-neuehaas text-sm font-medium text-white",
        )}
      >
        {label}
        {arrow}
      </a>
    );

  const close = () => dialogRef.current?.close();
  return (
    <>
      <button
        type="button"
        aria-haspopup="dialog"
        onClick={() => dialogRef.current?.showModal()}
        className={classNames(
          "h-11 shrink-0 self-start md:self-auto",
          "group inline-flex items-center gap-2",
          "px-6",
          "rounded-full bg-white transition hover:bg-white/85",
          "font-neuehaas text-sm font-medium text-black",
        )}
      >
        {label}
        {arrow}
      </button>
      <dialog
        ref={dialogRef}
        aria-labelledby="recruit-closed-title"
        onClick={(event) => {
          if (event.target === event.currentTarget) close();
        }}
        className={classNames(
          "w-[calc(100%-2.5rem)] max-w-md",
          "m-auto",
          "p-0",
          [
            "rounded-3xl bg-background shadow-2xl",
            "transition-[opacity,translate] duration-300 starting:open:translate-y-4 starting:open:opacity-0",
            "backdrop:bg-black/30 backdrop:backdrop-blur-sm",
          ],
          "text-main",
        )}
      >
        <div className={classNames("flex flex-col gap-4", "p-7 md:p-8")}>
          <h2
            id="recruit-closed-title"
            className={classNames(
              "text-xl leading-snug font-medium break-keep",
            )}
          >
            {closed.title}
          </h2>
          {closed.message ? (
            <p
              className={classNames(
                "leading-7 whitespace-pre-line break-keep text-sub",
              )}
            >
              {closed.message}
            </p>
          ) : null}
          <button
            type="button"
            onClick={close}
            autoFocus
            className={classNames(
              "h-10 self-end",
              "mt-2 px-5",
              "rounded-full bg-sheet/60 transition hover:bg-sheet",
              "font-neuehaas text-sm font-medium",
            )}
          >
            {closed.close}
          </button>
        </div>
      </dialog>
    </>
  );
}
