import type { PrintMode, SettingRecord } from './interfaces';

export function readSetting<T>(settings: SettingRecord[], key: string, fallback: T): T {
  const setting = settings.find((item) => item.key === key);
  return setting?.value === undefined ? fallback : (setting.value as T);
}

export function readPrintMode(settings: SettingRecord[], key: string, fallback: PrintMode): PrintMode {
  const value = readSetting(settings, key, fallback);
  return value === 'network' || value === 'device' || value === 'os' ? value : fallback;
}
