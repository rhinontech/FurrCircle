const BASE_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001') + '/api';

const getToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem('pawshub_admin_token');
    return raw || null;
  } catch {
    return null;
  }
};

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

const request = async <T = unknown>(
  path: string,
  method: HttpMethod = 'GET',
  body?: unknown
): Promise<T> => {
  const token = getToken();

  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (token) (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error((data as { message?: string }).message || `Request failed: ${res.status}`);
  }

  return data as T;
};

export const adminApi = {
  get: <T = unknown>(path: string) => request<T>(path, 'GET'),
  post: <T = unknown>(path: string, body?: unknown) => request<T>(path, 'POST', body),
  patch: <T = unknown>(path: string, body?: unknown) => request<T>(path, 'PATCH', body),
  delete: <T = unknown>(path: string) => request<T>(path, 'DELETE'),
};
