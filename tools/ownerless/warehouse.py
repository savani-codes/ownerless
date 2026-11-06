"""Read-only SQL on the demo Postgres warehouse.

Two guards: the statement must be a single SELECT (or WITH ... SELECT), and it runs in a
read-only session with a statement timeout, so even a crafted query cannot write.
"""

import re
from datetime import date, datetime
from decimal import Decimal
from typing import Any

import psycopg

from . import OwnerlessError
from .config import WarehouseConfig

_ALLOWED_START = re.compile(r"^\s*(select|with)\b", re.IGNORECASE)
_COMMENT = re.compile(r"(--[^\n]*|/\*.*?\*/)", re.DOTALL)
MAX_ROWS = 200


def check_select(sql: str) -> str:
    cleaned = _COMMENT.sub(" ", sql).strip().rstrip(";").strip()
    if not cleaned:
        raise OwnerlessError("Empty query")
    if ";" in cleaned:
        raise OwnerlessError("Only one statement is allowed")
    if not _ALLOWED_START.match(cleaned):
        raise OwnerlessError("Only SELECT queries are allowed here; changes go through the operator")
    return cleaned


def connect(cfg: WarehouseConfig, read_only: bool = True) -> psycopg.Connection:
    try:
        conn = psycopg.connect(
            host=cfg.host,
            port=cfg.port,
            dbname=cfg.dbname,
            user=cfg.user,
            password=cfg.password,
            connect_timeout=10,
        )
    except psycopg.OperationalError as exc:
        raise OwnerlessError(
            f"Postgres is unreachable at {cfg.host}:{cfg.port}/{cfg.dbname}: {exc}"
        ) from None
    conn.read_only = read_only
    return conn


def _plain(value: Any) -> Any:
    if isinstance(value, Decimal):
        return float(value)
    if isinstance(value, datetime | date):
        return value.isoformat()
    return value


def query(cfg: WarehouseConfig, sql: str) -> dict:
    statement = check_select(sql)
    with connect(cfg) as conn, conn.cursor() as cur:
        cur.execute("SET statement_timeout = '15s'")
        try:
            cur.execute(statement)
        except psycopg.Error as exc:
            raise OwnerlessError(f"Query failed: {exc}".strip()) from None
        columns = [c.name for c in cur.description or []]
        rows = cur.fetchmany(MAX_ROWS + 1)
    return {
        "columns": columns,
        "rows": [[_plain(v) for v in row] for row in rows[:MAX_ROWS]],
        "row_count": min(len(rows), MAX_ROWS),
        "truncated": len(rows) > MAX_ROWS,
    }
