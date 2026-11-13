import { Container } from "@repo/common";
import { BlockEditor } from "@/components";
import { SAMPLE_DOCUMENT } from "@/constants";

/**
 * 관리자 홈 — 지금은 블록 편집기 체험 화면입니다.
 * DB 스키마를 정한 뒤 목록/편집 페이지로 바꾸고, BlockEditor 의 onSave 에 저장 로직을 연결하세요.
 */
export default function AdminHome() {
  return (
    <div className="px-5 py-8 sm:px-8 sm:py-12">
      <Container size="wide">
        <h1 className="sr-only">블록 편집기</h1>
        <BlockEditor initialDocument={SAMPLE_DOCUMENT} />
      </Container>
    </div>
  );
}
