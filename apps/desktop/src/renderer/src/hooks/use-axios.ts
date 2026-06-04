import type { AxiosRequestConfig } from 'axios';
import { useCallback, useMemo, useState } from 'react';
import { apiRequest } from '@/lib/api-client';
import { normalizeApiError, type AppApiError } from '@/lib/api-error';

export function useAxios() {
  const [error, setError] = useState<AppApiError | undefined>();
  const [loading, setLoading] = useState(false);

  const request = useCallback(async <T>(config: AxiosRequestConfig) => {
    setLoading(true);
    setError(undefined);
    try {
      return await apiRequest<T>(config);
    } catch (caught) {
      const normalized = normalizeApiError(caught);
      setError(normalized);
      throw caught;
    } finally {
      setLoading(false);
    }
  }, []);

  return useMemo(
    () => ({
      delete: <T>(url: string) => request<T>({ method: 'DELETE', url }),
      error,
      errorMessage: error?.message,
      get: <T>(url: string) => request<T>({ method: 'GET', url }),
      loading,
      patch: <T, B = unknown>(url: string, data?: B) => request<T>({ data, method: 'PATCH', url }),
      post: <T, B = unknown>(url: string, data?: B) => request<T>({ data, method: 'POST', url }),
      put: <T, B = unknown>(url: string, data?: B) => request<T>({ data, method: 'PUT', url }),
      request,
      resetError: () => setError(undefined),
    }),
    [error, loading, request],
  );
}

export const useAxious = useAxios;
