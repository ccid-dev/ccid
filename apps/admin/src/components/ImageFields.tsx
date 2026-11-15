"use client";

import {
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type ReactNode,
} from "react";
import classNames from "classnames";
import { Button, LoadingOverlay } from "@repo/common";
import { mediaUrl } from "@/libs/media";
import { toast } from "@/libs/toast";
import { useMarkDirty } from "./editor";
import {
  formatBytes,
  UPLOAD_FORMATS,
  uploadImage,
  type UploadFormat,
} from "@/libs/upload";

/** 미리보기 (주소가 없으면 키만 적은 회색 상자) */
function Preview({ value, className }: { value: string; className: string }) {
  const url = mediaUrl(value);
  return (
    <div className={classNames(className)}>
      {url ? (
        <img
          src={url}
          alt=""
          loading="lazy"
          decoding="async"
          className={classNames("size-full", "absolute inset-0 object-cover")}
        />
      ) : (
        <span
          className={classNames(
            "absolute inset-0 flex items-center justify-center",
            "p-2",
            "text-center text-[10px] break-all text-sub",
          )}
        >
          {value}
        </span>
      )}
    </div>
  );
}

/** 이미지 위에 놓이는 작은 네모 버튼 (←, →, ×) */
function IconButton({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className={classNames(
        "size-7",
        "flex items-center justify-center",
        "rounded-md bg-white/90 shadow-sm backdrop-blur transition hover:bg-white disabled:opacity-30",
        "text-sm leading-none",
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

/** 파일 고르기 → 최적화 → 업로드. 진행 중에는 로딩 팝업을 띄웁니다. */
function useUpload(folder: string, onUploaded: (keys: string[]) => void) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [format, setFormat] = useState<UploadFormat>("webp");
  const [progress, setProgress] = useState<{
    index: number;
    total: number;
    name: string;
  }>();
  const markDirty = useMarkDirty();

  const accept = UPLOAD_FORMATS.find((f) => f.value === format)!.accept;

  const onChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = [...(event.target.files ?? [])];
    event.target.value = "";
    if (!files.length) return;
    const keys: string[] = [];
    let before = 0;
    let after = 0;
    try {
      for (const [index, file] of files.entries()) {
        setProgress({ index: index + 1, total: files.length, name: file.name });
        const uploaded = await uploadImage(file, folder, format);
        keys.push(uploaded.key);
        before += uploaded.originalSize;
        after += uploaded.size;
      }
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "이미지를 올리지 못했습니다.",
      );
    } finally {
      setProgress(undefined);
      if (keys.length) {
        onUploaded(keys);
        markDirty();
        toast(
          `${keys.length}장 올림 · ${formatBytes(before)} → ${formatBytes(after)}`,
        );
      }
    }
  };

  const overlay = (
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
 * 이미지 한 장 (구성원 사진 등). 폼에는 name 으로 키가 전송됩니다.
 */
export function ImageField({
  label,
  name,
  folder,
  defaultValue = "",
  hint,
}: {
  label: string;
  name: string;
  folder: string;
  defaultValue?: string;
  hint?: string;
}) {
  const [value, setValue] = useState(defaultValue);
  const upload = useUpload(folder, ([key]) => setValue(key ?? ""));

  return (
    <div className={classNames("flex flex-col gap-3")}>
      <FieldLabel>{label}</FieldLabel>
      <input type="hidden" name={name} value={value} />
      <div className={classNames("flex flex-wrap items-start gap-5")}>
        {value ? (
          <div className={classNames("relative", "shrink-0")}>
            <Preview
              value={value}
              className={classNames(
                "aspect-profile w-36",
                "relative overflow-hidden",
                "rounded-2xl bg-white",
              )}
            />
            <div className={classNames("absolute top-2 right-2")}>
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
              "aspect-profile w-36 shrink-0",
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
          {value ? (
            <p
              className={classNames(
                "font-neuehaas text-[11px] break-all text-mute",
              )}
            >
              {value}
            </p>
          ) : null}
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

/**
 * 이미지 여러 장 (분야 이미지 등). 첫 번째가 대표 이미지이고, 순서를 바꿀 수 있습니다.
 * 폼에는 같은 name 으로 순서대로 전송됩니다. (formData.getAll(name))
 */
export function ImageListField({
  label,
  name,
  folder,
  defaultValue = [],
  hint,
}: {
  label: string;
  name: string;
  folder: string;
  defaultValue?: string[];
  hint?: string;
}) {
  const [items, setItems] = useState(defaultValue);
  const upload = useUpload(folder, (keys) =>
    setItems((prev) => [...prev, ...keys]),
  );

  const move = (index: number, offset: number) => {
    upload.markDirty();
    setItems((prev) => {
      const next = [...prev];
      const [item] = next.splice(index, 1);
      next.splice(index + offset, 0, item!);
      return next;
    });
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
      <ul className={classNames("grid grid-cols-2 gap-2 sm:grid-cols-3")}>
        {items.map((item, index) => (
          <li key={item} className={classNames("relative")}>
            <Preview
              value={item}
              className={classNames(
                "aspect-thumbnail w-full",
                "relative overflow-hidden",
                "rounded-2xl bg-white",
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
              <IconButton
                label="앞으로"
                disabled={index === 0}
                onClick={() => move(index, -1)}
              >
                ←
              </IconButton>
              <IconButton
                label="뒤로"
                disabled={index === items.length - 1}
                onClick={() => move(index, 1)}
              >
                →
              </IconButton>
              <IconButton
                label="빼기"
                onClick={() => {
                  upload.markDirty();
                  setItems((prev) => prev.filter((_, i) => i !== index));
                }}
              >
                ×
              </IconButton>
            </div>
          </li>
        ))}
        <li>
          <button
            type="button"
            onClick={upload.open}
            disabled={upload.uploading}
            className={classNames(
              "aspect-thumbnail w-full",
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
      {hint ? <p className={classNames("text-xs text-mute")}>{hint}</p> : null}
      {upload.fileInput(true)}
      {upload.overlay}
    </div>
  );
}
