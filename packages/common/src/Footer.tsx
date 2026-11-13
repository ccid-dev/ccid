import type { ReactNode } from "react";
import { Container, type ContainerSize } from "./Container";

/** 공용 푸터 — 기본으로 저작권 문구를 표시하고, children 으로 내용을 추가할 수 있습니다. */
export function Footer({
  name,
  children,
  size,
}: {
  name: string;
  children?: ReactNode;
  size?: ContainerSize;
}) {
  return (
    <footer className="border-t px-5 py-8 sm:px-8">
      <Container size={size} className="flex flex-col gap-3">
        {children}
        <p className="text-xs text-muted">
          © {new Date().getFullYear()} {name}. All rights reserved.
        </p>
      </Container>
    </footer>
  );
}
