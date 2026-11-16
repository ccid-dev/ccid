import classNames from "classnames";
import type { Metadata } from "next";
import { PersonCard } from "@repo/blocks";
import { JoinSection, PageHeader, Section } from "@/components/content";
import { ROUTES } from "@/constants";
import { hasLocale, localized } from "@/i18n";
import { getDictionary } from "@/i18n/server";
import { getPeopleGroups, getRecruit } from "@/libs/content";
import { mediaUrl } from "@/libs/media";
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
  const [dict, groups, recruit] = await Promise.all([
    getDictionary(lang),
    getPeopleGroups(),
    getRecruit(),
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
            {group.people.map((person) => (
              <li key={person.id}>
                <PersonCard
                  profileLabel={dict.people.profile}
                  person={{
                    name: localized(person, "name", lang),
                    role: localized(person, "role", lang),
                    bio: localized(person, "bio", lang),
                    profile: localized(person, "profile", lang),
                    image: mediaUrl(person.image),
                    imageFallback: person.image || "no image",
                  }}
                />
              </li>
            ))}
          </ul>
        </Section>
      ))}
      <JoinSection recruit={recruit} dict={dict} locale={lang} />
    </>
  );
}
