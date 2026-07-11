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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      accounts: {
        Row: {
          code: string
          created_at: string
          currency: string
          id: string
          is_active: boolean
          is_group: boolean
          name: string
          name_en: string | null
          name_fr: string | null
          notes: string | null
          organization_id: string
          parent_id: string | null
          type: Database["public"]["Enums"]["account_type"]
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          currency?: string
          id?: string
          is_active?: boolean
          is_group?: boolean
          name: string
          name_en?: string | null
          name_fr?: string | null
          notes?: string | null
          organization_id?: string
          parent_id?: string | null
          type: Database["public"]["Enums"]["account_type"]
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          currency?: string
          id?: string
          is_active?: boolean
          is_group?: boolean
          name?: string
          name_en?: string | null
          name_fr?: string | null
          notes?: string | null
          organization_id?: string
          parent_id?: string | null
          type?: Database["public"]["Enums"]["account_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "accounts_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      activity_log: {
        Row: {
          action: string
          created_at: string
          entity: string | null
          entity_id: string | null
          id: string
          meta: Json | null
          organization_id: string
          summary: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          entity?: string | null
          entity_id?: string | null
          id?: string
          meta?: Json | null
          organization_id?: string
          summary?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          entity?: string | null
          entity_id?: string | null
          id?: string
          meta?: Json | null
          organization_id?: string
          summary?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      agri_disease_images: {
        Row: {
          caption: string | null
          created_at: string
          disease_id: string
          id: string
          url: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          disease_id: string
          id?: string
          url: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          disease_id?: string
          id?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "agri_disease_images_disease_id_fkey"
            columns: ["disease_id"]
            isOneToOne: false
            referencedRelation: "agri_diseases"
            referencedColumns: ["id"]
          },
        ]
      }
      agri_diseases: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name_ar: string
          name_en: string | null
          name_fr: string | null
          organization_id: string
          prevention: string | null
          refs: Json | null
          scientific_name: string | null
          severity: number | null
          stages: Json | null
          symptoms: string | null
          type: Database["public"]["Enums"]["agri_disease_type"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name_ar: string
          name_en?: string | null
          name_fr?: string | null
          organization_id?: string
          prevention?: string | null
          refs?: Json | null
          scientific_name?: string | null
          severity?: number | null
          stages?: Json | null
          symptoms?: string | null
          type: Database["public"]["Enums"]["agri_disease_type"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name_ar?: string
          name_en?: string | null
          name_fr?: string | null
          organization_id?: string
          prevention?: string | null
          refs?: Json | null
          scientific_name?: string | null
          severity?: number | null
          stages?: Json | null
          symptoms?: string | null
          type?: Database["public"]["Enums"]["agri_disease_type"]
          updated_at?: string
        }
        Relationships: []
      }
      agri_pest_images: {
        Row: {
          caption: string | null
          created_at: string
          id: string
          pest_id: string
          url: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          id?: string
          pest_id: string
          url: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          id?: string
          pest_id?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "agri_pest_images_pest_id_fkey"
            columns: ["pest_id"]
            isOneToOne: false
            referencedRelation: "agri_pests"
            referencedColumns: ["id"]
          },
        ]
      }
      agri_pests: {
        Row: {
          created_at: string
          damage: string | null
          description: string | null
          id: string
          image_url: string | null
          life_cycle: string | null
          name_ar: string
          name_en: string | null
          name_fr: string | null
          organization_id: string
          refs: Json | null
          scientific_name: string | null
          severity: number | null
          type: Database["public"]["Enums"]["agri_pest_type"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          damage?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          life_cycle?: string | null
          name_ar: string
          name_en?: string | null
          name_fr?: string | null
          organization_id?: string
          refs?: Json | null
          scientific_name?: string | null
          severity?: number | null
          type: Database["public"]["Enums"]["agri_pest_type"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          damage?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          life_cycle?: string | null
          name_ar?: string
          name_en?: string | null
          name_fr?: string | null
          organization_id?: string
          refs?: Json | null
          scientific_name?: string | null
          severity?: number | null
          type?: Database["public"]["Enums"]["agri_pest_type"]
          updated_at?: string
        }
        Relationships: []
      }
      agri_plant_categories: {
        Row: {
          created_at: string
          icon: string | null
          id: string
          kind: Database["public"]["Enums"]["agri_plant_kind"]
          name_ar: string
          name_en: string | null
          name_fr: string | null
          organization_id: string
          parent_id: string | null
          sort: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          icon?: string | null
          id?: string
          kind: Database["public"]["Enums"]["agri_plant_kind"]
          name_ar: string
          name_en?: string | null
          name_fr?: string | null
          organization_id?: string
          parent_id?: string | null
          sort?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          icon?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["agri_plant_kind"]
          name_ar?: string
          name_en?: string | null
          name_fr?: string | null
          organization_id?: string
          parent_id?: string | null
          sort?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agri_plant_categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "agri_plant_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      agri_plant_diseases: {
        Row: {
          disease_id: string
          plant_id: string
        }
        Insert: {
          disease_id: string
          plant_id: string
        }
        Update: {
          disease_id?: string
          plant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agri_plant_diseases_disease_id_fkey"
            columns: ["disease_id"]
            isOneToOne: false
            referencedRelation: "agri_diseases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agri_plant_diseases_plant_id_fkey"
            columns: ["plant_id"]
            isOneToOne: false
            referencedRelation: "agri_plants"
            referencedColumns: ["id"]
          },
        ]
      }
      agri_plant_pests: {
        Row: {
          pest_id: string
          plant_id: string
        }
        Insert: {
          pest_id: string
          plant_id: string
        }
        Update: {
          pest_id?: string
          plant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agri_plant_pests_pest_id_fkey"
            columns: ["pest_id"]
            isOneToOne: false
            referencedRelation: "agri_pests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agri_plant_pests_plant_id_fkey"
            columns: ["plant_id"]
            isOneToOne: false
            referencedRelation: "agri_plants"
            referencedColumns: ["id"]
          },
        ]
      }
      agri_plant_varieties: {
        Row: {
          created_at: string
          id: string
          name: string
          notes: string | null
          organization_id: string
          plant_id: string
          traits: Json | null
          updated_at: string
          yield: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          notes?: string | null
          organization_id?: string
          plant_id: string
          traits?: Json | null
          updated_at?: string
          yield?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          notes?: string | null
          organization_id?: string
          plant_id?: string
          traits?: Json | null
          updated_at?: string
          yield?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agri_plant_varieties_plant_id_fkey"
            columns: ["plant_id"]
            isOneToOne: false
            referencedRelation: "agri_plants"
            referencedColumns: ["id"]
          },
        ]
      }
      agri_plants: {
        Row: {
          category_id: string | null
          climate: string | null
          common_name_ar: string
          common_name_en: string | null
          common_name_fr: string | null
          created_at: string
          cycle: string | null
          description: string | null
          family: string | null
          growth_stages: Json | null
          id: string
          image_url: string | null
          is_active: boolean
          organization_id: string
          scientific_name: string | null
          season: string | null
          soil: string | null
          updated_at: string
          water_needs: string | null
        }
        Insert: {
          category_id?: string | null
          climate?: string | null
          common_name_ar: string
          common_name_en?: string | null
          common_name_fr?: string | null
          created_at?: string
          cycle?: string | null
          description?: string | null
          family?: string | null
          growth_stages?: Json | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          organization_id?: string
          scientific_name?: string | null
          season?: string | null
          soil?: string | null
          updated_at?: string
          water_needs?: string | null
        }
        Update: {
          category_id?: string | null
          climate?: string | null
          common_name_ar?: string
          common_name_en?: string | null
          common_name_fr?: string | null
          created_at?: string
          cycle?: string | null
          description?: string | null
          family?: string | null
          growth_stages?: Json | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          organization_id?: string
          scientific_name?: string | null
          season?: string | null
          soil?: string | null
          updated_at?: string
          water_needs?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agri_plants_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "agri_plant_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      agri_treatment_products: {
        Row: {
          product_id: string
          treatment_id: string
        }
        Insert: {
          product_id: string
          treatment_id: string
        }
        Update: {
          product_id?: string
          treatment_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agri_treatment_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agri_treatment_products_treatment_id_fkey"
            columns: ["treatment_id"]
            isOneToOne: false
            referencedRelation: "agri_treatments"
            referencedColumns: ["id"]
          },
        ]
      }
      agri_treatments: {
        Row: {
          active_ingredient: string | null
          created_at: string
          description: string | null
          dosage: string | null
          frequency: string | null
          id: string
          method: Database["public"]["Enums"]["agri_treatment_method"]
          notes: string | null
          organization_id: string
          safety_period: string | null
          target_id: string | null
          target_type: Database["public"]["Enums"]["agri_treatment_target"]
          title: string
          updated_at: string
        }
        Insert: {
          active_ingredient?: string | null
          created_at?: string
          description?: string | null
          dosage?: string | null
          frequency?: string | null
          id?: string
          method: Database["public"]["Enums"]["agri_treatment_method"]
          notes?: string | null
          organization_id?: string
          safety_period?: string | null
          target_id?: string | null
          target_type: Database["public"]["Enums"]["agri_treatment_target"]
          title: string
          updated_at?: string
        }
        Update: {
          active_ingredient?: string | null
          created_at?: string
          description?: string | null
          dosage?: string | null
          frequency?: string | null
          id?: string
          method?: Database["public"]["Enums"]["agri_treatment_method"]
          notes?: string | null
          organization_id?: string
          safety_period?: string | null
          target_id?: string | null
          target_type?: Database["public"]["Enums"]["agri_treatment_target"]
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      app_settings: {
        Row: {
          company_address: string | null
          company_email: string | null
          company_name: string | null
          company_phone: string | null
          company_tax_id: string | null
          currency: string
          currency_symbol: string
          default_tax_rate: number
          id: number
          invoice_footer: string | null
          invoice_prefix: string
          invoice_terms: string | null
          logo_url: string | null
          organization_id: string
          print_paper: string
          updated_at: string
        }
        Insert: {
          company_address?: string | null
          company_email?: string | null
          company_name?: string | null
          company_phone?: string | null
          company_tax_id?: string | null
          currency?: string
          currency_symbol?: string
          default_tax_rate?: number
          id?: number
          invoice_footer?: string | null
          invoice_prefix?: string
          invoice_terms?: string | null
          logo_url?: string | null
          organization_id?: string
          print_paper?: string
          updated_at?: string
        }
        Update: {
          company_address?: string | null
          company_email?: string | null
          company_name?: string | null
          company_phone?: string | null
          company_tax_id?: string | null
          currency?: string
          currency_symbol?: string
          default_tax_rate?: number
          id?: number
          invoice_footer?: string | null
          invoice_prefix?: string
          invoice_terms?: string | null
          logo_url?: string | null
          organization_id?: string
          print_paper?: string
          updated_at?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          entity: string | null
          entity_id: string | null
          id: string
          ip: string | null
          meta: Json | null
          organization_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          entity?: string | null
          entity_id?: string | null
          id?: string
          ip?: string | null
          meta?: Json | null
          organization_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          entity?: string | null
          entity_id?: string | null
          id?: string
          ip?: string | null
          meta?: Json | null
          organization_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      auth_attempts: {
        Row: {
          created_at: string
          id: string
          ip: string | null
          success: boolean
          username: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          ip?: string | null
          success?: boolean
          username?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          ip?: string | null
          success?: boolean
          username?: string | null
        }
        Relationships: []
      }
      bank_accounts: {
        Row: {
          account_id: string | null
          account_number: string | null
          balance: number
          bank_name: string
          created_at: string
          currency: string
          iban: string | null
          id: string
          is_active: boolean
          name: string
          notes: string | null
          opening_balance: number
          organization_id: string
          rib: string | null
          swift: string | null
          updated_at: string
        }
        Insert: {
          account_id?: string | null
          account_number?: string | null
          balance?: number
          bank_name: string
          created_at?: string
          currency?: string
          iban?: string | null
          id?: string
          is_active?: boolean
          name: string
          notes?: string | null
          opening_balance?: number
          organization_id?: string
          rib?: string | null
          swift?: string | null
          updated_at?: string
        }
        Update: {
          account_id?: string | null
          account_number?: string | null
          balance?: number
          bank_name?: string
          created_at?: string
          currency?: string
          iban?: string | null
          id?: string
          is_active?: boolean
          name?: string
          notes?: string | null
          opening_balance?: number
          organization_id?: string
          rib?: string | null
          swift?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bank_accounts_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      bank_transactions: {
        Row: {
          amount: number
          bank_id: string
          counter_bank_id: string | null
          created_at: string
          description: string | null
          direction: Database["public"]["Enums"]["receipt_direction"]
          id: string
          organization_id: string
          reconciled: boolean
          reconciled_at: string | null
          reference: string | null
          tx_date: string
          tx_type: Database["public"]["Enums"]["bank_tx_type"]
          user_id: string | null
          value_date: string | null
        }
        Insert: {
          amount: number
          bank_id: string
          counter_bank_id?: string | null
          created_at?: string
          description?: string | null
          direction: Database["public"]["Enums"]["receipt_direction"]
          id?: string
          organization_id?: string
          reconciled?: boolean
          reconciled_at?: string | null
          reference?: string | null
          tx_date?: string
          tx_type: Database["public"]["Enums"]["bank_tx_type"]
          user_id?: string | null
          value_date?: string | null
        }
        Update: {
          amount?: number
          bank_id?: string
          counter_bank_id?: string | null
          created_at?: string
          description?: string | null
          direction?: Database["public"]["Enums"]["receipt_direction"]
          id?: string
          organization_id?: string
          reconciled?: boolean
          reconciled_at?: string | null
          reference?: string | null
          tx_date?: string
          tx_type?: Database["public"]["Enums"]["bank_tx_type"]
          user_id?: string | null
          value_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bank_transactions_bank_id_fkey"
            columns: ["bank_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bank_transactions_counter_bank_id_fkey"
            columns: ["counter_bank_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      branch_members: {
        Row: {
          branch_id: string
          created_at: string
          id: string
          organization_id: string
          role: Database["public"]["Enums"]["app_role"] | null
          user_id: string
        }
        Insert: {
          branch_id: string
          created_at?: string
          id?: string
          organization_id?: string
          role?: Database["public"]["Enums"]["app_role"] | null
          user_id: string
        }
        Update: {
          branch_id?: string
          created_at?: string
          id?: string
          organization_id?: string
          role?: Database["public"]["Enums"]["app_role"] | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "branch_members_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "branch_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      branches: {
        Row: {
          address: string | null
          city: string | null
          code: string | null
          created_at: string
          email: string | null
          id: string
          is_active: boolean
          is_archived: boolean
          manager_id: string | null
          name: string
          name_ar: string | null
          notes: string | null
          organization_id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          code?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          is_archived?: boolean
          manager_id?: string | null
          name: string
          name_ar?: string | null
          notes?: string | null
          organization_id?: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          city?: string | null
          code?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          is_archived?: boolean
          manager_id?: string | null
          name?: string
          name_ar?: string | null
          notes?: string | null
          organization_id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "branches_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      cash_boxes: {
        Row: {
          account_id: string | null
          balance: number
          branch_id: string | null
          code: string | null
          created_at: string
          currency: string
          id: string
          is_active: boolean
          name: string
          notes: string | null
          organization_id: string
          updated_at: string
        }
        Insert: {
          account_id?: string | null
          balance?: number
          branch_id?: string | null
          code?: string | null
          created_at?: string
          currency?: string
          id?: string
          is_active?: boolean
          name: string
          notes?: string | null
          organization_id?: string
          updated_at?: string
        }
        Update: {
          account_id?: string | null
          balance?: number
          branch_id?: string | null
          code?: string | null
          created_at?: string
          currency?: string
          id?: string
          is_active?: boolean
          name?: string
          notes?: string | null
          organization_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cash_boxes_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cash_boxes_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      cash_movements: {
        Row: {
          amount: number
          box_id: string
          counter_box_id: string | null
          created_at: string
          direction: Database["public"]["Enums"]["receipt_direction"]
          id: string
          organization_id: string
          reason: string | null
          reference: string | null
          tx_date: string
          user_id: string | null
        }
        Insert: {
          amount: number
          box_id: string
          counter_box_id?: string | null
          created_at?: string
          direction: Database["public"]["Enums"]["receipt_direction"]
          id?: string
          organization_id?: string
          reason?: string | null
          reference?: string | null
          tx_date?: string
          user_id?: string | null
        }
        Update: {
          amount?: number
          box_id?: string
          counter_box_id?: string | null
          created_at?: string
          direction?: Database["public"]["Enums"]["receipt_direction"]
          id?: string
          organization_id?: string
          reason?: string | null
          reference?: string | null
          tx_date?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cash_movements_box_id_fkey"
            columns: ["box_id"]
            isOneToOne: false
            referencedRelation: "cash_boxes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cash_movements_counter_box_id_fkey"
            columns: ["counter_box_id"]
            isOneToOne: false
            referencedRelation: "cash_boxes"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          color: string | null
          created_at: string
          icon: string | null
          id: string
          name: string
          name_ar: string | null
          organization_id: string
          parent_id: string | null
          slug: string | null
          sort_order: number
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          name: string
          name_ar?: string | null
          organization_id?: string
          parent_id?: string | null
          slug?: string | null
          sort_order?: number
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          name?: string
          name_ar?: string | null
          organization_id?: string
          parent_id?: string | null
          slug?: string | null
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      checks: {
        Row: {
          amount: number
          bank_id: string | null
          bank_name: string | null
          check_no: string
          created_at: string
          direction: Database["public"]["Enums"]["check_direction"]
          due_date: string | null
          id: string
          issue_date: string
          notes: string | null
          organization_id: string
          party_id: string | null
          party_name: string | null
          party_type: Database["public"]["Enums"]["party_type"] | null
          status: Database["public"]["Enums"]["check_status"]
          status_date: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          amount: number
          bank_id?: string | null
          bank_name?: string | null
          check_no: string
          created_at?: string
          direction: Database["public"]["Enums"]["check_direction"]
          due_date?: string | null
          id?: string
          issue_date?: string
          notes?: string | null
          organization_id?: string
          party_id?: string | null
          party_name?: string | null
          party_type?: Database["public"]["Enums"]["party_type"] | null
          status?: Database["public"]["Enums"]["check_status"]
          status_date?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          amount?: number
          bank_id?: string | null
          bank_name?: string | null
          check_no?: string
          created_at?: string
          direction?: Database["public"]["Enums"]["check_direction"]
          due_date?: string | null
          id?: string
          issue_date?: string
          notes?: string | null
          organization_id?: string
          party_id?: string | null
          party_name?: string | null
          party_type?: Database["public"]["Enums"]["party_type"] | null
          status?: Database["public"]["Enums"]["check_status"]
          status_date?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "checks_bank_id_fkey"
            columns: ["bank_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      coupon_redemptions: {
        Row: {
          coupon_id: string
          customer_id: string | null
          discount_amount: number
          id: string
          organization_id: string
          redeemed_at: string
          sale_id: string | null
        }
        Insert: {
          coupon_id: string
          customer_id?: string | null
          discount_amount?: number
          id?: string
          organization_id?: string
          redeemed_at?: string
          sale_id?: string | null
        }
        Update: {
          coupon_id?: string
          customer_id?: string | null
          discount_amount?: number
          id?: string
          organization_id?: string
          redeemed_at?: string
          sale_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "coupon_redemptions_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupon_redemptions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          code: string
          created_at: string
          description: string | null
          discount_type: Database["public"]["Enums"]["discount_type"]
          id: string
          is_active: boolean
          min_total: number | null
          organization_id: string
          per_customer_limit: number | null
          updated_at: string
          usage_limit: number | null
          used_count: number
          valid_from: string | null
          valid_to: string | null
          value: number
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          discount_type?: Database["public"]["Enums"]["discount_type"]
          id?: string
          is_active?: boolean
          min_total?: number | null
          organization_id?: string
          per_customer_limit?: number | null
          updated_at?: string
          usage_limit?: number | null
          used_count?: number
          valid_from?: string | null
          valid_to?: string | null
          value?: number
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          discount_type?: Database["public"]["Enums"]["discount_type"]
          id?: string
          is_active?: boolean
          min_total?: number | null
          organization_id?: string
          per_customer_limit?: number | null
          updated_at?: string
          usage_limit?: number | null
          used_count?: number
          valid_from?: string | null
          valid_to?: string | null
          value?: number
        }
        Relationships: []
      }
      customers: {
        Row: {
          activity_type: string | null
          address: string | null
          balance: number
          city: string | null
          created_at: string
          created_by: string | null
          credit_limit: number
          crops: string[] | null
          customer_type: Database["public"]["Enums"]["customer_type"]
          email: string | null
          farm_area: number | null
          id: string
          is_active: boolean
          loyalty_points: number
          name: string
          notes: string | null
          organization_id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          activity_type?: string | null
          address?: string | null
          balance?: number
          city?: string | null
          created_at?: string
          created_by?: string | null
          credit_limit?: number
          crops?: string[] | null
          customer_type?: Database["public"]["Enums"]["customer_type"]
          email?: string | null
          farm_area?: number | null
          id?: string
          is_active?: boolean
          loyalty_points?: number
          name: string
          notes?: string | null
          organization_id?: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          activity_type?: string | null
          address?: string | null
          balance?: number
          city?: string | null
          created_at?: string
          created_by?: string | null
          credit_limit?: number
          crops?: string[] | null
          customer_type?: Database["public"]["Enums"]["customer_type"]
          email?: string | null
          farm_area?: number | null
          id?: string
          is_active?: boolean
          loyalty_points?: number
          name?: string
          notes?: string | null
          organization_id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      fiscal_periods: {
        Row: {
          closed: boolean
          closed_at: string | null
          closed_by: string | null
          created_at: string
          end_date: string
          id: string
          name: string
          organization_id: string
          start_date: string
          updated_at: string
        }
        Insert: {
          closed?: boolean
          closed_at?: string | null
          closed_by?: string | null
          created_at?: string
          end_date: string
          id?: string
          name: string
          organization_id?: string
          start_date: string
          updated_at?: string
        }
        Update: {
          closed?: boolean
          closed_at?: string | null
          closed_by?: string | null
          created_at?: string
          end_date?: string
          id?: string
          name?: string
          organization_id?: string
          start_date?: string
          updated_at?: string
        }
        Relationships: []
      }
      fleet_drivers: {
        Row: {
          created_at: string
          employee_id: string | null
          full_name: string
          id: string
          license_expiry: string | null
          license_no: string | null
          notes: string | null
          organization_id: string
          phone: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          employee_id?: string | null
          full_name: string
          id?: string
          license_expiry?: string | null
          license_no?: string | null
          notes?: string | null
          organization_id?: string
          phone?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          employee_id?: string | null
          full_name?: string
          id?: string
          license_expiry?: string | null
          license_no?: string | null
          notes?: string | null
          organization_id?: string
          phone?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fleet_drivers_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "hr_employees"
            referencedColumns: ["id"]
          },
        ]
      }
      fleet_fuel_logs: {
        Row: {
          created_at: string
          date: string
          driver_id: string | null
          id: string
          liters: number
          notes: string | null
          odometer: number | null
          organization_id: string
          price_per_liter: number
          station: string | null
          total_cost: number
          updated_at: string
          vehicle_id: string
        }
        Insert: {
          created_at?: string
          date?: string
          driver_id?: string | null
          id?: string
          liters?: number
          notes?: string | null
          odometer?: number | null
          organization_id?: string
          price_per_liter?: number
          station?: string | null
          total_cost?: number
          updated_at?: string
          vehicle_id: string
        }
        Update: {
          created_at?: string
          date?: string
          driver_id?: string | null
          id?: string
          liters?: number
          notes?: string | null
          odometer?: number | null
          organization_id?: string
          price_per_liter?: number
          station?: string | null
          total_cost?: number
          updated_at?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fleet_fuel_logs_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "fleet_drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fleet_fuel_logs_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "fleet_vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      fleet_gps_positions: {
        Row: {
          created_at: string
          heading: number | null
          id: string
          lat: number
          lng: number
          organization_id: string
          ping_at: string
          speed: number | null
          vehicle_id: string
        }
        Insert: {
          created_at?: string
          heading?: number | null
          id?: string
          lat: number
          lng: number
          organization_id?: string
          ping_at?: string
          speed?: number | null
          vehicle_id: string
        }
        Update: {
          created_at?: string
          heading?: number | null
          id?: string
          lat?: number
          lng?: number
          organization_id?: string
          ping_at?: string
          speed?: number | null
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fleet_gps_positions_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "fleet_vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      fleet_maintenance: {
        Row: {
          cost: number
          created_at: string
          date: string
          description: string | null
          id: string
          mtype: string
          next_service_date: string | null
          next_service_odometer: number | null
          notes: string | null
          odometer: number | null
          organization_id: string
          status: string
          updated_at: string
          vehicle_id: string
          vendor: string | null
        }
        Insert: {
          cost?: number
          created_at?: string
          date?: string
          description?: string | null
          id?: string
          mtype?: string
          next_service_date?: string | null
          next_service_odometer?: number | null
          notes?: string | null
          odometer?: number | null
          organization_id?: string
          status?: string
          updated_at?: string
          vehicle_id: string
          vendor?: string | null
        }
        Update: {
          cost?: number
          created_at?: string
          date?: string
          description?: string | null
          id?: string
          mtype?: string
          next_service_date?: string | null
          next_service_odometer?: number | null
          notes?: string | null
          odometer?: number | null
          organization_id?: string
          status?: string
          updated_at?: string
          vehicle_id?: string
          vendor?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fleet_maintenance_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "fleet_vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      fleet_trips: {
        Row: {
          cost: number
          created_at: string
          distance: number
          driver_id: string | null
          end_odometer: number | null
          end_time: string | null
          from_location: string | null
          id: string
          notes: string | null
          organization_id: string
          purpose: string | null
          start_odometer: number | null
          start_time: string | null
          status: string
          to_location: string | null
          trip_date: string
          updated_at: string
          vehicle_id: string
        }
        Insert: {
          cost?: number
          created_at?: string
          distance?: number
          driver_id?: string | null
          end_odometer?: number | null
          end_time?: string | null
          from_location?: string | null
          id?: string
          notes?: string | null
          organization_id?: string
          purpose?: string | null
          start_odometer?: number | null
          start_time?: string | null
          status?: string
          to_location?: string | null
          trip_date?: string
          updated_at?: string
          vehicle_id: string
        }
        Update: {
          cost?: number
          created_at?: string
          distance?: number
          driver_id?: string | null
          end_odometer?: number | null
          end_time?: string | null
          from_location?: string | null
          id?: string
          notes?: string | null
          organization_id?: string
          purpose?: string | null
          start_odometer?: number | null
          start_time?: string | null
          status?: string
          to_location?: string | null
          trip_date?: string
          updated_at?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fleet_trips_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "fleet_drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fleet_trips_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "fleet_vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      fleet_vehicles: {
        Row: {
          branch_id: string | null
          color: string | null
          created_at: string
          fuel_type: string | null
          gps_device_id: string | null
          id: string
          insurance_expiry: string | null
          last_lat: number | null
          last_lng: number | null
          last_ping_at: string | null
          last_speed: number | null
          license_expiry: string | null
          make: string | null
          model: string | null
          name: string | null
          notes: string | null
          odometer: number
          organization_id: string
          plate: string
          status: string
          updated_at: string
          vin: string | null
          vtype: string
          year: number | null
        }
        Insert: {
          branch_id?: string | null
          color?: string | null
          created_at?: string
          fuel_type?: string | null
          gps_device_id?: string | null
          id?: string
          insurance_expiry?: string | null
          last_lat?: number | null
          last_lng?: number | null
          last_ping_at?: string | null
          last_speed?: number | null
          license_expiry?: string | null
          make?: string | null
          model?: string | null
          name?: string | null
          notes?: string | null
          odometer?: number
          organization_id?: string
          plate: string
          status?: string
          updated_at?: string
          vin?: string | null
          vtype?: string
          year?: number | null
        }
        Update: {
          branch_id?: string | null
          color?: string | null
          created_at?: string
          fuel_type?: string | null
          gps_device_id?: string | null
          id?: string
          insurance_expiry?: string | null
          last_lat?: number | null
          last_lng?: number | null
          last_ping_at?: string | null
          last_speed?: number | null
          license_expiry?: string | null
          make?: string | null
          model?: string | null
          name?: string | null
          notes?: string | null
          odometer?: number
          organization_id?: string
          plate?: string
          status?: string
          updated_at?: string
          vin?: string | null
          vtype?: string
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fleet_vehicles_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      hr_attendance: {
        Row: {
          check_in: string | null
          check_out: string | null
          created_at: string
          date: string
          employee_id: string
          hours: number | null
          id: string
          notes: string | null
          organization_id: string
          overtime: number
          status: string
          updated_at: string
        }
        Insert: {
          check_in?: string | null
          check_out?: string | null
          created_at?: string
          date?: string
          employee_id: string
          hours?: number | null
          id?: string
          notes?: string | null
          organization_id?: string
          overtime?: number
          status?: string
          updated_at?: string
        }
        Update: {
          check_in?: string | null
          check_out?: string | null
          created_at?: string
          date?: string
          employee_id?: string
          hours?: number | null
          id?: string
          notes?: string | null
          organization_id?: string
          overtime?: number
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hr_attendance_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "hr_employees"
            referencedColumns: ["id"]
          },
        ]
      }
      hr_bonuses: {
        Row: {
          amount: number
          created_at: string
          date: string
          employee_id: string
          id: string
          organization_id: string
          reason: string | null
          type: string
          updated_at: string
        }
        Insert: {
          amount?: number
          created_at?: string
          date?: string
          employee_id: string
          id?: string
          organization_id?: string
          reason?: string | null
          type?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          date?: string
          employee_id?: string
          id?: string
          organization_id?: string
          reason?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hr_bonuses_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "hr_employees"
            referencedColumns: ["id"]
          },
        ]
      }
      hr_departments: {
        Row: {
          code: string | null
          created_at: string
          id: string
          manager_id: string | null
          name: string
          notes: string | null
          organization_id: string
          updated_at: string
        }
        Insert: {
          code?: string | null
          created_at?: string
          id?: string
          manager_id?: string | null
          name: string
          notes?: string | null
          organization_id?: string
          updated_at?: string
        }
        Update: {
          code?: string | null
          created_at?: string
          id?: string
          manager_id?: string | null
          name?: string
          notes?: string | null
          organization_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      hr_documents: {
        Row: {
          created_at: string
          doc_type: string | null
          employee_id: string
          expiry_date: string | null
          file_url: string | null
          id: string
          notes: string | null
          organization_id: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          doc_type?: string | null
          employee_id: string
          expiry_date?: string | null
          file_url?: string | null
          id?: string
          notes?: string | null
          organization_id?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          doc_type?: string | null
          employee_id?: string
          expiry_date?: string | null
          file_url?: string | null
          id?: string
          notes?: string | null
          organization_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hr_documents_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "hr_employees"
            referencedColumns: ["id"]
          },
        ]
      }
      hr_employees: {
        Row: {
          address: string | null
          bank_account: string | null
          base_salary: number
          birth_date: string | null
          branch_id: string | null
          code: string | null
          created_at: string
          department_id: string | null
          email: string | null
          end_date: string | null
          full_name: string
          gender: string | null
          hire_date: string
          id: string
          national_id: string | null
          notes: string | null
          organization_id: string
          phone: string | null
          photo_url: string | null
          position_id: string | null
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          address?: string | null
          bank_account?: string | null
          base_salary?: number
          birth_date?: string | null
          branch_id?: string | null
          code?: string | null
          created_at?: string
          department_id?: string | null
          email?: string | null
          end_date?: string | null
          full_name: string
          gender?: string | null
          hire_date?: string
          id?: string
          national_id?: string | null
          notes?: string | null
          organization_id?: string
          phone?: string | null
          photo_url?: string | null
          position_id?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          address?: string | null
          bank_account?: string | null
          base_salary?: number
          birth_date?: string | null
          branch_id?: string | null
          code?: string | null
          created_at?: string
          department_id?: string | null
          email?: string | null
          end_date?: string | null
          full_name?: string
          gender?: string | null
          hire_date?: string
          id?: string
          national_id?: string | null
          notes?: string | null
          organization_id?: string
          phone?: string | null
          photo_url?: string | null
          position_id?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hr_employees_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hr_employees_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "hr_departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hr_employees_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "hr_positions"
            referencedColumns: ["id"]
          },
        ]
      }
      hr_leaves: {
        Row: {
          approved_by: string | null
          created_at: string
          days: number
          employee_id: string
          from_date: string
          id: string
          leave_type: string
          organization_id: string
          reason: string | null
          status: string
          to_date: string
          updated_at: string
        }
        Insert: {
          approved_by?: string | null
          created_at?: string
          days?: number
          employee_id: string
          from_date: string
          id?: string
          leave_type?: string
          organization_id?: string
          reason?: string | null
          status?: string
          to_date: string
          updated_at?: string
        }
        Update: {
          approved_by?: string | null
          created_at?: string
          days?: number
          employee_id?: string
          from_date?: string
          id?: string
          leave_type?: string
          organization_id?: string
          reason?: string | null
          status?: string
          to_date?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hr_leaves_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "hr_employees"
            referencedColumns: ["id"]
          },
        ]
      }
      hr_payroll: {
        Row: {
          advances: number
          allowances: number
          base_salary: number
          bonuses: number
          created_at: string
          deductions: number
          employee_id: string
          id: string
          net_pay: number
          notes: string | null
          organization_id: string
          overtime: number
          paid_at: string | null
          period_month: number
          period_year: number
          social: number
          status: string
          tax: number
          updated_at: string
        }
        Insert: {
          advances?: number
          allowances?: number
          base_salary?: number
          bonuses?: number
          created_at?: string
          deductions?: number
          employee_id: string
          id?: string
          net_pay?: number
          notes?: string | null
          organization_id?: string
          overtime?: number
          paid_at?: string | null
          period_month: number
          period_year: number
          social?: number
          status?: string
          tax?: number
          updated_at?: string
        }
        Update: {
          advances?: number
          allowances?: number
          base_salary?: number
          bonuses?: number
          created_at?: string
          deductions?: number
          employee_id?: string
          id?: string
          net_pay?: number
          notes?: string | null
          organization_id?: string
          overtime?: number
          paid_at?: string | null
          period_month?: number
          period_year?: number
          social?: number
          status?: string
          tax?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hr_payroll_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "hr_employees"
            referencedColumns: ["id"]
          },
        ]
      }
      hr_positions: {
        Row: {
          base_salary: number
          created_at: string
          department_id: string | null
          id: string
          notes: string | null
          organization_id: string
          title: string
          updated_at: string
        }
        Insert: {
          base_salary?: number
          created_at?: string
          department_id?: string | null
          id?: string
          notes?: string | null
          organization_id?: string
          title: string
          updated_at?: string
        }
        Update: {
          base_salary?: number
          created_at?: string
          department_id?: string | null
          id?: string
          notes?: string | null
          organization_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hr_positions_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "hr_departments"
            referencedColumns: ["id"]
          },
        ]
      }
      journal_entries: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          entry_date: string
          entry_no: string
          id: string
          organization_id: string
          period_id: string | null
          reference: string | null
          source_id: string | null
          source_type: string | null
          status: Database["public"]["Enums"]["journal_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          entry_date?: string
          entry_no?: string
          id?: string
          organization_id?: string
          period_id?: string | null
          reference?: string | null
          source_id?: string | null
          source_type?: string | null
          status?: Database["public"]["Enums"]["journal_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          entry_date?: string
          entry_no?: string
          id?: string
          organization_id?: string
          period_id?: string | null
          reference?: string | null
          source_id?: string | null
          source_type?: string | null
          status?: Database["public"]["Enums"]["journal_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "journal_entries_period_id_fkey"
            columns: ["period_id"]
            isOneToOne: false
            referencedRelation: "fiscal_periods"
            referencedColumns: ["id"]
          },
        ]
      }
      journal_lines: {
        Row: {
          account_id: string
          created_at: string
          credit: number
          debit: number
          description: string | null
          entry_id: string
          id: string
          line_no: number
          organization_id: string
          partner_id: string | null
          partner_type: string | null
        }
        Insert: {
          account_id: string
          created_at?: string
          credit?: number
          debit?: number
          description?: string | null
          entry_id: string
          id?: string
          line_no?: number
          organization_id?: string
          partner_id?: string | null
          partner_type?: string | null
        }
        Update: {
          account_id?: string
          created_at?: string
          credit?: number
          debit?: number
          description?: string | null
          entry_id?: string
          id?: string
          line_no?: number
          organization_id?: string
          partner_id?: string | null
          partner_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "journal_lines_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journal_lines_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      licenses: {
        Row: {
          created_at: string
          created_by: string | null
          expires_at: string | null
          id: string
          is_trial: boolean
          license_key: string
          notes: string | null
          organization_id: string
          plan_id: string | null
          starts_at: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          is_trial?: boolean
          license_key: string
          notes?: string | null
          organization_id: string
          plan_id?: string | null
          starts_at?: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          is_trial?: boolean
          license_key?: string
          notes?: string | null
          organization_id?: string
          plan_id?: string | null
          starts_at?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "licenses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "licenses_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      loyalty_rules: {
        Row: {
          amount_unit: number
          created_at: string
          id: string
          is_active: boolean
          min_redeem_points: number
          name: string
          organization_id: string
          points_per_amount: number
          redemption_value: number
          updated_at: string
        }
        Insert: {
          amount_unit?: number
          created_at?: string
          id?: string
          is_active?: boolean
          min_redeem_points?: number
          name: string
          organization_id?: string
          points_per_amount?: number
          redemption_value?: number
          updated_at?: string
        }
        Update: {
          amount_unit?: number
          created_at?: string
          id?: string
          is_active?: boolean
          min_redeem_points?: number
          name?: string
          organization_id?: string
          points_per_amount?: number
          redemption_value?: number
          updated_at?: string
        }
        Relationships: []
      }
      loyalty_transactions: {
        Row: {
          created_at: string
          customer_id: string
          id: string
          organization_id: string
          points: number
          reason: string | null
          sale_id: string | null
        }
        Insert: {
          created_at?: string
          customer_id: string
          id?: string
          organization_id?: string
          points: number
          reason?: string | null
          sale_id?: string | null
        }
        Update: {
          created_at?: string
          customer_id?: string
          id?: string
          organization_id?: string
          points?: number
          reason?: string | null
          sale_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_transactions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          link: string | null
          organization_id: string
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          organization_id?: string
          read?: boolean
          title: string
          type?: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          organization_id?: string
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      organization_members: {
        Row: {
          created_at: string
          id: string
          organization_id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id: string
          role?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          address: string | null
          created_at: string
          email: string | null
          id: string
          logo_url: string | null
          name: string
          owner_user_id: string | null
          phone: string | null
          slug: string
          status: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          email?: string | null
          id?: string
          logo_url?: string | null
          name: string
          owner_user_id?: string | null
          phone?: string | null
          slug: string
          status?: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          email?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          owner_user_id?: string | null
          phone?: string | null
          slug?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      password_resets: {
        Row: {
          channel: string
          code_hash: string
          created_at: string
          expires_at: string
          id: string
          used_at: string | null
          user_id: string
        }
        Insert: {
          channel: string
          code_hash: string
          created_at?: string
          expires_at: string
          id?: string
          used_at?: string | null
          user_id: string
        }
        Update: {
          channel?: string
          code_hash?: string
          created_at?: string
          expires_at?: string
          id?: string
          used_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      permissions: {
        Row: {
          category: string | null
          key: string
          label: string
          label_ar: string | null
          label_fr: string | null
        }
        Insert: {
          category?: string | null
          key: string
          label: string
          label_ar?: string | null
          label_fr?: string | null
        }
        Update: {
          category?: string | null
          key?: string
          label?: string
          label_ar?: string | null
          label_fr?: string | null
        }
        Relationships: []
      }
      plans: {
        Row: {
          code: string
          created_at: string
          currency: string
          description: string | null
          features: Json
          id: string
          is_active: boolean
          max_users: number | null
          name: string
          price_monthly: number
          price_yearly: number
          sort_order: number
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          currency?: string
          description?: string | null
          features?: Json
          id?: string
          is_active?: boolean
          max_users?: number | null
          name: string
          price_monthly?: number
          price_yearly?: number
          sort_order?: number
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          currency?: string
          description?: string | null
          features?: Json
          id?: string
          is_active?: boolean
          max_users?: number | null
          name?: string
          price_monthly?: number
          price_yearly?: number
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      price_list_items: {
        Row: {
          category_id: string | null
          created_at: string
          discount_percent: number
          id: string
          min_qty: number
          organization_id: string
          price_list_id: string
          product_id: string | null
          unit_price: number
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          discount_percent?: number
          id?: string
          min_qty?: number
          organization_id?: string
          price_list_id: string
          product_id?: string | null
          unit_price?: number
        }
        Update: {
          category_id?: string | null
          created_at?: string
          discount_percent?: number
          id?: string
          min_qty?: number
          organization_id?: string
          price_list_id?: string
          product_id?: string | null
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "price_list_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "price_list_items_price_list_id_fkey"
            columns: ["price_list_id"]
            isOneToOne: false
            referencedRelation: "price_lists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "price_list_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      price_lists: {
        Row: {
          created_at: string
          customer_type: Database["public"]["Enums"]["customer_type"] | null
          description: string | null
          id: string
          is_active: boolean
          name: string
          organization_id: string
          updated_at: string
          valid_from: string | null
          valid_to: string | null
        }
        Insert: {
          created_at?: string
          customer_type?: Database["public"]["Enums"]["customer_type"] | null
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          organization_id?: string
          updated_at?: string
          valid_from?: string | null
          valid_to?: string | null
        }
        Update: {
          created_at?: string
          customer_type?: Database["public"]["Enums"]["customer_type"] | null
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          organization_id?: string
          updated_at?: string
          valid_from?: string | null
          valid_to?: string | null
        }
        Relationships: []
      }
      product_batches: {
        Row: {
          batch_number: string | null
          created_at: string
          expiry_date: string | null
          id: string
          notes: string | null
          organization_id: string
          product_id: string
          production_date: string | null
          quantity: number
          updated_at: string
        }
        Insert: {
          batch_number?: string | null
          created_at?: string
          expiry_date?: string | null
          id?: string
          notes?: string | null
          organization_id?: string
          product_id: string
          production_date?: string | null
          quantity?: number
          updated_at?: string
        }
        Update: {
          batch_number?: string | null
          created_at?: string
          expiry_date?: string | null
          id?: string
          notes?: string | null
          organization_id?: string
          product_id?: string
          production_date?: string | null
          quantity?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_batches_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_documents: {
        Row: {
          created_at: string
          doc_type: string
          id: string
          organization_id: string
          product_id: string
          storage_path: string | null
          title: string
          url: string
        }
        Insert: {
          created_at?: string
          doc_type?: string
          id?: string
          organization_id?: string
          product_id: string
          storage_path?: string | null
          title: string
          url: string
        }
        Update: {
          created_at?: string
          doc_type?: string
          id?: string
          organization_id?: string
          product_id?: string
          storage_path?: string | null
          title?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_documents_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_images: {
        Row: {
          created_at: string
          id: string
          is_primary: boolean
          organization_id: string
          product_id: string
          sort_order: number
          storage_path: string | null
          url: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_primary?: boolean
          organization_id?: string
          product_id: string
          sort_order?: number
          storage_path?: string | null
          url: string
        }
        Update: {
          created_at?: string
          id?: string
          is_primary?: boolean
          organization_id?: string
          product_id?: string
          sort_order?: number
          storage_path?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_locations: {
        Row: {
          bin_id: string
          created_at: string
          id: string
          organization_id: string
          product_id: string
          quantity: number
          updated_at: string
        }
        Insert: {
          bin_id: string
          created_at?: string
          id?: string
          organization_id?: string
          product_id: string
          quantity?: number
          updated_at?: string
        }
        Update: {
          bin_id?: string
          created_at?: string
          id?: string
          organization_id?: string
          product_id?: string
          quantity?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_locations_bin_id_fkey"
            columns: ["bin_id"]
            isOneToOne: false
            referencedRelation: "warehouse_bins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_locations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          active_ingredient: string | null
          barcode: string | null
          brand: string | null
          category_id: string | null
          concentration: string | null
          created_at: string
          created_by: string | null
          currency: string
          description: string | null
          formulation: string | null
          id: string
          manufacturer: string | null
          min_stock_alert: number
          name: string
          name_ar: string | null
          notes: string | null
          organization_id: string
          origin_country: string | null
          primary_image_url: string | null
          purchase_price: number
          qr_code: string | null
          registration_number: string | null
          scientific_name: string | null
          selling_price: number
          sku: string | null
          status: string
          stock_quantity: number
          supplier_id: string | null
          trade_name: string | null
          unit: string
          updated_at: string
          volume: number | null
          weight: number | null
        }
        Insert: {
          active_ingredient?: string | null
          barcode?: string | null
          brand?: string | null
          category_id?: string | null
          concentration?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          description?: string | null
          formulation?: string | null
          id?: string
          manufacturer?: string | null
          min_stock_alert?: number
          name: string
          name_ar?: string | null
          notes?: string | null
          organization_id?: string
          origin_country?: string | null
          primary_image_url?: string | null
          purchase_price?: number
          qr_code?: string | null
          registration_number?: string | null
          scientific_name?: string | null
          selling_price?: number
          sku?: string | null
          status?: string
          stock_quantity?: number
          supplier_id?: string | null
          trade_name?: string | null
          unit?: string
          updated_at?: string
          volume?: number | null
          weight?: number | null
        }
        Update: {
          active_ingredient?: string | null
          barcode?: string | null
          brand?: string | null
          category_id?: string | null
          concentration?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          description?: string | null
          formulation?: string | null
          id?: string
          manufacturer?: string | null
          min_stock_alert?: number
          name?: string
          name_ar?: string | null
          notes?: string | null
          organization_id?: string
          origin_country?: string | null
          primary_image_url?: string | null
          purchase_price?: number
          qr_code?: string | null
          registration_number?: string | null
          scientific_name?: string | null
          selling_price?: number
          sku?: string | null
          status?: string
          stock_quantity?: number
          supplier_id?: string | null
          trade_name?: string | null
          unit?: string
          updated_at?: string
          volume?: number | null
          weight?: number | null
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
            foreignKeyName: "products_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email_optional: string | null
          full_name: string | null
          id: string
          is_active: boolean
          is_archived: boolean
          phone: string | null
          preferred_language: string
          updated_at: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email_optional?: string | null
          full_name?: string | null
          id: string
          is_active?: boolean
          is_archived?: boolean
          phone?: string | null
          preferred_language?: string
          updated_at?: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email_optional?: string | null
          full_name?: string | null
          id?: string
          is_active?: boolean
          is_archived?: boolean
          phone?: string | null
          preferred_language?: string
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      purchase_order_items: {
        Row: {
          created_at: string
          id: string
          organization_id: string
          po_id: string
          product_id: string
          qty: number
          received_qty: number
          tax: number
          total: number
          unit_cost: number
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id?: string
          po_id: string
          product_id: string
          qty?: number
          received_qty?: number
          tax?: number
          total?: number
          unit_cost?: number
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string
          po_id?: string
          product_id?: string
          qty?: number
          received_qty?: number
          tax?: number
          total?: number
          unit_cost?: number
        }
        Relationships: [
          {
            foreignKeyName: "purchase_order_items_po_id_fkey"
            columns: ["po_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_orders: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          branch_id: string | null
          created_at: string
          created_by: string | null
          discount: number
          expected_date: string | null
          id: string
          notes: string | null
          order_date: string
          organization_id: string
          po_no: string
          status: Database["public"]["Enums"]["po_status"]
          subtotal: number
          supplier_id: string | null
          tax: number
          total: number
          updated_at: string
          warehouse_id: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          branch_id?: string | null
          created_at?: string
          created_by?: string | null
          discount?: number
          expected_date?: string | null
          id?: string
          notes?: string | null
          order_date?: string
          organization_id?: string
          po_no?: string
          status?: Database["public"]["Enums"]["po_status"]
          subtotal?: number
          supplier_id?: string | null
          tax?: number
          total?: number
          updated_at?: string
          warehouse_id?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          branch_id?: string | null
          created_at?: string
          created_by?: string | null
          discount?: number
          expected_date?: string | null
          id?: string
          notes?: string | null
          order_date?: string
          organization_id?: string
          po_no?: string
          status?: Database["public"]["Enums"]["po_status"]
          subtotal?: number
          supplier_id?: string | null
          tax?: number
          total?: number
          updated_at?: string
          warehouse_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "purchase_orders_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_receipt_items: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          organization_id: string
          product_id: string
          qty: number
          quality_ok: boolean
          receipt_id: string
          unit_cost: number
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          organization_id?: string
          product_id: string
          qty?: number
          quality_ok?: boolean
          receipt_id: string
          unit_cost?: number
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          organization_id?: string
          product_id?: string
          qty?: number
          quality_ok?: boolean
          receipt_id?: string
          unit_cost?: number
        }
        Relationships: [
          {
            foreignKeyName: "purchase_receipt_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_receipt_items_receipt_id_fkey"
            columns: ["receipt_id"]
            isOneToOne: false
            referencedRelation: "purchase_receipts"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_receipts: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          organization_id: string
          po_id: string | null
          received_at: string
          received_by: string | null
          supplier_id: string | null
          updated_at: string
          warehouse_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          organization_id?: string
          po_id?: string | null
          received_at?: string
          received_by?: string | null
          supplier_id?: string | null
          updated_at?: string
          warehouse_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          organization_id?: string
          po_id?: string | null
          received_at?: string
          received_by?: string | null
          supplier_id?: string | null
          updated_at?: string
          warehouse_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "purchase_receipts_po_id_fkey"
            columns: ["po_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_receipts_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_receipts_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      receipts: {
        Row: {
          amount: number
          created_at: string
          created_by: string | null
          direction: Database["public"]["Enums"]["receipt_direction"]
          id: string
          method: Database["public"]["Enums"]["payment_method"]
          notes: string | null
          organization_id: string
          party_id: string
          party_type: Database["public"]["Enums"]["party_type"]
          receipt_no: string
          received_at: string
          reference: string | null
          updated_at: string
        }
        Insert: {
          amount?: number
          created_at?: string
          created_by?: string | null
          direction: Database["public"]["Enums"]["receipt_direction"]
          id?: string
          method?: Database["public"]["Enums"]["payment_method"]
          notes?: string | null
          organization_id?: string
          party_id: string
          party_type: Database["public"]["Enums"]["party_type"]
          receipt_no?: string
          received_at?: string
          reference?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string | null
          direction?: Database["public"]["Enums"]["receipt_direction"]
          id?: string
          method?: Database["public"]["Enums"]["payment_method"]
          notes?: string | null
          organization_id?: string
          party_id?: string
          party_type?: Database["public"]["Enums"]["party_type"]
          receipt_no?: string
          received_at?: string
          reference?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      role_permissions: {
        Row: {
          permission_key: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          permission_key: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          permission_key?: string
          role?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_permission_key_fkey"
            columns: ["permission_key"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["key"]
          },
        ]
      }
      sale_installments: {
        Row: {
          amount: number
          created_at: string
          due_date: string
          id: string
          organization_id: string
          paid_amount: number
          sale_id: string
          status: string
        }
        Insert: {
          amount?: number
          created_at?: string
          due_date: string
          id?: string
          organization_id?: string
          paid_amount?: number
          sale_id: string
          status?: string
        }
        Update: {
          amount?: number
          created_at?: string
          due_date?: string
          id?: string
          organization_id?: string
          paid_amount?: number
          sale_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "sale_installments_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      sale_items: {
        Row: {
          cost_snapshot: number | null
          created_at: string
          discount: number
          id: string
          organization_id: string
          product_id: string
          qty: number
          sale_id: string
          tax: number
          total: number
          unit_price: number
        }
        Insert: {
          cost_snapshot?: number | null
          created_at?: string
          discount?: number
          id?: string
          organization_id?: string
          product_id: string
          qty?: number
          sale_id: string
          tax?: number
          total?: number
          unit_price?: number
        }
        Update: {
          cost_snapshot?: number | null
          created_at?: string
          discount?: number
          id?: string
          organization_id?: string
          product_id?: string
          qty?: number
          sale_id?: string
          tax?: number
          total?: number
          unit_price?: number
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
        ]
      }
      sale_payments: {
        Row: {
          amount: number
          id: string
          method: Database["public"]["Enums"]["payment_method"]
          notes: string | null
          organization_id: string
          paid_at: string
          reference: string | null
          sale_id: string
          user_id: string | null
        }
        Insert: {
          amount?: number
          id?: string
          method?: Database["public"]["Enums"]["payment_method"]
          notes?: string | null
          organization_id?: string
          paid_at?: string
          reference?: string | null
          sale_id: string
          user_id?: string | null
        }
        Update: {
          amount?: number
          id?: string
          method?: Database["public"]["Enums"]["payment_method"]
          notes?: string | null
          organization_id?: string
          paid_at?: string
          reference?: string | null
          sale_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sale_payments_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      sales: {
        Row: {
          balance: number
          branch_id: string | null
          cashier_id: string | null
          coupon_id: string | null
          created_at: string
          customer_id: string | null
          discount: number
          id: string
          invoice_no: string
          meta: Json
          notes: string | null
          organization_id: string
          paid: number
          parent_sale_id: string | null
          payment_method: Database["public"]["Enums"]["payment_method"] | null
          sales_rep_id: string | null
          status: Database["public"]["Enums"]["sale_status"]
          subtotal: number
          tax: number
          total: number
          type: Database["public"]["Enums"]["sale_type"]
          updated_at: string
          warehouse_id: string | null
        }
        Insert: {
          balance?: number
          branch_id?: string | null
          cashier_id?: string | null
          coupon_id?: string | null
          created_at?: string
          customer_id?: string | null
          discount?: number
          id?: string
          invoice_no?: string
          meta?: Json
          notes?: string | null
          organization_id?: string
          paid?: number
          parent_sale_id?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          sales_rep_id?: string | null
          status?: Database["public"]["Enums"]["sale_status"]
          subtotal?: number
          tax?: number
          total?: number
          type?: Database["public"]["Enums"]["sale_type"]
          updated_at?: string
          warehouse_id?: string | null
        }
        Update: {
          balance?: number
          branch_id?: string | null
          cashier_id?: string | null
          coupon_id?: string | null
          created_at?: string
          customer_id?: string | null
          discount?: number
          id?: string
          invoice_no?: string
          meta?: Json
          notes?: string | null
          organization_id?: string
          paid?: number
          parent_sale_id?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          sales_rep_id?: string | null
          status?: Database["public"]["Enums"]["sale_status"]
          subtotal?: number
          tax?: number
          total?: number
          type?: Database["public"]["Enums"]["sale_type"]
          updated_at?: string
          warehouse_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sales_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_parent_sale_id_fkey"
            columns: ["parent_sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_sales_rep_id_fkey"
            columns: ["sales_rep_id"]
            isOneToOne: false
            referencedRelation: "sales_reps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_commissions: {
        Row: {
          achievement_pct: number
          commission_amount: number
          commission_rate: number
          created_at: string
          id: string
          notes: string | null
          organization_id: string
          paid_at: string | null
          period_month: number
          period_year: number
          rep_id: string
          sales_total: number
          status: string
          target: number
          updated_at: string
        }
        Insert: {
          achievement_pct?: number
          commission_amount?: number
          commission_rate?: number
          created_at?: string
          id?: string
          notes?: string | null
          organization_id?: string
          paid_at?: string | null
          period_month: number
          period_year: number
          rep_id: string
          sales_total?: number
          status?: string
          target?: number
          updated_at?: string
        }
        Update: {
          achievement_pct?: number
          commission_amount?: number
          commission_rate?: number
          created_at?: string
          id?: string
          notes?: string | null
          organization_id?: string
          paid_at?: string | null
          period_month?: number
          period_year?: number
          rep_id?: string
          sales_total?: number
          status?: string
          target?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_commissions_rep_id_fkey"
            columns: ["rep_id"]
            isOneToOne: false
            referencedRelation: "sales_reps"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_reps: {
        Row: {
          branch_id: string | null
          code: string | null
          commission_rate: number
          created_at: string
          email: string | null
          employee_id: string | null
          full_name: string
          id: string
          monthly_target: number
          notes: string | null
          organization_id: string
          phone: string | null
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          branch_id?: string | null
          code?: string | null
          commission_rate?: number
          created_at?: string
          email?: string | null
          employee_id?: string | null
          full_name: string
          id?: string
          monthly_target?: number
          notes?: string | null
          organization_id?: string
          phone?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          branch_id?: string | null
          code?: string | null
          commission_rate?: number
          created_at?: string
          email?: string | null
          employee_id?: string | null
          full_name?: string
          id?: string
          monthly_target?: number
          notes?: string | null
          organization_id?: string
          phone?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sales_reps_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_reps_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "hr_employees"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_visits: {
        Row: {
          created_at: string
          customer_id: string | null
          id: string
          latitude: number | null
          longitude: number | null
          next_action_date: string | null
          notes: string | null
          organization_id: string
          outcome: string
          rep_id: string
          updated_at: string
          visit_date: string
          visit_type: string
        }
        Insert: {
          created_at?: string
          customer_id?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          next_action_date?: string | null
          notes?: string | null
          organization_id?: string
          outcome?: string
          rep_id: string
          updated_at?: string
          visit_date?: string
          visit_type?: string
        }
        Update: {
          created_at?: string
          customer_id?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          next_action_date?: string | null
          notes?: string | null
          organization_id?: string
          outcome?: string
          rep_id?: string
          updated_at?: string
          visit_date?: string
          visit_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_visits_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_visits_rep_id_fkey"
            columns: ["rep_id"]
            isOneToOne: false
            referencedRelation: "sales_reps"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_movements: {
        Row: {
          batch_id: string | null
          created_at: string
          from_bin_id: string | null
          from_warehouse_id: string | null
          id: string
          organization_id: string
          product_id: string
          quantity: number
          reason: string | null
          reference: string | null
          to_bin_id: string | null
          to_warehouse_id: string | null
          type: Database["public"]["Enums"]["stock_movement_type"]
          user_id: string | null
        }
        Insert: {
          batch_id?: string | null
          created_at?: string
          from_bin_id?: string | null
          from_warehouse_id?: string | null
          id?: string
          organization_id?: string
          product_id: string
          quantity: number
          reason?: string | null
          reference?: string | null
          to_bin_id?: string | null
          to_warehouse_id?: string | null
          type: Database["public"]["Enums"]["stock_movement_type"]
          user_id?: string | null
        }
        Update: {
          batch_id?: string | null
          created_at?: string
          from_bin_id?: string | null
          from_warehouse_id?: string | null
          id?: string
          organization_id?: string
          product_id?: string
          quantity?: number
          reason?: string | null
          reference?: string | null
          to_bin_id?: string | null
          to_warehouse_id?: string | null
          type?: Database["public"]["Enums"]["stock_movement_type"]
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_movements_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "product_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_from_bin_id_fkey"
            columns: ["from_bin_id"]
            isOneToOne: false
            referencedRelation: "warehouse_bins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_from_warehouse_id_fkey"
            columns: ["from_warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_to_bin_id_fkey"
            columns: ["to_bin_id"]
            isOneToOne: false
            referencedRelation: "warehouse_bins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_to_warehouse_id_fkey"
            columns: ["to_warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_transfer_items: {
        Row: {
          created_at: string
          id: string
          note: string | null
          organization_id: string
          product_id: string
          qty: number
          transfer_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          note?: string | null
          organization_id?: string
          product_id: string
          qty: number
          transfer_id: string
        }
        Update: {
          created_at?: string
          id?: string
          note?: string | null
          organization_id?: string
          product_id?: string
          qty?: number
          transfer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_transfer_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_transfer_items_transfer_id_fkey"
            columns: ["transfer_id"]
            isOneToOne: false
            referencedRelation: "stock_transfers"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_transfers: {
        Row: {
          code: string | null
          completed_at: string | null
          created_at: string
          created_by: string | null
          from_warehouse_id: string
          id: string
          notes: string | null
          organization_id: string
          status: Database["public"]["Enums"]["stock_transfer_status"]
          to_warehouse_id: string
          updated_at: string
        }
        Insert: {
          code?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          from_warehouse_id: string
          id?: string
          notes?: string | null
          organization_id?: string
          status?: Database["public"]["Enums"]["stock_transfer_status"]
          to_warehouse_id: string
          updated_at?: string
        }
        Update: {
          code?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          from_warehouse_id?: string
          id?: string
          notes?: string | null
          organization_id?: string
          status?: Database["public"]["Enums"]["stock_transfer_status"]
          to_warehouse_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_transfers_from_warehouse_id_fkey"
            columns: ["from_warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_transfers_to_warehouse_id_fkey"
            columns: ["to_warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      stocktake_lines: {
        Row: {
          bin_id: string | null
          counted_qty: number
          created_at: string
          id: string
          organization_id: string
          product_id: string
          stocktake_id: string
          system_qty: number
        }
        Insert: {
          bin_id?: string | null
          counted_qty?: number
          created_at?: string
          id?: string
          organization_id?: string
          product_id: string
          stocktake_id: string
          system_qty?: number
        }
        Update: {
          bin_id?: string | null
          counted_qty?: number
          created_at?: string
          id?: string
          organization_id?: string
          product_id?: string
          stocktake_id?: string
          system_qty?: number
        }
        Relationships: [
          {
            foreignKeyName: "stocktake_lines_bin_id_fkey"
            columns: ["bin_id"]
            isOneToOne: false
            referencedRelation: "warehouse_bins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stocktake_lines_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stocktake_lines_stocktake_id_fkey"
            columns: ["stocktake_id"]
            isOneToOne: false
            referencedRelation: "stocktakes"
            referencedColumns: ["id"]
          },
        ]
      }
      stocktakes: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          notes: string | null
          organization_id: string
          status: string
          updated_at: string
          warehouse_id: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          organization_id?: string
          status?: string
          updated_at?: string
          warehouse_id?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          organization_id?: string
          status?: string
          updated_at?: string
          warehouse_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stocktakes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stocktakes_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          billing_cycle: string
          cancel_at: string | null
          created_at: string
          current_period_end: string | null
          id: string
          notes: string | null
          organization_id: string
          plan_id: string
          started_at: string
          status: Database["public"]["Enums"]["subscription_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          billing_cycle?: string
          cancel_at?: string | null
          created_at?: string
          current_period_end?: string | null
          id?: string
          notes?: string | null
          organization_id?: string
          plan_id: string
          started_at?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          billing_cycle?: string
          cancel_at?: string | null
          created_at?: string
          current_period_end?: string | null
          id?: string
          notes?: string | null
          organization_id?: string
          plan_id?: string
          started_at?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_invoices: {
        Row: {
          balance: number
          created_at: string
          id: string
          invoice_date: string
          invoice_no: string | null
          notes: string | null
          organization_id: string
          paid: number
          po_id: string | null
          subtotal: number
          supplier_id: string | null
          tax: number
          total: number
          updated_at: string
        }
        Insert: {
          balance?: number
          created_at?: string
          id?: string
          invoice_date?: string
          invoice_no?: string | null
          notes?: string | null
          organization_id?: string
          paid?: number
          po_id?: string | null
          subtotal?: number
          supplier_id?: string | null
          tax?: number
          total?: number
          updated_at?: string
        }
        Update: {
          balance?: number
          created_at?: string
          id?: string
          invoice_date?: string
          invoice_no?: string | null
          notes?: string | null
          organization_id?: string
          paid?: number
          po_id?: string | null
          subtotal?: number
          supplier_id?: string | null
          tax?: number
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplier_invoices_po_id_fkey"
            columns: ["po_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_invoices_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_payments: {
        Row: {
          amount: number
          id: string
          invoice_id: string | null
          method: Database["public"]["Enums"]["payment_method"]
          notes: string | null
          organization_id: string
          paid_at: string
          reference: string | null
          supplier_id: string
        }
        Insert: {
          amount?: number
          id?: string
          invoice_id?: string | null
          method?: Database["public"]["Enums"]["payment_method"]
          notes?: string | null
          organization_id?: string
          paid_at?: string
          reference?: string | null
          supplier_id: string
        }
        Update: {
          amount?: number
          id?: string
          invoice_id?: string | null
          method?: Database["public"]["Enums"]["payment_method"]
          notes?: string | null
          organization_id?: string
          paid_at?: string
          reference?: string | null
          supplier_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplier_payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "supplier_invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_payments_supplier_id_fkey"
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
          balance: number
          city: string | null
          contact_person: string | null
          country: string | null
          created_at: string
          created_by: string | null
          email: string | null
          id: string
          name: string
          notes: string | null
          organization_id: string
          phone: string | null
          status: string
          tax_number: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          balance?: number
          city?: string | null
          contact_person?: string | null
          country?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          organization_id?: string
          phone?: string | null
          status?: string
          tax_number?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          balance?: number
          city?: string | null
          contact_person?: string | null
          country?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          organization_id?: string
          phone?: string | null
          status?: string
          tax_number?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      tax_rates: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          is_default: boolean
          name: string
          organization_id: string
          rate: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          is_default?: boolean
          name: string
          organization_id?: string
          rate: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          is_default?: boolean
          name?: string
          organization_id?: string
          rate?: number
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
      warehouse_aisles: {
        Row: {
          created_at: string
          id: string
          name: string
          organization_id: string
          zone_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          organization_id?: string
          zone_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          organization_id?: string
          zone_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "warehouse_aisles_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "warehouse_zones"
            referencedColumns: ["id"]
          },
        ]
      }
      warehouse_bins: {
        Row: {
          code: string | null
          created_at: string
          id: string
          name: string
          organization_id: string
          shelf_id: string
        }
        Insert: {
          code?: string | null
          created_at?: string
          id?: string
          name: string
          organization_id?: string
          shelf_id: string
        }
        Update: {
          code?: string | null
          created_at?: string
          id?: string
          name?: string
          organization_id?: string
          shelf_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "warehouse_bins_shelf_id_fkey"
            columns: ["shelf_id"]
            isOneToOne: false
            referencedRelation: "warehouse_shelves"
            referencedColumns: ["id"]
          },
        ]
      }
      warehouse_racks: {
        Row: {
          aisle_id: string
          created_at: string
          id: string
          name: string
          organization_id: string
        }
        Insert: {
          aisle_id: string
          created_at?: string
          id?: string
          name: string
          organization_id?: string
        }
        Update: {
          aisle_id?: string
          created_at?: string
          id?: string
          name?: string
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "warehouse_racks_aisle_id_fkey"
            columns: ["aisle_id"]
            isOneToOne: false
            referencedRelation: "warehouse_aisles"
            referencedColumns: ["id"]
          },
        ]
      }
      warehouse_shelves: {
        Row: {
          created_at: string
          id: string
          name: string
          organization_id: string
          rack_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          organization_id?: string
          rack_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          organization_id?: string
          rack_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "warehouse_shelves_rack_id_fkey"
            columns: ["rack_id"]
            isOneToOne: false
            referencedRelation: "warehouse_racks"
            referencedColumns: ["id"]
          },
        ]
      }
      warehouse_zones: {
        Row: {
          code: string | null
          created_at: string
          id: string
          name: string
          organization_id: string
          warehouse_id: string
        }
        Insert: {
          code?: string | null
          created_at?: string
          id?: string
          name: string
          organization_id?: string
          warehouse_id: string
        }
        Update: {
          code?: string | null
          created_at?: string
          id?: string
          name?: string
          organization_id?: string
          warehouse_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "warehouse_zones_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      warehouses: {
        Row: {
          address: string | null
          branch_id: string | null
          code: string | null
          created_at: string
          id: string
          is_active: boolean
          name: string
          name_ar: string | null
          organization_id: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          branch_id?: string | null
          code?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          name_ar?: string | null
          organization_id?: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          branch_id?: string | null
          code?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          name_ar?: string | null
          organization_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "warehouses_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      acc_can_write: { Args: never; Returns: boolean }
      agri_can_write: { Args: never; Returns: boolean }
      current_org_id: { Args: never; Returns: string }
      generate_license_key: { Args: never; Returns: string }
      has_permission: {
        Args: { _perm: string; _user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_org_member: { Args: { _org: string; _uid?: string }; Returns: boolean }
      is_org_owner: { Args: { _org: string; _uid?: string }; Returns: boolean }
      is_system_owner: { Args: { _uid?: string }; Returns: boolean }
      license_is_active: { Args: { _org: string }; Returns: boolean }
      pos_apply_customer_updates: {
        Args: {
          _balance_delta: number
          _customer_id: string
          _points_delta: number
        }
        Returns: undefined
      }
    }
    Enums: {
      account_type: "asset" | "liability" | "equity" | "revenue" | "expense"
      agri_disease_type:
        | "fungal"
        | "bacterial"
        | "viral"
        | "physiological"
        | "nutrient_deficiency"
        | "climatic"
      agri_pest_type:
        | "insect"
        | "mite"
        | "worm"
        | "nematode"
        | "rodent"
        | "bird"
        | "mollusk"
        | "weed"
        | "other"
      agri_plant_kind:
        | "crop"
        | "fruit_tree"
        | "vegetable"
        | "grain"
        | "herb"
        | "industrial"
        | "fodder"
        | "forest"
        | "ornamental"
        | "indoor"
        | "outdoor"
      agri_treatment_method:
        | "chemical"
        | "biological"
        | "cultural"
        | "mechanical"
        | "organic"
      agri_treatment_target: "disease" | "pest" | "deficiency"
      app_role:
        | "admin"
        | "manager"
        | "employee"
        | "owner"
        | "branch_manager"
        | "warehouse_keeper"
        | "seller"
        | "cashier"
        | "accountant"
        | "purchases_manager"
        | "sales_manager"
        | "delivery"
        | "customer_service"
        | "system_owner"
      bank_tx_type:
        | "deposit"
        | "withdrawal"
        | "transfer"
        | "fee"
        | "interest"
        | "other"
      check_direction: "in" | "out"
      check_status:
        | "pending"
        | "deposited"
        | "cleared"
        | "bounced"
        | "cancelled"
      customer_type: "retail" | "wholesale" | "semi_wholesale" | "vip"
      discount_type: "percent" | "amount"
      journal_status: "draft" | "posted" | "void"
      party_type: "customer" | "supplier"
      payment_method:
        | "cash"
        | "card"
        | "transfer"
        | "check"
        | "mixed"
        | "credit"
      po_status:
        | "draft"
        | "approved"
        | "ordered"
        | "received"
        | "invoiced"
        | "closed"
        | "cancelled"
      receipt_direction: "in" | "out"
      sale_status: "draft" | "confirmed" | "paid" | "partial" | "void"
      sale_type: "sale" | "quote" | "return" | "credit_note" | "debit_note"
      stock_movement_type:
        | "purchase"
        | "sale"
        | "transfer"
        | "return"
        | "damage"
        | "adjustment"
        | "stocktake"
      stock_transfer_status: "draft" | "in_transit" | "completed" | "cancelled"
      subscription_status:
        | "trial"
        | "active"
        | "past_due"
        | "cancelled"
        | "expired"
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
      account_type: ["asset", "liability", "equity", "revenue", "expense"],
      agri_disease_type: [
        "fungal",
        "bacterial",
        "viral",
        "physiological",
        "nutrient_deficiency",
        "climatic",
      ],
      agri_pest_type: [
        "insect",
        "mite",
        "worm",
        "nematode",
        "rodent",
        "bird",
        "mollusk",
        "weed",
        "other",
      ],
      agri_plant_kind: [
        "crop",
        "fruit_tree",
        "vegetable",
        "grain",
        "herb",
        "industrial",
        "fodder",
        "forest",
        "ornamental",
        "indoor",
        "outdoor",
      ],
      agri_treatment_method: [
        "chemical",
        "biological",
        "cultural",
        "mechanical",
        "organic",
      ],
      agri_treatment_target: ["disease", "pest", "deficiency"],
      app_role: [
        "admin",
        "manager",
        "employee",
        "owner",
        "branch_manager",
        "warehouse_keeper",
        "seller",
        "cashier",
        "accountant",
        "purchases_manager",
        "sales_manager",
        "delivery",
        "customer_service",
        "system_owner",
      ],
      bank_tx_type: [
        "deposit",
        "withdrawal",
        "transfer",
        "fee",
        "interest",
        "other",
      ],
      check_direction: ["in", "out"],
      check_status: ["pending", "deposited", "cleared", "bounced", "cancelled"],
      customer_type: ["retail", "wholesale", "semi_wholesale", "vip"],
      discount_type: ["percent", "amount"],
      journal_status: ["draft", "posted", "void"],
      party_type: ["customer", "supplier"],
      payment_method: ["cash", "card", "transfer", "check", "mixed", "credit"],
      po_status: [
        "draft",
        "approved",
        "ordered",
        "received",
        "invoiced",
        "closed",
        "cancelled",
      ],
      receipt_direction: ["in", "out"],
      sale_status: ["draft", "confirmed", "paid", "partial", "void"],
      sale_type: ["sale", "quote", "return", "credit_note", "debit_note"],
      stock_movement_type: [
        "purchase",
        "sale",
        "transfer",
        "return",
        "damage",
        "adjustment",
        "stocktake",
      ],
      stock_transfer_status: ["draft", "in_transit", "completed", "cancelled"],
      subscription_status: [
        "trial",
        "active",
        "past_due",
        "cancelled",
        "expired",
      ],
    },
  },
} as const
