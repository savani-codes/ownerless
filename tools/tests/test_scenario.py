from ownerless import airflow, cli, scenario
from ownerless.config import AirflowConfig, Config, DataHubConfig, MemoryConfig, WarehouseConfig


def test_trigger_names_the_run_like_the_nightly_schedule(fake_session, monkeypatch):
    session = fake_session(
        {
            ("POST", "/auth/token"): (200, {"access_token": "t"}),
            ("POST", "/api/v2/dags/retail_analytics_pipeline/dagRuns"): (200, {"dag_run_id": "placeholder"}),
        }
    )
    monkeypatch.setattr(airflow.requests, "Session", lambda: session)
    cfg = Config(AirflowConfig(), DataHubConfig(), WarehouseConfig(), MemoryConfig())
    started = scenario.trigger_nightly(cfg, wait=False)
    body = next(kw["json"] for m, p, kw in session.calls if p.endswith("/dagRuns"))
    assert body["dag_run_id"].startswith("nightly__")
    assert body["logical_date"] is None
    assert started["url"].endswith("/runs/placeholder")


def test_scenario_commands_exist_for_people():
    parser = cli.build_parser()
    for command in ("reset", "break", "trigger", "status"):
        args = parser.parse_args(["scenario", command])
        assert callable(args.handler)
