import { apiRequest } from '@/lib/api-client';
import type { CurrentOrder, RestaurantTable, TableStatus } from '@/components/table-card';
import type { TablesResponse } from '@/pages/tables/interfaces';

interface CreateTableInput {
  area: string;
  capacity: number;
  displayOrder: number;
  name: string;
}

export const tablesService = {
  create: (input: CreateTableInput) =>
    apiRequest<RestaurantTable>({ data: input, method: 'POST', url: '/tables' }),
  floor: () => apiRequest<TablesResponse>({ method: 'GET', url: '/tables' }),
  setStatus: (tableId: string, status: TableStatus) =>
    apiRequest<RestaurantTable>({ data: { status }, method: 'PATCH', url: `/tables/${tableId}/status` }),
  startOrder: (tableId: string) =>
    apiRequest<CurrentOrder>({ method: 'POST', url: `/tables/${tableId}/start-order` }),
};
