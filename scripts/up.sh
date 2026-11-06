#!/usr/bin/env bash
# Start the data stack in stack/: Airflow, Postgres and Cognee, against your DataHub.
#   scripts/up.sh          start (or restart) the containers
#   scripts/up.sh --seed   also give Airflow its run history and catalog the warehouse in DataHub
#                          (the first time, and after scripts/down.sh --wipe)
source "$(dirname "$0")/lib.sh"
need docker "Install Docker Desktop and start it."
load_env
seed=false
[[ "${1:-}" == "--seed" ]] && seed=true

say "DataHub"
http_ok http://localhost:8080/health ||
  die "DataHub isn't running. Start it with 'datahub docker quickstart' (give Docker ~8 GB)."
ok "GMS at http://localhost:8080, UI at http://localhost:9002"
[[ -n "${DATAHUB_GMS_TOKEN:-}" ]] || die "no DataHub token in ownerless.toml. Run scripts/setup.sh."

say "The data stack: Airflow 3.3, Postgres and Cognee"
stack_compose up -d --build
wait_for "Airflow" 300 http_ok http://localhost:8088/api/v2/monitor/health
wait_for "Cognee" 120 http_ok http://localhost:8765/api/state

if $seed; then
  say "Seeding"
  "$STACK/seed/airflow_runs.sh"
  "$STACK/seed/seed_datahub.sh"
  ok "Airflow run history and the DataHub catalog are in place"
  echo "  Build Cognee's memory once with scripts/memory-sync.sh"
fi

say "Next: scripts/preflight.sh"
