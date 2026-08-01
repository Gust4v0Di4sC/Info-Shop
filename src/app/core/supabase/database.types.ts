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
        };
        Insert: {
          id?: string;
          name: string;
          model?: string | null;
          price: number;
          cost: number;
          description: string;
          imageUrl?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          model?: string | null;
          price?: number;
          cost?: number;
          description?: string;
          imageUrl?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
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
