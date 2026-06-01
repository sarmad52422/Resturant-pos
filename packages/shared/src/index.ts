export const permissions = [
  'order.create',
  'order.send_to_kitchen',
  'order.void',
  'order.refund',
  'order.discount.large',
  'order.edit.completed',
  'stock.adjust',
  'ledger.delete',
  'shift.close.other',
  'settings.update',
  'user.manage',
  'report.view.profit',
] as const;

export type PermissionCode = (typeof permissions)[number];

export const defaultRoles = [
  'Admin',
  'Manager',
  'Cashier',
  'Waiter',
  'Chef',
  'Delivery Rider',
  'Accountant',
] as const;

export type DefaultRole = (typeof defaultRoles)[number];

export type OrderType = 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY';
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

export type KitchenRoute =
  | '/kitchen/all'
  | '/kitchen/burger'
  | '/kitchen/pizza'
  | '/kitchen/juice'
  | '/kitchen/packing';

export interface KitchenTicketItemView {
  id: string;
  orderNumber: string;
  stationSlug: string;
  orderType: OrderType;
  tableName?: string;
  quantity: number;
  itemName: string;
  variationName?: string;
  modifiers: string[];
  addOns: string[];
  notes?: string;
  status: 'NEW' | 'PREPARING' | 'READY' | 'SERVED' | 'CANCELLED';
  sentAt: string;
}

export interface PosMenuItemView {
  id: string;
  name: string;
  shortName?: string;
  categoryId: string;
  price: string;
  taxable: boolean;
  active: boolean;
  preparationMinutes: number;
}
