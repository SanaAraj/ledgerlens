from __future__ import annotations

import calendar
import csv
import io
import random
from datetime import datetime, timedelta

ACCOUNTS = {
    "1000": "Cash",
    "1100": "Accounts Receivable",
    "1200": "Inventory",
    "1500": "Fixed Assets",
    "2000": "Accounts Payable",
    "2100": "Accrued Liabilities",
    "4000": "Revenue",
    "5000": "Cost of Goods Sold",
    "6000": "Payroll Expense",
    "6100": "Rent Expense",
    "6200": "Utilities",
    "6300": "Travel and Entertainment",
    "6400": "Professional Fees",
    "6500": "Marketing",
    "6900": "Miscellaneous Expense",
}

PREPARERS = ["j.smith", "a.khan", "m.lopez", "r.chen", "s.patel", "d.wilson", "k.nguyen"]
APPROVERS = ["controller", "fin.manager", "cfo"]

NORMAL_PAIRS = [
    ("6400", "2000", "Consulting services invoice"),
    ("6100", "1000", "Monthly office rent"),
    ("6200", "2000", "Electricity and water"),
    ("5000", "1200", "Cost of goods sold"),
    ("1100", "4000", "Customer sales invoice"),
    ("6000", "1000", "Payroll run"),
    ("6300", "2000", "Employee travel reimbursement"),
    ("6500", "2000", "Advertising campaign"),
    ("1200", "2000", "Inventory purchase"),
    ("1500", "1000", "Equipment purchase"),
]


def _benford_amount(rng: random.Random) -> float:
    return round(10 ** rng.uniform(2.0, 5.3), 2)


def _business_ts(rng: random.Random, day: datetime) -> datetime:
    return day.replace(hour=rng.randint(8, 17), minute=rng.randint(0, 59), second=rng.randint(0, 59))


def _weekday(rng: random.Random, start: datetime, end: datetime) -> datetime:
    span = (end - start).days
    while True:
        d = start + timedelta(days=rng.randint(0, span))
        if d.weekday() < 5:
            return d


def generate(n_entries: int = 460, seed: int = 42) -> str:
    rng = random.Random(seed)
    start = datetime(2026, 1, 1)
    end = datetime(2026, 6, 30)
    rows: list[dict] = []
    counter = 100001

    def add(debit_acct, credit_acct, amount, desc, day, ts, preparer, approver, source):
        nonlocal counter
        je = f"JE-{counter}"
        counter += 1
        common = dict(
            je_id=je,
            posting_date=f"{day:%Y-%m-%d}",
            entry_timestamp=f"{ts:%Y-%m-%d %H:%M:%S}",
            description=desc,
            preparer=preparer,
            approver=approver,
            source=source,
        )
        rows.append({**common, "line_no": 1, "account": debit_acct,
                     "account_name": ACCOUNTS[debit_acct], "debit": amount, "credit": 0})
        rows.append({**common, "line_no": 2, "account": credit_acct,
                     "account_name": ACCOUNTS[credit_acct], "debit": 0, "credit": amount})
        return je

    for _ in range(n_entries):
        da, ca, desc = rng.choice(NORMAL_PAIRS)
        amount = _benford_amount(rng)
        day = _weekday(rng, start, end)
        ts = _business_ts(rng, day)
        preparer = rng.choice(PREPARERS)
        approver = rng.choice(APPROVERS) if amount >= 10000 or rng.random() < 0.6 else ""
        add(da, ca, amount, desc, day, ts, preparer, approver, "Automated")

    for _ in range(5):
        day = _weekday(rng, start, end)
        p = rng.choice(PREPARERS)
        add("6400", "2000", round(rng.uniform(2000, 8000), 2),
            "Consulting services invoice", day, _business_ts(rng, day), p, p, "Manual")

    for _ in range(4):
        day = _weekday(rng, start, end)
        amt = round(rng.uniform(1000, 7000), 2)
        add("6300", "2000", amt, "Employee travel reimbursement", day,
            _business_ts(rng, day), rng.choice(PREPARERS), rng.choice(APPROVERS), "Automated")
        day2 = day + timedelta(days=rng.randint(1, 5))
        add("6300", "2000", amt, "Employee travel reimbursement", day2,
            _business_ts(rng, day2), rng.choice(PREPARERS), rng.choice(APPROVERS), "Automated")

    for _ in range(5):
        day = _weekday(rng, start, end)
        add("6900", "2000", round(rng.uniform(9500, 9980), 2),
            "Vendor services", day, _business_ts(rng, day), rng.choice(PREPARERS),
            rng.choice(APPROVERS), "Manual")

    for _ in range(4):
        day = _weekday(rng, start, end)
        add("1500", "1000", round(rng.uniform(12000, 48000), 2),
            "Equipment purchase", day, _business_ts(rng, day), rng.choice(PREPARERS), "", "Manual")

    for _ in range(6):
        span = (end - start).days
        d = start + timedelta(days=rng.randint(0, span))
        while d.weekday() < 5:
            d = start + timedelta(days=rng.randint(0, span))
        add("6500", "2000", _benford_amount(rng), "Advertising campaign", d,
            _business_ts(rng, d), rng.choice(PREPARERS), rng.choice(APPROVERS), "Automated")

    for _ in range(6):
        day = _weekday(rng, start, end)
        ts = day.replace(hour=rng.choice([1, 2, 3, 23]), minute=rng.randint(0, 59))
        add("6900", "2000", _benford_amount(rng), "Month-end accrual", day, ts,
            rng.choice(PREPARERS), rng.choice(APPROVERS), "Manual")

    for _ in range(5):
        month = rng.randint(1, 6)
        last = calendar.monthrange(2026, month)[1]
        day = datetime(2026, month, last)
        add("6000", "2100", _benford_amount(rng), "Payroll accrual adjustment", day,
            _business_ts(rng, day), rng.choice(PREPARERS), rng.choice(APPROVERS), "Manual")

    for _ in range(5):
        day = _weekday(rng, start, end)
        amt = rng.choice([25000, 50000, 75000, 100000])
        add("6400", "2000", amt, "Professional fees", day, _business_ts(rng, day),
            rng.choice(PREPARERS), rng.choice(APPROVERS), "Manual")

    keywords = ["Reclass to correct prior error", "Reversal of accrual", "Plug to balance intercompany",
                "Write-off of stale balance", "Manual adjustment per management", "True-up of estimate"]
    for kw in keywords:
        day = _weekday(rng, start, end)
        add("6900", "2100", _benford_amount(rng), kw, day, _business_ts(rng, day),
            rng.choice(PREPARERS), rng.choice(APPROVERS), "Manual")

    for _ in range(3):
        day = _weekday(rng, start, end)
        add("4000", "6900", round(rng.uniform(5000, 40000), 2),
            "Revenue reclassification to expense", day, _business_ts(rng, day),
            rng.choice(PREPARERS), rng.choice(APPROVERS), "Manual")

    out = io.StringIO()
    fields = ["je_id", "line_no", "posting_date", "entry_timestamp", "account",
              "account_name", "description", "debit", "credit", "preparer", "approver", "source"]
    writer = csv.DictWriter(out, fieldnames=fields)
    writer.writeheader()
    for r in sorted(rows, key=lambda r: r["je_id"]):
        writer.writerow(r)
    return out.getvalue()
