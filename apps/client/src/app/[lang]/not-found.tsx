import classNames from "classnames";
import type { Metadata } from "next";
import Link from "next/link";
import { buttonClassName, Container } from "@repo/common";
import { ROUTES } from "@/constants";
import { localePath } from "@/i18n";
import { getDictionary, getLocale } from "@/i18n/server";

export const metadata: Metadata = {
  title: "404",
  robots: { index: false, follow: true },
};

export default async function NotFound() {
  const locale = await getLocale();
  const dict = await getDictionary(locale);

  return (
    <div className={classNames("px-5 py-24 sm:px-8")}>
      <Container className={classNames("text-center")}>
        <p
          className={classNames(
            "font-neuehaas text-xs font-medium tracking-[0.16em] text-sub uppercase",
          )}
        >
          404
        </p>
        <h1
          className={classNames(
            "mt-3",
            "text-3xl font-semibold tracking-[-0.03em]",
          )}
        >
          {dict.notFound.title}
        </h1>
        <p className={classNames("mt-4", "text-sub")}>
          {dict.notFound.description}
        </p>
        <Link
          href={localePath(locale, ROUTES.home)}
          className={classNames(buttonClassName(), "mt-8")}
        >
          {dict.notFound.home}
        </Link>
      </Container>
    </div>
  );
}
