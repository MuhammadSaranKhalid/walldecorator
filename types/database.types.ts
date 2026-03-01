export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      categories: {
        Row: {
          created_at: string
          description: string | null
          display_order: number | null
          id: string
          image_path: string | null
          is_visible: boolean | null
          name: string
          parent_id: string | null
          product_count: number | null
          seo_description: string | null
          seo_title: string | null
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          image_path?: string | null
          is_visible?: boolean | null
          name: string
          parent_id?: string | null
          product_count?: number | null
          seo_description?: string | null
          seo_title?: string | null
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          image_path?: string | null
          is_visible?: boolean | null
          name?: string
          parent_id?: string | null
          product_count?: number | null
          seo_description?: string | null
          seo_title?: string | null
          slug?: string
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
      discount_codes: {
        Row: {
          code: string
          created_at: string
          id: string
          is_active: boolean | null
          minimum_order_amount: number | null
          type: string
          updated_at: string
          usage_count: number | null
          usage_limit: number | null
          valid_from: string | null
          valid_until: string | null
          value: number
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          minimum_order_amount?: number | null
          type: string
          updated_at?: string
          usage_count?: number | null
          usage_limit?: number | null
          valid_from?: string | null
          valid_until?: string | null
          value: number
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          minimum_order_amount?: number | null
          type?: string
          updated_at?: string
          usage_count?: number | null
          usage_limit?: number | null
          valid_from?: string | null
          valid_until?: string | null
          value?: number
        }
        Relationships: []
      }
      discount_usages: {
        Row: {
          created_at: string
          discount_applied: number
          discount_code_id: string
          id: string
          order_id: string
        }
        Insert: {
          created_at?: string
          discount_applied: number
          discount_code_id: string
          id?: string
          order_id: string
        }
        Update: {
          created_at?: string
          discount_applied?: number
          discount_code_id?: string
          id?: string
          order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "discount_usages_discount_code_id_fkey"
            columns: ["discount_code_id"]
            isOneToOne: false
            referencedRelation: "discount_codes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discount_usages_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      homepage_config: {
        Row: {
          created_at: string
          hero_cta_link: string | null
          hero_cta_text: string | null
          hero_headline: string | null
          hero_image_path: string | null
          hero_subheadline: string | null
          id: string
          promo_bg_color: string | null
          promo_cta_link: string | null
          promo_cta_text: string | null
          promo_headline: string | null
          promo_is_active: boolean | null
          promo_subheadline: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          hero_cta_link?: string | null
          hero_cta_text?: string | null
          hero_headline?: string | null
          hero_image_path?: string | null
          hero_subheadline?: string | null
          id?: string
          promo_bg_color?: string | null
          promo_cta_link?: string | null
          promo_cta_text?: string | null
          promo_headline?: string | null
          promo_is_active?: boolean | null
          promo_subheadline?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          hero_cta_link?: string | null
          hero_cta_text?: string | null
          hero_headline?: string | null
          hero_image_path?: string | null
          hero_subheadline?: string | null
          id?: string
          promo_bg_color?: string | null
          promo_cta_link?: string | null
          promo_cta_text?: string | null
          promo_headline?: string | null
          promo_is_active?: boolean | null
          promo_subheadline?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      inventory: {
        Row: {
          allow_backorder: boolean | null
          created_at: string
          id: string
          low_stock_threshold: number | null
          quantity_available: number | null
          quantity_on_hand: number | null
          quantity_reserved: number | null
          updated_at: string
          variant_id: string
        }
        Insert: {
          allow_backorder?: boolean | null
          created_at?: string
          id?: string
          low_stock_threshold?: number | null
          quantity_available?: number | null
          quantity_on_hand?: number | null
          quantity_reserved?: number | null
          updated_at?: string
          variant_id: string
        }
        Update: {
          allow_backorder?: boolean | null
          created_at?: string
          id?: string
          low_stock_threshold?: number | null
          quantity_available?: number | null
          quantity_on_hand?: number | null
          quantity_reserved?: number | null
          updated_at?: string
          variant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: true
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_transactions: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          quantity_after: number
          quantity_before: number
          quantity_delta: number
          reference_id: string | null
          reference_type: string | null
          type: string
          variant_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          quantity_after: number
          quantity_before: number
          quantity_delta: number
          reference_id?: string | null
          reference_type?: string | null
          type: string
          variant_id: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          quantity_after?: number
          quantity_before?: number
          quantity_delta?: number
          reference_id?: string | null
          reference_type?: string | null
          type?: string
          variant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_transactions_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      newsletter_subscribers: {
        Row: {
          email: string
          id: string
          is_active: boolean | null
          subscribed_at: string
          unsubscribed_at: string | null
        }
        Insert: {
          email: string
          id?: string
          is_active?: boolean | null
          subscribed_at?: string
          unsubscribed_at?: string | null
        }
        Update: {
          email?: string
          id?: string
          is_active?: boolean | null
          subscribed_at?: string
          unsubscribed_at?: string | null
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          order_id: string
          product_name: string
          quantity: number
          sku: string
          total_price: number
          unit_price: number
          variant_description: string | null
          variant_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          order_id: string
          product_name: string
          quantity: number
          sku: string
          total_price: number
          unit_price: number
          variant_description?: string | null
          variant_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string
          product_name?: string
          quantity?: number
          sku?: string
          total_price?: number
          unit_price?: number
          variant_description?: string | null
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      order_status_history: {
        Row: {
          changed_by_type: string | null
          created_at: string
          from_status: string | null
          id: string
          notes: string | null
          order_id: string
          to_status: string
        }
        Insert: {
          changed_by_type?: string | null
          created_at?: string
          from_status?: string | null
          id?: string
          notes?: string | null
          order_id: string
          to_status: string
        }
        Update: {
          changed_by_type?: string | null
          created_at?: string
          from_status?: string | null
          id?: string
          notes?: string | null
          order_id?: string
          to_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_status_history_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          billing_address: Json | null
          cancelled_at: string | null
          confirmed_at: string | null
          created_at: string
          currency: string
          customer_email: string
          customer_name: string
          customer_phone: string
          delivered_at: string | null
          discount_amount: number | null
          id: string
          ip_address: string | null
          notes: string | null
          order_number: string
          payment_intent_id: string | null
          payment_method: string | null
          payment_status: string | null
          shipped_at: string | null
          shipping_address: Json
          shipping_cost: number | null
          status: string | null
          subtotal: number
          tax_amount: number | null
          total_amount: number
          updated_at: string
          user_agent: string | null
        }
        Insert: {
          billing_address?: Json | null
          cancelled_at?: string | null
          confirmed_at?: string | null
          created_at?: string
          currency?: string
          customer_email: string
          customer_name: string
          customer_phone: string
          delivered_at?: string | null
          discount_amount?: number | null
          id?: string
          ip_address?: string | null
          notes?: string | null
          order_number: string
          payment_intent_id?: string | null
          payment_method?: string | null
          payment_status?: string | null
          shipped_at?: string | null
          shipping_address: Json
          shipping_cost?: number | null
          status?: string | null
          subtotal: number
          tax_amount?: number | null
          total_amount: number
          updated_at?: string
          user_agent?: string | null
        }
        Update: {
          billing_address?: Json | null
          cancelled_at?: string | null
          confirmed_at?: string | null
          created_at?: string
          currency?: string
          customer_email?: string
          customer_name?: string
          customer_phone?: string
          delivered_at?: string | null
          discount_amount?: number | null
          id?: string
          ip_address?: string | null
          notes?: string | null
          order_number?: string
          payment_intent_id?: string | null
          payment_method?: string | null
          payment_status?: string | null
          shipped_at?: string | null
          shipping_address?: Json
          shipping_cost?: number | null
          status?: string | null
          subtotal?: number
          tax_amount?: number | null
          total_amount?: number
          updated_at?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          currency: string
          error_message: string | null
          id: string
          order_id: string
          payment_method_details: Json | null
          payment_method_type: string | null
          status: string | null
          stripe_metadata: Json | null
          stripe_payment_intent_id: string
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          error_message?: string | null
          id?: string
          order_id: string
          payment_method_details?: Json | null
          payment_method_type?: string | null
          status?: string | null
          stripe_metadata?: Json | null
          stripe_payment_intent_id: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          error_message?: string | null
          id?: string
          order_id?: string
          payment_method_details?: Json | null
          payment_method_type?: string | null
          status?: string | null
          stripe_metadata?: Json | null
          stripe_payment_intent_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      product_attribute_values: {
        Row: {
          attribute_id: string
          created_at: string
          display_name: string
          display_order: number | null
          id: string
          value: string
        }
        Insert: {
          attribute_id: string
          created_at?: string
          display_name: string
          display_order?: number | null
          id?: string
          value: string
        }
        Update: {
          attribute_id?: string
          created_at?: string
          display_name?: string
          display_order?: number | null
          id?: string
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_attribute_values_attribute_id_fkey"
            columns: ["attribute_id"]
            isOneToOne: false
            referencedRelation: "product_attributes"
            referencedColumns: ["id"]
          },
        ]
      }
      product_attributes: {
        Row: {
          created_at: string
          display_name: string
          display_order: number | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          display_name: string
          display_order?: number | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          display_name?: string
          display_order?: number | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      product_images: {
        Row: {
          alt_text: string | null
          created_at: string
          display_order: number | null
          file_size_bytes: number | null
          id: string
          large_path: string | null
          medium_path: string | null
          original_height: number | null
          original_width: number | null
          processing_error: string | null
          processing_status: string | null
          product_id: string
          storage_path: string
          thumbnail_path: string | null
          updated_at: string
          variant_id: string | null
        }
        Insert: {
          alt_text?: string | null
          created_at?: string
          display_order?: number | null
          file_size_bytes?: number | null
          id?: string
          large_path?: string | null
          medium_path?: string | null
          original_height?: number | null
          original_width?: number | null
          processing_error?: string | null
          processing_status?: string | null
          product_id: string
          storage_path: string
          thumbnail_path?: string | null
          updated_at?: string
          variant_id?: string | null
        }
        Update: {
          alt_text?: string | null
          created_at?: string
          display_order?: number | null
          file_size_bytes?: number | null
          id?: string
          large_path?: string | null
          medium_path?: string | null
          original_height?: number | null
          original_width?: number | null
          processing_error?: string | null
          processing_status?: string | null
          product_id?: string
          storage_path?: string
          thumbnail_path?: string | null
          updated_at?: string
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_images_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      product_variants: {
        Row: {
          compare_at_price: number | null
          cost_per_item: number | null
          created_at: string
          id: string
          is_default: boolean | null
          material_id: string
          price: number
          product_id: string
          size_id: string
          sku: string
          thickness_id: string
          updated_at: string
        }
        Insert: {
          compare_at_price?: number | null
          cost_per_item?: number | null
          created_at?: string
          id?: string
          is_default?: boolean | null
          material_id: string
          price: number
          product_id: string
          size_id: string
          sku: string
          thickness_id: string
          updated_at?: string
        }
        Update: {
          compare_at_price?: number | null
          cost_per_item?: number | null
          created_at?: string
          id?: string
          is_default?: boolean | null
          material_id?: string
          price?: number
          product_id?: string
          size_id?: string
          sku?: string
          thickness_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_variants_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "product_attribute_values"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_variants_size_id_fkey"
            columns: ["size_id"]
            isOneToOne: false
            referencedRelation: "product_attribute_values"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_variants_thickness_id_fkey"
            columns: ["thickness_id"]
            isOneToOne: false
            referencedRelation: "product_attribute_values"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category_id: string | null
          created_at: string
          description: string | null
          featured_order: number | null
          id: string
          is_featured: boolean | null
          name: string
          seo_description: string | null
          seo_title: string | null
          slug: string
          status: string | null
          total_sold: number | null
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          description?: string | null
          featured_order?: number | null
          id?: string
          is_featured?: boolean | null
          name: string
          seo_description?: string | null
          seo_title?: string | null
          slug: string
          status?: string | null
          total_sold?: number | null
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          created_at?: string
          description?: string | null
          featured_order?: number | null
          id?: string
          is_featured?: boolean | null
          name?: string
          seo_description?: string | null
          seo_title?: string | null
          slug?: string
          status?: string | null
          total_sold?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      refunds: {
        Row: {
          amount: number
          created_at: string
          currency: string
          id: string
          notes: string | null
          order_id: string
          payment_id: string
          reason: string | null
          status: string | null
          stripe_metadata: Json | null
          stripe_refund_id: string
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          id?: string
          notes?: string | null
          order_id: string
          payment_id: string
          reason?: string | null
          status?: string | null
          stripe_metadata?: Json | null
          stripe_refund_id: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          notes?: string | null
          order_id?: string
          payment_id?: string
          reason?: string | null
          status?: string | null
          stripe_metadata?: Json | null
          stripe_refund_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "refunds_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "refunds_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          body: string | null
          created_at: string
          helpful_count: number | null
          id: string
          is_approved: boolean | null
          is_verified_purchase: boolean | null
          order_id: string | null
          product_id: string
          rating: number
          reviewer_email: string
          reviewer_name: string
          title: string | null
          updated_at: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          helpful_count?: number | null
          id?: string
          is_approved?: boolean | null
          is_verified_purchase?: boolean | null
          order_id?: string | null
          product_id: string
          rating: number
          reviewer_email: string
          reviewer_name: string
          title?: string | null
          updated_at?: string
        }
        Update: {
          body?: string | null
          created_at?: string
          helpful_count?: number | null
          id?: string
          is_approved?: boolean | null
          is_verified_purchase?: boolean | null
          order_id?: string | null
          product_id?: string
          rating?: number
          reviewer_email?: string
          reviewer_name?: string
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      adjust_inventory: {
        Args: {
          p_notes?: string
          p_quantity_delta: number
          p_reference_id?: string
          p_reference_type?: string
          p_type: string
          p_variant_id: string
        }
        Returns: {
          allow_backorder: boolean | null
          created_at: string
          id: string
          low_stock_threshold: number | null
          quantity_available: number | null
          quantity_on_hand: number | null
          quantity_reserved: number | null
          updated_at: string
          variant_id: string
        }
        SetofOptions: {
          from: "*"
          to: "inventory"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      calculate_discount_amount: {
        Args: {
          p_discount_type: string
          p_discount_value: number
          p_order_subtotal: number
          p_shipping_cost: number
        }
        Returns: number
      }
      create_order: {
        Args: {
          p_billing_address: Json
          p_cart_items: Json
          p_customer_email: string
          p_customer_name: string
          p_customer_phone: string
          p_discount_amount?: number
          p_ip_address?: string
          p_payment_intent_id: string
          p_payment_method: string
          p_shipping_address: Json
          p_shipping_cost?: number
          p_tax_rate?: number
          p_user_agent?: string
        }
        Returns: string
      }
      generate_order_number: { Args: never; Returns: string }
      generate_variant_sku: {
        Args: {
          p_material_id: string
          p_product_id: string
          p_size_id: string
          p_thickness_id: string
        }
        Returns: string
      }
      get_product_rating: {
        Args: { p_product_id: string }
        Returns: {
          average_rating: number
          rating_distribution: Json
          total_reviews: number
        }[]
      }
      is_in_stock: {
        Args: { p_quantity?: number; p_variant_id: string }
        Returns: boolean
      }
      release_inventory: {
        Args: { p_cart_id: string; p_quantity: number; p_variant_id: string }
        Returns: boolean
      }
      reserve_inventory: {
        Args: { p_cart_id: string; p_quantity: number; p_variant_id: string }
        Returns: boolean
      }
      validate_discount_code: {
        Args: { p_code: string; p_order_total: number }
        Returns: {
          discount_id: string
          discount_type: string
          discount_value: number
          error_message: string
          is_valid: boolean
        }[]
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const

