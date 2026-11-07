import { useMutation } from "@tanstack/react-query";
import { Download, RotateCcw } from "lucide-react";
import { useState } from "react";
import { Dashboard } from "@/components/Dashboard";
import { Header } from "@/components/Header";
import { Button, Spinner } from "@/components/ui/primitives";
import { UploadPanel } from "@/components/UploadPanel";
import { analyzeFile, analyzeSample, exportWorkpaper } from "@/lib/api";
import type { AnalysisResult } from "@/lib/types";

export function App() {
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const analyze = useMutation({
    mutationFn: (file: File | null) => (file ? analyzeFile(file) : analyzeSample()),
    onSuccess: setResult,
  });

  const exportWp = useMutation({ mutationFn: exportWorkpaper });

  const headerActions = result ? (
    <>
      <Button
        variant="onInk"
        size="sm"
        onClick={() => {
          setResult(null);
          analyze.reset();
        }}
      >
        <RotateCcw className="h-3.5 w-3.5" /> New analysis
      </Button>
      <Button size="sm" onClick={() => exportWp.mutate(result)} disabled={exportWp.isPending}>
        {exportWp.isPending ? <Spinner className="h-3.5 w-3.5" /> : <Download className="h-3.5 w-3.5" />}
        Export workpaper
      </Button>
    </>
  ) : null;

  return (
    <div className="min-h-screen bg-background">
      <Header right={headerActions} />
      <main className="animate-fade-in">
        {result ? (
          <Dashboard result={result} />
        ) : (
          <UploadPanel
            onFile={(f) => analyze.mutate(f)}
            onSample={() => analyze.mutate(null)}
            loading={analyze.isPending}
            error={analyze.isError ? (analyze.error as Error).message : null}
          />
        )}
      </main>
    </div>
  );
}
