import classNames from "classnames";
import type { ComponentProps, ReactNode } from "react";

type Common = {
  children: ReactNode;
  /** 글 뒤의 ↗ 화살표 (기본 보임) */
  arrow?: boolean;
  className?: string;
};

/**
 * 메인 버튼 (Figma "참여 및 채용 안내 ↗").
 * 평소: Figma 와 같은 그라데이션 테두리(보라 → 파랑 → 보라 → 연분홍) + 흰 바탕 + 어두운 글.
 * 호버 · 누름: 테두리 선이 사라지고 바탕은 바로 검정, 글 · 화살표는 0.8초 동안 검정 → 흰색으로 바뀜.
 *
 * `href` 를 주면 링크(<a>), 안 주면 <button> 으로 그려집니다.
 * 테두리 두께는 border(1px) 하나로 정해집니다.
 */
export function MainButton(
  props: Common &
    (
      | (Omit<ComponentProps<"a">, keyof Common> & { href: string })
      | (Omit<ComponentProps<"button">, keyof Common> & { href?: undefined })
    ),
) {
  const { children, arrow = true, className, ...rest } = props;
  const classes = classNames(
    "group relative isolate inline-flex w-fit items-center gap-2 overflow-hidden",
    "px-5 py-2",
    // 테두리: 상자 하나에 1px border 를 두고, 안쪽(padding-box)은 흰색 · 테두리(border-box)에만 그라데이션
    //   (바깥 그라데이션 상자 + 안쪽 흰 상자를 겹치면 소수점 픽셀에서 두께가 들쭉날쭉해짐)
    "rounded-full border border-transparent [background:linear-gradient(#fff,#fff)_padding-box,linear-gradient(to_right,#9e70ff_0%,#4fa7ff_35%,#9f72fd_68%,#f0a6ff_100%)_border-box]",
    // 호버 · 누름: 바탕 전체(테두리 칸 포함)를 검정 한 색으로 덮어 그라데이션 선이 사라짐
    "hover:[background:var(--color-black)] active:[background:var(--color-black)]",
    "text-lg leading-normal font-medium text-black hover:text-white active:text-white",
    // 누름 크기는 0.5초 · 글 색은 0.8초 (바탕은 전환 없이 바로)
    "[transition:scale_0.5s,color_0.8s] active:scale-[0.97]",
    className,
  );
  const inner = (
    <>
      {children}
      {arrow ? (
        <span
          aria-hidden
          className={classNames(
            "transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5",
          )}
        >
          ↗
        </span>
      ) : null}
    </>
  );

  if (rest.href !== undefined) {
    return (
      <a {...(rest as ComponentProps<"a">)} className={classes}>
        {inner}
      </a>
    );
  }
  return (
    <button
      type="button"
      {...(rest as ComponentProps<"button">)}
      className={classes}
    >
      {inner}
    </button>
  );
}
