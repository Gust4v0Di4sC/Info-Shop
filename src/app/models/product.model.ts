export interface Product {
    id?: string; // Tornar opcional para lidar com casos de criação de produtos
    name: string;
    model?: string;
    price: number;
    cost: number;
    description: string;
    imageUrl?: string;
  }