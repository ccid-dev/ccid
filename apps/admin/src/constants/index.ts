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
  recruit: "/recruit",
  notices: "/notices",
  system: "/system",
  inquiries: "/inquiries",
} as const;

/** 사이드바 첫 메뉴 (연구실 공간) */
export const WORKSPACE_NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: ROUTES.home },
  { label: "Notices", href: ROUTES.notices },
];

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
  // { label: "Design System", href: ROUTES.designSystem },
];

/** 메인테이너에게만 보이는 메뉴 */
export const MASTER_NAV_ITEMS: NavItem[] = [
  { label: "Inquiries", href: ROUTES.inquiries },
  { label: "Lab Members", href: ROUTES.members },
  { label: "Recruit", href: ROUTES.recruit },
  { label: "System Check", href: ROUTES.system },
  { label: "Design System", href: ROUTES.designSystem },
];

/** 모두에게 보이는 마지막 메뉴 */
export const ACCOUNT_NAV_ITEMS: NavItem[] = [
  { label: "Settings", href: ROUTES.settings },
];

/** 비밀번호 최소 길이 (가입 · 재설정 공통) */
export const MIN_PASSWORD_LENGTH = 8;

/**
 * Supabase 무료 플랜 한도 (System Check 의 사용량 막대 기준).
 * 플랜 정책은 바뀔 수 있으니 Supabase 가격 페이지와 맞춰 고쳐 주세요.
 */
export const SUPABASE_FREE_LIMITS = {
  databaseBytes: 500 * 1024 * 1024,
  storageBytes: 1024 * 1024 * 1024,
  monthlyActiveUsers: 50_000,
} as const;
