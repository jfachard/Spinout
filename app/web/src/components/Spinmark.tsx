const INK = "#3A2A24";
const CREAM = "#FBF3E4";
const SEGMENTS = ["#E8643C", "#7A9A52", "#F2A03D", "#6F94A8", "#D1688A", "#C98A3A"] as const;

const SLICE_PATHS = [
  "M0 0 L0 -200 A200 200 0 0 1 173 -100 Z",
  "M0 0 L173 -100 A200 200 0 0 1 173 100 Z",
  "M0 0 L173 100 A200 200 0 0 1 0 200 Z",
  "M0 0 L0 200 A200 200 0 0 1 -173 100 Z",
  "M0 0 L-173 100 A200 200 0 0 1 -173 -100 Z",
  "M0 0 L-173 -100 A200 200 0 0 1 0 -200 Z",
];

type SpinmarkProps = {
  size?: number;
  showPointer?: boolean;
  showShadow?: boolean;
  className?: string;
};

/** Rainbow wheel + cream hub (+ optional pointer). Matches brand/spinmark.svg. */
export function Spinmark({
  size = 36,
  showPointer = true,
  showShadow = false,
  className,
}: SpinmarkProps) {
  const wheel = size * (104 / 118);
  const scale = wheel / 208;
  const cx = size / 2;
  const cy = showPointer ? size - wheel / 2 : size / 2;
  const r = wheel / 2;
  const hubR = r * (17 / 52);
  const border = Math.max(1.5, wheel * (3.5 / 104));
  const hubBorder = Math.max(1.25, wheel * (3 / 104));
  const sliceStroke = 14 * (r / 52);
  const pointerW = wheel * (11 / 104);
  const pointerH = wheel * (18 / 104);
  const pointerTop = cy - r - (showPointer ? wheel * (12 / 104) : 0);

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-hidden={className ? undefined : true}
      className={className}
    >
      {showShadow ? (
        <circle cx={cx + r * 0.04} cy={cy + r * 0.04} r={r} fill={INK} />
      ) : null}
      {showPointer ? (
        <polygon
          points={`${cx},${pointerTop} ${cx - pointerW},${pointerTop + pointerH} ${cx + pointerW},${pointerTop + pointerH}`}
          fill={INK}
        />
      ) : null}
      <g transform={`translate(${cx} ${cy}) scale(${scale})`}>
        {SLICE_PATHS.map((d, i) => (
          <path
            key={i}
            d={d}
            fill={SEGMENTS[i]}
            stroke={INK}
            strokeWidth={sliceStroke}
          />
        ))}
      </g>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={INK} strokeWidth={border} />
      <circle
        cx={cx}
        cy={cy}
        r={hubR}
        fill={CREAM}
        stroke={INK}
        strokeWidth={hubBorder}
      />
    </svg>
  );
}
