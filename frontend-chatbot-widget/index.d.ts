// TypeScript type definitions (opcional, mejora la DX para usuarios TS)
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  products?: any[];
  actions?: any[];
}

export interface Product {
  id: string;
  name: string;
  price: number;
  image?: string;
  [key: string]: any;
}

export interface ChatWidgetProps {
  // Define props si el widget acepta configuración
}
