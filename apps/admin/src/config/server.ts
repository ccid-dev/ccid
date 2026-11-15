import "server-only";

/**
 * 서버에서만 쓰는 비밀 설정. 클라이언트 컴포넌트에서 import 하면 빌드가 실패합니다.
 * NEXT_PUBLIC_ 을 붙이지 않으므로 브라우저 번들에 들어가지 않습니다.
 */
export const serverConfig = {
  supabase: {
    /** 계정 삭제 · 탈퇴 · 비밀번호 재설정 링크에만 씁니다. (RLS 를 우회하는 관리자 키) */
    secretKey: process.env.SUPABASE_SECRET_KEY ?? "",
  },
} as const;
