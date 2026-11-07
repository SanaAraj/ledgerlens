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
import { useChartColors } from "@/lib/chart";
import type { Benford } from "@/lib/types";

export function BenfordChart({ benford }: { benford: Benford }) {
  const { c, tooltipStyle } = useChartColors();
  const data = benford.digits.map((d) => ({
    digit: d.digit,
    Actual: +(d.actual * 100).toFixed(2),
    Expected: +(d.expected * 100).toFixed(2),
  }));
  return (
    <ResponsiveContainer width="100%" height={240}>
      <ComposedChart data={data} margin={{ top: 8, right: 8, left: -14, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke={c.grid} />
        <XAxis
          dataKey="digit"
          tickLine={false}
          axisLine={{ stroke: c.grid }}
          tick={{ fontSize: 12, fill: c.axis }}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 11, fill: c.axis }}
          tickFormatter={(v) => `${v}%`}
        />
        <Tooltip
          contentStyle={tooltipStyle}
          cursor={{ fill: c.cursor }}
          formatter={(v: number, name) => [`${v}%`, name]}
          labelFormatter={(l) => `Leading digit ${l}`}
        />
        <Legend wrapperStyle={{ fontSize: 12, color: c.axis }} iconType="circle" iconSize={8} />
        <Bar dataKey="Actual" fill={c.primary} radius={[3, 3, 0, 0]} maxBarSize={30} isAnimationActive={false} />
        <Line
          dataKey="Expected"
          stroke={c.expected}
          strokeWidth={2}
          strokeDasharray="4 4"
          dot={{ r: 2.5, fill: c.expected }}
          isAnimationActive={false}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
