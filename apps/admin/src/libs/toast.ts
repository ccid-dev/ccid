/**
 * 전역 토스트 (오른쪽 위 알림). 화면 어디서든 부르면 <Toaster /> 가 띄웁니다.
 *   toast("저장했습니다.")
 *   toast.error("저장하지 못했습니다.")
 *   notify(result)  // 서버 액션 결과 { error?, message? } 를 그대로 알림으로
 */

export type ToastTone = "success" | "error";
export type ToastItem = { id: number; message: string; tone: ToastTone };

/** 한 번에 보이는 최대 개수 */
const MAX_TOASTS = 4;
/** 자동으로 닫히는 시간 (ms) */
const DURATION: Record<ToastTone, number> = { success: 3500, error: 6000 };

const EMPTY: ToastItem[] = [];
let items: ToastItem[] = EMPTY;
let nextId = 1;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((listener) => listener());

/** useSyncExternalStore 로 읽는 저장소 */
export const toastStore = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  getSnapshot: () => items,
  getServerSnapshot: () => EMPTY,
};

export function dismissToast(id: number) {
  items = items.filter((item) => item.id !== id);
  emit();
}

function show(message: string, tone: ToastTone) {
  const id = nextId++;
  items = [...items, { id, message, tone }].slice(-MAX_TOASTS);
  emit();
  setTimeout(() => dismissToast(id), DURATION[tone]);
  return id;
}

export const toast = Object.assign(
  (message: string) => show(message, "success"),
  { error: (message: string) => show(message, "error") },
);

/** 서버 액션 결과를 알림으로 (오류가 먼저) */
export function notify(result?: { error?: string; message?: string }) {
  if (result?.error) toast.error(result.error);
  else if (result?.message) toast(result.message);
}
