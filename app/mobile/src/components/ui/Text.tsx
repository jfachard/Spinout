import { Text as RNText, type TextProps as RNTextProps } from 'react-native';

import { cn } from '@/lib/utils';

export type TextVariant = 'display' | 'body';
export type TextWeight = 'regular' | 'semibold' | 'bold' | 'extrabold';

const weightClasses: Record<TextVariant, Record<TextWeight, string>> = {
  display: {
    regular: 'font-display',
    semibold: 'font-display',
    bold: 'font-display',
    extrabold: 'font-display-extrabold',
  },
  body: {
    regular: 'font-body',
    semibold: 'font-body-semibold',
    bold: 'font-body-bold',
    extrabold: 'font-body-extrabold',
  },
};

export interface TextProps extends RNTextProps {
  variant?: TextVariant;
  weight?: TextWeight;
  className?: string;
}

export function Text({
  variant = 'body',
  weight = 'regular',
  className,
  ...props
}: TextProps) {
  return (
    <RNText
      className={cn('text-ink', weightClasses[variant][weight], className)}
      {...props}
    />
  );
}
