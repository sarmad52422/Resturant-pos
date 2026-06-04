export interface PosCategory {
  id: string;
  name: string;
}

export type CorrectionTarget =
  | { type: 'order'; label: string }
  | { type: 'item'; cartLineId: string; label: string };

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
  id: string;
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

export interface PosOrderItem {
  id: string;
  menuItemId: string;
  menuItem?: {
    name: string;
  };
  quantity: string;
  status: string;
  totalPrice: string;
  unitPrice: string;
}

export interface PosOrder {
  completedAt?: string;
  grandTotal: string;
  id: string;
  items?: PosOrderItem[];
  orderNumber: string;
  paidAt?: string;
  payments: OrderPayment[];
  status: string;
  subtotal: string;
  customer?: PosCustomer | null;
  customerId?: string;
  table?: {
    area?: string;
    capacity?: number;
    id?: string;
    name: string;
    status?: string;
  } | null;
  tableId?: string;
}

export interface PosCustomer {
  creditLimit?: string;
  currentBalance?: string;
  customerType?: string;
  id?: string;
  name: string;
  phone: string;
  totalOrders?: number;
  _count?: { ledgers: number; orders: number };
}

export interface PrinterInfo {
  description?: string;
  displayName?: string;
  isDefault?: boolean;
  name: string;
  status?: number;
}
