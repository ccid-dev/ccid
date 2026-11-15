export type NavItem = { label: string; href: string };

export const ROUTES = {
  home: "/",
  login: "/login",
  signup: "/signup",
  pending: "/pending",
  members: "/members",
  profile: "/profile",
  settings: "/settings",
  resetPassword: "/reset-password",
  authConfirm: "/auth/confirm",
  themes: "/themes",
  projects: "/projects",
  people: "/people",
  designSystem: "/design-system",
  site: "/site",
} as const;

/** 사이드바 메뉴 (관리할 콘텐츠). People 은 메인테이너, Profile 은 일반 멤버에게 보입니다. */
export const NAV_ITEMS: NavItem[] = [
  { label: "Research", href: ROUTES.themes },
  { label: "Projects", href: ROUTES.projects },
];
export const MASTER_CONTENT_ITEM: NavItem = {
  label: "People",
  href: ROUTES.people,
};
export const MEMBER_CONTENT_ITEM: NavItem = {
  label: "Profile",
  href: ROUTES.profile,
};

/** 콘텐츠 메뉴 뒤에 보이는 메뉴 */
export const TOOL_NAV_ITEMS: NavItem[] = [
  { label: "Design System", href: ROUTES.designSystem },
];

/** 메인테이너에게만 보이는 메뉴 */
export const MASTER_NAV_ITEMS: NavItem[] = [
  { label: "Lab Members", href: ROUTES.members },
  { label: "Site", href: ROUTES.site },
];

/** 모두에게 보이는 마지막 메뉴 */
export const ACCOUNT_NAV_ITEMS: NavItem[] = [
  { label: "Settings", href: ROUTES.settings },
];

/** 비밀번호 최소 길이 (가입 · 재설정 공통) */
export const MIN_PASSWORD_LENGTH = 8;
