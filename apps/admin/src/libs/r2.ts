import "server-only";

import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
  type PutObjectCommandInput,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { config } from "@/config";
import { isR2Configured, serverConfig } from "@/config/server";

let r2Client: S3Client | undefined;

/** Cloudflare R2 (S3 호환 API) 클라이언트 */
export function getR2Client() {
  if (!isR2Configured) {
    throw new Error("R2 환경변수(R2_ACCOUNT_ID 등)가 설정되지 않았습니다.");
  }
  r2Client ??= new S3Client({
    region: "auto",
    endpoint: `https://${serverConfig.r2.accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: serverConfig.r2.accessKeyId,
      secretAccessKey: serverConfig.r2.secretAccessKey,
    },
    // R2 는 AWS SDK 의 기본 체크섬 헤더를 presigned URL 에서 요구하지 않도록 합니다.
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
  });
  return r2Client;
}

export function getR2PublicUrl(key: string) {
  if (!config.r2.publicUrl) {
    throw new Error("NEXT_PUBLIC_R2_PUBLIC_URL이 설정되지 않았습니다.");
  }
  return `${config.r2.publicUrl}/${key.replace(/^\/+/, "")}`;
}

/**
 * 브라우저에서 직접 PUT 업로드할 수 있는 presigned URL.
 * Content-Type · Content-Length 가 서명에 포함되므로, 요청한 형식 · 용량과 다른 파일은 R2 가 거부합니다.
 */
export function createR2UploadUrl({
  key,
  contentType,
  contentLength,
  expiresIn = 60,
}: {
  key: string;
  contentType: string;
  contentLength: number;
  expiresIn?: number;
}) {
  const command = new PutObjectCommand({
    Bucket: serverConfig.r2.bucket,
    Key: key,
    ContentType: contentType,
    ContentLength: contentLength,
  });
  return getSignedUrl(getR2Client(), command, {
    expiresIn,
    // content-type 은 기본 서명 대상이 아니라서 명시합니다.
    signableHeaders: new Set(["content-type"]),
  });
}

/** 서버에서 바로 업로드 */
export async function putR2Object({
  key,
  body,
  contentType,
}: {
  key: string;
  body: PutObjectCommandInput["Body"];
  contentType?: string;
}) {
  await getR2Client().send(
    new PutObjectCommand({
      Bucket: serverConfig.r2.bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  );
  return getR2PublicUrl(key);
}

export async function deleteR2Object(key: string) {
  await getR2Client().send(
    new DeleteObjectCommand({ Bucket: serverConfig.r2.bucket, Key: key }),
  );
}
