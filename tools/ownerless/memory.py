"""Ask Cognee through the data stack's POST /api/ask.

The service asks three memories (Airflow only, DataHub only, combined). Only the combined memory
joins both systems, so that is the answer we return, with the connector documents it used.
"""

import requests

from . import OwnerlessError
from .config import MemoryConfig

COMBINED = "combined"


def ask(cfg: MemoryConfig, question: str) -> dict:
    url = f"{cfg.url.rstrip('/')}/api/ask"
    try:
        response = requests.post(url, json={"question": question}, timeout=cfg.timeout_seconds)
    except requests.Timeout:
        raise OwnerlessError(
            f"Cognee did not answer within {cfg.timeout_seconds}s; use DataHub lineage instead"
        ) from None
    except requests.RequestException as exc:
        raise OwnerlessError(f"the Cognee service is unreachable at {cfg.url}: {exc}") from None
    if response.status_code != 200:
        detail = response.json().get("detail") if response.content else response.status_code
        raise OwnerlessError(f"Cognee /api/ask failed: {detail}")
    results = response.json().get("results") or []
    combined = next((r for r in results if r.get("memory") == COMBINED), None)
    if combined is None:
        raise OwnerlessError("Cognee returned no combined (Airflow + DataHub) memory")
    if combined.get("error"):
        raise OwnerlessError(f"Cognee: {combined['error']}")
    documents = (combined.get("evidence") or {}).get("documents") or []
    return {
        "question": question,
        "memory": combined.get("label"),
        "answer": combined.get("answer", ""),
        "evidence": [
            {key: doc.get(key) for key in ("title", "source", "url") if doc.get(key)} for doc in documents
        ],
        "elapsed_ms": combined.get("elapsed_ms"),
    }
