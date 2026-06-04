import { apiRequest } from '@/lib/api-client';
import type { Shift, ShiftsResponse } from '@/pages/shifts/interfaces';

interface OpenShiftInput {
  notes?: string;
  openingCash: number;
  terminalDevice?: string;
}

interface CloseShiftInput {
  countedCash: number;
  expenses: number;
  notes?: string;
}

export const shiftsService = {
  close: (shiftId: string, input: CloseShiftInput) =>
    apiRequest<Shift>({ data: input, method: 'PATCH', url: `/shifts/${shiftId}/close` }),
  list: () => apiRequest<ShiftsResponse>({ method: 'GET', url: '/shifts' }),
  open: (input: OpenShiftInput) => apiRequest<Shift>({ data: input, method: 'POST', url: '/shifts/open' }),
  recalculate: (shiftId: string) =>
    apiRequest<Shift>({ method: 'PATCH', url: `/shifts/${shiftId}/recalculate` }),
};
