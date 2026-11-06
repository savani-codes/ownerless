# shellcheck shell=bash
# Shared by the scripts in this folder. Source it; don't run it.
# Works in Git Bash on Windows, and in bash on macOS and Linux.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
STACK="$ROOT/stack"
CONFIG="$ROOT/ownerless.toml"

say() { printf '\n== %s\n' "$*"; }
ok() { printf '  ok    %s\n' "$*"; }
bad() { printf '  FAIL  %s\n' "$*"; }
die() { printf 'error: %s\n' "$*" >&2; exit 1; }
need() { command -v "$1" >/dev/null 2>&1 || die "$1 is not installed. $2"; }

# Optional lab settings (an LLM key for Cognee) come from .env; Compose reads them from the
# environment. The DataHub token comes from ownerless.toml, so it lives in one place.
load_env() {
  if [[ -f "$ROOT/.env" ]]; then
    set -a
    # shellcheck disable=SC1091
    source "$ROOT/.env"
    set +a
  fi
  if [[ -z "${DATAHUB_GMS_TOKEN:-}" && -f "$CONFIG" ]]; then
    DATAHUB_GMS_TOKEN="$(sed -n 's/^token *= *"\(.*\)".*/\1/p' "$CONFIG" | head -1)"
    export DATAHUB_GMS_TOKEN
  fi
}

stack_compose() { (cd "$STACK" && docker compose --profile demo "$@"); }

http_ok() { curl -fsS -o /dev/null --max-time 5 "$1"; }

# wait_for <what> <seconds> <command...>: retry a command every 5 seconds until it succeeds.
wait_for() {
  local what="$1" seconds="$2" i
  shift 2
  printf '  waiting for %s' "$what"
  for ((i = 0; i < seconds; i += 5)); do
    if "$@" >/dev/null 2>&1; then
      printf ' ready\n'
      return 0
    fi
    printf '.'
    sleep 5
  done
  printf '\n'
  die "$what was not ready after ${seconds}s"
}

token_is_empty() { grep -q '^token = ""' "$CONFIG"; }
