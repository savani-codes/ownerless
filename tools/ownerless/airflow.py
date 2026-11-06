"""Airflow 3 REST API (/api/v2): failed runs, DAG structure, task logs and run status.

Authentication follows cognee-data-lab's Airflow connector: exchange the username and password
for a JWT at /auth/token, and log in again once when the token expires.
"""

import re
import time
from typing import Any
from urllib.parse import quote, urlparse

import requests

from . import OwnerlessError
from .config import AirflowConfig

_TIMEOUT = 30
_RETRIES = 3
_ERROR_LINE = re.compile(r"(error|exception|traceback|failed)", re.IGNORECASE)


class AirflowClient:
    def __init__(self, cfg: AirflowConfig, session: requests.Session | None = None):
        self.cfg = cfg
        self.base = cfg.url.rstrip("/")
        self._session = session or requests.Session()
        self._token: str | None = None

    def _login(self) -> None:
        response = self._send(
            "POST",
            "/auth/token",
            auth=False,
            json={"username": self.cfg.username, "password": self.cfg.password},
        )
        if response.status_code in (401, 403):
            raise OwnerlessError("Airflow rejected the username or password in ownerless.toml")
        self._check(response, "/auth/token")
        self._token = response.json().get("access_token")
        if not self._token:
            raise OwnerlessError("Airflow /auth/token returned no access_token")

    def request(self, method: str, path: str, **kwargs) -> Any:
        if not self._token:
            self._login()
        response = self._send(method, path, **kwargs)
        if response.status_code == 401:
            self._login()
            response = self._send(method, path, **kwargs)
        self._check(response, path)
        return response.json() if response.content else {}

    def get(self, path: str, params: Any = None) -> Any:
        return self.request("GET", path, params=params)

    def _send(self, method: str, path: str, auth: bool = True, **kwargs) -> requests.Response:
        headers = {"Accept": "application/json"}
        if auth and self._token:
            headers["Authorization"] = f"Bearer {self._token}"
        for attempt in range(_RETRIES):
            try:
                response = self._session.request(
                    method, self.base + path, headers=headers, timeout=_TIMEOUT, **kwargs
                )
            except requests.RequestException as exc:
                if attempt == _RETRIES - 1:
                    raise OwnerlessError(f"Airflow is unreachable at {self.base}: {exc}") from None
            else:
                if response.status_code not in (429, 502, 503, 504) or attempt == _RETRIES - 1:
                    return response
            time.sleep(2**attempt)
        raise AssertionError("unreachable")

    @staticmethod
    def _check(response: requests.Response, path: str) -> None:
        if response.status_code >= 400:
            raise OwnerlessError(
                f"Airflow {path} failed with HTTP {response.status_code}: {response.text[:300]}"
            )


# -- Links ------------------------------------------------------------------------------------------


def run_url(cfg: AirflowConfig, dag_id: str, run_id: str) -> str:
    return f"{cfg.ui}/dags/{quote(dag_id)}/runs/{quote(run_id, safe='')}"


def task_url(cfg: AirflowConfig, dag_id: str, run_id: str, task_id: str) -> str:
    return f"{run_url(cfg, dag_id, run_id)}/tasks/{quote(task_id)}"


def dag_url(cfg: AirflowConfig, dag_id: str) -> str:
    return f"{cfg.ui}/dags/{quote(dag_id)}"


def asset_table(uri: str) -> str:
    """postgres://postgres:5432/retail_demo/raw/orders -> retail_demo.raw.orders (DataHub's name)."""
    parsed = urlparse(uri)
    parts = [p for p in parsed.path.split("/") if p]
    return ".".join(parts) if parsed.scheme and parts else uri


# -- Reads ------------------------------------------------------------------------------------------


def _task_instances(client: AirflowClient, dag_id: str, run_id: str) -> list[dict]:
    path = f"/api/v2/dags/{quote(dag_id)}/dagRuns/{quote(run_id, safe='')}/taskInstances"
    body = client.get(path, params={"limit": 100})
    return body.get("task_instances") or []


def _run_view(client: AirflowClient, run: dict) -> dict:
    cfg = client.cfg
    dag_id, run_id = run["dag_id"], run["dag_run_id"]
    tasks = _task_instances(client, dag_id, run_id)
    return {
        "dag_id": dag_id,
        "run_id": run_id,
        "state": run.get("state"),
        "started": run.get("start_date"),
        "ended": run.get("end_date"),
        "url": run_url(cfg, dag_id, run_id),
        "tasks": [
            {
                "task_id": t["task_id"],
                "state": t.get("state"),
                "try_number": t.get("try_number"),
                "url": task_url(cfg, dag_id, run_id, t["task_id"]),
            }
            for t in sorted(tasks, key=lambda t: t.get("start_date") or "~")
        ],
    }


def failed_runs(client: AirflowClient, dag_id: str | None = None, limit: int = 3) -> dict:
    """The most recent failed runs, newest first, with every task's state."""
    path = f"/api/v2/dags/{quote(dag_id) if dag_id else '~'}/dagRuns"
    body = client.get(path, params={"state": "failed", "order_by": "-start_date", "limit": limit})
    runs = [_run_view(client, run) for run in body.get("dag_runs") or []]
    return {"failed_runs": runs, "count": len(runs)}


def run_status(client: AirflowClient, dag_id: str, run_id: str) -> dict:
    run = client.get(f"/api/v2/dags/{quote(dag_id)}/dagRuns/{quote(run_id, safe='')}")
    return _run_view(client, run)


def latest_run(client: AirflowClient, dag_id: str) -> dict | None:
    body = client.get(f"/api/v2/dags/{quote(dag_id)}/dagRuns", params={"order_by": "-start_date", "limit": 1})
    runs = body.get("dag_runs") or []
    return _run_view(client, runs[0]) if runs else None


def dag(client: AirflowClient, dag_id: str) -> dict:
    """Tasks in order, what each one reads and writes (as DataHub dataset names), and the owner."""
    detail = client.get(f"/api/v2/dags/{quote(dag_id)}")
    tasks = client.get(f"/api/v2/dags/{quote(dag_id)}/tasks").get("tasks") or []
    io: dict[str, dict[str, list[str]]] = {}
    assets = client.get("/api/v2/assets", params={"limit": 100}).get("assets") or []
    for asset in assets:
        for key, direction in (("producing_tasks", "writes"), ("consuming_tasks", "reads")):
            for ref in asset.get(key) or []:
                if ref.get("dag_id") == dag_id:
                    slot = io.setdefault(ref["task_id"], {"reads": [], "writes": []})
                    slot[direction].append(asset_table(asset.get("uri", "")))
    return {
        "dag_id": dag_id,
        "description": detail.get("description"),
        "owners": detail.get("owners") or [],
        "schedule": detail.get("timetable_summary") or detail.get("timetable_description"),
        "is_paused": detail.get("is_paused"),
        "url": dag_url(client.cfg, dag_id),
        "tasks": [
            {
                "task_id": t["task_id"],
                "downstream": t.get("downstream_task_ids") or [],
                "reads": sorted(io.get(t["task_id"], {}).get("reads", [])),
                "writes": sorted(io.get(t["task_id"], {}).get("writes", [])),
            }
            for t in tasks
        ],
    }


def _log_lines(content: Any) -> list[str]:
    """Airflow 3 returns structured log events; older servers return one string."""
    if isinstance(content, str):
        return content.splitlines()
    lines: list[str] = []
    for item in content or []:
        if not isinstance(item, dict):
            lines.append(str(item))
            continue
        event = str(item.get("event", "")).strip()
        if event:
            lines.append(event)
        for detail in item.get("error_detail") or []:
            if isinstance(detail, dict):
                lines.append(f"{detail.get('exc_type', 'Error')}: {detail.get('exc_value', '')}".strip())
    return lines


def task_log(
    client: AirflowClient,
    dag_id: str,
    run_id: str,
    task_id: str,
    try_number: int | None = None,
    tail: int = 40,
) -> dict:
    """The end of one task's log, plus every line that looks like an error."""
    base = f"/api/v2/dags/{quote(dag_id)}/dagRuns/{quote(run_id, safe='')}/taskInstances/{quote(task_id)}"
    if try_number is None:
        try_number = client.get(base).get("try_number") or 1
    body = client.get(f"{base}/logs/{try_number}", params={"full_content": "true"})
    lines = _log_lines(body.get("content"))
    errors = [line for line in lines if _ERROR_LINE.search(line)]
    return {
        "dag_id": dag_id,
        "run_id": run_id,
        "task_id": task_id,
        "try_number": try_number,
        "url": task_url(client.cfg, dag_id, run_id, task_id),
        "error_lines": errors[-10:],
        "tail": lines[-tail:],
    }
