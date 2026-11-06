import { AlertTriangle, Banknote, FileStack, Flag, Sigma } from "lucide-react";
import type { ComponentType } from "react";
import { Card } from "@/components/ui/primitives";
import type { Stats } from "@/lib/types";
import { formatCompact, formatNumber } from "@/lib/utils";

function Stat({
  icon: Icon,
  label,
  value,
  sub,
  tone = "default",
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string;
  sub: string;
  tone?: "default" | "high" | "medium" | "ok";
}) {
  const tones = {
    default: "bg-muted-surface text-muted",
    high: "bg-high-surface text-high",
    medium: "bg-medium-surface text-medium",
    ok: "bg-ok-surface text-ok",
  } as const;
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2">
        <span className={`flex h-7 w-7 items-center justify-center rounded-md ${tones[tone]}`}>
          <Icon className="h-4 w-4" />
        </span>
        <span className="text-xs font-medium uppercase tracking-wide text-muted">{label}</span>
      </div>
      <div className="mt-3 tabular text-2xl font-semibold tracking-tight text-foreground">{value}</div>
      <div className="mt-0.5 text-xs text-muted">{sub}</div>
    </Card>
  );
}

const conformityLabel = {
  close: "Close conformity",
  acceptable: "Acceptable",
  marginal: "Marginal",
  nonconforming: "Nonconforming",
} as const;

export function KpiRow({ stats }: { stats: Stats }) {
  const flaggedPct = stats.total_entries ? Math.round((stats.flagged_entries / stats.total_entries) * 100) : 0;
  const benfordOk = stats.benford.conformity === "close" || stats.benford.conformity === "acceptable";
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      <Stat
        icon={FileStack}
        label="Entries"
        value={formatNumber(stats.total_entries)}
        sub={`${formatNumber(stats.total_lines)} lines analysed`}
      />
      <Stat
        icon={Flag}
        label="Flagged"
        value={formatNumber(stats.flagged_entries)}
        sub={`${flaggedPct}% of all entries`}
      />
      <Stat
        icon={AlertTriangle}
        label="High risk"
        value={formatNumber(stats.high_risk)}
        sub={`${formatNumber(stats.medium_risk)} medium, ${formatNumber(stats.low_risk)} low`}
        tone="high"
      />
      <Stat
        icon={Banknote}
        label="Flagged value"
        value={formatCompact(stats.flagged_value)}
        sub={`of ${formatCompact(stats.total_value)} total`}
        tone="medium"
      />
      <Stat
        icon={Sigma}
        label="Benford"
        value={conformityLabel[stats.benford.conformity]}
        sub={`MAD ${stats.benford.mad.toFixed(4)}`}
        tone={benfordOk ? "ok" : "high"}
      />
    </div>
  );
}
