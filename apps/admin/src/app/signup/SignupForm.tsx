"use client";

import classNames from "classnames";
import { useActionState } from "react";
import { signUp, type FormState } from "@/app/actions/auth";
import { Field, FormMessage, SubmitButton } from "@/components/forms";
import { MIN_PASSWORD_LENGTH } from "@/constants";

export function SignupForm() {
  const [state, action] = useActionState<FormState, FormData>(signUp, {});
  return (
    <form action={action} className={classNames("flex flex-col gap-4")}>
      <Field label="이름" name="name" autoComplete="name" required />
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
        autoComplete="new-password"
        minLength={MIN_PASSWORD_LENGTH}
        hint={`${MIN_PASSWORD_LENGTH}자 이상`}
        required
      />
      <FormMessage error={state.error} />
      <SubmitButton pendingText="가입 중…" block className={classNames("mt-2")}>
        가입하기
      </SubmitButton>
    </form>
  );
}
