from __future__ import annotations

from dataclasses import dataclass

Severity = str


@dataclass(frozen=True)
class Rule:
    code: str
    title: str
    severity: Severity
    weight: int
    rationale: str
    procedure: str


RULES: dict[str, Rule] = {
    "SOD": Rule(
        "SOD",
        "Segregation of duties breached",
        "high",
        40,
        "The same person prepared and approved the entry, so no independent review occurred.",
        "Confirm the approver is independent of the preparer and re-perform the review of the entry and its support.",
    ),
    "UNAPPROVED": Rule(
        "UNAPPROVED",
        "Posted above approval threshold without approval",
        "high",
        35,
        "The entry value is at or above the approval threshold but carries no approver.",
        "Obtain evidence of the required approval; if none exists, treat as an unauthorised posting and investigate.",
    ),
    "DUPLICATE": Rule(
        "DUPLICATE",
        "Possible duplicate entry",
        "high",
        35,
        "Another entry posts the same amount to the same account within a short window, a common double-posting or duplicate-payment pattern.",
        "Trace both entries to source documents and confirm they represent distinct transactions, not a duplicate.",
    ),
    "THRESHOLD": Rule(
        "THRESHOLD",
        "Amount just below approval threshold",
        "high",
        30,
        "The amount sits just under the approval threshold, consistent with splitting or structuring to avoid review.",
        "Check for related entries that together exceed the threshold and confirm the amount was not engineered to avoid approval.",
    ),
    "KEYWORD": Rule(
        "KEYWORD",
        "High-risk wording in description",
        "medium",
        22,
        "The description contains language often associated with manual adjustments, reversals, or plugs.",
        "Read the narrative and supporting evidence; confirm the adjustment is legitimate and properly authorised.",
    ),
    "WEEKEND": Rule(
        "WEEKEND",
        "Posted on a weekend",
        "medium",
        20,
        "The entry was posted on a non-business day, which is unusual for routine activity.",
        "Corroborate why the entry was posted outside normal processing days.",
    ),
    "AFTERHOURS": Rule(
        "AFTERHOURS",
        "Created outside business hours",
        "medium",
        18,
        "The entry was created late at night or very early, outside normal working hours.",
        "Confirm the user and business reason for an out-of-hours posting.",
    ),
    "RARE_COMBO": Rule(
        "RARE_COMBO",
        "Rare account combination",
        "medium",
        18,
        "This debit/credit account pairing almost never occurs in the ledger, suggesting a non-routine or misclassified entry.",
        "Understand the business purpose of the unusual account combination and confirm correct classification.",
    ),
    "PERIOD_END": Rule(
        "PERIOD_END",
        "Manual entry at period-end",
        "medium",
        16,
        "A manual entry posted in the last days of the period is a classic place for earnings management or top-side adjustments.",
        "Scrutinise late manual entries for evidence they reflect genuine, properly cut-off transactions.",
    ),
    "ROUND": Rule(
        "ROUND",
        "Suspiciously round amount",
        "low",
        12,
        "A large, perfectly round amount is more consistent with an estimate or plug than a real invoiced transaction.",
        "Agree the round amount to third-party support rather than an internal estimate.",
    ),
}

SEVERITY_ORDER = {"high": 0, "medium": 1, "low": 2}


def severity_from_score(score: int) -> Severity:
    if score >= 60:
        return "high"
    if score >= 30:
        return "medium"
    return "low"
