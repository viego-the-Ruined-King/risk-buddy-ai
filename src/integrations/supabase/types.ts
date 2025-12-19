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
      hazid_studies: {
        Row: {
          created_at: string
          executive_summary: string | null
          hazards: Json
          id: string
          purpose: string | null
          scope: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          executive_summary?: string | null
          hazards?: Json
          id?: string
          purpose?: string | null
          scope?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          executive_summary?: string | null
          hazards?: Json
          id?: string
          purpose?: string | null
          scope?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      hazop_studies: {
        Row: {
          created_at: string
          deviations: Json | null
          facility_type: string | null
          id: string
          lifecycle_phase: string | null
          nodes: Json | null
          operating_parameters: Json | null
          pnid_control_loops: string | null
          pnid_equipment: string | null
          pnid_information: string | null
          purpose: string | null
          scope_in: string | null
          scope_out: string | null
          study_description: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          deviations?: Json | null
          facility_type?: string | null
          id?: string
          lifecycle_phase?: string | null
          nodes?: Json | null
          operating_parameters?: Json | null
          pnid_control_loops?: string | null
          pnid_equipment?: string | null
          pnid_information?: string | null
          purpose?: string | null
          scope_in?: string | null
          scope_out?: string | null
          study_description?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          deviations?: Json | null
          facility_type?: string | null
          id?: string
          lifecycle_phase?: string | null
          nodes?: Json | null
          operating_parameters?: Json | null
          pnid_control_loops?: string | null
          pnid_equipment?: string | null
          pnid_information?: string | null
          purpose?: string | null
          scope_in?: string | null
          scope_out?: string | null
          study_description?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      lopa_studies: {
        Row: {
          conditional_modifiers: Json | null
          consequence_category: string | null
          consequence_description: string | null
          created_at: string
          enabling_conditions: Json | null
          equipment_number: string | null
          frequency_mitigated_consequences: number | null
          hazop_causes: Json | null
          hazop_consequences: string | null
          hazop_deviation: string | null
          hazop_deviation_id: string | null
          hazop_existing_safeguards: Json | null
          hazop_initial_risk: Json | null
          hazop_node_id: string | null
          hazop_study_id: string | null
          id: string
          iel_per_initiating_event: Json | null
          initiating_events: Json | null
          ipls: Json | null
          notes_assumptions: string | null
          pfd_target: number | null
          pfd_target_environment: number | null
          pfd_target_financial: number | null
          pfd_target_safety: number | null
          recommendations: string | null
          scenario_number: string
          scenario_title: string
          severity_level: string | null
          sil_environment: string | null
          sil_financial: string | null
          sil_required: string | null
          sil_safety: string | null
          status: string | null
          tmel: number | null
          tmel_basis: string | null
          total_iel: number | null
          total_mitigated_event_frequency: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          conditional_modifiers?: Json | null
          consequence_category?: string | null
          consequence_description?: string | null
          created_at?: string
          enabling_conditions?: Json | null
          equipment_number?: string | null
          frequency_mitigated_consequences?: number | null
          hazop_causes?: Json | null
          hazop_consequences?: string | null
          hazop_deviation?: string | null
          hazop_deviation_id?: string | null
          hazop_existing_safeguards?: Json | null
          hazop_initial_risk?: Json | null
          hazop_node_id?: string | null
          hazop_study_id?: string | null
          id?: string
          iel_per_initiating_event?: Json | null
          initiating_events?: Json | null
          ipls?: Json | null
          notes_assumptions?: string | null
          pfd_target?: number | null
          pfd_target_environment?: number | null
          pfd_target_financial?: number | null
          pfd_target_safety?: number | null
          recommendations?: string | null
          scenario_number: string
          scenario_title: string
          severity_level?: string | null
          sil_environment?: string | null
          sil_financial?: string | null
          sil_required?: string | null
          sil_safety?: string | null
          status?: string | null
          tmel?: number | null
          tmel_basis?: string | null
          total_iel?: number | null
          total_mitigated_event_frequency?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          conditional_modifiers?: Json | null
          consequence_category?: string | null
          consequence_description?: string | null
          created_at?: string
          enabling_conditions?: Json | null
          equipment_number?: string | null
          frequency_mitigated_consequences?: number | null
          hazop_causes?: Json | null
          hazop_consequences?: string | null
          hazop_deviation?: string | null
          hazop_deviation_id?: string | null
          hazop_existing_safeguards?: Json | null
          hazop_initial_risk?: Json | null
          hazop_node_id?: string | null
          hazop_study_id?: string | null
          id?: string
          iel_per_initiating_event?: Json | null
          initiating_events?: Json | null
          ipls?: Json | null
          notes_assumptions?: string | null
          pfd_target?: number | null
          pfd_target_environment?: number | null
          pfd_target_financial?: number | null
          pfd_target_safety?: number | null
          recommendations?: string | null
          scenario_number?: string
          scenario_title?: string
          severity_level?: string | null
          sil_environment?: string | null
          sil_financial?: string | null
          sil_required?: string | null
          sil_safety?: string | null
          status?: string | null
          tmel?: number | null
          tmel_basis?: string | null
          total_iel?: number | null
          total_mitigated_event_frequency?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lopa_studies_hazop_study_id_fkey"
            columns: ["hazop_study_id"]
            isOneToOne: false
            referencedRelation: "hazop_studies"
            referencedColumns: ["id"]
          },
        ]
      }
      risk_assessments: {
        Row: {
          activity_type: string | null
          created_at: string
          description: string | null
          hazards: Json
          id: string
          location: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          activity_type?: string | null
          created_at?: string
          description?: string | null
          hazards?: Json
          id?: string
          location?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          activity_type?: string | null
          created_at?: string
          description?: string | null
          hazards?: Json
          id?: string
          location?: string | null
          title?: string
          updated_at?: string
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
