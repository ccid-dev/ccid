import classNames from "classnames";
import type { Metadata } from "next";
import { PersonCard } from "@repo/blocks";
import {
  JoinSection,
  PageHeader,
  RevealItem,
  Section,
} from "@/components/content";
import { ROUTES } from "@/constants";
import { hasLocale, localized } from "@/i18n";
import { getDictionary } from "@/i18n/server";
import { getPeopleGroups, getRecruit } from "@/libs/content";
import { mediaUrl } from "@/libs/media";
import { pageMetadata } from "@/libs/seo";

export const revalidate = 60;

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/people">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const dict = await getDictionary(lang);
  return pageMetadata(lang, dict, {
    path: ROUTES.people,
    title: dict.people.title,
  });
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

      {/* 같은 형식의 구역이 이어지므로 구역 사이 여백을 줄여 가깝게 (tight) */}
      {groups.map((group) => (
        <Section
          key={group.category}
          id={group.category}
          title={dict.people.categories[group.category]}
          tight
        >
          {/*
            좁은 화면은 한 줄에 한 사람: 디렉터는 사진 위 · 글 아래로 화면 폭 전체, 나머지는 작은 사진 옆에 글
            디렉터는 넓은 화면에서도 한 줄 전체를 씀 (사진 · 글 2단)
            넓은 화면 한 줄 인원: 자문(Advisory Board · Former Advisors) 6명 · 학생(연구원 · 인턴 · 졸업생) 8명
          */}
          <ul
            className={classNames(
              "grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-3 sm:gap-y-10",
              group.category === "advisory_board" ||
                group.category === "former_advisor"
                ? "md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
                : group.category === "director"
                  ? "md:grid-cols-4"
                  : "md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8",
            )}
          >
            {/* 카드마다 제각각 스르륵 (RevealItem) */}
            {group.people.map((person, index) => (
              <RevealItem
                key={person.id}
                index={index}
                className={classNames({
                  "col-span-full": group.category === "director",
                })}
              >
                <PersonCard
                  wide={group.category === "director"}
                  profileLabel={dict.people.profile}
                  closeLabel={dict.project.close}
                  person={{
                    name: localized(person, "name", lang),
                    role: localized(person, "role", lang),
                    bio: localized(person, "bio", lang),
                    profile: localized(person, "profile", lang),
                    image: mediaUrl(person.image),
                    imageFallback: person.image || "no image",
                    // 디렉터 넓은 화면 사진 (public/img/people)
                    wideImage:
                      group.category === "director"
                        ? "/img/people/director-wide.png"
                        : null,
                    // 디렉터 이름 옆 LinkedIn 아이콘
                    linkedin:
                      group.category === "director"
                        ? "https://www.linkedin.com/in/qshim/"
                        : null,
                  }}
                />
              </RevealItem>
            ))}
          </ul>
        </Section>
      ))}
      <JoinSection recruit={recruit} dict={dict} locale={lang} />
    </>
  );
}
