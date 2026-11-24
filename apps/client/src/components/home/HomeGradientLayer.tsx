"use client";

import classNames from "classnames";
import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

/**
 * 홈 첫 화면 ~ About 을 함께 덮는 배경 (Figma "home-gradient-layer", 1440 기준 1440×2246).
 * 감싼 구역들(히어로 · About)은 그대로 각자 구역이고, 배경만 그 뒤에 한 장으로 깔립니다.
 * 이미지 없이 CSS 로 그립니다. 움직임은 motion/react (motion.div) 로 붙입니다.
 *
 * ① 진보라 그라디언트 (Figma "image · gradient"): 1440 기준 1273px 높이 · 위로 67px 올라가 있음 (위 67px 는 잘림)
 *    Figma 에는 이미지로 들어 있어 픽셀 값에서 뽑은 색: rgb(28 0 112)(불투명) → rgb(183 112 255 / 0) 직선 (10% 마다 단계)
 *    원 그라디언트의 투명해지는 끝(49.97% → 100%)도 Figma 처럼 흰색 쪽으로 섞이도록 중간 단계를 넣음
 *    (CSS 그라디언트는 투명도를 곱한 채로 섞어, 단계가 적으면 Figma 보다 어둡고 푸르게 보임)
 * ② 큰 원 (Figma "Group 2085670141" 의 두 Ellipse): 원 윗선이 위에서 138px, 지름 1981px ≈ 137.6vw (좁은 화면은 최소 999px)
 *    - 바깥 원: 흰색 5% + 바깥으로 번지는 흰 빛 두 겹 (그림자 흐림 100px · 50px)
 *    - 안쪽 원: 위쪽 가운데에서 퍼지는 원형 그라디언트(80%) + 안쪽 그림자 네 겹
 *    - 그림자 크기는 1981px 원 기준 값을 원 지름 비율(cqw = 원 지름의 1%)로 바꿔, 원이 작아져도 모양이 같게
 *
 * 배경 층 높이 = 원 윗선 138 + 원 지름 + 아래 여백 126 (= 1440 기준 2246px)
 * 스크롤: 배경 층은 처음엔 같이 올라가다가, 층 아래 끝이 화면 아래에 닿으면 멈춰 있음 (sticky)
 *   → About 이 화면에 고정된 채 항목을 넘기는 동안에도 원 아래쪽(하늘색 → 흰색)이 계속 보이고, About 이 끝나면 같이 올라감
 *   배경 층은 음수 아래 여백으로 자리를 차지하지 않고 내용 뒤에 겹침
 * - 넘친 부분(가로로 넓은 원 · 위로 올라간 그라디언트)은 overflow-clip 으로 자름.
 *   hidden 과 달리 스크롤 상자를 만들지 않아 About 안의 sticky 가 그대로 동작합니다.
 * - 헤더 흰 글자 구역(data-header-tone="dark", HeaderTone)도 여기서 정함
 * 모션: 원이 아래에서 천천히 떠오름 · 평소에는 원 안 하늘색 빛 덩어리들이 흐르며 일렁임 (SKY_BLOBS).
 *   움직임 줄이기 설정이면 둘 다 없이 바로 보입니다.
 */

/**
 * 원 안 하늘색 일렁임: 부드러운 하늘색 빛 덩어리들이 각자 좌우 · 위아래로 흐르며 진해졌다 옅어짐.
 * 자리는 보라 → 하늘색으로 바뀌는 경계 (원 상자 높이 24~51%, 1440×900 첫 화면의 "cciD." 아래쪽부터 보임)
 * - left · top · width · height: 덩어리 자리와 크기 (원 상자 대비 %)
 * - x · y: 흐르는 거리 (덩어리 자기 크기 대비 %) · scale: 가장 커질 때 배율
 * - opacity: [가장 옅을 때, 가장 진할 때] · seconds: 한 바퀴 (초, 좌우 흐름은 1.4배로 느리게) · delay: 시작 늦춤 (초)
 * 덩어리마다 주기 · 방향을 다르게 두어 같은 모양이 반복되지 않게 합니다.
 */
const SKY_BLOBS = [
  {
    left: "8%",
    top: "24%",
    width: "42%",
    height: "18%",
    x: "18%",
    y: "12%",
    scale: 1.12,
    opacity: [0.2, 0.9],
    seconds: 5.5,
    delay: 0,
  },
  {
    left: "50%",
    top: "27%",
    width: "42%",
    height: "18%",
    x: "-20%",
    y: "-10%",
    scale: 1.15,
    opacity: [0.15, 0.85],
    seconds: 6.5,
    delay: 1.2,
  },
  {
    left: "27%",
    top: "33%",
    width: "46%",
    height: "18%",
    x: "14%",
    y: "-14%",
    scale: 1.1,
    opacity: [0.25, 0.9],
    seconds: 7,
    delay: 2.4,
  },
] as const;

export function HomeGradientLayer({ children }: { children: ReactNode }) {
  const reduce = useReducedMotion();

  return (
    <div className={classNames("relative isolate overflow-clip")}>
      <div
        aria-hidden
        className={classNames(
          "h-[calc(264px+max(137.6vw,999px))] -mb-[calc(264px+max(137.6vw,999px))]",
          // 화면보다 층이 길면 (층 높이 - 화면 높이) 만큼 올라간 뒤 멈춤 · 화면이 더 길면 맨 위에 그대로
          "pointer-events-none sticky top-[min(0px,calc(100svh-264px-max(137.6vw,999px)))] -z-10",
          // Figma 레이어 바탕은 순수 흰색 #fff (사이트 바탕 #fbfbfb 위에서는 원 아래쪽 · 흰 빛이 탁해 보임)
          // 이 프로젝트는 테마에서 white 를 #fbfbfb 로 바꿔 두어 bg-white 가 아니라 #fff 를 직접 씀
          "bg-[#fff]",
          "",
        )}
      >
        {/* ① 진보라 그라디언트 */}
        <motion.div
          className={classNames(
            "h-318.25 w-full",
            "absolute -top-16.75 left-0",
            // 10% 마다 이미지에서 뽑은 색. (CSS 는 투명도를 곱한 채로 섞어 중간이 어두워지므로 단계를 촘촘히)
            "bg-[linear-gradient(180deg,rgb(28_0_112)_0%,rgb(42_10_125/0.91)_10%,rgb(58_22_140/0.81)_20%,rgb(74_34_155/0.7)_30%,rgb(90_45_168/0.6)_40%,rgb(107_57_184/0.49)_50%,rgb(124_70_199/0.39)_60%,rgb(141_81_214/0.28)_70%,rgb(155_94_227/0.18)_80%,rgb(167_102_244/0.08)_90%,rgb(183_112_255/0)_100%)]",
            "",
          )}
        />

        {/* ② 큰 원 (@container: 안쪽 그림자 크기를 원 지름 비율 cqw 로) */}
        <motion.div
          className={classNames(
            "@container size-[max(137.6vw,999px)]",
            "absolute top-34.5 left-1/2 -translate-x-1/2",
            "",
          )}
          initial={reduce ? false : { opacity: 0, y: 80 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* 바깥 원: 흰색 5% · 바깥 흰 빛 (흐림 100px · 50px → 원 지름의 5.048% · 2.524%) */}
          <motion.div
            className={classNames(
              "absolute inset-0 rounded-full",
              "bg-white/5 shadow-[0_0_5.048cqw_rgb(255_255_255/0.7),0_0_2.524cqw_rgb(255_255_255/1)]",
              "",
            )}
          />
          {/*
            안쪽 원: 원형 그라디언트 중심 (51.21%, 5.48%) · 반지름 87.61% (1735.71 / 1981.12), 색은 80% 불투명
            안쪽 그림자 (위에 그려지는 것부터, 1981px 기준 값 → cqw):
              분홍 y70 흐림70 40% · 연민트 y40 흐림40 25% · 보라 y450 흐림250 60% · 하늘 y69.5 흐림50 97%
            보정: Figma 값 그대로면 브라우저에서 분홍 · 보라 그림자가 원 아래쪽 테두리 안쪽에 보라 띠로 비침 (Figma 에는 없음).
              그림자 구멍을 1cqw 넓히고(spread -1cqw) 그만큼 더 내려(y +1cqw) 위쪽 가장자리는 그대로 두고 아래 테두리만 걷어냄.
              보라는 흐림도 0.85배(250 → 212px 상당)로 줄여 원 가운데 높이 양옆의 보라 기운을 Figma 와 맞춤.
              (Figma 렌더링과 픽셀 비교로 고른 값 — 1440 기준 평균 색 차이 3.7 → 2.6)
          */}
          <motion.div
            className={classNames(
              "absolute inset-0 rounded-full",
              "bg-[radial-gradient(87.61%_87.61%_at_51.21%_5.48%,rgb(88_0_169/0.8)_0%,rgb(154_149_255/0.8)_27.57%,rgb(160_212_255/0.8)_43.14%,rgb(176_227_255/0.8)_49.97%,rgb(196_234_255/0.6)_62.48%,rgb(216_241_255/0.4)_74.99%,rgb(235_248_255/0.2)_87.49%,rgb(255_255_255/0)_100%)]",
              // 분홍 · 보라는 Figma 렌더링에 맞춰 보정 (위 주석)
              "shadow-[inset_0_4.533cqw_3.533cqw_-1cqw_rgb(255_58_202/0.4),inset_0_2.019cqw_2.019cqw_rgb(211_255_245/0.25),inset_0_23.714cqw_10.726cqw_-1cqw_rgb(98_26_255/0.6),inset_0_3.51cqw_2.524cqw_rgb(90_244_255/0.97)]",
              "",
            )}
          />
          {/*
            ③ 하늘색 일렁임 (평소 계속): 하늘색 빛 덩어리들이 흐르며 진해졌다 옅어짐 (SKY_BLOBS).
            덩어리 색은 원래 하늘색(#B0E3FF 근처)보다 진하고 맑게 — 같은 색이면 겹쳐도 티가 안 남.
            원 모양으로 자른 상자 안에서만 움직여 원 밖으로 비치지 않게 함.
            움직임 줄이기 설정이면 그리지 않음 (Figma 그대로)
          */}
          {reduce ? null : (
            <div
              className={classNames(
                "absolute inset-0 overflow-hidden rounded-full",
              )}
            >
              {SKY_BLOBS.map((blob, index) => (
                <motion.div
                  key={index}
                  className={classNames(
                    "absolute",
                    "bg-[radial-gradient(closest-side,rgb(120_200_255/0.85),rgb(120_200_255/0.4)_55%,rgb(120_200_255/0))]",
                  )}
                  // 자리 · 크기는 덩어리마다 다른 값이라 style 로
                  style={{
                    left: blob.left,
                    top: blob.top,
                    width: blob.width,
                    height: blob.height,
                  }}
                  initial={{ opacity: blob.opacity[0] }}
                  animate={{
                    opacity: [blob.opacity[0], blob.opacity[1], blob.opacity[0]],
                    x: ["0%", blob.x, "0%"],
                    y: ["0%", blob.y, "0%"],
                    scale: [1, blob.scale, 1],
                  }}
                  transition={{
                    default: {
                      duration: blob.seconds,
                      delay: blob.delay,
                      repeat: Infinity,
                      ease: "easeInOut",
                    },
                    // 좌우 흐름은 조금 느리게 — 위아래 · 밝기와 박자가 어긋나 일렁이는 느낌
                    x: {
                      duration: blob.seconds * 1.4,
                      delay: blob.delay,
                      repeat: Infinity,
                      ease: "easeInOut",
                    },
                  }}
                />
              ))}
            </div>
          )}
        </motion.div>
      </div>
      {/*
        About 끝: 멈춰 있던 배경이 상자 아래 끝에서 딱 잘려 보이지 않도록 바탕색으로 서서히 덮음 (배경 층 위 · 내용 아래)
      */}
      <div
        aria-hidden
        className={classNames(
          "h-[60svh]",
          "pointer-events-none absolute inset-x-0 bottom-0 -z-10",
          "bg-linear-to-b from-transparent to-background",

          "",
        )}
      />
      {/*
        헤더 글자를 흰색으로 바꾸는 구역 (HeaderTone 이 이 상자와 헤더가 겹치는지 봄).
        진보라 배경 · 원의 보라 부분까지: 1440 기준 약 900px (62vw), 좁은 화면은 원이 999px 로 고정이라 560px
      */}
      <div
        aria-hidden
        data-header-tone="dark"
        className={classNames(
          "h-[max(560px,62vw)]",
          "pointer-events-none absolute inset-x-0 top-0",
          "",
        )}
      />
      {children}
    </div>
  );
}
