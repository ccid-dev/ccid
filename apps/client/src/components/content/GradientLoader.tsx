import classNames from "classnames";

/** 로더 색: 그레이스케일 — 검정의 투명도 차이로만 (진함 → 옅음이 둘레를 따라 돎) */
const GRADIENT =
  "bg-[conic-gradient(from_0deg,rgba(17,17,17,0.55),rgba(17,17,17,0.18),rgba(17,17,17,0.05),rgba(17,17,17,0.3),rgba(17,17,17,0.55))]";

/**
 * 사이트 로딩 표시: 반투명 회색 그라디언트가 둘레를 따라 돌면서, 모양이 물방울처럼 일렁이는 작은 덩어리.
 * 뒤에는 같은 색이 흐리게 번진 그림자, 가운데는 유리 같은 흰 광택. 움직임 줄이기 설정이면 멈춘 채로 보입니다.
 * (admin 등에서 쓰는 공용 Spinner 는 그대로 두고, 사이트에서만 씁니다)
 */
export function GradientLoader({ label }: { label: string }) {
  return (
    <span
      role="status"
      aria-label={label}
      className={classNames("relative inline-block size-14")}
    >
      {/* 번진 빛 */}
      <span
        aria-hidden
        className={classNames(
          "absolute -inset-3 rounded-full opacity-30 blur-xl",
          GRADIENT,
          "animate-loader-blob motion-reduce:animate-none",
        )}
      />
      {/* 덩어리 */}
      <span
        aria-hidden
        className={classNames(
          "absolute inset-0",
          GRADIENT,
          "animate-loader-blob motion-reduce:animate-none",
        )}
      />
      {/* 유리 같은 안쪽 광택 */}
      <span
        aria-hidden
        className={classNames(
          "absolute inset-[18%] rounded-full",
          "bg-white/55 backdrop-blur-sm",
        )}
      />
    </span>
  );
}
