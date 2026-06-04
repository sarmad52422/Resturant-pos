import { apiRequest } from '../lib/api-client';
import type {
  InventoryItem,
  InventoryResponse,
  PaymentMethod,
  Purchase,
  Supplier,
  SupplierPayment,
} from '../pages/inventory/interfaces';

interface CreateItemInput {
  active?: boolean;
  averageCost: number;
  category?: string;
  conversionRate: number;
  currentStock: number;
  lastPurchaseCost: number;
  minimumStockLevel: number;
  name: string;
  purchaseUnitId: string;
  supplierId?: string;
  usageUnitId: string;
}

interface PurchaseInput {
  invoiceNumber?: string;
  items: Array<{ inventoryItemId: string; quantity: number; unitCost: number; unitId: string }>;
  paidAmount: number;
  paymentMethod: PaymentMethod;
  purchaseDate: string;
  supplierId: string;
}

interface SupplierInput {
  address?: string;
  contactPerson?: string;
  name: string;
  notes?: string;
  openingBalance: number;
  phone?: string;
}

interface SupplierPaymentInput {
  amount: number;
  notes?: string;
  paymentMethod: PaymentMethod;
  reference?: string;
}

export const inventoryService = {
  createItem: (input: CreateItemInput) =>
    apiRequest<InventoryItem>({ data: input, method: 'POST', url: '/inventory/items' }),
  createPurchase: (input: PurchaseInput) =>
    apiRequest<Purchase>({ data: input, method: 'POST', url: '/inventory/purchases' }),
  createSupplier: (input: SupplierInput) =>
    apiRequest<Supplier>({ data: input, method: 'POST', url: '/inventory/suppliers' }),
  list: () => apiRequest<InventoryResponse>({ method: 'GET', url: '/inventory' }),
  purchases: () => apiRequest<Purchase[]>({ method: 'GET', url: '/inventory/purchases' }),
  recordSupplierPayment: (supplierId: string, input: SupplierPaymentInput) =>
    apiRequest<SupplierPayment>({
      data: input,
      method: 'POST',
      url: `/inventory/suppliers/${supplierId}/payments`,
    }),
  suppliers: () => apiRequest<Supplier[]>({ method: 'GET', url: '/inventory/suppliers' }),
  updateItem: (itemId: string, patch: Partial<Pick<InventoryItem, 'active'>>) =>
    apiRequest<InventoryItem>({ data: patch, method: 'PATCH', url: `/inventory/items/${itemId}` }),
};
