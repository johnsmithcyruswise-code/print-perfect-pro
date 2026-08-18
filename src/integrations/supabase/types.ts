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
      coupons: {
        Row: {
          active: boolean
          code: string
          created_at: string
          description: string | null
          percent_off: number
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          description?: string | null
          percent_off: number
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          description?: string | null
          percent_off?: number
        }
        Relationships: []
      }
      document_versions: {
        Row: {
          content: Json
          document_id: string
          id: string
          saved_at: string
          version: number
          word_count: number
        }
        Insert: {
          content: Json
          document_id: string
          id?: string
          saved_at?: string
          version: number
          word_count?: number
        }
        Update: {
          content?: Json
          document_id?: string
          id?: string
          saved_at?: string
          version?: number
          word_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "document_versions_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          content: Json
          content_plain: string
          created_at: string
          id: string
          last_autosave: string | null
          order_id: string | null
          paper_size: string
          template_used: string | null
          title: string
          updated_at: string
          user_id: string
          version: number
          word_count: number
        }
        Insert: {
          content?: Json
          content_plain?: string
          created_at?: string
          id?: string
          last_autosave?: string | null
          order_id?: string | null
          paper_size?: string
          template_used?: string | null
          title?: string
          updated_at?: string
          user_id: string
          version?: number
          word_count?: number
        }
        Update: {
          content?: Json
          content_plain?: string
          created_at?: string
          id?: string
          last_autosave?: string | null
          order_id?: string | null
          paper_size?: string
          template_used?: string | null
          title?: string
          updated_at?: string
          user_id?: string
          version?: number
          word_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "documents_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          message: string | null
          order_id: string | null
          read_at: string | null
          subject: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message?: string | null
          order_id?: string | null
          read_at?: string | null
          subject: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string | null
          order_id?: string | null
          read_at?: string | null
          subject?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_events: {
        Row: {
          created_at: string
          id: string
          note: string | null
          order_id: string
          status: Database["public"]["Enums"]["order_status"]
        }
        Insert: {
          created_at?: string
          id?: string
          note?: string | null
          order_id: string
          status: Database["public"]["Enums"]["order_status"]
        }
        Update: {
          created_at?: string
          id?: string
          note?: string | null
          order_id?: string
          status?: Database["public"]["Enums"]["order_status"]
        }
        Relationships: [
          {
            foreignKeyName: "order_events_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_files: {
        Row: {
          content_type: string | null
          created_at: string
          file_name: string
          file_path: string
          id: string
          order_id: string
          size_bytes: number
          user_id: string
        }
        Insert: {
          content_type?: string | null
          created_at?: string
          file_name: string
          file_path: string
          id?: string
          order_id: string
          size_bytes?: number
          user_id: string
        }
        Update: {
          content_type?: string | null
          created_at?: string
          file_name?: string
          file_path?: string
          id?: string
          order_id?: string
          size_bytes?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_files_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          addons: string[]
          address: string | null
          assigned_printer_id: string | null
          binding: string
          color_mode: string
          coupon_code: string | null
          created_at: string
          custom_height_mm: number | null
          custom_width_mm: number | null
          customer_notes: string | null
          delivery_method: string
          discount: number
          id: string
          notes: string | null
          order_number: string
          paid: boolean
          paper_size: string
          paper_type: string
          pickup_deadline: string | null
          quantity: number
          sides: string
          staff_notes: string | null
          staff_price: number | null
          status: Database["public"]["Enums"]["order_status"]
          subtotal: number
          total: number
          turnaround: string
          unit_price: number
          updated_at: string
          user_id: string
        }
        Insert: {
          addons?: string[]
          address?: string | null
          assigned_printer_id?: string | null
          binding?: string
          color_mode: string
          coupon_code?: string | null
          created_at?: string
          custom_height_mm?: number | null
          custom_width_mm?: number | null
          customer_notes?: string | null
          delivery_method?: string
          discount?: number
          id?: string
          notes?: string | null
          order_number?: string
          paid?: boolean
          paper_size: string
          paper_type: string
          pickup_deadline?: string | null
          quantity?: number
          sides: string
          staff_notes?: string | null
          staff_price?: number | null
          status?: Database["public"]["Enums"]["order_status"]
          subtotal?: number
          total?: number
          turnaround?: string
          unit_price?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          addons?: string[]
          address?: string | null
          assigned_printer_id?: string | null
          binding?: string
          color_mode?: string
          coupon_code?: string | null
          created_at?: string
          custom_height_mm?: number | null
          custom_width_mm?: number | null
          customer_notes?: string | null
          delivery_method?: string
          discount?: number
          id?: string
          notes?: string | null
          order_number?: string
          paid?: boolean
          paper_size?: string
          paper_type?: string
          pickup_deadline?: string | null
          quantity?: number
          sides?: string
          staff_notes?: string | null
          staff_price?: number | null
          status?: Database["public"]["Enums"]["order_status"]
          subtotal?: number
          total?: number
          turnaround?: string
          unit_price?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_assigned_printer_id_fkey"
            columns: ["assigned_printer_id"]
            isOneToOne: false
            referencedRelation: "printers"
            referencedColumns: ["id"]
          },
        ]
      }
      print_logs: {
        Row: {
          ezeep_job_id: string | null
          id: string
          operator_id: string
          order_id: string
          pages_printed: number
          printed_at: string
          printer_id: string | null
        }
        Insert: {
          ezeep_job_id?: string | null
          id?: string
          operator_id: string
          order_id: string
          pages_printed?: number
          printed_at?: string
          printer_id?: string | null
        }
        Update: {
          ezeep_job_id?: string | null
          id?: string
          operator_id?: string
          order_id?: string
          pages_printed?: number
          printed_at?: string
          printer_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "print_logs_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "print_logs_printer_id_fkey"
            columns: ["printer_id"]
            isOneToOne: false
            referencedRelation: "printers"
            referencedColumns: ["id"]
          },
        ]
      }
      printers: {
        Row: {
          created_at: string
          ezeep_device_id: string | null
          id: string
          ip_address: string | null
          is_default: boolean
          location: string | null
          model: string | null
          name: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          ezeep_device_id?: string | null
          id?: string
          ip_address?: string | null
          is_default?: boolean
          location?: string | null
          model?: string | null
          name: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          ezeep_device_id?: string | null
          id?: string
          ip_address?: string | null
          is_default?: boolean
          location?: string | null
          model?: string | null
          name?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          last_lat: number | null
          last_lng: number | null
          last_location_accuracy: number | null
          last_location_at: string | null
          location_consent: boolean
          phone: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          last_lat?: number | null
          last_lng?: number | null
          last_location_accuracy?: number | null
          last_location_at?: string | null
          location_consent?: boolean
          phone?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          last_lat?: number | null
          last_lng?: number | null
          last_location_accuracy?: number | null
          last_location_at?: string | null
          location_consent?: boolean
          phone?: string | null
        }
        Relationships: []
      }
      recent_files: {
        Row: {
          created_at: string
          file_name: string
          file_path: string
          file_size: number
          file_type: string | null
          id: string
          last_accessed: string
          user_id: string
        }
        Insert: {
          created_at?: string
          file_name: string
          file_path: string
          file_size?: number
          file_type?: string | null
          id?: string
          last_accessed?: string
          user_id: string
        }
        Update: {
          created_at?: string
          file_name?: string
          file_path?: string
          file_size?: number
          file_type?: string | null
          id?: string
          last_accessed?: string
          user_id?: string
        }
        Relationships: []
      }
      templates: {
        Row: {
          category: string
          content: Json
          created_at: string
          description: string | null
          id: string
          is_public: boolean
          name: string
          paper_size: string
        }
        Insert: {
          category?: string
          content: Json
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean
          name: string
          paper_size?: string
        }
        Update: {
          category?: string
          content?: Json
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean
          name?: string
          paper_size?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
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
      is_staff: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "manager" | "operator" | "csr" | "customer"
      order_status:
        | "pending"
        | "processing"
        | "printing"
        | "qa"
        | "ready"
        | "shipped"
        | "cancelled"
        | "completed"
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
      app_role: ["admin", "manager", "operator", "csr", "customer"],
      order_status: [
        "pending",
        "processing",
        "printing",
        "qa",
        "ready",
        "shipped",
        "cancelled",
        "completed",
      ],
    },
  },
} as const
