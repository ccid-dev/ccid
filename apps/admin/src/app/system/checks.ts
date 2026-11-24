import "server-only";

import { config } from "@/config";
import { serverConfig } from "@/config/server";
import { createAdminClient } from "@/libs/supabase/admin";
import { createClient } from "@/libs/supabase/server";

export type CheckStatus = "ok" | "warn" | "error";
export type Check = {
  label: string;
  status: CheckStatus;
  detail: string;
  /** 걸린 시간 (ms) */
  ms?: number;
};

export type Usage = {
  database_bytes: number;
  storage_bytes: number;
  storage_objects: number;
  auth_users: number;
  tables: Record<string, number>;
};

type Timed<T> =
  { ok: true; value: T; ms: number } | { ok: false; error: string; ms: number };

/** 걸린 시간을 재며 실행 (예외도 결과로 바꿈) */
async function timed<T>(task: () => Promise<T>): Promise<Timed<T>> {
  const start = performance.now();
  const ms = () => Math.round(performance.now() - start);
  try {
    const value = await task();
    return { ok: true, value, ms: ms() };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
      ms: ms(),
    };
  }
}

/** Supabase 프로젝트 ref (URL 의 앞부분: https://<ref>.supabase.co) */
export function projectRef() {
  try {
    return new URL(config.supabase.url).hostname.split(".")[0] ?? "";
  } catch {
    return "";
  }
}

/** 환경 변수 (값은 보여 주지 않고, 들어 있는지만) */
export function envChecks(): Check[] {
  const has = (value: string | undefined) => Boolean(value);
  return [
    {
      label: "NEXT_PUBLIC_SUPABASE_URL",
      status: has(config.supabase.url) ? "ok" : "error",
      detail: has(config.supabase.url)
        ? new URL(config.supabase.url).host
        : "없음 — 로그인과 모든 조회가 안 됩니다.",
    },
    {
      label: "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
      status: has(config.supabase.publishableKey) ? "ok" : "error",
      detail: has(config.supabase.publishableKey) ? "설정됨" : "없음",
    },
    {
      label: "SUPABASE_SECRET_KEY",
      status: has(serverConfig.supabase.secretKey) ? "ok" : "warn",
      detail: has(serverConfig.supabase.secretKey)
        ? "설정됨 (서버 전용)"
        : "없음 — 계정 삭제 · 탈퇴 · 재설정 링크 · 이 화면 일부가 안 됩니다.",
    },
    {
      label: "NEXT_PUBLIC_MEDIA_URL",
      status: "ok",
      detail: process.env.NEXT_PUBLIC_MEDIA_URL
        ? "설정됨 (다른 저장소)"
        : "없음 — Supabase Storage 공개 주소를 씁니다. (기본)",
    },
  ];
}

/** 연결 상태: DB · Auth · Storage */
export async function connectionChecks(): Promise<Check[]> {
  const supabase = await createClient();
  const hasSecret = Boolean(serverConfig.supabase.secretKey);

  const [db, auth, storage] = await Promise.all([
    timed(async () => {
      const { count, error } = await supabase
        .from("themes")
        .select("id", { count: "exact", head: true });
      if (error) throw new Error(error.message);
      return count ?? 0;
    }),
    hasSecret
      ? timed(async () => {
          const { data, error } =
            await createAdminClient().auth.admin.listUsers({
              page: 1,
              perPage: 1,
            });
          if (error) throw new Error(error.message);
          return data.total;
        })
      : Promise.resolve(null),
    hasSecret
      ? timed(async () => {
          const { data, error } =
            await createAdminClient().storage.getBucket("media");
          if (error) throw new Error(error.message);
          return data;
        })
      : Promise.resolve(null),
  ]);

  const slow = (ms: number): "ok" | "warn" => (ms > 1500 ? "warn" : "ok");
  return [
    !db.ok
      ? { label: "Database", status: "error", detail: db.error, ms: db.ms }
      : {
          label: "Database",
          status: slow(db.ms),
          detail: `읽기 정상 · 리서치 분야 ${db.value}개`,
          ms: db.ms,
        },
    !auth
      ? {
          label: "Auth (관리 API)",
          status: "warn",
          detail: "secret key 가 없어 확인하지 못했습니다.",
        }
      : !auth.ok
        ? {
            label: "Auth (관리 API)",
            status: "error",
            detail: auth.error,
            ms: auth.ms,
          }
        : {
            label: "Auth (관리 API)",
            status: slow(auth.ms),
            detail: `정상 · 가입 계정 ${auth.value}개`,
            ms: auth.ms,
          },
    !storage
      ? {
          label: "Storage (media 버킷)",
          status: "warn",
          detail: "secret key 가 없어 확인하지 못했습니다.",
        }
      : !storage.ok
        ? {
            label: "Storage (media 버킷)",
            status: "error",
            detail: storage.error,
            ms: storage.ms,
          }
        : {
            label: "Storage (media 버킷)",
            status: storage.value.public ? slow(storage.ms) : "warn",
            detail: storage.value.public
              ? `정상 · 공개 버킷 · 파일 한 개 최대 ${Math.round((storage.value.file_size_limit ?? 0) / 1024 / 1024)}MB`
              : "버킷이 공개가 아닙니다 — 사이트에서 이미지가 안 보일 수 있습니다.",
            ms: storage.ms,
          },
  ];
}

/** DB 구조: 마이그레이션이 적용됐는지 (테이블 · 칸 · 함수가 있는지로 확인) */
export async function schemaChecks(): Promise<Check[]> {
  const supabase = await createClient();
  const probe = async (
    label: string,
    file: string,
    run: () => PromiseLike<{ error: { message: string } | null }>,
  ): Promise<Check> => {
    const { error } = await run();
    return error
      ? {
          label,
          status: "error",
          detail: `마이그레이션 ${file} 을 실행해 주세요. (${error.message})`,
        }
      : { label, status: "ok", detail: `${file} 적용됨` };
  };

  return Promise.all([
    probe(
      "프로젝트 주소 (projects.slug)",
      "20261116120000_project_slug.sql",
      () => supabase.from("projects").select("slug").limit(1),
    ),
    probe("모집 설정 (recruit)", "20261116200000_recruit.sql", () =>
      supabase.from("recruit").select("id").limit(1),
    ),
    probe("공지사항 (notices)", "20261116180000_notices_system.sql", () =>
      supabase.from("notices").select("id").limit(1),
    ),
    probe(
      "사용량 함수 (system_usage)",
      "20261116180000_notices_system.sql",
      () => supabase.rpc("system_usage"),
    ),
    probe(
      "에이전트 문의 (inquiries)",
      "20261124053750_talk_inquiries.sql",
      () => supabase.from("inquiries").select("id").limit(1),
    ),
    probe(
      "에이전트 하루 사용량 (talk_usage)",
      "20261124053750_talk_inquiries.sql",
      () => supabase.from("talk_usage").select("day").limit(1),
    ),
  ]);
}

/** 사용량 (DB 크기 · Storage · 계정 · 표별 행 수). 함수가 없으면 null */
export async function getUsage(): Promise<Usage | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("system_usage");
  if (error || !data) return null;
  return data as unknown as Usage;
}
