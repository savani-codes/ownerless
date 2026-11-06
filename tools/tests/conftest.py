import json
from urllib.parse import urlparse

import pytest


class FakeResponse:
    def __init__(self, status: int, body):
        self.status_code = status
        self._body = body
        self.text = json.dumps(body)
        self.content = self.text.encode()

    def json(self):
        return self._body


class FakeSession:
    """Answers requests from a {(METHOD, path): (status, body)} table and records every call."""

    def __init__(self, routes: dict):
        self.routes = routes
        self.calls: list[tuple[str, str, dict]] = []

    def request(self, method, url, **kwargs):
        path = urlparse(url).path
        self.calls.append((method, path, kwargs))
        status, body = self.routes.get((method, path), (404, {"detail": f"no route {method} {path}"}))
        return FakeResponse(status, body)

    def post(self, url, **kwargs):
        return self.request("POST", url, **kwargs)


@pytest.fixture
def fake_session():
    return FakeSession
