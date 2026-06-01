const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:4300';

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${apiUrl}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
    ...init,
  });

  if (!response.ok) {
    throw new Error(`RestaurantOS API error ${response.status}`);
  }

  return response.json() as Promise<T>;
}
