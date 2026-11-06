import { useMutation } from "@tanstack/react-query";
import { Bot, ClipboardCheck, Sparkles, X } from "lucide-react";
import { useEffect } from "react";
import { Badge, Button, SeverityBadge, Spinner } from "@/components/ui/primitives";
import { explainEntry } from "@/lib/api";
import type { EntryRisk } from "@/lib/types";
import { cn, formatCurrency, severityDot } from "@/lib/utils";

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-wide text-muted">{label}</dt>
      <dd className="mt-0.5 text-sm text-foreground">{value || "n/a"}</dd>
    </div>
  );
}

export function EntryDrawer({ entry, onClose }: { entry: EntryRisk | null; onClose: () => void }) {
  const explain = useMutation({ mutationFn: explainEntry });

  useEffect(() => {
    explain.reset();
    if (!entry) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entry]);

  if (!entry) return null;

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div
        className="absolute inset-0 bg-ink/30 backdrop-blur-[1px]"
        onClick={onClose}
        aria-hidden
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={`Entry ${entry.je_id}`}
        className="relative flex h-full w-full max-w-md animate-slide-in flex-col border-l border-border bg-surface shadow-pop"
      >
        <div className="flex items-start justify-between border-b border-border px-5 py-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-foreground">{entry.je_id}</h2>
              <SeverityBadge severity={entry.severity} />
            </div>
            <p className="mt-1 text-xs text-muted">Risk score {entry.risk_score} of 100</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-md p-1.5 text-muted hover:bg-muted-surface hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-auto px-5 py-4">
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
            <Meta label="Posting date" value={entry.posting_date} />
            <Meta label="Created" value={entry.entry_timestamp ?? ""} />
            <Meta label="Value" value={formatCurrency(entry.amount)} />
            <Meta label="Source" value={entry.source} />
            <Meta label="Preparer" value={entry.preparer} />
            <Meta label="Approver" value={entry.approver ?? "none"} />
            <Meta label="Accounts" value={entry.accounts.join(", ")} />
            <Meta label="Lines" value={String(entry.line_count)} />
          </dl>
          {entry.description ? (
            <p className="mt-4 rounded-md bg-muted-surface px-3 py-2 text-sm text-foreground">
              {entry.description}
            </p>
          ) : null}

          <h3 className="mt-6 text-xs font-semibold uppercase tracking-wide text-muted">
            Findings ({entry.findings.length})
          </h3>
          <ul className="mt-2 space-y-2.5">
            {entry.findings.map((f, i) => (
              <li key={i} className="rounded-md border border-border p-3">
                <div className="flex items-center gap-2">
                  <span className={cn("h-2 w-2 rounded-full", severityDot[f.severity])} aria-hidden />
                  <span className="text-sm font-medium text-foreground">{f.title}</span>
                </div>
                <p className="mt-1.5 text-[13px] leading-relaxed text-muted">{f.detail}</p>
              </li>
            ))}
          </ul>

          <div className="mt-6 rounded-lg border border-border bg-muted-surface/50 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bot className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">Auditor assessment</h3>
              </div>
              {explain.data ? (
                <Badge className={explain.data.source === "llm" ? "bg-primary/10 text-primary" : "bg-muted-surface text-muted"}>
                  {explain.data.source === "llm" ? "AI generated" : "Rules-based"}
                </Badge>
              ) : null}
            </div>

            {!explain.data && !explain.isPending ? (
              <>
                <p className="mt-2 text-[13px] text-muted">
                  Generate a plain-English risk assessment and the suggested audit procedure for this entry.
                </p>
                <Button size="sm" className="mt-3" onClick={() => explain.mutate(entry)}>
                  <Sparkles className="h-3.5 w-3.5" /> Generate assessment
                </Button>
              </>
            ) : null}

            {explain.isPending ? (
              <div className="mt-3 flex items-center gap-2 text-sm text-muted">
                <Spinner className="h-4 w-4 text-primary" /> Assessing entry…
              </div>
            ) : null}

            {explain.data ? (
              <div className="mt-3 space-y-3">
                <p className="text-[13px] leading-relaxed text-foreground">{explain.data.narrative}</p>
                {explain.data.procedure ? (
                  <div className="flex items-start gap-2 rounded-md bg-surface p-3">
                    <ClipboardCheck className="mt-0.5 h-4 w-4 shrink-0 text-ok" />
                    <div>
                      <div className="text-[11px] font-semibold uppercase tracking-wide text-muted">
                        Suggested procedure
                      </div>
                      <p className="mt-0.5 text-[13px] leading-relaxed text-foreground">
                        {explain.data.procedure}
                      </p>
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}

            {explain.isError ? (
              <p className="mt-2 text-[13px] text-high">Could not generate an assessment. Try again.</p>
            ) : null}
          </div>
        </div>
      </aside>
    </div>
  );
}
