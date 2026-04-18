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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      blog_posts: {
        Row: {
          author_id: string
          category: string | null
          content: string
          content_ar: string
          content_fr: string
          created_at: string
          id: string
          image_url: string | null
          is_published: boolean | null
          published_at: string | null
          title: string
          title_ar: string
          title_fr: string
          updated_at: string
        }
        Insert: {
          author_id: string
          category?: string | null
          content: string
          content_ar: string
          content_fr: string
          created_at?: string
          id?: string
          image_url?: string | null
          is_published?: boolean | null
          published_at?: string | null
          title: string
          title_ar: string
          title_fr: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          category?: string | null
          content?: string
          content_ar?: string
          content_fr?: string
          created_at?: string
          id?: string
          image_url?: string | null
          is_published?: boolean | null
          published_at?: string | null
          title?: string
          title_ar?: string
          title_fr?: string
          updated_at?: string
        }
        Relationships: []
      }
      clients: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          name: string
          phone: string
          points: number | null
          total_games_played: number | null
          total_spent: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
          phone: string
          points?: number | null
          total_games_played?: number | null
          total_spent?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          phone?: string
          points?: number | null
          total_games_played?: number | null
          total_spent?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      consoles: {
        Row: {
          console_type: string
          created_at: string
          current_session_id: string | null
          id: string
          name: string
          station_number: number
          status: string | null
          updated_at: string
        }
        Insert: {
          console_type: string
          created_at?: string
          current_session_id?: string | null
          id?: string
          name: string
          station_number: number
          status?: string | null
          updated_at?: string
        }
        Update: {
          console_type?: string
          created_at?: string
          current_session_id?: string | null
          id?: string
          name?: string
          station_number?: number
          status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      daily_stats: {
        Row: {
          created_at: string
          date: string
          gaming_revenue: number | null
          id: string
          sales_revenue: number | null
          service_revenue: number | null
          total_revenue: number | null
          total_sales: number | null
          total_services: number | null
          total_sessions: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          date: string
          gaming_revenue?: number | null
          id?: string
          sales_revenue?: number | null
          service_revenue?: number | null
          total_revenue?: number | null
          total_sales?: number | null
          total_services?: number | null
          total_sessions?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          date?: string
          gaming_revenue?: number | null
          id?: string
          sales_revenue?: number | null
          service_revenue?: number | null
          total_revenue?: number | null
          total_sales?: number | null
          total_services?: number | null
          total_sessions?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      gaming_sessions: {
        Row: {
          base_amount: number | null
          client_id: string | null
          console_id: string
          created_at: string
          end_time: string | null
          extra_amount: number | null
          extra_time_minutes: number | null
          games_played: number | null
          id: string
          is_free_game: boolean | null
          notes: string | null
          payment_method: string | null
          points_earned: number | null
          points_used: number | null
          pricing_id: string
          session_type: string
          staff_id: string
          start_time: string
          status: string | null
          total_amount: number | null
        }
        Insert: {
          base_amount?: number | null
          client_id?: string | null
          console_id: string
          created_at?: string
          end_time?: string | null
          extra_amount?: number | null
          extra_time_minutes?: number | null
          games_played?: number | null
          id?: string
          is_free_game?: boolean | null
          notes?: string | null
          payment_method?: string | null
          points_earned?: number | null
          points_used?: number | null
          pricing_id: string
          session_type: string
          staff_id: string
          start_time?: string
          status?: string | null
          total_amount?: number | null
        }
        Update: {
          base_amount?: number | null
          client_id?: string | null
          console_id?: string
          created_at?: string
          end_time?: string | null
          extra_amount?: number | null
          extra_time_minutes?: number | null
          games_played?: number | null
          id?: string
          is_free_game?: boolean | null
          notes?: string | null
          payment_method?: string | null
          points_earned?: number | null
          points_used?: number | null
          pricing_id?: string
          session_type?: string
          staff_id?: string
          start_time?: string
          status?: string | null
          total_amount?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "gaming_sessions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gaming_sessions_console_id_fkey"
            columns: ["console_id"]
            isOneToOne: false
            referencedRelation: "consoles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gaming_sessions_pricing_id_fkey"
            columns: ["pricing_id"]
            isOneToOne: false
            referencedRelation: "pricing"
            referencedColumns: ["id"]
          },
        ]
      }
      points_transactions: {
        Row: {
          amount: number
          balance_after: number
          client_id: string
          confirmed_by_client: boolean | null
          confirmed_by_staff: boolean | null
          created_at: string
          description: string | null
          id: string
          reference_id: string | null
          reference_type: string | null
          staff_id: string | null
          transaction_type: string
        }
        Insert: {
          amount: number
          balance_after: number
          client_id: string
          confirmed_by_client?: boolean | null
          confirmed_by_staff?: boolean | null
          created_at?: string
          description?: string | null
          id?: string
          reference_id?: string | null
          reference_type?: string | null
          staff_id?: string | null
          transaction_type: string
        }
        Update: {
          amount?: number
          balance_after?: number
          client_id?: string
          confirmed_by_client?: boolean | null
          confirmed_by_staff?: boolean | null
          created_at?: string
          description?: string | null
          id?: string
          reference_id?: string | null
          reference_type?: string | null
          staff_id?: string | null
          transaction_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "points_transactions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      pricing: {
        Row: {
          console_type: string
          created_at: string
          extra_time_price: number | null
          game_duration_minutes: number | null
          id: string
          is_active: boolean | null
          name: string
          points_earned: number | null
          price: number
          price_type: string
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          console_type: string
          created_at?: string
          extra_time_price?: number | null
          game_duration_minutes?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          points_earned?: number | null
          price: number
          price_type: string
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          console_type?: string
          created_at?: string
          extra_time_price?: number | null
          game_duration_minutes?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          points_earned?: number | null
          price?: number
          price_type?: string
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          category: string
          cost_price: number | null
          created_at: string
          description: string | null
          description_ar: string | null
          description_fr: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          name: string
          name_ar: string
          name_fr: string
          points_earned: number | null
          points_price: number | null
          price: number
          stock_quantity: number | null
          updated_at: string
        }
        Insert: {
          category: string
          cost_price?: number | null
          created_at?: string
          description?: string | null
          description_ar?: string | null
          description_fr?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name: string
          name_ar: string
          name_fr: string
          points_earned?: number | null
          points_price?: number | null
          price: number
          stock_quantity?: number | null
          updated_at?: string
        }
        Update: {
          category?: string
          cost_price?: number | null
          created_at?: string
          description?: string | null
          description_ar?: string | null
          description_fr?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name?: string
          name_ar?: string
          name_fr?: string
          points_earned?: number | null
          points_price?: number | null
          price?: number
          stock_quantity?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          created_at: string
          delivery_method: string
          id: string
          items: Json
          notes: string | null
          payment_method: string
          payment_reference: string | null
          status: string
          total_amount: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          delivery_method: string
          id?: string
          items: Json
          notes?: string | null
          payment_method: string
          payment_reference?: string | null
          status?: string
          total_amount: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          delivery_method?: string
          id?: string
          items?: Json
          notes?: string | null
          payment_method?: string
          payment_reference?: string | null
          status?: string
          total_amount?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string
          id: string
          is_active: boolean | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name: string
          id: string
          is_active?: boolean | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string
          id?: string
          is_active?: boolean | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      sales: {
        Row: {
          client_id: string | null
          created_at: string
          id: string
          notes: string | null
          payment_method: string | null
          points_earned: number | null
          points_used: number | null
          product_id: string
          quantity: number
          staff_id: string
          total_amount: number
          unit_price: number
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          payment_method?: string | null
          points_earned?: number | null
          points_used?: number | null
          product_id: string
          quantity?: number
          staff_id: string
          total_amount: number
          unit_price: number
        }
        Update: {
          client_id?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          payment_method?: string | null
          points_earned?: number | null
          points_used?: number | null
          product_id?: string
          quantity?: number
          staff_id?: string
          total_amount?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "sales_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      service_requests: {
        Row: {
          assigned_to: string | null
          client_id: string | null
          client_name: string
          client_phone: string
          completed_at: string | null
          created_at: string
          device_brand: string | null
          device_model: string | null
          device_type: string | null
          diagnosis: string | null
          estimated_cost: number | null
          final_cost: number | null
          id: string
          internal_notes: string | null
          is_complex: boolean | null
          issue_description: string
          notes: string | null
          priority: string | null
          service_id: string
          staff_id: string
          started_at: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          client_id?: string | null
          client_name: string
          client_phone: string
          completed_at?: string | null
          created_at?: string
          device_brand?: string | null
          device_model?: string | null
          device_type?: string | null
          diagnosis?: string | null
          estimated_cost?: number | null
          final_cost?: number | null
          id?: string
          internal_notes?: string | null
          is_complex?: boolean | null
          issue_description: string
          notes?: string | null
          priority?: string | null
          service_id: string
          staff_id: string
          started_at?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          client_id?: string | null
          client_name?: string
          client_phone?: string
          completed_at?: string | null
          created_at?: string
          device_brand?: string | null
          device_model?: string | null
          device_type?: string | null
          diagnosis?: string | null
          estimated_cost?: number | null
          final_cost?: number | null
          id?: string
          internal_notes?: string | null
          is_complex?: boolean | null
          issue_description?: string
          notes?: string | null
          priority?: string | null
          service_id?: string
          staff_id?: string
          started_at?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_requests_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_requests_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services_catalog"
            referencedColumns: ["id"]
          },
        ]
      }
      services_catalog: {
        Row: {
          category: string
          created_at: string
          description: string | null
          description_ar: string | null
          description_fr: string | null
          estimated_duration: string | null
          id: string
          is_active: boolean | null
          is_complex: boolean | null
          name: string
          name_ar: string
          name_fr: string
          price: number | null
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          description_ar?: string | null
          description_fr?: string | null
          estimated_duration?: string | null
          id?: string
          is_active?: boolean | null
          is_complex?: boolean | null
          name: string
          name_ar: string
          name_fr: string
          price?: number | null
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          description_ar?: string | null
          description_fr?: string | null
          estimated_duration?: string | null
          id?: string
          is_active?: boolean | null
          is_complex?: boolean | null
          name?: string
          name_ar?: string
          name_fr?: string
          price?: number | null
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      staff_shifts: {
        Row: {
          check_in: string
          check_out: string | null
          created_at: string
          id: string
          notes: string | null
          staff_id: string
        }
        Insert: {
          check_in?: string
          check_out?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          staff_id: string
        }
        Update: {
          check_in?: string
          check_out?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          staff_id?: string
        }
        Relationships: []
      }
      store_settings: {
        Row: {
          id: string
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          id?: string
          key: string
          updated_at?: string
          updated_by?: string | null
          value: Json
        }
        Update: {
          id?: string
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
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
      decrement_stock: {
        Args: { product_id: string; qty: number }
        Returns: undefined
      }
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
      app_role: "owner" | "worker"
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
      app_role: ["owner", "worker"],
    },
  },
} as const
