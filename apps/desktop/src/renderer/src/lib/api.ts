const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:4300';

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

export async function apiFetch<T>(
  path: string,
  init?: RequestInit,
  accessToken = readStoredToken(),
): Promise<T> {
  const headers = new Headers(init?.headers);
  headers.set('Content-Type', 'application/json');
  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`);

  const response = await fetch(`${apiUrl}${path}`, {
    headers,
    ...init,
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `RestaurantOS API error ${response.status}`);
  }

  return response.json() as Promise<T>;
}
