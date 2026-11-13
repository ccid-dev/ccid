import type {
  ContentBlock,
  ContentDocument,
  ImageBlock,
  ParagraphBlock,
  TitleBlock,
} from "./types";

function TitleBlockView({ block }: { block: TitleBlock }) {
  return (
    <h1 className="text-4xl leading-[1.1] font-semibold tracking-[-0.04em] text-balance sm:text-6xl">
      {block.content.text}
    </h1>
  );
}

function ParagraphBlockView({ block }: { block: ParagraphBlock }) {
  return (
    <p className="max-w-2xl text-lg leading-8 text-muted sm:text-xl sm:leading-9">
      {block.content.text}
    </p>
  );
}

function ImageBlockView({ block }: { block: ImageBlock }) {
  // 아직 이미지를 고르지 않은 블록 (편집 중)
  if (!block.content.src) return null;

  return (
    <figure className="space-y-3">
      {/* 공용 패키지는 앱별 next/image 설정(remotePatterns)에 묶이지 않도록 표준 img 를 씁니다. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        className="h-auto w-full rounded-2xl border bg-canvas"
        src={block.content.src}
        alt={block.content.alt}
        loading="lazy"
        decoding="async"
      />
      {block.content.caption ? (
        <figcaption className="text-sm leading-6 text-muted">
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
    <article className="mx-auto flex w-full max-w-4xl flex-col gap-10 rounded-3xl border bg-paper px-6 py-12 shadow-[0_24px_80px_rgba(24,24,22,0.06)] sm:px-12 sm:py-16">
      {document.blocks.map((block) => (
        <BlockView key={block.id} block={block} />
      ))}
    </article>
  );
}
