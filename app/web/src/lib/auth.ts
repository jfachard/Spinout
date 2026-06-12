import { apiFetch, ApiError } from "./api";

const ACCESS_TOKEN_KEY = "spinout.accessToken";
const REFRESH_TOKEN_KEY = "spinout.refreshToken";

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

export function storeTokens({ accessToken, refreshToken }: AuthTokens) {
  if (typeof window === "undefined") return;
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function isAuthenticated(): boolean {
  return getAccessToken() !== null;
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function clearTokens() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
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

  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    clearTokens();
    throw new ApiError(401, "Session expirée");
  }

  refreshPromise = (async () => {
    try {
      const tokens = await apiFetch<AuthTokens>("/auth/refresh", {
        method: "POST",
        body: JSON.stringify({ refreshToken }),
      });
      storeTokens(tokens);
      return tokens;
    } catch (err) {
      clearTokens();
      throw err;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

/** Authenticated fetch — injects Bearer token, auto-refreshes on 401. */
export async function authFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getAccessToken();
  if (!token) throw new ApiError(401, "Non authentifié");

  try {
    return await apiFetch<T>(path, withBearer(options, token));
  } catch (err) {
    if (!(err instanceof ApiError) || err.status !== 401) throw err;

    await refreshTokens();
    const newToken = getAccessToken();
    if (!newToken) throw new ApiError(401, "Session expirée");

    return apiFetch<T>(path, withBearer(options, newToken));
  }
}

export async function logout() {
  try {
    if (getAccessToken()) {
      await authFetch("/auth/logout", { method: "POST" });
    }
  } catch {
    // clear local session even if server call fails
  } finally {
    clearTokens();
  }
}

export function register(payload: RegisterPayload) {
  return apiFetch<AuthTokens>("/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function login(payload: LoginPayload) {
  return apiFetch<AuthTokens>("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
