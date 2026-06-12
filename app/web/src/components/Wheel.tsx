import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  Dumbbell,
  Flower2,
  type LucideIcon,
  House,
  Palette,
  PartyPopper,
  TreePine,
  UtensilsCrossed,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Segment {
  Icon: LucideIcon;
  color: string;
}

/** Order is clockwise starting from the top edge (matches conic-gradient from 0deg). */
const SEGMENTS: Segment[] = [
  { Icon: House, color: "#E8643C" }, // indoor
  { Icon: TreePine, color: "#7A9A52" }, // outdoor
  { Icon: Dumbbell, color: "#F2A03D" }, // sport
  { Icon: Flower2, color: "#6F94A8" }, // relaxation
  { Icon: PartyPopper, color: "#D1688A" }, // party
  { Icon: Palette, color: "#9B72CF" }, // culture
  { Icon: UtensilsCrossed, color: "#C98A3A" }, // food
];

const SLICE = 360 / SEGMENTS.length;

function conicGradient() {
  const stops = SEGMENTS.map((s, i) => {
    const start = (i * SLICE).toFixed(3);
    const end = ((i + 1) * SLICE).toFixed(3);
    return `${s.color} ${start}deg ${end}deg`;
  });
  return `conic-gradient(${stops.join(", ")})`;
}

interface WheelProps {
  size?: number;
  spinning?: boolean;
  /** Spin-to-stop duration in ms. Should match the reveal delay on the game page. */
  durationMs?: number;
  className?: string;
}

export function Wheel({
  size = 360,
  spinning = false,
  durationMs = 4000,
  className,
}: WheelProps) {
  const radiusPct = 33;
  const [rotation, setRotation] = useState(0);
  const wasSpinning = useRef(false);

  useEffect(() => {
    if (spinning && !wasSpinning.current) {
      // 5–7 full turns + random landing offset so it stops somewhere new each time.
      const turns = 5 + Math.floor(Math.random() * 3);
      const offset = Math.random() * 360;
      setRotation((r) => r + turns * 360 + offset);
    }
    wasSpinning.current = spinning;
  }, [spinning]);

  return (
    <div
      className={cn("relative", className)}
      style={{ width: size, height: size }}
    >
      {/* Pointer */}
      <div
        aria-hidden
        className="absolute left-1/2 -translate-x-1/2 -top-1 z-20"
        style={{
          width: 0,
          height: 0,
          borderLeft: "13px solid transparent",
          borderRight: "13px solid transparent",
          borderTop: "20px solid #3A2A24",
        }}
      />

      {/* Wheel disc */}
      <div
        className="absolute inset-0 rounded-full border-[2.5px] border-ink shadow-sticker-lg"
        style={{
          background: conicGradient(),
          transform: `rotate(${rotation}deg)`,
          transition: `transform ${durationMs}ms cubic-bezier(0.18, 0.9, 0.2, 1)`,
        }}
      >
        {SEGMENTS.map((s, i) => {
          const angle = (i * SLICE + SLICE / 2) * (Math.PI / 180);
          const x = 50 + radiusPct * Math.sin(angle);
          const y = 50 - radiusPct * Math.cos(angle);
          const { Icon } = s;
          return (
            <span
              key={i}
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${x}%`, top: `${y}%` }}
            >
              <Icon size={26} strokeWidth={2.5} color="#FFFCF6" />
            </span>
          );
        })}
      </div>

      {/* Center hub */}
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 rounded-full bg-surface border-[2.5px] border-ink shadow-sticker-sm flex items-center justify-center overflow-hidden"
        style={{ width: size * 0.24, height: size * 0.24 }}
      >
        <Image
          src="/Spinout_logo.png"
          alt="Spinout"
          width={Math.round(size * 0.2)}
          height={Math.round(size * 0.2)}
          className="object-contain"
        />
      </div>
    </div>
  );
}
