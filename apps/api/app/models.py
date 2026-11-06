from __future__ import annotations

from pydantic import BaseModel


class Finding(BaseModel):
    rule: str
    title: str
    severity: str
    detail: str
    evidence: dict[str, str | float | int | None]


class EntryRisk(BaseModel):
    je_id: str
    posting_date: str
    entry_timestamp: str | None
    preparer: str
    approver: str | None
    source: str
    amount: float
    line_count: int
    accounts: list[str]
    description: str
    risk_score: int
    severity: str
    findings: list[Finding]


class BenfordDigit(BaseModel):
    digit: int
    actual: float
    expected: float


class Benford(BaseModel):
    digits: list[BenfordDigit]
    mad: float
    conformity: str
    sample_size: int


class NamedCount(BaseModel):
    name: str
    count: int
    value: float


class Stats(BaseModel):
    total_entries: int
    total_lines: int
    total_value: float
    flagged_entries: int
    flagged_value: float
    high_risk: int
    medium_risk: int
    low_risk: int
    by_rule: list[NamedCount]
    by_preparer: list[NamedCount]
    date_range: list[str]
    benford: Benford


class AnalysisResult(BaseModel):
    filename: str
    generated_at: str
    stats: Stats
    entries: list[EntryRisk]


class Explanation(BaseModel):
    je_id: str
    narrative: str
    procedure: str
    source: str
