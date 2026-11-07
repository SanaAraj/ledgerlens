import { RiskGauge } from "@/components/RiskGauge";
import { RiskMeter, SeverityBadge } from "@/components/ui/primitives";
import { useChartColors } from "@/lib/chart";
import type { Severity } from "@/lib/types";

const ROWS: { id: string; finding: string; severity: Severity; score: number }[] = [
  { id: "JE-100511", finding: "Threshold avoidance", severity: "high", score: 70 },
  { id: "JE-100482", finding: "Possible duplicate entry", severity: "high", score: 63 },
  { id: "JE-100467", finding: "Posted on a weekend", severity: "medium", score: 38 },
  { id: "JE-100455", finding: "Round amount", severity: "low", score: 18 },
];

export function LandingPreview() {
  const { c } = useChartColors();
  return (
    <div className="relative">
      <div
        aria-hidden
        className="absolute -right-8 -top-10 h-40 w-40 rounded-full bg-primary/20 blur-3xl"
      />
      <div
        aria-hidden
        className="absolute -bottom-10 -left-6 h-40 w-40 rounded-full bg-medium/20 blur-3xl"
      />
      <div className="relative rounded-xl border border-border bg-surface shadow-lift">
        <div className="flex items-center gap-1.5 border-b border-border px-4 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-high/60" />
          <span className="h-2.5 w-2.5 rounded-full bg-medium/60" />
          <span className="h-2.5 w-2.5 rounded-full bg-ok/60" />
          <span className="ml-2 text-xs font-medium text-muted">LedgerLens / audit</span>
        </div>

        <div className="flex items-center gap-5 p-5">
          <RiskGauge value={64} color={c.medium} size={116} />
          <div>
            <div className="text-[11px] font-medium uppercase tracking-wider text-muted">
              Audit risk index
            </div>
            <div className="mt-0.5 text-lg font-semibold text-foreground">Elevated</div>
            <p className="mt-1 text-xs text-muted">55 of 513 entries flagged</p>
          </div>
        </div>

        <div className="divide-y divide-border border-t border-border">
          {ROWS.map((r) => (
            <div key={r.id} className="flex items-center gap-3 px-5 py-2.5">
              <div className="w-20 text-[13px] font-medium text-foreground">{r.id}</div>
              <div className="flex-1 truncate text-[13px] text-muted">{r.finding}</div>
              <SeverityBadge severity={r.severity} />
              <RiskMeter score={r.score} severity={r.severity} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
