import classNames from "classnames";
import type { Metadata } from "next";
import { FormSection } from "@/components/forms";
import { AdminPage } from "@/components/ui";
import { SUPABASE_FREE_LIMITS } from "@/constants";
import { requireMaster } from "@/libs/auth";
import {
  connectionChecks,
  envChecks,
  getUsage,
  projectRef,
  schemaChecks,
  type Check,
} from "./checks";

export const metadata: Metadata = { title: "System Check" };
/** 열 때마다 새로 확인합니다. */
export const dynamic = "force-dynamic";

const STATUS = {
  ok: { dot: "bg-black", label: "정상" },
  warn: { dot: "bg-gold", label: "확인 필요" },
  error: { dot: "bg-pink", label: "문제" },
} as const;

const TABLE_LABEL: Record<string, string> = {
  themes: "리서치 분야",
  projects: "프로젝트",
  people: "구성원",
  admin_users: "계정",
  notices: "공지",
};

const formatBytes = (bytes: number) =>
  bytes >= 1024 ** 3
    ? `${(bytes / 1024 ** 3).toFixed(2)} GB`
    : bytes >= 1024 ** 2
      ? `${(bytes / 1024 ** 2).toFixed(1)} MB`
      : `${Math.round(bytes / 1024)} KB`;

/** 확인 결과 목록 */
function CheckList({ checks }: { checks: Check[] }) {
  return (
    <ul className={classNames("divide-y divide-white")}>
      {checks.map((check) => (
        <li
          key={check.label}
          className={classNames(
            "grid gap-x-4 gap-y-1 py-3 md:grid-cols-[minmax(0,300px)_minmax(0,1fr)_auto] md:items-baseline",
          )}
        >
          <span
            className={classNames(
              "flex min-w-0 items-center gap-2",
              "text-sm font-medium break-all",
            )}
          >
            <span
              aria-hidden
              className={classNames(
                "size-2 shrink-0",
                "rounded-full",
                STATUS[check.status].dot,
              )}
            />
            {check.label}
            <span className={classNames("sr-only")}>
              {STATUS[check.status].label}
            </span>
          </span>
          <span className={classNames("text-sm break-all text-sub")}>
            {check.detail}
          </span>
          <span className={classNames("font-neuehaas text-xs text-mute")}>
            {check.ms != null ? `${check.ms}ms` : ""}
          </span>
        </li>
      ))}
    </ul>
  );
}

/** 사용량 막대 (80% 넘으면 노랑, 95% 넘으면 분홍) */
function UsageBar({
  label,
  used,
  limit,
  format,
}: {
  label: string;
  used: number;
  limit: number;
  format: (value: number) => string;
}) {
  const ratio = Math.min(1, used / limit);
  return (
    <div className={classNames("flex flex-col gap-2")}>
      <div
        className={classNames(
          "flex items-baseline justify-between gap-4",
          "text-sm",
        )}
      >
        <span className={classNames("font-medium")}>{label}</span>
        <span className={classNames("font-neuehaas text-sub")}>
          {format(used)} / {format(limit)} · {(ratio * 100).toFixed(1)}%
        </span>
      </div>
      <div
        className={classNames(
          "h-2 w-full",
          "overflow-hidden",
          "rounded-full bg-white",
        )}
      >
        <div
          className={classNames(
            "h-full",
            "rounded-full",
            ratio > 0.95 ? "bg-pink" : ratio > 0.8 ? "bg-gold" : "bg-black",
          )}
          style={{ width: `${Math.max(ratio * 100, 0.5)}%` }}
        />
      </div>
    </div>
  );
}

/**
 * System Check (메인테이너): 환경 변수 · 연결 상태 · DB 구조(마이그레이션) · 무료 플랜 사용량.
 * 로그 · 트래픽(egress)은 앱에서 볼 수 없어서 Supabase 대시보드로 연결합니다.
 */
export default async function SystemPage() {
  await requireMaster();
  const [connections, schema, usage] = await Promise.all([
    connectionChecks(),
    schemaChecks(),
    getUsage(),
  ]);
  const env = envChecks();
  const all = [...env, ...connections, ...schema];
  const problems = all.filter((check) => check.status !== "ok").length;
  const ref = projectRef();
  const dashboard = ref ? `https://supabase.com/dashboard/project/${ref}` : "";

  return (
    <AdminPage
      title="System Check"
      description={
        problems
          ? `확인이 필요한 항목이 ${problems}개 있습니다.`
          : "모든 항목이 정상입니다."
      }
    >
      <div className={classNames("flex flex-col gap-3")}>
        <FormSection
          title="사용량"
          description="Supabase 무료 플랜 한도 기준입니다. 플랜 정책이 바뀌면 constants 의 SUPABASE_FREE_LIMITS 를 고쳐 주세요."
        >
          {usage ? (
            <>
              <UsageBar
                label="Database 크기"
                used={usage.database_bytes}
                limit={SUPABASE_FREE_LIMITS.databaseBytes}
                format={formatBytes}
              />
              <UsageBar
                label={`Storage (파일 ${usage.storage_objects}개)`}
                used={usage.storage_bytes}
                limit={SUPABASE_FREE_LIMITS.storageBytes}
                format={formatBytes}
              />
              <UsageBar
                label="가입 계정 (월간 활성 사용자 한도 기준)"
                used={usage.auth_users}
                limit={SUPABASE_FREE_LIMITS.monthlyActiveUsers}
                format={(value) => value.toLocaleString("ko-KR")}
              />
              <dl
                className={classNames(
                  "grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5",
                )}
              >
                {Object.entries(usage.tables).map(([table, count]) => (
                  <div
                    key={table}
                    className={classNames(
                      "flex flex-col gap-1",
                      "p-4",
                      "rounded-2xl bg-white",
                    )}
                  >
                    <dt className={classNames("text-xs text-sub")}>
                      {TABLE_LABEL[table] ?? table}
                    </dt>
                    <dd
                      className={classNames(
                        "font-neuehaas text-2xl font-medium",
                      )}
                    >
                      {count.toLocaleString("ko-KR")}
                    </dd>
                  </div>
                ))}
              </dl>
            </>
          ) : (
            <p className={classNames("text-sm text-sub")}>
              사용량을 불러오지 못했습니다. 마이그레이션
              20261116180000_notices_system.sql 을 실행했는지 확인해 주세요.
            </p>
          )}
        </FormSection>

        <FormSection title="연결 상태" description="열 때마다 새로 확인합니다.">
          <CheckList checks={connections} />
        </FormSection>

        <FormSection
          title="DB 구조"
          description="마이그레이션이 적용됐는지 확인합니다."
        >
          <CheckList checks={schema} />
        </FormSection>

        <FormSection
          title="환경 변수"
          description="값은 보여 주지 않고, 들어 있는지만 확인합니다."
        >
          <CheckList checks={env} />
        </FormSection>

        <FormSection
          title="오류 · 로그"
          description="요청 로그 · 오류 · 트래픽(egress)은 Supabase 대시보드에서만 볼 수 있습니다."
        >
          <ul className={classNames("flex flex-col gap-2", "text-sm")}>
            {dashboard ? (
              <>
                <li>
                  <a
                    href={dashboard}
                    target="_blank"
                    rel="noreferrer"
                    className={classNames(
                      "font-medium underline underline-offset-2",
                    )}
                  >
                    Supabase 프로젝트 대시보드 ↗
                  </a>
                  <span className={classNames("text-sub")}>
                    {" "}
                    — 사용량 · 트래픽 · 결제
                  </span>
                </li>
                <li>
                  <a
                    href={`${dashboard}/logs/explorer`}
                    target="_blank"
                    rel="noreferrer"
                    className={classNames(
                      "font-medium underline underline-offset-2",
                    )}
                  >
                    로그 탐색기 ↗
                  </a>
                  <span className={classNames("text-sub")}>
                    {" "}
                    — API · Auth · Storage 오류
                  </span>
                </li>
              </>
            ) : null}
            <li className={classNames("text-sub")}>
              무료 플랜 프로젝트는 일정 기간 사용이 없으면 일시 정지될 수
              있습니다. 사이트가 갑자기 안 열리면 대시보드에서 프로젝트 상태를
              먼저 확인해 주세요.
            </li>
          </ul>
        </FormSection>
      </div>
    </AdminPage>
  );
}
