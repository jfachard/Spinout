import { ActivityIndicator, View, type PressableProps } from 'react-native';

import { cn } from '@/lib/utils';
import { Text } from '@/components/ui/Text';
import { StickerPressable } from '@/components/ui/StickerPressable';

export type ButtonVariant = 'primary' | 'secondary' | 'dark';

export interface ButtonProps extends Omit<PressableProps, 'children'> {
  variant?: ButtonVariant;
  loading?: boolean;
  className?: string;
  textClassName?: string;
  icon?: React.ReactNode;
  children: string;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-primary',
  secondary: 'bg-surface',
  dark: 'bg-ink',
};

const variantTextClasses: Record<ButtonVariant, string> = {
  primary: 'text-white',
  secondary: 'text-ink',
  dark: 'text-white',
};

export function Button({
  variant = 'primary',
  loading = false,
  disabled,
  className,
  textClassName,
  icon,
  children,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <StickerPressable
      disabled={isDisabled}
      className={cn(
        'flex-row items-center justify-center gap-2 rounded-2xl border-[2.5px] border-ink px-6 py-4',
        variantClasses[variant],
        isDisabled && 'opacity-50',
        className,
      )}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'secondary' ? '#3a2a24' : '#fff'} />
      ) : (
        <>
          {icon}
          <Text
            variant="display"
            weight="bold"
            className={cn('text-lg', variantTextClasses[variant], textClassName)}
          >
            {children}
          </Text>
        </>
      )}
    </StickerPressable>
  );
}
