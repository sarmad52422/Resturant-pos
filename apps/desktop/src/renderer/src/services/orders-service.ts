import { apiRequest } from '../lib/api-client';
import type { OrderStatus, OrderView, OrdersResponse } from '../pages/orders/interfaces';

interface OrdersListInput {
  dateScope: 'today' | 'all';
  search: string;
  status: OrderStatus | 'ALL';
}

export const ordersService = {
  detail: (orderId: string) => apiRequest<OrderView>({ method: 'GET', url: `/orders/${orderId}` }),
  list: (input: OrdersListInput) =>
    apiRequest<OrdersResponse>({
      method: 'GET',
      url: ordersPath(input.dateScope, input.search, input.status),
    }),
  voidItem: (orderId: string, itemId: string, reason: string) =>
    apiRequest<OrderView>({
      data: { reason },
      method: 'PATCH',
      url: `/orders/${orderId}/items/${itemId}/void`,
    }),
  voidOrder: (orderId: string, reason: string) =>
    apiRequest<OrderView>({ data: { reason }, method: 'PATCH', url: `/orders/${orderId}/void` }),
};

function ordersPath(dateScope: 'today' | 'all', search: string, status: OrderStatus | 'ALL') {
  const params = new URLSearchParams();
  params.set('date', dateScope);
  if (search.trim()) params.set('search', search.trim());
  if (status !== 'ALL') params.set('status', status);
  return `/orders?${params.toString()}`;
}
