# Technical decisions

Short records of the main trade-offs, and the alternatives that were rejected.

## Deterministic tests first, LLM second

Every risk signal comes from a deterministic test (Benford, duplicates, timing,
segregation of duties, and so on). The language model is used only to turn an
already-flagged entry into a plain-English assessment and a suggested procedure.

Rejected: an LLM-first design that asks a model to "find the risky entries". That
is unreproducible, unexplainable, and cannot be trusted in an audit context. Here
the numbers are fixed and auditable; the model only narrates them, and the app
runs fully without any API key (it falls back to a rules-based explanation).

## Risk is additive, severity is worst-case

An entry's risk score is the capped sum of the weights of the rules it tripped, so
an entry that fails several tests ranks above one that fails a single test. Its
severity label is the single most severe finding, which is how an auditor would
describe it ("this entry has a high-severity issue"), independent of the count.

## Provider is OpenAI-compatible

The explanation step speaks the OpenAI chat-completions API and defaults to Groq,
which is fast and free to start. The same code works against OpenAI, Together, or a
local server by changing the base URL and model. No provider lock-in.

## Stateless API, client holds the result

There is no database. `analyze` returns the full result to the browser, which
holds it and posts it back for the export step. This keeps the service trivial to
run (no migrations, no volumes) and keeps uploaded ledgers out of any store. The
trade-off is that results are not persisted across reloads, which is acceptable for
an interactive review tool.

## Monorepo with Turborepo and Bun

`apps/api` (FastAPI) and `apps/web` (React) live in one Bun workspace orchestrated
by Turborepo, so `bun run lint`, `test`, `typecheck`, and `build` fan out across
both. Caddy fronts them in production: static web plus a reverse proxy to the API,
so the browser talks to a single origin and no CORS is needed.

## Column resilience over a rigid schema

Real ERP exports name columns inconsistently, so the parser maps a set of synonyms
(`entry_id`/`document` to `je_id`, `created_at`/`entered_at` to the timestamp, and
so on) rather than demanding exact headers. Missing optional columns degrade
gracefully: no timestamps simply disables the after-hours test.
