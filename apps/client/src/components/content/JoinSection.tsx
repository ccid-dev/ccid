import classNames from "classnames";
import type { Dictionary } from "@/i18n";
import { Section } from "./Section";

/**
 * Join: 참여 · 채용 안내로 이어지는 구역. 다른 홈 구역과 같은 틀(왼쪽 제목 · 오른쪽 내용)입니다.
 * 링크는 admin 의 Site 에서 바꾸고, 비어 있으면 그리지 않습니다.
 */
export function JoinSection({ url, dict }: { url: string; dict: Dictionary }) {
  if (!url) return null;
  return (
    <Section id="join" title={dict.join.eyebrow}>
      <div className={classNames("max-w-4xl", "flex flex-col gap-6")}>
        <p
          className={classNames(
            "text-xl leading-snug font-medium tracking-[-0.02em] break-keep md:text-2xl md:leading-[1.3]",
          )}
        >
          {dict.join.title}
        </p>
        <p className={classNames("leading-7 break-keep text-sub")}>
          {dict.join.description}
        </p>
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className={classNames(
            "h-10 self-start",
            "group inline-flex items-center gap-2",
            "mt-2 px-5",
            "rounded-full bg-black transition hover:opacity-85",
            "font-neuehaas text-sm font-medium text-white",
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
    </Section>
  );
}
