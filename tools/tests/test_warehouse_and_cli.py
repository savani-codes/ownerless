import json

import pytest

from ownerless import OwnerlessError, cli, config, warehouse


@pytest.mark.parametrize(
    "sql",
    [
        "SELECT count(*) FROM raw.orders",
        "  with x as (select 1) select * from x;",
        "-- orphans\nSELECT 1",
    ],
)
def test_check_select_accepts_single_reads(sql):
    assert warehouse.check_select(sql)


@pytest.mark.parametrize(
    "sql",
    [
        "DELETE FROM raw.products",
        "SELECT 1; DROP TABLE raw.products",
        "/* SELECT */ UPDATE raw.orders SET quantity = 0",
        "",
    ],
)
def test_check_select_rejects_everything_else(sql):
    with pytest.raises(OwnerlessError):
        warehouse.check_select(sql)


def test_config_is_found_in_a_parent_folder(tmp_path, monkeypatch):
    monkeypatch.delenv("OWNERLESS_CONFIG", raising=False)
    (tmp_path / config.CONFIG_NAME).write_text('[airflow]\ndag_id = "other"\n', encoding="utf-8")
    nested = tmp_path / "agents" / "investigator"
    nested.mkdir(parents=True)
    loaded = config.load_config(nested)
    assert loaded.airflow.dag_id == "other"
    assert loaded.datahub.platform == "postgres"


def test_config_rejects_unknown_keys(tmp_path, monkeypatch):
    path = tmp_path / config.CONFIG_NAME
    path.write_text("[datahub]\ntokn = 'x'\n", encoding="utf-8")
    monkeypatch.setenv("OWNERLESS_CONFIG", str(path))
    with pytest.raises(OwnerlessError, match="tokn"):
        config.load_config()


def test_cli_prints_json_error_and_exits_1(capsys):
    assert cli.main(["warehouse", "query", "DELETE FROM raw.products"]) == 1
    assert "Only SELECT" in json.loads(capsys.readouterr().out)["error"]


def test_every_write_command_is_labelled():
    parser = cli.build_parser()
    writes = {("airflow", "rerun"), ("datahub", "set-owner"), ("warehouse", "restore-products")}
    actions = {a.dest: a for a in parser._subparsers._group_actions}
    for group, command in writes:
        sub = actions["group"].choices[group]._subparsers._group_actions[0].choices[command]
        assert sub.description.startswith("WRITE:")
