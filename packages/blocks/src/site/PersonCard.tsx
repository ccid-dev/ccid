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
 *   작은 사진 높이는 이름부터 약력 셋째 줄 끝까지에 맞춤 (사진 위 = 이름 위, 사진 아래 = 약력 3번째 줄 아래)
 * - wide: 좁은 화면에서도 사진 위 · 글 아래로 화면 폭 전체 (디렉터)
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
  return (
    <div
      className={classNames(
        wide
          ? "flex flex-col gap-1.5"
          : [
              // 좁은 화면 사진 폭 (3:4) — 높이 = 이름 24 + 간격 6 + (직함 20 + 간격 6) + 약력 3줄 60
              //   직함 있음: 116px → 폭 87px · 직함 없음: 90px → 폭 67.5px
              person.role
                ? "grid-cols-[87px_minmax(0,1fr)]"
                : "grid-cols-[67.5px_minmax(0,1fr)]",
              "grid items-start gap-x-4 sm:flex sm:flex-col sm:items-stretch sm:gap-1.5",
            ],
      )}
    >
      {wide ? (
        // 디렉터 좁은 화면: 다른 사진을 넣을 자리로 16:9 빈 카드만 둠 (sm 이상은 기존 사진)
        <div className={classNames("sm:hidden")}>
          <SiteImage src={null} alt="" ratio="banner" fallback="" />
        </div>
      ) : null}
      <div className={classNames({ "hidden sm:block": wide })}>
        <SiteImage
          src={person.image}
          alt={person.name}
          ratio="profile"
          fallback={person.imageFallback}
          imageClassName={classNames("grayscale")}
        />
      </div>
      <div
        className={classNames(
          "min-w-0",
          "flex flex-col gap-1.5",
          wide ? "mt-2" : "sm:mt-2",
        )}
      >
        <p className={classNames("font-semibold")}>{person.name}</p>
        {person.role ? (
          // 좁은 화면은 줄바꿈 없이 한 줄로 이어 씀 (sm 이상은 입력한 줄바꿈대로)
          <p
            className={classNames(
              "text-sm leading-5 whitespace-normal sm:whitespace-pre-line",
            )}
          >
            {person.role}
          </p>
        ) : null}
        {person.bio ? (
          <p
            className={classNames(
              "text-[13px] leading-5 whitespace-pre-line text-sub",
            )}
          >
            {person.bio}
          </p>
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
