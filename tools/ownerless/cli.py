"""ownerless: the command line the Switch agents call from Claude Code.

Every command prints one JSON document. Failures print {"error": "..."} and exit with 1, so an
agent sees a clear sentence instead of a traceback.
"""

import argparse
import json
import sys
from collections.abc import Callable
from typing import Any

from . import OwnerlessError, __version__, airflow, datahub, memory, warehouse
from .config import Config, load_config

Handler = Callable[[Config, argparse.Namespace], Any]


def _airflow(cfg: Config) -> airflow.AirflowClient:
    return airflow.AirflowClient(cfg.airflow)


def _datahub(cfg: Config) -> datahub.DataHubClient:
    return datahub.DataHubClient(cfg.datahub)


def _add(sub, name: str, help_text: str, handler: Handler) -> argparse.ArgumentParser:
    parser = sub.add_parser(name, help=help_text, description=help_text)
    parser.set_defaults(handler=handler)
    return parser


def _read_commands(groups: dict[str, Any]) -> None:
    af = groups["airflow"]
    p = _add(
        af,
        "failed-runs",
        "Most recent failed DAG runs with every task's state",
        lambda c, a: airflow.failed_runs(_airflow(c), a.dag, a.limit),
    )
    p.add_argument("--dag", help="Only this DAG (default: all DAGs)")
    p.add_argument("--limit", type=int, default=3)

    p = _add(
        af,
        "dag",
        "A DAG's tasks in order, with the datasets each task reads and writes",
        lambda c, a: airflow.dag(_airflow(c), a.dag or c.airflow.dag_id),
    )
    p.add_argument("--dag", help="Default: [airflow] dag_id")

    p = _add(
        af,
        "task-log",
        "The end of a task's log and every error line",
        lambda c, a: airflow.task_log(
            _airflow(c), a.dag or c.airflow.dag_id, a.run, a.task, a.try_number, a.tail
        ),
    )
    p.add_argument("--run", required=True, help="DAG run id")
    p.add_argument("--task", required=True, help="Task id")
    p.add_argument("--dag", help="Default: [airflow] dag_id")
    p.add_argument("--try-number", type=int)
    p.add_argument("--tail", type=int, default=40)

    p = _add(af, "run-status", "One DAG run's state and its tasks (default: the latest run)", _run_status)
    p.add_argument("--run", help="DAG run id (default: the latest run)")
    p.add_argument("--dag", help="Default: [airflow] dag_id")

    dh = groups["datahub"]
    p = _add(
        dh,
        "entity",
        "A dataset's owners, description, tags, terms, domain and governance gaps",
        lambda c, a: datahub.entity(_datahub(c), a.dataset),
    )
    p.add_argument("dataset", help="URN, retail_demo.raw.products or raw.products")

    p = _add(
        dh,
        "lineage",
        "Datasets upstream or downstream of a dataset, with their owners",
        lambda c, a: datahub.lineage(_datahub(c), a.dataset, a.direction, a.hops),
    )
    p.add_argument("dataset")
    p.add_argument("--direction", choices=["upstream", "downstream"], default="downstream")
    p.add_argument("--hops", type=int, default=3)

    p = _add(dh, "search", "Search DataHub datasets", lambda c, a: datahub.search(_datahub(c), a.query))
    p.add_argument("query")

    wh = groups["warehouse"]
    p = _add(
        wh,
        "query",
        "Run one read-only SELECT on the warehouse (max 200 rows)",
        lambda c, a: warehouse.query(c.warehouse, a.sql),
    )
    p.add_argument("sql")

    mem = groups["memory"]
    p = _add(
        mem,
        "ask",
        "Ask Cognee's combined Airflow + DataHub memory (can take a minute or two)",
        lambda c, a: memory.ask(c.memory, a.question),
    )
    p.add_argument("question")


def _run_status(cfg: Config, args: argparse.Namespace) -> Any:
    client = _airflow(cfg)
    dag_id = args.dag or cfg.airflow.dag_id
    if args.run:
        return airflow.run_status(client, dag_id, args.run)
    latest = airflow.latest_run(client, dag_id)
    if latest is None:
        raise OwnerlessError(f"{dag_id} has no runs yet")
    return latest


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="ownerless",
        description="Read and repair the Ownerless demo platform: Airflow, DataHub, Postgres and Cognee.",
    )
    parser.add_argument("--version", action="version", version=f"ownerless {__version__}")
    top = parser.add_subparsers(dest="group", required=True)
    groups = {}
    for name, help_text in (
        ("airflow", "Airflow runs, DAGs and task logs"),
        ("datahub", "DataHub datasets, owners and lineage"),
        ("warehouse", "The Postgres warehouse"),
        ("memory", "Cognee memory through cognee-data-lab"),
    ):
        group = top.add_parser(name, help=help_text, description=help_text)
        groups[name] = group.add_subparsers(dest="command", required=True)
    _read_commands(groups)
    _write_commands(groups)
    return parser


def _write_commands(groups: dict[str, Any]) -> None:
    """Changes. None of these is in either agent's allowlist, so each one asks a person first."""
    p = _add(
        groups["airflow"],
        "rerun",
        "WRITE: clear a run's failed tasks so Airflow runs them again, then wait for the result",
        lambda c, a: airflow.rerun_failed(_airflow(c), a.dag or c.airflow.dag_id, a.run, not a.no_wait),
    )
    p.add_argument("--run", help="DAG run id (default: the latest failed run)")
    p.add_argument("--dag", help="Default: [airflow] dag_id")
    p.add_argument("--no-wait", action="store_true")

    p = _add(
        groups["datahub"],
        "set-owner",
        "WRITE: make a group the technical owner of a dataset",
        lambda c, a: datahub.set_owner(_datahub(c), a.dataset, a.group),
    )
    p.add_argument("dataset")
    p.add_argument("--group", required=True, help="Group URN or id, e.g. retail_demo_data_platform")

    p = _add(
        groups["datahub"],
        "token",
        "SETUP: create a DataHub access token by logging in to the UI (not for agents)",
        lambda c, a: {"token": datahub.create_token(c.datahub, a.username, a.password)},
    )
    p.add_argument("--username", default="datahub")
    p.add_argument("--password", default="datahub")

    _add(
        groups["warehouse"],
        "restore-products",
        "WRITE: restore products missing from raw.products out of the backup.products snapshot",
        lambda c, a: warehouse.restore_products(c.warehouse),
    )


def main(argv: list[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    try:
        result = args.handler(load_config(), args)
    except OwnerlessError as exc:
        print(json.dumps({"error": str(exc)}, indent=2))
        return 1
    print(json.dumps(result, indent=2, default=str, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    sys.exit(main())
