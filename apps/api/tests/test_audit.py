from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from app.audit.engine import LedgerError, analyze
from app.audit.rules import RULES
from app.data import sample
from app.export import workpaper
from app.llm.explain import _rules_fallback
from app.main import app

client = TestClient(app)


@pytest.fixture(scope="module")
def result():
    return analyze(sample.generate(), "sample.csv", "2026-11-07")


def test_sample_parses_and_flags(result):
    assert result.stats.total_entries > 400
    assert result.stats.total_lines == result.stats.total_entries * 2
    assert result.stats.flagged_entries > 20
    assert result.stats.high_risk > 0


def test_every_rule_can_fire(result):
    fired = {f.rule for e in result.entries for f in e.findings}
    assert fired == set(RULES.keys())


def test_entries_sorted_by_risk(result):
    scores = [(e.severity, e.risk_score) for e in result.entries]
    order = {"high": 0, "medium": 1, "low": 2}
    keys = [(order[s], -r) for s, r in scores]
    assert keys == sorted(keys)


def test_benford_shape(result):
    b = result.stats.benford
    assert len(b.digits) == 9
    assert abs(sum(d.expected for d in b.digits) - 1.0) < 1e-6


def test_rejects_garbage():
    with pytest.raises(LedgerError):
        analyze("not,a,ledger\n1,2,3", "bad.csv", "2026-11-07")


def test_rules_fallback_without_key(result):
    exp = _rules_fallback(result.entries[0])
    assert exp.source == "rules"
    assert exp.narrative


def test_workpaper_is_valid_xlsx(result):
    data = workpaper.build(result)
    assert data[:2] == b"PK"
    assert len(data) > 2000


def test_health():
    r = client.get("/api/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


def test_sample_analyze_endpoint():
    r = client.get("/api/sample/analyze")
    assert r.status_code == 200
    body = r.json()
    assert body["stats"]["flagged_entries"] > 0
    assert len(body["entries"]) > 0


def test_analyze_upload_roundtrip():
    csv_bytes = sample.generate().encode()
    r = client.post("/api/analyze", files={"file": ("ledger.csv", csv_bytes, "text/csv")})
    assert r.status_code == 200
    assert r.json()["stats"]["total_entries"] > 400


def test_explain_and_export_endpoints():
    analyzed = client.get("/api/sample/analyze").json()
    entry = analyzed["entries"][0]
    r = client.post("/api/explain", json=entry)
    assert r.status_code == 200
    assert r.json()["narrative"]
    r = client.post("/api/export", json=analyzed)
    assert r.status_code == 200
    assert r.content[:2] == b"PK"
