// 화면에서 쓰는 것
export {
  AgentBlob,
  type AgentBlobLabels,
  type AgentBlobProps,
} from "./AgentBlob";

// 그리는 원리 (튜닝 페이지 app/[lang]/agent-tune 에서 씀)
export {
  BlobCanvas,
  type BlobCanvasHandle,
  type BlobCanvasProps,
} from "./engine/BlobCanvas";
export {
  BLOB_PRESET_KEYS,
  BLOB_SITUATIONS,
  BLOB_STATES,
  type BlobBase,
  type BlobConfig,
  type BlobPreset,
  type BlobSituation,
  type BlobState,
  DEFAULT_BLOB_CONFIG,
  type DeepPartial,
  mergeBlobConfig,
} from "./engine/config";
export { useMicLevel } from "./engine/useMicLevel";
