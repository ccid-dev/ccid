"use client";

import classNames from "classnames";
import { useEffect, useRef, useState } from "react";
import type { Swiper as SwiperInstance } from "swiper";
import { A11y, Keyboard, Mousewheel } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
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
 * 모달 위쪽의 이전 · 다음 버튼(또는 ← → 키)으로 목록 순서대로 계속 넘겨 볼 수 있습니다.
 * groupByYear 면 시작 연도별로 묶어서 보여 줍니다. (넘기기는 묶음과 상관없이 전체 순서)
 */
export function ProjectList({
  projects,
  locale,
  dict,
  groupByYear = false,
}: {
  projects: ProjectWithThemes[];
  locale: Locale;
  dict: Dictionary;
  /** 연도별로 묶기 (왼쪽 2칸에 연도, 카드에는 연도를 빼고) */
  groupByYear?: boolean;
}) {
  const [index, setIndex] = useState<number | null>(null);

  const keyOf = (project: ProjectWithThemes) => project.slug || project.id;

  // 주소의 #<slug> 로 바로 열기 (홈에서 누르고 들어오거나, 공유받은 링크)
  useEffect(() => {
    const openFromHash = () => {
      const key = decodeURIComponent(window.location.hash.slice(1));
      const found = projects.findIndex((p) => p.slug === key || p.id === key);
      if (found >= 0) setIndex(found);
    };
    openFromHash();
    window.addEventListener("hashchange", openFromHash);
    return () => window.removeEventListener("hashchange", openFromHash);
  }, [projects]);

  /** 모달을 열고 주소를 #<slug> 로 바꿔 그대로 공유할 수 있게 합니다. */
  const open = (next: number) => {
    const project = projects[next];
    if (!project) return;
    setIndex(next);
    history.replaceState(null, "", `#${keyOf(project)}`);
  };

  /** 관련 리서치로 이동하며 닫을 때는 주소를 건드리지 않습니다. (이동을 덮어쓰지 않게) */
  const navigatingRef = useRef(false);

  const onClose = () => {
    setIndex(null);
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

  const card = (project: ProjectWithThemes) => (
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
        showYear={!groupByYear}
        onClick={() => open(projects.indexOf(project))}
      />
    </li>
  );

  const years = [...new Set(projects.map((p) => p.year_start))];

  return (
    <>
      {groupByYear ? (
        <div className={classNames("flex flex-col gap-16 md:gap-20")}>
          {years.map((year) => (
            <section
              key={year}
              className={classNames("grid gap-y-4 lg:grid-cols-10 lg:gap-x-10")}
            >
              <h2
                className={classNames(
                  "self-start lg:sticky lg:top-24 lg:col-span-2",
                  "font-neuehaas text-2xl leading-none",
                )}
              >
                {year}
              </h2>
              <ul className={classNames("flex flex-col gap-3 lg:col-span-8")}>
                {projects.filter((p) => p.year_start === year).map(card)}
              </ul>
            </section>
          ))}
        </div>
      ) : (
        <ul className={classNames("flex flex-col gap-3")}>
          {projects.map(card)}
        </ul>
      )}
      <ProjectDialog
        projects={projects}
        index={index}
        onIndex={open}
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

const twoDigits = (n: number) => String(n).padStart(2, "0");

/**
 * 프로젝트 모달 (<dialog>, 화면 전체) — 프로젝트 카드들이 가로로 놓인 캐러셀(Swiper).
 * 가운데 = 지금 프로젝트 (크게 · 선명하게), 양옆 = 이전 · 다음 (작게 · 흐리게, 누르면 그쪽으로).
 * 넘기기: 드래그 · 스와이프 · 트랙패드 가로 스크롤 · ← → 키 · 위쪽 화살표 버튼. (세로 휠은 카드 안 스크롤)
 * 위쪽 막대: 번호(03 / 12) · 이전 · 다음 · X 닫기. Esc · 카드 바깥 빈 곳을 눌러도 닫힙니다.
 * 관련 리서치를 누르면 닫히면서 그 페이지로 갑니다.
 */
function ProjectDialog({
  projects,
  index,
  onIndex,
  locale,
  dict,
  onClose,
  onNavigate,
}: {
  projects: ProjectWithThemes[];
  /** 지금 프로젝트 (null = 닫힘) */
  index: number | null;
  /** 넘겼을 때 */
  onIndex: (index: number) => void;
  locale: Locale;
  dict: Dictionary;
  onClose: () => void;
  /** 관련 리서치로 이동하기 직전 */
  onNavigate: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const swiperRef = useRef<SwiperInstance | null>(null);
  const isOpen = index !== null;
  /** 모달이 화면에 뜬 뒤에 캐러셀을 그립니다 (닫힌 상태에서는 크기를 잴 수 없어서) */
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog || !isOpen) return;
    if (!dialog.open) dialog.showModal();
    setShown(true);
    const overflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = overflow;
    };
  }, [isOpen]);

  // 바깥(주소 #slug 등)에서 index 가 바뀌면 그 카드로
  useEffect(() => {
    const swiper = swiperRef.current;
    if (swiper && index !== null && swiper.activeIndex !== index)
      swiper.slideTo(index);
  }, [index]);

  const close = () => ref.current?.close();

  const navButton = (by: -1 | 1) => (
    <button
      type="button"
      aria-label={by === -1 ? dict.project.prev : dict.project.next}
      disabled={
        index === null ||
        (by === -1 ? index === 0 : index === projects.length - 1)
      }
      onClick={() =>
        by === -1
          ? swiperRef.current?.slidePrev()
          : swiperRef.current?.slideNext()
      }
      className={classNames(
        "group size-10",
        "flex items-center justify-center",
        "rounded-full bg-white/15 text-white backdrop-blur transition-colors duration-300 hover:bg-white hover:text-black",
        "disabled:pointer-events-none disabled:opacity-30",
        "font-neuehaas",
      )}
    >
      <span
        aria-hidden
        className={classNames(
          "transition-transform duration-300",
          by === -1
            ? "group-hover:-translate-x-0.5"
            : "group-hover:translate-x-0.5",
        )}
      >
        {by === -1 ? "←" : "→"}
      </span>
    </button>
  );

  return (
    <dialog
      ref={ref}
      aria-label={dict.projects.title}
      onClose={() => {
        setShown(false);
        swiperRef.current = null;
        onClose();
      }}
      className={classNames(
        "m-0 h-dvh max-h-none w-full max-w-none",
        "overflow-hidden bg-transparent p-0",
        "transition-opacity duration-300 starting:open:opacity-0",
        "backdrop:bg-black/40 backdrop:backdrop-blur-sm",
      )}
    >
      {/* 위쪽 막대: 번호 · 이전 · 다음 · 닫기 */}
      <div
        className={classNames(
          "pointer-events-none absolute inset-x-0 top-0 z-10",
          "flex items-center justify-between gap-3",
          "px-5 pt-5 md:px-10 md:pt-6",
        )}
      >
        <div
          className={classNames("pointer-events-auto flex items-center gap-3")}
        >
          {navButton(-1)}
          <p
            aria-live="polite"
            className={classNames(
              "min-w-16 text-center",
              "font-neuehaas text-sm font-medium text-white tabular-nums",
            )}
          >
            {twoDigits((index ?? 0) + 1)}
            <span className={classNames("text-white/50")}>
              {" "}
              / {twoDigits(projects.length)}
            </span>
          </p>
          {navButton(1)}
        </div>
        <button
          type="button"
          aria-label={dict.project.close}
          onClick={close}
          className={classNames(
            "pointer-events-auto size-10",
            "flex items-center justify-center",
            "rounded-full bg-white/15 text-white backdrop-blur transition-colors duration-300 hover:bg-white hover:text-black",
          )}
        >
          <svg
            aria-hidden
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            strokeLinecap="round"
            className={classNames("size-4")}
          >
            <path d="M3.5 3.5l9 9M12.5 3.5l-9 9" />
          </svg>
        </button>
      </div>

      {shown && index !== null ? (
        <Swiper
          modules={[A11y, Keyboard, Mousewheel]}
          initialSlide={index}
          slidesPerView="auto"
          centeredSlides
          spaceBetween={24}
          speed={500}
          slideToClickedSlide
          keyboard={{ enabled: true }}
          // 트랙패드 가로 스크롤로 넘기기 (세로 휠은 카드 안 스크롤에 양보)
          mousewheel={{ forceToAxis: true }}
          onSwiper={(swiper) => {
            swiperRef.current = swiper;
          }}
          onSlideChange={(swiper) => onIndex(swiper.activeIndex)}
          onClick={(_, event) => {
            // 카드 바깥 빈 곳을 누르면 닫기
            const target = event.target as HTMLElement | null;
            if (!target?.closest("[data-project-card]")) close();
          }}
          className={classNames("h-full")}
        >
          {projects.map((project, i) => {
            const active = i === index;
            return (
              <SwiperSlide
                key={project.id}
                className={classNames(
                  "flex! h-full! w-[min(64rem,86vw)]! items-center justify-center",
                  "pt-20 pb-6 md:pt-24 md:pb-10",
                  // 카드 크기를 이 칸의 너비 · 높이(cqw · cqh)로 정하려고
                  "[container-type:size]",
                )}
              >
                {/*
                  모든 카드가 같은 가로세로비 (내용이 짧으면 아래가 여백, 길면 카드 안에서 스크롤)
                  좁은 화면: 칸을 꽉 채우는 세로 카드 / 중간 화면부터: 4:3 — 칸 안에 들어가는 가장 큰 크기
                */}
                <div
                  data-project-card
                  className={classNames(
                    "w-full",
                    "aspect-[3/5] md:aspect-[5/3] h-auto md:w-[min(100cqw,calc(100cqh*4/3))]",
                    "overflow-y-auto overscroll-contain",
                    "rounded-3xl bg-background text-main shadow-2xl",
                    // 지금 카드: 크게 · 선명하게 / 이전 · 다음: 작게 · 흐리게 (누르면 그쪽으로)
                    "transition-[scale,opacity] duration-500 ease-[cubic-bezier(.22,1,.36,1)]",
                    active
                      ? "scale-100 opacity-100"
                      : "scale-90 cursor-pointer opacity-40",
                  )}
                >
                  {/* 옆 카드 안의 링크 · 버튼은 누를 수 없게 (카드를 누르면 그쪽으로 넘어감) */}
                  <div inert={!active}>
                    <ProjectDetail
                      titleId={active ? "project-dialog-title" : undefined}
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
                  </div>
                </div>
              </SwiperSlide>
            );
          })}
        </Swiper>
      ) : null}
    </dialog>
  );
}
