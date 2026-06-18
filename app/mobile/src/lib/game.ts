import type { ActivityDto } from '@spinout/shared';

import { CATEGORY_META, type CategoryKey } from '@/components/ui/CategoryChip';

export const MIN_SPIN_MS = 4000;

export type GamePhase = 'idle' | 'spinning' | 'voting' | 'result';

export interface VoteSummary {
  yes: number;
  no: number;
  total: number;
}

export interface GameSession {
  id: string;
  code: string;
  hostId: string;
  status: string;
  members: { id: string; userId: string | null; guestName: string | null }[];
}

export interface SpinHistoryEntry {
  id: string;
  spinNumber: number;
  result: string;
  activity: ActivityDto;
  votes: { value: boolean }[];
}

export function isCategoryKey(value: string): value is CategoryKey {
  return value in CATEGORY_META;
}

export function sessionHistoryKey(code: string) {
  return `spinout.history.${code.trim().toUpperCase()}`;
}
