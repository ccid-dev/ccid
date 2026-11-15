import classNames from "classnames";
import { Spinner } from "@repo/common";
import { getDictionary } from "@/i18n/server";

export default async function Loading() {
  const dict = await getDictionary();
  return (
    <div
      className={classNames("min-h-[50vh]", "flex items-center justify-center")}
    >
      <Spinner size="lg" label={dict.common.loading} />
    </div>
  );
}
