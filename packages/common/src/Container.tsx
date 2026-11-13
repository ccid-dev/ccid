import type { ComponentProps } from "react";

const sizes = {
  default: "max-w-5xl",
  wide: "max-w-[1600px]",
} as const;

export type ContainerSize = keyof typeof sizes;

export function Container({
  size = "default",
  className = "",
  ...props
}: ComponentProps<"div"> & { size?: ContainerSize }) {
  return (
    <div className={`mx-auto w-full ${sizes[size]} ${className}`} {...props} />
  );
}
