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
      admin_replies: {
        Row: {
          created_at: string
          id: string
          message: string
          recipient_email: string
          reference_id: string
          reference_type: string
          sent_at: string
          sent_by: string | null
          subject: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          recipient_email: string
          reference_id: string
          reference_type: string
          sent_at?: string
          sent_by?: string | null
          subject: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          recipient_email?: string
          reference_id?: string
          reference_type?: string
          sent_at?: string
          sent_by?: string | null
          subject?: string
        }
        Relationships: []
      }
      album_likes: {
        Row: {
          album_id: string
          created_at: string
          id: string
          like_count: number
          updated_at: string
        }
        Insert: {
          album_id: string
          created_at?: string
          id?: string
          like_count?: number
          updated_at?: string
        }
        Update: {
          album_id?: string
          created_at?: string
          id?: string
          like_count?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "album_likes_album_id_fkey"
            columns: ["album_id"]
            isOneToOne: true
            referencedRelation: "photo_albums"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          booking_date: string
          booking_time: string
          cancelled_at: string | null
          created_at: string
          delivered_at: string | null
          editing_complete_at: string | null
          email: string
          expected_revenue: number | null
          id: string
          manage_token: string | null
          name: string
          notes: string | null
          payment_confirmed_at: string | null
          payment_proof_url: string | null
          pet_age: string | null
          pet_name: string
          pet_type: string
          phone: string
          processing_at: string | null
          read_at: string | null
          replied_at: string | null
          scheduled_at: string | null
          selected_category: string | null
          shooting_at: string | null
          status: string | null
          workflow_status: string | null
        }
        Insert: {
          booking_date: string
          booking_time: string
          cancelled_at?: string | null
          created_at?: string
          delivered_at?: string | null
          editing_complete_at?: string | null
          email: string
          expected_revenue?: number | null
          id?: string
          manage_token?: string | null
          name: string
          notes?: string | null
          payment_confirmed_at?: string | null
          payment_proof_url?: string | null
          pet_age?: string | null
          pet_name: string
          pet_type: string
          phone: string
          processing_at?: string | null
          read_at?: string | null
          replied_at?: string | null
          scheduled_at?: string | null
          selected_category?: string | null
          shooting_at?: string | null
          status?: string | null
          workflow_status?: string | null
        }
        Update: {
          booking_date?: string
          booking_time?: string
          cancelled_at?: string | null
          created_at?: string
          delivered_at?: string | null
          editing_complete_at?: string | null
          email?: string
          expected_revenue?: number | null
          id?: string
          manage_token?: string | null
          name?: string
          notes?: string | null
          payment_confirmed_at?: string | null
          payment_proof_url?: string | null
          pet_age?: string | null
          pet_name?: string
          pet_type?: string
          phone?: string
          processing_at?: string | null
          read_at?: string | null
          replied_at?: string | null
          scheduled_at?: string | null
          selected_category?: string | null
          shooting_at?: string | null
          status?: string | null
          workflow_status?: string | null
        }
        Relationships: []
      }
      contacts: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          name: string
          phone: string
          read_at: string | null
          replied_at: string | null
          status: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          phone: string
          read_at?: string | null
          replied_at?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          phone?: string
          read_at?: string | null
          replied_at?: string | null
          status?: string | null
        }
        Relationships: []
      }
      gallery_categories: {
        Row: {
          created_at: string
          id: string
          image_url: string | null
          image_urls: string[] | null
          label: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_url?: string | null
          image_urls?: string[] | null
          label: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string | null
          image_urls?: string[] | null
          label?: string
          name?: string
        }
        Relationships: []
      }
      gallery_images: {
        Row: {
          category: string
          created_at: string
          id: string
          image_url: string
          title: string
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          id?: string
          image_url: string
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          image_url?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      photo_albums: {
        Row: {
          category_id: string | null
          created_at: string
          description: string | null
          id: string
          image_urls: string[] | null
          name: string
          price: string | null
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_urls?: string[] | null
          name: string
          price?: string | null
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_urls?: string[] | null
          name?: string
          price?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "photo_albums_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "gallery_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      services: {
        Row: {
          created_at: string
          description: string
          features: string[]
          id: string
          image_url: string
          info_content_1: string | null
          info_content_2: string | null
          info_content_3: string | null
          info_title_1: string | null
          info_title_2: string | null
          info_title_3: string | null
          package_1_features: string[] | null
          package_1_image_url: string | null
          package_1_name: string | null
          package_1_price: string | null
          package_2_features: string[] | null
          package_2_image_url: string | null
          package_2_name: string | null
          package_2_price: string | null
          price: string
          pricing_title: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description: string
          features?: string[]
          id?: string
          image_url: string
          info_content_1?: string | null
          info_content_2?: string | null
          info_content_3?: string | null
          info_title_1?: string | null
          info_title_2?: string | null
          info_title_3?: string | null
          package_1_features?: string[] | null
          package_1_image_url?: string | null
          package_1_name?: string | null
          package_1_price?: string | null
          package_2_features?: string[] | null
          package_2_image_url?: string | null
          package_2_name?: string | null
          package_2_price?: string | null
          price: string
          pricing_title?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          features?: string[]
          id?: string
          image_url?: string
          info_content_1?: string | null
          info_content_2?: string | null
          info_content_3?: string | null
          info_title_1?: string | null
          info_title_2?: string | null
          info_title_3?: string | null
          package_1_features?: string[] | null
          package_1_image_url?: string | null
          package_1_name?: string | null
          package_1_price?: string | null
          package_2_features?: string[] | null
          package_2_image_url?: string | null
          package_2_name?: string | null
          package_2_price?: string | null
          price?: string
          pricing_title?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      site_config: {
        Row: {
          created_at: string
          id: string
          key: string
          updated_at: string
          value: string
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          updated_at?: string
          value: string
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      team_members: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          display_order: number | null
          email: string | null
          id: string
          is_active: boolean | null
          name: string
          phone: string | null
          role: string
          social_links: Json | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_order?: number | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          phone?: string | null
          role: string
          social_links?: Json | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_order?: number | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          phone?: string | null
          role?: string
          social_links?: Json | null
          updated_at?: string
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
      auto_cancel_unpaid_bookings: { Args: never; Returns: undefined }
      get_booking_by_token: {
        Args: { p_token: string }
        Returns: {
          booking_date: string
          booking_time: string
          created_at: string
          email: string
          id: string
          manage_token: string
          name: string
          notes: string
          payment_proof_url: string
          pet_age: string
          pet_name: string
          pet_type: string
          phone: string
          selected_category: string
          status: string
        }[]
      }
      get_bookings_by_contact: {
        Args: { p_email?: string; p_phone?: string }
        Returns: {
          booking_date: string
          booking_time: string
          cancelled_at: string
          created_at: string
          delivered_at: string
          editing_complete_at: string
          email: string
          id: string
          manage_token: string
          name: string
          notes: string
          payment_confirmed_at: string
          payment_proof_url: string
          pet_name: string
          pet_type: string
          phone: string
          processing_at: string
          scheduled_at: string
          selected_category: string
          shooting_at: string
          status: string
          workflow_status: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      toggle_album_like: {
        Args: { p_album_id: string; p_increment: boolean }
        Returns: number
      }
      update_booking_by_token: {
        Args: {
          p_booking_date?: string
          p_booking_time?: string
          p_payment_proof_url?: string
          p_status?: string
          p_token: string
        }
        Returns: boolean
      }
      validate_booking_token: {
        Args: { booking_token: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
