"use client";

import { useState } from "react";
import classNames from "classnames";
import { Button, LoadingOverlay } from "@repo/common";

/** 버튼 로딩 · 로딩 팝업 미리보기 (2초 뒤 저절로 닫힘) */
export function LoadingDemo() {
  const [busy, setBusy] = useState(false);
  const [overlay, setOverlay] = useState(false);

  const run = (set: (value: boolean) => void) => {
    set(true);
    setTimeout(() => set(false), 2000);
  };

  return (
    <div className={classNames("flex flex-wrap items-center gap-3")}>
      <Button loading={busy} onClick={() => run(setBusy)}>
        {busy ? "저장 중…" : "버튼 로딩 보기"}
      </Button>
      <Button variant="outline" onClick={() => run(setOverlay)}>
        로딩 팝업 보기
      </Button>
      <LoadingOverlay
        open={overlay}
        message="이미지를 최적화해서 올리는 중"
        detail="1 / 3 · sample.png"
      />
    </div>
  );
}
