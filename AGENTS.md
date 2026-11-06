# AGENTS.md

Guidance for people and coding agents who **develop** this repository.

This file is deliberately not called `CLAUDE.md`. The Switch agents run Claude Code inside
`agents/investigator/` and `agents/operator/`, and Claude Code also loads every `CLAUDE.md` in
the parent folders. A root `CLAUDE.md` would leak developer notes into the agents' prompts.
Agent behaviour lives only in `agents/*/CLAUDE.md`.

## Map

```text
agents/        the two Switch agents: role (CLAUDE.md) + permissions (.claude/settings.json)
switch/        the Switch template that creates the room and both agents
tools/         the ownerless CLI: the only code that talks to Airflow, DataHub, Postgres, Cognee
scenario/      how the demo incident is broken and reset (commands live in the CLI)
deploy/        local configuration; nothing is deployed to the cloud
scripts/       setup, start/stop the data stack, preflight checks (run from Git Bash on Windows)
docs/          architecture, demo script, logo assets
website/       the showcase site: Vite + React + TypeScript, deployed to GitHub Pages
stack/         the demo data stack (Airflow, Postgres, DataHub seed, Cognee), a pinned git submodule
```

## Rules

1. **Switch is the only user interface.** No web app, no dashboard. If a person needs to see
   something, an agent posts it in the room or links to Airflow or DataHub. `website/` is a
   static showcase about the project; it never talks to the data platform or the agents.
2. **The CLI is the only integration layer.** Agents never call services with curl; they call
   `ownerless`. Every read returns links for the entities it mentions.
3. **Reads are allowlisted, writes are not.** A new write command must be left out of both
   agents' `permissions.allow` so it always raises a Switch permission prompt, and must be in
   the investigator's `permissions.deny`.
4. **Never modify `stack/`.** Change behaviour in this repo, or open a PR upstream.
5. **Secrets stay in `ownerless.toml`** (gitignored). Switch passes agents only a fixed set of
   environment variables, so the CLI reads its config from that file, not from the shell.
6. **The scenario is deterministic.** `reset` must return the platform to the same state every
   time; every take of the demo starts from it.

## Commands

```bash
cd tools && uv sync && uv run pytest && uv run ruff check .
ownerless --help
cd website && npm ci && npm run dev        # http://localhost:5173/ownerless/
cd website && npm test && npm run build    # what CI runs
```

## Style

Python 3.11+, ruff (line length 110), type hints on public functions, standard library first.
Website: strict TypeScript, function components, one CSS module per component, all copy in
`website/src/content.ts`, and no new runtime dependencies beyond React without a good reason.
Every animation must respect `prefers-reduced-motion`.
Public copy names the team only as JARS and SAV.
Commits: Conventional Commits, one intent per commit, no AI attribution or co-author trailers.
