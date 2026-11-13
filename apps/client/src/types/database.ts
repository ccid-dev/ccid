// Supabase 스키마 타입 — 아직 테이블이 없는 기본 상태입니다.
// supabase/migrations 에 스키마를 추가한 뒤 루트에서 `yarn db:types`로 다시 생성합니다. (client · admin 동시 갱신)

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
