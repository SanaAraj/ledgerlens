from __future__ import annotations

import calendar
import io
import math
import re
from collections import defaultdict

import pandas as pd

from app import config
from app.audit.rules import RULES, SEVERITY_ORDER
from app.models import (
    AnalysisResult,
    Benford,
    BenfordDigit,
    EntryRisk,
    Finding,
    NamedCount,
    Stats,
)

_COLUMN_SYNONYMS = {
    "je_id": {"je_id", "entry_id", "journal_id", "document", "doc", "je", "voucher"},
    "posting_date": {"posting_date", "post_date", "date", "gl_date", "effective_date"},
    "entry_timestamp": {"entry_timestamp", "created_at", "entry_date", "created", "timestamp", "entered_at"},
    "account": {"account", "account_code", "gl_account", "acct", "account_no"},
    "account_name": {"account_name", "account_desc", "acct_name", "account_title"},
    "description": {"description", "narrative", "memo", "text", "details", "line_description"},
    "debit": {"debit", "dr", "debit_amount"},
    "credit": {"credit", "cr", "credit_amount"},
    "preparer": {"preparer", "user", "created_by", "entered_by", "prepared_by"},
    "approver": {"approver", "approved_by", "reviewer", "authorised_by", "authorized_by"},
    "source": {"source", "entry_type", "type", "origin", "je_type"},
}

_RISKY_KEYWORDS = re.compile(
    r"\b(adjust\w*|reclass\w*|revers\w*|correct\w*|plug|true[- ]?up|write[- ]?off|"
    r"misc\w*|temporary|temp|manual|accrual reversal|to balance|forc\w*|override)\b",
    re.IGNORECASE,
)


class LedgerError(ValueError):
    pass


def _resolve_columns(df: pd.DataFrame) -> pd.DataFrame:
    lower = {c: str(c).strip().lower() for c in df.columns}
    rename: dict[str, str] = {}
    for canonical, synonyms in _COLUMN_SYNONYMS.items():
        for col, low in lower.items():
            if low in synonyms:
                rename[col] = canonical
                break
    df = df.rename(columns=rename)
    if "je_id" not in df.columns:
        raise LedgerError("Could not find a journal-entry id column (je_id, entry_id, document).")
    if "debit" not in df.columns and "credit" not in df.columns:
        raise LedgerError("Could not find debit or credit amount columns.")
    return df


def _clean(df: pd.DataFrame) -> pd.DataFrame:
    df = _resolve_columns(df)
    df["je_id"] = df["je_id"].astype(str).str.strip()
    for col in ("account", "account_name", "description", "preparer", "approver", "source"):
        if col not in df.columns:
            df[col] = ""
        df[col] = df[col].fillna("").astype(str).str.strip()
    for col in ("debit", "credit"):
        if col not in df.columns:
            df[col] = 0.0
        df[col] = pd.to_numeric(df[col], errors="coerce").fillna(0.0)
    df["posting_date"] = pd.to_datetime(df.get("posting_date"), errors="coerce")
    if "entry_timestamp" in df.columns:
        df["entry_timestamp"] = pd.to_datetime(df["entry_timestamp"], errors="coerce")
    else:
        df["entry_timestamp"] = pd.NaT
    df = df[df["je_id"] != ""]
    if df.empty:
        raise LedgerError("No journal-entry rows found after parsing.")
    return df.reset_index(drop=True)


def _dominant_account(group: pd.DataFrame, side: str) -> str:
    sub = group[group[side] > 0]
    if sub.empty:
        return ""
    return str(sub.loc[sub[side].idxmax(), "account"])


def _build_entries(df: pd.DataFrame) -> pd.DataFrame:
    def _first_nonempty(s: pd.Series) -> str:
        for v in s:
            if str(v).strip():
                return str(v).strip()
        return ""

    g = df.groupby("je_id", sort=False)
    entries = g.agg(
        posting_date=("posting_date", "first"),
        entry_timestamp=("entry_timestamp", "first"),
        preparer=("preparer", _first_nonempty),
        approver=("approver", _first_nonempty),
        source=("source", _first_nonempty),
        amount=("debit", "sum"),
        line_count=("debit", "size"),
    )
    entries["accounts"] = g["account"].apply(lambda s: sorted({v for v in s if v}))
    entries["description"] = g["description"].apply(_first_nonempty)
    entries["debit_account"] = g.apply(lambda x: _dominant_account(x, "debit"), include_groups=False)
    entries["credit_account"] = g.apply(lambda x: _dominant_account(x, "credit"), include_groups=False)
    return entries


def _f(rule: str, detail: str, evidence: dict) -> Finding:
    r = RULES[rule]
    return Finding(rule=rule, title=r.title, severity=r.severity, detail=detail, evidence=evidence)


def _test_sod(entries, findings):
    for je, row in entries.iterrows():
        prep, appr = row["preparer"].lower(), row["approver"].lower()
        if prep and appr and prep == appr:
            findings[je].append(
                _f("SOD", f"{row['preparer']} both prepared and approved this entry.",
                   {"preparer": row["preparer"], "approver": row["approver"]})
            )


def _test_unapproved(entries, findings):
    for je, row in entries.iterrows():
        if row["amount"] >= config.APPROVAL_THRESHOLD and not row["approver"]:
            findings[je].append(
                _f("UNAPPROVED",
                   f"Value {row['amount']:,.0f} is at or above the {config.APPROVAL_THRESHOLD:,.0f} "
                   f"approval threshold but has no approver.",
                   {"amount": float(row["amount"]), "threshold": config.APPROVAL_THRESHOLD})
            )


def _test_threshold(entries, findings):
    lo = config.APPROVAL_THRESHOLD * (1 - config.JUST_BELOW_BAND)
    for je, row in entries.iterrows():
        if lo <= row["amount"] < config.APPROVAL_THRESHOLD:
            findings[je].append(
                _f("THRESHOLD",
                   f"Value {row['amount']:,.0f} sits just below the {config.APPROVAL_THRESHOLD:,.0f} "
                   f"approval threshold.",
                   {"amount": float(row["amount"]), "threshold": config.APPROVAL_THRESHOLD})
            )


def _test_keyword(entries, findings):
    for je, row in entries.iterrows():
        m = _RISKY_KEYWORDS.search(row["description"])
        if m:
            findings[je].append(
                _f("KEYWORD", f'Description contains "{m.group(0)}".',
                   {"description": row["description"], "match": m.group(0)})
            )


def _test_weekend(entries, findings):
    for je, row in entries.iterrows():
        d = row["posting_date"]
        if pd.notna(d) and d.weekday() >= 5:
            findings[je].append(
                _f("WEEKEND", f"Posted on {d:%A}, {d:%Y-%m-%d}.",
                   {"posting_date": f"{d:%Y-%m-%d}", "weekday": f"{d:%A}"})
            )


def _test_afterhours(entries, findings):
    for je, row in entries.iterrows():
        ts = row["entry_timestamp"]
        if pd.notna(ts) and (ts.hour < config.BUSINESS_HOUR_START or ts.hour >= config.BUSINESS_HOUR_END):
            findings[je].append(
                _f("AFTERHOURS", f"Created at {ts:%H:%M}, outside "
                   f"{config.BUSINESS_HOUR_START:02d}:00-{config.BUSINESS_HOUR_END:02d}:00.",
                   {"entry_timestamp": f"{ts:%Y-%m-%d %H:%M}", "hour": int(ts.hour)})
            )


def _test_period_end(entries, findings):
    for je, row in entries.iterrows():
        d = row["posting_date"]
        if pd.isna(d) or "manual" not in row["source"].lower():
            continue
        last_day = calendar.monthrange(d.year, d.month)[1]
        if d.day >= last_day - 1:
            findings[je].append(
                _f("PERIOD_END", f"Manual entry posted on {d:%Y-%m-%d}, at the period-end.",
                   {"posting_date": f"{d:%Y-%m-%d}", "source": row["source"]})
            )


def _test_round(entries, findings):
    for je, row in entries.iterrows():
        amt = row["amount"]
        if amt >= 1000 and amt % 1000 == 0:
            findings[je].append(
                _f("ROUND", f"Value {amt:,.0f} is a perfectly round amount.", {"amount": float(amt)})
            )


def _test_duplicate(df, entries, findings):
    sub = df[df["debit"] > 0].copy()
    sub["key"] = sub["account"] + "|" + sub["debit"].round(2).astype(str)
    for _key, grp in sub.groupby("key"):
        jes = sorted(set(grp["je_id"]))
        if len(jes) < 2:
            continue
        for je in jes:
            if je not in entries.index:
                continue
            others = [o for o in jes if o != je]
            findings[je].append(
                _f("DUPLICATE",
                   f"Same amount {grp['debit'].iloc[0]:,.2f} to account {grp['account'].iloc[0]} "
                   f"also appears in entry {others[0]}.",
                   {"amount": float(grp["debit"].iloc[0]), "account": str(grp["account"].iloc[0]),
                    "duplicate_of": others[0]})
            )


def _test_rare_combo(entries, findings):
    pairs = entries.apply(lambda r: f"{r['debit_account']}->{r['credit_account']}", axis=1)
    counts = pairs.value_counts()
    total = len(entries)
    threshold = max(1, int(config.RARE_COMBO_MAX_SHARE * total))
    for je, pair in pairs.items():
        da, ca = entries.loc[je, "debit_account"], entries.loc[je, "credit_account"]
        if not da or not ca:
            continue
        if counts[pair] <= threshold and total >= 50:
            findings[je].append(
                _f("RARE_COMBO",
                   f"Account pairing {da} -> {ca} occurs in only {counts[pair]} of {total} entries.",
                   {"debit_account": da, "credit_account": ca, "occurrences": int(counts[pair])})
            )


def _benford(df: pd.DataFrame) -> Benford:
    amounts = df.loc[df["debit"] >= 1, "debit"].abs()
    lead = amounts.apply(lambda x: int(str(int(x))[0]) if x >= 1 else 0)
    lead = lead[lead.between(1, 9)]
    n = len(lead)
    digits: list[BenfordDigit] = []
    mad_sum = 0.0
    for d in range(1, 10):
        expected = math.log10(1 + 1 / d)
        actual = (lead == d).sum() / n if n else 0.0
        mad_sum += abs(actual - expected)
        digits.append(BenfordDigit(digit=d, actual=round(actual, 4), expected=round(expected, 4)))
    mad = mad_sum / 9 if n else 0.0
    if mad < 0.006:
        conformity = "close"
    elif mad < 0.012:
        conformity = "acceptable"
    elif mad < 0.015:
        conformity = "marginal"
    else:
        conformity = "nonconforming"
    return Benford(digits=digits, mad=round(mad, 4), conformity=conformity, sample_size=int(n))


def analyze(data: bytes | str, filename: str, generated_at: str) -> AnalysisResult:
    buffer = io.BytesIO(data) if isinstance(data, bytes) else io.StringIO(data)
    try:
        raw = pd.read_csv(buffer)
    except Exception as exc:
        raise LedgerError(f"Could not read the file as CSV: {exc}") from exc

    df = _clean(raw)
    entries = _build_entries(df)

    findings: dict[str, list[Finding]] = defaultdict(list)
    _test_sod(entries, findings)
    _test_unapproved(entries, findings)
    _test_threshold(entries, findings)
    _test_keyword(entries, findings)
    _test_weekend(entries, findings)
    _test_afterhours(entries, findings)
    _test_period_end(entries, findings)
    _test_round(entries, findings)
    _test_duplicate(df, entries, findings)
    _test_rare_combo(entries, findings)

    flagged: list[EntryRisk] = []
    for je, fs in findings.items():
        if not fs:
            continue
        row = entries.loc[je]
        score = min(100, sum(RULES[f.rule].weight for f in fs))
        severity = min((f.severity for f in fs), key=lambda s: SEVERITY_ORDER[s])
        ts = row["entry_timestamp"]
        flagged.append(
            EntryRisk(
                je_id=je,
                posting_date=f"{row['posting_date']:%Y-%m-%d}" if pd.notna(row["posting_date"]) else "",
                entry_timestamp=f"{ts:%Y-%m-%d %H:%M}" if pd.notna(ts) else None,
                preparer=row["preparer"],
                approver=row["approver"] or None,
                source=row["source"],
                amount=round(float(row["amount"]), 2),
                line_count=int(row["line_count"]),
                accounts=list(row["accounts"]),
                description=row["description"],
                risk_score=score,
                severity=severity,
                findings=sorted(fs, key=lambda f: SEVERITY_ORDER[f.severity]),
            )
        )

    flagged.sort(key=lambda e: (SEVERITY_ORDER[e.severity], -e.risk_score))

    by_rule_counter: dict[str, int] = defaultdict(int)
    for fs in findings.values():
        for f in fs:
            by_rule_counter[f.rule] += 1
    by_rule = [
        NamedCount(name=RULES[code].title, count=cnt, value=0.0)
        for code, cnt in sorted(by_rule_counter.items(), key=lambda kv: -kv[1])
    ]

    prep_counter: dict[str, int] = defaultdict(int)
    prep_value: dict[str, float] = defaultdict(float)
    for e in flagged:
        prep_counter[e.preparer or "unknown"] += 1
        prep_value[e.preparer or "unknown"] += e.amount
    by_preparer = [
        NamedCount(name=k, count=v, value=round(prep_value[k], 2))
        for k, v in sorted(prep_counter.items(), key=lambda kv: -kv[1])[:8]
    ]

    posting_dates = df["posting_date"].dropna()
    date_range = (
        [f"{posting_dates.min():%Y-%m-%d}", f"{posting_dates.max():%Y-%m-%d}"]
        if not posting_dates.empty
        else ["", ""]
    )

    stats = Stats(
        total_entries=int(len(entries)),
        total_lines=int(len(df)),
        total_value=round(float(df["debit"].sum()), 2),
        flagged_entries=len(flagged),
        flagged_value=round(sum(e.amount for e in flagged), 2),
        high_risk=sum(1 for e in flagged if e.severity == "high"),
        medium_risk=sum(1 for e in flagged if e.severity == "medium"),
        low_risk=sum(1 for e in flagged if e.severity == "low"),
        by_rule=by_rule,
        by_preparer=by_preparer,
        date_range=date_range,
        benford=_benford(df),
    )

    return AnalysisResult(filename=filename, generated_at=generated_at, stats=stats, entries=flagged)
