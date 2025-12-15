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
      address_cache: {
        Row: {
          address: string | null
          cep: string
          city: string | null
          created_at: string
          formatted_address: string | null
          id: string
          lat: number | null
          lng: number | null
          neighborhood: string | null
          source: string | null
          state: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          cep: string
          city?: string | null
          created_at?: string
          formatted_address?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          neighborhood?: string | null
          source?: string | null
          state?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          cep?: string
          city?: string | null
          created_at?: string
          formatted_address?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          neighborhood?: string | null
          source?: string | null
          state?: string | null
          updated_at?: string
        }
        Relationships: []
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
          can_be_managed: boolean | null
          commission_earned: number | null
          created_at: string | null
          establishment_id: string
          id: string
          status: string | null
        }
        Insert: {
          affiliate_id: string
          can_be_managed?: boolean | null
          commission_earned?: number | null
          created_at?: string | null
          establishment_id: string
          id?: string
          status?: string | null
        }
        Update: {
          affiliate_id?: string
          can_be_managed?: boolean | null
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
          can_manage_stores: boolean | null
          code: string
          commission_rate: number | null
          created_at: string | null
          id: string
          is_active: boolean | null
          total_earnings: number | null
          user_id: string
        }
        Insert: {
          can_manage_stores?: boolean | null
          code: string
          commission_rate?: number | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          total_earnings?: number | null
          user_id: string
        }
        Update: {
          can_manage_stores?: boolean | null
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
      agent_action_logs: {
        Row: {
          action_data: Json | null
          action_type: string
          created_at: string
          error_message: string | null
          establishment_id: string | null
          execution_time_ms: number | null
          id: string
          result: Json | null
          session_id: string
          success: boolean | null
        }
        Insert: {
          action_data?: Json | null
          action_type: string
          created_at?: string
          error_message?: string | null
          establishment_id?: string | null
          execution_time_ms?: number | null
          id?: string
          result?: Json | null
          session_id: string
          success?: boolean | null
        }
        Update: {
          action_data?: Json | null
          action_type?: string
          created_at?: string
          error_message?: string | null
          establishment_id?: string | null
          execution_time_ms?: number | null
          id?: string
          result?: Json | null
          session_id?: string
          success?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_action_logs_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_credits: {
        Row: {
          created_at: string
          credits_balance: number | null
          establishment_id: string
          id: string
          last_updated: string | null
        }
        Insert: {
          created_at?: string
          credits_balance?: number | null
          establishment_id: string
          id?: string
          last_updated?: string | null
        }
        Update: {
          created_at?: string
          credits_balance?: number | null
          establishment_id?: string
          id?: string
          last_updated?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_credits_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: true
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_profile_analyses: {
        Row: {
          analysis_date: string
          banner_score: number | null
          created_at: string
          description_score: number | null
          establishment_id: string
          id: string
          improvements_applied: boolean | null
          logo_score: number | null
          overall_score: number | null
          photos_score: number | null
          products_analyzed: number | null
          suggestions: Json | null
        }
        Insert: {
          analysis_date?: string
          banner_score?: number | null
          created_at?: string
          description_score?: number | null
          establishment_id: string
          id?: string
          improvements_applied?: boolean | null
          logo_score?: number | null
          overall_score?: number | null
          photos_score?: number | null
          products_analyzed?: number | null
          suggestions?: Json | null
        }
        Update: {
          analysis_date?: string
          banner_score?: number | null
          created_at?: string
          description_score?: number | null
          establishment_id?: string
          id?: string
          improvements_applied?: boolean | null
          logo_score?: number | null
          overall_score?: number | null
          photos_score?: number | null
          products_analyzed?: number | null
          suggestions?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_profile_analyses_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_transactions: {
        Row: {
          created_at: string
          credits_used: number | null
          description: string | null
          establishment_id: string
          id: string
          metadata: Json | null
          price: number | null
          status: string | null
          type: string
        }
        Insert: {
          created_at?: string
          credits_used?: number | null
          description?: string | null
          establishment_id: string
          id?: string
          metadata?: Json | null
          price?: number | null
          status?: string | null
          type: string
        }
        Update: {
          created_at?: string
          credits_used?: number | null
          description?: string | null
          establishment_id?: string
          id?: string
          metadata?: Json | null
          price?: number | null
          status?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_transactions_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
        ]
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
      anomaly_alerts: {
        Row: {
          alert_type: string
          amount: number | null
          created_at: string | null
          description: string | null
          establishment_id: string | null
          id: string
          metadata: Json | null
          notified_at: string | null
          resolved_at: string | null
          resolved_by: string | null
          severity: string
          title: string
          transaction_id: string | null
        }
        Insert: {
          alert_type: string
          amount?: number | null
          created_at?: string | null
          description?: string | null
          establishment_id?: string | null
          id?: string
          metadata?: Json | null
          notified_at?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity: string
          title: string
          transaction_id?: string | null
        }
        Update: {
          alert_type?: string
          amount?: number | null
          created_at?: string | null
          description?: string | null
          establishment_id?: string | null
          id?: string
          metadata?: Json | null
          notified_at?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          title?: string
          transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "anomaly_alerts_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
        ]
      }
      anomaly_config: {
        Row: {
          alert_email: boolean | null
          alert_whatsapp: boolean | null
          config_type: string
          created_at: string | null
          establishment_id: string | null
          failed_attempts_threshold: number | null
          id: string
          is_active: boolean | null
          suspicious_time_end: string | null
          suspicious_time_start: string | null
          transaction_threshold: number | null
          updated_at: string | null
        }
        Insert: {
          alert_email?: boolean | null
          alert_whatsapp?: boolean | null
          config_type: string
          created_at?: string | null
          establishment_id?: string | null
          failed_attempts_threshold?: number | null
          id?: string
          is_active?: boolean | null
          suspicious_time_end?: string | null
          suspicious_time_start?: string | null
          transaction_threshold?: number | null
          updated_at?: string | null
        }
        Update: {
          alert_email?: boolean | null
          alert_whatsapp?: boolean | null
          config_type?: string
          created_at?: string | null
          establishment_id?: string | null
          failed_attempts_threshold?: number | null
          id?: string
          is_active?: boolean | null
          suspicious_time_end?: string | null
          suspicious_time_start?: string | null
          transaction_threshold?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "anomaly_config_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
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
      auth_codes: {
        Row: {
          code: string
          created_at: string
          establishment_id: string | null
          expires_at: string
          id: string
          phone: string
          type: string
          used: boolean | null
          used_at: string | null
        }
        Insert: {
          code: string
          created_at?: string
          establishment_id?: string | null
          expires_at: string
          id?: string
          phone: string
          type: string
          used?: boolean | null
          used_at?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          establishment_id?: string | null
          expires_at?: string
          id?: string
          phone?: string
          type?: string
          used?: boolean | null
          used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "auth_codes_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
        ]
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
      birthday_greetings: {
        Row: {
          coupon_code: string | null
          customer_id: string
          establishment_id: string
          id: string
          message: string | null
          sent_at: string | null
          year: number
        }
        Insert: {
          coupon_code?: string | null
          customer_id: string
          establishment_id: string
          id?: string
          message?: string | null
          sent_at?: string | null
          year: number
        }
        Update: {
          coupon_code?: string | null
          customer_id?: string
          establishment_id?: string
          id?: string
          message?: string | null
          sent_at?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "birthday_greetings_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "birthday_greetings_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
        ]
      }
      broadcast_campaigns: {
        Row: {
          completed_at: string | null
          created_at: string | null
          created_by: string | null
          failed_count: number | null
          id: string
          media_type: string | null
          media_url: string | null
          message: string
          name: string
          scheduled_for: string | null
          sent_count: number | null
          status: string | null
          target_all: boolean | null
          target_tags: string[] | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          failed_count?: number | null
          id?: string
          media_type?: string | null
          media_url?: string | null
          message: string
          name: string
          scheduled_for?: string | null
          sent_count?: number | null
          status?: string | null
          target_all?: boolean | null
          target_tags?: string[] | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          failed_count?: number | null
          id?: string
          media_type?: string | null
          media_url?: string | null
          message?: string
          name?: string
          scheduled_for?: string | null
          sent_count?: number | null
          status?: string | null
          target_all?: boolean | null
          target_tags?: string[] | null
        }
        Relationships: []
      }
      broadcast_messages: {
        Row: {
          campaign_id: string | null
          contact_id: string | null
          created_at: string | null
          delivered_at: string | null
          error_message: string | null
          id: string
          phone: string
          read_at: string | null
          sent_at: string | null
          status: string | null
        }
        Insert: {
          campaign_id?: string | null
          contact_id?: string | null
          created_at?: string | null
          delivered_at?: string | null
          error_message?: string | null
          id?: string
          phone: string
          read_at?: string | null
          sent_at?: string | null
          status?: string | null
        }
        Update: {
          campaign_id?: string | null
          contact_id?: string | null
          created_at?: string | null
          delivered_at?: string | null
          error_message?: string | null
          id?: string
          phone?: string
          read_at?: string | null
          sent_at?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "broadcast_messages_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "broadcast_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "broadcast_messages_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "system_contacts"
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
          ifood_category_id: string | null
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
          ifood_category_id?: string | null
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
          ifood_category_id?: string | null
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
      chatbot_responses: {
        Row: {
          category: string | null
          created_at: string | null
          establishment_id: string | null
          id: string
          is_active: boolean | null
          priority: number | null
          response_text: string
          trigger_keywords: string[]
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          establishment_id?: string | null
          id?: string
          is_active?: boolean | null
          priority?: number | null
          response_text: string
          trigger_keywords: string[]
        }
        Update: {
          category?: string | null
          created_at?: string | null
          establishment_id?: string | null
          id?: string
          is_active?: boolean | null
          priority?: number | null
          response_text?: string
          trigger_keywords?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "chatbot_responses_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
        ]
      }
      cities: {
        Row: {
          center_lat: number | null
          center_lng: number | null
          created_at: string | null
          id: string
          is_active: boolean | null
          is_service_area: boolean | null
          name: string
          radius_km: number | null
          slug: string | null
          state_id: string | null
        }
        Insert: {
          center_lat?: number | null
          center_lng?: number | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_service_area?: boolean | null
          name: string
          radius_km?: number | null
          slug?: string | null
          state_id?: string | null
        }
        Update: {
          center_lat?: number | null
          center_lng?: number | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_service_area?: boolean | null
          name?: string
          radius_km?: number | null
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
          coupon_type: string | null
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
          coupon_type?: string | null
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
          coupon_type?: string | null
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
          birth_date: string | null
          created_at: string | null
          default_address: Json | null
          email: string | null
          establishment_id: string | null
          id: string
          last_location_lat: number | null
          last_location_lng: number | null
          name: string
          phone: string | null
          referred_by_affiliate_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          addresses?: Json | null
          birth_date?: string | null
          created_at?: string | null
          default_address?: Json | null
          email?: string | null
          establishment_id?: string | null
          id?: string
          last_location_lat?: number | null
          last_location_lng?: number | null
          name: string
          phone?: string | null
          referred_by_affiliate_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          addresses?: Json | null
          birth_date?: string | null
          created_at?: string | null
          default_address?: Json | null
          email?: string | null
          establishment_id?: string | null
          id?: string
          last_location_lat?: number | null
          last_location_lng?: number | null
          name?: string
          phone?: string | null
          referred_by_affiliate_id?: string | null
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
          {
            foreignKeyName: "customers_referred_by_affiliate_id_fkey"
            columns: ["referred_by_affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_drivers: {
        Row: {
          complaint_count: number | null
          created_at: string | null
          email: string | null
          establishment_id: string | null
          id: string
          is_active: boolean | null
          is_available: boolean | null
          license_plate: string | null
          name: string
          phone: string
          pix_key: string | null
          pix_key_type: string | null
          rating_average: number | null
          total_deliveries: number | null
          updated_at: string | null
          user_id: string | null
          vehicle_type: string | null
        }
        Insert: {
          complaint_count?: number | null
          created_at?: string | null
          email?: string | null
          establishment_id?: string | null
          id?: string
          is_active?: boolean | null
          is_available?: boolean | null
          license_plate?: string | null
          name: string
          phone: string
          pix_key?: string | null
          pix_key_type?: string | null
          rating_average?: number | null
          total_deliveries?: number | null
          updated_at?: string | null
          user_id?: string | null
          vehicle_type?: string | null
        }
        Update: {
          complaint_count?: number | null
          created_at?: string | null
          email?: string | null
          establishment_id?: string | null
          id?: string
          is_active?: boolean | null
          is_available?: boolean | null
          license_plate?: string | null
          name?: string
          phone?: string
          pix_key?: string | null
          pix_key_type?: string | null
          rating_average?: number | null
          total_deliveries?: number | null
          updated_at?: string | null
          user_id?: string | null
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
      delivery_queue: {
        Row: {
          actual_delivery_at: string | null
          actual_pickup_at: string | null
          created_at: string | null
          delay_notified_at: string | null
          distance_km: number | null
          driver_id: string | null
          establishment_id: string
          estimated_delivery_at: string | null
          estimated_duration_minutes: number | null
          estimated_pickup_at: string | null
          id: string
          is_delayed: boolean | null
          order_id: string
          queue_position: number
          updated_at: string | null
        }
        Insert: {
          actual_delivery_at?: string | null
          actual_pickup_at?: string | null
          created_at?: string | null
          delay_notified_at?: string | null
          distance_km?: number | null
          driver_id?: string | null
          establishment_id: string
          estimated_delivery_at?: string | null
          estimated_duration_minutes?: number | null
          estimated_pickup_at?: string | null
          id?: string
          is_delayed?: boolean | null
          order_id: string
          queue_position?: number
          updated_at?: string | null
        }
        Update: {
          actual_delivery_at?: string | null
          actual_pickup_at?: string | null
          created_at?: string | null
          delay_notified_at?: string | null
          distance_km?: number | null
          driver_id?: string | null
          establishment_id?: string
          estimated_delivery_at?: string | null
          estimated_duration_minutes?: number | null
          estimated_pickup_at?: string | null
          id?: string
          is_delayed?: boolean | null
          order_id?: string
          queue_position?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "delivery_queue_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "delivery_drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_queue_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_queue_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: true
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_requests: {
        Row: {
          accepted_at: string | null
          accepted_by: string | null
          calculated_fee: number
          created_at: string | null
          customer_name: string | null
          delivery_address: string | null
          delivery_type: string | null
          driver_earnings: number
          establishment_id: string
          estimated_distance_km: number | null
          estimated_duration_minutes: number | null
          expires_at: string
          id: string
          order_id: string
          pickup_address: string | null
          status: string
          stops_count: number | null
        }
        Insert: {
          accepted_at?: string | null
          accepted_by?: string | null
          calculated_fee?: number
          created_at?: string | null
          customer_name?: string | null
          delivery_address?: string | null
          delivery_type?: string | null
          driver_earnings?: number
          establishment_id: string
          estimated_distance_km?: number | null
          estimated_duration_minutes?: number | null
          expires_at: string
          id?: string
          order_id: string
          pickup_address?: string | null
          status?: string
          stops_count?: number | null
        }
        Update: {
          accepted_at?: string | null
          accepted_by?: string | null
          calculated_fee?: number
          created_at?: string | null
          customer_name?: string | null
          delivery_address?: string | null
          delivery_type?: string | null
          driver_earnings?: number
          establishment_id?: string
          estimated_distance_km?: number | null
          estimated_duration_minutes?: number | null
          expires_at?: string
          id?: string
          order_id?: string
          pickup_address?: string | null
          status?: string
          stops_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "delivery_requests_accepted_by_fkey"
            columns: ["accepted_by"]
            isOneToOne: false
            referencedRelation: "delivery_drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_requests_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_requests_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_tracking: {
        Row: {
          accepted_at: string | null
          cancelled_at: string | null
          created_at: string
          current_lat: number | null
          current_lng: number | null
          delivered_at: string | null
          delivery_lat: number | null
          delivery_lng: number | null
          distance_km: number | null
          driver_id: string
          establishment_id: string
          estimated_minutes: number | null
          id: string
          notes: string | null
          order_id: string
          picked_up_at: string | null
          pickup_lat: number | null
          pickup_lng: number | null
          route_polyline: string | null
          status: string
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          cancelled_at?: string | null
          created_at?: string
          current_lat?: number | null
          current_lng?: number | null
          delivered_at?: string | null
          delivery_lat?: number | null
          delivery_lng?: number | null
          distance_km?: number | null
          driver_id: string
          establishment_id: string
          estimated_minutes?: number | null
          id?: string
          notes?: string | null
          order_id: string
          picked_up_at?: string | null
          pickup_lat?: number | null
          pickup_lng?: number | null
          route_polyline?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          cancelled_at?: string | null
          created_at?: string
          current_lat?: number | null
          current_lng?: number | null
          delivered_at?: string | null
          delivery_lat?: number | null
          delivery_lng?: number | null
          distance_km?: number | null
          driver_id?: string
          establishment_id?: string
          estimated_minutes?: number | null
          id?: string
          notes?: string | null
          order_id?: string
          picked_up_at?: string | null
          pickup_lat?: number | null
          pickup_lng?: number | null
          route_polyline?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "delivery_tracking_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "delivery_drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_tracking_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_tracking_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_zones: {
        Row: {
          coordinates: Json | null
          created_at: string | null
          delivery_mode: string | null
          establishment_id: string
          fee: number
          id: string
          is_active: boolean | null
          max_time: number | null
          min_time: number | null
          name: string
          neighborhoods: string[] | null
          radius_km: number | null
          turbo_max_time: number | null
          turbo_min_time: number | null
          type: string | null
          zip_codes: string[] | null
        }
        Insert: {
          coordinates?: Json | null
          created_at?: string | null
          delivery_mode?: string | null
          establishment_id: string
          fee?: number
          id?: string
          is_active?: boolean | null
          max_time?: number | null
          min_time?: number | null
          name: string
          neighborhoods?: string[] | null
          radius_km?: number | null
          turbo_max_time?: number | null
          turbo_min_time?: number | null
          type?: string | null
          zip_codes?: string[] | null
        }
        Update: {
          coordinates?: Json | null
          created_at?: string | null
          delivery_mode?: string | null
          establishment_id?: string
          fee?: number
          id?: string
          is_active?: boolean | null
          max_time?: number | null
          min_time?: number | null
          name?: string
          neighborhoods?: string[] | null
          radius_km?: number | null
          turbo_max_time?: number | null
          turbo_min_time?: number | null
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
      disbursement_reports: {
        Row: {
          amount: number
          created_at: string | null
          establishment_id: string | null
          id: string
          paid_at: string | null
          payment_method: string | null
          payment_reference: string | null
          period_end: string
          period_start: string
          recipient_id: string | null
          recipient_name: string | null
          recipient_type: string | null
          report_type: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          establishment_id?: string | null
          id?: string
          paid_at?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          period_end: string
          period_start: string
          recipient_id?: string | null
          recipient_name?: string | null
          recipient_type?: string | null
          report_type: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          establishment_id?: string | null
          id?: string
          paid_at?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          period_end?: string
          period_start?: string
          recipient_id?: string | null
          recipient_name?: string | null
          recipient_type?: string | null
          report_type?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "disbursement_reports_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
        ]
      }
      dre_categories: {
        Row: {
          created_at: string | null
          establishment_id: string
          group_name: string
          id: string
          is_active: boolean | null
          name: string
          sort_order: number | null
          type: string
        }
        Insert: {
          created_at?: string | null
          establishment_id: string
          group_name: string
          id?: string
          is_active?: boolean | null
          name: string
          sort_order?: number | null
          type: string
        }
        Update: {
          created_at?: string | null
          establishment_id?: string
          group_name?: string
          id?: string
          is_active?: boolean | null
          name?: string
          sort_order?: number | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "dre_categories_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
        ]
      }
      dre_category_mappings: {
        Row: {
          created_at: string | null
          dre_category_id: string | null
          establishment_id: string
          id: string
          source_category: string
          source_table: string
        }
        Insert: {
          created_at?: string | null
          dre_category_id?: string | null
          establishment_id: string
          id?: string
          source_category: string
          source_table: string
        }
        Update: {
          created_at?: string | null
          dre_category_id?: string | null
          establishment_id?: string
          id?: string
          source_category?: string
          source_table?: string
        }
        Relationships: [
          {
            foreignKeyName: "dre_category_mappings_dre_category_id_fkey"
            columns: ["dre_category_id"]
            isOneToOne: false
            referencedRelation: "dre_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dre_category_mappings_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
        ]
      }
      driver_establishment_links: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          commission_type: string | null
          created_at: string | null
          driver_id: string
          establishment_id: string
          fixed_fee: number | null
          id: string
          linked_via: string | null
          percentage_fee: number | null
          status: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          commission_type?: string | null
          created_at?: string | null
          driver_id: string
          establishment_id: string
          fixed_fee?: number | null
          id?: string
          linked_via?: string | null
          percentage_fee?: number | null
          status?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          commission_type?: string | null
          created_at?: string | null
          driver_id?: string
          establishment_id?: string
          fixed_fee?: number | null
          id?: string
          linked_via?: string | null
          percentage_fee?: number | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "driver_establishment_links_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "delivery_drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "driver_establishment_links_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
        ]
      }
      driver_invitation_tokens: {
        Row: {
          created_at: string | null
          created_by: string | null
          establishment_id: string
          expires_at: string
          id: string
          token: string
          used_at: string | null
          used_by: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          establishment_id: string
          expires_at?: string
          id?: string
          token: string
          used_at?: string | null
          used_by?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          establishment_id?: string
          expires_at?: string
          id?: string
          token?: string
          used_at?: string | null
          used_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "driver_invitation_tokens_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "driver_invitation_tokens_used_by_fkey"
            columns: ["used_by"]
            isOneToOne: false
            referencedRelation: "delivery_drivers"
            referencedColumns: ["id"]
          },
        ]
      }
      driver_reviews: {
        Row: {
          comment: string | null
          created_at: string | null
          customer_id: string | null
          driver_id: string | null
          id: string
          order_id: string | null
          rating: number
          selected_tags: Json | null
        }
        Insert: {
          comment?: string | null
          created_at?: string | null
          customer_id?: string | null
          driver_id?: string | null
          id?: string
          order_id?: string | null
          rating: number
          selected_tags?: Json | null
        }
        Update: {
          comment?: string | null
          created_at?: string | null
          customer_id?: string | null
          driver_id?: string | null
          id?: string
          order_id?: string | null
          rating?: number
          selected_tags?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "driver_reviews_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "delivery_drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "driver_reviews_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      establishment_addons: {
        Row: {
          activated_at: string | null
          addon_id: string
          created_at: string | null
          establishment_id: string
          expires_at: string | null
          id: string
          is_active: boolean | null
          quantity: number | null
        }
        Insert: {
          activated_at?: string | null
          addon_id: string
          created_at?: string | null
          establishment_id: string
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          quantity?: number | null
        }
        Update: {
          activated_at?: string | null
          addon_id?: string
          created_at?: string | null
          establishment_id?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          quantity?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "establishment_addons_addon_id_fkey"
            columns: ["addon_id"]
            isOneToOne: false
            referencedRelation: "plan_addons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "establishment_addons_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
        ]
      }
      establishment_commission_debt: {
        Row: {
          created_at: string
          delivery_fee: number
          establishment_id: string
          id: string
          notes: string | null
          order_id: string
          paid_at: string | null
          payment_method: string | null
          payment_reference: string | null
          platform_product_fee: number
          platform_service_fee: number
          products_amount: number
          status: string
          total_commission_due: number
          total_order: number
        }
        Insert: {
          created_at?: string
          delivery_fee?: number
          establishment_id: string
          id?: string
          notes?: string | null
          order_id: string
          paid_at?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          platform_product_fee?: number
          platform_service_fee?: number
          products_amount?: number
          status?: string
          total_commission_due?: number
          total_order?: number
        }
        Update: {
          created_at?: string
          delivery_fee?: number
          establishment_id?: string
          id?: string
          notes?: string | null
          order_id?: string
          paid_at?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          platform_product_fee?: number
          platform_service_fee?: number
          products_amount?: number
          status?: string
          total_commission_due?: number
          total_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "establishment_commission_debt_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "establishment_commission_debt_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: true
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      establishment_roles: {
        Row: {
          created_at: string | null
          description: string | null
          establishment_id: string
          id: string
          is_active: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          establishment_id: string
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          establishment_id?: string
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "establishment_roles_establishment_id_fkey"
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
      establishment_videos: {
        Row: {
          comments_count: number | null
          created_at: string | null
          description: string | null
          display_in_marketplace: boolean | null
          display_in_store: boolean | null
          duration: number | null
          establishment_id: string
          id: string
          is_active: boolean | null
          likes_count: number | null
          main_category_id: string | null
          music_url: string | null
          product_id: string | null
          repost_days: number[] | null
          repost_schedule: Json | null
          scheduled_for: string | null
          shares_count: number | null
          sort_order: number | null
          thumbnail_url: string | null
          title: string | null
          updated_at: string | null
          video_url: string
          views_count: number | null
        }
        Insert: {
          comments_count?: number | null
          created_at?: string | null
          description?: string | null
          display_in_marketplace?: boolean | null
          display_in_store?: boolean | null
          duration?: number | null
          establishment_id: string
          id?: string
          is_active?: boolean | null
          likes_count?: number | null
          main_category_id?: string | null
          music_url?: string | null
          product_id?: string | null
          repost_days?: number[] | null
          repost_schedule?: Json | null
          scheduled_for?: string | null
          shares_count?: number | null
          sort_order?: number | null
          thumbnail_url?: string | null
          title?: string | null
          updated_at?: string | null
          video_url: string
          views_count?: number | null
        }
        Update: {
          comments_count?: number | null
          created_at?: string | null
          description?: string | null
          display_in_marketplace?: boolean | null
          display_in_store?: boolean | null
          duration?: number | null
          establishment_id?: string
          id?: string
          is_active?: boolean | null
          likes_count?: number | null
          main_category_id?: string | null
          music_url?: string | null
          product_id?: string | null
          repost_days?: number[] | null
          repost_schedule?: Json | null
          scheduled_for?: string | null
          shares_count?: number | null
          sort_order?: number | null
          thumbnail_url?: string | null
          title?: string | null
          updated_at?: string | null
          video_url?: string
          views_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "establishment_videos_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "establishment_videos_main_category_id_fkey"
            columns: ["main_category_id"]
            isOneToOne: false
            referencedRelation: "main_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "establishment_videos_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
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
          address_complement: string | null
          address_number: string | null
          avg_delivery_time: number | null
          avg_prep_time: number | null
          background_color: string | null
          banner_url: string | null
          city_id: string | null
          cnpj_cpf: string | null
          created_at: string | null
          delivery_base_fee: number | null
          delivery_calculation_mode: string | null
          delivery_fee_per_km: number | null
          description: string | null
          driver_default_commission_type: string | null
          driver_default_fee: number | null
          driver_payment_mode: string | null
          email: string | null
          evolution_api_token: string | null
          facebook_url: string | null
          free_delivery_radius_km: number | null
          gemini_api_key: string | null
          id: string
          instagram_url: string | null
          is_open: boolean | null
          latitude: number | null
          linkedin_url: string | null
          logo_url: string | null
          longitude: number | null
          max_batch_orders: number | null
          max_delivery_radius_km: number | null
          menu_json: Json | null
          menu_json_updated_at: string | null
          mercado_pago_token: string | null
          meta_description: string | null
          meta_image: string | null
          meta_title: string | null
          min_order_value: number | null
          minimum_delivery_fee: number | null
          minimum_delivery_radius_km: number | null
          mp_public_key: string | null
          mp_refresh_token: string | null
          mp_token_expires_at: string | null
          mp_user_id: string | null
          name: string
          neighborhood: string | null
          operating_hours: Json | null
          owner_id: string | null
          pagseguro_account_id: string | null
          pagseguro_refresh_token: string | null
          pagseguro_scope: string | null
          pagseguro_token: string | null
          pagseguro_token_expires_at: string | null
          payment_methods_config: Json | null
          phone: string | null
          pix_key: string | null
          plan_id: string | null
          point_device_name: string | null
          point_terminal_id: string | null
          primary_color: string | null
          rating_average: number | null
          rating_count: number | null
          secondary_color: string | null
          segment_id: string | null
          service_area: Json | null
          slug: string
          status: Database["public"]["Enums"]["establishment_status"] | null
          system_prompt: string | null
          tiktok_url: string | null
          tracking_enabled: boolean | null
          turbo_delivery_enabled: boolean | null
          turbo_delivery_fee: number | null
          turbo_fee: number | null
          turbo_radius_km: number | null
          twitter_url: string | null
          updated_at: string | null
          vila_id: string | null
          website_url: string | null
          whatsapp: string | null
          whatsapp_instance_name: string | null
          youtube_url: string | null
          zip_code: string | null
        }
        Insert: {
          accepts_delivery?: boolean | null
          accepts_pickup?: boolean | null
          accepts_table?: boolean | null
          address?: string | null
          address_complement?: string | null
          address_number?: string | null
          avg_delivery_time?: number | null
          avg_prep_time?: number | null
          background_color?: string | null
          banner_url?: string | null
          city_id?: string | null
          cnpj_cpf?: string | null
          created_at?: string | null
          delivery_base_fee?: number | null
          delivery_calculation_mode?: string | null
          delivery_fee_per_km?: number | null
          description?: string | null
          driver_default_commission_type?: string | null
          driver_default_fee?: number | null
          driver_payment_mode?: string | null
          email?: string | null
          evolution_api_token?: string | null
          facebook_url?: string | null
          free_delivery_radius_km?: number | null
          gemini_api_key?: string | null
          id?: string
          instagram_url?: string | null
          is_open?: boolean | null
          latitude?: number | null
          linkedin_url?: string | null
          logo_url?: string | null
          longitude?: number | null
          max_batch_orders?: number | null
          max_delivery_radius_km?: number | null
          menu_json?: Json | null
          menu_json_updated_at?: string | null
          mercado_pago_token?: string | null
          meta_description?: string | null
          meta_image?: string | null
          meta_title?: string | null
          min_order_value?: number | null
          minimum_delivery_fee?: number | null
          minimum_delivery_radius_km?: number | null
          mp_public_key?: string | null
          mp_refresh_token?: string | null
          mp_token_expires_at?: string | null
          mp_user_id?: string | null
          name: string
          neighborhood?: string | null
          operating_hours?: Json | null
          owner_id?: string | null
          pagseguro_account_id?: string | null
          pagseguro_refresh_token?: string | null
          pagseguro_scope?: string | null
          pagseguro_token?: string | null
          pagseguro_token_expires_at?: string | null
          payment_methods_config?: Json | null
          phone?: string | null
          pix_key?: string | null
          plan_id?: string | null
          point_device_name?: string | null
          point_terminal_id?: string | null
          primary_color?: string | null
          rating_average?: number | null
          rating_count?: number | null
          secondary_color?: string | null
          segment_id?: string | null
          service_area?: Json | null
          slug: string
          status?: Database["public"]["Enums"]["establishment_status"] | null
          system_prompt?: string | null
          tiktok_url?: string | null
          tracking_enabled?: boolean | null
          turbo_delivery_enabled?: boolean | null
          turbo_delivery_fee?: number | null
          turbo_fee?: number | null
          turbo_radius_km?: number | null
          twitter_url?: string | null
          updated_at?: string | null
          vila_id?: string | null
          website_url?: string | null
          whatsapp?: string | null
          whatsapp_instance_name?: string | null
          youtube_url?: string | null
          zip_code?: string | null
        }
        Update: {
          accepts_delivery?: boolean | null
          accepts_pickup?: boolean | null
          accepts_table?: boolean | null
          address?: string | null
          address_complement?: string | null
          address_number?: string | null
          avg_delivery_time?: number | null
          avg_prep_time?: number | null
          background_color?: string | null
          banner_url?: string | null
          city_id?: string | null
          cnpj_cpf?: string | null
          created_at?: string | null
          delivery_base_fee?: number | null
          delivery_calculation_mode?: string | null
          delivery_fee_per_km?: number | null
          description?: string | null
          driver_default_commission_type?: string | null
          driver_default_fee?: number | null
          driver_payment_mode?: string | null
          email?: string | null
          evolution_api_token?: string | null
          facebook_url?: string | null
          free_delivery_radius_km?: number | null
          gemini_api_key?: string | null
          id?: string
          instagram_url?: string | null
          is_open?: boolean | null
          latitude?: number | null
          linkedin_url?: string | null
          logo_url?: string | null
          longitude?: number | null
          max_batch_orders?: number | null
          max_delivery_radius_km?: number | null
          menu_json?: Json | null
          menu_json_updated_at?: string | null
          mercado_pago_token?: string | null
          meta_description?: string | null
          meta_image?: string | null
          meta_title?: string | null
          min_order_value?: number | null
          minimum_delivery_fee?: number | null
          minimum_delivery_radius_km?: number | null
          mp_public_key?: string | null
          mp_refresh_token?: string | null
          mp_token_expires_at?: string | null
          mp_user_id?: string | null
          name?: string
          neighborhood?: string | null
          operating_hours?: Json | null
          owner_id?: string | null
          pagseguro_account_id?: string | null
          pagseguro_refresh_token?: string | null
          pagseguro_scope?: string | null
          pagseguro_token?: string | null
          pagseguro_token_expires_at?: string | null
          payment_methods_config?: Json | null
          phone?: string | null
          pix_key?: string | null
          plan_id?: string | null
          point_device_name?: string | null
          point_terminal_id?: string | null
          primary_color?: string | null
          rating_average?: number | null
          rating_count?: number | null
          secondary_color?: string | null
          segment_id?: string | null
          service_area?: Json | null
          slug?: string
          status?: Database["public"]["Enums"]["establishment_status"] | null
          system_prompt?: string | null
          tiktok_url?: string | null
          tracking_enabled?: boolean | null
          turbo_delivery_enabled?: boolean | null
          turbo_delivery_fee?: number | null
          turbo_fee?: number | null
          turbo_radius_km?: number | null
          twitter_url?: string | null
          updated_at?: string | null
          vila_id?: string | null
          website_url?: string | null
          whatsapp?: string | null
          whatsapp_instance_name?: string | null
          youtube_url?: string | null
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
      expenses: {
        Row: {
          amount: number
          category: string
          created_at: string | null
          created_by: string | null
          description: string | null
          establishment_id: string
          expense_date: string
          id: string
          payment_method: string | null
          receipt_url: string | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          category: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          establishment_id: string
          expense_date?: string
          id?: string
          payment_method?: string | null
          receipt_url?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          establishment_id?: string
          expense_date?: string
          id?: string
          payment_method?: string | null
          receipt_url?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expenses_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
        ]
      }
      faq_templates: {
        Row: {
          answer: string
          category: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          keywords: string[] | null
          question: string
          sort_order: number | null
        }
        Insert: {
          answer: string
          category?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          keywords?: string[] | null
          question: string
          sort_order?: number | null
        }
        Update: {
          answer?: string
          category?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          keywords?: string[] | null
          question?: string
          sort_order?: number | null
        }
        Relationships: []
      }
      favorites: {
        Row: {
          created_at: string
          establishment_id: string | null
          id: string
          product_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          establishment_id?: string | null
          id?: string
          product_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          establishment_id?: string | null
          id?: string
          product_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorites_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
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
      ifood_catalogs: {
        Row: {
          catalog_id: string
          connection_id: string
          context: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          last_sync_at: string | null
        }
        Insert: {
          catalog_id: string
          connection_id: string
          context?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_sync_at?: string | null
        }
        Update: {
          catalog_id?: string
          connection_id?: string
          context?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_sync_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ifood_catalogs_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "ifood_merchant_connections"
            referencedColumns: ["id"]
          },
        ]
      }
      ifood_merchant_connections: {
        Row: {
          access_token: string | null
          created_at: string | null
          establishment_id: string
          id: string
          last_sync_at: string | null
          merchant_id: string | null
          refresh_token: string | null
          status: string
          token_expires_at: string | null
          updated_at: string | null
        }
        Insert: {
          access_token?: string | null
          created_at?: string | null
          establishment_id: string
          id?: string
          last_sync_at?: string | null
          merchant_id?: string | null
          refresh_token?: string | null
          status?: string
          token_expires_at?: string | null
          updated_at?: string | null
        }
        Update: {
          access_token?: string | null
          created_at?: string | null
          establishment_id?: string
          id?: string
          last_sync_at?: string | null
          merchant_id?: string | null
          refresh_token?: string | null
          status?: string
          token_expires_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ifood_merchant_connections_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: true
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
      loyalty_balances: {
        Row: {
          customer_id: string
          establishment_id: string
          id: string
          points_balance: number | null
          tier: string | null
          total_earned: number | null
          total_redeemed: number | null
          updated_at: string | null
        }
        Insert: {
          customer_id: string
          establishment_id: string
          id?: string
          points_balance?: number | null
          tier?: string | null
          total_earned?: number | null
          total_redeemed?: number | null
          updated_at?: string | null
        }
        Update: {
          customer_id?: string
          establishment_id?: string
          id?: string
          points_balance?: number | null
          tier?: string | null
          total_earned?: number | null
          total_redeemed?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_balances_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loyalty_balances_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
        ]
      }
      loyalty_programs: {
        Row: {
          created_at: string | null
          establishment_id: string
          expiration_days: number | null
          id: string
          is_active: boolean | null
          min_redemption: number | null
          name: string
          points_per_real: number | null
          points_value: number | null
          type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          establishment_id: string
          expiration_days?: number | null
          id?: string
          is_active?: boolean | null
          min_redemption?: number | null
          name?: string
          points_per_real?: number | null
          points_value?: number | null
          type?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          establishment_id?: string
          expiration_days?: number | null
          id?: string
          is_active?: boolean | null
          min_redemption?: number | null
          name?: string
          points_per_real?: number | null
          points_value?: number | null
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_programs_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: true
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
        ]
      }
      loyalty_rewards: {
        Row: {
          created_at: string | null
          description: string | null
          establishment_id: string
          id: string
          is_active: boolean | null
          name: string
          points_cost: number
          product_id: string | null
          reward_type: string
          reward_value: number | null
          stock: number | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          establishment_id: string
          id?: string
          is_active?: boolean | null
          name: string
          points_cost: number
          product_id?: string | null
          reward_type: string
          reward_value?: number | null
          stock?: number | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          establishment_id?: string
          id?: string
          is_active?: boolean | null
          name?: string
          points_cost?: number
          product_id?: string | null
          reward_type?: string
          reward_value?: number | null
          stock?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_rewards_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loyalty_rewards_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      loyalty_tiers: {
        Row: {
          benefits: Json | null
          color: string | null
          created_at: string | null
          establishment_id: string
          id: string
          min_points: number
          multiplier: number | null
          name: string
          sort_order: number | null
        }
        Insert: {
          benefits?: Json | null
          color?: string | null
          created_at?: string | null
          establishment_id: string
          id?: string
          min_points: number
          multiplier?: number | null
          name: string
          sort_order?: number | null
        }
        Update: {
          benefits?: Json | null
          color?: string | null
          created_at?: string | null
          establishment_id?: string
          id?: string
          min_points?: number
          multiplier?: number | null
          name?: string
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_tiers_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
        ]
      }
      loyalty_transactions: {
        Row: {
          balance_after: number
          created_at: string | null
          customer_id: string
          description: string | null
          establishment_id: string
          id: string
          order_id: string | null
          points: number
          type: string
        }
        Insert: {
          balance_after: number
          created_at?: string | null
          customer_id: string
          description?: string | null
          establishment_id: string
          id?: string
          order_id?: string | null
          points: number
          type: string
        }
        Update: {
          balance_after?: number
          created_at?: string | null
          customer_id?: string
          description?: string | null
          establishment_id?: string
          id?: string
          order_id?: string | null
          points?: number
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_transactions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loyalty_transactions_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loyalty_transactions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      main_categories: {
        Row: {
          bg_color: string | null
          border_color: string | null
          created_at: string | null
          description: string | null
          icon: string | null
          icon_color: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          name: string
          slug: string
          sort_order: number | null
        }
        Insert: {
          bg_color?: string | null
          border_color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          icon_color?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name: string
          slug: string
          sort_order?: number | null
        }
        Update: {
          bg_color?: string | null
          border_color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          icon_color?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name?: string
          slug?: string
          sort_order?: number | null
        }
        Relationships: []
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
          gateway: string | null
          id: string
          metadata: Json | null
          mp_payment_id: string | null
          mp_preapproval_id: string | null
          net_amount: number | null
          order_id: string | null
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
          gateway?: string | null
          id?: string
          metadata?: Json | null
          mp_payment_id?: string | null
          mp_preapproval_id?: string | null
          net_amount?: number | null
          order_id?: string | null
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
          gateway?: string | null
          id?: string
          metadata?: Json | null
          mp_payment_id?: string | null
          mp_preapproval_id?: string | null
          net_amount?: number | null
          order_id?: string | null
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
          {
            foreignKeyName: "mp_transactions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      n8n_chat_histories: {
        Row: {
          created_at: string
          id: string
          message: Json
          session_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: Json
          session_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: Json
          session_id?: string
        }
        Relationships: []
      }
      notification_preferences: {
        Row: {
          created_at: string | null
          disabled_types: string[] | null
          id: string
          quiet_hours_end: string | null
          quiet_hours_start: string | null
          sound_enabled: boolean | null
          updated_at: string | null
          user_id: string
          vibration_enabled: boolean | null
          volume: number | null
        }
        Insert: {
          created_at?: string | null
          disabled_types?: string[] | null
          id?: string
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          sound_enabled?: boolean | null
          updated_at?: string | null
          user_id: string
          vibration_enabled?: boolean | null
          volume?: number | null
        }
        Update: {
          created_at?: string | null
          disabled_types?: string[] | null
          id?: string
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          sound_enabled?: boolean | null
          updated_at?: string | null
          user_id?: string
          vibration_enabled?: boolean | null
          volume?: number | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string | null
          data: Json | null
          establishment_id: string | null
          expires_at: string | null
          id: string
          is_dismissed: boolean | null
          is_read: boolean | null
          message: string | null
          priority: Database["public"]["Enums"]["notification_priority"]
          read_at: string | null
          target_roles: string[] | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          data?: Json | null
          establishment_id?: string | null
          expires_at?: string | null
          id?: string
          is_dismissed?: boolean | null
          is_read?: boolean | null
          message?: string | null
          priority?: Database["public"]["Enums"]["notification_priority"]
          read_at?: string | null
          target_roles?: string[] | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          data?: Json | null
          establishment_id?: string | null
          expires_at?: string | null
          id?: string
          is_dismissed?: boolean | null
          is_read?: boolean | null
          message?: string | null
          priority?: Database["public"]["Enums"]["notification_priority"]
          read_at?: string | null
          target_roles?: string[] | null
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_establishment_id_fkey"
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
          commission_debt_created: boolean | null
          cpf: string | null
          created_at: string | null
          customer_id: string | null
          customer_phone: string | null
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
          order_source: string | null
          out_of_stock_action: string | null
          payment_method: Database["public"]["Enums"]["payment_method"] | null
          pix_code: string | null
          pix_expires_at: string | null
          pix_qr_base64: string | null
          platform_fee: number | null
          review_token: string | null
          review_token_expires_at: string | null
          scheduled_for: string | null
          status: Database["public"]["Enums"]["order_status"] | null
          subtotal: number
          table_number: string | null
          total: number
          updated_at: string | null
          whatsapp_tracking_enabled: boolean | null
        }
        Insert: {
          cancellation_reason?: string | null
          cancelled_at?: string | null
          change_for?: number | null
          commission_debt_created?: boolean | null
          cpf?: string | null
          created_at?: string | null
          customer_id?: string | null
          customer_phone?: string | null
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
          order_source?: string | null
          out_of_stock_action?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          pix_code?: string | null
          pix_expires_at?: string | null
          pix_qr_base64?: string | null
          platform_fee?: number | null
          review_token?: string | null
          review_token_expires_at?: string | null
          scheduled_for?: string | null
          status?: Database["public"]["Enums"]["order_status"] | null
          subtotal?: number
          table_number?: string | null
          total?: number
          updated_at?: string | null
          whatsapp_tracking_enabled?: boolean | null
        }
        Update: {
          cancellation_reason?: string | null
          cancelled_at?: string | null
          change_for?: number | null
          commission_debt_created?: boolean | null
          cpf?: string | null
          created_at?: string | null
          customer_id?: string | null
          customer_phone?: string | null
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
          order_source?: string | null
          out_of_stock_action?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          pix_code?: string | null
          pix_expires_at?: string | null
          pix_qr_base64?: string | null
          platform_fee?: number | null
          review_token?: string | null
          review_token_expires_at?: string | null
          scheduled_for?: string | null
          status?: Database["public"]["Enums"]["order_status"] | null
          subtotal?: number
          table_number?: string | null
          total?: number
          updated_at?: string | null
          whatsapp_tracking_enabled?: boolean | null
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
      payment_split_items: {
        Row: {
          amount: number
          created_at: string | null
          establishment_fee: number | null
          establishment_id: string | null
          id: string
          mp_transfer_id: string | null
          net_amount: number
          order_id: string | null
          split_id: string | null
          transfer_status: string | null
          transferred_at: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          establishment_fee?: number | null
          establishment_id?: string | null
          id?: string
          mp_transfer_id?: string | null
          net_amount: number
          order_id?: string | null
          split_id?: string | null
          transfer_status?: string | null
          transferred_at?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          establishment_fee?: number | null
          establishment_id?: string | null
          id?: string
          mp_transfer_id?: string | null
          net_amount?: number
          order_id?: string | null
          split_id?: string | null
          transfer_status?: string | null
          transferred_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_split_items_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_split_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_split_items_split_id_fkey"
            columns: ["split_id"]
            isOneToOne: false
            referencedRelation: "payment_splits"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_splits: {
        Row: {
          checkout_id: string
          created_at: string | null
          id: string
          mp_payment_id: string | null
          payer_email: string | null
          payer_name: string | null
          payment_method: string | null
          platform_fee: number | null
          platform_fee_percent: number | null
          status: string | null
          total_amount: number
          updated_at: string | null
        }
        Insert: {
          checkout_id: string
          created_at?: string | null
          id?: string
          mp_payment_id?: string | null
          payer_email?: string | null
          payer_name?: string | null
          payment_method?: string | null
          platform_fee?: number | null
          platform_fee_percent?: number | null
          status?: string | null
          total_amount: number
          updated_at?: string | null
        }
        Update: {
          checkout_id?: string
          created_at?: string | null
          id?: string
          mp_payment_id?: string | null
          payer_email?: string | null
          payer_name?: string | null
          payment_method?: string | null
          platform_fee?: number | null
          platform_fee_percent?: number | null
          status?: string | null
          total_amount?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      plan_addons: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          price_monthly: number
          slug: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          price_monthly?: number
          slug: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          price_monthly?: number
          slug?: string
        }
        Relationships: []
      }
      plans: {
        Row: {
          ai_unlimited: boolean | null
          billing_period: string | null
          chatbot_basic: boolean | null
          created_at: string | null
          description: string | null
          features: Json | null
          id: string
          is_active: boolean | null
          is_popular: boolean | null
          marketplace_enabled: boolean | null
          marketplace_highlight: boolean | null
          marketplace_priority: number | null
          max_orders: number | null
          max_products: number | null
          max_stores: number | null
          max_users: number | null
          max_videos: number | null
          max_whatsapp_messages: number | null
          name: string
          price: number
          price_monthly: number | null
          price_yearly: number | null
          slug: string | null
          sort_order: number | null
          updated_at: string | null
          whatsapp_ai_agent: boolean | null
          whatsapp_chatbot: boolean | null
        }
        Insert: {
          ai_unlimited?: boolean | null
          billing_period?: string | null
          chatbot_basic?: boolean | null
          created_at?: string | null
          description?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          is_popular?: boolean | null
          marketplace_enabled?: boolean | null
          marketplace_highlight?: boolean | null
          marketplace_priority?: number | null
          max_orders?: number | null
          max_products?: number | null
          max_stores?: number | null
          max_users?: number | null
          max_videos?: number | null
          max_whatsapp_messages?: number | null
          name: string
          price?: number
          price_monthly?: number | null
          price_yearly?: number | null
          slug?: string | null
          sort_order?: number | null
          updated_at?: string | null
          whatsapp_ai_agent?: boolean | null
          whatsapp_chatbot?: boolean | null
        }
        Update: {
          ai_unlimited?: boolean | null
          billing_period?: string | null
          chatbot_basic?: boolean | null
          created_at?: string | null
          description?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          is_popular?: boolean | null
          marketplace_enabled?: boolean | null
          marketplace_highlight?: boolean | null
          marketplace_priority?: number | null
          max_orders?: number | null
          max_products?: number | null
          max_stores?: number | null
          max_users?: number | null
          max_videos?: number | null
          max_whatsapp_messages?: number | null
          name?: string
          price?: number
          price_monthly?: number | null
          price_yearly?: number | null
          slug?: string | null
          sort_order?: number | null
          updated_at?: string | null
          whatsapp_ai_agent?: boolean | null
          whatsapp_chatbot?: boolean | null
        }
        Relationships: []
      }
      platform_reviews: {
        Row: {
          comment: string | null
          created_at: string | null
          customer_id: string | null
          id: string
          order_channel: string | null
          order_id: string | null
          rating: number
          selected_tags: Json | null
        }
        Insert: {
          comment?: string | null
          created_at?: string | null
          customer_id?: string | null
          id?: string
          order_channel?: string | null
          order_id?: string | null
          rating: number
          selected_tags?: Json | null
        }
        Update: {
          comment?: string | null
          created_at?: string | null
          customer_id?: string | null
          id?: string
          order_channel?: string | null
          order_id?: string | null
          rating?: number
          selected_tags?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "platform_reviews_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_settings: {
        Row: {
          created_at: string
          description: string | null
          id: string
          setting_key: string
          setting_value: Json | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          setting_key: string
          setting_value?: Json | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          setting_key?: string
          setting_value?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      product_complements: {
        Row: {
          complement_id: string
          created_at: string | null
          discount_fixed: number | null
          discount_percentage: number | null
          id: string
          is_active: boolean | null
          product_id: string
        }
        Insert: {
          complement_id: string
          created_at?: string | null
          discount_fixed?: number | null
          discount_percentage?: number | null
          id?: string
          is_active?: boolean | null
          product_id: string
        }
        Update: {
          complement_id?: string
          created_at?: string | null
          discount_fixed?: number | null
          discount_percentage?: number | null
          id?: string
          is_active?: boolean | null
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_complements_complement_id_fkey"
            columns: ["complement_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_complements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_kit_items: {
        Row: {
          created_at: string | null
          id: string
          is_replaceable: boolean | null
          kit_id: string
          product_id: string
          quantity: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_replaceable?: boolean | null
          kit_id: string
          product_id: string
          quantity?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_replaceable?: boolean | null
          kit_id?: string
          product_id?: string
          quantity?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "product_kit_items_kit_id_fkey"
            columns: ["kit_id"]
            isOneToOne: false
            referencedRelation: "product_kits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_kit_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_kits: {
        Row: {
          created_at: string | null
          description: string | null
          establishment_id: string
          id: string
          image_url: string | null
          is_active: boolean | null
          kit_price: number
          name: string
          original_price: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          establishment_id: string
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          kit_price: number
          name: string
          original_price?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          establishment_id?: string
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          kit_price?: number
          name?: string
          original_price?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_kits_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          additionals: Json | null
          allows_multiple_flavors: boolean | null
          booking_advance_days: number | null
          category_id: string | null
          cost_price: number | null
          cost_price_updated_at: string | null
          created_at: string | null
          description: string | null
          digital_delivery_url: string | null
          digital_instructions: string | null
          establishment_id: string
          expiration_days: number | null
          id: string
          ifood_item_id: string | null
          ifood_last_sync: string | null
          ifood_sku: string | null
          image_url: string | null
          is_active: boolean | null
          is_featured: boolean | null
          max_flavors: number | null
          max_stock: number | null
          min_stock: number | null
          name: string
          preparation_time: number | null
          price: number
          product_category: string | null
          product_type: string | null
          progressive_pricing: Json | null
          promotional_price: number | null
          requires_age_verification: boolean | null
          requires_booking: boolean | null
          requires_refrigeration: boolean | null
          service_duration: number | null
          service_location: string | null
          stock_quantity: number | null
          storage_temperature: string | null
          storage_type: string | null
          temperature_options: Json | null
          updated_at: string | null
          variations: Json | null
        }
        Insert: {
          additionals?: Json | null
          allows_multiple_flavors?: boolean | null
          booking_advance_days?: number | null
          category_id?: string | null
          cost_price?: number | null
          cost_price_updated_at?: string | null
          created_at?: string | null
          description?: string | null
          digital_delivery_url?: string | null
          digital_instructions?: string | null
          establishment_id: string
          expiration_days?: number | null
          id?: string
          ifood_item_id?: string | null
          ifood_last_sync?: string | null
          ifood_sku?: string | null
          image_url?: string | null
          is_active?: boolean | null
          is_featured?: boolean | null
          max_flavors?: number | null
          max_stock?: number | null
          min_stock?: number | null
          name: string
          preparation_time?: number | null
          price: number
          product_category?: string | null
          product_type?: string | null
          progressive_pricing?: Json | null
          promotional_price?: number | null
          requires_age_verification?: boolean | null
          requires_booking?: boolean | null
          requires_refrigeration?: boolean | null
          service_duration?: number | null
          service_location?: string | null
          stock_quantity?: number | null
          storage_temperature?: string | null
          storage_type?: string | null
          temperature_options?: Json | null
          updated_at?: string | null
          variations?: Json | null
        }
        Update: {
          additionals?: Json | null
          allows_multiple_flavors?: boolean | null
          booking_advance_days?: number | null
          category_id?: string | null
          cost_price?: number | null
          cost_price_updated_at?: string | null
          created_at?: string | null
          description?: string | null
          digital_delivery_url?: string | null
          digital_instructions?: string | null
          establishment_id?: string
          expiration_days?: number | null
          id?: string
          ifood_item_id?: string | null
          ifood_last_sync?: string | null
          ifood_sku?: string | null
          image_url?: string | null
          is_active?: boolean | null
          is_featured?: boolean | null
          max_flavors?: number | null
          max_stock?: number | null
          min_stock?: number | null
          name?: string
          preparation_time?: number | null
          price?: number
          product_category?: string | null
          product_type?: string | null
          progressive_pricing?: Json | null
          promotional_price?: number | null
          requires_age_verification?: boolean | null
          requires_booking?: boolean | null
          requires_refrigeration?: boolean | null
          service_duration?: number | null
          service_location?: string | null
          stock_quantity?: number | null
          storage_temperature?: string | null
          storage_type?: string | null
          temperature_options?: Json | null
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
          birth_date: string | null
          cpf: string | null
          created_at: string | null
          default_address: Json | null
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          birth_date?: string | null
          cpf?: string | null
          created_at?: string | null
          default_address?: Json | null
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          birth_date?: string | null
          cpf?: string | null
          created_at?: string | null
          default_address?: Json | null
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      public_display_tokens: {
        Row: {
          created_at: string | null
          display_type: string
          establishment_id: string
          expires_at: string | null
          id: string
          is_active: boolean | null
          name: string | null
          token: string
        }
        Insert: {
          created_at?: string | null
          display_type?: string
          establishment_id: string
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string | null
          token: string
        }
        Update: {
          created_at?: string | null
          display_type?: string
          establishment_id?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string | null
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "public_display_tokens_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
        ]
      }
      push_subscriptions: {
        Row: {
          auth_key: string
          created_at: string | null
          endpoint: string
          id: string
          is_active: boolean | null
          p256dh_key: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          auth_key: string
          created_at?: string | null
          endpoint: string
          id?: string
          is_active?: boolean | null
          p256dh_key: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          auth_key?: string
          created_at?: string | null
          endpoint?: string
          id?: string
          is_active?: boolean | null
          p256dh_key?: string
          updated_at?: string | null
          user_id?: string | null
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
      review_tags: {
        Row: {
          category: string
          created_at: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          rating_max: number
          rating_min: number
          sentiment: string
          sort_order: number | null
          tag_text: string
        }
        Insert: {
          category: string
          created_at?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          rating_max: number
          rating_min: number
          sentiment: string
          sort_order?: number | null
          tag_text: string
        }
        Update: {
          category?: string
          created_at?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          rating_max?: number
          rating_min?: number
          sentiment?: string
          sort_order?: number | null
          tag_text?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          comment: string | null
          created_at: string | null
          customer_id: string | null
          delivery_rating: number | null
          establishment_id: string
          food_rating: number | null
          id: string
          is_verified_purchase: boolean | null
          is_visible: boolean | null
          order_id: string | null
          overall_rating: number
          owner_response: string | null
          owner_response_at: string | null
          photos: Json | null
          rating_scale: number | null
          selected_tags: Json | null
          service_rating: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          comment?: string | null
          created_at?: string | null
          customer_id?: string | null
          delivery_rating?: number | null
          establishment_id: string
          food_rating?: number | null
          id?: string
          is_verified_purchase?: boolean | null
          is_visible?: boolean | null
          order_id?: string | null
          overall_rating: number
          owner_response?: string | null
          owner_response_at?: string | null
          photos?: Json | null
          rating_scale?: number | null
          selected_tags?: Json | null
          service_rating?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          comment?: string | null
          created_at?: string | null
          customer_id?: string | null
          delivery_rating?: number | null
          establishment_id?: string
          food_rating?: number | null
          id?: string
          is_verified_purchase?: boolean | null
          is_visible?: boolean | null
          order_id?: string | null
          overall_rating?: number
          owner_response?: string | null
          owner_response_at?: string | null
          photos?: Json | null
          rating_scale?: number | null
          selected_tags?: Json | null
          service_rating?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: true
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      roadmap_items: {
        Row: {
          category: string
          completion_percentage: number | null
          created_at: string | null
          description: string | null
          estimated_hours: number | null
          id: string
          priority: string | null
          status: string | null
          tester_assigned: string | null
          title: string
          updated_at: string | null
          version_phase: string | null
        }
        Insert: {
          category: string
          completion_percentage?: number | null
          created_at?: string | null
          description?: string | null
          estimated_hours?: number | null
          id?: string
          priority?: string | null
          status?: string | null
          tester_assigned?: string | null
          title: string
          updated_at?: string | null
          version_phase?: string | null
        }
        Update: {
          category?: string
          completion_percentage?: number | null
          created_at?: string | null
          description?: string | null
          estimated_hours?: number | null
          id?: string
          priority?: string | null
          status?: string | null
          tester_assigned?: string | null
          title?: string
          updated_at?: string | null
          version_phase?: string | null
        }
        Relationships: []
      }
      role_permissions: {
        Row: {
          created_at: string | null
          id: string
          permission_key: string
          role_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          permission_key: string
          role_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          permission_key?: string
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "establishment_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_addresses: {
        Row: {
          city: string
          complement: string | null
          created_at: string
          formatted_address: string | null
          id: string
          is_default: boolean | null
          label: string
          latitude: number | null
          longitude: number | null
          neighborhood: string | null
          number: string | null
          state: string
          street: string
          updated_at: string
          user_id: string
          zip_code: string | null
        }
        Insert: {
          city: string
          complement?: string | null
          created_at?: string
          formatted_address?: string | null
          id?: string
          is_default?: boolean | null
          label?: string
          latitude?: number | null
          longitude?: number | null
          neighborhood?: string | null
          number?: string | null
          state?: string
          street: string
          updated_at?: string
          user_id: string
          zip_code?: string | null
        }
        Update: {
          city?: string
          complement?: string | null
          created_at?: string
          formatted_address?: string | null
          id?: string
          is_default?: boolean | null
          label?: string
          latitude?: number | null
          longitude?: number | null
          neighborhood?: string | null
          number?: string | null
          state?: string
          street?: string
          updated_at?: string
          user_id?: string
          zip_code?: string | null
        }
        Relationships: []
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
          recurrence: Json | null
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
          recurrence?: Json | null
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
          recurrence?: Json | null
          scheduled_for?: string
          status?: string | null
          subtotal?: number
          total?: number
        }
        Relationships: [
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
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          parent_category_id: string | null
          slug: string | null
          sort_order: number | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          parent_category_id?: string | null
          slug?: string | null
          sort_order?: number | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          parent_category_id?: string | null
          slug?: string | null
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "segments_parent_category_id_fkey"
            columns: ["parent_category_id"]
            isOneToOne: false
            referencedRelation: "main_categories"
            referencedColumns: ["id"]
          },
        ]
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
      support_conversations: {
        Row: {
          created_at: string | null
          customer_id: string | null
          customer_name: string | null
          customer_phone: string | null
          establishment_id: string
          id: string
          last_message_at: string | null
          order_id: string | null
          priority: string | null
          resolved_at: string | null
          resolved_by: string | null
          status: string | null
          subject: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          customer_id?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          establishment_id: string
          id?: string
          last_message_at?: string | null
          order_id?: string | null
          priority?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string | null
          subject?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          customer_id?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          establishment_id?: string
          id?: string
          last_message_at?: string | null
          order_id?: string | null
          priority?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string | null
          subject?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "support_conversations_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_conversations_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      support_messages: {
        Row: {
          attachment_url: string | null
          content: string
          conversation_id: string
          created_at: string | null
          id: string
          is_read: boolean | null
          message_type: string | null
          read_at: string | null
          sender_id: string | null
          sender_name: string | null
          sender_type: string
        }
        Insert: {
          attachment_url?: string | null
          content: string
          conversation_id: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message_type?: string | null
          read_at?: string | null
          sender_id?: string | null
          sender_name?: string | null
          sender_type: string
        }
        Update: {
          attachment_url?: string | null
          content?: string
          conversation_id?: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message_type?: string | null
          read_at?: string | null
          sender_id?: string | null
          sender_name?: string | null
          sender_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "support_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      system_contacts: {
        Row: {
          created_at: string | null
          email: string | null
          establishment_id: string | null
          id: string
          is_active: boolean | null
          last_message_at: string | null
          name: string
          notes: string | null
          opted_in_broadcasts: boolean | null
          phone: string
          role: string | null
          tags: string[] | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          establishment_id?: string | null
          id?: string
          is_active?: boolean | null
          last_message_at?: string | null
          name: string
          notes?: string | null
          opted_in_broadcasts?: boolean | null
          phone: string
          role?: string | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          establishment_id?: string | null
          id?: string
          is_active?: boolean | null
          last_message_at?: string | null
          name?: string
          notes?: string | null
          opted_in_broadcasts?: boolean | null
          phone?: string
          role?: string | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "system_contacts_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
        ]
      }
      system_message_templates: {
        Row: {
          category: string
          created_at: string | null
          id: string
          is_active: boolean | null
          message: string
          name: string
          updated_at: string | null
          variables: string[] | null
        }
        Insert: {
          category: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          message: string
          name: string
          updated_at?: string | null
          variables?: string[] | null
        }
        Update: {
          category?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          message?: string
          name?: string
          updated_at?: string | null
          variables?: string[] | null
        }
        Relationships: []
      }
      tv_playlist_settings: {
        Row: {
          created_at: string | null
          default_duration: number | null
          establishment_id: string
          id: string
          is_active: boolean | null
          playback_mode: string | null
          transition_type: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          default_duration?: number | null
          establishment_id: string
          id?: string
          is_active?: boolean | null
          playback_mode?: string | null
          transition_type?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          default_duration?: number | null
          establishment_id?: string
          id?: string
          is_active?: boolean | null
          playback_mode?: string | null
          transition_type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tv_playlist_settings_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: true
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
        ]
      }
      tv_slides: {
        Row: {
          badge_text: string | null
          created_at: string | null
          duration_seconds: number | null
          establishment_id: string
          id: string
          image_position_x: number | null
          image_position_y: number | null
          image_scale: number | null
          image_url: string
          is_active: boolean | null
          media_type: string | null
          product_id: string | null
          secondary_images: Json | null
          sort_order: number | null
          subtitle: string | null
          template_type: string
          title: string | null
          updated_at: string | null
        }
        Insert: {
          badge_text?: string | null
          created_at?: string | null
          duration_seconds?: number | null
          establishment_id: string
          id?: string
          image_position_x?: number | null
          image_position_y?: number | null
          image_scale?: number | null
          image_url: string
          is_active?: boolean | null
          media_type?: string | null
          product_id?: string | null
          secondary_images?: Json | null
          sort_order?: number | null
          subtitle?: string | null
          template_type?: string
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          badge_text?: string | null
          created_at?: string | null
          duration_seconds?: number | null
          establishment_id?: string
          id?: string
          image_position_x?: number | null
          image_position_y?: number | null
          image_scale?: number | null
          image_url?: string
          is_active?: boolean | null
          media_type?: string | null
          product_id?: string | null
          secondary_images?: Json | null
          sort_order?: number | null
          subtitle?: string | null
          template_type?: string
          title?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tv_slides_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tv_slides_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      user_behavior_logs: {
        Row: {
          action_type: string
          created_at: string | null
          entity_id: string | null
          entity_type: string | null
          id: string
          metadata: Json | null
          session_id: string
          user_id: string | null
        }
        Insert: {
          action_type: string
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          metadata?: Json | null
          session_id: string
          user_id?: string | null
        }
        Update: {
          action_type?: string
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          metadata?: Json | null
          session_id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      user_establishment_roles: {
        Row: {
          created_at: string | null
          establishment_id: string
          id: string
          role_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          establishment_id: string
          id?: string
          role_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          establishment_id?: string
          id?: string
          role_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_establishment_roles_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_establishment_roles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "establishment_roles"
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
      video_comments: {
        Row: {
          content: string
          created_at: string | null
          id: string
          is_hidden: boolean | null
          parent_id: string | null
          session_id: string | null
          updated_at: string | null
          user_id: string | null
          video_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          is_hidden?: boolean | null
          parent_id?: string | null
          session_id?: string | null
          updated_at?: string | null
          user_id?: string | null
          video_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          is_hidden?: boolean | null
          parent_id?: string | null
          session_id?: string | null
          updated_at?: string | null
          user_id?: string | null
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "video_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_comments_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "establishment_videos"
            referencedColumns: ["id"]
          },
        ]
      }
      video_likes: {
        Row: {
          created_at: string | null
          id: string
          session_id: string | null
          user_id: string | null
          video_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          session_id?: string | null
          user_id?: string | null
          video_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          session_id?: string | null
          user_id?: string | null
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_likes_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "establishment_videos"
            referencedColumns: ["id"]
          },
        ]
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
      waiter_tab_history: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          establishment_id: string
          id: string
          tab_id: string
          user_name: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          establishment_id: string
          id?: string
          tab_id: string
          user_name?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          establishment_id?: string
          id?: string
          tab_id?: string
          user_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "waiter_tab_history_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "waiter_tab_history_tab_id_fkey"
            columns: ["tab_id"]
            isOneToOne: false
            referencedRelation: "waiter_tabs"
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
      whatsapp_auto_messages: {
        Row: {
          created_at: string | null
          establishment_id: string
          event_type: string
          id: string
          is_active: boolean | null
          message_template: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          establishment_id: string
          event_type: string
          id?: string
          is_active?: boolean | null
          message_template: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          establishment_id?: string
          event_type?: string
          id?: string
          is_active?: boolean | null
          message_template?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_auto_messages_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_carts: {
        Row: {
          created_at: string | null
          customer_name: string | null
          customer_phone: string
          delivery_address: Json | null
          delivery_fee: number | null
          establishment_id: string
          expires_at: string | null
          id: string
          items: Json | null
          status: string | null
          subtotal: number | null
          total: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          customer_name?: string | null
          customer_phone: string
          delivery_address?: Json | null
          delivery_fee?: number | null
          establishment_id: string
          expires_at?: string | null
          id?: string
          items?: Json | null
          status?: string | null
          subtotal?: number | null
          total?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          customer_name?: string | null
          customer_phone?: string
          delivery_address?: Json | null
          delivery_fee?: number | null
          establishment_id?: string
          expires_at?: string | null
          id?: string
          items?: Json | null
          status?: string | null
          subtotal?: number | null
          total?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_carts_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_chat_messages: {
        Row: {
          bot_message: string | null
          created_at: string | null
          establishment_id: string | null
          id: string
          message_type: string | null
          nome_wpp: string | null
          phone: string
          user_message: string | null
        }
        Insert: {
          bot_message?: string | null
          created_at?: string | null
          establishment_id?: string | null
          id?: string
          message_type?: string | null
          nome_wpp?: string | null
          phone: string
          user_message?: string | null
        }
        Update: {
          bot_message?: string | null
          created_at?: string | null
          establishment_id?: string | null
          id?: string
          message_type?: string | null
          nome_wpp?: string | null
          phone?: string
          user_message?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_chat_messages_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_chats: {
        Row: {
          ai_status: string | null
          created_at: string | null
          establishment_id: string | null
          id: string
          nome_wpp: string | null
          phone: string
          updated_at: string | null
        }
        Insert: {
          ai_status?: string | null
          created_at?: string | null
          establishment_id?: string | null
          id?: string
          nome_wpp?: string | null
          phone: string
          updated_at?: string | null
        }
        Update: {
          ai_status?: string | null
          created_at?: string | null
          establishment_id?: string | null
          id?: string
          nome_wpp?: string | null
          phone?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_chats_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_conversations: {
        Row: {
          created_at: string | null
          customer_name: string | null
          customer_phone: string
          establishment_id: string
          id: string
          last_message_at: string | null
          messages: Json | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          customer_name?: string | null
          customer_phone: string
          establishment_id: string
          id?: string
          last_message_at?: string | null
          messages?: Json | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          customer_name?: string | null
          customer_phone?: string
          establishment_id?: string
          id?: string
          last_message_at?: string | null
          messages?: Json | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_conversations_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_instances: {
        Row: {
          ai_enabled: boolean | null
          ai_model: string | null
          ai_prompt: string | null
          api_key: string | null
          audio_enabled: boolean | null
          auto_response_enabled: boolean | null
          business_hours_message: string | null
          created_at: string | null
          description: string | null
          establishment_id: string | null
          evolution_api_key: string | null
          evolution_api_url: string | null
          id: string
          instance_id: string | null
          instance_name: string | null
          instance_type: string | null
          keywords_enabled: boolean | null
          menu_sync_enabled: boolean | null
          n8n_enabled: boolean | null
          n8n_webhook_url: string | null
          outside_hours_message: string | null
          phone_number: string | null
          pix_enabled: boolean | null
          qr_code: string | null
          send_media_enabled: boolean | null
          status: string | null
          updated_at: string | null
          webhook_configured_at: string | null
          webhook_url: string | null
          welcome_message: string | null
          whatsapp_level: number | null
        }
        Insert: {
          ai_enabled?: boolean | null
          ai_model?: string | null
          ai_prompt?: string | null
          api_key?: string | null
          audio_enabled?: boolean | null
          auto_response_enabled?: boolean | null
          business_hours_message?: string | null
          created_at?: string | null
          description?: string | null
          establishment_id?: string | null
          evolution_api_key?: string | null
          evolution_api_url?: string | null
          id?: string
          instance_id?: string | null
          instance_name?: string | null
          instance_type?: string | null
          keywords_enabled?: boolean | null
          menu_sync_enabled?: boolean | null
          n8n_enabled?: boolean | null
          n8n_webhook_url?: string | null
          outside_hours_message?: string | null
          phone_number?: string | null
          pix_enabled?: boolean | null
          qr_code?: string | null
          send_media_enabled?: boolean | null
          status?: string | null
          updated_at?: string | null
          webhook_configured_at?: string | null
          webhook_url?: string | null
          welcome_message?: string | null
          whatsapp_level?: number | null
        }
        Update: {
          ai_enabled?: boolean | null
          ai_model?: string | null
          ai_prompt?: string | null
          api_key?: string | null
          audio_enabled?: boolean | null
          auto_response_enabled?: boolean | null
          business_hours_message?: string | null
          created_at?: string | null
          description?: string | null
          establishment_id?: string | null
          evolution_api_key?: string | null
          evolution_api_url?: string | null
          id?: string
          instance_id?: string | null
          instance_name?: string | null
          instance_type?: string | null
          keywords_enabled?: boolean | null
          menu_sync_enabled?: boolean | null
          n8n_enabled?: boolean | null
          n8n_webhook_url?: string | null
          outside_hours_message?: string | null
          phone_number?: string | null
          pix_enabled?: boolean | null
          qr_code?: string | null
          send_media_enabled?: boolean | null
          status?: string | null
          updated_at?: string | null
          webhook_configured_at?: string | null
          webhook_url?: string | null
          welcome_message?: string | null
          whatsapp_level?: number | null
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
      whatsapp_keywords: {
        Row: {
          category: string
          created_at: string | null
          establishment_id: string
          id: string
          is_active: boolean | null
          keywords: string[]
          response_link: string | null
          response_text: string | null
          send_menu_link: boolean | null
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          establishment_id: string
          id?: string
          is_active?: boolean | null
          keywords?: string[]
          response_link?: string | null
          response_text?: string | null
          send_menu_link?: boolean | null
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          establishment_id?: string
          id?: string
          is_active?: boolean | null
          keywords?: string[]
          response_link?: string | null
          response_text?: string | null
          send_menu_link?: boolean | null
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_keywords_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_messages: {
        Row: {
          agent_type: string | null
          content: string
          created_at: string | null
          id: string
          is_from_bot: boolean | null
          media_analyzed: boolean | null
          media_type: string | null
          media_url: string | null
          message_type: string | null
          processed_content: string | null
          product_id: string | null
          sender: string
          session_id: string
        }
        Insert: {
          agent_type?: string | null
          content: string
          created_at?: string | null
          id?: string
          is_from_bot?: boolean | null
          media_analyzed?: boolean | null
          media_type?: string | null
          media_url?: string | null
          message_type?: string | null
          processed_content?: string | null
          product_id?: string | null
          sender: string
          session_id: string
        }
        Update: {
          agent_type?: string | null
          content?: string
          created_at?: string | null
          id?: string
          is_from_bot?: boolean | null
          media_analyzed?: boolean | null
          media_type?: string | null
          media_url?: string | null
          message_type?: string | null
          processed_content?: string | null
          product_id?: string | null
          sender?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_messages_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
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
          ai_active: boolean | null
          cart: Json | null
          context: Json | null
          created_at: string | null
          customer_name: string | null
          customer_phone: string
          establishment_id: string
          id: string
          last_message_at: string | null
          pause_reason: string | null
          paused_at: string | null
          paused_by: string | null
          status: string | null
        }
        Insert: {
          ai_active?: boolean | null
          cart?: Json | null
          context?: Json | null
          created_at?: string | null
          customer_name?: string | null
          customer_phone: string
          establishment_id: string
          id?: string
          last_message_at?: string | null
          pause_reason?: string | null
          paused_at?: string | null
          paused_by?: string | null
          status?: string | null
        }
        Update: {
          ai_active?: boolean | null
          cart?: Json | null
          context?: Json | null
          created_at?: string | null
          customer_name?: string | null
          customer_phone?: string
          establishment_id?: string
          id?: string
          last_message_at?: string | null
          pause_reason?: string | null
          paused_at?: string | null
          paused_by?: string | null
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
      establishment_debt_summary: {
        Row: {
          establishment_id: string | null
          paid_amount: number | null
          paid_count: number | null
          pending_amount: number | null
          pending_count: number | null
          total_amount: number | null
        }
        Relationships: [
          {
            foreignKeyName: "establishment_commission_debt_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      accept_delivery_request: {
        Args: { p_driver_id: string; p_request_id: string }
        Returns: Json
      }
      calculate_delivery_queue_position: {
        Args: { p_driver_id: string; p_establishment_id: string }
        Returns: undefined
      }
      check_delivery_delays: { Args: never; Returns: undefined }
      count_public_establishments_by_vila: {
        Args: { p_vila_id: string }
        Returns: number
      }
      create_order: {
        Args: {
          p_change_for?: number
          p_cpf?: string
          p_customer_id?: string
          p_customer_phone?: string
          p_delivery_address?: Json
          p_delivery_fee?: number
          p_delivery_type?: string
          p_discount?: number
          p_establishment_id: string
          p_items?: Json
          p_observations?: string
          p_order_source?: string
          p_out_of_stock_action?: string
          p_payment_method?: string
          p_platform_fee?: number
          p_scheduled_for?: string
          p_subtotal?: number
          p_table_number?: string
          p_total?: number
          p_whatsapp_tracking_enabled?: boolean
        }
        Returns: Json
      }
      generate_menu_json: { Args: { est_id: string }; Returns: Json }
      get_active_region: { Args: never; Returns: Json }
      get_customer_by_phone_and_establishment: {
        Args: { p_establishment_id: string; p_phone: string }
        Returns: {
          addresses: Json
          created_at: string
          default_address: Json
          email: string
          establishment_id: string
          id: string
          name: string
          phone: string
          updated_at: string
          user_id: string
        }[]
      }
      get_customer_public_info: {
        Args: { p_customer_id: string }
        Returns: {
          created_at: string
          id: string
          masked_phone: string
          name: string
        }[]
      }
      get_driver_public_info: {
        Args: { p_driver_id: string }
        Returns: {
          id: string
          is_available: boolean
          name: string
          rating_average: number
          total_deliveries: number
          vehicle_type: string
        }[]
      }
      get_establishment_by_instance: {
        Args: { p_instance_name: string }
        Returns: {
          accepts_delivery: boolean
          accepts_pickup: boolean
          address: string
          ai_enabled: boolean
          banner_url: string
          city_id: string
          delivery_base_fee: number
          description: string
          evolution_api_key: string
          id: string
          instance_ai_prompt: string
          instance_name: string
          is_open: boolean
          latitude: number
          logo_url: string
          longitude: number
          menu_json: Json
          mercado_pago_token: string
          min_order_value: number
          name: string
          neighborhood: string
          phone: string
          pix_key: string
          slug: string
          system_prompt: string
          whatsapp: string
        }[]
      }
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
      get_public_establishments_by_segment: {
        Args: { p_limit?: number; p_segment_id: string }
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
          rating_average: number
          rating_count: number
          secondary_color: string
          segment_icon: string
          segment_id: string
          segment_name: string
          service_area: Json
          slug: string
          status: Database["public"]["Enums"]["establishment_status"]
          updated_at: string
          vila_id: string
          whatsapp: string
          zip_code: string
        }[]
      }
      get_public_establishments_filtered: {
        Args: { p_limit?: number; p_segment_ids?: string[] }
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
          rating_average: number
          rating_count: number
          secondary_color: string
          segment_icon: string
          segment_id: string
          segment_name: string
          service_area: Json
          slug: string
          status: Database["public"]["Enums"]["establishment_status"]
          updated_at: string
          vila_id: string
          whatsapp: string
          zip_code: string
        }[]
      }
      get_public_reviews: {
        Args: { p_establishment_id: string; p_limit?: number }
        Returns: {
          comment: string
          created_at: string
          customer_id: string
          delivery_rating: number
          food_rating: number
          id: string
          is_verified_purchase: boolean
          overall_rating: number
          owner_response: string
          owner_response_at: string
          photos: Json
          selected_tags: Json
          service_rating: number
        }[]
      }
      get_service_cities: {
        Args: never
        Returns: {
          center_lat: number
          center_lng: number
          id: string
          name: string
          radius_km: number
          slug: string
          state_name: string
        }[]
      }
      get_user_orders: {
        Args: never
        Returns: {
          created_at: string
          customer_id: string
          delivery_address: Json
          delivery_fee: number
          delivery_type: string
          discount: number
          establishment_id: string
          establishment_logo_url: string
          establishment_name: string
          establishment_slug: string
          estimated_time: number
          id: string
          items: Json
          observations: string
          order_number: number
          payment_method: string
          status: string
          subtotal: number
          table_number: string
          total: number
        }[]
      }
      has_establishment_permission: {
        Args: {
          p_establishment_id: string
          p_permission: string
          p_user_id: string
        }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_establishment_manager: {
        Args: { p_establishment_id: string; p_user_id: string }
        Returns: boolean
      }
      search_products: {
        Args: { p_establishment_id: string; p_search_term: string }
        Returns: {
          category_name: string
          description: string
          id: string
          image_url: string
          is_available: boolean
          name: string
          price: number
          promotional_price: number
        }[]
      }
      user_has_establishment_access: {
        Args: { p_establishment_id: string; p_user_id: string }
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
        | "driver"
      delivery_type: "delivery" | "pickup" | "table" | "other" | "turbo"
      establishment_status: "active" | "inactive" | "suspended" | "pending"
      notification_priority: "critical" | "high" | "medium" | "low"
      notification_type:
        | "new_order"
        | "order_confirmed"
        | "order_preparing"
        | "order_ready"
        | "order_out_for_delivery"
        | "order_delivered"
        | "order_cancelled"
        | "payment_received"
        | "payment_failed"
        | "low_stock"
        | "new_delivery"
        | "delivery_assigned"
        | "delivery_completed"
        | "system_alert"
        | "maintenance"
        | "new_review"
        | "new_customer"
        | "table_call"
      order_status:
        | "awaiting_payment"
        | "pending"
        | "confirmed"
        | "preparing"
        | "ready"
        | "delivering"
        | "delivered"
        | "cancelled"
        | "refunded"
        | "returned"
        | "customer_absent"
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
        "driver",
      ],
      delivery_type: ["delivery", "pickup", "table", "other", "turbo"],
      establishment_status: ["active", "inactive", "suspended", "pending"],
      notification_priority: ["critical", "high", "medium", "low"],
      notification_type: [
        "new_order",
        "order_confirmed",
        "order_preparing",
        "order_ready",
        "order_out_for_delivery",
        "order_delivered",
        "order_cancelled",
        "payment_received",
        "payment_failed",
        "low_stock",
        "new_delivery",
        "delivery_assigned",
        "delivery_completed",
        "system_alert",
        "maintenance",
        "new_review",
        "new_customer",
        "table_call",
      ],
      order_status: [
        "awaiting_payment",
        "pending",
        "confirmed",
        "preparing",
        "ready",
        "delivering",
        "delivered",
        "cancelled",
        "refunded",
        "returned",
        "customer_absent",
      ],
      payment_method: ["cash", "pix", "credit_card", "debit_card", "online"],
    },
  },
} as const
