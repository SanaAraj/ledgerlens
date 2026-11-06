import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { COLORS, tooltipStyle } from "@/lib/chart";
import type { Stats } from "@/lib/types";
import { formatNumber } from "@/lib/utils";

export function SeverityDonut({ stats }: { stats: Stats }) {
  const data = [
    { name: "High", value: stats.high_risk, color: COLORS.high },
    { name: "Medium", value: stats.medium_risk, color: COLORS.medium },
    { name: "Low", value: stats.low_risk, color: COLORS.low },
  ].filter((d) => d.value > 0);

  return (
    <div className="flex items-center gap-4">
      <div className="relative h-[150px] w-[150px] shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              innerRadius={48}
              outerRadius={70}
              paddingAngle={2}
              strokeWidth={0}
              isAnimationActive={false}
            >
              {data.map((d) => (
                <Cell key={d.name} fill={d.color} />
              ))}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} formatter={(v: number, n) => [`${v} entries`, n]} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="tabular text-2xl font-semibold text-foreground">
            {formatNumber(stats.flagged_entries)}
          </span>
          <span className="text-[11px] text-muted">flagged</span>
        </div>
      </div>
      <ul className="space-y-2 text-sm">
        {data.map((d) => (
          <li key={d.name} className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: d.color }} />
            <span className="text-foreground">{d.name}</span>
            <span className="tabular ml-auto font-medium text-muted">{formatNumber(d.value)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
