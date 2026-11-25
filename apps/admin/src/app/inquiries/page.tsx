import classNames from "classnames";
import type { Metadata } from "next";
import { AdminPage, Badge, LoadError, Panel } from "@/components/ui";
import { requireMaster } from "@/libs/auth";
import { createClient } from "@/libs/supabase/server";
import { InquiryRow } from "./InquiryRow";

export const metadata: Metadata = { title: "Inquiries" };
/** 열 때마다 새로 읽습니다. */
export const dynamic = "force-dynamic";

/** 한 번에 보여 줄 문의 수 (최근 것부터) */
const LIMIT = 200;

const USAGE_COLUMNS = [
  ["chats", "대답"],
  ["listens", "받아 적기"],
  ["speak_chars", "목소리 글자"],
  ["inquiries", "문의"],
] as const;

/**
 * 사이트 에이전트가 대화로 받은 문의 (메인테이너). 방문자가 미리보기를 보고 "보내 주세요"라고 한 것만 쌓입니다.
 * 아래에 최근 7일 에이전트 사용량(사이트 전체 하루 한도의 기준)을 함께 보여 줍니다.
 */
export default async function InquiriesPage() {
  await requireMaster();
  const supabase = await createClient();
  const [{ data, error }, { data: usage }] = await Promise.all([
    supabase
      .from("inquiries")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(LIMIT),
    supabase
      .from("talk_usage")
      .select("*")
      .order("day", { ascending: false })
      .limit(7),
  ]);
  const newCount = (data ?? []).filter((i) => i.status === "new").length;

  return (
    <AdminPage
      title="Inquiries"
      description={
        <>
          사이트 에이전트가 대화로 받은 문의입니다. 방문자가 미리보기를 보고
          보내기로 한 것만 쌓입니다.
          {newCount ? <Badge tone="strong">새 문의 {newCount}</Badge> : null}
        </>
      }
    >
      {error ? (
        <LoadError message={error.message} />
      ) : data.length === 0 ? (
        <Panel className={classNames("p-8", "text-sm text-sub")}>
          아직 받은 문의가 없습니다.
        </Panel>
      ) : (
        <Panel className={classNames("overflow-hidden")}>
          <ul className={classNames("divide-y divide-white")}>
            {data.map((inquiry) => (
              <InquiryRow key={inquiry.id} inquiry={inquiry} />
            ))}
          </ul>
        </Panel>
      )}

      {usage?.length ? (
        <Panel className={classNames("p-8")}>
          <h2 className={classNames("mb-4", "text-sm font-medium")}>
            에이전트 사용량 (최근 7일, 한국 시간)
          </h2>
          <table className={classNames("w-full", "text-sm")}>
            <thead>
              <tr className={classNames("text-left text-xs text-mute")}>
                <th className={classNames("pb-2 font-normal")}>날짜</th>
                {USAGE_COLUMNS.map(([key, label]) => (
                  <th
                    key={key}
                    className={classNames("pb-2", "text-right font-normal")}
                  >
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {usage.map((row) => (
                <tr key={row.day}>
                  <td className={classNames("py-1")}>{row.day}</td>
                  {USAGE_COLUMNS.map(([key]) => (
                    <td
                      key={key}
                      className={classNames("py-1", "text-right tabular-nums")}
                    >
                      {row[key].toLocaleString("ko-KR")}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      ) : null}
    </AdminPage>
  );
}
