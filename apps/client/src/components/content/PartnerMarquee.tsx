import classNames from "classnames";
import type { Partner } from "@/constants";

/** 줄 수: 기관이 많으면 3줄, 아니면 2줄 */
const rowCount = (count: number) => (count > 18 ? 3 : count > 1 ? 2 : 1);
/** 한 줄이 화면보다 짧아 빈틈이 생기지 않도록, 한 묶음에 최소 이만큼 채웁니다. */
const MIN_ITEMS_PER_COPY = 8;

/** 기관 하나: 로고(흑백) 또는 이름 글자 */
function PartnerMark({ partner }: { partner: Partner }) {
  return (
    <li
      className={classNames(
        "h-12 shrink-0",
        "flex items-center",
        "px-6 md:px-10",
      )}
    >
      {partner.logo ? (
        <img
          src={partner.logo}
          alt={partner.name}
          loading="lazy"
          decoding="async"
          className={classNames(
            "h-7 w-auto max-w-36",
            "object-contain opacity-50 grayscale transition hover:opacity-100",
          )}
        />
      ) : (
        <span
          className={classNames(
            "font-neuehaas text-xl font-medium tracking-[-0.02em] whitespace-nowrap text-mute md:text-2xl",
          )}
        >
          {partner.name}
        </span>
      )}
    </li>
  );
}

/** 끝없이 흐르는 한 줄 (같은 묶음을 두 번 이어 붙여 절반만큼 이동) */
function MarqueeRow({
  partners,
  reverse,
}: {
  partners: Partner[];
  reverse: boolean;
}) {
  const repeat = Math.max(1, Math.ceil(MIN_ITEMS_PER_COPY / partners.length));
  const copy = Array.from({ length: repeat }, () => partners).flat();
  return (
    <div
      className={classNames("w-max", "flex", [
        reverse ? "animate-marquee-reverse" : "animate-marquee",
        "motion-reduce:animate-none",
      ])}
    >
      {[0, 1].map((half) => (
        <ul
          key={half}
          aria-hidden={half === 1 || undefined}
          className={classNames("flex")}
        >
          {copy.map((partner, index) => (
            <PartnerMark key={`${partner.name}-${index}`} partner={partner} />
          ))}
        </ul>
      ))}
    </div>
  );
}

/**
 * 협업 기관 로고 띠: 2–3줄이 서로 반대 방향으로 끝없이 흐릅니다.
 * 마우스를 올리면 그 줄이 멈추고, 움직임 줄이기 설정이면 흐르지 않습니다.
 */
export function PartnerMarquee({
  title,
  partners,
}: {
  title: string;
  partners: Partner[];
}) {
  if (!partners.length) return null;
  const rows = rowCount(partners.length);
  const perRow = Math.ceil(partners.length / rows);
  const lines = Array.from({ length: rows }, (_, i) =>
    partners.slice(i * perRow, (i + 1) * perRow),
  ).filter((line) => line.length);

  return (
    <section
      aria-label={title}
      className={classNames("overflow-hidden", "py-16 md:py-24")}
    >
      <h2
        className={classNames(
          "mb-8",
          "px-5 md:px-10",
          "font-neuehaas text-xl leading-tight font-medium tracking-[-0.02em] md:text-2xl",
        )}
      >
        {title}
      </h2>
      <div
        className={classNames(
          "flex flex-col gap-4",
          "[mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]",
        )}
      >
        {lines.map((line, index) => (
          <MarqueeRow key={index} partners={line} reverse={index % 2 === 1} />
        ))}
      </div>
    </section>
  );
}
