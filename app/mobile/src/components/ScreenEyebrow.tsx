import type { ReactNode } from 'react';
import { Text } from '@/components/ui/Text';
import { cn } from '@/lib/utils';

type ScreenEyebrowProps = {
  children: ReactNode;
  className?: string;
};

export function ScreenEyebrow({ children, className }: ScreenEyebrowProps) {
  return (
    <Text
      variant="body"
      weight="extrabold"
      className={cn('text-xs uppercase tracking-widest text-muted', className)}
    >
      {children}
    </Text>
  );
}
