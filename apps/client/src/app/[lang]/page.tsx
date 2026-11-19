import classNames from "classnames";
import type { Metadata } from "next";
import { Suspense } from "react";
import { JoinSection, PartnerMarquee, Section } from "@/components/content";
import {
  HeroBackground,
  HomeAbout,
  HomeHero,
  HomeProjects,
  HomeResearch,
  ScrollHint,
  SectionIndicator,
} from "@/components/home";
import { PARTNERS, ROUTES } from "@/constants";
import { type Dictionary, hasLocale, type Locale, localePath } from "@/i18n";
import { getDictionary } from "@/i18n/server";
import { getProjects, getRecruit, getThemes } from "@/libs/content";
import { localeAlternates } from "@/libs/seo";

/** admin 에서 바꾼 내용이 최대 60초 뒤 반영됩니다. */
export const revalidate = 60;

/** 홈에 보이는 최근 프로젝트 수 (전체는 /projects) */
const HOME_PROJECT_COUNT = 6;

export async function generateMetadata({
  params,
}: PageProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  return hasLocale(lang) ? { alternates: localeAlternates(lang) } : {};
}

export default async function Home({ params }: PageProps<"/[lang]">) {
  const { lang } = await params;
  if (!hasLocale(lang)) return null;
  // 첫 화면 · About 은 데이터가 필요 없어 바로 그리고, 데이터가 필요한 아래 구역만 뒤따라 받습니다.
  // (전부 기다리면 그동안 로딩 화면 아래로 푸터가 보였다가 밀려 내려가는 흔들림이 생김)
  const dict = await getDictionary(lang);

  return (
    <>
      {/* 첫 화면 · 배경 값은 components/home/hero-background.json (/hero-tune 에서 조절) */}
      <HomeHero
        description={dict.meta.description}
        background={<HeroBackground />}
      />

      {/* 첫 화면만 보일 때 브라우저 아래에 뜨는 스크롤 안내 */}
      <ScrollHint targetId="about" label={dict.home.scrollHint} />

      {/* 넓은 화면 오른쪽: 지금 보고 있는 섹션 · 누르면 그 섹션으로 이동 */}
      <SectionIndicator
        label={dict.home.sections}
        items={[
          { id: "about", label: dict.about.title },
          { id: "research", label: dict.home.research },
          { id: "projects", label: dict.home.projects },
          { id: "partners", label: dict.home.partners },
          { id: "join", label: dict.join.eyebrow },
        ]}
      />

      <Section id="about" title={dict.about.title}>
        <HomeAbout dict={dict} />
      </Section>

      {/* 데이터가 오기 전에는 화면 높이만큼 자리를 잡아 둬서 아래 푸터가 끌어올려지지 않게 */}
      <Suspense fallback={<div className={classNames("min-h-svh")} />}>
        <HomeDataSections lang={lang} dict={dict} />
      </Suspense>
    </>
  );
}

/** 데이터가 필요한 구역: Research · Projects · Partners · Join (첫 화면 뒤로 이어서 도착) */
async function HomeDataSections({
  lang,
  dict,
}: {
  lang: Locale;
  dict: Dictionary;
}) {
  const [themes, projects, recruit] = await Promise.all([
    getThemes(),
    getProjects(),
    getRecruit(),
  ]);

  return (
    <>
      <Section id="research" title={dict.home.research}>
        {/* 전체 보기는 목록 바로 아래에 (스크롤 구역이 길어서 섹션 끝에 두면 떨어져 보임) */}
        <HomeResearch
          themes={themes}
          locale={lang}
          dict={dict}
          viewAll={{
            href: localePath(lang, ROUTES.research),
            label: dict.home.viewAll,
          }}
        />
      </Section>

      <Section
        id="projects"
        title={dict.home.projects}
        // 위 두 구역은 항목마다 스크롤이 걸리는데 여기서 바로 흘러가 버려서, 한 번 멈췄다 내려가게
        hold
        action={{
          href: localePath(lang, ROUTES.projects),
          label: dict.home.viewAll,
        }}
      >
        <HomeProjects
          projects={projects.slice(0, HOME_PROJECT_COUNT)}
          locale={lang}
        />
      </Section>

      <PartnerMarquee title={dict.home.partners} partners={PARTNERS} />

      <JoinSection recruit={recruit} dict={dict} locale={lang} />
    </>
  );
}
