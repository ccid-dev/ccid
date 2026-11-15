import classNames from "classnames";
import type { Metadata } from "next";
import Link from "next/link";
import { buttonClassName } from "@repo/common";
import { ROUTES } from "@/constants";

export const metadata: Metadata = {
  title: "페이지를 찾을 수 없습니다",
};

export default function NotFound() {
  return (
    <div
      className={classNames(
        "min-h-[80vh]",
        "flex items-center justify-center",
        "px-4 py-12",
      )}
    >
      <div
        className={classNames(
          "w-full max-w-sm",
          "flex flex-col items-start",
          "p-7 sm:p-9",
          "rounded-3xl bg-white",
        )}
      >
        <p
          className={classNames(
            "font-neuehaas text-7xl leading-none font-medium tracking-[-0.05em]",
          )}
        >
          404
        </p>
        <h1 className={classNames("mt-6", "text-lg font-semibold")}>
          페이지를 찾을 수 없습니다
        </h1>
        <p className={classNames("mt-1", "text-sm text-sub")}>
          삭제되었거나 잘못된 주소입니다.
        </p>
        <Link
          href={ROUTES.home}
          className={classNames(buttonClassName({ block: true }), "mt-8")}
        >
          홈으로
        </Link>
      </div>
    </div>
  );
}
