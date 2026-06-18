import { View, type ViewProps } from 'react-native';

import { Text } from '@/components/ui/Text';
import { cn } from '@/lib/utils';
import { stickerShadow } from '@/theme/tokens';

type BadgeProps = ViewProps & {
  className?: string;
  children: React.ReactNode;
};

export function Badge({ className, children, style, ...props }: BadgeProps) {
  return (
    <View
      className={cn(
        'self-start flex-row items-center gap-1.5 rounded-full border-2 border-ink bg-surface px-3 py-1',
        className,
      )}
      style={[stickerShadow('sm'), style]}
      {...props}
    >
      {typeof children === 'string' ? (
        <Text variant="body" weight="extrabold" className="text-xs text-ink">
          {children}
        </Text>
      ) : (
        children
      )}
    </View>
  );
}
