import classNames from "classnames";
import type {
  ContentBlock,
  ContentDocument,
  ImageBlock,
  ParagraphBlock,
  TitleBlock,
} from "./types";

function TitleBlockView({ block }: { block: TitleBlock }) {
  return (
    <h1
      className={classNames(
        "text-4xl leading-[1.1] font-semibold tracking-[-0.04em] text-balance sm:text-6xl",
      )}
    >
      {block.content.text}
    </h1>
  );
}

function ParagraphBlockView({ block }: { block: ParagraphBlock }) {
  return (
    <p
      className={classNames(
        "max-w-2xl",
        "text-lg leading-8 text-sub sm:text-xl sm:leading-9",
      )}
    >
      {block.content.text}
    </p>
  );
}

function ImageBlockView({ block }: { block: ImageBlock }) {
  // 아직 이미지를 고르지 않은 블록 (편집 중)
  if (!block.content.src) return null;

  return (
    <figure className={classNames("space-y-3")}>
      {/* 이미지는 업로드 때 최적화되므로 표준 img 를 씁니다. */}
      <img
        className={classNames("h-auto w-full", "rounded-2xl border bg-sheet")}
        src={block.content.src}
        alt={block.content.alt}
        loading="lazy"
        decoding="async"
      />
      {block.content.caption ? (
        <figcaption className={classNames("text-sm leading-6 text-sub")}>
          {block.content.caption}
        </figcaption>
      ) : null}
    </figure>
  );
}

function BlockView({ block }: { block: ContentBlock }) {
  switch (block.type) {
    case "title":
      return <TitleBlockView block={block} />;
    case "paragraph":
      return <ParagraphBlockView block={block} />;
    case "image":
      return <ImageBlockView block={block} />;
  }
}

export function BlockRenderer({ document }: { document: ContentDocument }) {
  return (
    <article
      className={classNames(
        "w-full max-w-4xl",
        "flex flex-col gap-10",
        "mx-auto px-6 py-12 sm:px-12 sm:py-16",
        "rounded-3xl border bg-white shadow-[0_24px_80px_rgba(24,24,22,0.06)]",
      )}
    >
      {document.blocks.map((block) => (
        <BlockView key={block.id} block={block} />
      ))}
    </article>
  );
}
