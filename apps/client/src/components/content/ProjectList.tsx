"use client";

import classNames from "classnames";
import { useEffect, useRef, useState } from "react";
import { ProjectCard, ProjectDetail } from "@repo/blocks";
import { SiteNextLink } from "./SiteNextLink";
import { localePath, localized, type Dictionary, type Locale } from "@/i18n";
import type { ProjectWithThemes } from "@/libs/content";

export const projectYear = (project: ProjectWithThemes) =>
  project.year_end
    ? `${project.year_start}–${project.year_end}`
    : `${project.year_start}`;

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

  /** 관련 리서치로 이동하며 닫을 때는 주소를 건드리지 않습니다. (이동을 덮어쓰지 않게) */
  const navigatingRef = useRef(false);

  const onClose = () => {
    setSelected(null);
    if (navigatingRef.current) {
      navigatingRef.current = false;
      return;
    }
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
          return (
            <li key={project.id}>
              <ProjectCard
                project={{
                  year: projectYear(project),
                  title: localized(project, "title", locale),
                  client: localized(project, "client", locale),
                  description: localized(project, "description", locale),
                  nda: project.is_nda,
                  themeNumbers: project.themes.map((theme) => theme.number),
                }}
                ndaLabel={dict.project.nda}
                showYear={showYear}
                onClick={() => open(project)}
              />
            </li>
          );
        })}
      </ul>
      <ProjectDialog
        project={selected}
        locale={locale}
        dict={dict}
        onClose={onClose}
        onNavigate={() => {
          navigatingRef.current = true;
        }}
      />
    </>
  );
}

/**
 * 프로젝트 모달 (<dialog>). 넓은 화면은 가운데, 좁은 화면은 아래에서 올라옵니다.
 * Esc · 바깥 · 닫기 버튼으로 닫히고, 관련 리서치를 누르면 닫히면서 그 페이지로 갑니다.
 */
function ProjectDialog({
  project,
  locale,
  dict,
  onClose,
  onNavigate,
}: {
  project: ProjectWithThemes | null;
  locale: Locale;
  dict: Dictionary;
  onClose: () => void;
  /** 관련 리서치로 이동하기 직전 */
  onNavigate: () => void;
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
        <ProjectDetail
          titleId="project-dialog-title"
          onClose={close}
          onNavigate={() => {
            onNavigate();
            close();
          }}
          Link={SiteNextLink}
          labels={{
            nda: dict.project.nda,
            ndaNote: dict.project.ndaNote,
            research: dict.project.research,
            more: dict.research.more,
            close: dict.project.close,
          }}
          project={{
            year: projectYear(project),
            title: localized(project, "title", locale),
            client: localized(project, "client", locale),
            description: localized(project, "description", locale),
            tags: localized(project, "tags", locale),
            nda: project.is_nda,
            research: project.themes.map((theme) => ({
              number: theme.number,
              title: localized(theme, "title", locale),
              summary: localized(theme, "summary", locale),
              href: localePath(locale, `/research/${theme.slug}`),
            })),
          }}
        />
      ) : null}
    </dialog>
  );
}
