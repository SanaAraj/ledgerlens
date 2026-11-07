import { AlertTriangle, Banknote, Flag, Sigma } from "lucide-react";
import type { ComponentType } from "react";
import { RiskGauge } from "@/components/RiskGauge";
import { useChartColors } from "@/lib/chart";
import type { Stats } from "@/lib/types";
import { formatCompact, formatNumber } from "@/lib/utils";

const conformityLabel = {
  close: "Close",
  acceptable: "Acceptable",
  marginal: "Marginal",
  nonconforming: "Nonconforming",
} as const;

function StatCell({
  icon: Icon,
  label,
  value,
  sub,
  tone,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string;
  sub: string;
  tone: "default" | "high" | "medium" | "ok";
}) {
  const tones = {
    default: "bg-muted-surface text-muted",
    high: "bg-high-surface text-high",
    medium: "bg-medium-surface text-medium",
    ok: "bg-ok-surface text-ok",
  } as const;
  return (
    <div className="bg-surface p-5">
      <div className="flex items-center gap-2">
        <span className={`flex h-7 w-7 items-center justify-center rounded-md ${tones[tone]}`}>
          <Icon className="h-4 w-4" />
        </span>
        <span className="text-xs font-medium uppercase tracking-wide text-muted">{label}</span>
      </div>
      <div className="mt-2.5 tabular text-2xl font-semibold tracking-tight text-foreground">{value}</div>
      <div className="mt-0.5 text-xs text-muted">{sub}</div>
    </div>
  );
}

export function HeroSummary({ stats }: { stats: Stats }) {
  const { c } = useChartColors();
  const index = Math.min(
    100,
    Math.round(((stats.high_risk * 3 + stats.medium_risk * 2 + stats.low_risk) / Math.max(1, stats.total_entries)) * 250),
  );
  const band =
    index >= 75
      ? { label: "High concern", color: c.high }
      : index >= 50
        ? { label: "Elevated", color: c.medium }
        : index >= 25
          ? { label: "Moderate", color: c.medium }
          : { label: "Low", color: c.ok };
  const flaggedPct = stats.total_entries ? Math.round((stats.flagged_entries / stats.total_entries) * 100) : 0;
  const benfordOk = stats.benford.conformity === "close" || stats.benford.conformity === "acceptable";

  return (
    <section className="overflow-hidden rounded-xl border border-border bg-surface shadow-card">
      <div className="grid lg:grid-cols-[340px_1fr]">
        <div className="flex items-center gap-5 p-6">
          <RiskGauge value={index} color={band.color} />
          <div>
            <div className="text-xs font-medium uppercase tracking-wider text-muted">Audit risk index</div>
            <div className="mt-1 text-xl font-semibold tracking-tight text-foreground">{band.label}</div>
            <p className="mt-2 max-w-[200px] text-[13px] leading-relaxed text-muted">
              {formatNumber(stats.flagged_entries)} of {formatNumber(stats.total_entries)} entries flagged,{" "}
              {formatNumber(stats.high_risk)} high-risk.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-px border-t border-border bg-border sm:grid-cols-4 lg:border-l lg:border-t-0">
          <StatCell
            icon={Flag}
            label="Flagged"
            value={formatNumber(stats.flagged_entries)}
            sub={`${flaggedPct}% of entries`}
            tone="default"
          />
          <StatCell
            icon={AlertTriangle}
            label="High risk"
            value={formatNumber(stats.high_risk)}
            sub={`${formatNumber(stats.medium_risk)} medium`}
            tone="high"
          />
          <StatCell
            icon={Banknote}
            label="Flagged value"
            value={formatCompact(stats.flagged_value)}
            sub={`of ${formatCompact(stats.total_value)}`}
            tone="medium"
          />
          <StatCell
            icon={Sigma}
            label="Benford"
            value={conformityLabel[stats.benford.conformity]}
            sub={`MAD ${stats.benford.mad.toFixed(4)}`}
            tone={benfordOk ? "ok" : "high"}
          />
        </div>
      </div>
    </section>
  );
}
