import classNames from "classnames";
import { SiteImage } from "./shared";

/** People 카드에 들어가는 값 (이미 고른 언어) */
export type PersonCardData = {
  name: string;
  role: string;
  bio: string;
  profile: string;
  image: string | null;
  /** 이미지가 없을 때 회색 상자에 적을 글자 */
  imageFallback?: string;
};

/**
 * People 페이지의 구성원 카드: 사진(흑백) · 이름 · 직함 · 짧은 약력 · 약력 전체 보기.
 * - 기본: 좁은 화면(sm 미만)은 왼쪽에 작은 사진, 오른쪽에 글 / sm 이상은 사진 위 · 글 아래
 *   작은 사진은 모든 구역이 같은 크기 — 직함이 있으면 이름 위부터 약력 3번째 줄 아래까지에 딱 맞음
 * - wide (디렉터): 한 줄 전체를 씀 — 좁은 화면은 16:9 사진 위 · 글 아래, sm 이상은 사진 · 글 2단(사진 높이 = 글 높이). 직함은 입력한 줄바꿈대로
 * 약력 전체는 카드 폭에 갇히지 않도록 팝오버 창으로 엽니다 (브라우저 기본 popover — 스크립트 없이 동작).
 *   넓은 화면: 가운데 넓은 창 · 좁은 화면: 아래에서 올라오는 화면 폭 전체 창. 바깥 · Esc · 닫기로 닫힘.
 */
export function PersonCard({
  person,
  profileLabel,
  closeLabel = "Close",
  wide = false,
}: {
  person: PersonCardData;
  profileLabel: string;
  /** 약력 창 닫기 버튼 이름 */
  closeLabel?: string;
  /** 좁은 화면에서도 사진 위 · 글 아래 (디렉터) */
  wide?: boolean;
}) {
  const profileId = `profile-${encodeURIComponent(person.name)}`;
  const bioBlocks = person.bio
    .split(/\r?\n[ \t]*\r?\n/)
    .map((block) => block.trim())
    .filter(Boolean);
  return (
    <div
      className={classNames(
        wide
          ? // 디렉터: 좁은 화면은 사진 위 · 글 아래 / sm 이상은 사진 · 글 2단 (가운데 간격이 아래 4 · 6칸 격자 선과 맞음)
            "flex flex-col gap-1.5 sm:grid sm:grid-cols-2 sm:gap-x-4"
          : [
              // 좁은 화면 사진: 모든 구역 같은 크기 81 × 108px (3:4)
              //   높이 108 = 이름 20 + 간격 2 + 직함 20 + 간격 6 + 약력 3줄 60 (직함이 없는 학생은 글보다 조금 김)
              "grid grid-cols-[81px_minmax(0,1fr)] items-start gap-x-4 sm:flex sm:flex-col sm:items-stretch sm:gap-1.5",
            ],
      )}
    >
      {wide ? (
        <>
          {/* 디렉터 좁은 화면: 화면 폭 전체가 아니라 높이 288px 기준의 3:4 사진 (폭 216px · 크롭 그대로라 늘어나지 않음) */}
          <div className={classNames("w-54 sm:hidden")}>
            <SiteImage
              src={person.image}
              alt={person.name}
              ratio="profile"
              fallback={person.imageFallback}
              imageClassName={classNames("grayscale")}
            />
          </div>
          {/* sm 이상: 다른 사진을 넣을 자리로 빈 카드만 둠 — 비율 대신 오른쪽 글 단 높이에 맞춤 (칸을 채우고 줄 높이는 글이 정함) */}
          <div className={classNames("hidden sm:relative sm:block")}>
            <SiteImage
              src={null}
              alt=""
              ratio="banner"
              fallback=""
              className={classNames("absolute inset-0 aspect-auto")}
            />
          </div>
        </>
      ) : (
        <div>
          {/*
            넓은 화면: 사진을 아래 가운데 기준으로 살짝 줄여(85%) 배경 비중을 늘림
            - 상자는 4:5 로 낮추고, 3:4 사진 면(크롭 기준)은 아래에 붙여 남는 위쪽만 잘라냄 (사람 크기는 그대로)
            - 늘어난 위 · 옆 자리는 사진 배경과 같은 회색(#ccc)이라 이어져 보임 (좁은 화면은 그대로 3:4)
          */}
          <SiteImage
            src={person.image}
            alt={person.name}
            ratio="profile"
            fallback={person.imageFallback}
            imageClassName={classNames("grayscale")}
            className={classNames("sm:aspect-4/5 sm:bg-[#ccc]")}
            contentClassName={classNames(
              "sm:top-auto sm:aspect-3/4 sm:origin-bottom sm:scale-85",
            )}
          />
        </div>
      )}
      <div
        className={classNames(
          "min-w-0",
          "flex flex-col gap-1.5",
          wide ? "mt-2 sm:mt-0" : "sm:mt-2",
        )}
      >
        {/* 좁은 화면: 이름 줄 높이 20px · 아래 간격 2px 로 줄여 직함 · 약력에 붙임 (sm 이상은 24px · 6px) */}
        <p
          className={classNames(
            "-mb-1 sm:mb-0",
            "leading-5 font-semibold sm:leading-6",
          )}
        >
          {person.name}
        </p>
        {person.role ? (
          // 좁은 화면은 줄바꿈 없이 한 줄로 이어 씀 (sm 이상은 입력한 줄바꿈대로)
          // 디렉터는 늘 입력한 줄바꿈대로 — 직함은 한 줄로 입력하고, 다음 줄에 FRSA 등을 둠
          <p
            className={classNames(
              "text-sm leading-5",
              wide
                ? "whitespace-pre-line"
                : "whitespace-normal sm:whitespace-pre-line",
            )}
          >
            {person.role}
          </p>
        ) : null}
        {bioBlocks.length ? (
          // 약력은 빈 줄로 묶음을 나눠 위아래로 쌓음 (빈 줄 한 줄만큼 띄움)
          <div className={classNames("flex flex-col gap-5")}>
            {bioBlocks.map((block) => (
              <p
                key={block}
                className={classNames(
                  "text-[13px] leading-5 whitespace-pre-line text-sub",
                )}
              >
                {block}
              </p>
            ))}
          </div>
        ) : null}
        {person.profile ? (
          <>
            <button
              type="button"
              popoverTarget={profileId}
              className={classNames(
                "group self-start",
                "mt-1 inline-flex items-center gap-1",
                "text-sm underline-offset-4 hover:underline",
              )}
            >
              {profileLabel}
              <span
                aria-hidden
                className={classNames(
                  "transition-transform duration-300 group-hover:translate-x-0.5",
                )}
              >
                →
              </span>
            </button>
            <div
              id={profileId}
              popover="auto"
              aria-label={person.name}
              className={classNames(
                // 좁은 화면: 아래에서 올라오는 화면 폭 전체 창
                "inset-x-0 top-auto bottom-0 m-0 w-full max-w-none",
                "max-h-[85dvh] overflow-y-auto overscroll-contain",
                // 넓은 화면: 가운데 넓은 창
                "md:inset-0 md:m-auto md:h-fit md:w-[min(42rem,calc(100%-5rem))]",
                "p-6 pb-[calc(env(safe-area-inset-bottom)+1.5rem)] md:p-10",
                "rounded-t-3xl bg-background text-main shadow-2xl md:rounded-3xl",
                "backdrop:bg-black/30 backdrop:backdrop-blur-sm",
                // 열릴 때 아래에서 떠오르기
                "transition-[opacity,translate] duration-300 ease-out",
                "starting:open:translate-y-8 starting:open:opacity-0",
              )}
            >
              <div className={classNames("flex items-start gap-4")}>
                <div className={classNames("w-16 shrink-0")}>
                  <SiteImage
                    src={person.image}
                    alt=""
                    ratio="profile"
                    fallback=""
                    imageClassName={classNames("grayscale")}
                  />
                </div>
                <div className={classNames("min-w-0 flex-1")}>
                  <p className={classNames("text-lg font-semibold")}>
                    {person.name}
                  </p>
                  {person.role ? (
                    <p
                      className={classNames(
                        "text-sm leading-6 whitespace-pre-line text-sub",
                      )}
                    >
                      {person.role}
                    </p>
                  ) : null}
                </div>
                <button
                  type="button"
                  popoverTarget={profileId}
                  popoverTargetAction="hide"
                  className={classNames(
                    "h-9 shrink-0 px-4",
                    "rounded-full bg-sheet/60 transition hover:bg-sheet",
                    "font-neuehaas text-sm font-medium",
                  )}
                >
                  {closeLabel}
                </button>
              </div>
              <p
                className={classNames(
                  "mt-8",
                  "text-base leading-7 whitespace-pre-line break-keep",
                )}
              >
                {person.profile}
              </p>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
