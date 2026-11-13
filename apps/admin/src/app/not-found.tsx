import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@repo/common";
import { ROUTES } from "@/constants";

export const metadata: Metadata = {
  title: "페이지를 찾을 수 없습니다",
};

export default function NotFound() {
  return (
    <div className="px-5 py-24 sm:px-8">
      <Container className="text-center">
        <p className="text-xs font-semibold tracking-[0.16em] text-muted uppercase">
          404
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.03em]">
          페이지를 찾을 수 없습니다
        </h1>
        <p className="mt-4 text-muted">삭제되었거나 잘못된 주소입니다.</p>
        <Link
          href={ROUTES.home}
          className="mt-8 inline-block rounded-xl bg-ink px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-80"
        >
          홈으로
        </Link>
      </Container>
    </div>
  );
}
