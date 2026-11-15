"use client";

import classNames from "classnames";
import { useActionState } from "react";
import { signIn, type FormState } from "@/app/actions/auth";
import { Field, FormMessage, SubmitButton } from "@/components/forms";

export function LoginForm() {
  const [state, action] = useActionState<FormState, FormData>(signIn, {});
  return (
    <form action={action} className={classNames("flex flex-col gap-4")}>
      <Field
        label="이메일"
        name="email"
        type="email"
        autoComplete="email"
        required
      />
      <Field
        label="비밀번호"
        name="password"
        type="password"
        autoComplete="current-password"
        required
      />
      <FormMessage error={state.error} />
      <SubmitButton
        pendingText="로그인 중…"
        block
        className={classNames("mt-2")}
      >
        로그인
      </SubmitButton>
    </form>
  );
}
