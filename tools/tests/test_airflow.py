from ownerless import airflow
from ownerless.config import AirflowConfig

CFG = AirflowConfig(url="http://af:8088")
TOKEN = ("POST", "/auth/token")
RUNS = "/api/v2/dags/retail_analytics_pipeline/dagRuns"


def client(fake_session, routes):
    return airflow.AirflowClient(CFG, session=fake_session({TOKEN: (200, {"access_token": "t"}), **routes}))


def test_asset_table_matches_datahub_name():
    assert airflow.asset_table("postgres://postgres:5432/retail_demo/raw/orders") == "retail_demo.raw.orders"


def test_log_lines_flatten_structured_events_and_errors():
    content = [
        {"event": "Task started"},
        {
            "event": "Task failed",
            "error_detail": [{"exc_type": "ValueError", "exc_value": "3 invalid order rows"}],
        },
    ]
    assert airflow._log_lines(content) == ["Task started", "Task failed", "ValueError: 3 invalid order rows"]
    assert airflow._log_lines("a\nb") == ["a", "b"]


def test_failed_runs_lists_task_states_with_links(fake_session):
    c = client(
        fake_session,
        {
            ("GET", RUNS): (
                200,
                {
                    "dag_runs": [
                        {"dag_id": "retail_analytics_pipeline", "dag_run_id": "r1", "state": "failed"}
                    ]
                },
            ),
            ("GET", f"{RUNS}/r1/taskInstances"): (
                200,
                {"task_instances": [{"task_id": "validate_orders", "state": "failed", "try_number": 1}]},
            ),
        },
    )
    result = airflow.failed_runs(c, "retail_analytics_pipeline")
    run = result["failed_runs"][0]
    assert run["url"] == "http://af:8088/dags/retail_analytics_pipeline/runs/r1"
    assert run["tasks"][0]["state"] == "failed"
    assert run["tasks"][0]["url"].endswith("/runs/r1/tasks/validate_orders")


def test_task_log_keeps_error_lines(fake_session):
    base = f"{RUNS}/r1/taskInstances/validate_orders"
    c = client(
        fake_session,
        {
            ("GET", base): (200, {"try_number": 2}),
            ("GET", f"{base}/logs/2"): (
                200,
                {"content": [{"event": "ok"}, {"event": "ValueError: 3 invalid"}]},
            ),
        },
    )
    log = airflow.task_log(c, "retail_analytics_pipeline", "r1", "validate_orders")
    assert log["try_number"] == 2
    assert log["error_lines"] == ["ValueError: 3 invalid"]


def test_set_variable_creates_when_missing(fake_session):
    c = client(fake_session, {("POST", "/api/v2/variables"): (201, {"key": "k", "value": "v"})})
    airflow.set_variable(c, "k", "v")
    methods = [(m, p) for m, p, _ in c._session.calls]
    assert ("PATCH", "/api/v2/variables/k") in methods
    assert ("POST", "/api/v2/variables") in methods


def test_rerun_clears_only_failed_tasks_of_the_run(fake_session):
    clear = ("POST", "/api/v2/dags/retail_analytics_pipeline/clearTaskInstances")
    c = client(
        fake_session,
        {
            clear: (200, {"task_instances": []}),
            ("GET", f"{RUNS}/r1"): (
                200,
                {"dag_id": "retail_analytics_pipeline", "dag_run_id": "r1", "state": "queued"},
            ),
            ("GET", f"{RUNS}/r1/taskInstances"): (200, {"task_instances": []}),
        },
    )
    airflow.rerun_failed(c, "retail_analytics_pipeline", "r1", wait=False)
    body = next(kw["json"] for m, p, kw in c._session.calls if (m, p) == clear)
    assert body["dag_run_id"] == "r1"
    assert body["only_failed"] is True
    assert body["dry_run"] is False
