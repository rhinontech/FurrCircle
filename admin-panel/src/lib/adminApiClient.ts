const BASE_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001') + '/api';

const getToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw =
      window.localStorage.getItem('furrcircle_admin_token')
      || window.localStorage.getItem('pawshub_admin_token');
    return raw || null;
  } catch {
    return null;
  }
};

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

const isDangerModeEnabled = (): boolean => {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem('furrcircle_admin_danger_mode') === 'true';
  } catch {
    return false;
  }
};

const request = async <T = unknown>(
  path: string,
  method: HttpMethod = 'GET',
  body?: unknown
): Promise<T> => {
  if (method !== 'GET') {
    const isCampaignAction = path.startsWith('/admin/campaigns') && method !== 'DELETE';
    if (!isCampaignAction && !isDangerModeEnabled()) {
      if (typeof window !== 'undefined') {
        alert("Action Blocked: Read-only mode is active. Please turn on 'Danger Mode' in the top header to edit or delete data.");
      }
      throw new Error("Read-only mode active. Danger Mode is disabled.");
    }
  }

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

const uploadFile = async (folder: string, file: File): Promise<{ url: string }> => {
  if (!isDangerModeEnabled()) {
    if (typeof window !== 'undefined') {
      alert("Action Blocked: Read-only mode is active. Please turn on 'Danger Mode' in the top header to upload files.");
    }
    throw new Error("Read-only mode active. Danger Mode is disabled.");
  }

  const token = getToken();
  const formData = new FormData();
  formData.append('image', file);

  const res = await fetch(`${BASE_URL}/upload/${folder}`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { message?: string }).message || `Upload failed: ${res.status}`);
  return data as { url: string };
};

export const adminApi = {
  get: <T = unknown>(path: string) => request<T>(path, 'GET'),
  post: <T = unknown>(path: string, body?: unknown) => request<T>(path, 'POST', body),
  put: <T = unknown>(path: string, body?: unknown) => request<T>(path, 'PUT', body),
  patch: <T = unknown>(path: string, body?: unknown) => request<T>(path, 'PATCH', body),
  delete: <T = unknown>(path: string) => request<T>(path, 'DELETE'),
  upload: (folder: string, file: File) => uploadFile(folder, file),
};
