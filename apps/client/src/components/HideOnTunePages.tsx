"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/** 튜닝 페이지(/agent-tune · /hero-tune · /footer-tune, 영어 주소 포함) */
const TUNE_PAGE = /-tune\/?$/;

/** 튜닝 페이지에서는 안의 내용을 숨깁니다. (예: 떠 있는 에이전트 구가 조절 패널을 가리지 않게) */
export function HideOnTunePages({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return TUNE_PAGE.test(pathname) ? null : children;
}
