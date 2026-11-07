import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL, GITHUB_JSON_URL } from './constants';

type ApiOptions = Omit<RequestInit, 'headers'> & {
  headers?: Record<string, string>;
};

const AUTH_TOKEN_KEY = 'digital_watch_auth_token';
let authToken: string | null = null;

export async function loadAuthToken(): Promise<string | null> {
  try {
    const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
    authToken = token;
    return token;
  } catch {
    return null;
  }
}

export async function setAuthToken(token: string | null): Promise<void> {
  authToken = token;
  try {
    if (token) {
      await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
    } else {
      await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
    }
  } catch (e) {
    console.error('Failed to store auth token:', e);
  }
}

export async function clearAuthSession(): Promise<void> {
  authToken = null;
  try {
    await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
  } catch (e) {
    console.error('Failed to clear auth session:', e);
  }
}

export async function apiCall(endpoint: string, options: ApiOptions = {}): Promise<any> {
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${API_BASE_URL}${path}`;

  const config: ApiOptions = {
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      ...(options.headers || {}),
    },
    ...options,
  };

  const response = await fetch(url, config);
  const text = await response.text();

  let data: any;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!response.ok) {
    const errorMessage = data?.error || data?.message || data || `HTTP ${response.status}`;
    throw new Error(typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage));
  }

  return data;
}

/**
 * Fetch products from GitHub JSON (directly from GitHub raw URL)
 */
export async function fetchFromGitHubJSON(): Promise<any[]> {
  try {
    const res = await fetch(GITHUB_JSON_URL);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.warn('Failed to load JSON from GitHub URL:', error);
    return [];
  }
}
