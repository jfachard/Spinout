import { View, type ViewProps } from 'react-native';

import { cn } from '@/lib/utils';
import { stickerShadow } from '@/theme/tokens';

export interface CardProps extends ViewProps {
  className?: string;
}

export function Card({ className, style, children, ...props }: CardProps) {
  return (
    <View
      className={cn('rounded-[20px] border-[2.5px] border-ink bg-surface', className)}
      style={[stickerShadow('md'), style]}
      {...props}
    >
      {children}
    </View>
  );
}

export function CardHeader({ className, ...props }: ViewProps & { className?: string }) {
  return <View className={cn('p-5 pb-0', className)} {...props} />;
}

export function CardContent({ className, ...props }: ViewProps & { className?: string }) {
  return <View className={cn('p-5', className)} {...props} />;
}

export function CardFooter({ className, ...props }: ViewProps & { className?: string }) {
  return <View className={cn('flex-row items-center p-5 pt-0', className)} {...props} />;
}
