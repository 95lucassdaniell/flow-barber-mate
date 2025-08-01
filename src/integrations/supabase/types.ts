export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      appointments: {
        Row: {
          appointment_date: string
          barber_id: string
          barbershop_id: string
          booking_source: string | null
          client_id: string
          created_at: string
          end_time: string
          id: string
          notes: string | null
          service_id: string
          start_time: string
          status: string
          total_price: number
          updated_at: string
        }
        Insert: {
          appointment_date: string
          barber_id: string
          barbershop_id: string
          booking_source?: string | null
          client_id: string
          created_at?: string
          end_time: string
          id?: string
          notes?: string | null
          service_id: string
          start_time: string
          status?: string
          total_price: number
          updated_at?: string
        }
        Update: {
          appointment_date?: string
          barber_id?: string
          barbershop_id?: string
          booking_source?: string | null
          client_id?: string
          created_at?: string
          end_time?: string
          id?: string
          notes?: string | null
          service_id?: string
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
      appointments_partitioned: {
        Row: {
          appointment_date: string
          barber_id: string
          barbershop_id: string
          client_id: string
          created_at: string
          end_time: string
          id: string
          notes: string | null
          service_id: string
          start_time: string
          status: string
          total_price: number
          updated_at: string
        }
        Insert: {
          appointment_date: string
          barber_id: string
          barbershop_id: string
          client_id: string
          created_at?: string
          end_time: string
          id?: string
          notes?: string | null
          service_id: string
          start_time: string
          status?: string
          total_price: number
          updated_at?: string
        }
        Update: {
          appointment_date?: string
          barber_id?: string
          barbershop_id?: string
          client_id?: string
          created_at?: string
          end_time?: string
          id?: string
          notes?: string | null
          service_id?: string
          start_time?: string
          status?: string
          total_price?: number
          updated_at?: string
        }
        Relationships: []
      }
      appointments_partitioned_2025_01: {
        Row: {
          appointment_date: string
          barber_id: string
          barbershop_id: string
          client_id: string
          created_at: string
          end_time: string
          id: string
          notes: string | null
          service_id: string
          start_time: string
          status: string
          total_price: number
          updated_at: string
        }
        Insert: {
          appointment_date: string
          barber_id: string
          barbershop_id: string
          client_id: string
          created_at?: string
          end_time: string
          id?: string
          notes?: string | null
          service_id: string
          start_time: string
          status?: string
          total_price: number
          updated_at?: string
        }
        Update: {
          appointment_date?: string
          barber_id?: string
          barbershop_id?: string
          client_id?: string
          created_at?: string
          end_time?: string
          id?: string
          notes?: string | null
          service_id?: string
          start_time?: string
          status?: string
          total_price?: number
          updated_at?: string
        }
        Relationships: []
      }
      appointments_partitioned_2025_02: {
        Row: {
          appointment_date: string
          barber_id: string
          barbershop_id: string
          client_id: string
          created_at: string
          end_time: string
          id: string
          notes: string | null
          service_id: string
          start_time: string
          status: string
          total_price: number
          updated_at: string
        }
        Insert: {
          appointment_date: string
          barber_id: string
          barbershop_id: string
          client_id: string
          created_at?: string
          end_time: string
          id?: string
          notes?: string | null
          service_id: string
          start_time: string
          status?: string
          total_price: number
          updated_at?: string
        }
        Update: {
          appointment_date?: string
          barber_id?: string
          barbershop_id?: string
          client_id?: string
          created_at?: string
          end_time?: string
          id?: string
          notes?: string | null
          service_id?: string
          start_time?: string
          status?: string
          total_price?: number
          updated_at?: string
        }
        Relationships: []
      }
      appointments_partitioned_2025_03: {
        Row: {
          appointment_date: string
          barber_id: string
          barbershop_id: string
          client_id: string
          created_at: string
          end_time: string
          id: string
          notes: string | null
          service_id: string
          start_time: string
          status: string
          total_price: number
          updated_at: string
        }
        Insert: {
          appointment_date: string
          barber_id: string
          barbershop_id: string
          client_id: string
          created_at?: string
          end_time: string
          id?: string
          notes?: string | null
          service_id: string
          start_time: string
          status?: string
          total_price: number
          updated_at?: string
        }
        Update: {
          appointment_date?: string
          barber_id?: string
          barbershop_id?: string
          client_id?: string
          created_at?: string
          end_time?: string
          id?: string
          notes?: string | null
          service_id?: string
          start_time?: string
          status?: string
          total_price?: number
          updated_at?: string
        }
        Relationships: []
      }
      appointments_partitioned_2025_04: {
        Row: {
          appointment_date: string
          barber_id: string
          barbershop_id: string
          client_id: string
          created_at: string
          end_time: string
          id: string
          notes: string | null
          service_id: string
          start_time: string
          status: string
          total_price: number
          updated_at: string
        }
        Insert: {
          appointment_date: string
          barber_id: string
          barbershop_id: string
          client_id: string
          created_at?: string
          end_time: string
          id?: string
          notes?: string | null
          service_id: string
          start_time: string
          status?: string
          total_price: number
          updated_at?: string
        }
        Update: {
          appointment_date?: string
          barber_id?: string
          barbershop_id?: string
          client_id?: string
          created_at?: string
          end_time?: string
          id?: string
          notes?: string | null
          service_id?: string
          start_time?: string
          status?: string
          total_price?: number
          updated_at?: string
        }
        Relationships: []
      }
      appointments_partitioned_2025_05: {
        Row: {
          appointment_date: string
          barber_id: string
          barbershop_id: string
          client_id: string
          created_at: string
          end_time: string
          id: string
          notes: string | null
          service_id: string
          start_time: string
          status: string
          total_price: number
          updated_at: string
        }
        Insert: {
          appointment_date: string
          barber_id: string
          barbershop_id: string
          client_id: string
          created_at?: string
          end_time: string
          id?: string
          notes?: string | null
          service_id: string
          start_time: string
          status?: string
          total_price: number
          updated_at?: string
        }
        Update: {
          appointment_date?: string
          barber_id?: string
          barbershop_id?: string
          client_id?: string
          created_at?: string
          end_time?: string
          id?: string
          notes?: string | null
          service_id?: string
          start_time?: string
          status?: string
          total_price?: number
          updated_at?: string
        }
        Relationships: []
      }
      appointments_partitioned_2025_06: {
        Row: {
          appointment_date: string
          barber_id: string
          barbershop_id: string
          client_id: string
          created_at: string
          end_time: string
          id: string
          notes: string | null
          service_id: string
          start_time: string
          status: string
          total_price: number
          updated_at: string
        }
        Insert: {
          appointment_date: string
          barber_id: string
          barbershop_id: string
          client_id: string
          created_at?: string
          end_time: string
          id?: string
          notes?: string | null
          service_id: string
          start_time: string
          status?: string
          total_price: number
          updated_at?: string
        }
        Update: {
          appointment_date?: string
          barber_id?: string
          barbershop_id?: string
          client_id?: string
          created_at?: string
          end_time?: string
          id?: string
          notes?: string | null
          service_id?: string
          start_time?: string
          status?: string
          total_price?: number
          updated_at?: string
        }
        Relationships: []
      }
      appointments_partitioned_2025_07: {
        Row: {
          appointment_date: string
          barber_id: string
          barbershop_id: string
          client_id: string
          created_at: string
          end_time: string
          id: string
          notes: string | null
          service_id: string
          start_time: string
          status: string
          total_price: number
          updated_at: string
        }
        Insert: {
          appointment_date: string
          barber_id: string
          barbershop_id: string
          client_id: string
          created_at?: string
          end_time: string
          id?: string
          notes?: string | null
          service_id: string
          start_time: string
          status?: string
          total_price: number
          updated_at?: string
        }
        Update: {
          appointment_date?: string
          barber_id?: string
          barbershop_id?: string
          client_id?: string
          created_at?: string
          end_time?: string
          id?: string
          notes?: string | null
          service_id?: string
          start_time?: string
          status?: string
          total_price?: number
          updated_at?: string
        }
        Relationships: []
      }
      appointments_partitioned_2025_08: {
        Row: {
          appointment_date: string
          barber_id: string
          barbershop_id: string
          client_id: string
          created_at: string
          end_time: string
          id: string
          notes: string | null
          service_id: string
          start_time: string
          status: string
          total_price: number
          updated_at: string
        }
        Insert: {
          appointment_date: string
          barber_id: string
          barbershop_id: string
          client_id: string
          created_at?: string
          end_time: string
          id?: string
          notes?: string | null
          service_id: string
          start_time: string
          status?: string
          total_price: number
          updated_at?: string
        }
        Update: {
          appointment_date?: string
          barber_id?: string
          barbershop_id?: string
          client_id?: string
          created_at?: string
          end_time?: string
          id?: string
          notes?: string | null
          service_id?: string
          start_time?: string
          status?: string
          total_price?: number
          updated_at?: string
        }
        Relationships: []
      }
      appointments_partitioned_2025_09: {
        Row: {
          appointment_date: string
          barber_id: string
          barbershop_id: string
          client_id: string
          created_at: string
          end_time: string
          id: string
          notes: string | null
          service_id: string
          start_time: string
          status: string
          total_price: number
          updated_at: string
        }
        Insert: {
          appointment_date: string
          barber_id: string
          barbershop_id: string
          client_id: string
          created_at?: string
          end_time: string
          id?: string
          notes?: string | null
          service_id: string
          start_time: string
          status?: string
          total_price: number
          updated_at?: string
        }
        Update: {
          appointment_date?: string
          barber_id?: string
          barbershop_id?: string
          client_id?: string
          created_at?: string
          end_time?: string
          id?: string
          notes?: string | null
          service_id?: string
          start_time?: string
          status?: string
          total_price?: number
          updated_at?: string
        }
        Relationships: []
      }
      appointments_partitioned_2025_10: {
        Row: {
          appointment_date: string
          barber_id: string
          barbershop_id: string
          client_id: string
          created_at: string
          end_time: string
          id: string
          notes: string | null
          service_id: string
          start_time: string
          status: string
          total_price: number
          updated_at: string
        }
        Insert: {
          appointment_date: string
          barber_id: string
          barbershop_id: string
          client_id: string
          created_at?: string
          end_time: string
          id?: string
          notes?: string | null
          service_id: string
          start_time: string
          status?: string
          total_price: number
          updated_at?: string
        }
        Update: {
          appointment_date?: string
          barber_id?: string
          barbershop_id?: string
          client_id?: string
          created_at?: string
          end_time?: string
          id?: string
          notes?: string | null
          service_id?: string
          start_time?: string
          status?: string
          total_price?: number
          updated_at?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          id: string
          super_admin_id: string | null
          target_id: string | null
          target_type: string
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          id?: string
          super_admin_id?: string | null
          target_id?: string | null
          target_type: string
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          id?: string
          super_admin_id?: string | null
          target_id?: string | null
          target_type?: string
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
          client_id: string
          created_at: string
          error_message: string | null
          execution_date: string
          id: string
          message_content: string
          rule_id: string
          status: string
        }
        Insert: {
          client_id: string
          created_at?: string
          error_message?: string | null
          execution_date?: string
          id?: string
          message_content: string
          rule_id: string
          status?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          error_message?: string | null
          execution_date?: string
          id?: string
          message_content?: string
          rule_id?: string
          status?: string
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
          actions: Json
          barbershop_id: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          message_template: string
          name: string
          trigger_conditions: Json
          type: string
          updated_at: string
        }
        Insert: {
          actions?: Json
          barbershop_id: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          message_template: string
          name: string
          trigger_conditions?: Json
          type: string
          updated_at?: string
        }
        Update: {
          actions?: Json
          barbershop_id?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          message_template?: string
          name?: string
          trigger_conditions?: Json
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
          plan: string
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
          plan?: string
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
          plan?: string
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
      billing_history: {
        Row: {
          amount: number
          barbershop_id: string
          created_at: string
          currency: string | null
          description: string | null
          due_date: string
          id: string
          payment_date: string | null
          payment_method: string | null
          payment_status: string
          subscription_id: string | null
        }
        Insert: {
          amount: number
          barbershop_id: string
          created_at?: string
          currency?: string | null
          description?: string | null
          due_date: string
          id?: string
          payment_date?: string | null
          payment_method?: string | null
          payment_status?: string
          subscription_id?: string | null
        }
        Update: {
          amount?: number
          barbershop_id?: string
          created_at?: string
          currency?: string | null
          description?: string | null
          due_date?: string
          id?: string
          payment_date?: string | null
          payment_method?: string | null
          payment_status?: string
          subscription_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "billing_history_barbershop_id_fkey"
            columns: ["barbershop_id"]
            isOneToOne: false
            referencedRelation: "barbershops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_history_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      cash_movements: {
        Row: {
          amount: number
          cash_register_id: string
          created_at: string
          created_by: string
          description: string
          id: string
          notes: string | null
          type: string
          updated_at: string
        }
        Insert: {
          amount?: number
          cash_register_id: string
          created_at?: string
          created_by: string
          description: string
          id?: string
          notes?: string | null
          type: string
          updated_at?: string
        }
        Update: {
          amount?: number
          cash_register_id?: string
          created_at?: string
          created_by?: string
          description?: string
          id?: string
          notes?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cash_movements_cash_register_id_fkey"
            columns: ["cash_register_id"]
            isOneToOne: false
            referencedRelation: "cash_registers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cash_movements_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      cash_register_closures: {
        Row: {
          barbershop_id: string
          cash_register_id: string
          closed_at: string
          closed_by: string
          closing_balance: number
          discrepancy: number
          id: string
          notes: string | null
          opening_balance: number
          total_card: number
          total_cash: number
          total_multiple: number
          total_pix: number
          total_sales: number
        }
        Insert: {
          barbershop_id: string
          cash_register_id: string
          closed_at?: string
          closed_by: string
          closing_balance?: number
          discrepancy?: number
          id?: string
          notes?: string | null
          opening_balance?: number
          total_card?: number
          total_cash?: number
          total_multiple?: number
          total_pix?: number
          total_sales?: number
        }
        Update: {
          barbershop_id?: string
          cash_register_id?: string
          closed_at?: string
          closed_by?: string
          closing_balance?: number
          discrepancy?: number
          id?: string
          notes?: string | null
          opening_balance?: number
          total_card?: number
          total_cash?: number
          total_multiple?: number
          total_pix?: number
          total_sales?: number
        }
        Relationships: []
      }
      cash_register_items: {
        Row: {
          barber_id: string | null
          cash_register_id: string
          client_id: string | null
          commission_rate: number
          created_at: string
          id: string
          item_type: string
          product_id: string | null
          quantity: number
          service_id: string | null
          unit_price: number
          updated_at: string
        }
        Insert: {
          barber_id?: string | null
          cash_register_id: string
          client_id?: string | null
          commission_rate?: number
          created_at?: string
          id?: string
          item_type: string
          product_id?: string | null
          quantity?: number
          service_id?: string | null
          unit_price?: number
          updated_at?: string
        }
        Update: {
          barber_id?: string | null
          cash_register_id?: string
          client_id?: string | null
          commission_rate?: number
          created_at?: string
          id?: string
          item_type?: string
          product_id?: string | null
          quantity?: number
          service_id?: string | null
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
          sales_count: number
          status: string
          total_card: number
          total_cash: number
          total_multiple: number
          total_pix: number
          total_sales: number
          updated_at: string
          user_id: string
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
          sales_count?: number
          status?: string
          total_card?: number
          total_cash?: number
          total_multiple?: number
          total_pix?: number
          total_sales?: number
          updated_at?: string
          user_id: string
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
          sales_count?: number
          status?: string
          total_card?: number
          total_cash?: number
          total_multiple?: number
          total_pix?: number
          total_sales?: number
          updated_at?: string
          user_id?: string
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
      clients: {
        Row: {
          barbershop_id: string
          birth_date: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string
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
          phone: string
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
          phone?: string
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
          commission_amount: number
          commission_rate: number
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
          command_id: string
          commission_amount?: number
          commission_rate?: number
          created_at?: string
          id?: string
          item_type: string
          product_id?: string | null
          quantity?: number
          service_id?: string | null
          total_price?: number
          unit_price?: number
          updated_at?: string
        }
        Update: {
          command_id?: string
          commission_amount?: number
          commission_rate?: number
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
          barber_id: string
          barbershop_id: string
          client_id: string
          closed_at: string | null
          command_number: number
          created_at: string
          id: string
          notes: string | null
          payment_method: string | null
          payment_status: string | null
          status: string
          total_amount: number
          updated_at: string
        }
        Insert: {
          appointment_id?: string | null
          barber_id: string
          barbershop_id: string
          client_id: string
          closed_at?: string | null
          command_number: number
          created_at?: string
          id?: string
          notes?: string | null
          payment_method?: string | null
          payment_status?: string | null
          status?: string
          total_amount?: number
          updated_at?: string
        }
        Update: {
          appointment_id?: string | null
          barber_id?: string
          barbershop_id?: string
          client_id?: string
          closed_at?: string | null
          command_number?: number
          created_at?: string
          id?: string
          notes?: string | null
          payment_method?: string | null
          payment_status?: string | null
          status?: string
          total_amount?: number
          updated_at?: string
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
      commands_partitioned: {
        Row: {
          appointment_id: string | null
          barber_id: string
          barbershop_id: string
          client_id: string
          closed_at: string | null
          command_number: number
          created_at: string
          id: string
          notes: string | null
          payment_method: string | null
          payment_status: string | null
          status: string
          total_amount: number
          updated_at: string
        }
        Insert: {
          appointment_id?: string | null
          barber_id: string
          barbershop_id: string
          client_id: string
          closed_at?: string | null
          command_number: number
          created_at?: string
          id?: string
          notes?: string | null
          payment_method?: string | null
          payment_status?: string | null
          status?: string
          total_amount?: number
          updated_at?: string
        }
        Update: {
          appointment_id?: string | null
          barber_id?: string
          barbershop_id?: string
          client_id?: string
          closed_at?: string | null
          command_number?: number
          created_at?: string
          id?: string
          notes?: string | null
          payment_method?: string | null
          payment_status?: string | null
          status?: string
          total_amount?: number
          updated_at?: string
        }
        Relationships: []
      }
      commands_partitioned_2025_01: {
        Row: {
          appointment_id: string | null
          barber_id: string
          barbershop_id: string
          client_id: string
          closed_at: string | null
          command_number: number
          created_at: string
          id: string
          notes: string | null
          payment_method: string | null
          payment_status: string | null
          status: string
          total_amount: number
          updated_at: string
        }
        Insert: {
          appointment_id?: string | null
          barber_id: string
          barbershop_id: string
          client_id: string
          closed_at?: string | null
          command_number: number
          created_at?: string
          id?: string
          notes?: string | null
          payment_method?: string | null
          payment_status?: string | null
          status?: string
          total_amount?: number
          updated_at?: string
        }
        Update: {
          appointment_id?: string | null
          barber_id?: string
          barbershop_id?: string
          client_id?: string
          closed_at?: string | null
          command_number?: number
          created_at?: string
          id?: string
          notes?: string | null
          payment_method?: string | null
          payment_status?: string | null
          status?: string
          total_amount?: number
          updated_at?: string
        }
        Relationships: []
      }
      commands_partitioned_2025_02: {
        Row: {
          appointment_id: string | null
          barber_id: string
          barbershop_id: string
          client_id: string
          closed_at: string | null
          command_number: number
          created_at: string
          id: string
          notes: string | null
          payment_method: string | null
          payment_status: string | null
          status: string
          total_amount: number
          updated_at: string
        }
        Insert: {
          appointment_id?: string | null
          barber_id: string
          barbershop_id: string
          client_id: string
          closed_at?: string | null
          command_number: number
          created_at?: string
          id?: string
          notes?: string | null
          payment_method?: string | null
          payment_status?: string | null
          status?: string
          total_amount?: number
          updated_at?: string
        }
        Update: {
          appointment_id?: string | null
          barber_id?: string
          barbershop_id?: string
          client_id?: string
          closed_at?: string | null
          command_number?: number
          created_at?: string
          id?: string
          notes?: string | null
          payment_method?: string | null
          payment_status?: string | null
          status?: string
          total_amount?: number
          updated_at?: string
        }
        Relationships: []
      }
      commands_partitioned_2025_03: {
        Row: {
          appointment_id: string | null
          barber_id: string
          barbershop_id: string
          client_id: string
          closed_at: string | null
          command_number: number
          created_at: string
          id: string
          notes: string | null
          payment_method: string | null
          payment_status: string | null
          status: string
          total_amount: number
          updated_at: string
        }
        Insert: {
          appointment_id?: string | null
          barber_id: string
          barbershop_id: string
          client_id: string
          closed_at?: string | null
          command_number: number
          created_at?: string
          id?: string
          notes?: string | null
          payment_method?: string | null
          payment_status?: string | null
          status?: string
          total_amount?: number
          updated_at?: string
        }
        Update: {
          appointment_id?: string | null
          barber_id?: string
          barbershop_id?: string
          client_id?: string
          closed_at?: string | null
          command_number?: number
          created_at?: string
          id?: string
          notes?: string | null
          payment_method?: string | null
          payment_status?: string | null
          status?: string
          total_amount?: number
          updated_at?: string
        }
        Relationships: []
      }
      commands_partitioned_2025_04: {
        Row: {
          appointment_id: string | null
          barber_id: string
          barbershop_id: string
          client_id: string
          closed_at: string | null
          command_number: number
          created_at: string
          id: string
          notes: string | null
          payment_method: string | null
          payment_status: string | null
          status: string
          total_amount: number
          updated_at: string
        }
        Insert: {
          appointment_id?: string | null
          barber_id: string
          barbershop_id: string
          client_id: string
          closed_at?: string | null
          command_number: number
          created_at?: string
          id?: string
          notes?: string | null
          payment_method?: string | null
          payment_status?: string | null
          status?: string
          total_amount?: number
          updated_at?: string
        }
        Update: {
          appointment_id?: string | null
          barber_id?: string
          barbershop_id?: string
          client_id?: string
          closed_at?: string | null
          command_number?: number
          created_at?: string
          id?: string
          notes?: string | null
          payment_method?: string | null
          payment_status?: string | null
          status?: string
          total_amount?: number
          updated_at?: string
        }
        Relationships: []
      }
      commands_partitioned_2025_05: {
        Row: {
          appointment_id: string | null
          barber_id: string
          barbershop_id: string
          client_id: string
          closed_at: string | null
          command_number: number
          created_at: string
          id: string
          notes: string | null
          payment_method: string | null
          payment_status: string | null
          status: string
          total_amount: number
          updated_at: string
        }
        Insert: {
          appointment_id?: string | null
          barber_id: string
          barbershop_id: string
          client_id: string
          closed_at?: string | null
          command_number: number
          created_at?: string
          id?: string
          notes?: string | null
          payment_method?: string | null
          payment_status?: string | null
          status?: string
          total_amount?: number
          updated_at?: string
        }
        Update: {
          appointment_id?: string | null
          barber_id?: string
          barbershop_id?: string
          client_id?: string
          closed_at?: string | null
          command_number?: number
          created_at?: string
          id?: string
          notes?: string | null
          payment_method?: string | null
          payment_status?: string | null
          status?: string
          total_amount?: number
          updated_at?: string
        }
        Relationships: []
      }
      commands_partitioned_2025_06: {
        Row: {
          appointment_id: string | null
          barber_id: string
          barbershop_id: string
          client_id: string
          closed_at: string | null
          command_number: number
          created_at: string
          id: string
          notes: string | null
          payment_method: string | null
          payment_status: string | null
          status: string
          total_amount: number
          updated_at: string
        }
        Insert: {
          appointment_id?: string | null
          barber_id: string
          barbershop_id: string
          client_id: string
          closed_at?: string | null
          command_number: number
          created_at?: string
          id?: string
          notes?: string | null
          payment_method?: string | null
          payment_status?: string | null
          status?: string
          total_amount?: number
          updated_at?: string
        }
        Update: {
          appointment_id?: string | null
          barber_id?: string
          barbershop_id?: string
          client_id?: string
          closed_at?: string | null
          command_number?: number
          created_at?: string
          id?: string
          notes?: string | null
          payment_method?: string | null
          payment_status?: string | null
          status?: string
          total_amount?: number
          updated_at?: string
        }
        Relationships: []
      }
      commands_partitioned_2025_07: {
        Row: {
          appointment_id: string | null
          barber_id: string
          barbershop_id: string
          client_id: string
          closed_at: string | null
          command_number: number
          created_at: string
          id: string
          notes: string | null
          payment_method: string | null
          payment_status: string | null
          status: string
          total_amount: number
          updated_at: string
        }
        Insert: {
          appointment_id?: string | null
          barber_id: string
          barbershop_id: string
          client_id: string
          closed_at?: string | null
          command_number: number
          created_at?: string
          id?: string
          notes?: string | null
          payment_method?: string | null
          payment_status?: string | null
          status?: string
          total_amount?: number
          updated_at?: string
        }
        Update: {
          appointment_id?: string | null
          barber_id?: string
          barbershop_id?: string
          client_id?: string
          closed_at?: string | null
          command_number?: number
          created_at?: string
          id?: string
          notes?: string | null
          payment_method?: string | null
          payment_status?: string | null
          status?: string
          total_amount?: number
          updated_at?: string
        }
        Relationships: []
      }
      commands_partitioned_2025_08: {
        Row: {
          appointment_id: string | null
          barber_id: string
          barbershop_id: string
          client_id: string
          closed_at: string | null
          command_number: number
          created_at: string
          id: string
          notes: string | null
          payment_method: string | null
          payment_status: string | null
          status: string
          total_amount: number
          updated_at: string
        }
        Insert: {
          appointment_id?: string | null
          barber_id: string
          barbershop_id: string
          client_id: string
          closed_at?: string | null
          command_number: number
          created_at?: string
          id?: string
          notes?: string | null
          payment_method?: string | null
          payment_status?: string | null
          status?: string
          total_amount?: number
          updated_at?: string
        }
        Update: {
          appointment_id?: string | null
          barber_id?: string
          barbershop_id?: string
          client_id?: string
          closed_at?: string | null
          command_number?: number
          created_at?: string
          id?: string
          notes?: string | null
          payment_method?: string | null
          payment_status?: string | null
          status?: string
          total_amount?: number
          updated_at?: string
        }
        Relationships: []
      }
      commands_partitioned_2025_09: {
        Row: {
          appointment_id: string | null
          barber_id: string
          barbershop_id: string
          client_id: string
          closed_at: string | null
          command_number: number
          created_at: string
          id: string
          notes: string | null
          payment_method: string | null
          payment_status: string | null
          status: string
          total_amount: number
          updated_at: string
        }
        Insert: {
          appointment_id?: string | null
          barber_id: string
          barbershop_id: string
          client_id: string
          closed_at?: string | null
          command_number: number
          created_at?: string
          id?: string
          notes?: string | null
          payment_method?: string | null
          payment_status?: string | null
          status?: string
          total_amount?: number
          updated_at?: string
        }
        Update: {
          appointment_id?: string | null
          barber_id?: string
          barbershop_id?: string
          client_id?: string
          closed_at?: string | null
          command_number?: number
          created_at?: string
          id?: string
          notes?: string | null
          payment_method?: string | null
          payment_status?: string | null
          status?: string
          total_amount?: number
          updated_at?: string
        }
        Relationships: []
      }
      commands_partitioned_2025_10: {
        Row: {
          appointment_id: string | null
          barber_id: string
          barbershop_id: string
          client_id: string
          closed_at: string | null
          command_number: number
          created_at: string
          id: string
          notes: string | null
          payment_method: string | null
          payment_status: string | null
          status: string
          total_amount: number
          updated_at: string
        }
        Insert: {
          appointment_id?: string | null
          barber_id: string
          barbershop_id: string
          client_id: string
          closed_at?: string | null
          command_number: number
          created_at?: string
          id?: string
          notes?: string | null
          payment_method?: string | null
          payment_status?: string | null
          status?: string
          total_amount?: number
          updated_at?: string
        }
        Update: {
          appointment_id?: string | null
          barber_id?: string
          barbershop_id?: string
          client_id?: string
          closed_at?: string | null
          command_number?: number
          created_at?: string
          id?: string
          notes?: string | null
          payment_method?: string | null
          payment_status?: string | null
          status?: string
          total_amount?: number
          updated_at?: string
        }
        Relationships: []
      }
      commissions: {
        Row: {
          barber_id: string
          barbershop_id: string
          base_amount: number
          commission_amount: number
          commission_date: string
          commission_rate: number
          commission_type: string
          created_at: string
          id: string
          sale_id: string
          sale_item_id: string
          status: string
          updated_at: string
        }
        Insert: {
          barber_id: string
          barbershop_id: string
          base_amount?: number
          commission_amount?: number
          commission_date?: string
          commission_rate?: number
          commission_type: string
          created_at?: string
          id?: string
          sale_id: string
          sale_item_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          barber_id?: string
          barbershop_id?: string
          base_amount?: number
          commission_amount?: number
          commission_date?: string
          commission_rate?: number
          commission_type?: string
          created_at?: string
          id?: string
          sale_id?: string
          sale_item_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      expenses: {
        Row: {
          amount: number
          barbershop_id: string
          category: string
          created_at: string
          created_by: string
          description: string
          due_date: string
          id: string
          payment_date: string | null
          payment_status: string
          updated_at: string
        }
        Insert: {
          amount?: number
          barbershop_id: string
          category: string
          created_at?: string
          created_by: string
          description: string
          due_date: string
          id?: string
          payment_date?: string | null
          payment_status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          barbershop_id?: string
          category?: string
          created_at?: string
          created_by?: string
          description?: string
          due_date?: string
          id?: string
          payment_date?: string | null
          payment_status?: string
          updated_at?: string
        }
        Relationships: []
      }
      phone_verification_codes: {
        Row: {
          attempts: number
          barbershop_id: string
          code: string
          created_at: string
          expires_at: string
          id: string
          phone: string
          verified: boolean
        }
        Insert: {
          attempts?: number
          barbershop_id: string
          code: string
          created_at?: string
          expires_at: string
          id?: string
          phone: string
          verified?: boolean
        }
        Update: {
          attempts?: number
          barbershop_id?: string
          code?: string
          created_at?: string
          expires_at?: string
          id?: string
          phone?: string
          verified?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "phone_verification_codes_barbershop_id_fkey"
            columns: ["barbershop_id"]
            isOneToOne: false
            referencedRelation: "barbershops"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_features: {
        Row: {
          created_at: string
          feature_name: string
          feature_value: string | null
          id: string
          is_enabled: boolean | null
          max_limit: number | null
          plan_type: string
        }
        Insert: {
          created_at?: string
          feature_name: string
          feature_value?: string | null
          id?: string
          is_enabled?: boolean | null
          max_limit?: number | null
          plan_type: string
        }
        Update: {
          created_at?: string
          feature_name?: string
          feature_value?: string | null
          id?: string
          is_enabled?: boolean | null
          max_limit?: number | null
          plan_type?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          barbershop_id: string
          barcode: string | null
          category: string
          commission_rate: number | null
          commission_type: string | null
          cost_price: number
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean
          min_stock_alert: number
          name: string
          selling_price: number
          stock_quantity: number
          supplier: string | null
          updated_at: string
        }
        Insert: {
          barbershop_id: string
          barcode?: string | null
          category?: string
          commission_rate?: number | null
          commission_type?: string | null
          cost_price?: number
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          min_stock_alert?: number
          name: string
          selling_price?: number
          stock_quantity?: number
          supplier?: string | null
          updated_at?: string
        }
        Update: {
          barbershop_id?: string
          barcode?: string | null
          category?: string
          commission_rate?: number | null
          commission_type?: string | null
          cost_price?: number
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          min_stock_alert?: number
          name?: string
          selling_price?: number
          stock_quantity?: number
          supplier?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          barbershop_id: string
          commission_rate: number | null
          created_at: string
          email: string
          full_name: string
          id: string
          is_active: boolean | null
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
          is_active?: boolean | null
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
          is_active?: boolean | null
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
          price: number
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
      rate_limit_log: {
        Row: {
          action: string
          barbershop_id: string | null
          created_at: string | null
          id: string
          ip_address: unknown | null
          user_id: string | null
        }
        Insert: {
          action: string
          barbershop_id?: string | null
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          user_id?: string | null
        }
        Update: {
          action?: string
          barbershop_id?: string | null
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rate_limit_log_barbershop_id_fkey"
            columns: ["barbershop_id"]
            isOneToOne: false
            referencedRelation: "barbershops"
            referencedColumns: ["id"]
          },
        ]
      }
      sale_items: {
        Row: {
          commission_amount: number
          commission_rate: number
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
          commission_amount?: number
          commission_rate?: number
          created_at?: string
          id?: string
          item_type: string
          product_id?: string | null
          quantity?: number
          sale_id: string
          service_id?: string | null
          total_price?: number
          unit_price?: number
          updated_at?: string
        }
        Update: {
          commission_amount?: number
          commission_rate?: number
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
        Relationships: []
      }
      sales: {
        Row: {
          barber_id: string
          barbershop_id: string
          cash_register_id: string | null
          client_id: string
          created_at: string
          created_by: string
          discount_amount: number
          final_amount: number
          id: string
          notes: string | null
          payment_method: string
          payment_status: string
          sale_date: string
          sale_time: string
          total_amount: number
          updated_at: string
        }
        Insert: {
          barber_id: string
          barbershop_id: string
          cash_register_id?: string | null
          client_id: string
          created_at?: string
          created_by: string
          discount_amount?: number
          final_amount?: number
          id?: string
          notes?: string | null
          payment_method?: string
          payment_status?: string
          sale_date?: string
          sale_time?: string
          total_amount?: number
          updated_at?: string
        }
        Update: {
          barber_id?: string
          barbershop_id?: string
          cash_register_id?: string | null
          client_id?: string
          created_at?: string
          created_by?: string
          discount_amount?: number
          final_amount?: number
          id?: string
          notes?: string | null
          payment_method?: string
          payment_status?: string
          sale_date?: string
          sale_time?: string
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_cash_register_id_fkey"
            columns: ["cash_register_id"]
            isOneToOne: false
            referencedRelation: "cash_registers"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_partitioned: {
        Row: {
          barber_id: string
          barbershop_id: string
          cash_register_id: string | null
          client_id: string
          created_at: string
          created_by: string
          discount_amount: number
          final_amount: number
          id: string
          notes: string | null
          payment_method: string
          payment_status: string
          sale_date: string
          sale_time: string
          total_amount: number
          updated_at: string
        }
        Insert: {
          barber_id: string
          barbershop_id: string
          cash_register_id?: string | null
          client_id: string
          created_at?: string
          created_by: string
          discount_amount?: number
          final_amount?: number
          id?: string
          notes?: string | null
          payment_method?: string
          payment_status?: string
          sale_date?: string
          sale_time?: string
          total_amount?: number
          updated_at?: string
        }
        Update: {
          barber_id?: string
          barbershop_id?: string
          cash_register_id?: string | null
          client_id?: string
          created_at?: string
          created_by?: string
          discount_amount?: number
          final_amount?: number
          id?: string
          notes?: string | null
          payment_method?: string
          payment_status?: string
          sale_date?: string
          sale_time?: string
          total_amount?: number
          updated_at?: string
        }
        Relationships: []
      }
      sales_partitioned_2025_01: {
        Row: {
          barber_id: string
          barbershop_id: string
          cash_register_id: string | null
          client_id: string
          created_at: string
          created_by: string
          discount_amount: number
          final_amount: number
          id: string
          notes: string | null
          payment_method: string
          payment_status: string
          sale_date: string
          sale_time: string
          total_amount: number
          updated_at: string
        }
        Insert: {
          barber_id: string
          barbershop_id: string
          cash_register_id?: string | null
          client_id: string
          created_at?: string
          created_by: string
          discount_amount?: number
          final_amount?: number
          id?: string
          notes?: string | null
          payment_method?: string
          payment_status?: string
          sale_date?: string
          sale_time?: string
          total_amount?: number
          updated_at?: string
        }
        Update: {
          barber_id?: string
          barbershop_id?: string
          cash_register_id?: string | null
          client_id?: string
          created_at?: string
          created_by?: string
          discount_amount?: number
          final_amount?: number
          id?: string
          notes?: string | null
          payment_method?: string
          payment_status?: string
          sale_date?: string
          sale_time?: string
          total_amount?: number
          updated_at?: string
        }
        Relationships: []
      }
      sales_partitioned_2025_02: {
        Row: {
          barber_id: string
          barbershop_id: string
          cash_register_id: string | null
          client_id: string
          created_at: string
          created_by: string
          discount_amount: number
          final_amount: number
          id: string
          notes: string | null
          payment_method: string
          payment_status: string
          sale_date: string
          sale_time: string
          total_amount: number
          updated_at: string
        }
        Insert: {
          barber_id: string
          barbershop_id: string
          cash_register_id?: string | null
          client_id: string
          created_at?: string
          created_by: string
          discount_amount?: number
          final_amount?: number
          id?: string
          notes?: string | null
          payment_method?: string
          payment_status?: string
          sale_date?: string
          sale_time?: string
          total_amount?: number
          updated_at?: string
        }
        Update: {
          barber_id?: string
          barbershop_id?: string
          cash_register_id?: string | null
          client_id?: string
          created_at?: string
          created_by?: string
          discount_amount?: number
          final_amount?: number
          id?: string
          notes?: string | null
          payment_method?: string
          payment_status?: string
          sale_date?: string
          sale_time?: string
          total_amount?: number
          updated_at?: string
        }
        Relationships: []
      }
      sales_partitioned_2025_03: {
        Row: {
          barber_id: string
          barbershop_id: string
          cash_register_id: string | null
          client_id: string
          created_at: string
          created_by: string
          discount_amount: number
          final_amount: number
          id: string
          notes: string | null
          payment_method: string
          payment_status: string
          sale_date: string
          sale_time: string
          total_amount: number
          updated_at: string
        }
        Insert: {
          barber_id: string
          barbershop_id: string
          cash_register_id?: string | null
          client_id: string
          created_at?: string
          created_by: string
          discount_amount?: number
          final_amount?: number
          id?: string
          notes?: string | null
          payment_method?: string
          payment_status?: string
          sale_date?: string
          sale_time?: string
          total_amount?: number
          updated_at?: string
        }
        Update: {
          barber_id?: string
          barbershop_id?: string
          cash_register_id?: string | null
          client_id?: string
          created_at?: string
          created_by?: string
          discount_amount?: number
          final_amount?: number
          id?: string
          notes?: string | null
          payment_method?: string
          payment_status?: string
          sale_date?: string
          sale_time?: string
          total_amount?: number
          updated_at?: string
        }
        Relationships: []
      }
      sales_partitioned_2025_04: {
        Row: {
          barber_id: string
          barbershop_id: string
          cash_register_id: string | null
          client_id: string
          created_at: string
          created_by: string
          discount_amount: number
          final_amount: number
          id: string
          notes: string | null
          payment_method: string
          payment_status: string
          sale_date: string
          sale_time: string
          total_amount: number
          updated_at: string
        }
        Insert: {
          barber_id: string
          barbershop_id: string
          cash_register_id?: string | null
          client_id: string
          created_at?: string
          created_by: string
          discount_amount?: number
          final_amount?: number
          id?: string
          notes?: string | null
          payment_method?: string
          payment_status?: string
          sale_date?: string
          sale_time?: string
          total_amount?: number
          updated_at?: string
        }
        Update: {
          barber_id?: string
          barbershop_id?: string
          cash_register_id?: string | null
          client_id?: string
          created_at?: string
          created_by?: string
          discount_amount?: number
          final_amount?: number
          id?: string
          notes?: string | null
          payment_method?: string
          payment_status?: string
          sale_date?: string
          sale_time?: string
          total_amount?: number
          updated_at?: string
        }
        Relationships: []
      }
      sales_partitioned_2025_05: {
        Row: {
          barber_id: string
          barbershop_id: string
          cash_register_id: string | null
          client_id: string
          created_at: string
          created_by: string
          discount_amount: number
          final_amount: number
          id: string
          notes: string | null
          payment_method: string
          payment_status: string
          sale_date: string
          sale_time: string
          total_amount: number
          updated_at: string
        }
        Insert: {
          barber_id: string
          barbershop_id: string
          cash_register_id?: string | null
          client_id: string
          created_at?: string
          created_by: string
          discount_amount?: number
          final_amount?: number
          id?: string
          notes?: string | null
          payment_method?: string
          payment_status?: string
          sale_date?: string
          sale_time?: string
          total_amount?: number
          updated_at?: string
        }
        Update: {
          barber_id?: string
          barbershop_id?: string
          cash_register_id?: string | null
          client_id?: string
          created_at?: string
          created_by?: string
          discount_amount?: number
          final_amount?: number
          id?: string
          notes?: string | null
          payment_method?: string
          payment_status?: string
          sale_date?: string
          sale_time?: string
          total_amount?: number
          updated_at?: string
        }
        Relationships: []
      }
      sales_partitioned_2025_06: {
        Row: {
          barber_id: string
          barbershop_id: string
          cash_register_id: string | null
          client_id: string
          created_at: string
          created_by: string
          discount_amount: number
          final_amount: number
          id: string
          notes: string | null
          payment_method: string
          payment_status: string
          sale_date: string
          sale_time: string
          total_amount: number
          updated_at: string
        }
        Insert: {
          barber_id: string
          barbershop_id: string
          cash_register_id?: string | null
          client_id: string
          created_at?: string
          created_by: string
          discount_amount?: number
          final_amount?: number
          id?: string
          notes?: string | null
          payment_method?: string
          payment_status?: string
          sale_date?: string
          sale_time?: string
          total_amount?: number
          updated_at?: string
        }
        Update: {
          barber_id?: string
          barbershop_id?: string
          cash_register_id?: string | null
          client_id?: string
          created_at?: string
          created_by?: string
          discount_amount?: number
          final_amount?: number
          id?: string
          notes?: string | null
          payment_method?: string
          payment_status?: string
          sale_date?: string
          sale_time?: string
          total_amount?: number
          updated_at?: string
        }
        Relationships: []
      }
      sales_partitioned_2025_07: {
        Row: {
          barber_id: string
          barbershop_id: string
          cash_register_id: string | null
          client_id: string
          created_at: string
          created_by: string
          discount_amount: number
          final_amount: number
          id: string
          notes: string | null
          payment_method: string
          payment_status: string
          sale_date: string
          sale_time: string
          total_amount: number
          updated_at: string
        }
        Insert: {
          barber_id: string
          barbershop_id: string
          cash_register_id?: string | null
          client_id: string
          created_at?: string
          created_by: string
          discount_amount?: number
          final_amount?: number
          id?: string
          notes?: string | null
          payment_method?: string
          payment_status?: string
          sale_date?: string
          sale_time?: string
          total_amount?: number
          updated_at?: string
        }
        Update: {
          barber_id?: string
          barbershop_id?: string
          cash_register_id?: string | null
          client_id?: string
          created_at?: string
          created_by?: string
          discount_amount?: number
          final_amount?: number
          id?: string
          notes?: string | null
          payment_method?: string
          payment_status?: string
          sale_date?: string
          sale_time?: string
          total_amount?: number
          updated_at?: string
        }
        Relationships: []
      }
      sales_partitioned_2025_08: {
        Row: {
          barber_id: string
          barbershop_id: string
          cash_register_id: string | null
          client_id: string
          created_at: string
          created_by: string
          discount_amount: number
          final_amount: number
          id: string
          notes: string | null
          payment_method: string
          payment_status: string
          sale_date: string
          sale_time: string
          total_amount: number
          updated_at: string
        }
        Insert: {
          barber_id: string
          barbershop_id: string
          cash_register_id?: string | null
          client_id: string
          created_at?: string
          created_by: string
          discount_amount?: number
          final_amount?: number
          id?: string
          notes?: string | null
          payment_method?: string
          payment_status?: string
          sale_date?: string
          sale_time?: string
          total_amount?: number
          updated_at?: string
        }
        Update: {
          barber_id?: string
          barbershop_id?: string
          cash_register_id?: string | null
          client_id?: string
          created_at?: string
          created_by?: string
          discount_amount?: number
          final_amount?: number
          id?: string
          notes?: string | null
          payment_method?: string
          payment_status?: string
          sale_date?: string
          sale_time?: string
          total_amount?: number
          updated_at?: string
        }
        Relationships: []
      }
      sales_partitioned_2025_09: {
        Row: {
          barber_id: string
          barbershop_id: string
          cash_register_id: string | null
          client_id: string
          created_at: string
          created_by: string
          discount_amount: number
          final_amount: number
          id: string
          notes: string | null
          payment_method: string
          payment_status: string
          sale_date: string
          sale_time: string
          total_amount: number
          updated_at: string
        }
        Insert: {
          barber_id: string
          barbershop_id: string
          cash_register_id?: string | null
          client_id: string
          created_at?: string
          created_by: string
          discount_amount?: number
          final_amount?: number
          id?: string
          notes?: string | null
          payment_method?: string
          payment_status?: string
          sale_date?: string
          sale_time?: string
          total_amount?: number
          updated_at?: string
        }
        Update: {
          barber_id?: string
          barbershop_id?: string
          cash_register_id?: string | null
          client_id?: string
          created_at?: string
          created_by?: string
          discount_amount?: number
          final_amount?: number
          id?: string
          notes?: string | null
          payment_method?: string
          payment_status?: string
          sale_date?: string
          sale_time?: string
          total_amount?: number
          updated_at?: string
        }
        Relationships: []
      }
      sales_partitioned_2025_10: {
        Row: {
          barber_id: string
          barbershop_id: string
          cash_register_id: string | null
          client_id: string
          created_at: string
          created_by: string
          discount_amount: number
          final_amount: number
          id: string
          notes: string | null
          payment_method: string
          payment_status: string
          sale_date: string
          sale_time: string
          total_amount: number
          updated_at: string
        }
        Insert: {
          barber_id: string
          barbershop_id: string
          cash_register_id?: string | null
          client_id: string
          created_at?: string
          created_by: string
          discount_amount?: number
          final_amount?: number
          id?: string
          notes?: string | null
          payment_method?: string
          payment_status?: string
          sale_date?: string
          sale_time?: string
          total_amount?: number
          updated_at?: string
        }
        Update: {
          barber_id?: string
          barbershop_id?: string
          cash_register_id?: string | null
          client_id?: string
          created_at?: string
          created_by?: string
          discount_amount?: number
          final_amount?: number
          id?: string
          notes?: string | null
          payment_method?: string
          payment_status?: string
          sale_date?: string
          sale_time?: string
          total_amount?: number
          updated_at?: string
        }
        Relationships: []
      }
      services: {
        Row: {
          barbershop_id: string
          created_at: string
          description: string | null
          duration_minutes: number
          id: string
          is_active: boolean | null
          name: string
          updated_at: string
        }
        Insert: {
          barbershop_id: string
          created_at?: string
          description?: string | null
          duration_minutes: number
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string
        }
        Update: {
          barbershop_id?: string
          created_at?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          is_active?: boolean | null
          name?: string
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
      subscriptions: {
        Row: {
          barbershop_id: string
          created_at: string
          id: string
          monthly_revenue: number | null
          next_billing_date: string | null
          plan_type: string
          status: string
          subscription_start_date: string | null
          trial_end_date: string | null
          trial_start_date: string | null
          updated_at: string
        }
        Insert: {
          barbershop_id: string
          created_at?: string
          id?: string
          monthly_revenue?: number | null
          next_billing_date?: string | null
          plan_type?: string
          status?: string
          subscription_start_date?: string | null
          trial_end_date?: string | null
          trial_start_date?: string | null
          updated_at?: string
        }
        Update: {
          barbershop_id?: string
          created_at?: string
          id?: string
          monthly_revenue?: number | null
          next_billing_date?: string | null
          plan_type?: string
          status?: string
          subscription_start_date?: string | null
          trial_end_date?: string | null
          trial_start_date?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_barbershop_id_fkey"
            columns: ["barbershop_id"]
            isOneToOne: false
            referencedRelation: "barbershops"
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
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      whatsapp_automation_logs: {
        Row: {
          appointment_id: string | null
          automation_id: string | null
          barbershop_id: string
          created_at: string
          error_message: string | null
          id: string
          message_content: string
          phone: string
          sent_at: string | null
          status: string
        }
        Insert: {
          appointment_id?: string | null
          automation_id?: string | null
          barbershop_id: string
          created_at?: string
          error_message?: string | null
          id?: string
          message_content: string
          phone: string
          sent_at?: string | null
          status: string
        }
        Update: {
          appointment_id?: string | null
          automation_id?: string | null
          barbershop_id?: string
          created_at?: string
          error_message?: string | null
          id?: string
          message_content?: string
          phone?: string
          sent_at?: string | null
          status?: string
        }
        Relationships: []
      }
      whatsapp_automations: {
        Row: {
          barbershop_id: string
          created_at: string
          delay_minutes: number | null
          description: string | null
          id: string
          is_active: boolean
          name: string
          template_id: string
          trigger_type: string
          updated_at: string
        }
        Insert: {
          barbershop_id: string
          created_at?: string
          delay_minutes?: number | null
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          template_id: string
          trigger_type: string
          updated_at?: string
        }
        Update: {
          barbershop_id?: string
          created_at?: string
          delay_minutes?: number | null
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          template_id?: string
          trigger_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      whatsapp_instances: {
        Row: {
          api_type: string | null
          auto_created: boolean | null
          auto_reply: boolean | null
          auto_reply_message: string | null
          barbershop_id: string
          business_name: string | null
          created_at: string
          evolution_instance_name: string | null
          id: string
          instance_id: string | null
          instance_token: string | null
          last_connected_at: string | null
          notification_settings: Json | null
          phone_number: string | null
          qr_code: string | null
          status: string
          updated_at: string
          webhook_url: string | null
        }
        Insert: {
          api_type?: string | null
          auto_created?: boolean | null
          auto_reply?: boolean | null
          auto_reply_message?: string | null
          barbershop_id: string
          business_name?: string | null
          created_at?: string
          evolution_instance_name?: string | null
          id?: string
          instance_id?: string | null
          instance_token?: string | null
          last_connected_at?: string | null
          notification_settings?: Json | null
          phone_number?: string | null
          qr_code?: string | null
          status?: string
          updated_at?: string
          webhook_url?: string | null
        }
        Update: {
          api_type?: string | null
          auto_created?: boolean | null
          auto_reply?: boolean | null
          auto_reply_message?: string | null
          barbershop_id?: string
          business_name?: string | null
          created_at?: string
          evolution_instance_name?: string | null
          id?: string
          instance_id?: string | null
          instance_token?: string | null
          last_connected_at?: string | null
          notification_settings?: Json | null
          phone_number?: string | null
          qr_code?: string | null
          status?: string
          updated_at?: string
          webhook_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_instances_barbershop_id_fkey"
            columns: ["barbershop_id"]
            isOneToOne: true
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
          content: Json
          created_at: string
          direction: string
          id: string
          instance_id: string
          message_id: string | null
          message_type: string
          phone_number: string
          status: string
        }
        Insert: {
          appointment_id?: string | null
          barbershop_id: string
          client_id?: string | null
          contact_name?: string | null
          content: Json
          created_at?: string
          direction: string
          id?: string
          instance_id: string
          message_id?: string | null
          message_type?: string
          phone_number: string
          status?: string
        }
        Update: {
          appointment_id?: string | null
          barbershop_id?: string
          client_id?: string | null
          contact_name?: string | null
          content?: Json
          created_at?: string
          direction?: string
          id?: string
          instance_id?: string
          message_id?: string | null
          message_type?: string
          phone_number?: string
          status?: string
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
          {
            foreignKeyName: "whatsapp_messages_instance_id_fkey"
            columns: ["instance_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_instances"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_settings: {
        Row: {
          auto_reply: boolean
          auto_reply_message: string | null
          barbershop_id: string
          business_hours: Json | null
          business_name: string | null
          created_at: string
          id: string
          notification_settings: Json | null
          updated_at: string
        }
        Insert: {
          auto_reply?: boolean
          auto_reply_message?: string | null
          barbershop_id: string
          business_hours?: Json | null
          business_name?: string | null
          created_at?: string
          id?: string
          notification_settings?: Json | null
          updated_at?: string
        }
        Update: {
          auto_reply?: boolean
          auto_reply_message?: string | null
          barbershop_id?: string
          business_hours?: Json | null
          business_name?: string | null
          created_at?: string
          id?: string
          notification_settings?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_settings_barbershop_id_fkey"
            columns: ["barbershop_id"]
            isOneToOne: true
            referencedRelation: "barbershops"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_templates: {
        Row: {
          barbershop_id: string
          category: string
          content: string
          created_at: string
          id: string
          is_active: boolean
          name: string
          template_type: string | null
          updated_at: string
          variables: Json | null
        }
        Insert: {
          barbershop_id: string
          category?: string
          content: string
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          template_type?: string | null
          updated_at?: string
          variables?: Json | null
        }
        Update: {
          barbershop_id?: string
          category?: string
          content?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          template_type?: string | null
          updated_at?: string
          variables?: Json | null
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
          table_name: string
          records_archived: number
          partitions_dropped: number
        }[]
      }
      cleanup_ancient_archives: {
        Args: { years_to_keep?: number }
        Returns: number
      }
      create_monthly_partition: {
        Args: { table_name: string; start_date: string }
        Returns: undefined
      }
      create_super_admin: {
        Args: { user_email: string; user_full_name: string }
        Returns: string
      }
      create_super_admin_secure: {
        Args: { user_email: string; user_full_name: string }
        Returns: string
      }
      generate_command_number: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      generate_temporary_password: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_archive_stats: {
        Args: Record<PropertyKey, never>
        Returns: {
          table_name: string
          active_records: number
          archived_records: number
          total_active_size: string
          total_archive_size: string
          oldest_archive_date: string
        }[]
      }
      get_barbershop_performance_stats: {
        Args: { barbershop_uuid: string }
        Returns: {
          metric_name: string
          metric_value: number
          metric_date: string
        }[]
      }
      get_connection_stats: {
        Args: Record<PropertyKey, never>
        Returns: {
          total_connections: number
          active_connections: number
          idle_connections: number
          idle_in_transaction: number
          max_connections: number
          connection_usage_percent: number
        }[]
      }
      get_financial_overview: {
        Args: Record<PropertyKey, never>
        Returns: {
          total_active_accounts: number
          total_trial_accounts: number
          total_overdue_accounts: number
          total_cancelled_accounts: number
          monthly_revenue: number
          annual_revenue: number
        }[]
      }
      get_historical_data: {
        Args: {
          p_table_name: string
          p_barbershop_id: string
          p_start_date: string
          p_end_date?: string
        }
        Returns: {
          id: string
          barbershop_id: string
          date_field: string
          amount: number
          status: string
          source_table: string
        }[]
      }
      get_lock_stats: {
        Args: Record<PropertyKey, never>
        Returns: {
          lock_type: string
          database_name: string
          relation_name: string
          mode_lock: string
          granted: boolean
          waiting_duration: unknown
          query_text: string
        }[]
      }
      get_memory_stats: {
        Args: Record<PropertyKey, never>
        Returns: {
          shared_buffers_size: string
          effective_cache_size: string
          work_mem: string
          maintenance_work_mem: string
          buffer_hit_ratio: number
          index_hit_ratio: number
          table_hit_ratio: number
          temp_files_count: number
          temp_bytes: number
        }[]
      }
      get_optimization_recommendations: {
        Args: Record<PropertyKey, never>
        Returns: {
          category: string
          recommendation: string
          current_value: string
          recommended_value: string
          priority: string
          description: string
        }[]
      }
      get_slow_queries: {
        Args: Record<PropertyKey, never>
        Returns: {
          query_text: string
          calls: number
          total_time: number
          mean_time: number
          max_time: number
          stddev_time: number
          rows_affected: number
        }[]
      }
      get_super_admin_info: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          full_name: string
          email: string
        }[]
      }
      get_table_stats: {
        Args: Record<PropertyKey, never>
        Returns: {
          table_name: string
          row_count: number
          table_size: string
          index_size: string
        }[]
      }
      get_user_barbershop_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_vacuum_stats: {
        Args: Record<PropertyKey, never>
        Returns: {
          schema_name: string
          table_name: string
          last_vacuum: string
          last_autovacuum: string
          last_analyze: string
          last_autoanalyze: string
          vacuum_count: number
          autovacuum_count: number
          analyze_count: number
          autoanalyze_count: number
          n_dead_tup: number
          n_live_tup: number
          dead_tuple_percent: number
        }[]
      }
      is_super_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_user_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      log_security_event: {
        Args: { event_type: string; details?: Json }
        Returns: undefined
      }
      process_pending_whatsapp_configurations: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      replace_template_variables: {
        Args: { template_content: string; appointment_id: string }
        Returns: string
      }
      set_provider_password: {
        Args: { provider_id: string; new_password: string }
        Returns: boolean
      }
      update_barbershop_stats: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      validate_email: {
        Args: { email_input: string }
        Returns: boolean
      }
      validate_phone: {
        Args: { phone_input: string }
        Returns: boolean
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
