import bcrypt
from pony.orm import db_session

from src.models import AdminUser


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, password_hash: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))
    except (ValueError, TypeError):
        return False


@db_session
def authenticate_admin(username: str, password: str) -> AdminUser | None:
    normalized = (username or "").strip()
    if not normalized or not password:
        return None

    user = AdminUser.get(username=normalized, is_active=True)
    if not user or not verify_password(password, user.password_hash):
        return None
    return user


@db_session
def get_admin_by_username(username: str) -> AdminUser | None:
    normalized = (username or "").strip()
    if not normalized:
        return None
    return AdminUser.get(username=normalized)


@db_session
def create_admin_user(username: str, password: str) -> AdminUser:
    normalized = (username or "").strip()
    if not normalized or not password:
        raise ValueError("Usuario y contraseña requeridos")
    existing = AdminUser.get(username=normalized)
    if existing:
        existing.password_hash = hash_password(password)
        existing.is_active = True
        return existing
    return AdminUser(
        username=normalized,
        password_hash=hash_password(password),
        is_active=True,
    )
