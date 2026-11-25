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
 * 호버: 테두리에 있던 그라데이션이 안쪽 전체를 왼쪽에서 오른쪽으로 채우며 글이 흰색으로 바뀜.
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
    "text-lg leading-normal font-medium text-black",
    "transition-[color,scale] duration-500 group-hover:text-white active:scale-[0.97]",
    className,
  );
  const inner = (
    <>
      {/* 호버: 테두리와 같은 그라데이션이 왼쪽에서 채워짐 (움직임 줄이기 설정이면 바로 바뀜) */}
      <span
        aria-hidden
        className={classNames(
          "absolute inset-0 -z-10",
          "origin-left scale-x-0 group-hover:scale-x-100",
          "bg-[linear-gradient(to_right,#9e70ff_0%,#4fa7ff_35%,#9f72fd_68%,#f0a6ff_100%)]",
          "transition-transform duration-500 ease-[cubic-bezier(.22,1,.36,1)] motion-reduce:transition-none",
        )}
      />
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
      <a
        {...(rest as ComponentProps<"a">)}
        className={classes}
      >
        {inner}
      </a>
    );
  }
  return (
    <button type="button" {...(rest as ComponentProps<"button">)} className={classes}>
      {inner}
    </button>
  );
}
