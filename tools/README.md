# ownerless CLI

The only code in Ownerless that talks to the data platform. Both Switch agents call it from
Claude Code; every command prints JSON, and every entity it mentions comes with a link.

```bash
uv tool install --editable .     # puts `ownerless` on PATH for the agents
ownerless --help
```

| Command | Kind |
| --- | --- |
| `ownerless airflow failed-runs` · `dag` · `task-log` · `run-status` | read |
| `ownerless datahub entity` · `lineage` · `search` | read |
| `ownerless warehouse query "SELECT ..."` | read (read-only session, SELECT only) |
| `ownerless memory ask "..."` | read (the Cognee service's `/api/ask`) |

Configuration comes from `ownerless.toml` (see `deploy/ownerless.example.toml`), found through
`$OWNERLESS_CONFIG`, then the current folder and its parents, then `~/.config/ownerless/`.
