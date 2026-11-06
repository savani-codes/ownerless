"""The safety of the demo rests on the agents' permission files, so CI checks them against the CLI.

A write command that slipped into an allowlist would run without a Switch permission prompt.
"""

import json
import re
from pathlib import Path

import pytest

from ownerless import cli

AGENTS = Path(__file__).resolve().parents[2] / "agents"
RULE = re.compile(r"^Bash\(ownerless (\w+) ([\w-]+)(:\*)?\)$")


def _commands() -> dict[tuple[str, str], str]:
    parser = cli.build_parser()
    groups = parser._subparsers._group_actions[0].choices
    out = {}
    for group, sub in groups.items():
        for name, command in sub._subparsers._group_actions[0].choices.items():
            out[(group, name)] = command.description or ""
    return out


def _permissions(agent: str) -> dict:
    return json.loads((AGENTS / agent / ".claude" / "settings.json").read_text(encoding="utf-8"))[
        "permissions"
    ]


def _rules(entries: list[str]) -> set[tuple[str, str]]:
    return {(m.group(1), m.group(2)) for e in entries if (m := RULE.match(e))}


COMMANDS = _commands()
CHANGES = {
    key for key, text in COMMANDS.items() if text.startswith(("WRITE:", "SETUP:")) or key[0] == "scenario"
}


@pytest.mark.parametrize("agent", ["investigator", "operator"])
def test_no_change_is_ever_allowlisted(agent):
    allowed = _rules(_permissions(agent)["allow"])
    assert not allowed & CHANGES
    assert allowed <= set(COMMANDS), f"{agent} allows commands that do not exist: {allowed - set(COMMANDS)}"


def test_investigator_denies_every_change():
    denied = _rules(_permissions("investigator")["deny"])
    denied |= {
        key
        for key in COMMANDS
        if "Bash(ownerless scenario:*)" in _permissions("investigator")["deny"] and key[0] == "scenario"
    }
    assert denied >= CHANGES


def test_operator_can_be_asked_for_each_write_but_never_setup():
    perms = _permissions("operator")
    writes = {k for k, text in COMMANDS.items() if text.startswith("WRITE:")}
    assert not writes & _rules(perms["deny"]), "the operator must be able to request its writes"
    assert ("datahub", "token") in _rules(perms["deny"])
    assert "Bash(ownerless scenario:*)" in perms["deny"]
