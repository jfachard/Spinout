import type { Category } from '@spinout/shared';

import { CATEGORY_META, type CategoryKey } from '@/components/ui/CategoryChip';

export type TagState = 'like' | 'dislike';

export interface LobbyPreference {
  category: string;
  likedTags: string[];
  dislikedTags: string[];
}

export interface LobbyMember {
  id: string;
  userId: string | null;
  guestName: string | null;
  user?: { username: string } | null;
  preferences?: LobbyPreference[];
}

export interface LobbySession {
  id: string;
  code: string;
  hostId: string;
  status: string;
  categories: string[];
}

export const CATEGORY_KEYS = Object.keys(CATEGORY_META) as CategoryKey[];

export const CATEGORY_TAGS: Record<Category, string[]> = {
  indoor: ['games', 'competitive', 'chill', 'movies', 'cooking', 'creative', 'music', 'puzzles'],
  outdoor: ['nature', 'active', 'adventure', 'walking', 'chill', 'views', 'social', 'food'],
  sport: ['competitive', 'active', 'team', 'fun'],
  relaxation: ['wellness', 'chill', 'self-care', 'quiet', 'movies', 'intellectual', 'lazy'],
  party: ['social', 'music', 'drinks', 'dancing', 'games', 'creative', 'views', 'fun'],
  culture: ['intellectual', 'art', 'quiet', 'music', 'social', 'walking', 'movies', 'shopping'],
  food: ['food', 'social', 'adventure', 'cooking', 'chill', 'outdoor', 'fancy', 'creative'],
};

export const MEMBER_COLORS = [
  '#E8643C',
  '#F2A03D',
  '#7A9A52',
  '#6F94A8',
  '#D1688A',
  '#9B72CF',
  '#C98A3A',
];

export function memberName(m: LobbyMember): string {
  return m.user?.username ?? m.guestName ?? 'Guest';
}
