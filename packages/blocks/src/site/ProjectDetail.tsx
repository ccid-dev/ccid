import classNames from "classnames";
import { ThemeDot } from "@repo/common";
import { NdaBadge, Pills, PlainLink, twoDigits, type SiteLink } from "./shared";

/** 프로젝트 모달 내용에 들어가는 값 (이미 고른 언어) */
export type ProjectDetailData = {
  year: string;
  title: string;
  client: string;
  description: string;
  tags: string[];
  nda: boolean;
  research: { number: number; title: string; summary: string; href: string }[];
};

export type ProjectDetailLabels = {
  nda: string;
  ndaNote: string;
  research: string;
  more: string;
  close: string;
};

/**
 * 프로젝트 모달 안쪽: 왼쪽 자세한 정보 / 오른쪽 관련 리서치 요약 · 자세히 보기.
 * onClose 가 있으면 닫기 버튼을 그립니다. onNavigate 는 관련 리서치로 이동할 때 (모달 닫기용) 부릅니다.
 */
export function ProjectDetail({
  project,
  labels,
  titleId,
  onClose,
  onNavigate,
  Link = PlainLink,
}: {
  project: ProjectDetailData;
  labels: ProjectDetailLabels;
  titleId?: string;
  onClose?: () => void;
  /** 관련 리서치 링크를 눌러 다른 페이지로 갈 때 */
  onNavigate?: () => void;
  Link?: SiteLink;
}) {
  const closeButton = (className: string) =>
    onClose ? (
      <button
        type="button"
        onClick={onClose}
        className={classNames(
          "h-9",
          className,
          "px-4",
          "rounded-full bg-sheet/60 transition hover:bg-sheet",
          "font-neuehaas text-sm font-medium",
        )}
      >
        {labels.close}
      </button>
    ) : null;

  return (
    <div
      className={classNames(
        "grid gap-10 md:grid-cols-2 md:gap-12",
        "p-6 pb-[calc(env(safe-area-inset-bottom)+1.5rem)] md:p-10",
      )}
    >
      <div className={classNames("flex flex-col gap-6")}>
        <div className={classNames("flex items-center justify-between")}>
          <span
            className={classNames("font-neuehaas text-sm font-medium text-sub")}
          >
            {project.year}
          </span>
          {closeButton("md:hidden")}
        </div>
        <div className={classNames("flex flex-col gap-2")}>
          <h2
            id={titleId}
            className={classNames(
              "text-xl leading-snug font-medium tracking-[-0.02em] break-keep md:text-2xl",
            )}
          >
            {project.title}
            {project.nda ? <NdaBadge label={labels.nda} /> : null}
          </h2>
          {project.client ? (
            <p className={classNames("text-sub")}>{project.client}</p>
          ) : null}
        </div>
        {project.nda ? (
          <p className={classNames("text-sm text-sub")}>{labels.ndaNote}</p>
        ) : (
          <>
            {project.description ? (
              <p
                className={classNames(
                  "leading-7 whitespace-pre-line break-keep",
                )}
              >
                {project.description}
              </p>
            ) : null}
            {project.tags.length ? (
              <Pills items={project.tags} prefix="#" />
            ) : null}
          </>
        )}
      </div>

      <div className={classNames("flex flex-col gap-4")}>
        <div className={classNames("flex items-center justify-between")}>
          <p
            className={classNames("font-neuehaas text-sm font-medium text-sub")}
          >
            {labels.research}
          </p>
          {closeButton("max-md:hidden")}
        </div>
        <ul className={classNames("flex flex-col gap-2")}>
          {project.research.map((theme) => (
            <li key={theme.href}>
              <Link
                href={theme.href}
                onClick={onNavigate}
                cursorLabel="Open"
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
                  {theme.title}
                </span>
                {theme.summary ? (
                  <span
                    className={classNames(
                      "line-clamp-4 text-sm leading-6 text-sub",
                    )}
                  >
                    {theme.summary}
                  </span>
                ) : null}
                <span
                  className={classNames("font-neuehaas text-sm font-medium")}
                >
                  {labels.more} →
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
