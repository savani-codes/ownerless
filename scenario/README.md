# The demo scenario

**An upstream cleanup deletes three products that nobody owns, and the nightly revenue pipeline
breaks.** These commands set that up before each take and put everything back afterwards. They're
for the people running the demo. Both agents are denied them in their permission settings.

| Step | Command | What happens |
| --- | --- | --- |
| 1 | `ownerless scenario reset` | Products restored, foreign key back on, `raw.products` has no owner in DataHub, the lab's artificial failure flag off |
| 2 | `ownerless scenario break` | Snapshot `raw.products` to `backup.products`, drop the foreign key, delete the 3 highest product ids that orders still use |
| 3 | `ownerless scenario trigger` | Run `retail_analytics_pipeline` as the 02:00 schedule would; it fails at `validate_orders` with "N invalid order rows" |
| 4 | *(the demo)* | In Discord: `@investigator daily_revenue didn't refresh, what happened?` |
| 5 | `ownerless scenario status` | Check where things stand at any time |

## Why the scenario drops a foreign key

The demo Postgres enforces `raw.orders.product_id REFERENCES raw.products`, so the delete would be
refused. Most lakes and warehouses (Hive/Trino, Snowflake, BigQuery) don't enforce foreign keys,
and this is exactly how orphaned rows reach a pipeline there. `break` drops the constraint to
behave like them. `reset` puts it back. We say this in the video too.

## What a correct investigation finds

- `validate_orders` failed in the latest `nightly__…` run; `transform_revenue` and
  `publish_daily_revenue` never ran, so `analytics.daily_revenue` is stale.
- Orders reference products that are missing from `raw.products` (the orphan count matches the
  error in the log).
- In DataHub, `raw.products` has **no owner, no description and no tags**. Its downstream
  `analytics.daily_revenue` is owned by Revenue Analytics and Data Platform.
- The fix: assign an owner (Data Platform, `retail_demo_data_platform`), restore the products
  from `backup.products`, rerun the failed tasks.
