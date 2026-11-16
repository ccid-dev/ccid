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

/** People 페이지의 구성원 카드: 사진 · 이름 · 직함 · 짧은 약력 · (펼쳐 보는) 긴 소개 */
export function PersonCard({
  person,
  profileLabel,
}: {
  person: PersonCardData;
  profileLabel: string;
}) {
  return (
    <div className={classNames("flex flex-col gap-1.5")}>
      <SiteImage
        src={person.image}
        alt={person.name}
        ratio="profile"
        fallback={person.imageFallback}
      />
      <p className={classNames("mt-2", "font-semibold")}>{person.name}</p>
      {person.role ? (
        <p className={classNames("text-sm leading-6 whitespace-pre-line")}>
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
        <details className={classNames("text-sm")}>
          <summary className={classNames("underline")}>{profileLabel}</summary>
          <p className={classNames("mt-2", "leading-6 whitespace-pre-line")}>
            {person.profile}
          </p>
        </details>
      ) : null}
    </div>
  );
}
