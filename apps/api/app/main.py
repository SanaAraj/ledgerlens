from __future__ import annotations

from datetime import UTC, datetime

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response

from app import config
from app.audit.engine import LedgerError, analyze
from app.data import sample as sample_data
from app.export import workpaper
from app.llm.explain import explain
from app.models import AnalysisResult, EntryRisk, Explanation

app = FastAPI(title="LedgerLens API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:4173",
        "http://localhost:8100",
    ],
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


def _now() -> str:
    return datetime.now(UTC).strftime("%Y-%m-%d %H:%M UTC")


@app.get("/api/health")
async def health() -> dict[str, str | bool]:
    return {"status": "ok", "llm": bool(config.GROQ_API_KEY)}


@app.get("/api/sample/download")
async def sample_download() -> Response:
    csv_text = sample_data.generate()
    return Response(
        content=csv_text,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=sample_general_ledger.csv"},
    )


@app.get("/api/sample/analyze", response_model=AnalysisResult)
async def sample_analyze() -> AnalysisResult:
    csv_text = sample_data.generate()
    return analyze(csv_text, "sample_general_ledger.csv", _now())


@app.post("/api/analyze", response_model=AnalysisResult)
async def analyze_upload(file: UploadFile = File(...)) -> AnalysisResult:
    raw = await file.read()
    if len(raw) > config.MAX_UPLOAD_MB * 1024 * 1024:
        raise HTTPException(status_code=413, detail=f"File exceeds {config.MAX_UPLOAD_MB} MB limit.")
    if not raw:
        raise HTTPException(status_code=400, detail="Empty file.")
    try:
        return analyze(raw, file.filename or "ledger.csv", _now())
    except LedgerError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


@app.post("/api/explain", response_model=Explanation)
async def explain_entry(entry: EntryRisk) -> Explanation:
    return explain(entry)


@app.post("/api/export")
async def export_workpaper(result: AnalysisResult) -> Response:
    data = workpaper.build(result)
    return Response(
        content=data,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=ledgerlens_workpaper.xlsx"},
    )


@app.exception_handler(LedgerError)
async def ledger_error_handler(_request, exc: LedgerError) -> JSONResponse:
    return JSONResponse(status_code=422, content={"detail": str(exc)})


def main() -> None:
    import uvicorn

    uvicorn.run("app.main:app", host="0.0.0.0", port=8787, reload=False)


if __name__ == "__main__":
    main()
