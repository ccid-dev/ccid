import classNames from "classnames";
import type { Metadata } from "next";
import {
  JoinSection,
  MediaBox,
  PageHeader,
  Section,
} from "@/components/content";
import { ROUTES } from "@/constants";
import { hasLocale, localized } from "@/i18n";
import { getDictionary } from "@/i18n/server";
import { getPeopleGroups, getSiteSettings } from "@/libs/content";
import { localeAlternates } from "@/libs/seo";

export const revalidate = 60;

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/people">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const dict = await getDictionary(lang);
  return {
    title: dict.people.title,
    alternates: localeAlternates(lang, ROUTES.people),
  };
}

export default async function PeoplePage({
  params,
}: PageProps<"/[lang]/people">) {
  const { lang } = await params;
  if (!hasLocale(lang)) return null;
  const [dict, groups, settings] = await Promise.all([
    getDictionary(lang),
    getPeopleGroups(),
    getSiteSettings(),
  ]);

  return (
    <>
      <PageHeader title={dict.people.title} />

      {groups.map((group) => (
        <Section
          key={group.category}
          id={group.category}
          title={dict.people.categories[group.category]}
        >
          <ul
            className={classNames(
              "grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6",
            )}
          >
            {group.people.map((person) => {
              const name = localized(person, "name", lang);
              const profile = localized(person, "profile", lang);
              return (
                <li
                  key={person.id}
                  className={classNames("flex flex-col gap-1.5")}
                >
                  <MediaBox src={person.image} alt={name} ratio="profile" />
                  <p className={classNames("mt-2", "font-semibold")}>{name}</p>
                  {localized(person, "role", lang) ? (
                    <p
                      className={classNames(
                        "text-sm leading-6 whitespace-pre-line",
                      )}
                    >
                      {localized(person, "role", lang)}
                    </p>
                  ) : null}
                  {localized(person, "bio", lang) ? (
                    <p
                      className={classNames(
                        "text-[13px] leading-5 whitespace-pre-line text-sub",
                      )}
                    >
                      {localized(person, "bio", lang)}
                    </p>
                  ) : null}
                  {profile ? (
                    <details className={classNames("text-sm")}>
                      <summary className={classNames("underline")}>
                        {dict.people.profile}
                      </summary>
                      <p
                        className={classNames(
                          "mt-2",
                          "leading-6 whitespace-pre-line",
                        )}
                      >
                        {profile}
                      </p>
                    </details>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </Section>
      ))}
      <JoinSection url={settings.joinUrl} dict={dict} />
    </>
  );
}
