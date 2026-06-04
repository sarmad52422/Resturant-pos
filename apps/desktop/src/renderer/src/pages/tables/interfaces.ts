import type { RestaurantTable } from '@/components/table-card';

export interface TablesResponse {
  areas: string[];
  tables: RestaurantTable[];
  metrics: {
    activeTables: number;
    freeTables: number;
    occupiedTables: number;
    totalCovers: number;
  };
}
