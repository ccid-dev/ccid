import type { ReactNode } from "react";

/**
 * 전역 모달. 넓은 화면에서는 가운데 창, 좁은 화면에서는 바텀시트로 뜹니다. (<ModalRoot />)
 *   openModal({ title: "새 프로젝트", content: <NewProjectForm /> })
 *   closeModal()
 */
export type ModalOptions = {
  title: string;
  description?: ReactNode;
  content: ReactNode;
};

type ModalState = {
  open: boolean;
  /** 닫히는 동안에도 내용을 보여 주려고 닫은 뒤에도 남겨 둡니다. */
  options: ModalOptions | null;
  /** 열 때마다 바뀌어서 안의 폼을 새로 시작합니다. */
  key: number;
};

const CLOSED: ModalState = { open: false, options: null, key: 0 };
let state: ModalState = CLOSED;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((listener) => listener());

export const modalStore = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  getSnapshot: () => state,
  getServerSnapshot: () => CLOSED,
};

export function openModal(options: ModalOptions) {
  state = { open: true, options, key: state.key + 1 };
  emit();
}

export function closeModal() {
  if (!state.open) return;
  state = { ...state, open: false };
  emit();
}
