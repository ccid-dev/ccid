import classNames from "classnames";
import { Spinner } from "@repo/common";
import { getDictionary } from "@/i18n/server";

/**
 * 페이지를 불러오는 동안 보이는 화면. 화면 전체 높이를 잡아서, 로딩 중에 푸터가 올라와 보였다가
 * 내용이 들어오면서 밀려 내려가는 흔들림이 없게 합니다.
 */
export default async function Loading() {
  const dict = await getDictionary();
  return (
    <div
      className={classNames("min-h-svh", "flex items-center justify-center")}
    >
      <Spinner size="lg" label={dict.common.loading} />
    </div>
  );
}
