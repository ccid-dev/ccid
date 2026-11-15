"use client";

import classNames from "classnames";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ThemeDot } from "@repo/common";
import { localePath, localized, type Dictionary, type Locale } from "@/i18n";
import type { ProjectWithThemes } from "@/libs/content";
import { Pills } from "./Section";

export const projectYear = (project: ProjectWithThemes) =>
  project.year_end
    ? `${project.year_start}–${project.year_end}`
    : `${project.year_start}`;

const twoDigits = (n: number) => String(n).padStart(2, "0");

/** NDA 표시 (검은 알약) */
function NdaBadge({ label }: { label: string }) {
  return (
    <span
      className={classNames(
        "h-5",
        "inline-flex items-center align-middle",
        "ml-2 px-2",
        "rounded-full bg-black",
        "font-neuehaas text-[10px] font-medium text-white",
      )}
    >
      {label}
    </span>
  );
}

/** 분야 번호 알약 (컬러칩 + 번호) */
function ThemeChip({ number }: { number: number }) {
  return (
    <span
      className={classNames(
        "h-7",
        "inline-flex items-center gap-1.5",
        "px-2.5",
        "rounded-full bg-white",
        "font-neuehaas text-xs font-medium",
      )}
    >
      <ThemeDot number={number} size="sm" />
      {twoDigits(number)}
    </span>
  );
}

/**
 * 프로젝트 목록 (한 줄 카드). 누르면 모달에서
 * 왼쪽: 프로젝트 자세한 정보 / 오른쪽: 관련 리서치 요약 · 자세히 보러 가기
 */
export function ProjectList({
  projects,
  locale,
  dict,
  showYear = true,
}: {
  projects: ProjectWithThemes[];
  locale: Locale;
  dict: Dictionary;
  /** 카드에 연도 표시 (연도별로 묶은 화면에서는 끔) */
  showYear?: boolean;
}) {
  const [selected, setSelected] = useState<ProjectWithThemes | null>(null);

  // 주소의 #<slug> 로 바로 열기 (홈에서 누르고 들어오거나, 공유받은 링크)
  useEffect(() => {
    const openFromHash = () => {
      const key = decodeURIComponent(window.location.hash.slice(1));
      const project = projects.find((p) => p.slug === key || p.id === key);
      if (project) setSelected(project);
    };
    openFromHash();
    window.addEventListener("hashchange", openFromHash);
    return () => window.removeEventListener("hashchange", openFromHash);
  }, [projects]);

  /** 모달을 열고 주소를 #<slug> 로 바꿔 그대로 공유할 수 있게 합니다. */
  const open = (project: ProjectWithThemes) => {
    setSelected(project);
    history.replaceState(null, "", `#${project.slug || project.id}`);
  };

  const onClose = () => {
    setSelected(null);
    if (window.location.hash)
      history.replaceState(
        null,
        "",
        window.location.pathname + window.location.search,
      );
  };

  if (!projects.length)
    return (
      <p className={classNames("text-sm text-sub")}>{dict.project.empty}</p>
    );

  return (
    <>
      <ul className={classNames("flex flex-col gap-2")}>
        {projects.map((project) => {
          const client = localized(project, "client", locale);
          const description = localized(project, "description", locale);
          return (
            <li key={project.id}>
              <button
                type="button"
                aria-haspopup="dialog"
                onClick={() => open(project)}
                className={classNames(
                  "w-full",
                  "group grid gap-x-10 gap-y-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-center",
                  "px-5 py-4 md:px-6",
                  "cursor-pointer rounded-2xl bg-sheet/60 transition hover:bg-sheet",
                  "text-left",
                )}
              >
                <span className={classNames("min-w-0", "flex flex-col gap-1")}>
                  {showYear ? (
                    <span
                      className={classNames(
                        "font-neuehaas text-xs font-medium text-sub",
                      )}
                    >
                      {projectYear(project)}
                    </span>
                  ) : null}
                  <span
                    className={classNames(
                      "text-lg leading-snug font-medium tracking-[-0.01em] break-keep",
                    )}
                  >
                    {localized(project, "title", locale)}
                    {project.is_nda ? (
                      <NdaBadge label={dict.project.nda} />
                    ) : null}
                  </span>
                  {client ? (
                    <span className={classNames("text-sm text-sub")}>
                      {client}
                    </span>
                  ) : null}
                  {!project.is_nda && description ? (
                    <span
                      className={classNames(
                        "max-w-3xl",
                        "mt-1",
                        "line-clamp-1 text-sm leading-6 text-sub",
                      )}
                    >
                      {description}
                    </span>
                  ) : null}
                </span>
                <span
                  className={classNames(
                    "flex items-center gap-1.5 md:justify-end",
                  )}
                >
                  {project.themes.map((theme) => (
                    <ThemeChip key={theme.slug} number={theme.number} />
                  ))}
                  <span
                    aria-hidden
                    className={classNames(
                      "size-8 shrink-0",
                      "flex items-center justify-center",
                      "ml-auto md:ml-3",
                      "rounded-full bg-white transition group-hover:bg-black group-hover:text-white",
                      "font-neuehaas",
                    )}
                  >
                    →
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      <ProjectDialog
        project={selected}
        locale={locale}
        dict={dict}
        onClose={onClose}
      />
    </>
  );
}

/**
 * 프로젝트 모달 (<dialog>). 넓은 화면은 가운데, 좁은 화면은 아래에서 올라옵니다.
 * Esc · 바깥 · 닫기 버튼으로 닫힙니다.
 */
function ProjectDialog({
  project,
  locale,
  dict,
  onClose,
}: {
  project: ProjectWithThemes | null;
  locale: Locale;
  dict: Dictionary;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog || !project) return;
    if (!dialog.open) dialog.showModal();
    const overflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = overflow;
    };
  }, [project]);

  const close = () => ref.current?.close();

  const tags = project ? localized(project, "tags", locale) : [];
  const description = project ? localized(project, "description", locale) : "";
  const client = project ? localized(project, "client", locale) : "";

  return (
    <dialog
      ref={ref}
      aria-labelledby="project-dialog-title"
      onClose={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) close();
      }}
      className={classNames(
        "max-h-[90dvh] w-full max-w-none md:max-h-[85dvh] md:w-[calc(100%-5rem)] md:max-w-5xl",
        "mx-auto mt-auto mb-0 md:my-auto",
        "overflow-y-auto overscroll-contain",
        "p-0",
        [
          "rounded-t-3xl bg-background shadow-2xl md:rounded-3xl",
          "transition-[opacity,translate] duration-300 starting:open:translate-y-8 starting:open:opacity-0",
          "backdrop:bg-black/30 backdrop:backdrop-blur-sm",
        ],
        "text-main",
      )}
    >
      {project ? (
        <div
          className={classNames(
            "grid gap-10 md:grid-cols-2 md:gap-12",
            "p-6 pb-[calc(env(safe-area-inset-bottom)+1.5rem)] md:p-10",
          )}
        >
          <div className={classNames("flex flex-col gap-6")}>
            <div className={classNames("flex items-center justify-between")}>
              <span
                className={classNames(
                  "font-neuehaas text-sm font-medium text-sub",
                )}
              >
                {projectYear(project)}
              </span>
              <button
                type="button"
                onClick={close}
                className={classNames(
                  "h-9 md:hidden",
                  "px-4",
                  "rounded-full bg-sheet/60 transition hover:bg-sheet",
                  "font-neuehaas text-sm font-medium",
                )}
              >
                {dict.project.close}
              </button>
            </div>
            <div className={classNames("flex flex-col gap-2")}>
              <h2
                id="project-dialog-title"
                className={classNames(
                  "text-xl leading-snug font-medium tracking-[-0.02em] break-keep md:text-2xl",
                )}
              >
                {localized(project, "title", locale)}
                {project.is_nda ? <NdaBadge label={dict.project.nda} /> : null}
              </h2>
              {client ? (
                <p className={classNames("text-sub")}>{client}</p>
              ) : null}
            </div>
            {project.is_nda ? (
              <p className={classNames("text-sm text-sub")}>
                {dict.project.ndaNote}
              </p>
            ) : (
              <>
                {description ? (
                  <p
                    className={classNames(
                      "leading-7 whitespace-pre-line break-keep",
                    )}
                  >
                    {description}
                  </p>
                ) : null}
                {tags.length ? <Pills items={tags} prefix="#" /> : null}
              </>
            )}
          </div>

          <div className={classNames("flex flex-col gap-4")}>
            <div className={classNames("flex items-center justify-between")}>
              <p
                className={classNames(
                  "font-neuehaas text-sm font-medium text-sub",
                )}
              >
                {dict.project.research}
              </p>
              <button
                type="button"
                onClick={close}
                className={classNames(
                  "h-9 max-md:hidden",
                  "px-4",
                  "rounded-full bg-sheet/60 transition hover:bg-sheet",
                  "font-neuehaas text-sm font-medium",
                )}
              >
                {dict.project.close}
              </button>
            </div>
            <ul className={classNames("flex flex-col gap-2")}>
              {project.themes.map((theme) => (
                <li key={theme.slug}>
                  <Link
                    href={localePath(locale, `/research/${theme.slug}`)}
                    onClick={close}
                    className={classNames(
                      "group flex flex-col gap-3",
                      "p-5 md:p-6",
                      "rounded-2xl bg-sheet/60 transition hover:bg-sheet",
                    )}
                  >
                    <span className={classNames("flex items-center gap-2.5")}>
                      <ThemeDot number={theme.number} size="lg" />
                      <span
                        className={classNames(
                          "font-neuehaas text-sm font-medium text-sub",
                        )}
                      >
                        {twoDigits(theme.number)}
                      </span>
                    </span>
                    <span
                      className={classNames(
                        "text-lg leading-snug font-medium break-keep",
                      )}
                    >
                      {localized(theme, "title", locale)}
                    </span>
                    {localized(theme, "summary", locale) ? (
                      <span
                        className={classNames(
                          "line-clamp-4 text-sm leading-6 text-sub",
                        )}
                      >
                        {localized(theme, "summary", locale)}
                      </span>
                    ) : null}
                    <span
                      className={classNames(
                        "font-neuehaas text-sm font-medium",
                      )}
                    >
                      {dict.research.more} →
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}
    </dialog>
  );
}
