import { AlertCircle, Check, Download, FileSpreadsheet, UploadCloud } from "lucide-react";
import { useRef, useState } from "react";
import { LandingPreview } from "@/components/LandingPreview";
import { Button, Spinner } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";

const FEATURES = [
  "Ten deterministic audit tests",
  "Every entry risk-scored and explained",
  "AI assessment and suggested procedure",
  "Exportable XLSX workpaper",
];

export function UploadPanel({
  onFile,
  onSample,
  loading,
  error,
}: {
  onFile: (file: File) => void;
  onSample: () => void;
  loading: boolean;
  error: string | null;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  return (
    <div className="relative">
      <div aria-hidden className="pointer-events-none absolute inset-0 hero-grid opacity-70" />
      <div className="relative mx-auto max-w-[1180px] px-6 py-14 lg:py-20">
        <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_1fr] lg:gap-14">
          <div>
            <h1 className="text-4xl font-semibold leading-[1.08] tracking-tight text-foreground sm:text-5xl">
              Surface the risky journal entries, instantly
            </h1>
            <p className="mt-4 max-w-md text-[15px] leading-relaxed text-muted">
              Upload a general ledger and LedgerLens runs the audit risk tests a reviewer
              runs by hand, then ranks every entry by risk with an explanation and the
              suggested procedure.
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-4">
              <Button
                onClick={onSample}
                disabled={loading}
                className="h-11 px-5 text-[15px]"
              >
                {loading ? (
                  <>
                    <Spinner className="h-4 w-4" /> Analyzing ledger
                  </>
                ) : (
                  <>
                    <FileSpreadsheet className="h-4 w-4" /> Analyze sample ledger
                  </>
                )}
              </Button>
              <a
                href="/api/sample/download"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-foreground"
              >
                <Download className="h-4 w-4" /> Download the sample CSV
              </a>
            </div>

            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                const file = e.dataTransfer.files?.[0];
                if (file) onFile(file);
              }}
              disabled={loading}
              className={cn(
                "mt-4 flex w-full items-center gap-3 rounded-lg border border-dashed px-4 py-3.5 text-left transition-colors disabled:opacity-60",
                dragging
                  ? "border-primary bg-primary/5"
                  : "border-border-strong hover:border-primary/50 hover:bg-surface",
              )}
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted-surface text-muted">
                <UploadCloud className="h-[18px] w-[18px]" />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-medium text-foreground">
                  Drop your own ledger CSV, or <span className="text-primary">browse</span>
                </span>
                <span className="block truncate text-xs text-muted">
                  je_id, posting_date, account, debit, credit, preparer, approver
                </span>
              </span>
              <input
                ref={inputRef}
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) onFile(file);
                  e.target.value = "";
                }}
              />
            </button>

            {error ? (
              <div
                role="alert"
                className="mt-3 flex items-start gap-2 rounded-md border border-high/30 bg-high-surface px-4 py-2.5 text-sm text-high"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            ) : null}

            <ul className="mt-8 grid gap-x-6 gap-y-3 sm:grid-cols-2">
              {FEATURES.map((f) => (
                <li key={f} className="flex items-center gap-2.5 text-sm text-foreground">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-ok-surface text-ok">
                    <Check className="h-3 w-3" strokeWidth={3} />
                  </span>
                  {f}
                </li>
              ))}
            </ul>
          </div>

          <div className="hidden lg:block">
            <LandingPreview />
          </div>
        </div>
      </div>
    </div>
  );
}
