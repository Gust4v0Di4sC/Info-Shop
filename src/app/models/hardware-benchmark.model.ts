export interface HardwareBenchmarkMessage {
  role: 'user' | 'model';
  text: string;
}

export interface HardwareBenchmarkRequest {
  productId: number;
  productContext: {
    name: string;
    model: string | null;
    category: string;
    description: string | null;
    price: number | null;
    offerPrice: number | null;
  };
  currentHardware: string;
  message: string;
  history: HardwareBenchmarkMessage[];
}

export interface HardwareBenchmarkResponse {
  answer: string;
}
