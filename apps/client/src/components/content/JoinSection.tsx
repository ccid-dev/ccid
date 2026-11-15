import classNames from "classnames";
import type { Dictionary } from "@/i18n";
import { GRID, PAGE_X } from "./Section";

/**
 * Join: 참여 · 채용 안내로 이어지는 마지막 구역. 링크는 admin 의 Site 에서 바꿉니다.
 * 링크가 비어 있으면 그리지 않습니다.
 */
export function JoinSection({ url, dict }: { url: string; dict: Dictionary }) {
  if (!url) return null;
  return (
    <section
      aria-labelledby="join-title"
      className={classNames(PAGE_X, "py-24 md:py-32")}
    >
      <div className={classNames(GRID)}>
        <p
          className={classNames(
            "lg:col-span-3 lg:pt-3",
            "font-neuehaas text-sm font-medium tracking-[0.08em] text-purple uppercase",
          )}
        >
          {dict.join.eyebrow}
        </p>
        <div className={classNames("flex flex-col gap-5 lg:col-span-9")}>
          <h2
            id="join-title"
            className={classNames(
              "font-neuehaas text-4xl leading-[1.05] font-medium tracking-[-0.03em] break-keep md:text-6xl",
            )}
          >
            {dict.join.title}
          </h2>
          <p className={classNames("text-lg leading-8 text-sub")}>
            {dict.join.description}
          </p>
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className={classNames(
              "h-12 self-start",
              "group inline-flex items-center gap-3",
              "mt-4 px-6",
              "rounded-full bg-black transition hover:opacity-85",
              "font-medium text-white",
            )}
          >
            {dict.join.cta}
            <span
              aria-hidden
              className={classNames(
                "transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5",
              )}
            >
              ↗
            </span>
          </a>
        </div>
      </div>
    </section>
  );
}
