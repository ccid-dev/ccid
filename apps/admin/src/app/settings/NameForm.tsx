"use client";

import classNames from "classnames";
import { useActionState } from "react";
import type { FormState } from "@/app/actions/auth";
import { SubmitButton } from "@/components/forms";
import { notify } from "@/libs/toast";
import { updateMyName } from "./actions";

/** 내 계정 이름 바꾸기 (이름 칸 + 저장) */
export function NameForm({ name }: { name: string }) {
  const [, action] = useActionState<FormState, FormData>(
    async (prev, formData) => {
      const result = await updateMyName(prev, formData);
      notify(result);
      return result;
    },
    {},
  );
  return (
    <form action={action}>
      <div className={classNames("flex max-w-sm gap-2")}>
        <input
          name="name"
          defaultValue={name}
          required
          maxLength={40}
          autoComplete="name"
          aria-label="이름"
          className={classNames(
            "h-9 min-w-0 flex-1",
            "px-3",
            "rounded-lg border bg-field outline-none transition focus:border-black focus:bg-white",
            "text-base sm:text-sm",
          )}
        />
        <SubmitButton
          variant="outline"
          size="md"
          pendingText="저장 중…"
          className={classNames("h-9!")}
        >
          저장
        </SubmitButton>
      </div>
    </form>
  );
}
