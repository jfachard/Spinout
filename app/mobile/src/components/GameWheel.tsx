import {
  Dumbbell,
  Flower2,
  House,
  Palette,
  PartyPopper,
  TreePine,
  UtensilsCrossed,
  type LucideIcon,
} from 'lucide-react-native';
import { useEffect, useRef } from 'react';
import { Animated, Easing, Image, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { colors } from '@/theme/tokens';

import logo from '../../assets/Spinout_logo.png';

const SEGMENTS: { Icon: LucideIcon; color: string }[] = [
  { Icon: House, color: '#E8643C' },
  { Icon: TreePine, color: '#7A9A52' },
  { Icon: Dumbbell, color: '#F2A03D' },
  { Icon: Flower2, color: '#6F94A8' },
  { Icon: PartyPopper, color: '#D1688A' },
  { Icon: Palette, color: '#9B72CF' },
  { Icon: UtensilsCrossed, color: '#C98A3A' },
];

const SLICE = 360 / SEGMENTS.length;
const VIEW = 180;
const CX = VIEW / 2;
const CY = VIEW / 2;
const R = VIEW / 2;
const ICON_R = R - 28;
const BORDER = 3;
const SHADOW = 6;
const POINTER_W = 26;
const POINTER_H = 20;

function polar(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function wedgePath(startAngle: number, endAngle: number) {
  const start = polar(CX, CY, R, endAngle);
  const end = polar(CX, CY, R, startAngle);
  const large = endAngle - startAngle <= 180 ? 0 : 1;
  return `M ${CX} ${CY} L ${start.x} ${start.y} A ${R} ${R} 0 ${large} 0 ${end.x} ${end.y} Z`;
}

type GameWheelProps = {
  size?: number;
  spinning?: boolean;
  durationMs?: number;
};

export function GameWheel({ size = 240, spinning = false, durationMs = 4000 }: GameWheelProps) {
  const rotation = useRef(new Animated.Value(0)).current;
  const currentRotation = useRef(0);
  const wasSpinning = useRef(false);
  const iconSize = Math.round(size * 0.075);
  const hubSize = size * 0.24;
  const borderVb = BORDER * (VIEW / size);

  useEffect(() => {
    if (spinning && !wasSpinning.current) {
      const turns = 5 + Math.floor(Math.random() * 3);
      const offset = Math.random() * 360;
      const next = currentRotation.current + turns * 360 + offset;
      currentRotation.current = next;
      Animated.timing(rotation, {
        toValue: next,
        duration: durationMs,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    }
    wasSpinning.current = spinning;
  }, [spinning, durationMs, rotation]);

  const spin = rotation.interpolate({
    inputRange: [0, 360],
    outputRange: ['0deg', '360deg'],
    extrapolate: 'extend',
  });

  return (
    <View
      style={{
        width: size + SHADOW,
        height: size + POINTER_H + SHADOW,
        alignSelf: 'center',
      }}
    >
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: POINTER_H + SHADOW,
          left: SHADOW,
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: colors.ink,
        }}
      />

      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: POINTER_H - 2,
          left: (size - POINTER_W) / 2,
          zIndex: 20,
          width: 0,
          height: 0,
          borderLeftWidth: POINTER_W / 2,
          borderRightWidth: POINTER_W / 2,
          borderTopWidth: POINTER_H,
          borderLeftColor: 'transparent',
          borderRightColor: 'transparent',
          borderTopColor: colors.ink,
        }}
      />

      <View
        style={{
          position: 'absolute',
          top: POINTER_H,
          left: 0,
          width: size,
          height: size,
        }}
      >
        <Animated.View style={{ width: size, height: size, transform: [{ rotate: spin }] }}>
          <Svg width={size} height={size} viewBox={`0 0 ${VIEW} ${VIEW}`}>
            {SEGMENTS.map((seg, i) => (
              <Path
                key={seg.color}
                d={wedgePath(i * SLICE, (i + 1) * SLICE)}
                fill={seg.color}
              />
            ))}
            <Circle
              cx={CX}
              cy={CY}
              r={R - borderVb / 2}
              fill="none"
              stroke={colors.ink}
              strokeWidth={borderVb}
            />
          </Svg>

          {SEGMENTS.map((seg, i) => {
            const angle = i * SLICE + SLICE / 2;
            const pos = polar(CX, CY, ICON_R, angle);
            const left = (pos.x / VIEW) * size - iconSize / 2;
            const top = (pos.y / VIEW) * size - iconSize / 2;
            const { Icon } = seg;
            return (
              <View key={angle} style={{ position: 'absolute', left, top }}>
                <Icon size={iconSize} color="#FFFCF6" strokeWidth={2.5} />
              </View>
            );
          })}
        </Animated.View>
      </View>

      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: POINTER_H,
          left: 0,
          width: size,
          height: size,
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10,
        }}
      >
        <View
          style={{
            width: hubSize,
            height: hubSize,
            borderRadius: hubSize / 2,
            borderWidth: BORDER,
            borderColor: colors.ink,
            backgroundColor: colors.paper,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Image
            source={logo}
            style={{ width: size * 0.16, height: size * 0.16 }}
            resizeMode="contain"
          />
        </View>
      </View>
    </View>
  );
}
