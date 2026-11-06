"""Load ownerless.toml.

Switch passes agent sessions only a fixed set of environment variables, so URLs and tokens can't
come from the shell. They live in one TOML file, found the same way from any working directory
inside the repository.
"""

import os
import tomllib
from dataclasses import dataclass
from pathlib import Path

from . import OwnerlessError

CONFIG_NAME = "ownerless.toml"


@dataclass(frozen=True)
class AirflowConfig:
    url: str = "http://localhost:8088"
    ui_url: str = ""
    username: str = "admin"
    password: str = "admin"
    dag_id: str = "retail_analytics_pipeline"

    @property
    def ui(self) -> str:
        return (self.ui_url or self.url).rstrip("/")


@dataclass(frozen=True)
class DataHubConfig:
    gms_url: str = "http://localhost:8080"
    ui_url: str = "http://localhost:9002"
    token: str = ""
    platform: str = "postgres"
    env: str = "PROD"
    database: str = "retail_demo"


@dataclass(frozen=True)
class WarehouseConfig:
    host: str = "localhost"
    port: int = 5433
    dbname: str = "retail_demo"
    user: str = "airflow"
    password: str = "airflow"


@dataclass(frozen=True)
class MemoryConfig:
    url: str = "http://localhost:8765"
    timeout_seconds: int = 240


@dataclass(frozen=True)
class Config:
    airflow: AirflowConfig
    datahub: DataHubConfig
    warehouse: WarehouseConfig
    memory: MemoryConfig
    path: Path | None = None


def find_config(start: Path | None = None) -> Path | None:
    explicit = os.environ.get("OWNERLESS_CONFIG")
    if explicit:
        path = Path(explicit).expanduser()
        if not path.is_file():
            raise OwnerlessError(f"OWNERLESS_CONFIG points to {path}, which does not exist")
        return path
    here = (start or Path.cwd()).resolve()
    for folder in (here, *here.parents):
        candidate = folder / CONFIG_NAME
        if candidate.is_file():
            return candidate
    fallback = Path.home() / ".config" / "ownerless" / CONFIG_NAME
    return fallback if fallback.is_file() else None


def _section(cls, raw: dict, name: str):
    values = raw.get(name) or {}
    known = set(cls.__dataclass_fields__)
    unknown = set(values) - known
    if unknown:
        raise OwnerlessError(f"Unknown keys in [{name}] of {CONFIG_NAME}: {', '.join(sorted(unknown))}")
    return cls(**values)


def load_config(start: Path | None = None) -> Config:
    path = find_config(start)
    raw: dict = {}
    if path:
        try:
            raw = tomllib.loads(path.read_text(encoding="utf-8"))
        except tomllib.TOMLDecodeError as exc:
            raise OwnerlessError(f"{path} is not valid TOML: {exc}") from None
    return Config(
        airflow=_section(AirflowConfig, raw, "airflow"),
        datahub=_section(DataHubConfig, raw, "datahub"),
        warehouse=_section(WarehouseConfig, raw, "warehouse"),
        memory=_section(MemoryConfig, raw, "memory"),
        path=path,
    )
