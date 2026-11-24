import classNames from "classnames";
import { NdaBadge } from "./shared";

/** 프로젝트 목록의 한 줄 카드에 들어가는 값 (이미 고른 언어) */
export type ProjectCardData = {
  year: string;
  title: string;
  client: string;
  description: string;
  nda: boolean;
  /** 속한 리서치 분야 번호 (주 분야 먼저). 호버 그라데이션 · 번호 칩에 씁니다. 없으면 비움 */
  themes?: number[];
};

/** 분야 번호 → 색 (global.css 의 --color-theme-NN 과 같은 값. 변수가 없어도 보이도록 값을 함께 적음) */
const THEME_COLOR: Record<number, string> = {
  1: "var(--color-theme-01, #6720ff)",
  2: "var(--color-theme-02, #ff4ff0)",
  3: "var(--color-theme-03, #ff7835)",
  4: "var(--color-theme-04, #39caff)",
};

/**
 * 호버 때 깔리는 분야 색 radial 그라데이션 (Figma 'button · 2025').
 * 소속 분야가 여러 개면 색마다 좌우로 나뉘어 자리하고, 서로 겹치는 곳에서 섞여 조합이 됩니다.
 * 분야 수가 달라져도 값이 바로 바뀌어야 해서 inline style 로 만듭니다.
 */
export function themeGlow(themes: number[]) {
  const colors = themes.flatMap((n) =>
    THEME_COLOR[n] ? [THEME_COLOR[n]] : [],
  );
  if (!colors.length) return undefined;
  return colors
    .flatMap((color, i) => {
      const x = Math.round((100 * (i + 1)) / (colors.length + 1));
      return [
        // 오른쪽 위 가장자리 쪽 진한 번짐
        `radial-gradient(ellipse 55% 130% at ${Math.min(x + 15, 95)}% 5%, color-mix(in srgb, ${color} 42%, transparent), transparent 70%)`,
        // 왼쪽 아래 번짐
        `radial-gradient(ellipse 45% 90% at ${Math.max(x - 25, 5)}% 105%, color-mix(in srgb, ${color} 30%, transparent), transparent 70%)`,
        // 가운데 은은한 번짐
        `radial-gradient(ellipse 60% 100% at ${x}% 50%, color-mix(in srgb, ${color} 14%, transparent), transparent 75%)`,
      ];
    })
    .join(", ");
}

/**
 * 프로젝트 카드. onClick 이 있으면 누를 수 있는 버튼, 없으면 그냥 상자입니다.
 * - 한 줄 카드(기본, 리서치 상세의 Projects): 바탕 없이 글만. 왼쪽 연도 → 제목(+ 같은 줄 회사명) → 설명 / 오른쪽 위 분야 번호 칩 · ⋯
 * - tile: 2단 격자의 흰 카드 (Projects 페이지) — 위에 제목 · 설명, 아래 왼쪽 회사명 · 오른쪽 분야 번호 칩 · ⋯
 * NDA 프로젝트는 흐리게 보입니다.
 * 모션: 마우스를 올리면 속한 분야 색의 radial 그라데이션이 서서히 번지고, ⋯ 버튼이 검정으로 바뀌며 살짝 커집니다.
 */
export function ProjectCard({
  project,
  ndaLabel,
  showYear = true,
  tile = false,
  onClick,
}: {
  project: ProjectCardData;
  ndaLabel: string;
  /** 연도 표시 (연도별로 묶은 화면에서는 끔) */
  showYear?: boolean;
  /** 2단 격자용 흰 카드 */
  tile?: boolean;
  onClick?: () => void;
}) {
  const Root = onClick ? "button" : "div";
  const themes = project.themes ?? [];
  const glow = themeGlow(themes);
  const showDescription = !project.nda && project.description;

  /** 분야 번호 칩 + ⋯ (더보기 모달로 자세히) */
  const chips = (
    <span className={classNames("flex items-center gap-2.5")}>
      {themes.map((n) => (
        <span
          key={n}
          className={classNames(
            "h-7 shrink-0 px-2.5",
            "inline-flex items-center gap-1.5",
            "rounded-full bg-[#FFFFFF]",
            "font-neuehaas text-xs font-medium",
          )}
        >
          {String(n).padStart(2, "0")}
        </span>
      ))}
      <span
        aria-hidden
        className={classNames(
          "size-7 shrink-0",
          "flex items-center justify-center gap-[3px]",
          "rounded-full bg-white transition duration-300 group-hover:scale-110 group-hover:bg-black group-hover:text-white",
        )}
      >
        <span className={classNames("size-[3px]", "rounded-full bg-current")} />
        <span className={classNames("size-[3px]", "rounded-full bg-current")} />
        <span className={classNames("size-[3px]", "rounded-full bg-current")} />
      </span>
    </span>
  );

  return (
    <Root
      {...(onClick
        ? {
            type: "button" as const,
            "aria-haspopup": "dialog" as const,
            "cursor-label": "View",
            onClick,
          }
        : {})}
      className={classNames(
        "group w-full text-left",
        // isolate: 호버 그라데이션(-z-10)이 카드 바탕 위 · 글 아래에 깔리게
        // 사이트 바탕(--color-background)이 #fbfbfb 라서 카드는 순백(#fff)으로 따로 둠 (bg-white 도 #fbfbfb 로 덮여 있음)
        "relative isolate rounded-2xl bg-[#fff]",
        tile
          ? "flex flex-col justify-between gap-8 md:min-h-60"
          : "flex flex-col gap-4 md:min-h-45",
        tile ? "px-8 py-7 md:px-9 md:py-8" : "px-6 py-6 md:px-8 md:py-7",
        project.nda && "opacity-50",
        onClick && "cursor-pointer",
      )}
    >
      {glow ? (
        <span
          aria-hidden
          style={{ backgroundImage: glow }}
          className={classNames(
            "pointer-events-none absolute inset-0 -z-10 rounded-[inherit]",
            "opacity-0 transition-opacity duration-500 group-hover:opacity-100",
            // Figma 의 안쪽 흰 그림자: 가장자리를 유리처럼 부드럽게
            "shadow-[inset_-22px_-15px_16px_rgb(255_255_255/0.25),inset_42px_40px_3px_rgb(255_255_255/0.25),inset_0_-59px_100px_rgb(255_255_255/0.25)]",
          )}
        />
      ) : null}

      {tile ? (
        <>
          <span className={classNames("flex min-w-0 flex-col gap-1.5")}>
            <span
              className={classNames(
                "text-xl leading-normal font-medium break-keep",
              )}
            >
              {project.title}
              {project.nda ? <NdaBadge label={ndaLabel} /> : null}
            </span>
            {showDescription ? (
              <span
                className={classNames(
                  "line-clamp-3 text-sm leading-normal text-sub",
                )}
              >
                {project.description}
              </span>
            ) : null}
          </span>
          <span
            className={classNames("flex items-center justify-between gap-4")}
          >
            <span className={classNames("text-sm font-medium text-sub")}>
              {project.client}
            </span>
            {chips}
          </span>
        </>
      ) : (
        <>
          <span
            className={classNames("flex items-start justify-between gap-6")}
          >
            <span className={classNames("flex min-w-0 flex-col gap-1")}>
              {showYear ? (
                <span
                  className={classNames(
                    "font-neuehaas text-[15px] leading-4 font-medium text-sub",
                  )}
                >
                  {project.year}
                </span>
              ) : null}
              <span
                className={classNames(
                  "flex flex-wrap items-baseline gap-x-6 gap-y-0.5",
                )}
              >
                <span
                  className={classNames(
                    "text-lg leading-normal font-medium break-keep",
                  )}
                >
                  {project.title}
                  {project.nda ? <NdaBadge label={ndaLabel} /> : null}
                </span>
                {project.client ? (
                  <span className={classNames("text-sm font-medium text-sub")}>
                    {project.client}
                  </span>
                ) : null}
              </span>
            </span>
            {chips}
          </span>
          {showDescription ? (
            <span
              className={classNames(
                "mt-3 max-w-3xl",
                "line-clamp-3 text-sm leading-6 text-sub",
              )}
            >
              {project.description}
            </span>
          ) : null}
        </>
      )}
    </Root>
  );
}
