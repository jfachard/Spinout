import type { ViewStyle } from 'react-native';

export const colors = {
  paper: '#fbf3e4',
  surface: '#fffcf6',
  primary: '#e8643c',
  amber: '#f2a03d',
  ink: '#3a2a24',
  muted: '#a1907f',
  subtle: '#7e7064',
  categoryIndoor: '#e8643c',
  categoryOutdoor: '#7a9a52',
  categorySport: '#f2a03d',
  categoryRelaxation: '#6f94a8',
  categoryParty: '#d1688a',
  categoryCulture: '#9b72cf',
  categoryFood: '#c98a3a',
} as const;

export const radius = {
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  full: 999,
} as const;

export type StickerSize = 'sm' | 'md' | 'lg';

const stickerOffsets: Record<StickerSize, number> = {
  sm: 2.5,
  md: 4,
  lg: 6,
};

/** RN-native sticker shadow (box-shadow CSS doesn't work on native). */
export function stickerShadow(size: StickerSize = 'md'): ViewStyle {
  const offset = stickerOffsets[size];
  return {
    shadowColor: colors.ink,
    shadowOffset: { width: offset, height: offset },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 0,
  };
}

export function stickerPressedStyle(size: StickerSize = 'md'): ViewStyle {
  const offset = stickerOffsets[size];
  return {
    transform: [{ translateX: offset }, { translateY: offset }],
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    elevation: 0,
  };
}
