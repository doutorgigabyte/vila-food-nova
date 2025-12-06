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
      abandoned_carts: {
        Row: {
          created_at: string | null
          customer_name: string | null
          customer_phone: string
          establishment_id: string
          id: string
          items: Json
          last_recovery_at: string | null
          recovered: boolean | null
          recovered_order_id: string | null
          recovery_attempts: number | null
          total: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          customer_name?: string | null
          customer_phone: string
          establishment_id: string
          id?: string
          items?: Json
          last_recovery_at?: string | null
          recovered?: boolean | null
          recovered_order_id?: string | null
          recovery_attempts?: number | null
          total?: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          customer_name?: string | null
          customer_phone?: string
          establishment_id?: string
          id?: string
          items?: Json
          last_recovery_at?: string | null
          recovered?: boolean | null
          recovered_order_id?: string | null
          recovery_attempts?: number | null
          total?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "abandoned_carts_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "abandoned_carts_recovered_order_id_fkey"
            columns: ["recovered_order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_access_logs: {
        Row: {
          action: string
          admin_user_id: string
          ended_at: string | null
          establishment_id: string
          id: string
          metadata: Json | null
          started_at: string | null
        }
        Insert: {
          action?: string
          admin_user_id: string
          ended_at?: string | null
          establishment_id: string
          id?: string
          metadata?: Json | null
          started_at?: string | null
        }
        Update: {
          action?: string
          admin_user_id?: string
          ended_at?: string | null
          establishment_id?: string
          id?: string
          metadata?: Json | null
          started_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_access_logs_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_payouts: {
        Row: {
          affiliate_id: string
          amount: number
          created_at: string | null
          error_message: string | null
          id: string
          mp_payment_id: string | null
          paid_at: string | null
          pix_key: string
          referral_id: string | null
          status: string | null
        }
        Insert: {
          affiliate_id: string
          amount: number
          created_at?: string | null
          error_message?: string | null
          id?: string
          mp_payment_id?: string | null
          paid_at?: string | null
          pix_key: string
          referral_id?: string | null
          status?: string | null
        }
        Update: {
          affiliate_id?: string
          amount?: number
          created_at?: string | null
          error_message?: string | null
          id?: string
          mp_payment_id?: string | null
          paid_at?: string | null
          pix_key?: string
          referral_id?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_payouts_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_payouts_referral_id_fkey"
            columns: ["referral_id"]
            isOneToOne: false
            referencedRelation: "affiliate_referrals"
            referencedColumns: ["id"]
          },
        ]
      }
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
      analytics_pixels: {
        Row: {
          created_at: string | null
          establishment_id: string
          facebook_pixel_id: string | null
          google_ads_id: string | null
          google_analytics_id: string | null
          id: string
          is_active: boolean | null
          tiktok_pixel_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          establishment_id: string
          facebook_pixel_id?: string | null
          google_ads_id?: string | null
          google_analytics_id?: string | null
          id?: string
          is_active?: boolean | null
          tiktok_pixel_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          establishment_id?: string
          facebook_pixel_id?: string | null
          google_ads_id?: string | null
          google_analytics_id?: string | null
          id?: string
          is_active?: boolean | null
          tiktok_pixel_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "analytics_pixels_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: true
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string | null
          entity_id: string | null
          entity_type: string
          id: string
          ip_address: string | null
          metadata: Json | null
          new_data: Json | null
          old_data: Json | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          new_data?: Json | null
          old_data?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          new_data?: Json | null
          old_data?: Json | null
          user_agent?: string | null
          user_id?: string | null
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
      cashback_config: {
        Row: {
          created_at: string | null
          establishment_id: string
          expiration_days: number | null
          id: string
          is_active: boolean | null
          max_cashback_value: number | null
          min_order_value: number | null
          percentage: number | null
        }
        Insert: {
          created_at?: string | null
          establishment_id: string
          expiration_days?: number | null
          id?: string
          is_active?: boolean | null
          max_cashback_value?: number | null
          min_order_value?: number | null
          percentage?: number | null
        }
        Update: {
          created_at?: string | null
          establishment_id?: string
          expiration_days?: number | null
          id?: string
          is_active?: boolean | null
          max_cashback_value?: number | null
          min_order_value?: number | null
          percentage?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "cashback_config_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: true
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
        ]
      }
      cashback_transactions: {
        Row: {
          amount: number
          balance_after: number
          created_at: string | null
          customer_id: string
          establishment_id: string
          expires_at: string | null
          id: string
          order_id: string | null
          type: string
        }
        Insert: {
          amount: number
          balance_after?: number
          created_at?: string | null
          customer_id: string
          establishment_id: string
          expires_at?: string | null
          id?: string
          order_id?: string | null
          type: string
        }
        Update: {
          amount?: number
          balance_after?: number
          created_at?: string | null
          customer_id?: string
          establishment_id?: string
          expires_at?: string | null
          id?: string
          order_id?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "cashback_transactions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cashback_transactions_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cashback_transactions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
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
      delivery_drivers: {
        Row: {
          created_at: string | null
          email: string | null
          establishment_id: string
          id: string
          is_active: boolean | null
          is_available: boolean | null
          license_plate: string | null
          name: string
          phone: string
          updated_at: string | null
          vehicle_type: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          establishment_id: string
          id?: string
          is_active?: boolean | null
          is_available?: boolean | null
          license_plate?: string | null
          name: string
          phone: string
          updated_at?: string | null
          vehicle_type?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          establishment_id?: string
          id?: string
          is_active?: boolean | null
          is_available?: boolean | null
          license_plate?: string | null
          name?: string
          phone?: string
          updated_at?: string | null
          vehicle_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "delivery_drivers_establishment_id_fkey"
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
      delivery_zones: {
        Row: {
          coordinates: Json | null
          created_at: string | null
          establishment_id: string
          fee: number
          id: string
          is_active: boolean | null
          max_time: number | null
          min_time: number | null
          name: string
          neighborhoods: string[] | null
          radius_km: number | null
          type: string | null
          zip_codes: string[] | null
        }
        Insert: {
          coordinates?: Json | null
          created_at?: string | null
          establishment_id: string
          fee?: number
          id?: string
          is_active?: boolean | null
          max_time?: number | null
          min_time?: number | null
          name: string
          neighborhoods?: string[] | null
          radius_km?: number | null
          type?: string | null
          zip_codes?: string[] | null
        }
        Update: {
          coordinates?: Json | null
          created_at?: string | null
          establishment_id?: string
          fee?: number
          id?: string
          is_active?: boolean | null
          max_time?: number | null
          min_time?: number | null
          name?: string
          neighborhoods?: string[] | null
          radius_km?: number | null
          type?: string | null
          zip_codes?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "delivery_zones_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
        ]
      }
      establishment_users: {
        Row: {
          created_at: string | null
          establishment_id: string
          id: string
          is_active: boolean | null
          role: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          establishment_id: string
          id?: string
          is_active?: boolean | null
          role?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          establishment_id?: string
          id?: string
          is_active?: boolean | null
          role?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "establishment_users_establishment_id_fkey"
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
          delivery_base_fee: number | null
          delivery_fee_per_km: number | null
          description: string | null
          email: string | null
          id: string
          is_open: boolean | null
          latitude: number | null
          logo_url: string | null
          longitude: number | null
          max_delivery_radius_km: number | null
          mercado_pago_token: string | null
          min_order_value: number | null
          mp_public_key: string | null
          mp_refresh_token: string | null
          mp_token_expires_at: string | null
          mp_user_id: string | null
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
          service_area: Json | null
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
          delivery_base_fee?: number | null
          delivery_fee_per_km?: number | null
          description?: string | null
          email?: string | null
          id?: string
          is_open?: boolean | null
          latitude?: number | null
          logo_url?: string | null
          longitude?: number | null
          max_delivery_radius_km?: number | null
          mercado_pago_token?: string | null
          min_order_value?: number | null
          mp_public_key?: string | null
          mp_refresh_token?: string | null
          mp_token_expires_at?: string | null
          mp_user_id?: string | null
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
          service_area?: Json | null
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
          delivery_base_fee?: number | null
          delivery_fee_per_km?: number | null
          description?: string | null
          email?: string | null
          id?: string
          is_open?: boolean | null
          latitude?: number | null
          logo_url?: string | null
          longitude?: number | null
          max_delivery_radius_km?: number | null
          mercado_pago_token?: string | null
          min_order_value?: number | null
          mp_public_key?: string | null
          mp_refresh_token?: string | null
          mp_token_expires_at?: string | null
          mp_user_id?: string | null
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
          service_area?: Json | null
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
      financial_accounts: {
        Row: {
          balance: number | null
          created_at: string | null
          establishment_id: string
          id: string
          is_active: boolean | null
          name: string
          type: string
        }
        Insert: {
          balance?: number | null
          created_at?: string | null
          establishment_id: string
          id?: string
          is_active?: boolean | null
          name: string
          type: string
        }
        Update: {
          balance?: number | null
          created_at?: string | null
          establishment_id?: string
          id?: string
          is_active?: boolean | null
          name?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_accounts_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_transactions: {
        Row: {
          account_id: string | null
          amount: number
          category: string
          created_at: string | null
          description: string | null
          due_date: string | null
          establishment_id: string
          id: string
          paid_at: string | null
          recurrence: string | null
          reference_id: string | null
          reference_type: string | null
          status: string | null
          type: string
        }
        Insert: {
          account_id?: string | null
          amount: number
          category: string
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          establishment_id: string
          id?: string
          paid_at?: string | null
          recurrence?: string | null
          reference_id?: string | null
          reference_type?: string | null
          status?: string | null
          type: string
        }
        Update: {
          account_id?: string | null
          amount?: number
          category?: string
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          establishment_id?: string
          id?: string
          paid_at?: string | null
          recurrence?: string | null
          reference_id?: string | null
          reference_type?: string | null
          status?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_transactions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "financial_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_transactions_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_movements: {
        Row: {
          created_at: string | null
          created_by: string | null
          establishment_id: string
          id: string
          notes: string | null
          product_id: string | null
          quantity: number
          reference_id: string | null
          reference_type: string | null
          total_cost: number | null
          type: string
          unit_cost: number | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          establishment_id: string
          id?: string
          notes?: string | null
          product_id?: string | null
          quantity: number
          reference_id?: string | null
          reference_type?: string | null
          total_cost?: number | null
          type: string
          unit_cost?: number | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          establishment_id?: string
          id?: string
          notes?: string | null
          product_id?: string | null
          quantity?: number
          reference_id?: string | null
          reference_type?: string | null
          total_cost?: number | null
          type?: string
          unit_cost?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_movements_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      mp_subscription_plans: {
        Row: {
          created_at: string | null
          currency_id: string | null
          frequency: number | null
          frequency_type: string | null
          id: string
          is_active: boolean | null
          mp_preapproval_plan_id: string | null
          plan_id: string | null
          reason: string
          transaction_amount: number
        }
        Insert: {
          created_at?: string | null
          currency_id?: string | null
          frequency?: number | null
          frequency_type?: string | null
          id?: string
          is_active?: boolean | null
          mp_preapproval_plan_id?: string | null
          plan_id?: string | null
          reason: string
          transaction_amount: number
        }
        Update: {
          created_at?: string | null
          currency_id?: string | null
          frequency?: number | null
          frequency_type?: string | null
          id?: string
          is_active?: boolean | null
          mp_preapproval_plan_id?: string | null
          plan_id?: string | null
          reason?: string
          transaction_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "mp_subscription_plans_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      mp_transactions: {
        Row: {
          amount: number
          created_at: string | null
          establishment_id: string | null
          id: string
          metadata: Json | null
          mp_payment_id: string | null
          mp_preapproval_id: string | null
          net_amount: number | null
          payer_email: string | null
          payer_name: string | null
          platform_fee: number | null
          status: string
          type: string
          updated_at: string | null
        }
        Insert: {
          amount?: number
          created_at?: string | null
          establishment_id?: string | null
          id?: string
          metadata?: Json | null
          mp_payment_id?: string | null
          mp_preapproval_id?: string | null
          net_amount?: number | null
          payer_email?: string | null
          payer_name?: string | null
          platform_fee?: number | null
          status?: string
          type: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          establishment_id?: string | null
          id?: string
          metadata?: Json | null
          mp_payment_id?: string | null
          mp_preapproval_id?: string | null
          net_amount?: number | null
          payer_email?: string | null
          payer_name?: string | null
          platform_fee?: number | null
          status?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mp_transactions_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
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
      payment_sandbox_accounts: {
        Row: {
          account_type: string
          country: string | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          user_id: string
          username: string | null
        }
        Insert: {
          account_type: string
          country?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          user_id: string
          username?: string | null
        }
        Update: {
          account_type?: string
          country?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          user_id?: string
          username?: string | null
        }
        Relationships: []
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
          cost_price: number | null
          created_at: string | null
          description: string | null
          establishment_id: string
          id: string
          image_url: string | null
          is_active: boolean | null
          is_featured: boolean | null
          max_stock: number | null
          min_stock: number | null
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
          cost_price?: number | null
          created_at?: string | null
          description?: string | null
          establishment_id: string
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_featured?: boolean | null
          max_stock?: number | null
          min_stock?: number | null
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
          cost_price?: number | null
          created_at?: string | null
          description?: string | null
          establishment_id?: string
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_featured?: boolean | null
          max_stock?: number | null
          min_stock?: number | null
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
      scheduled_orders: {
        Row: {
          created_at: string | null
          customer_id: string | null
          delivery_address: Json | null
          delivery_fee: number | null
          delivery_type: string | null
          establishment_id: string
          id: string
          items: Json
          notes: string | null
          payment_method: string | null
          scheduled_for: string
          status: string | null
          subtotal: number
          total: number
        }
        Insert: {
          created_at?: string | null
          customer_id?: string | null
          delivery_address?: Json | null
          delivery_fee?: number | null
          delivery_type?: string | null
          establishment_id: string
          id?: string
          items?: Json
          notes?: string | null
          payment_method?: string | null
          scheduled_for: string
          status?: string | null
          subtotal?: number
          total?: number
        }
        Update: {
          created_at?: string | null
          customer_id?: string | null
          delivery_address?: Json | null
          delivery_fee?: number | null
          delivery_type?: string | null
          establishment_id?: string
          id?: string
          items?: Json
          notes?: string | null
          payment_method?: string | null
          scheduled_for?: string
          status?: string | null
          subtotal?: number
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduled_orders_establishment_id_fkey"
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
      supplier_purchases: {
        Row: {
          created_at: string | null
          due_date: string | null
          establishment_id: string
          id: string
          invoice_number: string | null
          items: Json
          notes: string | null
          payment_method: string | null
          payment_status: string | null
          shipping: number | null
          subtotal: number
          supplier_id: string | null
          taxes: number | null
          total: number
        }
        Insert: {
          created_at?: string | null
          due_date?: string | null
          establishment_id: string
          id?: string
          invoice_number?: string | null
          items?: Json
          notes?: string | null
          payment_method?: string | null
          payment_status?: string | null
          shipping?: number | null
          subtotal?: number
          supplier_id?: string | null
          taxes?: number | null
          total?: number
        }
        Update: {
          created_at?: string | null
          due_date?: string | null
          establishment_id?: string
          id?: string
          invoice_number?: string | null
          items?: Json
          notes?: string | null
          payment_method?: string | null
          payment_status?: string | null
          shipping?: number | null
          subtotal?: number
          supplier_id?: string | null
          taxes?: number | null
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "supplier_purchases_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_purchases_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          address: string | null
          cnpj: string | null
          contact_person: string | null
          created_at: string | null
          email: string | null
          establishment_id: string
          id: string
          is_active: boolean | null
          name: string
          notes: string | null
          phone: string | null
        }
        Insert: {
          address?: string | null
          cnpj?: string | null
          contact_person?: string | null
          created_at?: string | null
          email?: string | null
          establishment_id: string
          id?: string
          is_active?: boolean | null
          name: string
          notes?: string | null
          phone?: string | null
        }
        Update: {
          address?: string | null
          cnpj?: string | null
          contact_person?: string | null
          created_at?: string | null
          email?: string | null
          establishment_id?: string
          id?: string
          is_active?: boolean | null
          name?: string
          notes?: string | null
          phone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "suppliers_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
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
      waiter_tabs: {
        Row: {
          closed_at: string | null
          customer_name: string | null
          discount: number | null
          establishment_id: string
          id: string
          items: Json
          notes: string | null
          opened_at: string | null
          status: string | null
          subtotal: number | null
          table_number: string
          total: number | null
          waiter_name: string | null
        }
        Insert: {
          closed_at?: string | null
          customer_name?: string | null
          discount?: number | null
          establishment_id: string
          id?: string
          items?: Json
          notes?: string | null
          opened_at?: string | null
          status?: string | null
          subtotal?: number | null
          table_number: string
          total?: number | null
          waiter_name?: string | null
        }
        Update: {
          closed_at?: string | null
          customer_name?: string | null
          discount?: number | null
          establishment_id?: string
          id?: string
          items?: Json
          notes?: string | null
          opened_at?: string | null
          status?: string | null
          subtotal?: number | null
          table_number?: string
          total?: number | null
          waiter_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "waiter_tabs_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_analytics: {
        Row: {
          created_at: string | null
          establishment_id: string
          event_data: Json | null
          event_type: string
          id: string
          session_id: string | null
        }
        Insert: {
          created_at?: string | null
          establishment_id: string
          event_data?: Json | null
          event_type: string
          id?: string
          session_id?: string | null
        }
        Update: {
          created_at?: string | null
          establishment_id?: string
          event_data?: Json | null
          event_type?: string
          id?: string
          session_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_analytics_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_analytics_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_instances: {
        Row: {
          ai_enabled: boolean | null
          ai_prompt: string | null
          api_key: string | null
          audio_enabled: boolean | null
          auto_response_enabled: boolean | null
          created_at: string | null
          description: string | null
          establishment_id: string | null
          evolution_api_key: string | null
          evolution_api_url: string | null
          id: string
          instance_id: string | null
          instance_name: string | null
          instance_type: string | null
          phone_number: string | null
          pix_enabled: boolean | null
          qr_code: string | null
          status: string | null
          updated_at: string | null
          webhook_url: string | null
        }
        Insert: {
          ai_enabled?: boolean | null
          ai_prompt?: string | null
          api_key?: string | null
          audio_enabled?: boolean | null
          auto_response_enabled?: boolean | null
          created_at?: string | null
          description?: string | null
          establishment_id?: string | null
          evolution_api_key?: string | null
          evolution_api_url?: string | null
          id?: string
          instance_id?: string | null
          instance_name?: string | null
          instance_type?: string | null
          phone_number?: string | null
          pix_enabled?: boolean | null
          qr_code?: string | null
          status?: string | null
          updated_at?: string | null
          webhook_url?: string | null
        }
        Update: {
          ai_enabled?: boolean | null
          ai_prompt?: string | null
          api_key?: string | null
          audio_enabled?: boolean | null
          auto_response_enabled?: boolean | null
          created_at?: string | null
          description?: string | null
          establishment_id?: string | null
          evolution_api_key?: string | null
          evolution_api_url?: string | null
          id?: string
          instance_id?: string | null
          instance_name?: string | null
          instance_type?: string | null
          phone_number?: string | null
          pix_enabled?: boolean | null
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
      whatsapp_quick_replies: {
        Row: {
          created_at: string | null
          establishment_id: string
          id: string
          is_active: boolean | null
          response_media_url: string | null
          response_text: string
          sort_order: number | null
          trigger_words: string[] | null
        }
        Insert: {
          created_at?: string | null
          establishment_id: string
          id?: string
          is_active?: boolean | null
          response_media_url?: string | null
          response_text: string
          sort_order?: number | null
          trigger_words?: string[] | null
        }
        Update: {
          created_at?: string | null
          establishment_id?: string
          id?: string
          is_active?: boolean | null
          response_media_url?: string | null
          response_text?: string
          sort_order?: number | null
          trigger_words?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_quick_replies_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
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
      get_public_establishment_by_slug: {
        Args: { p_slug: string }
        Returns: {
          accepts_delivery: boolean
          accepts_pickup: boolean
          accepts_table: boolean
          address: string
          address_number: string
          avg_delivery_time: number
          banner_url: string
          city_id: string
          created_at: string
          delivery_base_fee: number
          delivery_fee_per_km: number
          description: string
          email: string
          id: string
          is_open: boolean
          latitude: number
          logo_url: string
          longitude: number
          max_delivery_radius_km: number
          min_order_value: number
          name: string
          neighborhood: string
          operating_hours: Json
          phone: string
          plan_id: string
          primary_color: string
          secondary_color: string
          segment_id: string
          service_area: Json
          slug: string
          status: Database["public"]["Enums"]["establishment_status"]
          updated_at: string
          vila_id: string
          whatsapp: string
          zip_code: string
        }[]
      }
      get_public_establishments: {
        Args: never
        Returns: {
          accepts_delivery: boolean
          accepts_pickup: boolean
          accepts_table: boolean
          address: string
          address_number: string
          avg_delivery_time: number
          banner_url: string
          city_id: string
          created_at: string
          delivery_base_fee: number
          delivery_fee_per_km: number
          description: string
          email: string
          id: string
          is_open: boolean
          latitude: number
          logo_url: string
          longitude: number
          max_delivery_radius_km: number
          min_order_value: number
          name: string
          neighborhood: string
          operating_hours: Json
          phone: string
          plan_id: string
          primary_color: string
          secondary_color: string
          segment_id: string
          service_area: Json
          slug: string
          status: Database["public"]["Enums"]["establishment_status"]
          updated_at: string
          vila_id: string
          whatsapp: string
          zip_code: string
        }[]
      }
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
        | "manager"
        | "cashier"
        | "attendant"
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
        "manager",
        "cashier",
        "attendant",
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
