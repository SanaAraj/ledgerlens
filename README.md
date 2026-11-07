<div align="center">

# LedgerLens

**AI journal-entry audit copilot. Upload a general ledger and it runs the audit risk tests a reviewer runs by hand, ranks every entry by risk, and explains each finding with the suggested procedure.**

[![CI](https://github.com/SanaAraj/ledgerlens/actions/workflows/ci.yml/badge.svg)](https://github.com/SanaAraj/ledgerlens/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Python 3.12](https://img.shields.io/badge/python-3.12-blue.svg)](apps/api/pyproject.toml)
[![React 18](https://img.shields.io/badge/React-18-149eca.svg?logo=react&logoColor=white)](apps/web/package.json)
[![LLM: OpenAI-compatible](https://img.shields.io/badge/LLM-OpenAI--compatible%20(Groq)-f55036.svg)](https://console.groq.com/)

<img src="docs/demo.gif" alt="Analyzing a 513-entry general ledger: a dashboard with an audit risk-index gauge, a Benford's Law chart of leading digits versus expected, exceptions by rule, and a risk-scored table; clicking an entry opens its findings and an AI-generated auditor assessment with the suggested procedure, then the view switches to dark mode" width="880">

</div>

Inspired by the kind of journal-entry testing the Big Four are automating (PwC's
GL.ai and Evidence Match). Every risk signal is a deterministic, reproducible test;
the language model only explains the findings, so the tool runs fully without an
API key.

## What it delivers

- **Ten audit tests on every entry**, from Benford's Law to segregation of duties.
- **A risk score and severity** for each flagged entry, highest risk first.
- **An explained finding** for each exception: what fired, why it matters, and the specific evidence.
- **An AI auditor assessment** on demand: a plain-English risk narrative and the suggested audit procedure.
- **A dashboard**: an audit risk-index gauge with a verdict, flagged counts and value, a Benford leading-digit chart, exceptions by rule, risk-severity mix, and the top preparers, in light or dark theme.
- **An exportable XLSX workpaper** with a summary tab and a colour-coded exceptions tab.

## The audit tests

| Test | What it catches | Severity |
|---|---|---|
| Segregation of duties | Same person prepared and approved | High |
| Unapproved high-value | At or above the approval threshold with no approver | High |
| Duplicate | Same amount and account across two entries | High |
| Threshold avoidance | Amount just below the approval threshold | High |
| High-risk wording | "reversal", "plug", "write-off", "adjustment", etc. | Medium |
| Weekend posting | Posted on a non-business day | Medium |
| After-hours | Created late at night or very early | Medium |
| Rare account combination | A debit/credit pairing almost never seen | Medium |
| Period-end manual | Manual entry in the last days of the period | Medium |
| Round amount | Large, perfectly round value | Low |
| Benford's Law | Leading-digit distribution versus expected (portfolio level) | - |

## How it works

```text
Browser (upload CSV)
      |
      v
Caddy :8100
  |-- /api/*  --> FastAPI
  `-- /*      --> React dashboard
                    |
                    v
          parse + normalise columns
                    |
          ten deterministic audit tests  +  Benford analysis
                    |
          additive risk score, worst-case severity
                    |
      ranked exceptions  ->  dashboard, drawer, XLSX workpaper
                    |
          (optional) LLM explains one entry on demand
```

## Run it

### One command (Docker)

```bash
cp .env.example .env     # optional: add GROQ_API_KEY for the AI assessment
docker compose up --build
```

Open [http://localhost:8100](http://localhost:8100), then click **Analyze sample
ledger** or drop in your own CSV. The audit tests run with no key; only the "Generate
assessment" button needs `GROQ_API_KEY` (and falls back to a rules-based explanation
without one).

### Local development

```bash
bun install

# API (terminal 1)
cd apps/api && uv venv && uv pip install -e ".[dev]" && uv run ledgerlens-api

# Web (terminal 2)
cd apps/web && bun run dev        # http://localhost:5173, proxies /api to :8787
```

## Tech stack

| Layer | Choice |
|---|---|
| Audit engine | Python, pandas, numpy |
| API | FastAPI, Pydantic, Uvicorn |
| Explanations | OpenAI-compatible API (Groq by default), with a rules-based fallback |
| Export | openpyxl |
| Web | React, TypeScript, Vite, Tailwind, Recharts, TanStack Query |
| Monorepo | Bun workspaces, Turborepo |
| Runtime | Docker Compose, Caddy |

## Verification

```bash
bun run lint && bun run typecheck && bun run test && bun run build
```

The API suite covers parsing, every rule, risk ranking, Benford, the rules-based
fallback, the XLSX export, and all endpoints. GitHub Actions runs Ruff and pytest
for the API, ESLint, TypeScript, Vitest and the production build for the web, and
validates the Compose file.

## Limitations

- Risk weights and thresholds are sensible defaults, not calibrated to a specific entity's control environment; they are configurable in `.env` and the rule registry.
- The duplicate and rare-combination tests are heuristics on amount, account, and date; they surface candidates for review, not confirmed errors.
- Benford's Law is a portfolio-level indicator; a nonconforming result is a prompt to investigate, not proof of manipulation.
- Analysis is in-memory and single-process, suitable for interactive review rather than a continuous, multi-tenant monitoring deployment.

## License

MIT - see [LICENSE](LICENSE).
