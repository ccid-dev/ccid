// Supabase 스키마 타입 (supabase/migrations 기준)
// 로컬 DB를 띄울 수 있게 되면 루트에서 `yarn db:types`로 다시 생성합니다. (client · admin 동시 갱신)

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
      admin_users: {
        Row: {
          id: string;
          email: string;
          name: string;
          role: string;
          status: string;
          approved_at: string | null;
          approved_by: string | null;
          can_edit_profile: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          name?: string;
          role?: string;
          status?: string;
          approved_at?: string | null;
          approved_by?: string | null;
          can_edit_profile?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string;
          role?: string;
          status?: string;
          approved_at?: string | null;
          approved_by?: string | null;
          can_edit_profile?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "admin_users_approved_by_fkey";
            columns: ["approved_by"];
            isOneToOne: false;
            referencedRelation: "admin_users";
            referencedColumns: ["id"];
          },
        ];
      };
      notice_comments: {
        Row: {
          author_id: string | null;
          author_name: string;
          body: string;
          created_at: string;
          id: string;
          notice_id: string;
        };
        Insert: {
          author_id?: string | null;
          author_name?: string;
          body: string;
          created_at?: string;
          id?: string;
          notice_id: string;
        };
        Update: {
          author_id?: string | null;
          author_name?: string;
          body?: string;
          created_at?: string;
          id?: string;
          notice_id?: string;
        };
        Relationships: [];
      };
      notice_reactions: {
        Row: {
          created_at: string;
          emoji: string;
          notice_id: string;
          user_id: string;
          user_name: string;
        };
        Insert: {
          created_at?: string;
          emoji: string;
          notice_id: string;
          user_id?: string;
          user_name?: string;
        };
        Update: {
          created_at?: string;
          emoji?: string;
          notice_id?: string;
          user_id?: string;
          user_name?: string;
        };
        Relationships: [];
      };
      notices: {
        Row: {
          author_id: string | null;
          author_name: string;
          body: string;
          created_at: string;
          id: string;
          pinned: boolean;
          title: string;
          updated_at: string;
        };
        Insert: {
          author_id?: string | null;
          author_name?: string;
          body?: string;
          created_at?: string;
          id?: string;
          pinned?: boolean;
          title: string;
          updated_at?: string;
        };
        Update: {
          author_id?: string | null;
          author_name?: string;
          body?: string;
          created_at?: string;
          id?: string;
          pinned?: boolean;
          title?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      people: {
        Row: {
          id: string;
          category: string;
          name_ko: string;
          name_en: string;
          role_ko: string;
          role_en: string;
          bio_ko: string;
          bio_en: string;
          profile_ko: string;
          profile_en: string;
          image: string;
          sort_order: number;
          is_published: boolean;
          admin_user_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          category: string;
          name_ko?: string;
          name_en?: string;
          role_ko?: string;
          role_en?: string;
          bio_ko?: string;
          bio_en?: string;
          profile_ko?: string;
          profile_en?: string;
          image?: string;
          sort_order?: number;
          is_published?: boolean;
          admin_user_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          category?: string;
          name_ko?: string;
          name_en?: string;
          role_ko?: string;
          role_en?: string;
          bio_ko?: string;
          bio_en?: string;
          profile_ko?: string;
          profile_en?: string;
          image?: string;
          sort_order?: number;
          is_published?: boolean;
          admin_user_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "people_admin_user_id_fkey";
            columns: ["admin_user_id"];
            isOneToOne: true;
            referencedRelation: "admin_users";
            referencedColumns: ["id"];
          },
        ];
      };
      project_themes: {
        Row: {
          project_id: string;
          theme_id: string;
          position: number;
        };
        Insert: {
          project_id: string;
          theme_id: string;
          position?: number;
        };
        Update: {
          project_id?: string;
          theme_id?: string;
          position?: number;
        };
        Relationships: [
          {
            foreignKeyName: "project_themes_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "project_themes_theme_id_fkey";
            columns: ["theme_id"];
            isOneToOne: false;
            referencedRelation: "themes";
            referencedColumns: ["id"];
          },
        ];
      };
      projects: {
        Row: {
          id: string;
          title_ko: string;
          title_en: string;
          client_ko: string;
          client_en: string;
          year_start: number;
          year_end: number | null;
          tags_ko: string[];
          tags_en: string[];
          description_ko: string;
          description_en: string;
          is_nda: boolean;
          slug: string;
          sort_order: number;
          is_published: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title_ko?: string;
          title_en?: string;
          client_ko?: string;
          client_en?: string;
          year_start: number;
          year_end?: number | null;
          tags_ko?: string[];
          tags_en?: string[];
          description_ko?: string;
          description_en?: string;
          is_nda?: boolean;
          slug?: string;
          sort_order?: number;
          is_published?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title_ko?: string;
          title_en?: string;
          client_ko?: string;
          client_en?: string;
          year_start?: number;
          year_end?: number | null;
          tags_ko?: string[];
          tags_en?: string[];
          description_ko?: string;
          description_en?: string;
          is_nda?: boolean;
          slug?: string;
          sort_order?: number;
          is_published?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      recruit: {
        Row: {
          apply_url: string;
          closed_message_en: string;
          closed_message_ko: string;
          closed_title_en: string;
          closed_title_ko: string;
          cta_en: string;
          cta_ko: string;
          description_en: string;
          description_ko: string;
          eyebrow_en: string;
          eyebrow_ko: string;
          id: number;
          is_open: boolean;
          title_en: string;
          title_ko: string;
          updated_at: string;
        };
        Insert: {
          apply_url?: string;
          closed_message_en?: string;
          closed_message_ko?: string;
          closed_title_en?: string;
          closed_title_ko?: string;
          cta_en?: string;
          cta_ko?: string;
          description_en?: string;
          description_ko?: string;
          eyebrow_en?: string;
          eyebrow_ko?: string;
          id?: number;
          is_open?: boolean;
          title_en?: string;
          title_ko?: string;
          updated_at?: string;
        };
        Update: {
          apply_url?: string;
          closed_message_en?: string;
          closed_message_ko?: string;
          closed_title_en?: string;
          closed_title_ko?: string;
          cta_en?: string;
          cta_ko?: string;
          description_en?: string;
          description_ko?: string;
          eyebrow_en?: string;
          eyebrow_ko?: string;
          id?: number;
          is_open?: boolean;
          title_en?: string;
          title_ko?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      themes: {
        Row: {
          id: string;
          number: number;
          slug: string;
          title_ko: string;
          title_en: string;
          question_ko: string;
          question_en: string;
          summary_ko: string;
          summary_en: string;
          catchphrase_ko: string;
          catchphrase_en: string;
          description_ko: string;
          description_en: string;
          keywords_ko: string[];
          keywords_en: string[];
          images: string[];
          image_alt_ko: string;
          image_alt_en: string;
          is_published: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          number: number;
          slug: string;
          title_ko?: string;
          title_en?: string;
          question_ko?: string;
          question_en?: string;
          summary_ko?: string;
          summary_en?: string;
          catchphrase_ko?: string;
          catchphrase_en?: string;
          description_ko?: string;
          description_en?: string;
          keywords_ko?: string[];
          keywords_en?: string[];
          images?: string[];
          image_alt_ko?: string;
          image_alt_en?: string;
          is_published?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          number?: number;
          slug?: string;
          title_ko?: string;
          title_en?: string;
          question_ko?: string;
          question_en?: string;
          summary_ko?: string;
          summary_en?: string;
          catchphrase_ko?: string;
          catchphrase_en?: string;
          description_ko?: string;
          description_en?: string;
          keywords_ko?: string[];
          keywords_en?: string[];
          images?: string[];
          image_alt_ko?: string;
          image_alt_en?: string;
          is_published?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      is_admin: { Args: never; Returns: boolean };
      is_master: { Args: never; Returns: boolean };
      can_edit_own_profile: { Args: never; Returns: boolean };
      system_usage: { Args: never; Returns: Json };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type PublicTables = Database["public"]["Tables"];
export type Tables<T extends keyof PublicTables> = PublicTables[T]["Row"];
export type TablesInsert<T extends keyof PublicTables> =
  PublicTables[T]["Insert"];
export type TablesUpdate<T extends keyof PublicTables> =
  PublicTables[T]["Update"];
