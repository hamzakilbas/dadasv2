export type PaymentMethod = 'Nakit' | 'Kredi Kartı';

export interface Table {
  id: string;
  seq: number;
  name: string;
  section?: string;
}

export interface Product {
  id: string;
  category: string;
  name: string;
  price: number;
  img?: string;
}

export interface OrderItem {
  productId: string;
  qty: number;
  selectedPieces?: number | null; // e.g. 2 pieces out of 4
  totalPieces?: number | null;    // e.g. 4
  note?: string;
}

export interface SessionOrderItem {
  productId: string;
  productName: string;
  category: string;
  qty: number;
  unitPrice: number;
  selectedPieces?: number | null;
  totalPieces?: number | null;
  totalPrice: number;
}

export interface OrderSession {
  id: string;
  tableId: string;
  tableName: string;
  items: SessionOrderItem[];
  totalAmount: number;
  paymentMethod: PaymentMethod;
  paymentDate: string; // ISO string e.g. 2026-10-09T14:32:00
  notes?: string;
  singleBlockProducts: string; // e.g. "2x Su (30.00 ₺), 1x Soda (25.00 ₺), 1x Baklava (180.00 ₺)"
  detailedProductInfo: string;
}

export interface AppSettings {
  restaurantName: string;
  targetEmail: string;
  currency: string;
  phone?: string;
  address?: string;
}

export interface AppData {
  tables: Table[];
  products: Product[];
  orders: Record<string, OrderItem[]>; // tableId -> OrderItem[]
  ordestory: OrderSession[];
  settings: AppSettings;
}
