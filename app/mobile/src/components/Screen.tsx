import { KeyboardAvoidingView, Platform, ScrollView, View, type ViewProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { cn } from '@/lib/utils';

export interface ScreenProps extends ViewProps {
  scroll?: boolean;
  centered?: boolean;
  className?: string;
  contentClassName?: string;
}

export function Screen({
  scroll = false,
  centered = false,
  className,
  contentClassName,
  children,
  ...props
}: ScreenProps) {
  const body = (
    <View
      className={cn(
        'flex-1 bg-paper px-5 py-4',
        centered && 'justify-center',
        contentClassName,
      )}
      {...props}
    >
      {children}
    </View>
  );

  return (
    <SafeAreaView className={cn('flex-1 bg-paper', className)}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {scroll ? (
          <ScrollView
            className="flex-1 bg-paper"
            contentContainerClassName={cn(
              'grow px-5 py-4 pb-8',
              centered && 'justify-center',
              contentClassName,
            )}
            keyboardShouldPersistTaps="handled"
          >
            {children}
          </ScrollView>
        ) : (
          body
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
