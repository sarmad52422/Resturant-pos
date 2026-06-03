export interface Unit {
  id: string;
  name: string;
  symbol: string;
}

export interface Supplier {
  address?: string;
  contactPerson?: string;
  id: string;
  currentPayable: string;
  ledgers?: SupplierLedger[];
  name: string;
  notes?: string;
  openingBalance?: string;
  phone?: string;
  purchases?: SupplierPurchaseSummary[];
  _count?: {
    ledgers: number;
    purchases: number;
  };
}

export interface SupplierLedger {
  id: string;
  balance: string;
  createdAt: string;
  credit: string;
  debit: string;
  notes?: string;
  paymentMethod?: PaymentMethod;
  reference?: string;
}

export interface SupplierPurchaseSummary {
  id: string;
  invoiceNumber?: string;
  purchaseDate: string;
  remainingAmount: string;
  totalCost: string;
}

export interface InventoryItem {
  id: string;
  active: boolean;
  averageCost: string;
  category?: string;
  currentStock: string;
  minimumStockLevel: string;
  name: string;
  purchaseUnitId: string;
  usageUnitId: string;
}

export interface InventoryResponse {
  items: InventoryItem[];
  suppliers: Supplier[];
  units: Unit[];
  metrics: {
    activeItems: number;
    lowStockItems: number;
    totalStockValue: string;
  };
}

export interface PurchaseItem {
  id: string;
  inventoryItem: { id: string; name: string };
  quantity: string;
  totalCost: string;
  unit: Unit;
  unitCost: string;
}

export interface Purchase {
  id: string;
  invoiceNumber?: string;
  items: PurchaseItem[];
  paidAmount: string;
  purchaseDate: string;
  remainingAmount: string;
  supplier: Supplier;
  totalCost: string;
}

export type PaymentMethod = 'CASH' | 'CARD' | 'BANK_TRANSFER' | 'JAZZCASH_EASYPAISA' | 'ONLINE' | 'CUSTOMER_CREDIT';

export interface PurchaseRow {
  id: string;
  inventoryItemId: string;
  quantity: string;
  unitCost: string;
  unitId: string;
}

export interface SupplierPayment {
  ledger: SupplierLedger;
  supplier: Supplier;
}
