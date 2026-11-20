import classNames from "classnames";
import { GradientLoader } from "@/components/content";
import { getDictionary } from "@/i18n/server";

/**
 * 페이지를 불러오는 동안 보이는 화면. 화면 전체 높이를 잡아서, 로딩 중에 푸터가 올라와 보였다가
 * 내용이 들어오면서 밀려 내려가는 흔들림이 없게 합니다.
 */
export default async function Loading() {
  const dict = await getDictionary();
  return (
    // data-page-loading: 페이지 전환 유리 베일(PageVeil)이 이 화면이 사라질 때까지 기다렸다가 걷힘
    <div
      data-page-loading
      className={classNames(
        "min-h-svh",
        "flex items-center justify-center",
        // 유리 베일이 덮고 있으면 베일 가운데 로더만 보이게 (둘로 보이지 않게)
        "in-data-[veil=on]:invisible",
      )}
    >
      <GradientLoader label={dict.common.loading} />
    </div>
  );
}
