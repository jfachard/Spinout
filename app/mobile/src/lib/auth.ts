import * as SecureStore from 'expo-secure-store';

import { apiFetch, ApiError } from './api';

const ACCESS_TOKEN_KEY = 'spinout.accessToken';
const REFRESH_TOKEN_KEY = 'spinout.refreshToken';
const USERNAME_KEY = 'spinout.username';
const GUEST_NAME_KEY = 'spinout.guestName';

export interface AuthUser {
  id: string;
  username: string;
  email: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface RegisterPayload {
  username: string;
  email: string;
  password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export async function storeTokens({ accessToken, refreshToken }: AuthTokens) {
  await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken);
  await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
}

export async function getAccessToken(): Promise<string | null> {
  return SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
}

export async function isAuthenticated(): Promise<boolean> {
  const token = await getAccessToken();
  return token !== null;
}

export async function getRefreshToken(): Promise<string | null> {
  return SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
}

export async function clearTokens() {
  await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
  await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
  await SecureStore.deleteItemAsync(USERNAME_KEY);
}

export async function storeUsername(username: string) {
  await SecureStore.setItemAsync(USERNAME_KEY, username);
}

export async function getStoredUsername(): Promise<string | null> {
  return SecureStore.getItemAsync(USERNAME_KEY);
}

export async function storeGuestDisplayName(name: string) {
  await SecureStore.setItemAsync(GUEST_NAME_KEY, name.trim());
}

export async function getGuestDisplayName(): Promise<string | null> {
  return SecureStore.getItemAsync(GUEST_NAME_KEY);
}

export async function fetchMe() {
  return authFetch<AuthUser>('/auth/me');
}

function withBearer(options: RequestInit, token: string): RequestInit {
  return {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
    },
  };
}

let refreshPromise: Promise<AuthTokens> | null = null;

export async function refreshTokens(): Promise<AuthTokens> {
  if (refreshPromise) return refreshPromise;

  const refreshToken = await getRefreshToken();
  if (!refreshToken) {
    await clearTokens();
    throw new ApiError(401, 'Session expirée');
  }

  refreshPromise = (async () => {
    try {
      const tokens = await apiFetch<AuthTokens>('/auth/refresh', {
        method: 'POST',
        body: JSON.stringify({ refreshToken }),
      });
      await storeTokens(tokens);
      return tokens;
    } catch (err) {
      await clearTokens();
      throw err;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

export async function authFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await getAccessToken();
  if (!token) throw new ApiError(401, 'Non authentifié');

  try {
    return await apiFetch<T>(path, withBearer(options, token));
  } catch (err) {
    if (!(err instanceof ApiError) || err.status !== 401) throw err;

    await refreshTokens();
    const newToken = await getAccessToken();
    if (!newToken) throw new ApiError(401, 'Session expirée');

    return apiFetch<T>(path, withBearer(options, newToken));
  }
}

export async function logout() {
  try {
    if (await getAccessToken()) {
      await authFetch('/auth/logout', { method: 'POST' });
    }
  } catch {
    // clear local session even if server call fails
  } finally {
    await clearTokens();
  }
}

export function register(payload: RegisterPayload) {
  return apiFetch<AuthTokens>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function login(payload: LoginPayload) {
  return apiFetch<AuthTokens>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
