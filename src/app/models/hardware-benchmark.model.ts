export interface HardwareBenchmarkMessage {
  role: 'user' | 'model';
  text: string;
}

export interface HardwareBenchmarkRequest {
  productId: number;
  currentHardware: string;
  message: string;
  history: HardwareBenchmarkMessage[];
}

export interface HardwareBenchmarkResponse {
  answer: string;
}
