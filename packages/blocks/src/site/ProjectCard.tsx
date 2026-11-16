import classNames from "classnames";
import { NdaBadge, ThemeChip } from "./shared";

/** 프로젝트 목록의 한 줄 카드에 들어가는 값 (이미 고른 언어) */
export type ProjectCardData = {
  year: string;
  title: string;
  client: string;
  description: string;
  nda: boolean;
  themeNumbers: number[];
};

/**
 * 프로젝트 목록의 한 줄 카드. onClick 이 있으면 누를 수 있는 버튼, 없으면 그냥 상자입니다.
 */
export function ProjectCard({
  project,
  ndaLabel,
  showYear = true,
  onClick,
}: {
  project: ProjectCardData;
  ndaLabel: string;
  /** 연도 표시 (연도별로 묶은 화면에서는 끔) */
  showYear?: boolean;
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
        "w-full",
        "group grid gap-x-10 gap-y-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-center",
        "px-5 py-4 md:px-6",
        [
          "rounded-2xl bg-sheet/60 transition",
          { "cursor-pointer hover:bg-sheet": onClick },
        ],
        "text-left",
      )}
    >
      <span className={classNames("min-w-0", "flex flex-col gap-1")}>
        {showYear ? (
          <span
            className={classNames("font-neuehaas text-xs font-medium text-sub")}
          >
            {project.year}
          </span>
        ) : null}
        <span
          className={classNames(
            "text-lg leading-snug font-medium tracking-[-0.01em] break-keep",
          )}
        >
          {project.title}
          {project.nda ? <NdaBadge label={ndaLabel} /> : null}
        </span>
        {project.client ? (
          <span className={classNames("text-sm text-sub")}>
            {project.client}
          </span>
        ) : null}
        {!project.nda && project.description ? (
          <span
            className={classNames(
              "max-w-3xl",
              "mt-1",
              "line-clamp-1 text-sm leading-6 text-sub",
            )}
          >
            {project.description}
          </span>
        ) : null}
      </span>
      <span className={classNames("flex items-center gap-1.5 md:justify-end")}>
        {project.themeNumbers.map((number) => (
          <ThemeChip key={number} number={number} />
        ))}
        {/* 더보기 (모달로 자세히) */}
        <span
          aria-hidden
          className={classNames(
            "size-8 shrink-0",
            "flex items-center justify-center gap-[3px]",
            "ml-auto md:ml-3",
            "rounded-full bg-white transition group-hover:bg-black group-hover:text-white",
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
