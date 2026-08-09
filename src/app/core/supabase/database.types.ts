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
    PostgrestVersion: "13.0.4"
  }
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
      admin_store_accesses: {
        Row: {
          admin_id: string
          created_at: string
          store_id: string
        }
        Insert: {
          admin_id: string
          created_at?: string
          store_id: string
        }
        Update: {
          admin_id?: string
          created_at?: string
          store_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_store_accesses_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "admins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_store_accesses_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      admins: {
        Row: {
          active: boolean
          created_at: string
          id: string
          region: string
          role: string
          store_logo_url: string | null
          store_name: string
          theme_id: string
          user_id: string | null
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          region?: string
          role?: string
          store_logo_url?: string | null
          store_name?: string
          theme_id?: string
          user_id?: string | null
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          region?: string
          role?: string
          store_logo_url?: string | null
          store_name?: string
          theme_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admins_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      cart_items: {
        Row: {
          created_at: string
          id: string
          product_id: string
          quantity: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          quantity?: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          quantity?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cart_items_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          address: string | null
          age: number | null
          cnpj: string | null
          cpf: string | null
          created_at: string | null
          email: string | null
          id: number
          imageUrl: string | null
          name: string
          phone: string | null
          store_id: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          address?: string | null
          age?: number | null
          cnpj?: string | null
          cpf?: string | null
          created_at?: string | null
          email?: string | null
          id?: number
          imageUrl?: string | null
          name: string
          phone?: string | null
          store_id?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          address?: string | null
          age?: number | null
          cnpj?: string | null
          cpf?: string | null
          created_at?: string | null
          email?: string | null
          id?: number
          imageUrl?: string | null
          name?: string
          phone?: string | null
          store_id?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clients_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clients_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      deliveries: {
        Row: {
          address: string
          carrier: string | null
          created_at: string
          customer_name: string
          delivered_at: string | null
          estimated_delivery_date: string | null
          id: string
          label_status: string | null
          melhor_envio_order_id: string | null
          melhor_envio_protocol: string | null
          notes: string | null
          order_id: string | null
          selected_service_id: string | null
          selected_service_name: string | null
          shipping_deadline: number | null
          shipping_price: number | null
          status: string
          store_id: string
          tracking_code: string | null
          tracking_url: string | null
          updated_at: string
          user_id: string | null
          webhook_payload: Json | null
        }
        Insert: {
          address?: string
          carrier?: string | null
          created_at?: string
          customer_name?: string
          delivered_at?: string | null
          estimated_delivery_date?: string | null
          id?: string
          label_status?: string | null
          melhor_envio_order_id?: string | null
          melhor_envio_protocol?: string | null
          notes?: string | null
          order_id?: string | null
          selected_service_id?: string | null
          selected_service_name?: string | null
          shipping_deadline?: number | null
          shipping_price?: number | null
          status?: string
          store_id?: string
          tracking_code?: string | null
          tracking_url?: string | null
          updated_at?: string
          user_id?: string | null
          webhook_payload?: Json | null
        }
        Update: {
          address?: string
          carrier?: string | null
          created_at?: string
          customer_name?: string
          delivered_at?: string | null
          estimated_delivery_date?: string | null
          id?: string
          label_status?: string | null
          melhor_envio_order_id?: string | null
          melhor_envio_protocol?: string | null
          notes?: string | null
          order_id?: string | null
          selected_service_id?: string | null
          selected_service_name?: string | null
          shipping_deadline?: number | null
          shipping_price?: number | null
          status?: string
          store_id?: string
          tracking_code?: string | null
          tracking_url?: string | null
          updated_at?: string
          user_id?: string | null
          webhook_payload?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "deliveries_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deliveries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      melhor_envio_tokens: {
        Row: {
          access_token: string
          created_at: string
          expires_at: string
          id: string
          refresh_expires_at: string | null
          refresh_token: string
          scopes: string | null
          updated_at: string
        }
        Insert: {
          access_token: string
          created_at?: string
          expires_at: string
          id?: string
          refresh_expires_at?: string | null
          refresh_token: string
          scopes?: string | null
          updated_at?: string
        }
        Update: {
          access_token?: string
          created_at?: string
          expires_at?: string
          id?: string
          refresh_expires_at?: string | null
          refresh_token?: string
          scopes?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          order_id: string
          product_id: string
          product_image_url: string | null
          product_name: string
          quantity: number
          store_id: string
          total_amount: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          order_id: string
          product_id: string
          product_image_url?: string | null
          product_name: string
          quantity: number
          store_id: string
          total_amount: number
          unit_price: number
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string
          product_id?: string
          product_image_url?: string | null
          product_name?: string
          quantity?: number
          store_id?: string
          total_amount?: number
          unit_price?: number
        }
        Relationships: []
      }
      orders: {
        Row: {
          address: string | null
          clientId: number | null
          created_at: string | null
          id: number
          imageClient: string | null
          imageProd: string | null
          name: string | null
          product: string | null
          productId: number | null
          quantity: number
          status: string
          store_id: string
          total_amount: number
          updated_at: string
          userId: string | null
        }
        Insert: {
          address?: string | null
          clientId?: number | null
          created_at?: string | null
          id?: number
          imageClient?: string | null
          imageProd?: string | null
          name?: string | null
          product?: string | null
          productId?: number | null
          quantity?: number
          status?: string
          store_id?: string
          total_amount?: number
          updated_at?: string
          userId?: string | null
        }
        Update: {
          address?: string | null
          clientId?: number | null
          created_at?: string | null
          id?: number
          imageClient?: string | null
          imageProd?: string | null
          name?: string | null
          product?: string | null
          productId?: number | null
          quantity?: number
          status?: string
          store_id?: string
          total_amount?: number
          updated_at?: string
          userId?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_client_id_fkey"
            columns: ["clientId"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_product_id_fkey"
            columns: ["productId"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_events: {
        Row: {
          action: string | null
          created_at: string
          event_type: string | null
          id: string
          payload: Json
          payment_id: string | null
          processed_at: string | null
          provider: string
          provider_payment_id: string | null
        }
        Insert: {
          action?: string | null
          created_at?: string
          event_type?: string | null
          id: string
          payload?: Json
          payment_id?: string | null
          processed_at?: string | null
          provider?: string
          provider_payment_id?: string | null
        }
        Update: {
          action?: string | null
          created_at?: string
          event_type?: string | null
          id?: string
          payload?: Json
          payment_id?: string | null
          processed_at?: string | null
          provider?: string
          provider_payment_id?: string | null
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          approved_at: string | null
          created_at: string
          currency: string
          external_reference: string
          id: string
          init_point: string | null
          order_id: string
          payer_email: string | null
          payment_id: string | null
          payment_method_id: string | null
          payment_type_id: string | null
          preference_id: string | null
          provider: string
          raw_payload: Json | null
          sandbox_init_point: string | null
          status: string
          status_detail: string | null
          store_id: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          amount?: number
          approved_at?: string | null
          created_at?: string
          currency?: string
          external_reference: string
          id?: string
          init_point?: string | null
          order_id: string
          payer_email?: string | null
          payment_id?: string | null
          payment_method_id?: string | null
          payment_type_id?: string | null
          preference_id?: string | null
          provider?: string
          raw_payload?: Json | null
          sandbox_init_point?: string | null
          status?: string
          status_detail?: string | null
          store_id: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          amount?: number
          approved_at?: string | null
          created_at?: string
          currency?: string
          external_reference?: string
          id?: string
          init_point?: string | null
          order_id?: string
          payer_email?: string | null
          payment_id?: string | null
          payment_method_id?: string | null
          payment_type_id?: string | null
          preference_id?: string | null
          provider?: string
          raw_payload?: Json | null
          sandbox_init_point?: string | null
          status?: string
          status_detail?: string | null
          store_id?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          cost: number | null
          created_at: string | null
          description: string | null
          id: number
          imageUrl: string | null
          is_featured: boolean
          is_offer: boolean
          model: string | null
          name: string
          offer_badge: string
          offer_ends_at: string | null
          offer_price: number | null
          offer_sold_percent: number
          price: number | null
          shipping_height: number | null
          shipping_insurance_value: number | null
          shipping_length: number | null
          shipping_weight: number | null
          shipping_width: number | null
          stock_minimum: number
          stock_quantity: number
          stock_reserved: number
          store_id: string
          updated_at: string | null
        }
        Insert: {
          cost?: number | null
          created_at?: string | null
          description?: string | null
          id?: number
          imageUrl?: string | null
          is_featured?: boolean
          is_offer?: boolean
          model?: string | null
          name: string
          offer_badge?: string
          offer_ends_at?: string | null
          offer_price?: number | null
          offer_sold_percent?: number
          price?: number | null
          shipping_height?: number | null
          shipping_insurance_value?: number | null
          shipping_length?: number | null
          shipping_weight?: number | null
          shipping_width?: number | null
          stock_minimum?: number
          stock_quantity?: number
          stock_reserved?: number
          store_id?: string
          updated_at?: string | null
        }
        Update: {
          cost?: number | null
          created_at?: string | null
          description?: string | null
          id?: number
          imageUrl?: string | null
          is_featured?: boolean
          is_offer?: boolean
          model?: string | null
          name?: string
          offer_badge?: string
          offer_ends_at?: string | null
          offer_price?: number | null
          offer_sold_percent?: number
          price?: number | null
          shipping_height?: number | null
          shipping_insurance_value?: number | null
          shipping_length?: number | null
          shipping_weight?: number | null
          shipping_width?: number | null
          stock_minimum?: number
          stock_quantity?: number
          stock_reserved?: number
          store_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      stores: {
        Row: {
          active: boolean
          created_at: string
          default_package_height: number
          default_package_length: number
          default_package_weight: number
          default_package_width: number
          id: string
          name: string
          region: string
          sender_address: string | null
          sender_city: string | null
          sender_complement: string | null
          sender_district: string | null
          sender_document: string | null
          sender_email: string | null
          sender_number: string | null
          sender_phone: string | null
          sender_postal_code: string | null
          sender_state: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          default_package_height?: number
          default_package_length?: number
          default_package_weight?: number
          default_package_width?: number
          id?: string
          name: string
          region: string
          sender_address?: string | null
          sender_city?: string | null
          sender_complement?: string | null
          sender_district?: string | null
          sender_document?: string | null
          sender_email?: string | null
          sender_number?: string | null
          sender_phone?: string | null
          sender_postal_code?: string | null
          sender_state?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          default_package_height?: number
          default_package_length?: number
          default_package_weight?: number
          default_package_width?: number
          id?: string
          name?: string
          region?: string
          sender_address?: string | null
          sender_city?: string | null
          sender_complement?: string | null
          sender_district?: string | null
          sender_document?: string | null
          sender_email?: string | null
          sender_number?: string | null
          sender_phone?: string | null
          sender_postal_code?: string | null
          sender_state?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          address: string | null
          avatar_url: string | null
          created_at: string
          document: string | null
          email: string
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          created_at?: string
          document?: string | null
          email?: string
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          created_at?: string
          document?: string | null
          email?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      clear_active_offer: {
        Args: { store_id_value: string }
        Returns: undefined
      }
      current_admin: {
        Args: never
        Returns: {
          active: boolean
          created_at: string
          id: string
          region: string
          role: string
          store_logo_url: string | null
          store_name: string
          theme_id: string
          user_id: string | null
        }
        SetofOptions: {
          from: "*"
          to: "admins"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      current_admin_role: { Args: never; Returns: string }
      get_current_admin_stores: {
        Args: never
        Returns: {
          id: string
          name: string
          region: string
        }[]
      }
      has_admin_role: { Args: { allowed_roles: string[] }; Returns: boolean }
      has_store_access: { Args: { store_id_value: string }; Returns: boolean }
      parse_uuid: { Args: { value: string }; Returns: string }
      set_active_offer: {
        Args: {
          offer_badge_value: string
          offer_ends_at_value: string
          offer_price_value: number
          offer_sold_percent_value: number
          product_id: string
          store_id_value: string
        }
        Returns: {
          cost: number | null
          created_at: string | null
          description: string | null
          id: number
          imageUrl: string | null
          is_featured: boolean
          is_offer: boolean
          model: string | null
          name: string
          offer_badge: string
          offer_ends_at: string | null
          offer_price: number | null
          offer_sold_percent: number
          price: number | null
          shipping_height: number | null
          shipping_insurance_value: number | null
          shipping_length: number | null
          shipping_weight: number | null
          shipping_width: number | null
          stock_minimum: number
          stock_quantity: number
          stock_reserved: number
          store_id: string
          updated_at: string | null
        }
        SetofOptions: {
          from: "*"
          to: "products"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      set_product_featured: {
        Args: { featured: boolean; product_id: string; store_id_value: string }
        Returns: {
          cost: number | null
          created_at: string | null
          description: string | null
          id: number
          imageUrl: string | null
          is_featured: boolean
          is_offer: boolean
          model: string | null
          name: string
          offer_badge: string
          offer_ends_at: string | null
          offer_price: number | null
          offer_sold_percent: number
          price: number | null
          shipping_height: number | null
          shipping_insurance_value: number | null
          shipping_length: number | null
          shipping_weight: number | null
          shipping_width: number | null
          stock_minimum: number
          stock_quantity: number
          stock_reserved: number
          store_id: string
          updated_at: string | null
        }
        SetofOptions: {
          from: "*"
          to: "products"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      update_admin_personalization: {
        Args: { store_logo_url_value: string; theme_id_value: string }
        Returns: {
          active: boolean
          created_at: string
          id: string
          region: string
          role: string
          store_logo_url: string | null
          store_name: string
          theme_id: string
          user_id: string | null
        }
        SetofOptions: {
          from: "*"
          to: "admins"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      update_admin_profile: {
        Args: { region_value: string; store_name_value: string }
        Returns: {
          active: boolean
          created_at: string
          id: string
          region: string
          role: string
          store_logo_url: string | null
          store_name: string
          theme_id: string
          user_id: string | null
        }
        SetofOptions: {
          from: "*"
          to: "admins"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      update_store_shipping: {
        Args: {
          default_package_height_value: number
          default_package_length_value: number
          default_package_weight_value: number
          default_package_width_value: number
          sender_address_value: string
          sender_city_value: string
          sender_complement_value: string
          sender_district_value: string
          sender_document_value: string
          sender_email_value: string
          sender_number_value: string
          sender_phone_value: string
          sender_postal_code_value: string
          sender_state_value: string
          store_id_value: string
        }
        Returns: {
          active: boolean
          created_at: string
          default_package_height: number
          default_package_length: number
          default_package_weight: number
          default_package_width: number
          id: string
          name: string
          region: string
          sender_address: string | null
          sender_city: string | null
          sender_complement: string | null
          sender_district: string | null
          sender_document: string | null
          sender_email: string | null
          sender_number: string | null
          sender_phone: string | null
          sender_postal_code: string | null
          sender_state: string | null
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "stores"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      user_phone_to_numeric: { Args: { phone_value: string }; Returns: number }
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
