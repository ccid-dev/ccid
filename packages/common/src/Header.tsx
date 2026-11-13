import type { ReactNode } from "react";
import { Container, type ContainerSize } from "./Container";

/** 공용 헤더 — 로고/네비게이션은 앱에서 children 으로 넣습니다. */
export function Header({
  children,
  size,
  className = "",
}: {
  children: ReactNode;
  size?: ContainerSize;
  className?: string;
}) {
  return (
    <header className={`border-b px-5 sm:px-8 ${className}`}>
      <Container
        size={size}
        className="flex h-14 items-center justify-between gap-6"
      >
        {children}
      </Container>
    </header>
  );
}
