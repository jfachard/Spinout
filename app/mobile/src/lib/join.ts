import * as Linking from 'expo-linking';

import { ApiError } from './api';

export const SESSION_CODE_RE = /^[A-Z0-9]{6}$/;

/** Web join link for QR / share — matches web `origin/?join=CODE`. */
export function getJoinUrl(code: string): string {
  const normalized = code.trim().toUpperCase();
  const webUrl = process.env.EXPO_PUBLIC_WEB_URL?.replace(/\/$/, '');
  if (webUrl) {
    return `${webUrl}/?join=${normalized}`;
  }
  return Linking.createURL('/', { queryParams: { join: normalized } });
}

/** Parses QR payloads (`https://…/?join=SUNSET`) or raw 6-char codes. */
export function parseJoinCode(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  try {
    const url = new URL(trimmed);
    const join = url.searchParams.get('join');
    if (join) {
      const upper = join.toUpperCase();
      return SESSION_CODE_RE.test(upper) ? upper : null;
    }
  } catch {
    // not a URL
  }

  const upper = trimmed.toUpperCase();
  return SESSION_CODE_RE.test(upper) ? upper : null;
}

export function joinErrorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.status === 404) return 'No session with this code.';
    if (err.status === 403) return 'This session is closed.';
    return err.message;
  }
  return "Couldn't join the session.";
}

export function createErrorMessage(err: unknown): string {
  if (err instanceof ApiError) return err.message;
  return "Couldn't create the session.";
}
