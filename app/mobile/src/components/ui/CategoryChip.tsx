import type { Category } from '@spinout/shared';

import { cn } from '@/lib/utils';
import { Text } from '@/components/ui/Text';
import { StickerPressable } from '@/components/ui/StickerPressable';

export type CategoryKey = Category;

export const CATEGORY_META: Record<CategoryKey, { label: string; color: string }> = {
  indoor: { label: 'Indoor', color: '#E8643C' },
  outdoor: { label: 'Outdoor', color: '#7A9A52' },
  sport: { label: 'Sport', color: '#F2A03D' },
  relaxation: { label: 'Relax', color: '#6F94A8' },
  party: { label: 'Party', color: '#D1688A' },
  culture: { label: 'Culture', color: '#9B72CF' },
  food: { label: 'Food', color: '#C98A3A' },
};

export interface CategoryChipProps {
  category: CategoryKey;
  selected?: boolean;
  onPress?: () => void;
  className?: string;
}

export function CategoryChip({
  category,
  selected = false,
  onPress,
  className,
}: CategoryChipProps) {
  const meta = CATEGORY_META[category];

  return (
    <StickerPressable
      shadowSize="sm"
      onPress={onPress}
      className={cn(
        'flex-row items-center gap-1.5 rounded-full border-2 border-ink px-3 py-1',
        selected ? '' : 'bg-surface',
        className,
      )}
      style={selected ? { backgroundColor: meta.color } : undefined}
    >
      <Text
        variant="body"
        weight="bold"
        className={cn('text-sm', selected ? 'text-white' : 'text-ink')}
      >
        {meta.label}
      </Text>
    </StickerPressable>
  );
}
