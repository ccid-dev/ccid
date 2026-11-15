"use client";

import classNames from "classnames";
import { useActionState } from "react";
import type { FormState } from "@/app/actions/auth";
import { Field, FormMessage, SubmitButton } from "@/components/forms";
import { MIN_PASSWORD_LENGTH } from "@/constants";
import { updatePassword } from "./actions";

export function ResetPasswordForm() {
  const [state, action] = useActionState<FormState, FormData>(
    updatePassword,
    {},
  );
  return (
    <form action={action} className={classNames("flex flex-col gap-4")}>
      <Field
        label="새 비밀번호"
        name="password"
        type="password"
        autoComplete="new-password"
        minLength={MIN_PASSWORD_LENGTH}
        hint={`${MIN_PASSWORD_LENGTH}자 이상`}
        required
      />
      <Field
        label="새 비밀번호 확인"
        name="confirm"
        type="password"
        autoComplete="new-password"
        minLength={MIN_PASSWORD_LENGTH}
        required
      />
      <FormMessage error={state.error} />
      <SubmitButton
        pendingText="바꾸는 중…"
        block
        className={classNames("mt-2")}
      >
        비밀번호 바꾸기
      </SubmitButton>
    </form>
  );
}
