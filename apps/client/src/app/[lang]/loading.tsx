import classNames from "classnames";
import { getDictionary } from "@/i18n/server";

/**
 * 페이지를 불러오는 동안의 화면. 보이는 것은 없고(스피너 없음 — 페이지 전환 유리 베일이 대신함),
 * 화면 전체 높이만 잡아서 로딩 중에 푸터가 올라와 보였다가 밀려 내려가는 흔들림이 없게 합니다.
 * 화면 읽기 프로그램에는 "불러오는 중"을 알려 줍니다.
 */
export default async function Loading() {
  const dict = await getDictionary();
  return (
    // data-page-loading: 페이지 전환 유리 베일(PageVeil)이 이 화면이 사라질 때까지 기다렸다가 걷힘
    <div data-page-loading role="status" className={classNames("min-h-svh")}>
      <span className={classNames("sr-only")}>{dict.common.loading}</span>
    </div>
  );
}
