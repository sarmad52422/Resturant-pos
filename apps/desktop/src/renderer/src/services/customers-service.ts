import { apiRequest } from '@/lib/api-client';
import type { Customer, CustomersResponse } from '@/pages/customers/interfaces';

interface CreateCustomerInput {
  creditLimit: number;
  customerType: string;
  name: string;
  phone: string;
}

export const customersService = {
  create: (input: CreateCustomerInput) =>
    apiRequest<Customer>({ data: input, method: 'POST', url: '/customers' }),
  list: () => apiRequest<CustomersResponse>({ method: 'GET', url: '/customers' }),
};
