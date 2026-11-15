"use client";

import { useRouter } from "next/navigation";
import { useActionState, type ReactNode } from "react";
import { Button, type ButtonStyle } from "@repo/common";
import type { CreateState } from "@/app/actions/auth";
import { closeModal, openModal, type ModalOptions } from "@/libs/modal";
import { toast } from "@/libs/toast";

/**
 * 누르면 전역 모달을 여는 버튼.
 *   <ModalButton modal={{ title: "새 프로젝트", content: <NewProjectForm /> }}>새 프로젝트</ModalButton>
 */
export function ModalButton({
  modal,
  children,
  className,
  ...style
}: ButtonStyle & {
  modal: ModalOptions;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Button {...style} className={className} onClick={() => openModal(modal)}>
      {children}
    </Button>
  );
}

/**
 * 모달의 "만들기" 폼 상태. 만들고 나면 모달을 닫고 알림을 띄운 뒤,
 * href 를 주면 그 편집 화면으로 이동합니다. (주지 않으면 지금 화면이 새로 고쳐집니다)
 */
export function useCreateForm(
  create: (prev: CreateState, formData: FormData) => Promise<CreateState>,
  href?: (id: string) => string,
) {
  const router = useRouter();
  return useActionState<CreateState, FormData>(async (prev, formData) => {
    const result = await create(prev, formData);
    if (result.id) {
      closeModal();
      toast(result.message ?? "만들었습니다.");
      if (href) router.push(href(result.id));
    }
    return result;
  }, {});
}
