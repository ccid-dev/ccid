"use client";

import classNames from "classnames";
import type { ComponentProps, ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { Button, type ButtonStyle } from "@repo/common";
import { closeModal } from "@/libs/modal";

/** 입력칸 공통 (배경·효과 그룹) */
const inputVisual =
  "rounded-lg border border-black/5 bg-white outline-none transition focus:border-black";

/** 라벨 공통 (글자 그룹) */
const labelText = "text-xs font-medium text-sub";

/** 라벨 + 입력칸 */
export function Field({
  label,
  hint,
  ...props
}: ComponentProps<"input"> & { label: string; hint?: ReactNode }) {
  return (
    <label className={classNames("flex flex-col gap-1.5")}>
      <span className={classNames(labelText)}>{label}</span>
      <input
        className={classNames(
          "h-10 w-full",
          "px-3",
          inputVisual,
          "text-base sm:text-sm",
        )}
        {...props}
      />
      {hint ? (
        <span className={classNames("text-xs text-mute")}>{hint}</span>
      ) : null}
    </label>
  );
}

/** 라벨 + 고르기 */
export function Select({
  label,
  hint,
  children,
  ...props
}: ComponentProps<"select"> & { label: string; hint?: ReactNode }) {
  return (
    <label className={classNames("flex flex-col gap-1.5")}>
      <span className={classNames(labelText)}>{label}</span>
      <select
        className={classNames(
          "h-10 w-full",
          "px-2.5",
          inputVisual,
          "text-base sm:text-sm",
        )}
        {...props}
      >
        {children}
      </select>
      {hint ? (
        <span className={classNames("text-xs text-mute")}>{hint}</span>
      ) : null}
    </label>
  );
}

/** 폼 제출 버튼 (제출 중에는 스피너 + 비활성). 모양은 공통 Button 과 같습니다. */
export function SubmitButton({
  children,
  pendingText = "처리 중…",
  variant,
  size = "lg",
  block,
  className,
}: ButtonStyle & {
  children: ReactNode;
  pendingText?: string;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      loading={pending}
      variant={variant}
      size={size}
      block={block}
      className={className}
    >
      {pending ? pendingText : children}
    </Button>
  );
}

/** 폼 결과 메시지 */
export function FormMessage({
  error,
  message,
}: {
  error?: string;
  message?: string;
}) {
  if (error)
    return (
      <p role="alert" className={classNames("text-sm text-red-700")}>
        {error}
      </p>
    );
  if (message)
    return (
      <p role="status" className={classNames("text-sm text-sub")}>
        {message}
      </p>
    );
  return null;
}

/** 여러 줄 입력칸 */
export function TextArea({
  label,
  hint,
  rows = 3,
  ...props
}: ComponentProps<"textarea"> & { label?: string; hint?: ReactNode }) {
  return (
    <label className={classNames("flex flex-col gap-1.5")}>
      {label ? <span className={classNames(labelText)}>{label}</span> : null}
      <textarea
        rows={rows}
        className={classNames(
          "w-full",
          "px-3 py-2.5",
          inputVisual,
          "text-base leading-6 sm:text-sm",
        )}
        {...props}
      />
      {hint ? (
        <span className={classNames("text-xs text-mute")}>{hint}</span>
      ) : null}
    </label>
  );
}

/**
 * 한/영 입력칸 한 쌍. name="title" 이면 title_ko / title_en 으로 전송됩니다.
 *   <BilingualField label="제목" name="title" defaults={[row.title_ko, row.title_en]} />
 */
export function BilingualField({
  label,
  name,
  defaults = ["", ""],
  multiline = false,
  rows = 3,
  hint,
  required = false,
  autoFocus = false,
}: {
  label: string;
  name: string;
  defaults?: [string, string];
  /** 처음에 한국어 칸에 커서 (모달 등) */
  autoFocus?: boolean;
  multiline?: boolean;
  rows?: number;
  hint?: ReactNode;
  /** 한/영 중 하나는 있어야 하는 칸이면 표시만 합니다. (검사는 서버에서) */
  required?: boolean;
}) {
  const langs = ["ko", "en"] as const;
  return (
    <fieldset className={classNames("flex flex-col gap-1.5")}>
      <legend className={classNames("mb-1.5", labelText)}>
        {label}
        {required ? (
          <span className={classNames("ml-0.5", "text-main")}>*</span>
        ) : null}
      </legend>
      <div className={classNames("grid gap-2 sm:grid-cols-2")}>
        {langs.map((lang, i) => (
          <label key={lang} className={classNames("relative", "flex")}>
            <span
              className={classNames(
                "absolute top-3 right-3",
                "pointer-events-none",
                "font-neuehaas text-[10px] leading-none font-medium tracking-[0.08em] text-mute uppercase",
              )}
            >
              {lang}
            </span>
            {multiline ? (
              <textarea
                name={`${name}_${lang}`}
                defaultValue={defaults[i]}
                rows={rows}
                lang={lang}
                aria-label={`${label} (${lang})`}
                className={classNames(
                  "w-full",
                  "py-2.5 pr-10 pl-3",
                  inputVisual,
                  "text-base leading-6 sm:text-sm",
                )}
              />
            ) : (
              <input
                name={`${name}_${lang}`}
                defaultValue={defaults[i]}
                autoFocus={autoFocus && i === 0}
                lang={lang}
                aria-label={`${label} (${lang})`}
                className={classNames(
                  "h-10 w-full",
                  "pr-10 pl-3",
                  inputVisual,
                  "text-base sm:text-sm",
                )}
              />
            )}
          </label>
        ))}
      </div>
      {hint ? (
        <span className={classNames("text-xs text-mute")}>{hint}</span>
      ) : null}
    </fieldset>
  );
}

/** 체크박스 + 설명 (한 줄 카드) */
export function Checkbox({
  label,
  description,
  ...props
}: ComponentProps<"input"> & { label: string; description?: string }) {
  return (
    <label
      className={classNames(
        "max-w-md",
        "flex items-start gap-3",
        "px-3.5 py-3",
        "rounded-lg border border-black/5 bg-white transition has-checked:border-black",
      )}
    >
      <input
        type="checkbox"
        className={classNames("size-4 shrink-0", "mt-0.5", "accent-black")}
        {...props}
      />
      <span>
        <span className={classNames("text-sm font-medium")}>{label}</span>
        {description ? (
          <span className={classNames("block", "mt-0.5", "text-xs text-sub")}>
            {description}
          </span>
        ) : null}
      </span>
    </label>
  );
}

/** 폼 안의 구역 (흰 면 · 왼쪽 제목 · 오른쪽 입력칸) — Settings 등 */
export function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section
      className={classNames(
        "grid gap-6 md:grid-cols-[220px_1fr] md:gap-12",
        "p-6 md:p-10",
        "rounded-3xl bg-sheet/60",
      )}
    >
      <div className={classNames("flex flex-col gap-1")}>
        <h2 className={classNames("font-neuehaas text-lg font-medium")}>
          {title}
        </h2>
        {description ? (
          <p className={classNames("text-xs leading-5 text-sub")}>
            {description}
          </p>
        ) : null}
      </div>
      <div className={classNames("min-w-0", "flex flex-col gap-6")}>
        {children}
      </div>
    </section>
  );
}

/**
 * 켜고 끄는 스위치 (한 줄: 왼쪽 글 · 오른쪽 스위치). 폼에는 checkbox 로 전송됩니다.
 *   <Switch label="사이트에 공개" name="is_published" defaultChecked />
 */
export function Switch({
  label,
  description,
  className,
  ...props
}: Omit<ComponentProps<"input">, "type"> & {
  label: string;
  description?: ReactNode;
}) {
  return (
    <label
      className={classNames(
        "flex cursor-pointer items-center justify-between gap-4",
        className,
      )}
    >
      <span className={classNames("min-w-0")}>
        <span className={classNames("block", "text-sm font-medium")}>
          {label}
        </span>
        {description ? (
          <span className={classNames("block", "mt-0.5", "text-xs text-sub")}>
            {description}
          </span>
        ) : null}
      </span>
      <input
        type="checkbox"
        role="switch"
        className={classNames("peer", "sr-only")}
        {...props}
      />
      <span
        aria-hidden
        className={classNames("h-6 w-10 shrink-0", "relative", [
          "rounded-full bg-gray-200 transition peer-checked:bg-black peer-focus-visible:ring-2 peer-focus-visible:ring-black peer-focus-visible:ring-offset-2",
          "after:absolute after:top-0.5 after:left-0.5 after:size-5 after:rounded-full after:bg-white after:shadow-sm after:transition peer-checked:after:translate-x-4",
        ])}
      />
    </label>
  );
}

/**
 * 모달 안의 폼: 입력칸 · 오류 · [취소] [만들기]
 *   <ModalForm action={action} error={state.error} submitLabel="만들기">…</ModalForm>
 */
export function ModalForm({
  action,
  error,
  submitLabel,
  children,
}: {
  action: (formData: FormData) => void;
  error?: string;
  submitLabel: string;
  children: ReactNode;
}) {
  return (
    <form action={action} className={classNames("flex flex-col gap-5")}>
      {children}
      <FormMessage error={error} />
      <div
        className={classNames(
          "grid grid-cols-2 gap-2 sm:flex sm:justify-end",
          "pt-2",
        )}
      >
        <Button variant="outline" onClick={closeModal}>
          취소
        </Button>
        <SubmitButton size="md" pendingText="만드는 중…">
          {submitLabel}
        </SubmitButton>
      </div>
    </form>
  );
}
