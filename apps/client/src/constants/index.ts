import type { Dictionary } from "@/i18n";

/** 언어 없는 경로. 링크에는 localePath(locale, ROUTES.x) 로 언어를 붙입니다. */
export const ROUTES = {
  home: "/",
  research: "/research",
  projects: "/projects",
  people: "/people",
  lab: "/lab",
} as const;

type NavItem = {
  key: keyof Dictionary["nav"];
  href: string;
  isVisible?: boolean;
};

/**
 * 헤더 메뉴. 이름은 dictionaries 의 nav.
 * About 은 홈의 구역으로, Research · Projects · People 은 각 페이지로 이동합니다.
 */
export const NAV_ITEMS: NavItem[] = [
  { key: "about", href: "/#about" },
  { key: "research", href: ROUTES.research },
  { key: "projects", href: ROUTES.projects },
  { key: "people", href: ROUTES.people },
];

/** 구분선 뒤에 따로 두는 메뉴 (Lab 페이지는 준비 중) */
export const NAV_EXTRA_ITEM: NavItem = {
  key: "lab",
  href: ROUTES.lab,
  isVisible: false, // Lab 페이지는 준비 중이므로 메뉴에서 숨김
};

/** 푸터의 People 링크가 이동할 그룹 (People 페이지의 구역 id 와 같음) */
export const FOOTER_PEOPLE_GROUPS = [
  "director",
  "advisory_board",
  "researcher",
  "alumni",
] as const satisfies (keyof Dictionary["footer"]["peopleLinks"])[];

/** 홈 하단 로고 띠에 흐르는 협업 기관 */
export type Partner = {
  name: string;
  /** public/img/partners/ 의 로고 파일. 없으면 이름을 글자로 보여 줍니다. */
  logo?: string;
};

/**
 * 협업 기관 (프로젝트의 협력 기관에서 추림). 순서대로 흐릅니다.
 * 로고 파일을 넣으면 logo 를 적어 주세요. (public/img/partners/README.md)
 */
export const PARTNERS: Partner[] = [
  { name: "Samsung Electronics" },
  { name: "Hyundai Motor Group" },
  { name: "Kia" },
  { name: "LG Electronics" },
  { name: "ZER01NE" },
  { name: "CJ CGV" },
  { name: "NAVER Cloud" },
  { name: "Ministry of Trade, Industry and Energy" },
  { name: "Seoul Design Foundation" },
  { name: "Lotte" },
  { name: "Häagen-Dazs" },
];
