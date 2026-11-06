export type Severity = "high" | "medium" | "low";

export interface Finding {
  rule: string;
  title: string;
  severity: Severity;
  detail: string;
  evidence: Record<string, string | number | null>;
}

export interface EntryRisk {
  je_id: string;
  posting_date: string;
  entry_timestamp: string | null;
  preparer: string;
  approver: string | null;
  source: string;
  amount: number;
  line_count: number;
  accounts: string[];
  description: string;
  risk_score: number;
  severity: Severity;
  findings: Finding[];
}

export interface BenfordDigit {
  digit: number;
  actual: number;
  expected: number;
}

export interface Benford {
  digits: BenfordDigit[];
  mad: number;
  conformity: "close" | "acceptable" | "marginal" | "nonconforming";
  sample_size: number;
}

export interface NamedCount {
  name: string;
  count: number;
  value: number;
}

export interface Stats {
  total_entries: number;
  total_lines: number;
  total_value: number;
  flagged_entries: number;
  flagged_value: number;
  high_risk: number;
  medium_risk: number;
  low_risk: number;
  by_rule: NamedCount[];
  by_preparer: NamedCount[];
  date_range: [string, string];
  benford: Benford;
}

export interface AnalysisResult {
  filename: string;
  generated_at: string;
  stats: Stats;
  entries: EntryRisk[];
}

export interface Explanation {
  je_id: string;
  narrative: string;
  procedure: string;
  source: "llm" | "rules";
}
