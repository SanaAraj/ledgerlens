import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { COLORS, tooltipStyle } from "@/lib/chart";
import type { NamedCount, Severity } from "@/lib/types";

const SEVERITY_BY_TITLE: Record<string, Severity> = {
  "Segregation of duties breached": "high",
  "Posted above approval threshold without approval": "high",
  "Possible duplicate entry": "high",
  "Amount just below approval threshold": "high",
  "High-risk wording in description": "medium",
  "Posted on a weekend": "medium",
  "Created outside business hours": "medium",
  "Rare account combination": "medium",
  "Manual entry at period-end": "medium",
  "Suspiciously round amount": "low",
};

const toneColor: Record<Severity, string> = {
  high: COLORS.high,
  medium: COLORS.medium,
  low: COLORS.low,
};

export function RuleChart({ data }: { data: NamedCount[] }) {
  const rows = [...data].sort((a, b) => a.count - b.count);
  return (
    <ResponsiveContainer width="100%" height={Math.max(220, rows.length * 30)}>
      <BarChart data={rows} layout="vertical" margin={{ top: 0, right: 16, left: 8, bottom: 0 }}>
        <XAxis type="number" hide />
        <YAxis
          type="category"
          dataKey="name"
          width={176}
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 11.5, fill: COLORS.axis }}
        />
        <Tooltip
          contentStyle={tooltipStyle}
          cursor={{ fill: "hsl(214 22% 92% / 0.5)" }}
          formatter={(v: number) => [`${v} entries`, "Exceptions"]}
        />
        <Bar dataKey="count" radius={[0, 4, 4, 0]} maxBarSize={18} isAnimationActive={false} label={{ position: "right", fontSize: 11, fill: COLORS.axis }}>
          {rows.map((r) => (
            <Cell key={r.name} fill={toneColor[SEVERITY_BY_TITLE[r.name] ?? "low"]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
