"use client";

import type { ButtonStyle } from "@repo/common";
import { ModalButton, useCreateForm } from "@/components/create";
import { BilingualField, ModalForm, Select } from "@/components/forms";
import { ROUTES } from "@/constants";
import {
  PERSON_CATEGORIES,
  PERSON_CATEGORY_LABEL,
  type PersonCategory,
} from "@/types";
import { createMyProfile, createPerson } from "./actions";
import type { AccountOption } from "./PersonForm";

function CategorySelect({ defaultValue }: { defaultValue?: PersonCategory }) {
  return (
    <Select
      label="그룹 *"
      name="category"
      required
      defaultValue={defaultValue ?? ""}
    >
      <option value="" disabled>
        고르세요
      </option>
      {PERSON_CATEGORIES.map((category) => (
        <option key={category} value={category}>
          {PERSON_CATEGORY_LABEL[category]}
        </option>
      ))}
    </Select>
  );
}

function NewPersonForm({
  category,
  accounts,
  accountId,
}: {
  category?: PersonCategory;
  accounts: AccountOption[];
  accountId?: string;
}) {
  const [state, action] = useCreateForm(
    createPerson,
    (id) => `${ROUTES.people}/${id}`,
  );
  return (
    <ModalForm action={action} error={state.error} submitLabel="만들고 편집">
      <BilingualField label="이름" name="name" required autoFocus />
      <CategorySelect defaultValue={category} />
      <Select
        label="Lab Member 계정"
        name="admin_user_id"
        defaultValue={accountId ?? ""}
        hint="연결하면 그 계정이 권한에 따라 이 프로필을 직접 고칠 수 있습니다."
      >
        <option value="">연결 안 함</option>
        {accounts.map((account) => (
          <option key={account.id} value={account.id}>
            {account.name || "(이름 없음)"} · {account.email}
          </option>
        ))}
      </Select>
    </ModalForm>
  );
}

/** 새 구성원 — 메인테이너 (모달 → 만들면 편집 화면으로) */
export function NewPersonButton({
  category,
  accounts,
  accountId,
  label = "새 구성원",
  title = "새 구성원",
  ...style
}: ButtonStyle & {
  category?: PersonCategory;
  accounts: AccountOption[];
  /** 미리 고를 계정 (내 프로필 만들기) */
  accountId?: string;
  label?: string;
  title?: string;
  className?: string;
}) {
  return (
    <ModalButton
      {...style}
      modal={{
        title,
        description:
          "비공개로 만들어집니다. 소개 · 사진 · 공개 여부는 편집 화면에서 정합니다.",
        content: (
          <NewPersonForm
            category={category}
            accounts={accounts}
            accountId={accountId}
          />
        ),
      }}
    >
      {label}
    </ModalButton>
  );
}

function NewMyProfileForm() {
  const [state, action] = useCreateForm(createMyProfile);
  return (
    <ModalForm action={action} error={state.error} submitLabel="만들기">
      <BilingualField label="이름" name="name" required autoFocus />
      <CategorySelect />
    </ModalForm>
  );
}

/** 내 프로필 만들기 — 일반 멤버 (모달 → 만들면 Profile 화면이 편집 화면으로 바뀜) */
export function NewMyProfileButton(style: ButtonStyle) {
  return (
    <ModalButton
      {...style}
      modal={{
        title: "내 프로필 만들기",
        description:
          "그룹은 처음에만 고르고, 이후에는 메인테이너가 정합니다. 메인테이너가 공개하면 사이트에 보입니다.",
        content: <NewMyProfileForm />,
      }}
    >
      프로필 만들기
    </ModalButton>
  );
}
