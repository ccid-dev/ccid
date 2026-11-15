import classNames from "classnames";
import type { ComponentProps } from "react";

/** default: 읽기 폭 · wide: 넓은 화면 · full: 화면 너비 전부 (바깥 여백만) */
const sizes = {
  default: "max-w-5xl",
  wide: "max-w-[1600px]",
  full: "max-w-none",
} as const;

export type ContainerSize = keyof typeof sizes;

export function Container({
  size = "default",
  className,
  ...props
}: ComponentProps<"div"> & { size?: ContainerSize }) {
  return (
    <div
      className={classNames(["w-full", sizes[size]], "mx-auto", className)}
      {...props}
    />
  );
}
