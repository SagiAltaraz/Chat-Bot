import json
import sys
from pathlib import Path

from fastapi.testclient import TestClient

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

import search_kb


def make_test_client():
    """Create a TestClient that runs the real FastAPI app and lifespan startup."""
    return TestClient(search_kb.app)


def print_response(label: str, payload: dict) -> None:
    """Print endpoint responses so each test run shows the live returned payload."""
    print(f"\n{label} response:")
    print(json.dumps(payload, indent=2))
