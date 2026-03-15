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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      appointments: {
        Row: {
          appointment_date: string
          barber_id: string | null
          barbershop_id: string
          booking_source: string | null
          client_id: string | null
          created_at: string
          end_time: string
          id: string
          notes: string | null
          service_id: string | null
          start_time: string
          status: string
          total_price: number
          updated_at: string
        }
        Insert: {
          appointment_date: string
          barber_id?: string | null
          barbershop_id: string
          booking_source?: string | null
          client_id?: string | null
          created_at?: string
          end_time: string
          id?: string
          notes?: string | null
          service_id?: string | null
          start_time: string
          status?: string
          total_price?: number
          updated_at?: string
        }
        Update: {
          appointment_date?: string
          barber_id?: string | null
          barbershop_id?: string
          booking_source?: string | null
          client_id?: string | null
          created_at?: string
          end_time?: string
          id?: string
          notes?: string | null
          service_id?: string | null
          start_time?: string
          status?: string
          total_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_barber_id_fkey"
            columns: ["barber_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_barbershop_id_fkey"
            columns: ["barbershop_id"]
            isOneToOne: false
            referencedRelation: "barbershops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          id: string
          super_admin_id: string | null
          target_id: string | null
          target_type: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          id?: string
          super_admin_id?: string | null
          target_id?: string | null
          target_type?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          id?: string
          super_admin_id?: string | null
          target_id?: string | null
          target_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_super_admin_id_fkey"
            columns: ["super_admin_id"]
            isOneToOne: false
            referencedRelation: "super_admins"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_executions: {
        Row: {
          client_id: string | null
          created_at: string
          error_message: string | null
          execution_date: string
          id: string
          message_content: string | null
          rule_id: string
          status: string | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          error_message?: string | null
          execution_date?: string
          id?: string
          message_content?: string | null
          rule_id: string
          status?: string | null
        }
        Update: {
          client_id?: string | null
          created_at?: string
          error_message?: string | null
          execution_date?: string
          id?: string
          message_content?: string | null
          rule_id?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "automation_executions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automation_executions_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "automation_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_rules: {
        Row: {
          actions: Json | null
          barbershop_id: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          message_template: string | null
          name: string
          trigger_conditions: Json | null
          type: string
          updated_at: string
        }
        Insert: {
          actions?: Json | null
          barbershop_id: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          message_template?: string | null
          name: string
          trigger_conditions?: Json | null
          type: string
          updated_at?: string
        }
        Update: {
          actions?: Json | null
          barbershop_id?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          message_template?: string | null
          name?: string
          trigger_conditions?: Json | null
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "automation_rules_barbershop_id_fkey"
            columns: ["barbershop_id"]
            isOneToOne: false
            referencedRelation: "barbershops"
            referencedColumns: ["id"]
          },
        ]
      }
      barbershops: {
        Row: {
          address: string | null
          created_at: string
          created_by: string | null
          email: string | null
          id: string
          logo_url: string | null
          monthly_revenue: number | null
          name: string
          next_billing_date: string | null
          opening_hours: Json | null
          payment_status: string | null
          phone: string | null
          plan: string | null
          slug: string
          status: string
          subscription_start_date: string | null
          total_appointments: number | null
          total_users: number | null
          trial_end_date: string | null
          trial_start_date: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          logo_url?: string | null
          monthly_revenue?: number | null
          name: string
          next_billing_date?: string | null
          opening_hours?: Json | null
          payment_status?: string | null
          phone?: string | null
          plan?: string | null
          slug: string
          status?: string
          subscription_start_date?: string | null
          total_appointments?: number | null
          total_users?: number | null
          trial_end_date?: string | null
          trial_start_date?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          logo_url?: string | null
          monthly_revenue?: number | null
          name?: string
          next_billing_date?: string | null
          opening_hours?: Json | null
          payment_status?: string | null
          phone?: string | null
          plan?: string | null
          slug?: string
          status?: string
          subscription_start_date?: string | null
          total_appointments?: number | null
          total_users?: number | null
          trial_end_date?: string | null
          trial_start_date?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      cash_movements: {
        Row: {
          amount: number
          cash_register_id: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          notes: string | null
          type: string
        }
        Insert: {
          amount?: number
          cash_register_id: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          notes?: string | null
          type: string
        }
        Update: {
          amount?: number
          cash_register_id?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          notes?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "cash_movements_cash_register_id_fkey"
            columns: ["cash_register_id"]
            isOneToOne: false
            referencedRelation: "cash_registers"
            referencedColumns: ["id"]
          },
        ]
      }
      cash_register_closures: {
        Row: {
          barbershop_id: string
          cash_register_id: string
          closed_at: string | null
          closed_by: string | null
          closing_balance: number | null
          created_at: string
          discrepancy: number | null
          id: string
          notes: string | null
          opening_balance: number | null
          total_card: number | null
          total_cash: number | null
          total_multiple: number | null
          total_pix: number | null
          total_sales: number | null
        }
        Insert: {
          barbershop_id: string
          cash_register_id: string
          closed_at?: string | null
          closed_by?: string | null
          closing_balance?: number | null
          created_at?: string
          discrepancy?: number | null
          id?: string
          notes?: string | null
          opening_balance?: number | null
          total_card?: number | null
          total_cash?: number | null
          total_multiple?: number | null
          total_pix?: number | null
          total_sales?: number | null
        }
        Update: {
          barbershop_id?: string
          cash_register_id?: string
          closed_at?: string | null
          closed_by?: string | null
          closing_balance?: number | null
          created_at?: string
          discrepancy?: number | null
          id?: string
          notes?: string | null
          opening_balance?: number | null
          total_card?: number | null
          total_cash?: number | null
          total_multiple?: number | null
          total_pix?: number | null
          total_sales?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "cash_register_closures_barbershop_id_fkey"
            columns: ["barbershop_id"]
            isOneToOne: false
            referencedRelation: "barbershops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cash_register_closures_cash_register_id_fkey"
            columns: ["cash_register_id"]
            isOneToOne: false
            referencedRelation: "cash_registers"
            referencedColumns: ["id"]
          },
        ]
      }
      cash_register_items: {
        Row: {
          barber_id: string | null
          cash_register_id: string
          client_id: string | null
          commission_amount: number | null
          commission_rate: number | null
          created_at: string
          id: string
          item_type: string
          product_id: string | null
          quantity: number
          service_id: string | null
          total_price: number
          unit_price: number
          updated_at: string
        }
        Insert: {
          barber_id?: string | null
          cash_register_id: string
          client_id?: string | null
          commission_amount?: number | null
          commission_rate?: number | null
          created_at?: string
          id?: string
          item_type?: string
          product_id?: string | null
          quantity?: number
          service_id?: string | null
          total_price?: number
          unit_price?: number
          updated_at?: string
        }
        Update: {
          barber_id?: string | null
          cash_register_id?: string
          client_id?: string | null
          commission_amount?: number | null
          commission_rate?: number | null
          created_at?: string
          id?: string
          item_type?: string
          product_id?: string | null
          quantity?: number
          service_id?: string | null
          total_price?: number
          unit_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cash_register_items_barber_id_fkey"
            columns: ["barber_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cash_register_items_cash_register_id_fkey"
            columns: ["cash_register_id"]
            isOneToOne: false
            referencedRelation: "cash_registers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cash_register_items_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cash_register_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cash_register_items_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      cash_registers: {
        Row: {
          barbershop_id: string
          closed_at: string | null
          closing_balance: number | null
          created_at: string
          id: string
          notes: string | null
          opened_at: string
          opening_balance: number
          sales_count: number | null
          status: string
          total_card: number | null
          total_cash: number | null
          total_multiple: number | null
          total_pix: number | null
          total_sales: number | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          barbershop_id: string
          closed_at?: string | null
          closing_balance?: number | null
          created_at?: string
          id?: string
          notes?: string | null
          opened_at?: string
          opening_balance?: number
          sales_count?: number | null
          status?: string
          total_card?: number | null
          total_cash?: number | null
          total_multiple?: number | null
          total_pix?: number | null
          total_sales?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          barbershop_id?: string
          closed_at?: string | null
          closing_balance?: number | null
          created_at?: string
          id?: string
          notes?: string | null
          opened_at?: string
          opening_balance?: number
          sales_count?: number | null
          status?: string
          total_card?: number | null
          total_cash?: number | null
          total_multiple?: number | null
          total_pix?: number | null
          total_sales?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cash_registers_barbershop_id_fkey"
            columns: ["barbershop_id"]
            isOneToOne: false
            referencedRelation: "barbershops"
            referencedColumns: ["id"]
          },
        ]
      }
      client_subscriptions: {
        Row: {
          barbershop_id: string
          client_id: string
          created_at: string
          end_date: string | null
          id: string
          last_reset_date: string | null
          plan_id: string
          provider_id: string
          remaining_services: number | null
          start_date: string
          status: string
          updated_at: string
        }
        Insert: {
          barbershop_id: string
          client_id: string
          created_at?: string
          end_date?: string | null
          id?: string
          last_reset_date?: string | null
          plan_id: string
          provider_id: string
          remaining_services?: number | null
          start_date?: string
          status?: string
          updated_at?: string
        }
        Update: {
          barbershop_id?: string
          client_id?: string
          created_at?: string
          end_date?: string | null
          id?: string
          last_reset_date?: string | null
          plan_id?: string
          provider_id?: string
          remaining_services?: number | null
          start_date?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_subscriptions_barbershop_id_fkey"
            columns: ["barbershop_id"]
            isOneToOne: false
            referencedRelation: "barbershops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_subscriptions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "provider_subscription_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_subscriptions_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          barbershop_id: string
          birth_date: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          barbershop_id: string
          birth_date?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          barbershop_id?: string
          birth_date?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clients_barbershop_id_fkey"
            columns: ["barbershop_id"]
            isOneToOne: false
            referencedRelation: "barbershops"
            referencedColumns: ["id"]
          },
        ]
      }
      command_items: {
        Row: {
          command_id: string
          commission_amount: number | null
          commission_rate: number | null
          id: string
          item_type: string
          product_id: string | null
          quantity: number
          service_id: string | null
          total_price: number
          unit_price: number
        }
        Insert: {
          command_id: string
          commission_amount?: number | null
          commission_rate?: number | null
          id?: string
          item_type?: string
          product_id?: string | null
          quantity?: number
          service_id?: string | null
          total_price?: number
          unit_price?: number
        }
        Update: {
          command_id?: string
          commission_amount?: number | null
          commission_rate?: number | null
          id?: string
          item_type?: string
          product_id?: string | null
          quantity?: number
          service_id?: string | null
          total_price?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "command_items_command_id_fkey"
            columns: ["command_id"]
            isOneToOne: false
            referencedRelation: "commands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "command_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "command_items_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      commands: {
        Row: {
          appointment_id: string | null
          barber_id: string | null
          barbershop_id: string
          client_id: string | null
          closed_at: string | null
          command_number: string | null
          created_at: string
          id: string
          notes: string | null
          payment_method: string | null
          payment_status: string | null
          status: string
          total_amount: number
        }
        Insert: {
          appointment_id?: string | null
          barber_id?: string | null
          barbershop_id: string
          client_id?: string | null
          closed_at?: string | null
          command_number?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          payment_method?: string | null
          payment_status?: string | null
          status?: string
          total_amount?: number
        }
        Update: {
          appointment_id?: string | null
          barber_id?: string | null
          barbershop_id?: string
          client_id?: string | null
          closed_at?: string | null
          command_number?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          payment_method?: string | null
          payment_status?: string | null
          status?: string
          total_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "commands_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commands_barber_id_fkey"
            columns: ["barber_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commands_barbershop_id_fkey"
            columns: ["barbershop_id"]
            isOneToOne: false
            referencedRelation: "barbershops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commands_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      commissions: {
        Row: {
          amount: number
          barbershop_id: string
          command_id: string | null
          commission_rate: number | null
          created_at: string
          id: string
          notes: string | null
          paid_at: string | null
          provider_id: string
          sale_id: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          amount?: number
          barbershop_id: string
          command_id?: string | null
          commission_rate?: number | null
          created_at?: string
          id?: string
          notes?: string | null
          paid_at?: string | null
          provider_id: string
          sale_id?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          barbershop_id?: string
          command_id?: string | null
          commission_rate?: number | null
          created_at?: string
          id?: string
          notes?: string | null
          paid_at?: string | null
          provider_id?: string
          sale_id?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "commissions_barbershop_id_fkey"
            columns: ["barbershop_id"]
            isOneToOne: false
            referencedRelation: "barbershops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commissions_command_id_fkey"
            columns: ["command_id"]
            isOneToOne: false
            referencedRelation: "commands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commissions_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commissions_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      coupon_applicable_items: {
        Row: {
          coupon_id: string
          id: string
          item_id: string
          item_type: string
        }
        Insert: {
          coupon_id: string
          id?: string
          item_id: string
          item_type: string
        }
        Update: {
          coupon_id?: string
          id?: string
          item_id?: string
          item_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "coupon_applicable_items_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
        ]
      }
      coupon_redemptions: {
        Row: {
          client_id: string | null
          coupon_id: string
          created_at: string
          discount_applied: number
          id: string
          redeemed_at: string
          sale_id: string | null
        }
        Insert: {
          client_id?: string | null
          coupon_id: string
          created_at?: string
          discount_applied?: number
          id?: string
          redeemed_at?: string
          sale_id?: string | null
        }
        Update: {
          client_id?: string | null
          coupon_id?: string
          created_at?: string
          discount_applied?: number
          id?: string
          redeemed_at?: string
          sale_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "coupon_redemptions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupon_redemptions_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupon_redemptions_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          applies_to: string | null
          barbershop_id: string
          code: string
          created_at: string
          description: string | null
          discount_type: string
          discount_value: number
          id: string
          is_active: boolean
          max_discount_amount: number | null
          min_order_amount: number | null
          name: string
          updated_at: string
          usage_count: number | null
          usage_limit: number | null
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          applies_to?: string | null
          barbershop_id: string
          code: string
          created_at?: string
          description?: string | null
          discount_type?: string
          discount_value?: number
          id?: string
          is_active?: boolean
          max_discount_amount?: number | null
          min_order_amount?: number | null
          name: string
          updated_at?: string
          usage_count?: number | null
          usage_limit?: number | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          applies_to?: string | null
          barbershop_id?: string
          code?: string
          created_at?: string
          description?: string | null
          discount_type?: string
          discount_value?: number
          id?: string
          is_active?: boolean
          max_discount_amount?: number | null
          min_order_amount?: number | null
          name?: string
          updated_at?: string
          usage_count?: number | null
          usage_limit?: number | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "coupons_barbershop_id_fkey"
            columns: ["barbershop_id"]
            isOneToOne: false
            referencedRelation: "barbershops"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount: number
          barbershop_id: string
          category: string | null
          created_at: string
          created_by: string | null
          description: string
          due_date: string | null
          id: string
          payment_date: string | null
          payment_status: string | null
          updated_at: string
        }
        Insert: {
          amount?: number
          barbershop_id: string
          category?: string | null
          created_at?: string
          created_by?: string | null
          description: string
          due_date?: string | null
          id?: string
          payment_date?: string | null
          payment_status?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          barbershop_id?: string
          category?: string | null
          created_at?: string
          created_by?: string | null
          description?: string
          due_date?: string | null
          id?: string
          payment_date?: string | null
          payment_status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "expenses_barbershop_id_fkey"
            columns: ["barbershop_id"]
            isOneToOne: false
            referencedRelation: "barbershops"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          barbershop_id: string
          barcode: string | null
          category: string | null
          commission_rate: number | null
          commission_type: string | null
          cost_price: number | null
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean
          min_stock_alert: number | null
          name: string
          selling_price: number
          stock_quantity: number
          supplier: string | null
          updated_at: string
        }
        Insert: {
          barbershop_id: string
          barcode?: string | null
          category?: string | null
          commission_rate?: number | null
          commission_type?: string | null
          cost_price?: number | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          min_stock_alert?: number | null
          name: string
          selling_price?: number
          stock_quantity?: number
          supplier?: string | null
          updated_at?: string
        }
        Update: {
          barbershop_id?: string
          barcode?: string | null
          category?: string | null
          commission_rate?: number | null
          commission_type?: string | null
          cost_price?: number | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          min_stock_alert?: number | null
          name?: string
          selling_price?: number
          stock_quantity?: number
          supplier?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_barbershop_id_fkey"
            columns: ["barbershop_id"]
            isOneToOne: false
            referencedRelation: "barbershops"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          barbershop_id: string
          commission_rate: number | null
          created_at: string
          email: string
          full_name: string
          id: string
          is_active: boolean
          last_login_at: string | null
          phone: string | null
          role: string
          status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          barbershop_id: string
          commission_rate?: number | null
          created_at?: string
          email: string
          full_name: string
          id?: string
          is_active?: boolean
          last_login_at?: string | null
          phone?: string | null
          role?: string
          status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          barbershop_id?: string
          commission_rate?: number | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          is_active?: boolean
          last_login_at?: string | null
          phone?: string | null
          role?: string
          status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_barbershop_id_fkey"
            columns: ["barbershop_id"]
            isOneToOne: false
            referencedRelation: "barbershops"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_goals: {
        Row: {
          barbershop_id: string
          created_at: string
          created_by: string | null
          current_value: number
          goal_type: string
          id: string
          is_active: boolean
          period_end: string
          period_start: string
          provider_id: string
          specific_product_id: string | null
          specific_service_id: string | null
          target_value: number
          updated_at: string
        }
        Insert: {
          barbershop_id: string
          created_at?: string
          created_by?: string | null
          current_value?: number
          goal_type: string
          id?: string
          is_active?: boolean
          period_end: string
          period_start: string
          provider_id: string
          specific_product_id?: string | null
          specific_service_id?: string | null
          target_value?: number
          updated_at?: string
        }
        Update: {
          barbershop_id?: string
          created_at?: string
          created_by?: string | null
          current_value?: number
          goal_type?: string
          id?: string
          is_active?: boolean
          period_end?: string
          period_start?: string
          provider_id?: string
          specific_product_id?: string | null
          specific_service_id?: string | null
          target_value?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_goals_barbershop_id_fkey"
            columns: ["barbershop_id"]
            isOneToOne: false
            referencedRelation: "barbershops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_goals_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_goals_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_goals_specific_product_id_fkey"
            columns: ["specific_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_goals_specific_service_id_fkey"
            columns: ["specific_service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_services: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          price: number
          provider_id: string
          service_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          price?: number
          provider_id: string
          service_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          price?: number
          provider_id?: string
          service_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_services_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_services_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_subscription_plans: {
        Row: {
          barbershop_id: string
          commission_percentage: number | null
          created_at: string
          description: string | null
          enabled_service_ids: string[] | null
          id: string
          included_services_count: number
          is_active: boolean
          monthly_price: number
          name: string
          provider_id: string
          updated_at: string
        }
        Insert: {
          barbershop_id: string
          commission_percentage?: number | null
          created_at?: string
          description?: string | null
          enabled_service_ids?: string[] | null
          id?: string
          included_services_count?: number
          is_active?: boolean
          monthly_price?: number
          name: string
          provider_id: string
          updated_at?: string
        }
        Update: {
          barbershop_id?: string
          commission_percentage?: number | null
          created_at?: string
          description?: string | null
          enabled_service_ids?: string[] | null
          id?: string
          included_services_count?: number
          is_active?: boolean
          monthly_price?: number
          name?: string
          provider_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_subscription_plans_barbershop_id_fkey"
            columns: ["barbershop_id"]
            isOneToOne: false
            referencedRelation: "barbershops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_subscription_plans_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      public_client_reviews: {
        Row: {
          barber_id: string | null
          barbershop_id: string
          client_name: string | null
          client_phone: string | null
          created_at: string
          id: string
          nps_score: number | null
          review_text: string | null
          star_rating: number | null
          updated_at: string
        }
        Insert: {
          barber_id?: string | null
          barbershop_id: string
          client_name?: string | null
          client_phone?: string | null
          created_at?: string
          id?: string
          nps_score?: number | null
          review_text?: string | null
          star_rating?: number | null
          updated_at?: string
        }
        Update: {
          barber_id?: string | null
          barbershop_id?: string
          client_name?: string | null
          client_phone?: string | null
          created_at?: string
          id?: string
          nps_score?: number | null
          review_text?: string | null
          star_rating?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "public_client_reviews_barber_id_fkey"
            columns: ["barber_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "public_client_reviews_barbershop_id_fkey"
            columns: ["barbershop_id"]
            isOneToOne: false
            referencedRelation: "barbershops"
            referencedColumns: ["id"]
          },
        ]
      }
      sale_items: {
        Row: {
          commission_amount: number | null
          commission_rate: number | null
          created_at: string
          id: string
          item_type: string
          product_id: string | null
          quantity: number
          sale_id: string
          service_id: string | null
          total_price: number
          unit_price: number
          updated_at: string
        }
        Insert: {
          commission_amount?: number | null
          commission_rate?: number | null
          created_at?: string
          id?: string
          item_type?: string
          product_id?: string | null
          quantity?: number
          sale_id: string
          service_id?: string | null
          total_price?: number
          unit_price?: number
          updated_at?: string
        }
        Update: {
          commission_amount?: number | null
          commission_rate?: number | null
          created_at?: string
          id?: string
          item_type?: string
          product_id?: string | null
          quantity?: number
          sale_id?: string
          service_id?: string | null
          total_price?: number
          unit_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sale_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_items_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_items_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      sales: {
        Row: {
          barber_id: string | null
          barbershop_id: string
          cash_register_id: string | null
          client_id: string | null
          created_at: string
          created_by: string | null
          discount_amount: number | null
          final_amount: number
          id: string
          notes: string | null
          payment_method: string | null
          payment_status: string
          sale_date: string
          sale_time: string
          total_amount: number
          updated_at: string
        }
        Insert: {
          barber_id?: string | null
          barbershop_id: string
          cash_register_id?: string | null
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          discount_amount?: number | null
          final_amount?: number
          id?: string
          notes?: string | null
          payment_method?: string | null
          payment_status?: string
          sale_date?: string
          sale_time?: string
          total_amount?: number
          updated_at?: string
        }
        Update: {
          barber_id?: string | null
          barbershop_id?: string
          cash_register_id?: string | null
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          discount_amount?: number | null
          final_amount?: number
          id?: string
          notes?: string | null
          payment_method?: string | null
          payment_status?: string
          sale_date?: string
          sale_time?: string
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_barber_id_fkey"
            columns: ["barber_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_barbershop_id_fkey"
            columns: ["barbershop_id"]
            isOneToOne: false
            referencedRelation: "barbershops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_cash_register_id_fkey"
            columns: ["cash_register_id"]
            isOneToOne: false
            referencedRelation: "cash_registers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      schedule_blocks: {
        Row: {
          barbershop_id: string
          block_date: string | null
          created_at: string
          created_by: string | null
          days_of_week: number[] | null
          description: string | null
          end_date: string | null
          end_time: string | null
          id: string
          is_full_day: boolean | null
          provider_id: string
          recurrence_type: string | null
          start_date: string | null
          start_time: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          barbershop_id: string
          block_date?: string | null
          created_at?: string
          created_by?: string | null
          days_of_week?: number[] | null
          description?: string | null
          end_date?: string | null
          end_time?: string | null
          id?: string
          is_full_day?: boolean | null
          provider_id: string
          recurrence_type?: string | null
          start_date?: string | null
          start_time?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          barbershop_id?: string
          block_date?: string | null
          created_at?: string
          created_by?: string | null
          days_of_week?: number[] | null
          description?: string | null
          end_date?: string | null
          end_time?: string | null
          id?: string
          is_full_day?: boolean | null
          provider_id?: string
          recurrence_type?: string | null
          start_date?: string | null
          start_time?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "schedule_blocks_barbershop_id_fkey"
            columns: ["barbershop_id"]
            isOneToOne: false
            referencedRelation: "barbershops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedule_blocks_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          barbershop_id: string
          created_at: string
          description: string | null
          duration_minutes: number
          id: string
          is_active: boolean
          name: string
          price: number
          updated_at: string
        }
        Insert: {
          barbershop_id: string
          created_at?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          is_active?: boolean
          name: string
          price?: number
          updated_at?: string
        }
        Update: {
          barbershop_id?: string
          created_at?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          is_active?: boolean
          name?: string
          price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "services_barbershop_id_fkey"
            columns: ["barbershop_id"]
            isOneToOne: false
            referencedRelation: "barbershops"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_financial_records: {
        Row: {
          amount: number
          barbershop_id: string
          client_id: string | null
          commission_amount: number | null
          created_at: string
          id: string
          net_amount: number | null
          notes: string | null
          payment_date: string | null
          payment_method: string | null
          provider_id: string | null
          status: string | null
          subscription_id: string
          updated_at: string
        }
        Insert: {
          amount?: number
          barbershop_id: string
          client_id?: string | null
          commission_amount?: number | null
          created_at?: string
          id?: string
          net_amount?: number | null
          notes?: string | null
          payment_date?: string | null
          payment_method?: string | null
          provider_id?: string | null
          status?: string | null
          subscription_id: string
          updated_at?: string
        }
        Update: {
          amount?: number
          barbershop_id?: string
          client_id?: string | null
          commission_amount?: number | null
          created_at?: string
          id?: string
          net_amount?: number | null
          notes?: string | null
          payment_date?: string | null
          payment_method?: string | null
          provider_id?: string | null
          status?: string | null
          subscription_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscription_financial_records_barbershop_id_fkey"
            columns: ["barbershop_id"]
            isOneToOne: false
            referencedRelation: "barbershops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_financial_records_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_financial_records_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_financial_records_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "client_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_usage_history: {
        Row: {
          barbershop_id: string
          created_at: string
          id: string
          notes: string | null
          service_id: string | null
          subscription_id: string
          used_at: string
        }
        Insert: {
          barbershop_id: string
          created_at?: string
          id?: string
          notes?: string | null
          service_id?: string | null
          subscription_id: string
          used_at?: string
        }
        Update: {
          barbershop_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          service_id?: string | null
          subscription_id?: string
          used_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscription_usage_history_barbershop_id_fkey"
            columns: ["barbershop_id"]
            isOneToOne: false
            referencedRelation: "barbershops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_usage_history_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_usage_history_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "client_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      super_admins: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      whatsapp_automations: {
        Row: {
          barbershop_id: string
          created_at: string
          id: string
          is_active: boolean
          message_template: string | null
          name: string | null
          template_id: string | null
          trigger_conditions: Json | null
          trigger_type: string
          updated_at: string
        }
        Insert: {
          barbershop_id: string
          created_at?: string
          id?: string
          is_active?: boolean
          message_template?: string | null
          name?: string | null
          template_id?: string | null
          trigger_conditions?: Json | null
          trigger_type: string
          updated_at?: string
        }
        Update: {
          barbershop_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          message_template?: string | null
          name?: string | null
          template_id?: string | null
          trigger_conditions?: Json | null
          trigger_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_automations_barbershop_id_fkey"
            columns: ["barbershop_id"]
            isOneToOne: false
            referencedRelation: "barbershops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_automations_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_instances: {
        Row: {
          api_key: string | null
          auto_reply: boolean | null
          auto_reply_message: string | null
          barbershop_id: string
          business_name: string | null
          created_at: string
          id: string
          instance_id: string | null
          instance_name: string | null
          last_connected_at: string | null
          phone_number: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          api_key?: string | null
          auto_reply?: boolean | null
          auto_reply_message?: string | null
          barbershop_id: string
          business_name?: string | null
          created_at?: string
          id?: string
          instance_id?: string | null
          instance_name?: string | null
          last_connected_at?: string | null
          phone_number?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          api_key?: string | null
          auto_reply?: boolean | null
          auto_reply_message?: string | null
          barbershop_id?: string
          business_name?: string | null
          created_at?: string
          id?: string
          instance_id?: string | null
          instance_name?: string | null
          last_connected_at?: string | null
          phone_number?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_instances_barbershop_id_fkey"
            columns: ["barbershop_id"]
            isOneToOne: false
            referencedRelation: "barbershops"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_messages: {
        Row: {
          appointment_id: string | null
          barbershop_id: string
          client_id: string | null
          contact_name: string | null
          content: Json | null
          created_at: string
          direction: string | null
          id: string
          instance_id: string | null
          message_id: string | null
          message_type: string | null
          phone_number: string | null
          status: string | null
        }
        Insert: {
          appointment_id?: string | null
          barbershop_id: string
          client_id?: string | null
          contact_name?: string | null
          content?: Json | null
          created_at?: string
          direction?: string | null
          id?: string
          instance_id?: string | null
          message_id?: string | null
          message_type?: string | null
          phone_number?: string | null
          status?: string | null
        }
        Update: {
          appointment_id?: string | null
          barbershop_id?: string
          client_id?: string | null
          contact_name?: string | null
          content?: Json | null
          created_at?: string
          direction?: string | null
          id?: string
          instance_id?: string | null
          message_id?: string | null
          message_type?: string | null
          phone_number?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_messages_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_messages_barbershop_id_fkey"
            columns: ["barbershop_id"]
            isOneToOne: false
            referencedRelation: "barbershops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_messages_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_templates: {
        Row: {
          barbershop_id: string
          category: string | null
          content: string
          created_at: string
          id: string
          is_active: boolean | null
          name: string
          updated_at: string
          variables: string[] | null
        }
        Insert: {
          barbershop_id: string
          category?: string | null
          content: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string
          variables?: string[] | null
        }
        Update: {
          barbershop_id?: string
          category?: string | null
          content?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string
          variables?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_templates_barbershop_id_fkey"
            columns: ["barbershop_id"]
            isOneToOne: false
            referencedRelation: "barbershops"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      archive_old_data: {
        Args: { retention_months?: number }
        Returns: {
          partitions_dropped: number
          records_archived: number
          table_name: string
        }[]
      }
      cleanup_ancient_archives: {
        Args: { years_to_keep?: number }
        Returns: number
      }
      generate_command_number: {
        Args: { p_barbershop_id: string }
        Returns: string
      }
      get_archive_stats: {
        Args: never
        Returns: {
          active_records: number
          archived_records: number
          oldest_archive_date: string
          table_name: string
          total_active_size: string
          total_archive_size: string
        }[]
      }
      get_barbershop_performance_stats: {
        Args: { barbershop_uuid: string }
        Returns: {
          metric_name: string
          metric_value: number
        }[]
      }
      get_connection_stats: { Args: never; Returns: Json }
      get_financial_overview: {
        Args: never
        Returns: {
          annual_revenue: number
          monthly_revenue: number
          total_active_accounts: number
          total_cancelled_accounts: number
          total_overdue_accounts: number
          total_trial_accounts: number
        }[]
      }
      get_lock_stats: { Args: never; Returns: Json }
      get_memory_stats: { Args: never; Returns: Json }
      get_optimization_recommendations: { Args: never; Returns: Json }
      get_slow_queries: { Args: never; Returns: Json }
      set_provider_password: {
        Args: { new_password: string; provider_user_id: string }
        Returns: undefined
      }
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
