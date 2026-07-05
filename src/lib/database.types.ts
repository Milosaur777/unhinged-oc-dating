export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      blocked_pairs: {
        Row: {
          blocked_oc_id: string
          blocker_oc_id: string
          created_at: string | null
          id: string
        }
        Insert: {
          blocked_oc_id: string
          blocker_oc_id: string
          created_at?: string | null
          id?: string
        }
        Update: {
          blocked_oc_id?: string
          blocker_oc_id?: string
          created_at?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "blocked_pairs_blocked_oc_id_fkey"
            columns: ["blocked_oc_id"]
            isOneToOne: false
            referencedRelation: "ocs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blocked_pairs_blocker_oc_id_fkey"
            columns: ["blocker_oc_id"]
            isOneToOne: false
            referencedRelation: "ocs"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          chat_id: string
          created_at: string | null
          from_oc_id: string
          id: string
          image_url: string | null
          text: string
        }
        Insert: {
          chat_id: string
          created_at?: string | null
          from_oc_id: string
          id?: string
          image_url?: string | null
          text: string
        }
        Update: {
          chat_id?: string
          created_at?: string | null
          from_oc_id?: string
          id?: string
          image_url?: string | null
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chat_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_from_oc_id_fkey"
            columns: ["from_oc_id"]
            isOneToOne: false
            referencedRelation: "ocs"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_sessions: {
        Row: {
          chat_level: number
          created_at: string | null
          id: string
          images_allowed: boolean | null
          oc1_id: string
          oc2_id: string
          oc2_name: string | null
          oc2_user_id: string
          oc2_user_name: string | null
          scene_id: string | null
          scene_name: string | null
        }
        Insert: {
          chat_level?: number
          created_at?: string | null
          id?: string
          images_allowed?: boolean | null
          oc1_id: string
          oc2_id: string
          oc2_name?: string | null
          oc2_user_id: string
          oc2_user_name?: string | null
          scene_id?: string | null
          scene_name?: string | null
        }
        Update: {
          chat_level?: number
          created_at?: string | null
          id?: string
          images_allowed?: boolean | null
          oc1_id?: string
          oc2_id?: string
          oc2_name?: string | null
          oc2_user_id?: string
          oc2_user_name?: string | null
          scene_id?: string | null
          scene_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_sessions_oc1_id_fkey"
            columns: ["oc1_id"]
            isOneToOne: false
            referencedRelation: "ocs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_sessions_oc2_id_fkey"
            columns: ["oc2_id"]
            isOneToOne: false
            referencedRelation: "ocs"
            referencedColumns: ["id"]
          },
        ]
      }
      kintwin_whitelist: {
        Row: {
          created_at: string | null
          email: string
          id: string
          sol_balance: number | null
          updated_at: string | null
          verified: boolean | null
          wallet: string
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          sol_balance?: number | null
          updated_at?: string | null
          verified?: boolean | null
          wallet: string
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          sol_balance?: number | null
          updated_at?: string | null
          verified?: boolean | null
          wallet?: string
        }
        Relationships: []
      }
      match_preferences: {
        Row: {
          created_at: string | null
          id: string
          oc_id: string
          seeking_tags: string[] | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          oc_id: string
          seeking_tags?: string[] | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          oc_id?: string
          seeking_tags?: string[] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "match_preferences_oc_id_fkey"
            columns: ["oc_id"]
            isOneToOne: true
            referencedRelation: "ocs"
            referencedColumns: ["id"]
          },
        ]
      }
      oc_badges: {
        Row: {
          created_at: string | null
          from_oc_id: string
          from_oc_name: string | null
          from_user_id: string
          icon: string
          id: string
          message: string | null
          name: string
          oc_id: string
        }
        Insert: {
          created_at?: string | null
          from_oc_id: string
          from_oc_name?: string | null
          from_user_id: string
          icon: string
          id?: string
          message?: string | null
          name: string
          oc_id: string
        }
        Update: {
          created_at?: string | null
          from_oc_id?: string
          from_oc_name?: string | null
          from_user_id?: string
          icon?: string
          id?: string
          message?: string | null
          name?: string
          oc_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "oc_badges_from_oc_id_fkey"
            columns: ["from_oc_id"]
            isOneToOne: false
            referencedRelation: "ocs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "oc_badges_oc_id_fkey"
            columns: ["oc_id"]
            isOneToOne: false
            referencedRelation: "ocs"
            referencedColumns: ["id"]
          },
        ]
      }
      oc_fields: {
        Row: {
          field_key: string
          field_type: string
          id: string
          label: string
          oc_id: string
          skipped: boolean | null
          sort_order: number | null
          value: string | null
          visible: boolean | null
        }
        Insert: {
          field_key: string
          field_type?: string
          id?: string
          label: string
          oc_id: string
          skipped?: boolean | null
          sort_order?: number | null
          value?: string | null
          visible?: boolean | null
        }
        Update: {
          field_key?: string
          field_type?: string
          id?: string
          label?: string
          oc_id?: string
          skipped?: boolean | null
          sort_order?: number | null
          value?: string | null
          visible?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "oc_fields_oc_id_fkey"
            columns: ["oc_id"]
            isOneToOne: false
            referencedRelation: "ocs"
            referencedColumns: ["id"]
          },
        ]
      }
      oc_open_feed: {
        Row: {
          content: string
          created_at: string | null
          id: string
          oc_id: string
          visible: boolean | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          oc_id: string
          visible?: boolean | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          oc_id?: string
          visible?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "oc_open_feed_oc_id_fkey"
            columns: ["oc_id"]
            isOneToOne: false
            referencedRelation: "ocs"
            referencedColumns: ["id"]
          },
        ]
      }
      oc_visible_badges: {
        Row: {
          badge_id: string
          oc_id: string
        }
        Insert: {
          badge_id: string
          oc_id: string
        }
        Update: {
          badge_id?: string
          oc_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "oc_visible_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "oc_badges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "oc_visible_badges_oc_id_fkey"
            columns: ["oc_id"]
            isOneToOne: false
            referencedRelation: "ocs"
            referencedColumns: ["id"]
          },
        ]
      }
      ocs: {
        Row: {
          brand: number | null
          created_at: string | null
          id: string
          image_url: string | null
          images: string[] | null
          is_hidden: boolean | null
          is_premade: boolean | null
          is_swipable: boolean
          name: string
          sort_order: number | null
          tags: string[] | null
          truths_and_lie: string[] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          brand?: number | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          images?: string[] | null
          is_hidden?: boolean | null
          is_premade?: boolean | null
          is_swipable?: boolean
          name?: string
          sort_order?: number | null
          tags?: string[] | null
          truths_and_lie?: string[] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          brand?: number | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          images?: string[] | null
          is_hidden?: boolean | null
          is_premade?: boolean | null
          is_swipable?: boolean
          name?: string
          sort_order?: number | null
          tags?: string[] | null
          truths_and_lie?: string[] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profile_views: {
        Row: {
          created_at: string | null
          id: string
          profile_id: string
          viewer_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          profile_id: string
          viewer_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          profile_id?: string
          viewer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_views_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          creator_artfight: string | null
          creator_avatar_url: string | null
          creator_bio: string | null
          creator_bluesky: string | null
          creator_cara: string | null
          creator_deviantart: string | null
          creator_discord: string | null
          creator_furaffinity: string | null
          creator_header_url: string | null
          creator_instagram: string | null
          creator_name: string | null
          creator_sheezy: string | null
          creator_toyhouse: string | null
          creator_tumblr: string | null
          creator_twitter: string | null
          creator_unvale: string | null
          creator_visible: boolean | null
          creator_weasyl: string | null
          creator_website: string | null
          display_name: string | null
          id: string
          large_chat_text: boolean | null
          status: string | null
          social_links_visible: Json | null
          updated_at: string | null
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          creator_artfight?: string | null
          creator_avatar_url?: string | null
          creator_bio?: string | null
          creator_bluesky?: string | null
          creator_cara?: string | null
          creator_deviantart?: string | null
          creator_discord?: string | null
          creator_furaffinity?: string | null
          creator_header_url?: string | null
          creator_instagram?: string | null
          creator_name?: string | null
          creator_sheezy?: string | null
          creator_toyhouse?: string | null
          creator_tumblr?: string | null
          creator_twitter?: string | null
          creator_unvale?: string | null
          creator_visible?: boolean | null
          creator_weasyl?: string | null
          creator_website?: string | null
          display_name?: string | null
          id: string
          large_chat_text?: boolean | null
          status?: string | null
          social_links_visible?: Json | null
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          creator_artfight?: string | null
          creator_avatar_url?: string | null
          creator_bio?: string | null
          creator_bluesky?: string | null
          creator_cara?: string | null
          creator_deviantart?: string | null
          creator_discord?: string | null
          creator_furaffinity?: string | null
          creator_header_url?: string | null
          creator_instagram?: string | null
          creator_name?: string | null
          creator_sheezy?: string | null
          creator_toyhouse?: string | null
          creator_tumblr?: string | null
          creator_twitter?: string | null
          creator_unvale?: string | null
          creator_visible?: boolean | null
          creator_weasyl?: string | null
          creator_website?: string | null
          display_name?: string | null
          id?: string
          large_chat_text?: boolean | null
          status?: string | null
          social_links_visible?: Json | null
          updated_at?: string | null
          username?: string | null
        }
        Relationships: []
      }
      reports: {
        Row: {
          created_at: string | null
          details: string | null
          id: string
          reason: string
          reported_oc_id: string
          reporter_id: string
        }
        Insert: {
          created_at?: string | null
          details?: string | null
          id?: string
          reason: string
          reported_oc_id: string
          reporter_id: string
        }
        Update: {
          created_at?: string | null
          details?: string | null
          id?: string
          reason?: string
          reported_oc_id?: string
          reporter_id?: string
        }
        Relationships: []
      }
      Rudis_Leaderboard: {
        Row: {
          achievements: string[] | null
          avatar: string | null
          burn_score: number
          created_at: string | null
          display_name: string
          id: string
          rank: number | null
          social_score: number
          stake_score: number
          total_score: number
          updated_at: string | null
          wallet: string
        }
        Insert: {
          achievements?: string[] | null
          avatar?: string | null
          burn_score?: number
          created_at?: string | null
          display_name: string
          id?: string
          rank?: number | null
          social_score?: number
          stake_score?: number
          total_score?: number
          updated_at?: string | null
          wallet: string
        }
        Update: {
          achievements?: string[] | null
          avatar?: string | null
          burn_score?: number
          created_at?: string | null
          display_name?: string
          id?: string
          rank?: number | null
          social_score?: number
          stake_score?: number
          total_score?: number
          updated_at?: string | null
          wallet?: string
        }
        Relationships: []
      }
      Rudis_NaughtyList: {
        Row: {
          created_at: string | null
          display_name: string | null
          evidence: string | null
          first_seen: string | null
          flagged_reason: string
          id: string
          last_active: string | null
          reports_count: number | null
          severity: string | null
          status: string | null
          token_launches: number
          updated_at: string | null
          wallet: string
        }
        Insert: {
          created_at?: string | null
          display_name?: string | null
          evidence?: string | null
          first_seen?: string | null
          flagged_reason?: string
          id?: string
          last_active?: string | null
          reports_count?: number | null
          severity?: string | null
          status?: string | null
          token_launches?: number
          updated_at?: string | null
          wallet: string
        }
        Update: {
          created_at?: string | null
          display_name?: string | null
          evidence?: string | null
          first_seen?: string | null
          flagged_reason?: string
          id?: string
          last_active?: string | null
          reports_count?: number | null
          severity?: string | null
          status?: string | null
          token_launches?: number
          updated_at?: string | null
          wallet?: string
        }
        Relationships: []
      }
      Rudis_StakingPositions: {
        Row: {
          amount: number
          created_at: string
          id: string
          lock_end_date: string | null
          pool_id: string
          rewards_claimed: number
          start_date: string
          wallet_address: string
        }
        Insert: {
          amount?: number
          created_at?: string
          id?: string
          lock_end_date?: string | null
          pool_id: string
          rewards_claimed?: number
          start_date?: string
          wallet_address: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          lock_end_date?: string | null
          pool_id?: string
          rewards_claimed?: number
          start_date?: string
          wallet_address?: string
        }
        Relationships: []
      }
      swipe_actions: {
        Row: {
          action: string
          created_at: string | null
          from_oc_id: string
          id: string
          to_oc_id: string
        }
        Insert: {
          action: string
          created_at?: string | null
          from_oc_id: string
          id?: string
          to_oc_id: string
        }
        Update: {
          action?: string
          created_at?: string | null
          from_oc_id?: string
          id?: string
          to_oc_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "swipe_actions_from_oc_id_fkey"
            columns: ["from_oc_id"]
            isOneToOne: false
            referencedRelation: "ocs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "swipe_actions_to_oc_id_fkey"
            columns: ["to_oc_id"]
            isOneToOne: false
            referencedRelation: "ocs"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      increment_chat_level: { Args: { chat_id: string }; Returns: undefined }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
