# Sample data

`sample_general_ledger.csv` is a synthetic general ledger of 513 balanced journal
entries (1,026 lines) spanning 2026-01 to 2026-06. It is generated
deterministically by [`apps/api/app/data/sample.py`](../apps/api/app/data/sample.py),
so re-running the generator reproduces it exactly.

Most entries are routine. A controlled set of anomalies is planted so that every
audit test has something to find:

| Planted pattern | Rule it triggers |
|---|---|
| Same preparer and approver | Segregation of duties |
| Value at or above 10,000 with no approver | Unapproved high-value posting |
| Identical amount and account across two entries | Duplicate |
| Amounts in the 9,500 to 9,999 band | Threshold avoidance |
| Postings dated on a weekend | Weekend posting |
| Entries created at 01:00 to 03:00 or 23:00 | After-hours |
| Manual entries on the last day of a month | Period-end manual |
| Perfectly round amounts (25k, 50k, 100k) | Round amount |
| Descriptions with "reversal", "plug", "write-off", etc. | High-risk wording |
| A Revenue-to-Expense account pairing seen a handful of times | Rare account combination |

No real financial data is used. The schema (`je_id`, `posting_date`,
`entry_timestamp`, `account`, `debit`, `credit`, `preparer`, `approver`,
`source`, ...) mirrors a typical ERP journal-entry export, and the engine accepts
common column-name synonyms.
