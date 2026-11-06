#!/usr/bin/env bash
# Stop the data stack. DataHub is left alone (stop it with 'datahub docker quickstart --stop').
#   scripts/down.sh          stop the containers and keep the data
#   scripts/down.sh --wipe   also delete the warehouse, Airflow history, Cognee memory and the
#                            lab's DataHub entities
source "$(dirname "$0")/lib.sh"
need docker "Install Docker Desktop and start it."
load_env

if [[ "${1:-}" == "--wipe" ]]; then
  say "Removing the lab's DataHub entities"
  (cd "$LAB" && docker compose run --rm seed python cleanup_datahub.py --yes) || bad "skipped"
  say "Removing the containers and their volumes"
  lab_compose down -v
else
  say "Stopping the containers"
  lab_compose down
fi
