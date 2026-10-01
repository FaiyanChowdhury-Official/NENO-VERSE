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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      access_logs: {
        Row: {
          action: string
          blocked: boolean
          created_at: string
          device_id: string
          id: string
          ip: string
          item_kind: string
          item_slug: string
          user_agent: string
          user_id: string
        }
        Insert: {
          action: string
          blocked?: boolean
          created_at?: string
          device_id?: string
          id?: string
          ip?: string
          item_kind: string
          item_slug: string
          user_agent?: string
          user_id: string
        }
        Update: {
          action?: string
          blocked?: boolean
          created_at?: string
          device_id?: string
          id?: string
          ip?: string
          item_kind?: string
          item_slug?: string
          user_agent?: string
          user_id?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          id: string
          metadata: Json
          target: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          target?: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          target?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          id: string
          kind: Database["public"]["Enums"]["item_type"]
          name: string
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          kind: Database["public"]["Enums"]["item_type"]
          name: string
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          kind?: Database["public"]["Enums"]["item_type"]
          name?: string
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      item_links: {
        Row: {
          item_id: string
          label: string
          updated_at: string
          url: string
        }
        Insert: {
          item_id: string
          label?: string
          updated_at?: string
          url?: string
        }
        Update: {
          item_id?: string
          label?: string
          updated_at?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "item_links_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: true
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
        ]
      }
      items: {
        Row: {
          access_days: number | null
          access_note: string
          access_type: string
          category_slug: string
          created_at: string
          customer_info_label: string
          description: string[]
          duration: string
          file_info: string
          highlights: string[]
          id: string
          image_url: string
          instructor: string
          is_new: boolean
          kind: Database["public"]["Enums"]["item_type"]
          lesson_count: number
          level: string
          name: string
          original_price: number | null
          popular: boolean
          price: number
          published: boolean
          requires_customer_info: boolean
          short_description: string
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          access_days?: number | null
          access_note?: string
          access_type?: string
          category_slug?: string
          created_at?: string
          customer_info_label?: string
          description?: string[]
          duration?: string
          file_info?: string
          highlights?: string[]
          id?: string
          image_url?: string
          instructor?: string
          is_new?: boolean
          kind: Database["public"]["Enums"]["item_type"]
          lesson_count?: number
          level?: string
          name: string
          original_price?: number | null
          popular?: boolean
          price?: number
          published?: boolean
          requires_customer_info?: boolean
          short_description?: string
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          access_days?: number | null
          access_note?: string
          access_type?: string
          category_slug?: string
          created_at?: string
          customer_info_label?: string
          description?: string[]
          duration?: string
          file_info?: string
          highlights?: string[]
          id?: string
          image_url?: string
          instructor?: string
          is_new?: boolean
          kind?: Database["public"]["Enums"]["item_type"]
          lesson_count?: number
          level?: string
          name?: string
          original_price?: number | null
          popular?: boolean
          price?: number
          published?: boolean
          requires_customer_info?: boolean
          short_description?: string
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      lesson_progress: {
        Row: {
          completed_at: string
          id: string
          lesson_id: string
          user_id: string
        }
        Insert: {
          completed_at?: string
          id?: string
          lesson_id: string
          user_id: string
        }
        Update: {
          completed_at?: string
          id?: string
          lesson_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_videos: {
        Row: {
          lesson_id: string
          updated_at: string
          video_url: string
        }
        Insert: {
          lesson_id: string
          updated_at?: string
          video_url?: string
        }
        Update: {
          lesson_id?: string
          updated_at?: string
          video_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_videos_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: true
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lessons: {
        Row: {
          created_at: string
          duration: string
          id: string
          is_free: boolean
          item_id: string
          module_title: string
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          duration?: string
          id?: string
          is_free?: boolean
          item_id: string
          module_title?: string
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          duration?: string
          id?: string
          is_free?: boolean
          item_id?: string
          module_title?: string
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lessons_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string
          created_at: string
          id: string
          kind: string
          link: string
          read_at: string | null
          title: string
          user_id: string
        }
        Insert: {
          body?: string
          created_at?: string
          id?: string
          kind: string
          link?: string
          read_at?: string | null
          title: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          kind?: string
          link?: string
          read_at?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          admin_note: string | null
          amount: number
          approved_at: string | null
          created_at: string
          customer_note: string
          delivered_at: string | null
          delivery_note: string
          delivery_status: string
          id: string
          item_name: string
          item_slug: string
          item_type: Database["public"]["Enums"]["item_type"]
          outlet_slug: string
          payment_method: Database["public"]["Enums"]["payment_method"]
          payment_proof: string
          sender_number: string
          status: Database["public"]["Enums"]["order_status"]
          transaction_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_note?: string | null
          amount: number
          approved_at?: string | null
          created_at?: string
          customer_note?: string
          delivered_at?: string | null
          delivery_note?: string
          delivery_status?: string
          id?: string
          item_name: string
          item_slug: string
          item_type: Database["public"]["Enums"]["item_type"]
          outlet_slug?: string
          payment_method: Database["public"]["Enums"]["payment_method"]
          payment_proof?: string
          sender_number: string
          status?: Database["public"]["Enums"]["order_status"]
          transaction_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_note?: string | null
          amount?: number
          approved_at?: string | null
          created_at?: string
          customer_note?: string
          delivered_at?: string | null
          delivery_note?: string
          delivery_status?: string
          id?: string
          item_name?: string
          item_slug?: string
          item_type?: Database["public"]["Enums"]["item_type"]
          outlet_slug?: string
          payment_method?: Database["public"]["Enums"]["payment_method"]
          payment_proof?: string
          sender_number?: string
          status?: Database["public"]["Enums"]["order_status"]
          transaction_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      outlet_items: {
        Row: {
          active: boolean
          created_at: string
          id: string
          item_id: string
          outlet_id: string
          price: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          item_id: string
          outlet_id: string
          price: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          item_id?: string
          outlet_id?: string
          price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "outlet_items_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "outlet_items_outlet_id_fkey"
            columns: ["outlet_id"]
            isOneToOne: false
            referencedRelation: "outlets"
            referencedColumns: ["id"]
          },
        ]
      }
      outlets: {
        Row: {
          active: boolean
          created_at: string
          description: string
          id: string
          name: string
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string
          id?: string
          name: string
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string
          id?: string
          name?: string
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string
          id: string
          phone: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          full_name?: string
          id: string
          phone?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          full_name?: string
          id?: string
          phone?: string
          updated_at?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          comment: string
          created_at: string
          id: string
          item_slug: string
          item_type: Database["public"]["Enums"]["item_type"]
          rating: number
          reviewer_name: string
          status: Database["public"]["Enums"]["order_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          comment?: string
          created_at?: string
          id?: string
          item_slug: string
          item_type: Database["public"]["Enums"]["item_type"]
          rating: number
          reviewer_name?: string
          status?: Database["public"]["Enums"]["order_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          comment?: string
          created_at?: string
          id?: string
          item_slug?: string
          item_type?: Database["public"]["Enums"]["item_type"]
          rating?: number
          reviewer_name?: string
          status?: Database["public"]["Enums"]["order_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      success_stories: {
        Row: {
          created_at: string
          id: string
          image_url: string
          name: string
          published: boolean
          rating: number
          role: string
          sort_order: number
          story: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_url?: string
          name: string
          published?: boolean
          rating?: number
          role?: string
          sort_order?: number
          story: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string
          name?: string
          published?: boolean
          rating?: number
          role?: string
          sort_order?: number
          story?: string
          updated_at?: string
        }
        Relationships: []
      }
      support_tickets: {
        Row: {
          category: string
          created_at: string
          id: string
          order_id: string | null
          status: Database["public"]["Enums"]["ticket_status"]
          subject: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string
          created_at?: string
          id?: string
          order_id?: string | null
          status?: Database["public"]["Enums"]["ticket_status"]
          subject: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          order_id?: string | null
          status?: Database["public"]["Enums"]["ticket_status"]
          subject?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ticket_messages: {
        Row: {
          author_id: string
          body: string
          created_at: string
          id: string
          is_staff: boolean
          ticket_id: string
        }
        Insert: {
          author_id: string
          body: string
          created_at?: string
          id?: string
          is_staff?: boolean
          ticket_id: string
        }
        Update: {
          author_id?: string
          body?: string
          created_at?: string
          id?: string
          is_staff?: boolean
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      user_devices: {
        Row: {
          device_id: string
          first_seen: string
          id: string
          ip: string
          last_seen: string
          user_agent: string
          user_id: string
        }
        Insert: {
          device_id: string
          first_seen?: string
          id?: string
          ip?: string
          last_seen?: string
          user_agent?: string
          user_id: string
        }
        Update: {
          device_id?: string
          first_seen?: string
          id?: string
          ip?: string
          last_seen?: string
          user_agent?: string
          user_id?: string
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
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      item_type: "product" | "course"
      order_status: "pending" | "approved" | "rejected"
      payment_method: "bkash" | "rocket" | "bank" | "manual"
      ticket_status:
        | "open"
        | "in_progress"
        | "waiting_user"
        | "resolved"
        | "closed"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["admin", "moderator", "user"],
      item_type: ["product", "course"],
      order_status: ["pending", "approved", "rejected"],
      payment_method: ["bkash", "rocket", "bank", "manual"],
      ticket_status: [
        "open",
        "in_progress",
        "waiting_user",
        "resolved",
        "closed",
      ],
    },
  },
} as const
