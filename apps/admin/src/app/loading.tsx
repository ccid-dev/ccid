import classNames from "classnames";
import { Spinner } from "@repo/common";

export default function Loading() {
  return (
    <div
      className={classNames("min-h-[50vh]", "flex items-center justify-center")}
    >
      <Spinner size="lg" />
    </div>
  );
}
