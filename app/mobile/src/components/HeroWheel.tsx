import {
  FerrisWheel,
  Home,
  PartyPopper,
  Sparkles,
  TreePine,
  Trophy,
  UtensilsCrossed,
} from 'lucide-react-native';
import { View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { stickerShadow } from '@/theme/tokens';

const SEGMENTS = [
  { color: '#E8643C', Icon: Home, angle: 30 },
  { color: '#7A9A52', Icon: TreePine, angle: 90 },
  { color: '#F2A03D', Icon: Trophy, angle: 150 },
  { color: '#6F94A8', Icon: Sparkles, angle: 210 },
  { color: '#D1688A', Icon: PartyPopper, angle: 270 },
  { color: '#C98A3A', Icon: UtensilsCrossed, angle: 330 },
] as const;

const VIEW = 180;
const CX = VIEW / 2;
const CY = VIEW / 2;
const R = VIEW / 2 - 4;
const ICON_R = R - 34;

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

type HeroWheelProps = {
  size?: number;
};

export function HeroWheel({ size = 180 }: HeroWheelProps) {
  const iconSize = Math.round(size * 0.1);

  return (
    <View
      className="relative items-center justify-center"
      style={[{ width: size, height: size }, stickerShadow('md')]}
    >
      <Svg width={size} height={size} viewBox={`0 0 ${VIEW} ${VIEW}`}>
        {SEGMENTS.map((seg, i) => (
          <Path
            key={seg.color}
            d={wedgePath(i * 60, (i + 1) * 60)}
            fill={seg.color}
            stroke="#3A2A24"
            strokeWidth={2}
          />
        ))}
      </Svg>

      {SEGMENTS.map(({ Icon, angle }) => {
        const pos = polar(CX, CY, ICON_R, angle);
        const left = (pos.x / VIEW) * size - iconSize / 2;
        const top = (pos.y / VIEW) * size - iconSize / 2;
        return (
          <View key={angle} className="absolute" style={{ left, top }}>
            <Icon size={iconSize} color="#FFFCF6" strokeWidth={2.5} />
          </View>
        );
      })}

      <View
        className="absolute items-center justify-center rounded-full border-[4px] border-ink bg-paper"
        style={{ width: size * 0.24, height: size * 0.24 }}
      >
        <FerrisWheel size={size * 0.11} color="#3A2A24" strokeWidth={2.5} />
      </View>
    </View>
  );
}
