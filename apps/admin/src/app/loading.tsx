export default function Loading() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-[50vh] items-center justify-center"
    >
      <span className="size-5 animate-spin rounded-full border-2 border-line border-t-ink" />
      <span className="sr-only">불러오는 중…</span>
    </div>
  );
}
