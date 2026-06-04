import { apiRequest } from '@/lib/api-client';
import type { PosCatalogResponse, PosOrder, SettingRecord } from '@/pages/pos/interfaces';
import type { TablesResponse } from '@/pages/tables/interfaces';
import type { PaymentMethod } from '@/pages/pos/interfaces';
import type { OrderType } from '@/store/use-pos-store';

interface CreateOrderInput {
  customerId?: string;
  items: Array<{ menuItemId: string; quantity: number }>;
  tableId?: string;
  type: OrderType;
}

interface PaymentInput {
  amount: number;
  method: PaymentMethod;
  reference?: string;
}

export const posService = {
  catalog: () => apiRequest<PosCatalogResponse>({ method: 'GET', url: '/menu/pos' }),
  createOrder: (input: CreateOrderInput) =>
    apiRequest<PosOrder>({ data: input, method: 'POST', url: '/orders' }),
  floor: () => apiRequest<TablesResponse>({ method: 'GET', url: '/tables' }),
  payOrder: (orderId: string, input: PaymentInput) =>
    apiRequest<PosOrder>({ data: input, method: 'POST', url: `/orders/${orderId}/payments` }),
  settings: () => apiRequest<SettingRecord[]>({ method: 'GET', url: '/settings' }),
  sendToKitchen: (orderId: string) =>
    apiRequest<PosOrder>({ method: 'PATCH', url: `/orders/${orderId}/send-to-kitchen` }),
  voidItem: (orderId: string, itemId: string, reason: string) =>
    apiRequest<PosOrder>({
      data: { reason },
      method: 'PATCH',
      url: `/orders/${orderId}/items/${itemId}/void`,
    }),
  voidOrder: (orderId: string, reason: string) =>
    apiRequest<PosOrder>({ data: { reason }, method: 'PATCH', url: `/orders/${orderId}/void` }),
};
