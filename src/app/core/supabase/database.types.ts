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
          role: 'gerente' | 'vendedor' | 'estoquista';
          active: boolean;
          created_at: string;
          theme_id: 'corporate' | 'graphite' | 'emerald';
          store_logo_url: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          role?: 'gerente' | 'vendedor' | 'estoquista';
          active?: boolean;
          created_at?: string;
          theme_id?: 'corporate' | 'graphite' | 'emerald';
          store_logo_url?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          role?: 'gerente' | 'vendedor' | 'estoquista';
          active?: boolean;
          created_at?: string;
          theme_id?: 'corporate' | 'graphite' | 'emerald';
          store_logo_url?: string | null;
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
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
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
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
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
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      products: {
        Row: {
          id: string;
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
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
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
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
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
        Args: Record<PropertyKey, never>;
        Returns: undefined;
      };
      set_active_offer: {
        Args: {
          product_id: string;
          offer_price_value: number | null;
          offer_badge_value: string;
          offer_ends_at_value: string | null;
          offer_sold_percent_value: number;
        };
        Returns: Database['public']['Tables']['products']['Row'];
      };
      set_product_featured: {
        Args: {
          product_id: string;
          featured: boolean;
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
