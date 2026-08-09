export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      admins: {
        Row: {
          id: string;
          user_id: string;
          role: 'gerente' | 'gerente_regional' | 'vendedor' | 'estoquista';
          active: boolean;
          created_at: string;
          theme_id: 'corporate' | 'graphite' | 'emerald';
          store_logo_url: string | null;
          region: string;
          store_name: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          role?: 'gerente' | 'gerente_regional' | 'vendedor' | 'estoquista';
          active?: boolean;
          created_at?: string;
          theme_id?: 'corporate' | 'graphite' | 'emerald';
          store_logo_url?: string | null;
          region?: string;
          store_name?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          role?: 'gerente' | 'gerente_regional' | 'vendedor' | 'estoquista';
          active?: boolean;
          created_at?: string;
          theme_id?: 'corporate' | 'graphite' | 'emerald';
          store_logo_url?: string | null;
          region?: string;
          store_name?: string;
        };
        Relationships: [];
      };
      admin_store_accesses: {
        Row: {
          admin_id: string;
          store_id: string;
          created_at: string;
        };
        Insert: {
          admin_id: string;
          store_id: string;
          created_at?: string;
        };
        Update: {
          admin_id?: string;
          store_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      cart_items: {
        Row: {
          id: string;
          user_id: string;
          product_id: string;
          quantity: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          product_id: string;
          quantity?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          product_id?: string;
          quantity?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      clients: {
        Row: {
          id: string;
          store_id: string;
          user_id: string | null;
          email: string | null;
          name: string;
          age: number;
          address: string;
          cpf: string;
          cnpj: string | null;
          imageUrl: string | null;
          phone: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          store_id?: string;
          user_id?: string | null;
          email?: string | null;
          name: string;
          age: number;
          address: string;
          cpf: string;
          cnpj?: string | null;
          imageUrl?: string | null;
          phone?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          store_id?: string;
          user_id?: string | null;
          email?: string | null;
          name?: string;
          age?: number;
          address?: string;
          cpf?: string;
          cnpj?: string | null;
          imageUrl?: string | null;
          phone?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      orders: {
        Row: {
          id: string;
          store_id: string;
          clientId: string | null;
          name: string;
          userId: string | null;
          address: string;
          productId: string | null;
          product: string;
          imageProd: string | null;
          imageClient: string | null;
          status: string;
          quantity: number;
          total_amount: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          store_id?: string;
          clientId?: string | null;
          name: string;
          userId?: string | null;
          address: string;
          productId?: string | null;
          product: string;
          imageProd?: string | null;
          imageClient?: string | null;
          status?: string;
          quantity?: number;
          total_amount?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          store_id?: string;
          clientId?: string | null;
          name?: string;
          userId?: string | null;
          address?: string;
          productId?: string | null;
          product?: string;
          imageProd?: string | null;
          imageClient?: string | null;
          status?: string;
          quantity?: number;
          total_amount?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      deliveries: {
        Row: {
          id: string;
          store_id: string;
          order_id: string | null;
          user_id: string | null;
          customer_name: string;
          address: string;
          status: string;
          tracking_code: string | null;
          carrier: string | null;
          estimated_delivery_date: string | null;
          delivered_at: string | null;
          notes: string | null;
          melhor_envio_order_id: string | null;
          melhor_envio_protocol: string | null;
          selected_service_id: string | null;
          selected_service_name: string | null;
          shipping_price: number | null;
          shipping_deadline: number | null;
          tracking_url: string | null;
          label_status: string | null;
          webhook_payload: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          store_id?: string;
          order_id?: string | null;
          user_id?: string | null;
          customer_name?: string;
          address?: string;
          status?: string;
          tracking_code?: string | null;
          carrier?: string | null;
          estimated_delivery_date?: string | null;
          delivered_at?: string | null;
          notes?: string | null;
          melhor_envio_order_id?: string | null;
          melhor_envio_protocol?: string | null;
          selected_service_id?: string | null;
          selected_service_name?: string | null;
          shipping_price?: number | null;
          shipping_deadline?: number | null;
          tracking_url?: string | null;
          label_status?: string | null;
          webhook_payload?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          store_id?: string;
          order_id?: string | null;
          user_id?: string | null;
          customer_name?: string;
          address?: string;
          status?: string;
          tracking_code?: string | null;
          carrier?: string | null;
          estimated_delivery_date?: string | null;
          delivered_at?: string | null;
          notes?: string | null;
          melhor_envio_order_id?: string | null;
          melhor_envio_protocol?: string | null;
          selected_service_id?: string | null;
          selected_service_name?: string | null;
          shipping_price?: number | null;
          shipping_deadline?: number | null;
          tracking_url?: string | null;
          label_status?: string | null;
          webhook_payload?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      melhor_envio_tokens: {
        Row: {
          id: string;
          access_token: string;
          refresh_token: string;
          expires_at: string;
          refresh_expires_at: string | null;
          scopes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          access_token: string;
          refresh_token: string;
          expires_at: string;
          refresh_expires_at?: string | null;
          scopes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          access_token?: string;
          refresh_token?: string;
          expires_at?: string;
          refresh_expires_at?: string | null;
          scopes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      products: {
        Row: {
          id: string;
          store_id: string;
          name: string;
          model: string | null;
          price: number;
          cost: number;
          description: string;
          imageUrl: string | null;
          stock_quantity: number;
          stock_reserved: number;
          stock_minimum: number;
          is_featured: boolean;
          is_offer: boolean;
          offer_price: number | null;
          offer_badge: string;
          offer_ends_at: string | null;
          offer_sold_percent: number;
          shipping_weight: number | null;
          shipping_width: number | null;
          shipping_height: number | null;
          shipping_length: number | null;
          shipping_insurance_value: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          store_id?: string;
          name: string;
          model?: string | null;
          price: number;
          cost: number;
          description: string;
          imageUrl?: string | null;
          stock_quantity?: number;
          stock_reserved?: number;
          stock_minimum?: number;
          is_featured?: boolean;
          is_offer?: boolean;
          offer_price?: number | null;
          offer_badge?: string;
          offer_ends_at?: string | null;
          offer_sold_percent?: number;
          shipping_weight?: number | null;
          shipping_width?: number | null;
          shipping_height?: number | null;
          shipping_length?: number | null;
          shipping_insurance_value?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          store_id?: string;
          name?: string;
          model?: string | null;
          price?: number;
          cost?: number;
          description?: string;
          imageUrl?: string | null;
          stock_quantity?: number;
          stock_reserved?: number;
          stock_minimum?: number;
          is_featured?: boolean;
          is_offer?: boolean;
          offer_price?: number | null;
          offer_badge?: string;
          offer_ends_at?: string | null;
          offer_sold_percent?: number;
          shipping_weight?: number | null;
          shipping_width?: number | null;
          shipping_height?: number | null;
          shipping_length?: number | null;
          shipping_insurance_value?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      stores: {
        Row: {
          id: string;
          name: string;
          region: string;
          active: boolean;
          sender_document: string | null;
          sender_email: string | null;
          sender_phone: string | null;
          sender_postal_code: string | null;
          sender_address: string | null;
          sender_number: string | null;
          sender_complement: string | null;
          sender_district: string | null;
          sender_city: string | null;
          sender_state: string | null;
          default_package_weight: number;
          default_package_width: number;
          default_package_height: number;
          default_package_length: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          region: string;
          active?: boolean;
          sender_document?: string | null;
          sender_email?: string | null;
          sender_phone?: string | null;
          sender_postal_code?: string | null;
          sender_address?: string | null;
          sender_number?: string | null;
          sender_complement?: string | null;
          sender_district?: string | null;
          sender_city?: string | null;
          sender_state?: string | null;
          default_package_weight?: number;
          default_package_width?: number;
          default_package_height?: number;
          default_package_length?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          region?: string;
          active?: boolean;
          sender_document?: string | null;
          sender_email?: string | null;
          sender_phone?: string | null;
          sender_postal_code?: string | null;
          sender_address?: string | null;
          sender_number?: string | null;
          sender_complement?: string | null;
          sender_district?: string | null;
          sender_city?: string | null;
          sender_state?: string | null;
          default_package_weight?: number;
          default_package_width?: number;
          default_package_height?: number;
          default_package_length?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      users: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          phone: string | null;
          document: string | null;
          address: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          phone?: string | null;
          document?: string | null;
          address?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          phone?: string | null;
          document?: string | null;
          address?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      clear_active_offer: {
        Args: {
          store_id_value: string;
        };
        Returns: undefined;
      };
      current_admin: {
        Args: Record<PropertyKey, never>;
        Returns: Database['public']['Tables']['admins']['Row'];
      };
      current_admin_role: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
      get_current_admin_stores: {
        Args: Record<PropertyKey, never>;
        Returns: Array<{
          id: string;
          name: string;
          region: string;
        }>;
      };
      has_admin_role: {
        Args: {
          allowed_roles: string[];
        };
        Returns: boolean;
      };
      has_store_access: {
        Args: {
          store_id_value: string;
        };
        Returns: boolean;
      };
      set_active_offer: {
        Args: {
          product_id: string;
          offer_price_value: number | null;
          offer_badge_value: string;
          offer_ends_at_value: string | null;
          offer_sold_percent_value: number;
          store_id_value: string;
        };
        Returns: Database['public']['Tables']['products']['Row'];
      };
      set_product_featured: {
        Args: {
          product_id: string;
          featured: boolean;
          store_id_value: string;
        };
        Returns: Database['public']['Tables']['products']['Row'];
      };
      update_admin_personalization: {
        Args: {
          theme_id_value: 'corporate' | 'graphite' | 'emerald';
          store_logo_url_value: string | null;
        };
        Returns: Database['public']['Tables']['admins']['Row'];
      };
      update_admin_profile: {
        Args: {
          region_value: string;
          store_name_value: string;
        };
        Returns: Database['public']['Tables']['admins']['Row'];
      };
      update_store_shipping: {
        Args: {
          store_id_value: string;
          sender_document_value: string | null;
          sender_email_value: string | null;
          sender_phone_value: string | null;
          sender_postal_code_value: string | null;
          sender_address_value: string | null;
          sender_number_value: string | null;
          sender_complement_value: string | null;
          sender_district_value: string | null;
          sender_city_value: string | null;
          sender_state_value: string | null;
          default_package_weight_value: number;
          default_package_width_value: number;
          default_package_height_value: number;
          default_package_length_value: number;
        };
        Returns: Database['public']['Tables']['stores']['Row'];
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DefaultSchema = Database[Extract<keyof Database, 'public'>];

export type Tables<TableName extends keyof DefaultSchema['Tables']> =
  DefaultSchema['Tables'][TableName]['Row'];

export type TablesInsert<TableName extends keyof DefaultSchema['Tables']> =
  DefaultSchema['Tables'][TableName]['Insert'];

export type TablesUpdate<TableName extends keyof DefaultSchema['Tables']> =
  DefaultSchema['Tables'][TableName]['Update'];
