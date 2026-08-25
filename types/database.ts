/**
 * Hand-authored to match supabase/migrations/*.sql exactly, in the shape
 * `supabase gen types typescript --linked` produces. This exists so code
 * can be written and type-checked before a Supabase project is linked.
 *
 * Once a project exists and the migrations are pushed, regenerate for
 * real and diff against this file — a mismatch means either this file or
 * a migration drifted. After that, treat the generated file as
 * authoritative and never hand-edit it again.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = "coach" | "client";
export type SubscriptionStatus =
  | "trialing"
  | "active"
  | "past_due"
  | "canceled"
  | "incomplete"
  | "incomplete_expired"
  | "unpaid";
export type PostMediaType = "text" | "image" | "video";
export type ConversationType = "direct" | "group";

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          role: UserRole;
          full_name: string;
          avatar_url: string | null;
          bio: string | null;
          timezone: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          role?: UserRole;
          full_name?: string;
          avatar_url?: string | null;
          bio?: string | null;
          timezone?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [];
      };
      coaches: {
        Row: {
          id: string;
          handle: string;
          display_name: string;
          headline: string | null;
          bio: string | null;
          cover_image_url: string | null;
          specialties: string[];
          stripe_account_id: string | null;
          stripe_onboarding_complete: boolean;
          is_published: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          handle: string;
          display_name: string;
          headline?: string | null;
          bio?: string | null;
          cover_image_url?: string | null;
          specialties?: string[];
          stripe_account_id?: string | null;
          stripe_onboarding_complete?: boolean;
          is_published?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["coaches"]["Insert"]>;
        Relationships: [];
      };
      tiers: {
        Row: {
          id: string;
          coach_id: string;
          level: number;
          name: string;
          description: string | null;
          price_cents: number;
          currency: string;
          features: string[];
          stripe_product_id: string | null;
          stripe_price_id: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          coach_id: string;
          level: number;
          name: string;
          description?: string | null;
          price_cents: number;
          currency?: string;
          features?: string[];
          stripe_product_id?: string | null;
          stripe_price_id?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["tiers"]["Insert"]>;
        Relationships: [];
      };
      subscriptions: {
        Row: {
          id: string;
          client_id: string;
          coach_id: string;
          tier_id: string;
          status: SubscriptionStatus;
          stripe_subscription_id: string | null;
          stripe_customer_id: string | null;
          current_period_end: string | null;
          cancel_at_period_end: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          coach_id: string;
          tier_id: string;
          status: SubscriptionStatus;
          stripe_subscription_id?: string | null;
          stripe_customer_id?: string | null;
          current_period_end?: string | null;
          cancel_at_period_end?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["subscriptions"]["Insert"]>;
        Relationships: [];
      };
      posts: {
        Row: {
          id: string;
          coach_id: string;
          min_tier_level: number;
          media_type: PostMediaType;
          title: string;
          body: string | null;
          media_path: string | null;
          thumbnail_path: string | null;
          duration_seconds: number | null;
          published_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          coach_id: string;
          min_tier_level?: number;
          media_type?: PostMediaType;
          title: string;
          body?: string | null;
          media_path?: string | null;
          thumbnail_path?: string | null;
          duration_seconds?: number | null;
          published_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["posts"]["Insert"]>;
        Relationships: [];
      };
      exercises: {
        Row: {
          id: string;
          coach_id: string | null;
          name: string;
          muscle_group: string | null;
          equipment: string | null;
          demo_path: string | null;
          instructions: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          coach_id?: string | null;
          name: string;
          muscle_group?: string | null;
          equipment?: string | null;
          demo_path?: string | null;
          instructions?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["exercises"]["Insert"]>;
        Relationships: [];
      };
      programs: {
        Row: {
          id: string;
          coach_id: string;
          name: string;
          description: string | null;
          duration_weeks: number;
          is_template: boolean;
          client_id: string | null;
          min_tier_level: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          coach_id: string;
          name: string;
          description?: string | null;
          duration_weeks?: number;
          is_template?: boolean;
          client_id?: string | null;
          min_tier_level?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["programs"]["Insert"]>;
        Relationships: [];
      };
      program_days: {
        Row: {
          id: string;
          program_id: string;
          week_number: number;
          day_number: number;
          name: string;
          notes: string | null;
        };
        Insert: {
          id?: string;
          program_id: string;
          week_number: number;
          day_number: number;
          name?: string;
          notes?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["program_days"]["Insert"]>;
        Relationships: [];
      };
      program_exercises: {
        Row: {
          id: string;
          program_day_id: string;
          exercise_id: string;
          order_index: number;
          target_sets: number;
          target_reps: string;
          target_rpe: number | null;
          rest_seconds: number | null;
          notes: string | null;
        };
        Insert: {
          id?: string;
          program_day_id: string;
          exercise_id: string;
          order_index?: number;
          target_sets?: number;
          target_reps?: string;
          target_rpe?: number | null;
          rest_seconds?: number | null;
          notes?: string | null;
        };
        Update: Partial<
          Database["public"]["Tables"]["program_exercises"]["Insert"]
        >;
        Relationships: [];
      };
      workout_logs: {
        Row: {
          id: string;
          client_id: string;
          program_day_id: string | null;
          started_at: string;
          completed_at: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          program_day_id?: string | null;
          started_at?: string;
          completed_at?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["workout_logs"]["Insert"]>;
        Relationships: [];
      };
      set_logs: {
        Row: {
          id: string;
          workout_log_id: string;
          program_exercise_id: string | null;
          exercise_id: string;
          set_number: number;
          weight_kg: number | null;
          reps: number | null;
          rpe: number | null;
          completed: boolean;
        };
        Insert: {
          id?: string;
          workout_log_id: string;
          program_exercise_id?: string | null;
          exercise_id: string;
          set_number: number;
          weight_kg?: number | null;
          reps?: number | null;
          rpe?: number | null;
          completed?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["set_logs"]["Insert"]>;
        Relationships: [];
      };
      check_ins: {
        Row: {
          id: string;
          client_id: string;
          coach_id: string;
          week_of: string;
          weight_kg: number | null;
          sleep_hours: number | null;
          adherence_pct: number | null;
          energy_score: number | null;
          notes: string | null;
          photo_paths: string[];
          coach_reply: string | null;
          replied_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          coach_id: string;
          week_of: string;
          weight_kg?: number | null;
          sleep_hours?: number | null;
          adherence_pct?: number | null;
          energy_score?: number | null;
          notes?: string | null;
          photo_paths?: string[];
          coach_reply?: string | null;
          replied_at?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["check_ins"]["Insert"]>;
        Relationships: [];
      };
      conversations: {
        Row: {
          id: string;
          coach_id: string;
          type: ConversationType;
          client_id: string | null;
          min_tier_level: number | null;
          title: string | null;
          last_message_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          coach_id: string;
          type: ConversationType;
          client_id?: string | null;
          min_tier_level?: number | null;
          title?: string | null;
          last_message_at?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["conversations"]["Insert"]>;
        Relationships: [];
      };
      messages: {
        Row: {
          id: string;
          conversation_id: string;
          sender_id: string;
          body: string | null;
          media_path: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          sender_id: string;
          body?: string | null;
          media_path?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["messages"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: {
      post_previews: {
        Row: {
          id: string;
          coach_id: string;
          title: string;
          media_type: PostMediaType;
          min_tier_level: number;
          thumbnail_path: string | null;
          duration_seconds: number | null;
          published_at: string | null;
          is_unlocked: boolean;
        };
        Relationships: [];
      };
    };
    Functions: {
      tier_level: {
        Args: { p_coach_id: string };
        Returns: number;
      };
      has_tier: {
        Args: { p_coach_id: string; p_min: number };
        Returns: boolean;
      };
      coaches_client: {
        Args: { p_client_id: string };
        Returns: boolean;
      };
      can_read_conversation: {
        Args: { p_conversation_id: string };
        Returns: boolean;
      };
    };
    Enums: {
      user_role: UserRole;
      subscription_status: SubscriptionStatus;
      post_media_type: PostMediaType;
      conversation_type: ConversationType;
    };
  };
};
