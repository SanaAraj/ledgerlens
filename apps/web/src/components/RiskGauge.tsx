export function RiskGauge({
  value,
  color,
  size = 136,
}: {
  value: number;
  color: string;
  size?: number;
}) {
  const stroke = 11;
  const r = (size - stroke) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;
  const sweep = 0.75;
  const track = sweep * circumference;
  const filled = track * Math.min(1, Math.max(0, value / 100));

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <g transform={`rotate(135 ${cx} ${cy})`}>
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            style={{ stroke: "hsl(var(--border))" }}
            strokeWidth={stroke}
            strokeDasharray={`${track} ${circumference}`}
            strokeLinecap="round"
          />
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeDasharray={`${filled} ${circumference}`}
            strokeLinecap="round"
          />
        </g>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="tabular text-[34px] font-semibold leading-none text-foreground">{value}</span>
        <span className="mt-1 text-[11px] font-medium uppercase tracking-wider text-muted">of 100</span>
      </div>
    </div>
  );
}
