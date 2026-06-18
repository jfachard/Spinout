import * as SecureStore from 'expo-secure-store';

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

export async function joinSession(code: string, guestName?: string) {
  const normalizedCode = code.trim().toUpperCase();
  const body = JSON.stringify({ code: normalizedCode, guestName });
  const hasToken = (await getAccessToken()) !== null;

  return hasToken
    ? authFetch<JoinResponse>('/session/join', { method: 'POST', body })
    : apiFetch<JoinResponse>('/session/join', { method: 'POST', body });
}
