import { AlertCircle, Download, FileSpreadsheet, Sparkles, UploadCloud } from "lucide-react";
import { useRef, useState } from "react";
import { Button, Card, Spinner } from "@/components/ui/primitives";

const CHECKS = [
  "Benford's Law",
  "Duplicates",
  "Threshold avoidance",
  "Segregation of duties",
  "Weekend postings",
  "After-hours entries",
  "Period-end manuals",
  "Rare account pairs",
  "Round amounts",
  "Risky wording",
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
    <div className="mx-auto max-w-3xl px-6 py-14 sm:py-20">
      <div className="text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
          <Sparkles className="h-3.5 w-3.5" /> AI audit copilot
        </span>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-foreground sm:text-[2.5rem] sm:leading-[1.1]">
          Surface the risky journal entries, instantly
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-[15px] leading-relaxed text-muted">
          Upload a general ledger and LedgerLens runs the audit risk tests a reviewer
          runs by hand, then ranks every entry by risk with an explanation and the
          suggested procedure.
        </p>
      </div>

      <Card className="mt-9 p-2">
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
          className={`flex w-full flex-col items-center justify-center gap-3 rounded-md border-2 border-dashed px-6 py-12 text-center transition-colors ${
            dragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted-surface/60"
          }`}
        >
          {loading ? (
            <>
              <Spinner className="h-7 w-7 text-primary" />
              <p className="text-sm font-medium text-foreground">Analyzing ledger…</p>
            </>
          ) : (
            <>
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-muted-surface text-muted">
                <UploadCloud className="h-6 w-6" />
              </span>
              <div>
                <p className="text-sm font-medium text-foreground">
                  Drop a general-ledger CSV, or <span className="text-primary">browse</span>
                </p>
                <p className="mt-1 text-xs text-muted">
                  Columns like je_id, posting_date, account, debit, credit, preparer, approver
                </p>
              </div>
            </>
          )}
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
      </Card>

      {error ? (
        <div
          role="alert"
          className="mt-4 flex items-start gap-2 rounded-md border border-high/30 bg-high-surface px-4 py-3 text-sm text-high"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}

      <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
        <Button onClick={onSample} disabled={loading}>
          <FileSpreadsheet className="h-4 w-4" /> Analyze sample ledger
        </Button>
        <a
          href="/api/sample/download"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-foreground"
        >
          <Download className="h-4 w-4" /> Download the sample CSV
        </a>
      </div>

      <div className="mt-10">
        <p className="text-center text-xs font-medium uppercase tracking-wider text-muted">
          Ten audit tests, every entry
        </p>
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          {CHECKS.map((c) => (
            <span
              key={c}
              className="rounded-full border border-border bg-surface px-3 py-1 text-xs text-muted shadow-card"
            >
              {c}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
