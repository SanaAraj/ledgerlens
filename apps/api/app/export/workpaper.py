from __future__ import annotations

import io

from openpyxl import Workbook
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.utils import get_column_letter

from app.models import AnalysisResult

_HEADER_FILL = PatternFill("solid", fgColor="1F2937")
_HEADER_FONT = Font(color="FFFFFF", bold=True, size=11)
_TITLE_FONT = Font(bold=True, size=16, color="111827")
_SEVERITY_FILL = {
    "high": PatternFill("solid", fgColor="FEE2E2"),
    "medium": PatternFill("solid", fgColor="FEF3C7"),
    "low": PatternFill("solid", fgColor="E5E7EB"),
}
_THIN = Side(style="thin", color="D1D5DB")
_BORDER = Border(left=_THIN, right=_THIN, top=_THIN, bottom=_THIN)


def _style_header(ws, row: int, ncols: int) -> None:
    for c in range(1, ncols + 1):
        cell = ws.cell(row=row, column=c)
        cell.fill = _HEADER_FILL
        cell.font = _HEADER_FONT
        cell.alignment = Alignment(vertical="center")


def build(result: AnalysisResult) -> bytes:
    wb = Workbook()
    s = wb.active
    s.title = "Summary"
    s["A1"] = "LedgerLens audit workpaper"
    s["A1"].font = _TITLE_FONT
    s["A2"] = f"Source file: {result.filename}"
    s["A3"] = f"Generated: {result.generated_at}"
    st = result.stats
    summary = [
        ("Entries analysed", st.total_entries),
        ("Lines analysed", st.total_lines),
        ("Total debit value", round(st.total_value, 2)),
        ("Flagged entries", st.flagged_entries),
        ("Flagged value", round(st.flagged_value, 2)),
        ("High risk", st.high_risk),
        ("Medium risk", st.medium_risk),
        ("Low risk", st.low_risk),
        ("Benford MAD", st.benford.mad),
        ("Benford conformity", st.benford.conformity),
    ]
    for i, (k, v) in enumerate(summary, start=5):
        s.cell(row=i, column=1, value=k).font = Font(bold=True)
        s.cell(row=i, column=2, value=v)

    s.cell(row=5, column=4, value="Exceptions by rule").font = Font(bold=True)
    for i, nc in enumerate(st.by_rule, start=6):
        s.cell(row=i, column=4, value=nc.name)
        s.cell(row=i, column=5, value=nc.count)
    for col, width in ((1, 22), (2, 18), (3, 4), (4, 34), (5, 10)):
        s.column_dimensions[get_column_letter(col)].width = width

    ex = wb.create_sheet("Exceptions")
    headers = ["JE ID", "Posting date", "Created", "Preparer", "Approver", "Source",
               "Value", "Accounts", "Description", "Risk", "Severity", "Findings"]
    ex.append(headers)
    _style_header(ex, 1, len(headers))
    ex.freeze_panes = "A2"
    for e in result.entries:
        findings = " | ".join(f"{f.title}: {f.detail}" for f in e.findings)
        ex.append([
            e.je_id, e.posting_date, e.entry_timestamp or "", e.preparer, e.approver or "",
            e.source, e.amount, ", ".join(e.accounts), e.description, e.risk_score,
            e.severity.title(), findings,
        ])
        row = ex.max_row
        fill = _SEVERITY_FILL.get(e.severity)
        if fill:
            ex.cell(row=row, column=11).fill = fill
        for c in range(1, len(headers) + 1):
            ex.cell(row=row, column=c).border = _BORDER
            ex.cell(row=row, column=c).alignment = Alignment(vertical="top", wrap_text=(c in (8, 9, 12)))
    widths = [12, 13, 17, 12, 12, 11, 13, 16, 34, 7, 10, 60]
    for i, w in enumerate(widths, start=1):
        ex.column_dimensions[get_column_letter(i)].width = w

    buf = io.BytesIO()
    wb.save(buf)
    return buf.getvalue()
