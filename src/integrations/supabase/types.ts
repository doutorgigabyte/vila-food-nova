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
      affiliate_referrals: {
        Row: {
          affiliate_id: string
          commission_earned: number | null
          created_at: string | null
          establishment_id: string
          id: string
          status: string | null
        }
        Insert: {
          affiliate_id: string
          commission_earned?: number | null
          created_at?: string | null
          establishment_id: string
          id?: string
          status?: string | null
        }
        Update: {
          affiliate_id?: string
          commission_earned?: number | null
          created_at?: string | null
          establishment_id?: string
          id?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_referrals_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_referrals_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliates: {
        Row: {
          code: string
          commission_rate: number | null
          created_at: string | null
          id: string
          is_active: boolean | null
          total_earnings: number | null
          user_id: string
        }
        Insert: {
          code: string
          commission_rate?: number | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          total_earnings?: number | null
          user_id: string
        }
        Update: {
          code?: string
          commission_rate?: number | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          total_earnings?: number | null
          user_id?: string
        }
        Relationships: []
      }
      banners: {
        Row: {
          created_at: string | null
          establishment_id: string
          id: string
          image_url: string
          is_active: boolean | null
          link_url: string | null
          sort_order: number | null
          title: string | null
        }
        Insert: {
          created_at?: string | null
          establishment_id: string
          id?: string
          image_url: string
          is_active?: boolean | null
          link_url?: string | null
          sort_order?: number | null
          title?: string | null
        }
        Update: {
          created_at?: string | null
          establishment_id?: string
          id?: string
          image_url?: string
          is_active?: boolean | null
          link_url?: string | null
          sort_order?: number | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "banners_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
        ]
      }
      cash_flow: {
        Row: {
          amount: number
          category: string | null
          created_at: string | null
          description: string | null
          establishment_id: string
          id: string
          payment_method: string | null
          reference_id: string | null
          type: string
        }
        Insert: {
          amount: number
          category?: string | null
          created_at?: string | null
          description?: string | null
          establishment_id: string
          id?: string
          payment_method?: string | null
          reference_id?: string | null
          type: string
        }
        Update: {
          amount?: number
          category?: string | null
          created_at?: string | null
          description?: string | null
          establishment_id?: string
          id?: string
          payment_method?: string | null
          reference_id?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "cash_flow_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string | null
          description: string | null
          establishment_id: string
          id: string
          image_url: string | null
          is_active: boolean | null
          name: string
          sort_order: number | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          establishment_id: string
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name: string
          sort_order?: number | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          establishment_id?: string
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name?: string
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "categories_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
        ]
      }
      cities: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          slug: string | null
          state_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          slug?: string | null
          state_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          slug?: string | null
          state_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cities_state_id_fkey"
            columns: ["state_id"]
            isOneToOne: false
            referencedRelation: "states"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          code: string
          created_at: string | null
          description: string | null
          discount_type: string | null
          discount_value: number
          establishment_id: string
          id: string
          is_active: boolean | null
          max_uses: number | null
          min_order_value: number | null
          uses_count: number | null
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          description?: string | null
          discount_type?: string | null
          discount_value: number
          establishment_id: string
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          min_order_value?: number | null
          uses_count?: number | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          description?: string | null
          discount_type?: string | null
          discount_value?: number
          establishment_id?: string
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          min_order_value?: number | null
          uses_count?: number | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "coupons_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          addresses: Json | null
          created_at: string | null
          email: string | null
          establishment_id: string | null
          id: string
          name: string
          phone: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          addresses?: Json | null
          created_at?: string | null
          email?: string | null
          establishment_id?: string | null
          id?: string
          name: string
          phone?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          addresses?: Json | null
          created_at?: string | null
          email?: string | null
          establishment_id?: string | null
          id?: string
          name?: string
          phone?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customers_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_fees: {
        Row: {
          city: string | null
          created_at: string | null
          establishment_id: string
          fee: number
          id: string
          is_active: boolean | null
          max_time: number | null
          min_time: number | null
          neighborhood: string
        }
        Insert: {
          city?: string | null
          created_at?: string | null
          establishment_id: string
          fee?: number
          id?: string
          is_active?: boolean | null
          max_time?: number | null
          min_time?: number | null
          neighborhood: string
        }
        Update: {
          city?: string | null
          created_at?: string | null
          establishment_id?: string
          fee?: number
          id?: string
          is_active?: boolean | null
          max_time?: number | null
          min_time?: number | null
          neighborhood?: string
        }
        Relationships: [
          {
            foreignKeyName: "delivery_fees_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
        ]
      }
      establishments: {
        Row: {
          accepts_delivery: boolean | null
          accepts_pickup: boolean | null
          accepts_table: boolean | null
          address: string | null
          address_number: string | null
          avg_delivery_time: number | null
          banner_url: string | null
          city_id: string | null
          created_at: string | null
          description: string | null
          email: string | null
          id: string
          is_open: boolean | null
          latitude: number | null
          logo_url: string | null
          longitude: number | null
          mercado_pago_token: string | null
          min_order_value: number | null
          name: string
          neighborhood: string | null
          operating_hours: Json | null
          owner_id: string | null
          pagseguro_token: string | null
          phone: string | null
          pix_key: string | null
          plan_id: string | null
          primary_color: string | null
          secondary_color: string | null
          segment_id: string | null
          slug: string
          status: Database["public"]["Enums"]["establishment_status"] | null
          updated_at: string | null
          vila_id: string | null
          whatsapp: string | null
          zip_code: string | null
        }
        Insert: {
          accepts_delivery?: boolean | null
          accepts_pickup?: boolean | null
          accepts_table?: boolean | null
          address?: string | null
          address_number?: string | null
          avg_delivery_time?: number | null
          banner_url?: string | null
          city_id?: string | null
          created_at?: string | null
          description?: string | null
          email?: string | null
          id?: string
          is_open?: boolean | null
          latitude?: number | null
          logo_url?: string | null
          longitude?: number | null
          mercado_pago_token?: string | null
          min_order_value?: number | null
          name: string
          neighborhood?: string | null
          operating_hours?: Json | null
          owner_id?: string | null
          pagseguro_token?: string | null
          phone?: string | null
          pix_key?: string | null
          plan_id?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          segment_id?: string | null
          slug: string
          status?: Database["public"]["Enums"]["establishment_status"] | null
          updated_at?: string | null
          vila_id?: string | null
          whatsapp?: string | null
          zip_code?: string | null
        }
        Update: {
          accepts_delivery?: boolean | null
          accepts_pickup?: boolean | null
          accepts_table?: boolean | null
          address?: string | null
          address_number?: string | null
          avg_delivery_time?: number | null
          banner_url?: string | null
          city_id?: string | null
          created_at?: string | null
          description?: string | null
          email?: string | null
          id?: string
          is_open?: boolean | null
          latitude?: number | null
          logo_url?: string | null
          longitude?: number | null
          mercado_pago_token?: string | null
          min_order_value?: number | null
          name?: string
          neighborhood?: string | null
          operating_hours?: Json | null
          owner_id?: string | null
          pagseguro_token?: string | null
          phone?: string | null
          pix_key?: string | null
          plan_id?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          segment_id?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["establishment_status"] | null
          updated_at?: string | null
          vila_id?: string | null
          whatsapp?: string | null
          zip_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "establishments_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "establishments_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "establishments_segment_id_fkey"
            columns: ["segment_id"]
            isOneToOne: false
            referencedRelation: "segments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "establishments_vila_id_fkey"
            columns: ["vila_id"]
            isOneToOne: false
            referencedRelation: "vilas"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          cancellation_reason: string | null
          cancelled_at: string | null
          change_for: number | null
          created_at: string | null
          customer_id: string | null
          delivered_at: string | null
          delivery_address: Json | null
          delivery_fee: number | null
          delivery_type: Database["public"]["Enums"]["delivery_type"] | null
          discount: number | null
          establishment_id: string
          estimated_time: number | null
          id: string
          items: Json
          observations: string | null
          order_number: number
          payment_method: Database["public"]["Enums"]["payment_method"] | null
          status: Database["public"]["Enums"]["order_status"] | null
          subtotal: number
          table_number: string | null
          total: number
          updated_at: string | null
        }
        Insert: {
          cancellation_reason?: string | null
          cancelled_at?: string | null
          change_for?: number | null
          created_at?: string | null
          customer_id?: string | null
          delivered_at?: string | null
          delivery_address?: Json | null
          delivery_fee?: number | null
          delivery_type?: Database["public"]["Enums"]["delivery_type"] | null
          discount?: number | null
          establishment_id: string
          estimated_time?: number | null
          id?: string
          items?: Json
          observations?: string | null
          order_number?: number
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          status?: Database["public"]["Enums"]["order_status"] | null
          subtotal?: number
          table_number?: string | null
          total?: number
          updated_at?: string | null
        }
        Update: {
          cancellation_reason?: string | null
          cancelled_at?: string | null
          change_for?: number | null
          created_at?: string | null
          customer_id?: string | null
          delivered_at?: string | null
          delivery_address?: Json | null
          delivery_fee?: number | null
          delivery_type?: Database["public"]["Enums"]["delivery_type"] | null
          discount?: number | null
          establishment_id?: string
          estimated_time?: number | null
          id?: string
          items?: Json
          observations?: string | null
          order_number?: number
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          status?: Database["public"]["Enums"]["order_status"] | null
          subtotal?: number
          table_number?: string | null
          total?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          billing_period: string | null
          created_at: string | null
          description: string | null
          features: Json | null
          id: string
          is_active: boolean | null
          max_orders: number | null
          max_products: number | null
          name: string
          price: number
          updated_at: string | null
        }
        Insert: {
          billing_period?: string | null
          created_at?: string | null
          description?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          max_orders?: number | null
          max_products?: number | null
          name: string
          price?: number
          updated_at?: string | null
        }
        Update: {
          billing_period?: string | null
          created_at?: string | null
          description?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          max_orders?: number | null
          max_products?: number | null
          name?: string
          price?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      products: {
        Row: {
          additionals: Json | null
          category_id: string | null
          created_at: string | null
          description: string | null
          establishment_id: string
          id: string
          image_url: string | null
          is_active: boolean | null
          is_featured: boolean | null
          name: string
          preparation_time: number | null
          price: number
          promotional_price: number | null
          stock_quantity: number | null
          updated_at: string | null
          variations: Json | null
        }
        Insert: {
          additionals?: Json | null
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          establishment_id: string
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_featured?: boolean | null
          name: string
          preparation_time?: number | null
          price: number
          promotional_price?: number | null
          stock_quantity?: number | null
          updated_at?: string | null
          variations?: Json | null
        }
        Update: {
          additionals?: Json | null
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          establishment_id?: string
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_featured?: boolean | null
          name?: string
          preparation_time?: number | null
          price?: number
          promotional_price?: number | null
          stock_quantity?: number | null
          updated_at?: string | null
          variations?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      qr_codes: {
        Row: {
          created_at: string | null
          establishment_id: string
          id: string
          is_active: boolean | null
          name: string | null
          table_number: string | null
          type: string
        }
        Insert: {
          created_at?: string | null
          establishment_id: string
          id?: string
          is_active?: boolean | null
          name?: string | null
          table_number?: string | null
          type: string
        }
        Update: {
          created_at?: string | null
          establishment_id?: string
          id?: string
          is_active?: boolean | null
          name?: string | null
          table_number?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "qr_codes_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
        ]
      }
      segments: {
        Row: {
          created_at: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
        }
        Insert: {
          created_at?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
        }
        Update: {
          created_at?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
        }
        Relationships: []
      }
      states: {
        Row: {
          created_at: string | null
          id: string
          name: string
          uf: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          uf: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          uf?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          created_at: string | null
          establishment_id: string
          expires_at: string | null
          id: string
          plan_id: string
          starts_at: string | null
          status: string | null
        }
        Insert: {
          created_at?: string | null
          establishment_id: string
          expires_at?: string | null
          id?: string
          plan_id: string
          starts_at?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string | null
          establishment_id?: string
          expires_at?: string | null
          id?: string
          plan_id?: string
          starts_at?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vilas: {
        Row: {
          address: string | null
          city_id: string | null
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          latitude: number | null
          longitude: number | null
          name: string
          neighborhood: string | null
          slug: string
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          city_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          latitude?: number | null
          longitude?: number | null
          name: string
          neighborhood?: string | null
          slug: string
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          city_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          latitude?: number | null
          longitude?: number | null
          name?: string
          neighborhood?: string | null
          slug?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vilas_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_instances: {
        Row: {
          ai_enabled: boolean | null
          ai_prompt: string | null
          api_key: string | null
          created_at: string | null
          establishment_id: string
          id: string
          instance_id: string | null
          instance_name: string | null
          qr_code: string | null
          status: string | null
          updated_at: string | null
          webhook_url: string | null
        }
        Insert: {
          ai_enabled?: boolean | null
          ai_prompt?: string | null
          api_key?: string | null
          created_at?: string | null
          establishment_id: string
          id?: string
          instance_id?: string | null
          instance_name?: string | null
          qr_code?: string | null
          status?: string | null
          updated_at?: string | null
          webhook_url?: string | null
        }
        Update: {
          ai_enabled?: boolean | null
          ai_prompt?: string | null
          api_key?: string | null
          created_at?: string | null
          establishment_id?: string
          id?: string
          instance_id?: string | null
          instance_name?: string | null
          qr_code?: string | null
          status?: string | null
          updated_at?: string | null
          webhook_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_instances_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_messages: {
        Row: {
          content: string
          created_at: string | null
          id: string
          is_from_bot: boolean | null
          message_type: string | null
          sender: string
          session_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          is_from_bot?: boolean | null
          message_type?: string | null
          sender: string
          session_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          is_from_bot?: boolean | null
          message_type?: string | null
          sender?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_sessions: {
        Row: {
          cart: Json | null
          context: Json | null
          created_at: string | null
          customer_name: string | null
          customer_phone: string
          establishment_id: string
          id: string
          last_message_at: string | null
          status: string | null
        }
        Insert: {
          cart?: Json | null
          context?: Json | null
          created_at?: string | null
          customer_name?: string | null
          customer_phone: string
          establishment_id: string
          id?: string
          last_message_at?: string | null
          status?: string | null
        }
        Update: {
          cart?: Json | null
          context?: Json | null
          created_at?: string | null
          customer_name?: string | null
          customer_phone?: string
          establishment_id?: string
          id?: string
          last_message_at?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_sessions_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
        ]
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
      app_role:
        | "super_admin"
        | "admin"
        | "affiliate"
        | "establishment"
        | "customer"
      delivery_type: "delivery" | "pickup" | "table" | "other"
      establishment_status: "active" | "inactive" | "suspended" | "pending"
      order_status:
        | "pending"
        | "confirmed"
        | "preparing"
        | "ready"
        | "delivering"
        | "delivered"
        | "cancelled"
      payment_method: "cash" | "pix" | "credit_card" | "debit_card" | "online"
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
      app_role: [
        "super_admin",
        "admin",
        "affiliate",
        "establishment",
        "customer",
      ],
      delivery_type: ["delivery", "pickup", "table", "other"],
      establishment_status: ["active", "inactive", "suspended", "pending"],
      order_status: [
        "pending",
        "confirmed",
        "preparing",
        "ready",
        "delivering",
        "delivered",
        "cancelled",
      ],
      payment_method: ["cash", "pix", "credit_card", "debit_card", "online"],
    },
  },
} as const
