import type { PaymentMethod } from '@/pages/pos/interfaces';

export type OrderStatus =
  | 'DRAFT'
  | 'SENT_TO_KITCHEN'
  | 'PREPARING'
  | 'READY'
  | 'SERVED'
  | 'PAYMENT_PENDING'
  | 'PAID'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'REFUNDED'
  | 'VOIDED';

export interface OrderItemView {
  id: string;
  menuItem: { name: string };
  menuItemId: string;
  quantity: string;
  status: string;
  totalPrice: string;
  unitPrice: string;
  variation?: { name: string };
}

export interface OrderPaymentView {
  amount: string;
  id: string;
  method: PaymentMethod;
  paidAt: string;
  reference?: string;
}

export interface OrderView {
  completedAt?: string;
  createdAt: string;
  customer?: { name: string; phone: string };
  deliveryAssignment?: { deliveryAddress?: string; riderId?: string; status: string };
  grandTotal: string;
  id: string;
  items: OrderItemView[];
  orderNumber: string;
  payments: OrderPaymentView[];
  status: OrderStatus;
  subtotal: string;
  table?: { name: string };
  type: 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY';
}

export interface OrdersResponse {
  metrics: {
    cancelled: number;
    completed: number;
    open: number;
    total: number;
  };
  orders: OrderView[];
}
