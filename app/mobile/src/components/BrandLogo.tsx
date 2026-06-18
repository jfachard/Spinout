import { Image, View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { cn } from '@/lib/utils';
import { stickerShadow } from '@/theme/tokens';

import logo from '../../assets/Spinout_logo.png';

type BrandLogoProps = {
  size?: 'sm' | 'md';
  className?: string;
};

const sizes = {
  sm: { box: 'h-[26px] w-[26px] rounded-lg', text: 'text-base' },
  md: { box: 'h-[42px] w-[42px] rounded-[13px]', text: 'text-[25px]' },
} as const;

export function BrandLogo({ size = 'md', className }: BrandLogoProps) {
  const s = sizes[size];

  return (
    <View className={cn('flex-row items-center gap-2.5', className)}>
      <View
        className={cn('items-center justify-center', s.box)}
        style={size === 'md' ? stickerShadow('sm') : undefined}
      >
        <Image source={logo} className="h-full w-full" resizeMode="contain" />
      </View>
      <Text variant="display" weight="extrabold" className={cn('text-ink', s.text)}>
        Spinout
      </Text>
    </View>
  );
}
