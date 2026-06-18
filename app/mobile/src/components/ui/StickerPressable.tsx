import { useState, type ReactNode } from 'react';
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';

import { stickerPressedStyle, stickerShadow, type StickerSize } from '@/theme/tokens';

type StickerPressableProps = PressableProps & {
  children: ReactNode;
  shadowSize?: StickerSize;
  className?: string;
  style?: StyleProp<ViewStyle>;
};

export function StickerPressable({
  children,
  shadowSize = 'md',
  className,
  style,
  disabled,
  onPressIn,
  onPressOut,
  ...props
}: StickerPressableProps) {
  const [pressed, setPressed] = useState(false);

  return (
    <Pressable
      className={className}
      disabled={disabled}
      onPressIn={(e) => {
        setPressed(true);
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        setPressed(false);
        onPressOut?.(e);
      }}
      style={[stickerShadow(shadowSize), pressed && stickerPressedStyle(shadowSize), style]}
      {...props}
    >
      {children}
    </Pressable>
  );
}
