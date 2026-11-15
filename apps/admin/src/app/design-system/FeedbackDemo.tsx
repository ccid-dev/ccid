"use client";

import classNames from "classnames";
import { Button } from "@repo/common";
import { Switch } from "@/components/forms";
import { openModal } from "@/libs/modal";
import { toast } from "@/libs/toast";

/** 알림(토스트) · 모달 · 스위치 미리보기 */
export function FeedbackDemo() {
  return (
    <div className={classNames("flex flex-col gap-8")}>
      <div className={classNames("flex flex-wrap gap-3")}>
        <Button onClick={() => toast("저장했습니다.")}>성공 알림</Button>
        <Button
          variant="outline"
          onClick={() => toast.error("저장하지 못했습니다. (예시)")}
        >
          오류 알림
        </Button>
        <Button
          variant="outline"
          onClick={() =>
            openModal({
              title: "모달 예시",
              description:
                "넓은 화면에서는 가운데 창, 768px 보다 좁으면 바텀시트로 뜹니다.",
              content: (
                <p className={classNames("text-sm leading-6 text-sub")}>
                  새 프로젝트 · 새 분야 · 새 구성원 · 내 프로필 만들기가 이
                  모달에서 열립니다. Esc 나 바깥을 누르면 닫히고, 바텀시트는
                  끌어내려 닫습니다.
                </p>
              ),
            })
          }
        >
          모달 열기
        </Button>
      </div>
      <div className={classNames("max-w-sm", "flex flex-col gap-4")}>
        <Switch label="사이트에 공개" defaultChecked />
        <Switch label="NDA" description="기본 정보만 공개합니다." />
      </div>
    </div>
  );
}
