#!/usr/bin/env bash
# Run before every demo take: is everything up, and is the scenario where it should be?
source "$(dirname "$0")/lib.sh"
cd "$ROOT"
failed=0

check() {
  local what="$1" out
  shift
  if out="$("$@" 2>&1)"; then
    ok "$what"
  else
    bad "$what"
    printf '%s\n' "$out" | head -3 | sed 's/^/        /'
    failed=1
  fi
}
token_is_set() { [[ -f "$CONFIG" ]] && ! token_is_empty; }

say "Tools"
check "ownerless is on PATH (the agents need it)" command -v ownerless
check "ownerless.toml exists" test -f "$CONFIG"
check "the DataHub token is set" token_is_set

say "Services, through the same CLI the agents use"
check "Airflow: the pipeline DAG and its datasets" ownerless airflow dag
check "DataHub: raw.products is cataloged" ownerless datahub entity raw.products
check "Postgres: the warehouse answers" ownerless warehouse query "SELECT count(*) FROM raw.products"
check "Cognee is up (memory ask is optional)" http_ok http://localhost:8765/api/state

say "Scenario"
ownerless scenario status || failed=1

echo
if ((failed)); then
  echo "Something is off: fix the FAIL lines above (scripts/setup.sh, scripts/up.sh)."
  exit 1
fi
echo "Ready. For a take: ownerless scenario reset, break, trigger. See scenario/README.md."
