import type { AxiosRequestConfig } from 'axios';
import { apiClient, apiRequest } from './api-client';

export async function apiFetch<T>(
  path: string,
  init?: RequestInit,
  accessToken?: string,
): Promise<T> {
  const headers = new Headers(init?.headers);
  const config: AxiosRequestConfig = {
    data: bodyToData(init?.body),
    headers: Object.fromEntries(headers.entries()),
    method: init?.method ?? 'GET',
    url: path,
  };

  if (accessToken) config.headers = { ...config.headers, Authorization: `Bearer ${accessToken}` };
  return apiRequest<T>(config);
}

export const http = {
  delete: <T>(url: string) => apiRequest<T>({ method: 'DELETE', url }),
  get: <T>(url: string) => apiRequest<T>({ method: 'GET', url }),
  patch: <T, B = unknown>(url: string, data?: B) => apiRequest<T>({ data, method: 'PATCH', url }),
  post: <T, B = unknown>(url: string, data?: B) => apiRequest<T>({ data, method: 'POST', url }),
  put: <T, B = unknown>(url: string, data?: B) => apiRequest<T>({ data, method: 'PUT', url }),
};

export { apiClient };

function bodyToData(body: BodyInit | null | undefined) {
  if (!body || typeof body !== 'string') return body;
  try {
    return JSON.parse(body) as unknown;
  } catch {
    return body;
  }
}
