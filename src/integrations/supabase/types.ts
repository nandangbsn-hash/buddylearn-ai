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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      badges: {
        Row: {
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          name: string
          requirement_type: string
          requirement_value: number
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          requirement_type: string
          requirement_value: number
        }
        Update: {
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          requirement_type?: string
          requirement_value?: number
        }
        Relationships: []
      }
      email_preferences: {
        Row: {
          created_at: string | null
          daily_digest_enabled: boolean | null
          digest_time: string | null
          id: string
          include_overdue: boolean | null
          include_this_week: boolean | null
          include_today: boolean | null
          include_upcoming: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          daily_digest_enabled?: boolean | null
          digest_time?: string | null
          id?: string
          include_overdue?: boolean | null
          include_this_week?: boolean | null
          include_today?: boolean | null
          include_upcoming?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          daily_digest_enabled?: boolean | null
          digest_time?: string | null
          id?: string
          include_overdue?: boolean | null
          include_this_week?: boolean | null
          include_today?: boolean | null
          include_upcoming?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      homework_submissions: {
        Row: {
          description: string | null
          file_type: string | null
          file_url: string | null
          id: string
          reviewed_at: string | null
          status: string | null
          subject_id: string | null
          submitted_at: string | null
          title: string
          user_id: string
          xp_awarded: number | null
        }
        Insert: {
          description?: string | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          reviewed_at?: string | null
          status?: string | null
          subject_id?: string | null
          submitted_at?: string | null
          title: string
          user_id: string
          xp_awarded?: number | null
        }
        Update: {
          description?: string | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          reviewed_at?: string | null
          status?: string | null
          subject_id?: string | null
          submitted_at?: string | null
          title?: string
          user_id?: string
          xp_awarded?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "homework_submissions_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      material_summaries: {
        Row: {
          created_at: string | null
          id: string
          key_points: string[] | null
          material_id: string
          summary: string | null
          topic_dependencies: string[] | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          key_points?: string[] | null
          material_id: string
          summary?: string | null
          topic_dependencies?: string[] | null
        }
        Update: {
          created_at?: string | null
          id?: string
          key_points?: string[] | null
          material_id?: string
          summary?: string | null
          topic_dependencies?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "material_summaries_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
        ]
      }
      materials: {
        Row: {
          content: string | null
          created_at: string | null
          difficulty: string | null
          estimated_time_minutes: number | null
          file_type: string
          file_url: string | null
          id: string
          keywords: string[] | null
          subject_id: string | null
          title: string
          topic: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          difficulty?: string | null
          estimated_time_minutes?: number | null
          file_type: string
          file_url?: string | null
          id?: string
          keywords?: string[] | null
          subject_id?: string | null
          title: string
          topic?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string | null
          created_at?: string | null
          difficulty?: string | null
          estimated_time_minutes?: number | null
          file_type?: string
          file_url?: string | null
          id?: string
          keywords?: string[] | null
          subject_id?: string | null
          title?: string
          topic?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "materials_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string
          full_name: string | null
          grade_level: string | null
          id: string
          learning_pace: string | null
          learning_style: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          full_name?: string | null
          grade_level?: string | null
          id: string
          learning_pace?: string | null
          learning_style?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          full_name?: string | null
          grade_level?: string | null
          id?: string
          learning_pace?: string | null
          learning_style?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      quiz_attempts: {
        Row: {
          answers: Json | null
          completed_at: string | null
          id: string
          quiz_id: string
          score: number
          total_questions: number
          user_id: string
        }
        Insert: {
          answers?: Json | null
          completed_at?: string | null
          id?: string
          quiz_id: string
          score: number
          total_questions: number
          user_id: string
        }
        Update: {
          answers?: Json | null
          completed_at?: string | null
          id?: string
          quiz_id?: string
          score?: number
          total_questions?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_attempts_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quizzes: {
        Row: {
          created_at: string | null
          id: string
          material_id: string
          questions: Json
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          material_id: string
          questions: Json
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          material_id?: string
          questions?: Json
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quizzes_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
        ]
      }
      study_plans: {
        Row: {
          completed: boolean | null
          created_at: string | null
          description: string | null
          due_date: string
          id: string
          priority: string | null
          reminder_sent: boolean | null
          subject_id: string | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          completed?: boolean | null
          created_at?: string | null
          description?: string | null
          due_date: string
          id?: string
          priority?: string | null
          reminder_sent?: boolean | null
          subject_id?: string | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          completed?: boolean | null
          created_at?: string | null
          description?: string | null
          due_date?: string
          id?: string
          priority?: string | null
          reminder_sent?: boolean | null
          subject_id?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_plans_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      study_sessions: {
        Row: {
          created_at: string | null
          duration_minutes: number
          focus_score: number | null
          id: string
          material_id: string | null
          notes: string | null
          session_date: string | null
          subject_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          duration_minutes: number
          focus_score?: number | null
          id?: string
          material_id?: string | null
          notes?: string | null
          session_date?: string | null
          subject_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          duration_minutes?: number
          focus_score?: number | null
          id?: string
          material_id?: string | null
          notes?: string | null
          session_date?: string | null
          subject_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_sessions_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "study_sessions_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      subjects: {
        Row: {
          color_code: string | null
          created_at: string | null
          icon: string | null
          id: string
          name: string
          user_id: string
        }
        Insert: {
          color_code?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string
          name: string
          user_id: string
        }
        Update: {
          color_code?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      user_badges: {
        Row: {
          badge_id: string
          earned_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          badge_id: string
          earned_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          badge_id?: string
          earned_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
        ]
      }
      user_progress: {
        Row: {
          created_at: string | null
          current_streak: number | null
          id: string
          last_activity_date: string | null
          level: number | null
          longest_streak: number | null
          total_xp: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          current_streak?: number | null
          id?: string
          last_activity_date?: string | null
          level?: number | null
          longest_streak?: number | null
          total_xp?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          current_streak?: number | null
          id?: string
          last_activity_date?: string | null
          level?: number | null
          longest_streak?: number | null
          total_xp?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
