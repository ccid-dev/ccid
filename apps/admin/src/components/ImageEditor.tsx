"use client";

import classNames from "classnames";
import { useEffect, useState } from "react";
import Cropper, { type Area, type Point } from "react-easy-crop";
import type { CropArea } from "@repo/blocks";
import { Button } from "@repo/common";

/**
 * 이미지 크롭 도구 (화면 가운데 창).
 * 정해진 비율(aspect) 안에서 끌어 옮기고 확대해 보일 영역을 고릅니다.
 * 결과는 원본 기준 % 영역(CropArea)이고, 원본 파일은 그대로 둡니다.
 */
export function ImageEditor({
  src,
  aspect,
  aspectLabel,
  initial,
  step,
  onCancel,
  onApply,
}: {
  /** 원본 이미지 주소 (올리기 전이면 내 컴퓨터 파일의 임시 주소) */
  src: string;
  /** 가로 / 세로 */
  aspect: number;
  /** 비율 이름 (예: "4:3") */
  aspectLabel: string;
  /** 이미 저장된 크롭 (다시 고칠 때) */
  initial?: CropArea | null;
  /** 여러 장일 때 "2 / 5" */
  step?: string;
  onCancel: () => void;
  onApply: (crop: CropArea) => void;
}) {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [area, setArea] = useState<Area | null>(initial ?? null);
  // "원래대로"를 누르면 Cropper 를 새로 그려 가운데 · 확대 1 로 되돌립니다.
  const [resetKey, setResetKey] = useState(0);
  const [useInitial, setUseInitial] = useState(Boolean(initial));

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onCancel]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="이미지 편집"
      className={classNames(
        "fixed inset-0 z-90 flex items-center justify-center",
        "p-4",
        "bg-black/40 backdrop-blur-sm",
      )}
    >
      <div
        className={classNames(
          "max-h-full w-full max-w-3xl",
          "flex flex-col gap-5 overflow-y-auto",
          "p-5 md:p-7",
          "rounded-3xl bg-background shadow-2xl",
        )}
      >
        <div
          className={classNames("flex items-baseline justify-between gap-4")}
        >
          <div>
            <h2
              className={classNames(
                "font-neuehaas text-2xl leading-tight font-medium tracking-[-0.02em]",
              )}
            >
              이미지 편집
            </h2>
            <p className={classNames("mt-1", "text-sm text-sub")}>
              {aspectLabel} 비율로 보일 영역을 고르세요. 끌어서 옮기고, 아래
              막대나 스크롤로 확대합니다. 원본은 그대로 남습니다.
            </p>
          </div>
          {step ? (
            <span
              className={classNames(
                "shrink-0",
                "font-neuehaas text-sm font-medium text-sub",
              )}
            >
              {step}
            </span>
          ) : null}
        </div>

        <div
          className={classNames(
            "h-[min(60vh,460px)] w-full",
            "relative overflow-hidden",
            "rounded-2xl bg-sheet",
          )}
        >
          <Cropper
            key={resetKey}
            image={src}
            aspect={aspect}
            crop={crop}
            zoom={zoom}
            minZoom={1}
            maxZoom={4}
            showGrid
            initialCroppedAreaPercentages={
              useInitial && initial ? initial : undefined
            }
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={(percentages) => setArea(percentages)}
          />
        </div>

        <label className={classNames("flex items-center gap-4")}>
          <span
            className={classNames("shrink-0", "text-xs font-medium text-sub")}
          >
            확대
          </span>
          <input
            type="range"
            min={1}
            max={4}
            step={0.01}
            value={zoom}
            onChange={(event) => setZoom(Number(event.target.value))}
            className={classNames("w-full", "accent-black")}
          />
          <span
            className={classNames(
              "w-12 shrink-0",
              "text-right font-neuehaas text-xs text-sub",
            )}
          >
            {zoom.toFixed(2)}×
          </span>
        </label>

        <div
          className={classNames(
            "flex flex-wrap items-center justify-between gap-2",
          )}
        >
          <Button
            variant="ghost"
            onClick={() => {
              setUseInitial(false);
              setCrop({ x: 0, y: 0 });
              setZoom(1);
              setResetKey((key) => key + 1);
            }}
          >
            원래대로
          </Button>
          <div className={classNames("flex gap-2")}>
            <Button variant="outline" onClick={onCancel}>
              취소
            </Button>
            <Button disabled={!area} onClick={() => area && onApply(area)}>
              적용
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
