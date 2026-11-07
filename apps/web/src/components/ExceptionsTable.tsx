import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { RiskMeter, SeverityBadge } from "@/components/ui/primitives";
import type { EntryRisk, Severity } from "@/lib/types";
import { cn, formatCurrency, severityBorder } from "@/lib/utils";

const FILTERS: { key: "all" | Severity; label: string }[] = [
  { key: "all", label: "All" },
  { key: "high", label: "High" },
  { key: "medium", label: "Medium" },
  { key: "low", label: "Low" },
];

export function ExceptionsTable({
  entries,
  selectedId,
  onSelect,
}: {
  entries: EntryRisk[];
  selectedId: string | null;
  onSelect: (entry: EntryRisk) => void;
}) {
  const [filter, setFilter] = useState<"all" | Severity>("all");
  const [query, setQuery] = useState("");

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return entries.filter((e) => {
      if (filter !== "all" && e.severity !== filter) return false;
      if (!q) return true;
      return (
        e.je_id.toLowerCase().includes(q) ||
        e.preparer.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q) ||
        e.findings.some((f) => f.title.toLowerCase().includes(q))
      );
    });
  }, [entries, filter, query]);

  return (
    <div className="flex flex-col">
      <div className="flex flex-col gap-3 px-5 pb-3 pt-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Flagged entries</h3>
          <p className="mt-0.5 text-xs text-muted">{rows.length} shown, highest risk first</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-md border border-border bg-surface p-0.5">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={cn(
                  "rounded px-2.5 py-1 text-xs font-medium transition-colors",
                  filter === f.key ? "bg-ink text-ink-foreground" : "text-muted hover:text-foreground",
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search entries"
              aria-label="Search entries"
              className="h-8 w-40 rounded-md border border-border bg-surface pl-8 pr-3 text-[13px] text-foreground placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            />
          </div>
        </div>
      </div>

      <div className="max-h-[560px] overflow-auto">
        <table className="w-full border-collapse text-sm">
          <thead className="sticky top-0 z-10 bg-muted-surface/90 backdrop-blur">
            <tr className="text-left text-xs font-medium text-muted">
              <th className="border-l-[3px] border-l-transparent px-5 py-2.5 font-medium">Entry</th>
              <th className="px-3 py-2.5 font-medium">Posted</th>
              <th className="px-3 py-2.5 font-medium">Preparer</th>
              <th className="px-3 py-2.5 text-right font-medium">Value</th>
              <th className="px-3 py-2.5 font-medium">Top finding</th>
              <th className="px-3 py-2.5 font-medium">Severity</th>
              <th className="px-5 py-2.5 font-medium">Risk</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((e) => (
              <tr
                key={e.je_id}
                tabIndex={0}
                onClick={() => onSelect(e)}
                onKeyDown={(ev) => {
                  if (ev.key === "Enter") onSelect(e);
                }}
                className={cn(
                  "cursor-pointer border-t border-border transition-colors focus:outline-none",
                  selectedId === e.je_id ? "bg-primary/[0.06]" : "hover:bg-muted-surface/60 focus-visible:bg-muted-surface",
                )}
              >
                <td className={cn("border-l-[3px] px-5 py-3", severityBorder[e.severity])}>
                  <div className="font-medium text-foreground">{e.je_id}</div>
                  <div className="max-w-[180px] truncate text-xs text-muted">{e.description}</div>
                </td>
                <td className="whitespace-nowrap px-3 py-3 tabular text-muted">{e.posting_date}</td>
                <td className="px-3 py-3 text-muted">{e.preparer}</td>
                <td className="whitespace-nowrap px-3 py-3 text-right tabular font-medium text-foreground">
                  {formatCurrency(e.amount)}
                </td>
                <td className="px-3 py-3">
                  <span className="text-foreground">{e.findings[0]?.title}</span>
                  {e.findings.length > 1 ? (
                    <span className="ml-1.5 rounded bg-muted-surface px-1.5 py-0.5 text-[11px] text-muted">
                      +{e.findings.length - 1}
                    </span>
                  ) : null}
                </td>
                <td className="px-3 py-3">
                  <SeverityBadge severity={e.severity} />
                </td>
                <td className="px-5 py-3">
                  <RiskMeter score={e.risk_score} severity={e.severity} />
                </td>
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-5 py-12 text-center text-sm text-muted">
                  No entries match this filter.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
