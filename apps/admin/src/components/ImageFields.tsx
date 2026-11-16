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
  rectSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  useCallback,
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type ReactNode,
} from "react";
import classNames from "classnames";
import { CroppedImage, splitCrop, withCrop, type CropArea } from "@repo/blocks";
import {
  Button,
  IMAGE_ASPECTS,
  IMAGE_RATIOS,
  LoadingOverlay,
  type ImageRatio,
} from "@repo/common";
import { mediaUrl } from "@/libs/media";
import { toast } from "@/libs/toast";
import { useMarkDirty } from "./editor";
import { ImageEditor } from "./ImageEditor";
import {
  formatBytes,
  UPLOAD_FORMATS,
  uploadImage,
  type UploadFormat,
} from "@/libs/upload";

const RATIO_LABEL: Record<ImageRatio, string> = {
  thumbnail: "4:3",
  banner: "16:9",
  profile: "3:4",
};

/** 미리보기 (크롭 반영 · 주소가 없으면 키만 적은 회색 상자) */
function Preview({ value, className }: { value: string; className: string }) {
  const url = mediaUrl(value);
  return (
    <div className={classNames(className)}>
      {url ? (
        <CroppedImage src={url} alt="" />
      ) : (
        <span
          className={classNames(
            "absolute inset-0 flex items-center justify-center",
            "p-2",
            "text-center text-[10px] break-all text-sub",
          )}
        >
          {splitCrop(value).key}
        </span>
      )}
    </div>
  );
}

/** 이미지 위에 놓이는 작은 네모 버튼 (편집 · 빼기) */
function IconButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      // 끌어서 순서 바꾸기와 겹치지 않게
      onPointerDown={(event) => event.stopPropagation()}
      className={classNames(
        "h-7 min-w-7",
        "flex items-center justify-center",
        "px-2",
        "rounded-md bg-white/90 shadow-sm backdrop-blur transition hover:bg-white",
        "text-xs leading-none font-medium",
      )}
    >
      {children}
    </button>
  );
}

/** 업로드 형식 고르기: WebP(자동 최적화) · PNG · GIF — 회색 칸 안의 버튼 묶음 */
function FormatPicker({
  value,
  onChange,
}: {
  value: UploadFormat;
  onChange: (format: UploadFormat) => void;
}) {
  const name = useId();
  const current = UPLOAD_FORMATS.find((f) => f.value === value);
  return (
    <fieldset className={classNames("flex flex-wrap items-center gap-3")}>
      <legend className={classNames("sr-only")}>업로드 형식</legend>
      <div
        className={classNames(
          "inline-flex gap-0.5",
          "p-1",
          "rounded-xl bg-white",
        )}
      >
        {UPLOAD_FORMATS.map((format) => (
          <label
            key={format.value}
            className={classNames(
              "h-7",
              "flex items-center",
              "px-3",
              [
                "cursor-pointer rounded-lg transition has-focus-visible:ring-2 has-focus-visible:ring-black",
                value === format.value ? "bg-sheet" : "",
              ],
              [
                "font-neuehaas text-xs font-medium",
                value === format.value ? "text-main" : "text-sub",
              ],
            )}
          >
            <input
              type="radio"
              name={name}
              value={format.value}
              checked={value === format.value}
              onChange={() => onChange(format.value)}
              className={classNames("sr-only")}
            />
            {format.label}
          </label>
        ))}
      </div>
      <span className={classNames("text-xs text-sub")}>
        {current?.description}
      </span>
    </fieldset>
  );
}

/**
 * 크롭 도구를 약속(Promise)처럼 씁니다.
 *   const crop = await edit(주소, 지금 크롭, "1 / 3")  → 적용하면 영역, 취소하면 null
 */
function useImageEditor(ratio: ImageRatio) {
  const [editing, setEditing] = useState<{
    src: string;
    initial: CropArea | null;
    step?: string;
    resolve: (crop: CropArea | null) => void;
  } | null>(null);

  const edit = useCallback(
    (src: string, initial: CropArea | null = null, step?: string) =>
      new Promise<CropArea | null>((resolve) =>
        setEditing({ src, initial, step, resolve }),
      ),
    [],
  );

  const finish = (crop: CropArea | null) => {
    editing?.resolve(crop);
    setEditing(null);
  };

  const editor = editing ? (
    <ImageEditor
      key={editing.src}
      src={editing.src}
      aspect={IMAGE_ASPECTS[ratio]}
      aspectLabel={RATIO_LABEL[ratio]}
      initial={editing.initial}
      step={editing.step}
      onCancel={() => finish(null)}
      onApply={(crop) => finish(crop)}
    />
  ) : null;

  return { edit, editor };
}

/**
 * 파일 고르기 → 크롭 도구 → 최적화 → 업로드. 올리는 동안 로딩 팝업을 띄웁니다.
 * 원본(최적화본)을 올리고, 고른 영역은 키 끝에 #crop=… 으로 적습니다.
 * 크롭 도구에서 취소한 파일은 올리지 않습니다.
 */
function useUpload(
  folder: string,
  ratio: ImageRatio,
  onUploaded: (values: string[]) => void,
) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [format, setFormat] = useState<UploadFormat>("webp");
  const [progress, setProgress] = useState<{
    index: number;
    total: number;
    name: string;
  }>();
  const markDirty = useMarkDirty();
  const { edit, editor } = useImageEditor(ratio);

  const accept = UPLOAD_FORMATS.find((f) => f.value === format)!.accept;

  const onChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = [...(event.target.files ?? [])];
    event.target.value = "";
    if (!files.length) return;

    // 1. 한 장씩 크롭 영역 고르기
    const picked: { file: File; crop: CropArea }[] = [];
    for (const [index, file] of files.entries()) {
      const preview = URL.createObjectURL(file);
      const crop = await edit(
        preview,
        null,
        files.length > 1 ? `${index + 1} / ${files.length}` : undefined,
      );
      URL.revokeObjectURL(preview);
      if (crop) picked.push({ file, crop });
    }
    if (!picked.length) return;

    // 2. 올리기
    const values: string[] = [];
    let before = 0;
    let after = 0;
    try {
      for (const [index, { file, crop }] of picked.entries()) {
        setProgress({
          index: index + 1,
          total: picked.length,
          name: file.name,
        });
        const uploaded = await uploadImage(file, folder, format);
        values.push(withCrop(uploaded.key, crop));
        before += uploaded.originalSize;
        after += uploaded.size;
      }
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "이미지를 올리지 못했습니다.",
      );
    } finally {
      setProgress(undefined);
      if (values.length) {
        onUploaded(values);
        markDirty();
        toast(
          `${values.length}장 올림 · ${formatBytes(before)} → ${formatBytes(after)}`,
        );
      }
    }
  };

  /** 이미 올린 이미지의 크롭 다시 고르기 (원본 그대로) */
  const recrop = async (value: string) => {
    const { key, crop } = splitCrop(value);
    const url = mediaUrl(key);
    if (!url) return null;
    const next = await edit(url, crop);
    if (!next) return null;
    markDirty();
    return withCrop(key, next);
  };

  const overlay = (
    <>
      <LoadingOverlay
        open={Boolean(progress)}
        message={
          format === "webp"
            ? "이미지를 최적화해서 올리는 중"
            : "이미지를 올리는 중"
        }
        detail={
          progress
            ? `${progress.index} / ${progress.total} · ${progress.name}`
            : undefined
        }
      />
      {editor}
    </>
  );
  const fileInput = (multiple: boolean) => (
    <input
      ref={inputRef}
      type="file"
      accept={accept}
      multiple={multiple}
      onChange={onChange}
      className={classNames("hidden")}
    />
  );
  return {
    open: () => inputRef.current?.click(),
    uploading: Boolean(progress),
    format,
    setFormat,
    overlay,
    fileInput,
    markDirty,
    recrop,
  };
}

/** 라벨 (forms.tsx 의 라벨과 같은 모양) */
function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <span className={classNames("text-xs font-medium text-sub")}>
      {children}
    </span>
  );
}

/**
 * 이미지 한 장 (구성원 사진 등). 고르면 크롭 도구가 뜨고, 올린 뒤에도 "편집"으로 다시 고릅니다.
 * 폼에는 name 으로 "키#crop=…" 이 전송됩니다.
 */
export function ImageField({
  label,
  name,
  folder,
  ratio = "profile",
  defaultValue = "",
  hint,
}: {
  label: string;
  name: string;
  folder: string;
  /** 크롭 · 미리보기 비율 (사이트에서 보이는 비율과 같게) */
  ratio?: ImageRatio;
  defaultValue?: string;
  hint?: string;
}) {
  const [value, setValue] = useState(defaultValue);
  const upload = useUpload(folder, ratio, ([next]) => setValue(next ?? ""));

  return (
    <div className={classNames("flex flex-col gap-3")}>
      <FieldLabel>{label}</FieldLabel>
      <input type="hidden" name={name} value={value} />
      <div className={classNames("flex flex-wrap items-start gap-5")}>
        {value ? (
          <div className={classNames("w-36", "relative shrink-0")}>
            <Preview
              value={value}
              className={classNames(
                ["w-full", IMAGE_RATIOS[ratio]],
                "relative overflow-hidden",
                "rounded-2xl bg-white",
              )}
            />
            <div className={classNames("absolute top-2 right-2", "flex gap-1")}>
              <IconButton
                label="편집"
                onClick={async () => {
                  const next = await upload.recrop(value);
                  if (next) setValue(next);
                }}
              >
                편집
              </IconButton>
              <IconButton
                label="빼기"
                onClick={() => {
                  setValue("");
                  upload.markDirty();
                }}
              >
                ×
              </IconButton>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={upload.open}
            disabled={upload.uploading}
            className={classNames(
              ["w-36 shrink-0", IMAGE_RATIOS[ratio]],
              "flex flex-col items-center justify-center gap-1",
              "rounded-2xl border border-dashed border-gray-300 bg-white/60 transition hover:border-black",
              "text-xs text-sub",
            )}
          >
            <span className={classNames("text-xl leading-none")}>+</span>
            사진 올리기
          </button>
        )}
        <div className={classNames("min-w-0 flex-1", "flex flex-col gap-3")}>
          <FormatPicker value={upload.format} onChange={upload.setFormat} />
          <div>
            <Button
              variant="outline"
              size="sm"
              onClick={upload.open}
              disabled={upload.uploading}
            >
              {value ? "다른 사진으로 바꾸기" : "파일 고르기"}
            </Button>
          </div>
          {hint ? (
            <p className={classNames("text-xs text-mute")}>{hint}</p>
          ) : null}
        </div>
      </div>
      {upload.fileInput(false)}
      {upload.overlay}
    </div>
  );
}

/** 여러 장 목록의 한 칸: 끌어서 순서 바꾸기 · 편집 · 빼기 */
function SortableTile({
  value,
  index,
  ratio,
  onEdit,
  onRemove,
}: {
  value: string;
  index: number;
  ratio: ImageRatio;
  onEdit: () => void;
  onRemove: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: value });
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...attributes}
      {...listeners}
      aria-label={`이미지 ${index + 1} — 끌어서 순서를 바꿉니다`}
      className={classNames(
        "relative",
        "cursor-grab touch-none outline-none active:cursor-grabbing",
        "rounded-2xl focus-visible:ring-2 focus-visible:ring-black",
        { "z-10 opacity-80 shadow-xl": isDragging },
      )}
    >
      <Preview
        value={value}
        className={classNames(
          ["w-full", IMAGE_RATIOS[ratio]],
          "relative overflow-hidden",
          "rounded-2xl bg-white",
          "pointer-events-none",
        )}
      />
      <span
        className={classNames(
          "h-6",
          "absolute top-2 left-2 inline-flex items-center",
          "px-2",
          [
            "rounded-full",
            index === 0 ? "bg-black" : "bg-white/90 backdrop-blur",
          ],
          [
            "font-neuehaas text-[11px] font-medium",
            index === 0 ? "text-white" : "text-main",
          ],
        )}
      >
        {index === 0 ? "대표" : String(index + 1).padStart(2, "0")}
      </span>
      <div className={classNames("absolute top-2 right-2", "flex gap-1")}>
        <IconButton label="편집" onClick={onEdit}>
          편집
        </IconButton>
        <IconButton label="빼기" onClick={onRemove}>
          ×
        </IconButton>
      </div>
    </li>
  );
}

/**
 * 이미지 여러 장 (분야 이미지 등). 첫 번째가 대표 이미지이고, 끌어서 순서를 바꿉니다.
 * 고르면 한 장씩 크롭 도구가 뜨고, 올린 뒤에도 "편집"으로 다시 고릅니다.
 * 폼에는 같은 name 으로 순서대로 전송됩니다. (formData.getAll(name))
 */
export function ImageListField({
  label,
  name,
  folder,
  ratio = "thumbnail",
  defaultValue = [],
  hint,
}: {
  label: string;
  name: string;
  folder: string;
  ratio?: ImageRatio;
  defaultValue?: string[];
  hint?: string;
}) {
  const [items, setItems] = useState(defaultValue);
  const upload = useUpload(folder, ratio, (values) =>
    setItems((prev) => [...prev, ...values]),
  );
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    setItems((prev) =>
      arrayMove(
        prev,
        prev.indexOf(String(active.id)),
        prev.indexOf(String(over.id)),
      ),
    );
    upload.markDirty();
  };

  return (
    <div className={classNames("flex flex-col gap-3")}>
      <div
        className={classNames(
          "flex flex-wrap items-center justify-between gap-3",
        )}
      >
        <FieldLabel>
          {label} · {items.length}장
        </FieldLabel>
        <FormatPicker value={upload.format} onChange={upload.setFormat} />
      </div>
      {items.map((item) => (
        <input key={item} type="hidden" name={name} value={item} />
      ))}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={onDragEnd}
      >
        <SortableContext items={items} strategy={rectSortingStrategy}>
          <ul className={classNames("grid grid-cols-2 gap-2 sm:grid-cols-3")}>
            {items.map((item, index) => (
              <SortableTile
                key={item}
                value={item}
                index={index}
                ratio={ratio}
                onEdit={async () => {
                  const next = await upload.recrop(item);
                  if (next)
                    setItems((prev) =>
                      prev.map((value) => (value === item ? next : value)),
                    );
                }}
                onRemove={() => {
                  upload.markDirty();
                  setItems((prev) => prev.filter((value) => value !== item));
                }}
              />
            ))}
            <li>
              <button
                type="button"
                onClick={upload.open}
                disabled={upload.uploading}
                className={classNames(
                  ["w-full", IMAGE_RATIOS[ratio]],
                  "flex flex-col items-center justify-center gap-1",
                  "rounded-2xl border border-dashed border-gray-300 bg-white/60 transition hover:border-black disabled:opacity-50",
                  "text-xs text-sub",
                )}
              >
                <span className={classNames("text-xl leading-none")}>+</span>
                이미지 올리기
              </button>
            </li>
          </ul>
        </SortableContext>
      </DndContext>
      {hint ? <p className={classNames("text-xs text-mute")}>{hint}</p> : null}
      {upload.fileInput(true)}
      {upload.overlay}
    </div>
  );
}
