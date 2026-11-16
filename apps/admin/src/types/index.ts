export type {
  Database,
  Json,
  Tables,
  TablesInsert,
  TablesUpdate,
} from "./database";
export type {
  Person,
  PersonCategory,
  Project,
  ProjectTheme,
  Theme,
} from "./content";
export { PERSON_CATEGORIES, PERSON_CATEGORY_LABEL } from "./content";
export type {
  ContentBlock,
  ContentDocument,
  ImageBlock,
  ParagraphBlock,
  TitleBlock,
} from "@repo/blocks";
export type { AdminRole, AdminStatus, AdminUser } from "./auth";
export { ADMIN_ROLE_LABEL, ADMIN_STATUS_LABEL } from "./auth";

/** 공지사항 */
export type Notice = import("./database").Tables<"notices">;
