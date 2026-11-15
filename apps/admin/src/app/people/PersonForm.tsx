"use client";

import {
  EditorForm,
  EditorSection,
  InspectorSection,
  PropertyRow,
  useEditorActions,
} from "@/components/editor";
import { BilingualField, Field, Select, Switch } from "@/components/forms";
import { ImageField } from "@/components/ImageFields";
import { Badge, PublishBadge } from "@/components/ui";
import { ROUTES } from "@/constants";
import {
  PERSON_CATEGORIES,
  PERSON_CATEGORY_LABEL,
  type Person,
  type PersonCategory,
} from "@/types";
import { deletePerson, saveMyProfile, savePerson } from "./actions";

/** 계정 연결 고르기에 쓰는 계정 */
export type AccountOption = { id: string; name: string; email: string };

/**
 * 구성원 편집 (왼쪽 이름 · 소개 · 사진, 오른쪽 속성).
 * - mode="master": 그룹 · 공개 · 순서 · 계정 연결 · 삭제까지
 * - mode="self"  : 본인 프로필. 그룹 · 공개 여부는 읽기만 (메인테이너가 정함)
 */
export function PersonForm({
  person,
  mode = "master",
  accounts = [],
  isMine = false,
}: {
  person: Person;
  mode?: "master" | "self";
  /** master: 연결할 수 있는 계정 (다른 구성원과 연결되지 않은 계정 + 지금 연결된 계정) */
  accounts?: AccountOption[];
  /** 내 계정과 연결된 프로필인지 (제목 옆 표시) */
  isMine?: boolean;
}) {
  const isMaster = mode === "master";
  const { action, onDelete, deleting } = useEditorActions(
    isMaster
      ? {
          save: savePerson.bind(null, person.id),
          remove: () => deletePerson(person.id),
          confirmDelete: "이 구성원을 삭제할까요? 되돌릴 수 없습니다.",
          listHref: ROUTES.people,
        }
      : { save: saveMyProfile },
  );
  const pair = (ko: string, en: string): [string, string] => [ko, en];

  return (
    <EditorForm
      action={action}
      back={
        isMaster
          ? { href: ROUTES.people, label: "People" }
          : { href: ROUTES.home, label: "Home" }
      }
      title={person.name_ko || person.name_en || "이름 없음"}
      status={
        <>
          {isMine && isMaster ? <Badge tone="strong">내 프로필</Badge> : null}
          {!isMine && person.admin_user_id ? <Badge>계정 연결됨</Badge> : null}
          <PublishBadge published={person.is_published} />
        </>
      }
      onDelete={onDelete}
      deleting={deleting}
      inspector={
        isMaster ? (
          <>
            <InspectorSection title="공개">
              <Switch
                label="사이트에 공개"
                name="is_published"
                defaultChecked={person.is_published}
              />
              <Field
                label="순서"
                name="sort_order"
                type="number"
                defaultValue={person.sort_order}
                hint="같은 그룹 안에서 작을수록 앞"
              />
            </InspectorSection>
            <InspectorSection title="그룹">
              <Select
                label="그룹 *"
                name="category"
                required
                defaultValue={person.category}
              >
                {PERSON_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {PERSON_CATEGORY_LABEL[category]}
                  </option>
                ))}
              </Select>
            </InspectorSection>
            <InspectorSection
              title="계정 연결"
              description="연결된 계정은 권한이 있으면 Profile 에서 이 프로필을 직접 고칠 수 있습니다. 한 계정은 한 구성원에만 연결됩니다."
            >
              <Select
                label="Lab Member 계정"
                name="admin_user_id"
                defaultValue={person.admin_user_id ?? ""}
              >
                <option value="">연결 안 함</option>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name || "(이름 없음)"} · {account.email}
                  </option>
                ))}
              </Select>
            </InspectorSection>
          </>
        ) : (
          <InspectorSection
            title="공개 상태"
            description="그룹 · 공개 여부 · 순서는 메인테이너가 정합니다. 바꿔야 하면 메인테이너에게 요청해 주세요."
          >
            <PropertyRow label="그룹">
              {PERSON_CATEGORY_LABEL[person.category as PersonCategory]}
            </PropertyRow>
            <PropertyRow label="사이트">
              {person.is_published ? "공개 중" : "비공개"}
            </PropertyRow>
          </InspectorSection>
        )
      }
    >
      <EditorSection title="기본 정보">
        <BilingualField
          label="이름"
          name="name"
          required
          defaults={pair(person.name_ko, person.name_en)}
        />
        <BilingualField
          label="직함 · 전문 분야"
          name="role"
          multiline
          rows={2}
          defaults={pair(person.role_ko, person.role_en)}
        />
      </EditorSection>

      <EditorSection title="소개">
        <BilingualField
          label="짧은 약력"
          name="bio"
          multiline
          rows={4}
          hint="카드에 보이는 내용. 줄바꿈이 그대로 반영됩니다."
          defaults={pair(person.bio_ko, person.bio_en)}
        />
        <BilingualField
          label="긴 소개"
          name="profile"
          multiline
          rows={8}
          hint="있으면 '약력 전체 보기'로 펼쳐집니다. 문단은 빈 줄로 나눕니다."
          defaults={pair(person.profile_ko, person.profile_en)}
        />
      </EditorSection>

      <EditorSection title="사진">
        <ImageField
          label="사진"
          name="image"
          folder="people"
          defaultValue={person.image}
          hint="세로 3:4 비율을 권장합니다."
        />
      </EditorSection>
    </EditorForm>
  );
}
