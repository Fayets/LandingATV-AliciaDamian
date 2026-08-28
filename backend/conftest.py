import os

import pytest

from src.tests.helpers import TEST_LANDING_SLUG, ensure_test_landing

os.environ.setdefault("SECRET", "pytest-secret-key")
os.environ.setdefault("ADMIN_PASSWORD", "pytest-admin-password")
os.environ.setdefault("ADMIN_USER", "pytest_admin")


@pytest.fixture(scope="session", autouse=True)
def db_initialized():
    from src.db import init_db

    init_db()
    yield


@pytest.fixture(scope="session", autouse=True)
def seed_test_admin(db_initialized):
    from decouple import config

    from src.services.admin_auth_service import create_admin_user

    username = config("ADMIN_USER", default="pytest_admin").strip() or "pytest_admin"
    password = config("ADMIN_PASSWORD", default="pytest-admin-password")
    create_admin_user(username, password)


@pytest.fixture(scope="session")
def app(db_initialized):
    from main import app as fastapi_app

    return fastapi_app


@pytest.fixture
def client(app):
    from fastapi.testclient import TestClient

    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture(autouse=True)
def test_landing_env(monkeypatch):
    ensure_test_landing()
    monkeypatch.setattr("src.config.DEFAULT_LANDING_SLUG", TEST_LANDING_SLUG)
    monkeypatch.setattr("src.services.leads_services.DEFAULT_LANDING_SLUG", TEST_LANDING_SLUG)


@pytest.fixture
def admin_client(client):
    from src.config import ADMIN_PASSWORD, ADMIN_USER

    username = (ADMIN_USER or os.environ.get("ADMIN_USER") or "pytest_admin").strip()
    password = ADMIN_PASSWORD or os.environ["ADMIN_PASSWORD"]
    response = client.post(
        "/api/admin/login",
        json={"username": username, "password": password},
    )
    assert response.status_code == 200, response.text
    return client
