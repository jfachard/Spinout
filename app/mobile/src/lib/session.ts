import * as SecureStore from 'expo-secure-store';

import type { ActivityDto } from '@spinout/shared';

import { apiFetch } from './api';
import { authFetch, getAccessToken } from './auth';

export interface SessionMember {
  id: string;
  userId: string | null;
  guestName: string | null;
  isHost?: boolean;
}

export interface Session {
  id: string;
  code: string;
  hostId: string;
  categories: string[];
  status: string;
  members?: SessionMember[];
}

export interface JoinResponse {
  session: Session;
  member: SessionMember;
}

const MEMBERSHIP_KEY = 'spinout.membership';

export interface Membership {
  code: string;
  memberId: string;
  guestName?: string;
}

export async function storeMembership(membership: Membership) {
  await SecureStore.setItemAsync(MEMBERSHIP_KEY, JSON.stringify(membership));
}

export async function getMembership(): Promise<Membership | null> {
  const raw = await SecureStore.getItemAsync(MEMBERSHIP_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Membership;
  } catch {
    return null;
  }
}

export async function clearMembership() {
  await SecureStore.deleteItemAsync(MEMBERSHIP_KEY);
}

export function createSession(categories: string[] = []) {
  return authFetch<Session>('/session', {
    method: 'POST',
    body: JSON.stringify({ categories }),
  });
}

export function fetchSession(code: string) {
  return apiFetch<Session>(`/session/${code.trim().toUpperCase()}`);
}

export async function storeSessionHistory(code: string, history: unknown) {
  const key = `spinout.history.${code.trim().toUpperCase()}`;
  await SecureStore.setItemAsync(key, JSON.stringify(history));
}

export async function getStoredSessionHistory<T = unknown>(code: string): Promise<T | null> {
  const key = `spinout.history.${code.trim().toUpperCase()}`;
  const raw = await SecureStore.getItemAsync(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export interface HistorySpin {
  id: string;
  spinNumber: number;
  result: string;
  activity: ActivityDto;
  votes: { value: boolean }[];
}

export interface SessionHistory {
  session: { id: string; code: string; status: string };
  spins: HistorySpin[];
}

export function fetchSessionHistory(code: string) {
  return apiFetch<SessionHistory>(`/session/${code.trim().toUpperCase()}/history`);
}

export async function joinSession(code: string, guestName?: string) {
  const normalizedCode = code.trim().toUpperCase();
  const body = JSON.stringify({ code: normalizedCode, guestName });
  const hasToken = (await getAccessToken()) !== null;

  return hasToken
    ? authFetch<JoinResponse>('/session/join', { method: 'POST', body })
    : apiFetch<JoinResponse>('/session/join', { method: 'POST', body });
}
