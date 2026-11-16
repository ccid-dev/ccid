"use client";

import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import classNames from "classnames";
import Link from "next/link";
import { useState, useTransition } from "react";
import { CroppedImage } from "@repo/blocks";
import { Badge, PublishBadge } from "@/components/ui";
import { ROUTES } from "@/constants";
import { notify } from "@/libs/toast";
import { reorderPeople } from "./actions";

/** 목록 한 줄에 필요한 값 */
export type PersonRow = {
  id: string;
  name: string;
  nameEn: string;
  role: string;
  image: string | null;
  published: boolean;
  /** "나" · "계정" · 없음 */
  account: string;
};

function Row({ person }: { person: PersonRow }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: person.id });

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={classNames("relative", {
        "z-10 rounded-xl bg-white shadow-lg": isDragging,
      })}
    >
      <div className={classNames("flex items-center", "pl-3")}>
        {/* 끌기 손잡이 (키보드: 스페이스로 잡고 ↑↓ 로 옮김) */}
        <button
          ref={setActivatorNodeRef}
          type="button"
          aria-label={`${person.name} 순서 옮기기`}
          {...attributes}
          {...listeners}
          className={classNames(
            "size-8 shrink-0",
            "flex items-center justify-center",
            "cursor-grab touch-none rounded-md text-mute transition hover:bg-white hover:text-main active:cursor-grabbing",
            "text-base leading-none",
          )}
        >
          ⠿
        </button>
        <Link
          href={`${ROUTES.people}/${person.id}`}
          className={classNames(
            "min-w-0 flex-1",
            "grid grid-cols-[36px_1fr_auto] items-center gap-x-4 md:grid-cols-[36px_1fr_1fr_auto]",
            "py-3 pr-8 pl-2",
            "rounded-xl transition hover:bg-sheet",
          )}
        >
          <span
            className={classNames(
              "aspect-profile w-9",
              "relative overflow-hidden",
              "rounded-md bg-white",
            )}
          >
            {person.image ? <CroppedImage src={person.image} alt="" /> : null}
          </span>
          <span className={classNames("min-w-0")}>
            <span
              className={classNames("block", "truncate text-sm font-medium")}
            >
              {person.name}
            </span>
            {person.nameEn ? (
              <span
                className={classNames(
                  "block",
                  "truncate font-neuehaas text-xs text-sub",
                )}
              >
                {person.nameEn}
              </span>
            ) : null}
          </span>
          <span
            className={classNames(
              "hidden md:block",
              "line-clamp-1 text-sm text-sub",
            )}
          >
            {person.role}
          </span>
          <span className={classNames("flex gap-1.5")}>
            {person.account ? <Badge>{person.account}</Badge> : null}
            <PublishBadge published={person.published} />
          </span>
        </Link>
      </div>
    </li>
  );
}

/** 한 그룹의 구성원 목록. 손잡이(⠿)를 끌어 순서를 바꾸면 바로 저장합니다. (사이트 순서 = 이 순서) */
export function SortablePeople({ people }: { people: PersonRow[] }) {
  const [rows, setRows] = useState(people);
  const [, startTransition] = useTransition();
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const next = arrayMove(
      rows,
      rows.findIndex((row) => row.id === active.id),
      rows.findIndex((row) => row.id === over.id),
    );
    setRows(next);
    startTransition(async () => {
      const result = await reorderPeople(next.map((row) => row.id));
      notify(result);
      if (result.error) setRows(rows);
    });
  };

  if (!rows.length)
    return (
      <p className={classNames("px-8 py-6", "text-sm text-mute")}>
        아직 없습니다.
      </p>
    );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={onDragEnd}
    >
      <SortableContext
        items={rows.map((row) => row.id)}
        strategy={verticalListSortingStrategy}
      >
        <ul className={classNames("flex flex-col", "md:py-3")}>
          {rows.map((person) => (
            <Row key={person.id} person={person} />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}
