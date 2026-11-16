"use client";

import classNames from "classnames";
import { useState } from "react";
import { cropBox, splitCrop } from "./crop";

/**
 * 크롭 정보를 반영해 그리는 이미지. 부모 상자(position: relative · 비율 고정)를 꽉 채웁니다.
 * 크롭 정보가 없으면 가운데를 기준으로 꽉 채웁니다. (object-cover)
 * 받는 동안에는 스켈레톤(깜빡이는 회색 면)을 보여 주고, 다 받으면 이미지가 부드럽게 나타납니다.
 */
export function CroppedImage({
  src,
  alt,
  className,
  lazy = true,
}: {
  /** 이미지 주소 (끝에 #crop=… 이 붙어 있어도 됨) */
  src: string;
  alt: string;
  className?: string;
  lazy?: boolean;
}) {
  const { key: url, crop } = splitCrop(src);
  const [loaded, setLoaded] = useState(false);

  return (
    <>
      {/* 스켈레톤 */}
      <span
        aria-hidden
        className={classNames("absolute inset-0", "pointer-events-none", [
          "bg-gray-200/70 transition-opacity duration-500",
          "animate-pulse motion-reduce:animate-none",
          loaded ? "opacity-0" : "opacity-100",
        ])}
      />
      <img
        // 이미 받아 둔(캐시) 이미지는 onLoad 가 먼저 지나갈 수 있어서 붙는 순간 확인
        ref={(image) => {
          if (image?.complete && image.naturalWidth) setLoaded(true);
        }}
        src={url}
        alt={alt}
        loading={lazy ? "lazy" : undefined}
        decoding="async"
        onLoad={() => setLoaded(true)}
        onError={() => setLoaded(true)}
        style={crop ? cropBox(crop) : undefined}
        className={classNames(
          "absolute",
          crop ? "max-w-none" : "inset-0 size-full object-cover",
          [
            "transition-opacity duration-500",
            loaded ? "opacity-100" : "opacity-0",
          ],
          className,
        )}
      />
    </>
  );
}
