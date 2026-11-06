import type { AnalysisResult, EntryRisk, Explanation } from "./types";

async function asError(res: Response): Promise<never> {
  let detail = `Request failed (${res.status})`;
  try {
    const body = await res.json();
    if (body?.detail) detail = body.detail;
  } catch {
    detail = (await res.text()) || detail;
  }
  throw new Error(detail);
}

export async function analyzeFile(file: File): Promise<AnalysisResult> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch("/api/analyze", { method: "POST", body: form });
  if (!res.ok) return asError(res);
  return res.json();
}

export async function analyzeSample(): Promise<AnalysisResult> {
  const res = await fetch("/api/sample/analyze");
  if (!res.ok) return asError(res);
  return res.json();
}

export async function explainEntry(entry: EntryRisk): Promise<Explanation> {
  const res = await fetch("/api/explain", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(entry),
  });
  if (!res.ok) return asError(res);
  return res.json();
}

export async function exportWorkpaper(result: AnalysisResult): Promise<void> {
  const res = await fetch("/api/export", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(result),
  });
  if (!res.ok) return asError(res);
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "ledgerlens_workpaper.xlsx";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
