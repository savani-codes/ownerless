#!/usr/bin/env bash
# Build Cognee's memory of Airflow and DataHub in cognee-data-lab, for `ownerless memory ask`.
# Needs an LLM key, in .env (LLM_PROVIDER_ID, LLM_API_KEY, LLM_MODEL_ID) or on the lab's Connect page.
# The syncs run inside the lab; watch them at http://localhost:8765.
source "$(dirname "$0")/lib.sh"
http_ok http://localhost:8765/api/state || die "the lab isn't running. Run scripts/up.sh first."

for source in airflow datahub; do
  say "Syncing $source"
  curl -fsS -X POST "http://localhost:8765/api/sync/$source" >/dev/null
  ok "started"
done

echo
echo "Syncing takes a few minutes. When the lab shows both as done, try:"
echo "  ownerless memory ask \"Which Airflow tasks read raw.products, and who owns them?\""
