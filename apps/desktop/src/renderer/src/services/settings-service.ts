import { apiRequest } from '../lib/api-client';
import type { SettingRecord } from '../pages/settings/interfaces';

interface SettingsPayload {
  settings: Array<{
    group: string;
    key: string;
    value: unknown;
  }>;
}

export const settingsService = {
  list: () => apiRequest<SettingRecord[]>({ method: 'GET', url: '/settings' }),
  update: (input: SettingsPayload) =>
    apiRequest<SettingRecord[]>({ data: input, method: 'PATCH', url: '/settings' }),
};
