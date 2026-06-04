import axios, { type AxiosRequestConfig } from 'axios';

export const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:4300';

export const apiClient = axios.create({
  baseURL: apiUrl,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = readStoredToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export async function apiRequest<T>(config: AxiosRequestConfig): Promise<T> {
  const response = await apiClient.request<T>(config);
  return response.data;
}

function readStoredToken() {
  try {
    const raw = localStorage.getItem('restaurantos-auth');
    if (!raw) return undefined;
    const parsed = JSON.parse(raw) as { state?: { accessToken?: string } };
    return parsed.state?.accessToken;
  } catch {
    return undefined;
  }
}
