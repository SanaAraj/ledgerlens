from __future__ import annotations

from openai import OpenAI

from app import config
from app.audit.rules import RULES
from app.models import EntryRisk, Explanation

_client: OpenAI | None = None

_SYSTEM = (
    "You are a senior external auditor reviewing flagged journal entries. "
    "Given one entry and the rules it tripped, write a tight professional assessment. "
    "Return exactly two labelled sections and nothing else:\n"
    "NARRATIVE: two or three sentences on why this entry is risky, referencing the specifics.\n"
    "PROCEDURE: one or two concrete audit steps to resolve it. "
    "Be specific, neutral, and do not assume fraud; flag risk, not guilt."
)


def _get_client() -> OpenAI:
    global _client
    if _client is None:
        _client = OpenAI(api_key=config.GROQ_API_KEY, base_url=config.GROQ_BASE_URL)
    return _client


def _rules_fallback(entry: EntryRisk) -> Explanation:
    narrative = " ".join(f.detail for f in entry.findings)
    seen: list[str] = []
    for f in entry.findings:
        proc = RULES[f.rule].procedure
        if proc not in seen:
            seen.append(proc)
    return Explanation(
        je_id=entry.je_id,
        narrative=narrative,
        procedure=" ".join(seen),
        source="rules",
    )


def _entry_brief(entry: EntryRisk) -> str:
    lines = [
        f"Entry {entry.je_id}",
        f"Posting date: {entry.posting_date}",
        f"Created: {entry.entry_timestamp or 'n/a'}",
        f"Value: {entry.amount:,.2f}",
        f"Preparer: {entry.preparer or 'n/a'}; Approver: {entry.approver or 'none'}",
        f"Source: {entry.source or 'n/a'}",
        f"Accounts: {', '.join(entry.accounts)}",
        f"Description: {entry.description or 'n/a'}",
        "Rules tripped:",
    ]
    for f in entry.findings:
        lines.append(f"- {f.title} ({f.severity}): {f.detail}")
    return "\n".join(lines)


def explain(entry: EntryRisk) -> Explanation:
    if not config.GROQ_API_KEY:
        return _rules_fallback(entry)
    try:
        resp = _get_client().chat.completions.create(
            model=config.LLM_MODEL,
            messages=[
                {"role": "system", "content": _SYSTEM},
                {"role": "user", "content": _entry_brief(entry)},
            ],
            temperature=0.2,
            max_tokens=320,
        )
        text = resp.choices[0].message.content or ""
    except Exception:
        return _rules_fallback(entry)

    narrative, procedure = text, ""
    if "PROCEDURE:" in text:
        head, _, tail = text.partition("PROCEDURE:")
        narrative = head.replace("NARRATIVE:", "").strip()
        procedure = tail.strip()
    else:
        narrative = text.replace("NARRATIVE:", "").strip()
    if not narrative.strip():
        return _rules_fallback(entry)
    if not procedure:
        procedure = _rules_fallback(entry).procedure
    return Explanation(je_id=entry.je_id, narrative=narrative, procedure=procedure, source="llm")
