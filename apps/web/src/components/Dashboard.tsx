import { useState } from "react";
import { BenfordChart } from "@/components/charts/BenfordChart";
import { RuleChart } from "@/components/charts/RuleChart";
import { SeverityDonut } from "@/components/charts/SeverityDonut";
import { EntryDrawer } from "@/components/EntryDrawer";
import { ExceptionsTable } from "@/components/ExceptionsTable";
import { HeroSummary } from "@/components/HeroSummary";
import { Card, CardHeader } from "@/components/ui/primitives";
import type { AnalysisResult, EntryRisk } from "@/lib/types";
import { formatNumber } from "@/lib/utils";

export function Dashboard({ result }: { result: AnalysisResult }) {
  const [selected, setSelected] = useState<EntryRisk | null>(null);
  const { stats } = result;

  return (
    <div className="mx-auto max-w-[1400px] px-5 py-6 sm:px-6">
      <div className="mb-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted">
        <span className="font-medium text-foreground">{result.filename}</span>
        <span className="text-border">|</span>
        <span>
          {stats.date_range[0]} to {stats.date_range[1]}
        </span>
        <span className="text-border">|</span>
        <span>{formatNumber(stats.total_entries)} entries</span>
        <span className="text-border">|</span>
        <span>Analysed {result.generated_at}</span>
      </div>

      <HeroSummary stats={stats} />

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Benford's Law"
            subtitle={`Leading-digit distribution vs expected · ${stats.benford.sample_size} amounts · ${stats.benford.conformity}`}
          />
          <div className="px-3 pb-4">
            <BenfordChart benford={stats.benford} />
          </div>
        </Card>
        <Card>
          <CardHeader title="Risk severity" subtitle="Flagged entries by severity" />
          <div className="px-5 pb-5 pt-1">
            <SeverityDonut stats={stats} />
          </div>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Exceptions by rule" subtitle="How many entries tripped each test" />
          <div className="px-3 pb-4 pt-1">
            <RuleChart data={stats.by_rule} />
          </div>
        </Card>
        <Card>
          <CardHeader title="Top preparers" subtitle="By flagged entries" />
          <ul className="divide-y divide-border px-5 pb-3">
            {stats.by_preparer.map((p) => (
              <li key={p.name} className="flex items-center justify-between py-2.5 text-sm">
                <span className="font-medium text-foreground">{p.name}</span>
                <span className="tabular text-muted">{formatNumber(p.count)}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card className="mt-4">
        <ExceptionsTable entries={result.entries} selectedId={selected?.je_id ?? null} onSelect={setSelected} />
      </Card>

      <EntryDrawer entry={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
