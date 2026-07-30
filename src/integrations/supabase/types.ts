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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      appointments: {
        Row: {
          blood_bank_id: string | null
          created_at: string
          donor_id: string | null
          donor_user_id: string | null
          hospital_id: string | null
          id: string
          notes: string | null
          scheduled_at: string
          status: Database["public"]["Enums"]["appointment_status"]
          updated_at: string
        }
        Insert: {
          blood_bank_id?: string | null
          created_at?: string
          donor_id?: string | null
          donor_user_id?: string | null
          hospital_id?: string | null
          id?: string
          notes?: string | null
          scheduled_at: string
          status?: Database["public"]["Enums"]["appointment_status"]
          updated_at?: string
        }
        Update: {
          blood_bank_id?: string | null
          created_at?: string
          donor_id?: string | null
          donor_user_id?: string | null
          hospital_id?: string | null
          id?: string
          notes?: string | null
          scheduled_at?: string
          status?: Database["public"]["Enums"]["appointment_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_blood_bank_id_fkey"
            columns: ["blood_bank_id"]
            isOneToOne: false
            referencedRelation: "blood_banks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_donor_id_fkey"
            columns: ["donor_id"]
            isOneToOne: false
            referencedRelation: "donors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: string
          meta: Json | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          meta?: Json | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          meta?: Json | null
        }
        Relationships: []
      }
      blood_banks: {
        Row: {
          address: string | null
          city: string
          created_at: string
          district: string
          email: string | null
          id: string
          latitude: number | null
          license_url: string | null
          longitude: number | null
          name: string
          owner_id: string | null
          phone: string | null
          status: Database["public"]["Enums"]["approval_status"]
          updated_at: string
        }
        Insert: {
          address?: string | null
          city?: string
          created_at?: string
          district?: string
          email?: string | null
          id?: string
          latitude?: number | null
          license_url?: string | null
          longitude?: number | null
          name: string
          owner_id?: string | null
          phone?: string | null
          status?: Database["public"]["Enums"]["approval_status"]
          updated_at?: string
        }
        Update: {
          address?: string | null
          city?: string
          created_at?: string
          district?: string
          email?: string | null
          id?: string
          latitude?: number | null
          license_url?: string | null
          longitude?: number | null
          name?: string
          owner_id?: string | null
          phone?: string | null
          status?: Database["public"]["Enums"]["approval_status"]
          updated_at?: string
        }
        Relationships: []
      }
      blood_inventory: {
        Row: {
          batch_code: string | null
          blood_bank_id: string
          blood_type: Database["public"]["Enums"]["blood_type"]
          created_at: string
          expiry_date: string | null
          id: string
          units: number
          updated_at: string
        }
        Insert: {
          batch_code?: string | null
          blood_bank_id: string
          blood_type: Database["public"]["Enums"]["blood_type"]
          created_at?: string
          expiry_date?: string | null
          id?: string
          units?: number
          updated_at?: string
        }
        Update: {
          batch_code?: string | null
          blood_bank_id?: string
          blood_type?: Database["public"]["Enums"]["blood_type"]
          created_at?: string
          expiry_date?: string | null
          id?: string
          units?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "blood_inventory_blood_bank_id_fkey"
            columns: ["blood_bank_id"]
            isOneToOne: false
            referencedRelation: "blood_banks"
            referencedColumns: ["id"]
          },
        ]
      }
      bookmarks: {
        Row: {
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      chat_participants: {
        Row: {
          chat_id: string
          user_id: string
        }
        Insert: {
          chat_id: string
          user_id: string
        }
        Update: {
          chat_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_participants_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chats"
            referencedColumns: ["id"]
          },
        ]
      }
      chats: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          subject: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          subject?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          subject?: string | null
        }
        Relationships: []
      }
      donors: {
        Row: {
          blood_type: Database["public"]["Enums"]["blood_type"]
          city: string
          created_at: string
          district: string
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          full_name: string
          health_notes: string | null
          id: string
          is_available: boolean
          last_donation_date: string | null
          latitude: number | null
          lives_saved: number
          longitude: number | null
          phone: string | null
          status: Database["public"]["Enums"]["approval_status"]
          total_donations: number
          updated_at: string
          user_id: string | null
          weight_kg: number | null
        }
        Insert: {
          blood_type: Database["public"]["Enums"]["blood_type"]
          city?: string
          created_at?: string
          district?: string
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          full_name: string
          health_notes?: string | null
          id?: string
          is_available?: boolean
          last_donation_date?: string | null
          latitude?: number | null
          lives_saved?: number
          longitude?: number | null
          phone?: string | null
          status?: Database["public"]["Enums"]["approval_status"]
          total_donations?: number
          updated_at?: string
          user_id?: string | null
          weight_kg?: number | null
        }
        Update: {
          blood_type?: Database["public"]["Enums"]["blood_type"]
          city?: string
          created_at?: string
          district?: string
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          full_name?: string
          health_notes?: string | null
          id?: string
          is_available?: boolean
          last_donation_date?: string | null
          latitude?: number | null
          lives_saved?: number
          longitude?: number | null
          phone?: string | null
          status?: Database["public"]["Enums"]["approval_status"]
          total_donations?: number
          updated_at?: string
          user_id?: string | null
          weight_kg?: number | null
        }
        Relationships: []
      }
      emergency_requests: {
        Row: {
          blood_type: Database["public"]["Enums"]["blood_type"]
          created_at: string
          created_by: string | null
          hospital_id: string | null
          id: string
          needed_by: string
          notes: string | null
          patient_condition: string | null
          status: Database["public"]["Enums"]["request_status"]
          units_needed: number
          units_received: number
          updated_at: string
          urgency: Database["public"]["Enums"]["urgency_level"]
        }
        Insert: {
          blood_type: Database["public"]["Enums"]["blood_type"]
          created_at?: string
          created_by?: string | null
          hospital_id?: string | null
          id?: string
          needed_by?: string
          notes?: string | null
          patient_condition?: string | null
          status?: Database["public"]["Enums"]["request_status"]
          units_needed?: number
          units_received?: number
          updated_at?: string
          urgency?: Database["public"]["Enums"]["urgency_level"]
        }
        Update: {
          blood_type?: Database["public"]["Enums"]["blood_type"]
          created_at?: string
          created_by?: string | null
          hospital_id?: string | null
          id?: string
          needed_by?: string
          notes?: string | null
          patient_condition?: string | null
          status?: Database["public"]["Enums"]["request_status"]
          units_needed?: number
          units_received?: number
          updated_at?: string
          urgency?: Database["public"]["Enums"]["urgency_level"]
        }
        Relationships: [
          {
            foreignKeyName: "emergency_requests_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
        ]
      }
      emergency_responses: {
        Row: {
          blood_bank_id: string | null
          created_at: string
          donor_id: string | null
          eta_minutes: number | null
          id: string
          match_score: number | null
          note: string | null
          request_id: string
          responder_user_id: string | null
          status: Database["public"]["Enums"]["response_status"]
          updated_at: string
        }
        Insert: {
          blood_bank_id?: string | null
          created_at?: string
          donor_id?: string | null
          eta_minutes?: number | null
          id?: string
          match_score?: number | null
          note?: string | null
          request_id: string
          responder_user_id?: string | null
          status?: Database["public"]["Enums"]["response_status"]
          updated_at?: string
        }
        Update: {
          blood_bank_id?: string | null
          created_at?: string
          donor_id?: string | null
          eta_minutes?: number | null
          id?: string
          match_score?: number | null
          note?: string | null
          request_id?: string
          responder_user_id?: string | null
          status?: Database["public"]["Enums"]["response_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "emergency_responses_blood_bank_id_fkey"
            columns: ["blood_bank_id"]
            isOneToOne: false
            referencedRelation: "blood_banks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "emergency_responses_donor_id_fkey"
            columns: ["donor_id"]
            isOneToOne: false
            referencedRelation: "donors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "emergency_responses_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "emergency_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      hospitals: {
        Row: {
          address: string | null
          city: string
          created_at: string
          district: string
          email: string | null
          id: string
          latitude: number | null
          license_url: string | null
          longitude: number | null
          name: string
          owner_id: string | null
          phone: string | null
          status: Database["public"]["Enums"]["approval_status"]
          updated_at: string
        }
        Insert: {
          address?: string | null
          city?: string
          created_at?: string
          district?: string
          email?: string | null
          id?: string
          latitude?: number | null
          license_url?: string | null
          longitude?: number | null
          name: string
          owner_id?: string | null
          phone?: string | null
          status?: Database["public"]["Enums"]["approval_status"]
          updated_at?: string
        }
        Update: {
          address?: string | null
          city?: string
          created_at?: string
          district?: string
          email?: string | null
          id?: string
          latitude?: number | null
          license_url?: string | null
          longitude?: number | null
          name?: string
          owner_id?: string | null
          phone?: string | null
          status?: Database["public"]["Enums"]["approval_status"]
          updated_at?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          body: string
          chat_id: string
          created_at: string
          id: string
          is_read: boolean
          sender_id: string
        }
        Insert: {
          body: string
          chat_id: string
          created_at?: string
          id?: string
          is_read?: boolean
          sender_id: string
        }
        Update: {
          body?: string
          chat_id?: string
          created_at?: string
          id?: string
          is_read?: boolean
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chats"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          is_read: boolean
          kind: string
          link: string | null
          title: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          kind?: string
          link?: string | null
          title: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          kind?: string
          link?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          city: string | null
          country: string
          created_at: string
          district: string | null
          email: string | null
          full_name: string
          id: string
          national_id_url: string | null
          phone: string | null
          status: Database["public"]["Enums"]["approval_status"]
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          city?: string | null
          country?: string
          created_at?: string
          district?: string | null
          email?: string | null
          full_name?: string
          id: string
          national_id_url?: string | null
          phone?: string | null
          status?: Database["public"]["Enums"]["approval_status"]
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          city?: string | null
          country?: string
          created_at?: string
          district?: string | null
          email?: string | null
          full_name?: string
          id?: string
          national_id_url?: string | null
          phone?: string | null
          status?: Database["public"]["Enums"]["approval_status"]
          updated_at?: string
        }
        Relationships: []
      }
      ratings: {
        Row: {
          comment: string | null
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          score: number
          user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          score: number
          user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          score?: number
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_chat_participant: {
        Args: { _chat_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "donor" | "hospital" | "blood_bank" | "admin"
      appointment_status:
        | "scheduled"
        | "completed"
        | "cancelled"
        | "rescheduled"
        | "rejected"
        | "approved"
      approval_status: "pending" | "approved" | "rejected" | "suspended"
      blood_type: "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-"
      request_status:
        | "open"
        | "partially_fulfilled"
        | "fulfilled"
        | "cancelled"
        | "expired"
      response_status: "pending" | "accepted" | "declined" | "completed"
      urgency_level: "low" | "moderate" | "high" | "critical"
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
    Enums: {
      app_role: ["donor", "hospital", "blood_bank", "admin"],
      appointment_status: [
        "scheduled",
        "completed",
        "cancelled",
        "rescheduled",
        "rejected",
        "approved",
      ],
      approval_status: ["pending", "approved", "rejected", "suspended"],
      blood_type: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
      request_status: [
        "open",
        "partially_fulfilled",
        "fulfilled",
        "cancelled",
        "expired",
      ],
      response_status: ["pending", "accepted", "declined", "completed"],
      urgency_level: ["low", "moderate", "high", "critical"],
    },
  },
} as const
