#!/usr/bin/env bash
# One-time setup: the submodule, the `ownerless` CLI on your PATH, ownerless.toml and .env.
# Run it again once `datahub docker quickstart` is up, to create and save the DataHub token.
source "$(dirname "$0")/lib.sh"

need git "Install Git for Windows: https://git-scm.com/download/win"
need uv "Install uv: https://docs.astral.sh/uv/getting-started/installation/"
need docker "Install Docker Desktop and start it."

say "cognee-data-lab (vendor/)"
git -C "$ROOT" submodule update --init --recursive
ok "vendor/cognee-data-lab at $(git -C "$LAB" rev-parse --short HEAD)"

say "The ownerless CLI"
# Editable, so the agents always run the code in this checkout.
uv tool install --force --editable "$ROOT/tools" >/dev/null
uv tool update-shell >/dev/null 2>&1 || true
if command -v ownerless >/dev/null; then
  ok "$(command -v ownerless)"
else
  bad "installed, but not on PATH yet. Open a new terminal and restart Switch Console."
fi

say "Config files (both gitignored)"
if [[ -f "$CONFIG" ]]; then
  ok "ownerless.toml already there"
else
  cp "$ROOT/deploy/ownerless.example.toml" "$CONFIG"
  ok "ownerless.toml copied from deploy/"
fi
if [[ -f "$ROOT/.env" ]]; then
  ok ".env already there"
else
  cp "$ROOT/deploy/.env.example" "$ROOT/.env"
  ok ".env copied from deploy/ (add an LLM key for Cognee)"
fi

say "DataHub token"
if ! token_is_empty; then
  ok "already set"
elif http_ok http://localhost:9002/; then
  token="$(cd "$ROOT" && ownerless datahub token | sed -n 's/.*"token": *"\([^"]*\)".*/\1/p')"
  [[ -n "$token" ]] || die "could not create a DataHub token (is the UI login datahub / datahub?)"
  sed -i "s|^token = \"\"|token = \"$token\"|" "$CONFIG"
  ok "created and saved to ownerless.toml"
else
  bad "DataHub isn't running. Start it with 'datahub docker quickstart', then run this again."
fi

say "Next: scripts/up.sh --seed"
