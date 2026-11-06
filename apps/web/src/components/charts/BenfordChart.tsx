import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { COLORS, tooltipStyle } from "@/lib/chart";
import type { Benford } from "@/lib/types";

export function BenfordChart({ benford }: { benford: Benford }) {
  const data = benford.digits.map((d) => ({
    digit: d.digit,
    Actual: +(d.actual * 100).toFixed(2),
    Expected: +(d.expected * 100).toFixed(2),
  }));
  return (
    <ResponsiveContainer width="100%" height={240}>
      <ComposedChart data={data} margin={{ top: 8, right: 8, left: -14, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke={COLORS.grid} />
        <XAxis
          dataKey="digit"
          tickLine={false}
          axisLine={{ stroke: COLORS.grid }}
          tick={{ fontSize: 12, fill: COLORS.axis }}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 11, fill: COLORS.axis }}
          tickFormatter={(v) => `${v}%`}
        />
        <Tooltip
          contentStyle={tooltipStyle}
          cursor={{ fill: "hsl(214 22% 92% / 0.5)" }}
          formatter={(v: number, name) => [`${v}%`, name]}
          labelFormatter={(l) => `Leading digit ${l}`}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} iconType="circle" iconSize={8} />
        <Bar dataKey="Actual" fill={COLORS.primary} radius={[3, 3, 0, 0]} maxBarSize={30} isAnimationActive={false} />
        <Line
          dataKey="Expected"
          stroke={COLORS.expected}
          strokeWidth={2}
          strokeDasharray="4 4"
          dot={{ r: 2.5, fill: COLORS.expected }}
          isAnimationActive={false}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
