export interface Customer {
  id: string;
  creditLimit: string;
  currentBalance: string;
  customerType: string;
  email?: string;
  name: string;
  phone: string;
  totalOrders: number;
  _count: { ledgers: number; orders: number };
}

export interface CustomersResponse {
  customers: Customer[];
  metrics: {
    creditCustomers: number;
    receivableBalance: string;
    totalCustomers: number;
  };
}
