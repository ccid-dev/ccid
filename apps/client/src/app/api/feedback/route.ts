import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import type {
  FeedbackComment,
  FeedbackInput,
  FeedbackStatus,
} from "@/components/feedback/types";

/**
 * 사이트 위 피드백 코멘트 저장소 (components/feedback/FeedbackLayer.tsx 가 씀).
 * 개발 서버(next dev)에서만 동작하고, 배포 빌드에서는 404 입니다.
 * 파일: 모노레포 루트 .feedback/comments.json (.gitignore 에 들어 있음)
 *   GET            전체 목록
 *   POST           새 코멘트 { page, comment, target, point, viewport }
 *   PATCH          상태 · 내용 바꾸기 { id, status?, comment? }
 *   DELETE ?id=…   지우기
 */

// NODE_ENV 는 next dev/build 가 직접 설정하므로 turbo env 선언이 필요 없습니다.
const isDev = process.env.NODE_ENV === "development"; // eslint-disable-line turbo/no-undeclared-env-vars
/** next dev 는 apps/client 에서 실행되므로 두 단계 위가 모노레포 루트 */
const FILE = path.join(process.cwd(), "..", "..", ".feedback", "comments.json");
const STATUSES: FeedbackStatus[] = ["open", "done"];

const notFound = () => new Response(null, { status: 404 });
const badRequest = (message: string) =>
  Response.json({ error: message }, { status: 400 });

/** 파일이 없으면 빈 목록. JSON 이 깨져 있으면 덮어쓰지 않도록 에러를 그대로 던집니다. */
async function load(): Promise<FeedbackComment[]> {
  try {
    return JSON.parse(await readFile(FILE, "utf8"));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
}

/** 임시 파일에 쓴 뒤 바꿔 끼워서, 쓰는 도중에 파일이 반쯤 비는 일이 없게 합니다. */
async function save(comments: FeedbackComment[]) {
  await mkdir(path.dirname(FILE), { recursive: true });
  const temp = `${FILE}.tmp`;
  await writeFile(temp, `${JSON.stringify(comments, null, 2)}\n`);
  await rename(temp, FILE);
}

/** 요청이 겹쳐도 읽기 → 고치기 → 쓰기가 한 번에 하나씩 일어나게 줄 세웁니다. */
let queue: Promise<unknown> = Promise.resolve();
function update<T>(
  change: (comments: FeedbackComment[]) => T | Response,
): Promise<Response> {
  const run = queue.then(async () => {
    const comments = await load();
    const result = change(comments);
    if (result instanceof Response) return result;
    await save(comments);
    return Response.json(result);
  });
  queue = run.catch(() => undefined);
  return run.catch((error: Error) =>
    Response.json({ error: error.message }, { status: 500 }),
  );
}

const isPoint = (value: unknown): value is { x: number; y: number } =>
  typeof value === "object" &&
  value !== null &&
  typeof (value as { x: unknown }).x === "number" &&
  typeof (value as { y: unknown }).y === "number";

export async function GET() {
  if (!isDev) return notFound();
  try {
    return Response.json(await load());
  } catch (error) {
    return Response.json(
      {
        error: `.feedback/comments.json 을 읽지 못했습니다. JSON 형식이 깨졌는지 확인해 주세요. (${(error as Error).message})`,
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  if (!isDev) return notFound();
  const input = (await request.json()) as Partial<FeedbackInput>;
  const comment = input.comment?.trim();
  if (!comment) return badRequest("코멘트가 비어 있습니다.");
  if (!input.page?.startsWith("/")) return badRequest("page 가 없습니다.");
  if (!input.target?.selector) return badRequest("target 이 없습니다.");
  if (!isPoint(input.point)) return badRequest("point 가 없습니다.");

  return update((comments) => {
    const created: FeedbackComment = {
      id: randomUUID().slice(0, 8),
      number: Math.max(0, ...comments.map((item) => item.number)) + 1,
      status: "open",
      page: input.page!,
      comment,
      target: input.target!,
      point: input.point!,
      viewport: input.viewport ?? { width: 0, height: 0 },
      createdAt: new Date().toISOString(),
    };
    comments.push(created);
    return created;
  });
}

export async function PATCH(request: Request) {
  if (!isDev) return notFound();
  const input = (await request.json()) as {
    id?: string;
    status?: FeedbackStatus;
    comment?: string;
  };
  if (input.status && !STATUSES.includes(input.status))
    return badRequest("status 는 open · done 중 하나입니다.");

  return update((comments) => {
    const found = comments.find((item) => item.id === input.id);
    if (!found) return notFound();
    if (input.status) found.status = input.status;
    if (input.comment?.trim()) found.comment = input.comment.trim();
    return found;
  });
}

export async function DELETE(request: Request) {
  if (!isDev) return notFound();
  const id = new URL(request.url).searchParams.get("id");

  return update((comments) => {
    const index = comments.findIndex((item) => item.id === id);
    if (index < 0) return notFound();
    const [removed] = comments.splice(index, 1);
    return removed;
  });
}
