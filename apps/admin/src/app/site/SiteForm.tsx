"use client";

import classNames from "classnames";
import { useActionState } from "react";
import type { FormState } from "@/app/actions/auth";
import { Field, FormSection, SubmitButton } from "@/components/forms";
import { notify } from "@/libs/toast";
import { saveSiteSettings } from "./actions";

/** 사이트 설정 폼 — 지금은 Join 링크 하나 */
export function SiteForm({ joinUrl }: { joinUrl: string }) {
  const [, action] = useActionState<FormState, FormData>(
    async (prev, formData) => {
      const result = await saveSiteSettings(prev, formData);
      notify(result);
      return result;
    },
    {},
  );

  return (
    <form action={action} className={classNames("flex flex-col gap-3")}>
      <FormSection
        title="Join"
        description="홈과 People 맨 아래 Join 구역의 ‘참여 및 채용 안내’ 버튼이 여는 주소입니다. 비우면 버튼이 숨겨집니다."
      >
        <div className={classNames("max-w-xl", "flex flex-col gap-4")}>
          <Field
            label="참여 · 채용 안내 링크"
            name="join_url"
            type="url"
            placeholder="https://"
            defaultValue={joinUrl}
          />
          {joinUrl ? (
            <a
              href={joinUrl}
              target="_blank"
              rel="noreferrer"
              className={classNames(
                "self-start",
                "text-xs text-sub underline-offset-2 hover:text-main hover:underline",
              )}
            >
              지금 링크 열어 보기 ↗
            </a>
          ) : null}
          <div>
            <SubmitButton size="md" pendingText="저장 중…">
              저장
            </SubmitButton>
          </div>
        </div>
      </FormSection>
    </form>
  );
}
