# LedgerLens API

FastAPI service for the LedgerLens journal-entry audit engine.

```bash
uv venv && uv pip install -e ".[dev]"
uv run ledgerlens-api        # http://localhost:8787
uv run pytest
```

Endpoints are mounted under `/api` (`/api/analyze`, `/api/sample/analyze`, `/api/explain`, `/api/export`, `/api/health`).
