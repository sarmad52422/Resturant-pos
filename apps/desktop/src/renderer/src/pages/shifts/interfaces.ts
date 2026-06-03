export interface ShiftStaff {
  id: string;
  name: string;
  phone?: string;
  userId?: string;
}

export interface ShiftTotals {
  cardSales: string;
  cashSales: string;
  creditSales: string;
  refunds: string;
}

export interface Shift {
  id: string;
  cardSales: string;
  cashSales: string;
  closedAt?: string;
  countedCash?: string;
  creditSales: string;
  difference?: string;
  expectedCash: string;
  expenses: string;
  liveTotals: ShiftTotals;
  notes?: string;
  openedAt: string;
  openingCash: string;
  refunds: string;
  staff: ShiftStaff;
  staffId: string;
  status: 'OPEN' | 'CLOSED';
  terminalDevice?: string;
}

export interface ShiftsResponse {
  activeShift?: Shift;
  metrics: {
    closedToday: number;
    myShiftOpen: boolean;
    openShifts: number;
    totalDifferences: string;
  };
  shifts: Shift[];
}
