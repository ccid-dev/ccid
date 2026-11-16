"use client";

import classNames from "classnames";
import { useActionState, useState } from "react";
import type { FormState } from "@/app/actions/auth";
import {
  BilingualField,
  Field,
  FormSection,
  SubmitButton,
  Switch,
} from "@/components/forms";
import { Badge } from "@/components/ui";
import { notify } from "@/libs/toast";
import type { Tables } from "@/types";
import { saveRecruit } from "./actions";

type Recruit = Tables<"recruit">;

/** 모집 설정 폼: 모집 상태 · 지원 링크 / Join 문구 / 모집 중이 아닐 때 안내 */
export function RecruitForm({ recruit }: { recruit: Recruit | null }) {
  const [, action] = useActionState<FormState, FormData>(
    async (prev, formData) => {
      const result = await saveRecruit(prev, formData);
      notify(result);
      return result;
    },
    {},
  );
  const [open, setOpen] = useState(recruit?.is_open ?? false);
  const pair = (name: string): [string, string] => [
    String(recruit?.[`${name}_ko` as keyof Recruit] ?? ""),
    String(recruit?.[`${name}_en` as keyof Recruit] ?? ""),
  ];

  return (
    <form action={action} className={classNames("flex flex-col gap-3")}>
      <FormSection
        title="모집 상태"
        description="모집 중이면 Join 버튼이 지원 링크를 새 창으로 엽니다. 모집 중이 아니면 버튼을 누를 때 아래 안내가 모달로 뜹니다."
      >
        <div className={classNames("max-w-xl", "flex flex-col gap-6")}>
          <Switch
            label="모집 중"
            name="is_open"
            description={
              open
                ? "지금 Join 버튼은 지원 링크로 연결됩니다."
                : "지금 Join 버튼은 ‘모집 기간이 아닙니다’ 안내를 띄웁니다."
            }
            checked={open}
            onChange={(event) => setOpen(event.target.checked)}
          />
          <Field
            label={open ? "지원 링크 *" : "지원 링크"}
            name="apply_url"
            type="url"
            required={open}
            placeholder="https://"
            defaultValue={recruit?.apply_url ?? ""}
            hint="모집을 닫아도 링크는 남겨 둘 수 있습니다. 다시 열 때 그대로 씁니다."
          />
          {recruit?.apply_url ? (
            <a
              href={recruit.apply_url}
              target="_blank"
              rel="noreferrer"
              className={classNames(
                "self-start",
                "text-xs text-sub underline-offset-2 hover:text-main hover:underline",
              )}
            >
              저장된 링크 열어 보기 ↗
            </a>
          ) : null}
        </div>
      </FormSection>

      <FormSection
        title="Join 문구"
        description="사이트 홈 맨 아래 Join 구역에 보이는 문구입니다."
      >
        <BilingualField
          label="작은 제목"
          name="eyebrow"
          defaults={pair("eyebrow")}
        />
        <BilingualField
          label="큰 문구"
          name="title"
          multiline
          rows={2}
          defaults={pair("title")}
        />
        <BilingualField
          label="설명"
          name="description"
          multiline
          rows={3}
          defaults={pair("description")}
        />
        <BilingualField label="버튼 글자" name="cta" defaults={pair("cta")} />
      </FormSection>

      <FormSection
        title="모집 중이 아닐 때"
        description="모집을 닫아 두었을 때 Join 버튼을 누르면 뜨는 모달 문구입니다."
      >
        <div className={classNames("flex items-center gap-2")}>
          <Badge tone={open ? "muted" : "strong"} dot>
            {open ? "지금은 안 보임 (모집 중)" : "지금 보이는 중"}
          </Badge>
        </div>
        <BilingualField
          label="모달 제목"
          name="closed_title"
          defaults={pair("closed_title")}
        />
        <BilingualField
          label="모달 내용"
          name="closed_message"
          multiline
          rows={4}
          hint="줄바꿈이 그대로 보입니다."
          defaults={pair("closed_message")}
        />
      </FormSection>

      <div
        className={classNames(
          "sticky bottom-3 z-10",
          "flex justify-end",
          "p-2",
          "rounded-2xl bg-sheet/80 backdrop-blur-md",
        )}
      >
        <SubmitButton size="md" pendingText="저장 중…">
          저장
        </SubmitButton>
      </div>
    </form>
  );
}
