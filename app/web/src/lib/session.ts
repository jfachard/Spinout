import { apiFetch } from "./api";
import { authFetch, isAuthenticated } from "./auth";

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

const MEMBERSHIP_KEY = "spinout.membership";

/** Locally remembers who the current client is inside a session (useful for guests). */
export interface Membership {
  code: string;
  memberId: string;
  guestName?: string;
}

export function storeMembership(membership: Membership) {
  if (typeof window === "undefined") return;
  localStorage.setItem(MEMBERSHIP_KEY, JSON.stringify(membership));
}

export function getMembership(): Membership | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(MEMBERSHIP_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Membership;
  } catch {
    return null;
  }
}

export function clearMembership() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(MEMBERSHIP_KEY);
}

export function createSession(categories: string[] = []) {
  return authFetch<Session>("/session", {
    method: "POST",
    body: JSON.stringify({ categories }),
  });
}

export function joinSession(code: string, guestName?: string) {
  const normalizedCode = code.trim().toUpperCase();
  const body = JSON.stringify({ code: normalizedCode, guestName });

  return isAuthenticated()
    ? authFetch<JoinResponse>("/session/join", { method: "POST", body })
    : apiFetch<JoinResponse>("/session/join", { method: "POST", body });
}
