"use client";

import { useEffect, useRef, useState } from "react";
import classNames from "classnames";

/** "rgb(25, 29, 98)" → "#191d62" */
function toHex(color: string) {
  const [r, g, b] = color.match(/\d+(\.\d+)?/g)?.map(Number) ?? [];
  if (r === undefined || g === undefined || b === undefined) return color;
  return `#${[r, g, b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("")}`;
}

/**
 * 색 견본. 값(hex)은 global.css 에 실제로 들어간 색을 화면에서 읽어 옵니다.
 * swatch 는 Tailwind 가 찾을 수 있도록 "bg-indigo" 처럼 그대로 적어 넘깁니다.
 * 글자 전용 색(text-main 등)은 kind="text" 로 넘기면 글자 견본으로 보여 줍니다.
 */
export function ColorSwatch({
  name,
  swatch,
  alias,
  kind = "color",
}: {
  /** 색 이름 (CSS 변수: --color-<name>, 글자 전용이면 --text-color-<name>) */
  name: string;
  /** 견본 className (예: "bg-indigo", 글자 전용이면 "text-main") */
  swatch: string;
  /** 다른 색을 가리키면 그 이름 */
  alias?: string;
  kind?: "color" | "text";
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [hex, setHex] = useState("");

  useEffect(() => {
    if (!ref.current) return;
    const style = getComputedStyle(ref.current);
    setHex(toHex(kind === "text" ? style.color : style.backgroundColor));
  }, [kind]);

  return (
    <li className={classNames("flex flex-col gap-2")}>
      {kind === "text" ? (
        <div
          ref={ref}
          className={classNames(
            "h-20 w-full",
            "flex items-center",
            "px-4",
            "rounded-xl border",
            ["font-neuehaas text-4xl font-medium", swatch],
          )}
        >
          Aa 가
        </div>
      ) : (
        <div
          ref={ref}
          className={classNames("h-20 w-full", "rounded-xl border", swatch)}
        />
      )}
      <div className={classNames("flex flex-col gap-0.5")}>
        <span className={classNames("font-neuehaas text-sm font-medium")}>
          {name}
        </span>
        <code className={classNames("font-neuehaas text-[11px] text-sub")}>
          {hex || "…"}
          {alias ? ` = ${alias}` : ""}
        </code>
        <code className={classNames("font-neuehaas text-[11px] text-mute")}>
          {kind === "text" ? `--text-color-${name}` : `--color-${name}`}
        </code>
      </div>
    </li>
  );
}
