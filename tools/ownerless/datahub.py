"""DataHub GraphQL on GMS: datasets, owners, lineage and search.

Query shapes are adapted from datahub-ai-rca (backend/app/services/datahub_api.py). Every entity
comes back with a link to the DataHub UI and a list of governance gaps (no owner, no description,
no tags), because a missing owner is often the real root cause.
"""

from typing import Any
from urllib.parse import quote

import requests

from . import OwnerlessError
from .config import DataHubConfig

_ENTITY_FIELDS = """
  urn
  type
  ... on Dataset {
    name
    platform { name }
    properties { name description }
    editableProperties { description }
    ownership { owners { owner {
      ... on CorpGroup { urn name properties { displayName } }
      ... on CorpUser { urn username properties { displayName } }
    } } }
    globalTags { tags { tag { name } } }
    glossaryTerms { terms { term { name } } }
    domain { domain { properties { name } } }
    deprecation { deprecated note }
  }
"""

_ENTITY = "query entity($urn: String!) { entity(urn: $urn) { %s } }" % _ENTITY_FIELDS

_SEARCH = (
    """
query search($input: SearchAcrossEntitiesInput!) {
  searchAcrossEntities(input: $input) { total searchResults { entity { %s } } }
}
"""
    % _ENTITY_FIELDS
)

_LINEAGE = (
    """
query lineage($input: SearchAcrossLineageInput!) {
  searchAcrossLineage(input: $input) { total searchResults { degree entity { %s } } }
}
"""
    % _ENTITY_FIELDS
)


class DataHubClient:
    def __init__(self, cfg: DataHubConfig, session: requests.Session | None = None):
        self.cfg = cfg
        self._session = session or requests.Session()

    def graphql(self, query: str, variables: dict[str, Any]) -> dict[str, Any]:
        headers = {"Authorization": f"Bearer {self.cfg.token}"} if self.cfg.token else {}
        url = f"{self.cfg.gms_url.rstrip('/')}/api/graphql"
        try:
            response = self._session.post(
                url, json={"query": query, "variables": variables}, headers=headers, timeout=30
            )
        except requests.RequestException as exc:
            raise OwnerlessError(f"DataHub is unreachable at {self.cfg.gms_url}: {exc}") from None
        if response.status_code in (401, 403):
            raise OwnerlessError("DataHub rejected the token in ownerless.toml ([datahub] token)")
        if response.status_code != 200:
            raise OwnerlessError(
                f"DataHub GraphQL failed with HTTP {response.status_code}: {response.text[:300]}"
            )
        body = response.json()
        if body.get("errors"):
            raise OwnerlessError(f"DataHub GraphQL error: {body['errors'][0].get('message')}")
        return body["data"]


def dataset_urn(cfg: DataHubConfig, name: str) -> str:
    """Accept a URN, `retail_demo.raw.products` or `raw.products`."""
    if name.startswith("urn:li:"):
        return name
    if name.count(".") == 1 and cfg.database:
        name = f"{cfg.database}.{name}"
    return f"urn:li:dataset:(urn:li:dataPlatform:{cfg.platform},{name},{cfg.env})"


def entity_url(cfg: DataHubConfig, urn: str) -> str:
    return f"{cfg.ui_url.rstrip('/')}/dataset/{quote(urn, safe='')}"


def summarize(cfg: DataHubConfig, entity: dict[str, Any]) -> dict[str, Any]:
    props = entity.get("properties") or {}
    editable = entity.get("editableProperties") or {}
    owners = []
    for item in (entity.get("ownership") or {}).get("owners") or []:
        owner = item.get("owner") or {}
        label = (
            (owner.get("properties") or {}).get("displayName") or owner.get("name") or owner.get("username")
        )
        owners.append({"name": label, "urn": owner.get("urn")})
    description = editable.get("description") or props.get("description") or ""
    tags = [t["tag"]["name"] for t in ((entity.get("globalTags") or {}).get("tags") or [])]
    terms = [t["term"]["name"] for t in ((entity.get("glossaryTerms") or {}).get("terms") or [])]
    gaps = [
        gap
        for gap, missing in (
            ("no owner", not owners),
            ("no description", not description),
            ("no tags", not tags),
        )
        if missing
    ]
    return {
        "urn": entity["urn"],
        "name": entity.get("name") or props.get("name") or entity["urn"],
        "platform": (entity.get("platform") or {}).get("name"),
        "url": entity_url(cfg, entity["urn"]),
        "owners": owners,
        "description": description,
        "tags": tags,
        "glossary_terms": terms,
        "domain": (((entity.get("domain") or {}).get("domain") or {}).get("properties") or {}).get("name"),
        "deprecated": bool((entity.get("deprecation") or {}).get("deprecated")),
        "governance_gaps": gaps,
    }


def entity(client: DataHubClient, name: str) -> dict[str, Any]:
    urn = dataset_urn(client.cfg, name)
    data = client.graphql(_ENTITY, {"urn": urn})
    if not data.get("entity") or not data["entity"].get("name"):
        raise OwnerlessError(f"DataHub has no dataset {urn}")
    return summarize(client.cfg, data["entity"])


def lineage(client: DataHubClient, name: str, direction: str = "downstream", hops: int = 3) -> dict[str, Any]:
    urn = dataset_urn(client.cfg, name)
    degrees = ["1", "2", "3+"][: max(1, min(hops, 3))]
    data = client.graphql(
        _LINEAGE,
        {
            "input": {
                "urn": urn,
                "direction": direction.upper(),
                "query": "*",
                "start": 0,
                "count": 50,
                "orFilters": [{"and": [{"field": "degree", "values": degrees}]}],
            }
        },
    )
    result = data["searchAcrossLineage"]
    items = [
        {**summarize(client.cfg, r["entity"]), "degree": r.get("degree")}
        for r in result["searchResults"]
        if r["entity"].get("name")
    ]
    return {"dataset": urn, "direction": direction.lower(), "total": result["total"], "entities": items}


def search(client: DataHubClient, query: str, count: int = 10) -> dict[str, Any]:
    search_input: dict[str, Any] = {"query": query or "*", "start": 0, "count": count, "types": ["DATASET"]}
    data = client.graphql(_SEARCH, {"input": search_input})
    results = data["searchAcrossEntities"]
    return {
        "query": query,
        "total": results["total"],
        "entities": [summarize(client.cfg, r["entity"]) for r in results["searchResults"]],
    }


# -- Writes (the operator's; each one raises a Switch permission prompt) ----------------------------

TECHNICAL_OWNER = "urn:li:ownershipType:__system__technical_owner"

_ADD_OWNER = "mutation addOwner($input: AddOwnerInput!) { addOwner(input: $input) }"
_REMOVE_OWNER = "mutation removeOwner($input: RemoveOwnerInput!) { removeOwner(input: $input) }"
_CREATE_TOKEN = """
mutation createToken($input: CreateAccessTokenInput!) { createAccessToken(input: $input) { accessToken } }
"""


def group_urn(group: str) -> str:
    """Accept a URN or a group id such as retail_demo_data_platform."""
    return group if group.startswith("urn:li:corpGroup:") else f"urn:li:corpGroup:{group}"


def set_owner(client: DataHubClient, name: str, group: str) -> dict[str, Any]:
    """Make a group the technical owner of a dataset, then read the dataset back as proof."""
    urn = dataset_urn(client.cfg, name)
    client.graphql(
        _ADD_OWNER,
        {
            "input": {
                "ownerUrn": group_urn(group),
                "resourceUrn": urn,
                "ownerEntityType": "CORP_GROUP",
                "ownershipTypeUrn": TECHNICAL_OWNER,
            }
        },
    )
    return {"changed": "owner added", "dataset": entity(client, urn)}


def remove_owner(client: DataHubClient, name: str, group: str) -> dict[str, Any]:
    urn = dataset_urn(client.cfg, name)
    client.graphql(
        _REMOVE_OWNER,
        {"input": {"ownerUrn": group_urn(group), "resourceUrn": urn, "ownershipTypeUrn": TECHNICAL_OWNER}},
    )
    return {"changed": "owner removed", "dataset": entity(client, urn)}


def create_token(cfg: DataHubConfig, username: str = "datahub", password: str = "datahub") -> str:
    """Log in to the DataHub UI and mint a personal access token (setup only, not for agents)."""
    base = cfg.ui_url.rstrip("/")
    session = requests.Session()
    try:
        login = session.post(f"{base}/logIn", json={"username": username, "password": password}, timeout=30)
    except requests.RequestException as exc:
        raise OwnerlessError(f"The DataHub UI is unreachable at {base}: {exc}") from None
    if login.status_code != 200:
        raise OwnerlessError(f"DataHub login failed with HTTP {login.status_code}")
    response = session.post(
        f"{base}/api/v2/graphql",
        json={
            "query": _CREATE_TOKEN,
            "variables": {
                "input": {
                    "type": "PERSONAL",
                    "actorUrn": f"urn:li:corpuser:{username}",
                    "duration": "THREE_MONTHS",
                    "name": "ownerless",
                    "description": "Created by `ownerless datahub token`",
                }
            },
        },
        timeout=30,
    )
    body = response.json() if response.content else {}
    if response.status_code != 200 or body.get("errors"):
        detail = (body.get("errors") or [{}])[0].get("message", response.status_code)
        raise OwnerlessError(f"Could not create a DataHub token: {detail}")
    return body["data"]["createAccessToken"]["accessToken"]
