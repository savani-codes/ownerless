"""The demo incident: break it, run "last night's" pipeline, and reset everything for the next take.

The story: an upstream cleanup deletes three discontinued products from raw.products. That table
has no owner in DataHub (cognee-data-lab seeds it that way on purpose), so nobody is asked or
warned. Orders still point at the deleted products, so the nightly retail_analytics_pipeline
fails at validate_orders and analytics.daily_revenue is not refreshed.

The demo Postgres enforces raw.orders.product_id REFERENCES raw.products, which would block the
delete. Most lakes and warehouses (Hive/Trino, Snowflake, BigQuery) do not enforce foreign keys,
so `break` drops that constraint to behave like them, after saving a snapshot to restore from.
These commands are for the people running the demo; neither agent may call them.
"""

from datetime import UTC, datetime

from . import OwnerlessError, airflow, datahub, warehouse
from .config import Config

PRODUCTS = "raw.products"
DATA_PLATFORM = "retail_demo_data_platform"
FAIL_FLAG = "retail_fail_validation"  # cognee-data-lab's artificial failure; always off here
DELETED_COUNT = 3

_FK_QUERY = """
SELECT conname FROM pg_constraint
WHERE contype = 'f' AND conrelid = 'raw.orders'::regclass AND confrelid = 'raw.products'::regclass
"""
_ORPHANS = (
    "SELECT count(*) FROM raw.orders o "
    "WHERE NOT EXISTS (SELECT 1 FROM raw.products p WHERE p.product_id = o.product_id)"
)


def _foreign_keys(cur) -> list[str]:
    cur.execute(_FK_QUERY)
    return [row[0] for row in cur.fetchall()]


def break_platform(cfg: Config) -> dict:
    """Snapshot products, drop the foreign key, delete three products that orders still use."""
    with warehouse.connect(cfg.warehouse, read_only=False) as conn, conn.cursor() as cur:
        if warehouse.backup_exists(cur):
            raise OwnerlessError(
                "Already broken: backup.products exists. Run `ownerless scenario reset` first."
            )
        cur.execute("CREATE SCHEMA IF NOT EXISTS backup")
        cur.execute(f"CREATE TABLE {warehouse.BACKUP_TABLE} AS TABLE raw.products")
        for name in _foreign_keys(cur):
            cur.execute(f'ALTER TABLE raw.orders DROP CONSTRAINT "{name}"')
        cur.execute(
            "DELETE FROM raw.products WHERE product_id IN ("
            " SELECT p.product_id FROM raw.products p"
            " WHERE EXISTS (SELECT 1 FROM raw.orders o WHERE o.product_id = p.product_id)"
            " ORDER BY p.product_id DESC LIMIT %s) RETURNING product_id, sku",
            (DELETED_COUNT,),
        )
        deleted = sorted(cur.fetchall())
        cur.execute(_ORPHANS)
        orphans = cur.fetchone()[0]
    client = airflow.AirflowClient(cfg.airflow)
    airflow.set_variable(client, FAIL_FLAG, "false")
    airflow.unpause(client, cfg.airflow.dag_id)
    return {
        "deleted_products": [{"product_id": pid, "sku": sku} for pid, sku in deleted],
        "orphaned_orders": orphans,
        "next": "ownerless scenario trigger",
    }


def trigger_nightly(cfg: Config, wait: bool = True) -> dict:
    """Run the pipeline the way the 02:00 schedule would, and wait for it to fail."""
    client = airflow.AirflowClient(cfg.airflow)
    run_id = f"nightly__{datetime.now(UTC):%Y%m%dT%H%M%S}"
    started = airflow.trigger(client, cfg.airflow.dag_id, run_id)
    if not wait:
        return started
    return airflow.wait_for_run(client, cfg.airflow.dag_id, run_id)


def reset_platform(cfg: Config) -> dict:
    """Return to the clean starting state: products back, foreign key back, products ownerless."""
    with warehouse.connect(cfg.warehouse, read_only=False) as conn, conn.cursor() as cur:
        restored: list[int] = []
        if warehouse.backup_exists(cur):
            cur.execute(
                f"INSERT INTO raw.products SELECT b.* FROM {warehouse.BACKUP_TABLE} b "
                "WHERE NOT EXISTS (SELECT 1 FROM raw.products p WHERE p.product_id = b.product_id) "
                "RETURNING product_id"
            )
            restored = sorted(row[0] for row in cur.fetchall())
            cur.execute(f"DROP TABLE {warehouse.BACKUP_TABLE}")
        cur.execute(_ORPHANS)
        if cur.fetchone()[0]:
            raise OwnerlessError(
                "Orders still reference missing products and there is no snapshot to restore"
            )
        if not _foreign_keys(cur):
            cur.execute(
                "ALTER TABLE raw.orders ADD CONSTRAINT orders_product_id_fkey "
                "FOREIGN KEY (product_id) REFERENCES raw.products (product_id)"
            )
    dh = datahub.DataHubClient(cfg.datahub)
    owners = datahub.entity(dh, PRODUCTS)["owners"]
    for owner in owners:
        if owner.get("urn"):
            datahub.remove_owner(dh, PRODUCTS, owner["urn"])
    client = airflow.AirflowClient(cfg.airflow)
    airflow.set_variable(client, FAIL_FLAG, "false")
    return {
        "restored_products": restored,
        "removed_owners": [o["name"] for o in owners],
        "state": "clean: raw.products complete, foreign key on, no owner in DataHub",
    }


def status(cfg: Config) -> dict:
    """Where the demo stands, for the preflight check and between takes."""
    with warehouse.connect(cfg.warehouse) as conn, conn.cursor() as cur:
        cur.execute("SELECT count(*) FROM raw.products")
        products = cur.fetchone()[0]
        cur.execute(_ORPHANS)
        orphans = cur.fetchone()[0]
        broken = warehouse.backup_exists(cur)
        foreign_key = bool(_foreign_keys(cur))
    owners = [o["name"] for o in datahub.entity(datahub.DataHubClient(cfg.datahub), PRODUCTS)["owners"]]
    latest = airflow.latest_run(airflow.AirflowClient(cfg.airflow), cfg.airflow.dag_id)
    return {
        "products": products,
        "orphaned_orders": orphans,
        "broken": broken,
        "foreign_key": foreign_key,
        "raw_products_owners": owners,
        "latest_run": {k: latest[k] for k in ("run_id", "state", "url")} if latest else None,
    }
