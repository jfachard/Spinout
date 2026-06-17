import { ActivityIndicator, type PressableProps } from 'react-native';

import { cn } from '@/lib/utils';
import { Text } from '@/components/ui/Text';
import { StickerPressable } from '@/components/ui/StickerPressable';

export type ButtonVariant = 'primary' | 'secondary';

export interface ButtonProps extends Omit<PressableProps, 'children'> {
  variant?: ButtonVariant;
  loading?: boolean;
  className?: string;
  textClassName?: string;
  children: string;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-primary',
  secondary: 'bg-surface',
};

const variantTextClasses: Record<ButtonVariant, string> = {
  primary: 'text-white',
  secondary: 'text-ink',
};

export function Button({
  variant = 'primary',
  loading = false,
  disabled,
  className,
  textClassName,
  children,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <StickerPressable
      disabled={isDisabled}
      className={cn(
        'items-center justify-center rounded-lg border-[2.5px] border-ink px-6 py-3',
        variantClasses[variant],
        isDisabled && 'opacity-50',
        className,
      )}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? '#fff' : '#3a2a24'} />
      ) : (
        <Text
          variant="display"
          weight="bold"
          className={cn('text-lg', variantTextClasses[variant], textClassName)}
        >
          {children}
        </Text>
      )}
    </StickerPressable>
  );
}
