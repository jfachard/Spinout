import { forwardRef } from 'react';
import { TextInput, View, type TextInputProps } from 'react-native';

import { cn } from '@/lib/utils';
import { Text } from '@/components/ui/Text';

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerClassName?: string;
}

export const Input = forwardRef<TextInput, InputProps>(
  ({ label, error, className, containerClassName, ...props }, ref) => (
    <View className={cn('gap-1.5', containerClassName)}>
      {label ? (
        <Text variant="body" weight="bold" className="text-sm text-ink">
          {label}
        </Text>
      ) : null}
      <TextInput
        ref={ref}
        placeholderTextColor="#a1907f"
        className={cn(
          'rounded-lg border-[2.5px] border-ink bg-surface px-4 py-3 font-body-semibold text-ink',
          error && 'border-primary',
          className,
        )}
        {...props}
      />
      {error ? (
        <Text variant="body" weight="semibold" className="text-sm text-primary">
          {error}
        </Text>
      ) : null}
    </View>
  ),
);

Input.displayName = 'Input';
