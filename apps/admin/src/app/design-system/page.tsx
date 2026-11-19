import classNames from "classnames";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import {
  Button,
  buttonClassName,
  IMAGE_RATIOS,
  Spinner,
  type ButtonSize,
  type ButtonVariant,
} from "@repo/common";
import { AdminPage } from "@/components/ui";
import { ROUTES } from "@/constants";
import { requireAdmin } from "@/libs/auth";
import { ColorSwatch } from "./ColorSwatch";
import { FeedbackDemo } from "./FeedbackDemo";
import { LoadingDemo } from "./LoadingDemo";

export const metadata: Metadata = { title: "Design System" };

/**
 * 색 목록. 색 자체는 packages/styles/src/global.css 의 @theme 에서 정합니다.
 * 새 색을 추가하면 여기에도 한 줄 넣어 주세요. (swatch 는 그대로 적어야 Tailwind 가 만듭니다)
 */
const COLOR_GROUPS: {
  title: string;
  description: string;
  colors: {
    name: string;
    swatch: string;
    alias?: string;
    kind?: "color" | "text";
  }[];
}[] = [
  {
    title: "Theme",
    description: "cciD 브랜드 색",
    colors: [
      { name: "indigo", swatch: "bg-indigo" },
      { name: "purple", swatch: "bg-purple" },
      { name: "pink", swatch: "bg-pink" },
      { name: "gold", swatch: "bg-gold" },
      { name: "skyblue", swatch: "bg-skyblue" },
    ],
  },
  {
    title: "Semantic",
    description: "대표 색 · 리서치 분야(01–04)별 색",
    colors: [
      { name: "primary", swatch: "bg-primary", alias: "indigo" },
      { name: "theme-01", swatch: "bg-theme-01", alias: "purple" },
      { name: "theme-02", swatch: "bg-theme-02", alias: "pink" },
      { name: "theme-03", swatch: "bg-theme-03", alias: "gold" },
      { name: "theme-04", swatch: "bg-theme-04", alias: "skyblue" },
    ],
  },
  {
    title: "Surface",
    description: "배경 · 면 · 입력칸",
    colors: [
      { name: "background", swatch: "bg-background" },
      { name: "sheet", swatch: "bg-sheet" },
      { name: "field", swatch: "bg-field" },
      { name: "white", swatch: "bg-white" },
      { name: "black", swatch: "bg-black" },
    ],
  },
  {
    title: "Text",
    description: "글자 전용 — text-main 처럼 글자에만 씁니다",
    colors: [
      { name: "main", swatch: "text-main", alias: "black", kind: "text" },
      { name: "sub", swatch: "text-sub", alias: "gray-500", kind: "text" },
      { name: "mute", swatch: "text-mute", alias: "gray-400", kind: "text" },
    ],
  },
  {
    title: "Gray",
    description: "테두리 기본값은 gray-200",
    colors: [
      { name: "gray-50", swatch: "bg-gray-50" },
      { name: "gray-100", swatch: "bg-gray-100" },
      { name: "gray-200", swatch: "bg-gray-200" },
      { name: "gray-300", swatch: "bg-gray-300" },
      { name: "gray-400", swatch: "bg-gray-400" },
      { name: "gray-500", swatch: "bg-gray-500" },
      { name: "gray-600", swatch: "bg-gray-600" },
      { name: "gray-700", swatch: "bg-gray-700" },
      { name: "gray-800", swatch: "bg-gray-800" },
      { name: "gray-900", swatch: "bg-gray-900" },
      { name: "gray-950", swatch: "bg-gray-950" },
    ],
  },
];

const FONTS = [
  {
    className: "font-pretendard",
    name: "Pretendard",
    use: "기본 폰트 · 본문 · 설명 등 한글이 들어가는 곳",
    weights: [
      { className: "font-normal", label: "400" },
      { className: "font-medium", label: "500" },
      { className: "font-semibold", label: "600" },
      { className: "font-bold", label: "700" },
    ],
    sample: "창의적 지능 디자인 센터 Creative Intelligence",
  },
  {
    className: "font-neuehaas",
    name: "Neue Haas Grotesk Display",
    use: "UI 요소 · 메뉴 · 제목 (Adobe Fonts). 한글은 Pretendard 로 대체. 클래스 이름 = 폰트 굵기 이름",
    weights: [
      { className: "font-light", label: "45 Light" },
      { className: "font-normal", label: "55 Roman (기본)" },
      { className: "font-medium", label: "65 Medium" },
      { className: "font-bold", label: "75 Bold" },
    ],
    sample: "Center for Creative Intelligence Design",
  },
];

/** 글자 크기 (아직 전용 체계가 없어 Tailwind 기본값을 씁니다) */
const TEXT_SIZES = [
  { className: "text-xs", spec: "12 / 16" },
  { className: "text-sm", spec: "14 / 20" },
  { className: "text-base", spec: "16 / 24" },
  { className: "text-lg", spec: "18 / 28" },
  { className: "text-xl", spec: "20 / 28" },
  { className: "text-2xl", spec: "24 / 32" },
  { className: "text-3xl", spec: "30 / 36" },
  { className: "text-4xl", spec: "36 / 40" },
  { className: "text-5xl", spec: "48 / 48" },
  { className: "text-6xl", spec: "60 / 60" },
];

const TEXT_COLORS = [
  { className: "text-main", label: "text-main" },
  { className: "text-sub", label: "text-sub" },
  { className: "text-mute", label: "text-mute" },
  { className: "text-primary", label: "text-primary" },
];

/** 이미지 비율 (global.css 의 --aspect-*) */
const RATIOS: { name: keyof typeof IMAGE_RATIOS; spec: string; use: string }[] =
  [
    { name: "thumbnail", spec: "4 : 3", use: "목록 · 분야 이미지 (기본)" },
    { name: "banner", spec: "16 : 9", use: "넓은 대표 이미지" },
    { name: "profile", spec: "3 : 4", use: "구성원 사진" },
  ];

const BUTTON_VARIANTS: ButtonVariant[] = ["solid", "outline", "ghost"];
const BUTTON_SIZES: ButtonSize[] = ["sm", "md", "lg"];

/** 쇼룸 구역: 왼쪽 제목 · 오른쪽 내용 */
function ShowSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section
      className={classNames(
        "grid gap-6 md:grid-cols-[220px_1fr] md:gap-12",
        "p-6 md:p-10",
        "rounded-3xl bg-sheet/60",
      )}
    >
      <div className={classNames("flex flex-col gap-1.5")}>
        <h2 className={classNames("font-neuehaas text-lg font-medium")}>
          {title}
        </h2>
        {description ? (
          <p className={classNames("text-xs leading-5 text-sub")}>
            {description}
          </p>
        ) : null}
      </div>
      <div className={classNames("min-w-0", "flex flex-col gap-10")}>
        {children}
      </div>
    </section>
  );
}

/** 작은 소제목 */
function Label({ children }: { children: ReactNode }) {
  return (
    <h3
      className={classNames(
        "mb-3",
        "font-neuehaas text-xs font-medium tracking-[0.08em] text-sub uppercase",
      )}
    >
      {children}
    </h3>
  );
}

/** 코드 표시 */
function Code({ children }: { children: ReactNode }) {
  return (
    <code className={classNames("font-neuehaas text-[11px] text-sub")}>
      {children}
    </code>
  );
}

export default async function DesignSystemPage() {
  await requireAdmin();

  return (
    <AdminPage
      title="Design System"
      description={
        <>
          공통 스타일 쇼룸. 색은 <Code>packages/styles/src/global.css</Code>,
          컴포넌트는 <Code>packages/common</Code> 에 있고 client 에서도 똑같이
          씁니다.
        </>
      }
    >
      <div className={classNames("flex flex-col gap-3")}>
        <ShowSection
          title="Color"
          description={
            <>
              <Code>bg-indigo</Code> · <Code>text-main</Code> ·{" "}
              <Code>border-gray-200</Code> 처럼 씁니다.
            </>
          }
        >
          {COLOR_GROUPS.map((group) => (
            <div key={group.title}>
              <Label>
                {group.title} — {group.description}
              </Label>
              <ul
                className={classNames(
                  "grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-5",
                )}
              >
                {group.colors.map((color) => (
                  <ColorSwatch key={color.name} {...color} />
                ))}
              </ul>
            </div>
          ))}
        </ShowSection>

        <ShowSection
          title="Typography"
          description={
            <>
              <Code>font-pretendard</Code> 가 기본이고, UI 에는{" "}
              <Code>font-neuehaas</Code> 를 붙입니다.
            </>
          }
        >
          {FONTS.map((font) => (
            <div key={font.name}>
              <Label>
                {font.name} — {font.className}
              </Label>
              <p className={classNames("mb-4", "text-sm text-sub")}>
                {font.use}
              </p>
              <ul className={classNames("flex flex-col gap-3")}>
                {font.weights.map((weight) => (
                  <li
                    key={weight.label}
                    className={classNames(
                      "grid grid-cols-[48px_1fr] items-baseline gap-4",
                    )}
                  >
                    <Code>{weight.label}</Code>
                    <span
                      className={classNames(
                        font.className,
                        "text-2xl",
                        weight.className,
                      )}
                    >
                      {font.sample}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div>
            <Label>Size — Tailwind 기본값 (px 크기 / 줄 높이)</Label>
            <ul className={classNames("flex flex-col gap-4")}>
              {TEXT_SIZES.map((size) => (
                <li
                  key={size.className}
                  className={classNames(
                    "grid grid-cols-[96px_1fr] items-baseline gap-4",
                  )}
                >
                  <span className={classNames("flex flex-col")}>
                    <Code>{size.className}</Code>
                    <Code>{size.spec}</Code>
                  </span>
                  <span className={classNames("truncate", size.className)}>
                    창의적 지능 디자인 Creative Intelligence
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <Label>Text color</Label>
            <ul className={classNames("flex flex-col gap-2")}>
              {TEXT_COLORS.map((color) => (
                <li
                  key={color.className}
                  className={classNames(
                    "grid grid-cols-[120px_1fr] items-baseline gap-4",
                  )}
                >
                  <Code>{color.label}</Code>
                  <span className={classNames("text-base", color.className)}>
                    창의적 지능 디자인 센터 Center for Creative Intelligence
                    Design
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </ShowSection>

        <ShowSection
          title="Image ratio"
          description={
            <>
              <Code>aspect-thumbnail</Code> 처럼 쓰고, 컴포넌트에는{" "}
              <Code>{'ratio="profile"'}</Code> 로 넘깁니다.
            </>
          }
        >
          <ul
            className={classNames(
              "grid items-end gap-6 sm:grid-cols-[4fr_6fr_3fr]",
            )}
          >
            {RATIOS.map((ratio) => (
              <li
                key={ratio.name}
                className={classNames("flex flex-col gap-2")}
              >
                <div
                  className={classNames(
                    ["w-full", IMAGE_RATIOS[ratio.name]],
                    "flex items-center justify-center",
                    "rounded-2xl bg-sheet",
                    "font-neuehaas text-sm text-sub",
                  )}
                >
                  {ratio.spec}
                </div>
                <div className={classNames("flex flex-col gap-0.5")}>
                  <span
                    className={classNames("font-neuehaas text-sm font-medium")}
                  >
                    {ratio.name}
                  </span>
                  <Code>{IMAGE_RATIOS[ratio.name]}</Code>
                  <span className={classNames("text-xs text-sub")}>
                    {ratio.use}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </ShowSection>

        <ShowSection
          title="Button"
          description={
            <>
              <Code>{"<Button variant size>"}</Code> — 링크에는{" "}
              <Code>buttonClassName()</Code> 을 씁니다.
            </>
          }
        >
          <div>
            <Label>Variant × Size</Label>
            <div className={classNames("flex flex-col gap-4")}>
              {BUTTON_VARIANTS.map((variant) => (
                <div
                  key={variant}
                  className={classNames(
                    "grid grid-cols-[72px_1fr] items-center gap-4",
                  )}
                >
                  <Code>{variant}</Code>
                  <div
                    className={classNames("flex flex-wrap items-center gap-3")}
                  >
                    {BUTTON_SIZES.map((size) => (
                      <Button key={size} variant={variant} size={size}>
                        Button {size}
                      </Button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <Label>State</Label>
            <div className={classNames("flex flex-wrap items-center gap-3")}>
              <Button disabled>Disabled</Button>
              <Button variant="outline" disabled>
                Disabled
              </Button>
              <Button loading>저장 중…</Button>
              <Button variant="outline" loading>
                불러오는 중…
              </Button>
            </div>
          </div>

          <div>
            <Label>Link · Block</Label>
            <div className={classNames("flex max-w-sm flex-col gap-3")}>
              <Link
                href={ROUTES.home}
                className={buttonClassName({ variant: "outline" })}
              >
                buttonClassName() 링크
              </Link>
              <Button block>block — 가로 꽉 채우기</Button>
            </div>
          </div>
        </ShowSection>

        <ShowSection
          title="Loading"
          description={
            <>
              <Code>{"<Spinner>"}</Code> 는 글자색을 따라가고,{" "}
              <Code>{"<LoadingOverlay>"}</Code> 는 끝날 때까지 화면을 막습니다.
            </>
          }
        >
          <div>
            <Label>Spinner — sm · md · lg · 색 바꾸기</Label>
            <div className={classNames("flex items-center gap-6")}>
              <Spinner size="sm" />
              <Spinner size="md" />
              <Spinner size="lg" />
              <Spinner size="lg" className={classNames("text-primary")} />
              <Spinner size="lg" className={classNames("text-theme-02")} />
            </div>
          </div>
          <div>
            <Label>Button loading · Loading overlay</Label>
            <LoadingDemo />
          </div>
        </ShowSection>

        <ShowSection
          title="Radius"
          description="담는 면일수록 둥글고, 안에 놓이는 것일수록 덜 둥급니다."
        >
          <div
            className={classNames(
              "max-w-md",
              "flex flex-col gap-3",
              "p-6",
              "rounded-3xl bg-sheet",
            )}
          >
            <Code>rounded-3xl — 패널 · 카드 · 모달</Code>
            <div
              className={classNames(
                "flex flex-col gap-3",
                "p-4",
                "rounded-2xl bg-white",
              )}
            >
              <Code>
                rounded-2xl — 패널 안의 상자 · 이미지 · 알림 · 도구 막대
              </Code>
              <div className={classNames("flex flex-wrap items-center gap-2")}>
                <Button size="md">rounded-lg</Button>
                <Button size="sm" variant="outline">
                  rounded-md
                </Button>
                <Code>버튼 · 입력칸</Code>
              </div>
            </div>
          </div>
        </ShowSection>

        <ShowSection
          title="Feedback"
          description={
            <>
              <Code>{"toast()"}</Code> 는 오른쪽 위 알림,{" "}
              <Code>{"openModal()"}</Code> 은 전역 모달(모바일은 바텀시트),{" "}
              <Code>{"<Switch>"}</Code> 는 켜고 끄는 값입니다.
            </>
          }
        >
          <FeedbackDemo />
        </ShowSection>
      </div>
    </AdminPage>
  );
}
