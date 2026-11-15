"use client";

import classNames from "classnames";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useId, useSyncExternalStore } from "react";
import { Sheet } from "react-modal-sheet";
import { Button } from "@repo/common";
import { useMediaQuery } from "@/hooks";
import { closeModal, modalStore, type ModalOptions } from "@/libs/modal";

/** 모달 머리 (제목 · 설명 · 닫기) + 내용 */
function ModalBody({
  options,
  titleId,
  closable,
}: {
  options: ModalOptions;
  titleId: string;
  closable: boolean;
}) {
  return (
    <>
      <div className={classNames("flex items-start justify-between gap-4")}>
        <div className={classNames("min-w-0")}>
          <h2
            id={titleId}
            className={classNames(
              "font-neuehaas text-2xl leading-tight font-medium tracking-[-0.02em]",
            )}
          >
            {options.title}
          </h2>
          {options.description ? (
            <p className={classNames("mt-1.5", "text-sm leading-6 text-sub")}>
              {options.description}
            </p>
          ) : null}
        </div>
        {closable ? (
          <Button variant="ghost" size="sm" onClick={closeModal}>
            닫기
          </Button>
        ) : null}
      </div>
      <div className={classNames("mt-7")}>{options.content}</div>
    </>
  );
}

/**
 * 전역 모달을 그리는 곳. 레이아웃에 한 번만 둡니다.
 * - 768px 이상: 가운데 창 (흐린 바탕 · Esc · 바깥 누르면 닫힘)
 * - 그보다 좁으면: 바텀시트 (react-modal-sheet, 끌어내려 닫기)
 */
export function ModalRoot() {
  const { open, options, key } = useSyncExternalStore(
    modalStore.subscribe,
    modalStore.getSnapshot,
    modalStore.getServerSnapshot,
  );
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const titleId = useId();

  // 넓은 화면: Esc 로 닫기 · 뒤 화면 스크롤 막기 (바텀시트는 라이브러리가 처리)
  useEffect(() => {
    if (!open || !isDesktop) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeModal();
    };
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, isDesktop]);

  if (isDesktop === null || !options) return null;

  if (!isDesktop)
    return (
      <Sheet
        isOpen={open}
        onClose={closeModal}
        detent="content"
        className={classNames("z-50")}
      >
        <Sheet.Container
          unstyled
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          className={classNames("rounded-t-3xl bg-white shadow-2xl")}
        >
          <Sheet.Header />
          <Sheet.Content
            scrollClassName={classNames(
              "px-5 pt-1 pb-[calc(env(safe-area-inset-bottom)+1.5rem)]",
            )}
          >
            <ModalBody
              key={key}
              options={options}
              titleId={titleId}
              closable={false}
            />
          </Sheet.Content>
        </Sheet.Container>
        <Sheet.Backdrop
          unstyled
          aria-label="닫기"
          onTap={closeModal}
          className={classNames("bg-black/30 backdrop-blur-sm")}
        />
      </Sheet>
    );

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          key={key}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className={classNames(
            "fixed inset-0 z-50 flex items-center justify-center",
            "p-6",
          )}
        >
          <div
            aria-hidden
            onClick={closeModal}
            className={classNames(
              "absolute inset-0",
              "bg-black/30 backdrop-blur-sm",
            )}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 420, damping: 34 }}
            className={classNames(
              "max-h-full w-full max-w-xl",
              "relative overflow-y-auto",
              "p-8",
              "rounded-3xl bg-white shadow-2xl",
            )}
          >
            <ModalBody options={options} titleId={titleId} closable />
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
