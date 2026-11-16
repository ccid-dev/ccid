"use client";

import classNames from "classnames";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  createContext,
  useActionState,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import { Button } from "@repo/common";
import type { FormState } from "@/app/actions/auth";
import { notify } from "@/libs/toast";
import { SubmitButton } from "./forms";
import {
  PreviewPanel,
  readForm,
  type FormValues,
  type PreviewLang,
} from "./preview";

/**
 * 편집 화면의 저장 · 삭제. 결과는 알림(토스트)으로 보여 주고,
 * 저장하면 화면에 머물고, 삭제하면 목록으로 돌아갑니다.
 */
export function useEditorActions({
  save,
  remove,
  confirmDelete,
  listHref,
}: {
  save: (prev: FormState, formData: FormData) => Promise<FormState>;
  remove?: () => Promise<FormState>;
  /** 삭제 전에 묻는 말 */
  confirmDelete?: string;
  /** 삭제 후 돌아갈 곳 */
  listHref?: string;
}) {
  const router = useRouter();
  const [, action] = useActionState<FormState, FormData>(
    async (prev, formData) => {
      const result = await save(prev, formData);
      notify(result);
      return result;
    },
    {},
  );
  const [deleting, startDelete] = useTransition();
  const onDelete = remove
    ? () => {
        if (!confirm(confirmDelete ?? "삭제할까요? 되돌릴 수 없습니다."))
          return;
        startDelete(async () => {
          const result = await remove();
          notify(result);
          if (!result.error && listHref) router.push(listHref);
        });
      }
    : undefined;
  return { action, onDelete, deleting };
}

/** 폼 안에서 "고친 내용이 있음"을 알리는 함수 (이미지처럼 입력칸 밖에서 바뀌는 값용) */
const DirtyContext = createContext<() => void>(() => {});
export const useMarkDirty = () => useContext(DirtyContext);

/**
 * 편집 화면 틀 (디자인 툴처럼):
 * - 위: 따라오는 도구 막대 (← 목록 / 제목 · 상태 · 변경 표시 · 삭제 · 저장)
 * - 왼쪽: 내용 (EditorSection)
 * - 오른쪽: 속성 (InspectorSection) — 공개 여부 · 순서 · 연결 등
 * ⌘S / Ctrl+S 로 저장하고, 저장하지 않은 변경이 있으면 창을 닫을 때 묻습니다.
 */
export function EditorForm({
  action,
  back,
  title,
  status,
  onDelete,
  deleting = false,
  inspector,
  preview,
  children,
}: {
  action: (formData: FormData) => void;
  back: { href: string; label: string };
  title: string;
  /** 제목 옆 상태 표시 (배지) */
  status?: ReactNode;
  onDelete?: () => void;
  deleting?: boolean;
  /** 오른쪽 속성 패널 */
  inspector?: ReactNode;
  /** 사이트 미리보기 (지금 폼 값 · 언어 → 사이트 모양). 있으면 도구 막대에 ‘미리보기’ 버튼이 생깁니다. */
  preview?: (values: FormValues, lang: PreviewLang) => ReactNode;
  children: ReactNode;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [dirty, setDirty] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [values, setValues] = useState<FormValues>({});

  /** 미리보기용 폼 값 다시 읽기 (화면이 바뀐 다음 프레임에 — 이미지처럼 상태로 바뀌는 값까지) */
  const refreshValues = useCallback(() => {
    requestAnimationFrame(() => {
      if (formRef.current) setValues(readForm(formRef.current));
    });
  }, []);
  const markDirty = useCallback(() => {
    setDirty(true);
    refreshValues();
  }, [refreshValues]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        formRef.current?.requestSubmit();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  return (
    <DirtyContext value={markDirty}>
      <form
        ref={formRef}
        action={action}
        onChange={markDirty}
        onInput={refreshValues}
        className={classNames("px-4 pb-16 md:px-10 xl:px-14")}
      >
        <div
          className={classNames(
            "sticky top-0 z-20",
            "-mx-4 md:-mx-10 xl:-mx-14",
            "px-4 pt-4 pb-3 md:px-10 md:pt-6 xl:px-14",
            "bg-background/80 backdrop-blur-md",
          )}
        >
          <div
            className={classNames(
              "min-h-14",
              "flex items-center gap-3",
              "py-2 pr-2 pl-4 md:pl-5",
              "rounded-2xl bg-sheet/60",
            )}
          >
            <Link
              href={back.href}
              className={classNames(
                "shrink-0",
                "transition",
                "font-neuehaas text-sm text-sub hover:text-main",
              )}
            >
              ←{" "}
              <span className={classNames("hidden sm:inline")}>
                {back.label}
              </span>
            </Link>
            <span
              aria-hidden
              className={classNames("hidden sm:block", "text-mute")}
            >
              /
            </span>
            <h1
              className={classNames(
                "min-w-0",
                "truncate text-sm font-semibold",
              )}
            >
              {title}
            </h1>
            <span className={classNames("hidden shrink-0 sm:flex", "gap-1.5")}>
              {status}
            </span>
            <div
              className={classNames(
                "flex shrink-0 items-center gap-1",
                "ml-auto",
              )}
            >
              {dirty ? (
                <span
                  className={classNames(
                    "hidden items-center gap-1.5 lg:flex",
                    "mr-2",
                    "text-xs text-sub",
                  )}
                >
                  <span
                    aria-hidden
                    className={classNames("size-1.5", "rounded-full bg-gold")}
                  />
                  저장하지 않은 변경
                </span>
              ) : null}
              {preview ? (
                <Button
                  variant={previewOpen ? "solid" : "ghost"}
                  aria-pressed={previewOpen}
                  onClick={() => {
                    if (!previewOpen && formRef.current)
                      setValues(readForm(formRef.current));
                    setPreviewOpen(!previewOpen);
                  }}
                >
                  미리보기
                </Button>
              ) : null}
              {onDelete ? (
                <Button
                  variant="ghost"
                  onClick={onDelete}
                  loading={deleting}
                  className={classNames("text-red-700!")}
                >
                  {deleting ? "삭제 중…" : "삭제"}
                </Button>
              ) : null}
              <SubmitButton size="md" pendingText="저장 중…">
                저장
                <kbd
                  className={classNames(
                    "hidden md:inline",
                    "font-neuehaas text-[11px] font-medium opacity-50",
                  )}
                >
                  ⌘S
                </kbd>
              </SubmitButton>
            </div>
          </div>
        </div>

        <div
          className={classNames(
            "grid gap-3 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-start",
            "mt-3",
          )}
        >
          <div className={classNames("min-w-0", "flex flex-col gap-3")}>
            {children}
          </div>
          {inspector ? (
            <aside
              className={classNames("flex flex-col gap-3 xl:sticky xl:top-24")}
            >
              {inspector}
            </aside>
          ) : null}
        </div>
        {preview ? (
          <PreviewPanel
            open={previewOpen}
            onClose={() => setPreviewOpen(false)}
          >
            {(lang) => preview(values, lang)}
          </PreviewPanel>
        ) : null}
      </form>
    </DirtyContext>
  );
}

/** 편집 화면 왼쪽의 내용 구역 (흰 면 · 제목 · 입력칸) */
export function EditorSection({
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
        "flex flex-col gap-7",
        "p-6 md:p-10",
        "rounded-3xl bg-sheet/60",
      )}
    >
      <div className={classNames("flex flex-col gap-1")}>
        <h2 className={classNames("font-neuehaas text-xl font-medium")}>
          {title}
        </h2>
        {description ? (
          <p className={classNames("text-xs leading-5 text-sub")}>
            {description}
          </p>
        ) : null}
      </div>
      <div className={classNames("flex flex-col gap-7")}>{children}</div>
    </section>
  );
}

/** 편집 화면 오른쪽의 속성 구역 (흰 면 · 작은 제목 · 속성들) */
export function InspectorSection({
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
        "flex flex-col gap-5",
        "p-6",
        "rounded-3xl bg-sheet/60",
      )}
    >
      <div className={classNames("flex flex-col gap-1")}>
        <h2 className={classNames("font-neuehaas text-base font-medium")}>
          {title}
        </h2>
        {description ? (
          <p className={classNames("text-xs leading-5 text-sub")}>
            {description}
          </p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

/** 속성 한 줄 (왼쪽 이름 · 오른쪽 값) — 읽기 전용 값에 씁니다. */
export function PropertyRow({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div
      className={classNames(
        "flex items-center justify-between gap-4",
        "text-sm",
      )}
    >
      <span className={classNames("text-sub")}>{label}</span>
      <span className={classNames("min-w-0", "truncate text-right")}>
        {children}
      </span>
    </div>
  );
}
