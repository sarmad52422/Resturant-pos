export interface PosCategory {
  id: string;
  name: string;
}

export interface PosMenuItem {
  basePrice: string;
  category: PosCategory;
  categoryId: string;
  id: string;
  kitchenStation?: {
    name: string;
  };
  name: string;
  shortName?: string;
}

export interface PosCatalogResponse {
  categories: PosCategory[];
  items: PosMenuItem[];
}

export type PaymentMethod = 'CASH' | 'CARD' | 'BANK_TRANSFER' | 'JAZZCASH_EASYPAISA' | 'ONLINE' | 'CUSTOMER_CREDIT';
export type PrintMode = 'os' | 'network' | 'device';

export interface ReceiptLine {
  name: string;
  price: number;
  quantity: number;
}

export interface SettingRecord {
  key: string;
  value: unknown;
}

export interface OrderPayment {
  amount: string;
  id: string;
  method: PaymentMethod;
  paidAt: string;
  reference?: string;
}

export interface PosOrder {
  completedAt?: string;
  grandTotal: string;
  id: string;
  orderNumber: string;
  paidAt?: string;
  payments: OrderPayment[];
  status: string;
  subtotal: string;
}

export interface PrinterInfo {
  description?: string;
  displayName?: string;
  isDefault?: boolean;
  name: string;
  status?: number;
}
