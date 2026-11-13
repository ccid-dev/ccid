/** 구조화 데이터(schema.org)를 <script type="application/ld+json"> 으로 출력합니다. */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      // `<` 이스케이프로 </script> 주입을 막습니다.
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
