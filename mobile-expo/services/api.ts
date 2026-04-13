import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface RequestOptions {
  method?: HttpMethod;
  body?: unknown;
  headers?: Record<string, string>;
}

const normalizeBaseUrl = (value?: string | null) => {
  const fallback = 'http://127.0.0.1:5001';
  return (value || fallback).replace(/\/+$/, '');
};

const getBaseUrl = () => {
  const expoExtra = Constants.expoConfig?.extra;
  return normalizeBaseUrl(process.env.EXPO_PUBLIC_API_URL || (expoExtra?.apiUrl as string | undefined));
};

const baseRoot = getBaseUrl();
const BASE_URL = /\/api$/.test(baseRoot) ? baseRoot : `${baseRoot}/api`;

let authToken: string | null = null;

export const setAuthToken = (token: string | null) => {
  authToken = token;
};

export const clearAuthToken = () => {
  authToken = null;
};

const getErrorMessage = (data: unknown, status: number) => {
  if (data && typeof data === 'object') {
    const maybeMessage = (data as { message?: string; error?: string }).message || (data as { error?: string }).error;
    if (maybeMessage) {
      return maybeMessage;
    }
  }

  return `Request failed: ${status}`;
};

const parseResponse = async (response: Response) => {
  const text = await response.text();
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
};

export const apiCall = async <T = unknown>(endpoint: string, options: RequestOptions = {}): Promise<T> => {
  const { method = 'GET', body, headers: extraHeaders = {} } = options;
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const token = authToken ?? (await AsyncStorage.getItem('user_token'));
  const headers: Record<string, string> = {
    ...extraHeaders,
  };

  if (body !== undefined && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${normalizedEndpoint}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const data = await parseResponse(response);

  if (!response.ok) {
    throw new Error(getErrorMessage(data, response.status));
  }

  return data as T;
};

export const api = {
  get: <T = unknown>(endpoint: string) => apiCall<T>(endpoint, { method: 'GET' }),
  post: <T = unknown>(endpoint: string, body?: unknown) => apiCall<T>(endpoint, { method: 'POST', body }),
  put: <T = unknown>(endpoint: string, body?: unknown) => apiCall<T>(endpoint, { method: 'PUT', body }),
  patch: <T = unknown>(endpoint: string, body?: unknown) => apiCall<T>(endpoint, { method: 'PATCH', body }),
  delete: <T = unknown>(endpoint: string) => apiCall<T>(endpoint, { method: 'DELETE' }),
};
