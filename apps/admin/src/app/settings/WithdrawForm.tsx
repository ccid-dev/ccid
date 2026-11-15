"use client";

import classNames from "classnames";
import { useActionState } from "react";
import type { FormState } from "@/app/actions/auth";
import { Checkbox, FormMessage, SubmitButton } from "@/components/forms";
import { withdraw } from "./actions";

export function WithdrawForm({ profileName }: { profileName?: string }) {
  const [state, action] = useActionState<FormState, FormData>(withdraw, {});
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm("정말 탈퇴할까요? 계정은 되돌릴 수 없습니다."))
          e.preventDefault();
      }}
      className={classNames("flex flex-col gap-4")}
    >
      {profileName ? (
        <Checkbox
          name="delete_profile"
          label={`People 프로필(${profileName})도 함께 삭제`}
          description="고르지 않으면 프로필은 남고 계정 연결만 풀립니다. 사이트에서 빼려면 함께 삭제하세요."
        />
      ) : null}
      <FormMessage error={state.error} />
      <div>
        <SubmitButton
          variant="outline"
          size="md"
          pendingText="탈퇴하는 중…"
          className={classNames("text-red-700!")}
        >
          탈퇴하기
        </SubmitButton>
      </div>
    </form>
  );
}
