import { View } from 'react-native';

import { Spinmark } from '@/components/Spinmark';
import { Text } from '@/components/ui/Text';
import { cn } from '@/lib/utils';
import { stickerShadow } from '@/theme/tokens';

type BrandLogoProps = {
  size?: 'sm' | 'md';
  className?: string;
};

const sizes = {
  sm: { mark: 26, text: 'text-base' },
  md: { mark: 42, text: 'text-[25px]' },
} as const;

export function BrandLogo({ size = 'md', className }: BrandLogoProps) {
  const s = sizes[size];

  return (
    <View className={cn('flex-row items-center gap-2.5', className)}>
      <View
        className="items-center justify-center overflow-visible"
        style={size === 'md' ? stickerShadow('sm') : undefined}
      >
        <Spinmark size={s.mark} showShadow={size === 'md'} />
      </View>
      <Text variant="display" weight="extrabold" className={cn('text-ink', s.text)}>
        Spinout
      </Text>
    </View>
  );
}
