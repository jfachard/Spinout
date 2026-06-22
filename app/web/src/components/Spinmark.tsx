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

const VB_W = 104;
const VB_H = 118;
const WHEEL_CX = 52;
const WHEEL_CY = 64;
const WHEEL_R = 52;
const HUB_R = 17;
const PATH_SCALE = 0.26;
const SLICE_STROKE = 14;
const WHEEL_BORDER = 3.5;
const HUB_BORDER = 3;

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
  const height = size;
  const width = showPointer ? size * (VB_W / VB_H) : size;
  const viewBox = showPointer
    ? `0 0 ${VB_W} ${VB_H}`
    : `${WHEEL_CX - WHEEL_R} ${WHEEL_CY - WHEEL_R} ${WHEEL_R * 2} ${WHEEL_R * 2}`;

  return (
    <svg
      width={width}
      height={height}
      viewBox={viewBox}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-hidden={className ? undefined : true}
      className={className}
    >
      {showShadow ? (
        <g transform={`translate(${WHEEL_CX + 4} ${WHEEL_CY + 4})`}>
          <circle r={WHEEL_R} fill={INK} />
        </g>
      ) : null}
      {showPointer ? (
        <polygon points="52,0 41,18 63,18" fill={INK} />
      ) : null}
      <g transform={`translate(${WHEEL_CX} ${WHEEL_CY})`}>
        <g transform={`scale(${PATH_SCALE})`} stroke={INK} strokeWidth={SLICE_STROKE}>
          {SLICE_PATHS.map((d, i) => (
            <path key={i} d={d} fill={SEGMENTS[i]} />
          ))}
        </g>
        <circle r={WHEEL_R} fill="none" stroke={INK} strokeWidth={WHEEL_BORDER} />
        <circle r={HUB_R} fill={CREAM} stroke={INK} strokeWidth={HUB_BORDER} />
      </g>
    </svg>
  );
}
