import "server-only";

/** 서버 전용 비밀 설정. 클라이언트 컴포넌트에서 import 하면 빌드 에러가 납니다. */
export const serverConfig = {
  supabase: {
    secretKey: process.env.SUPABASE_SECRET_KEY ?? "",
  },
  r2: {
    accountId: process.env.R2_ACCOUNT_ID ?? "",
    accessKeyId: process.env.R2_ACCESS_KEY_ID ?? "",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? "",
    bucket: process.env.R2_BUCKET ?? "",
  },
} as const;

export const isR2Configured = Object.values(serverConfig.r2).every(Boolean);
