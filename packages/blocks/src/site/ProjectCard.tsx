import classNames from "classnames";
import { NdaBadge } from "./shared";

/** 프로젝트 목록의 한 줄 카드에 들어가는 값 (이미 고른 언어) */
export type ProjectCardData = {
  year: string;
  title: string;
  client: string;
  description: string;
  nda: boolean;
};

/**
 * 프로젝트 카드. onClick 이 있으면 누를 수 있는 버튼, 없으면 그냥 상자입니다.
 * - 한 줄 카드(기본): 넓은 화면에서 글 영역을 2단으로 — 왼쪽 35% 연도 · 제목 · 회사명, 오른쪽 65% 설명(제목 높이부터 시작). (좁은 화면은 아래로 쌓음)
 * - tile: 2단 격자에 넣는 9:4 카드 (Projects 페이지) — 위에 제목 · 회사명 · 설명, 오른쪽 아래 더보기. 글이 길면 그만큼 길어집니다.
 * 회사명은 Medium, 설명은 보통 굵기로 구분합니다.
 * 모션: 마우스를 올리면 바탕이 진해지고 오른쪽 버튼이 검정으로 바뀌며 살짝 커집니다.
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
  /** 2단 격자용 9:4 카드 */
  tile?: boolean;
  onClick?: () => void;
}) {
  const Root = onClick ? "button" : "div";
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
        // tile 높이: 글(제목 · 회사명 · 설명 2~3줄)과 더보기 버튼이 들어가고 아래 여백이 많이 남지 않는 비율
        tile ? "w-full md:aspect-[9/4]" : "w-full",
        tile
          ? "group flex flex-col justify-between gap-8"
          : "group grid gap-x-10 gap-y-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-center",
        tile ? "p-6 md:p-8" : "px-6 py-6 md:px-8 md:py-7",
        [
          "rounded-2xl bg-sheet/60 transition-colors duration-300",
          { "cursor-pointer hover:bg-sheet": onClick },
        ],
        "text-left",
      )}
    >
      <span
        className={classNames(
          "min-w-0",
          tile
            ? "flex flex-col gap-3"
            : "grid gap-x-10 gap-y-3 md:grid-cols-[minmax(0,35fr)_minmax(0,65fr)] md:items-start",
        )}
      >
        <span className={classNames("min-w-0", "flex flex-col gap-1")}>
          {showYear ? (
            <span
              className={classNames(
                "font-neuehaas text-xs font-medium text-sub",
              )}
            >
              {project.year}
            </span>
          ) : null}
          <span
            className={classNames(
              "text-lg leading-snug font-medium break-keep",
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
        {!project.nda && project.description ? (
          <span
            className={classNames(
              // 한 줄 카드 넓은 화면: 설명 시작을 연도가 아니라 제목 첫 줄에 맞춤 (연도 한 줄 16px + 간격 4px)
              { "md:pt-5": !tile && showYear },
              "line-clamp-3 text-sm leading-6 text-sub",
            )}
          >
            {project.description}
          </span>
        ) : null}
      </span>
      <span className={classNames("flex")}>
        {/* 더보기 (모달로 자세히) */}
        <span
          aria-hidden
          className={classNames(
            "size-8 shrink-0",
            "flex items-center justify-center gap-[3px]",
            "ml-auto",
            "rounded-full bg-white transition duration-300 group-hover:scale-110 group-hover:bg-black group-hover:text-white",
          )}
        >
          <span
            className={classNames("size-[3px]", "rounded-full bg-current")}
          />
          <span
            className={classNames("size-[3px]", "rounded-full bg-current")}
          />
          <span
            className={classNames("size-[3px]", "rounded-full bg-current")}
          />
        </span>
      </span>
    </Root>
  );
}
