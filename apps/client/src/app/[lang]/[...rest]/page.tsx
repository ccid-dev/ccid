import { notFound } from "next/navigation";

/** 없는 주소(/없는-주소, /en/없는-주소) → [lang]/not-found.tsx (현재 언어의 404 화면) */
export default function CatchAll() {
  notFound();
}
