import os
import time

import jwt
from decouple import config
from fastapi import HTTPException, Request

ADMIN_COOKIE_NAME = "admin_session"
ADMIN_SESSION_HOURS = 12


def _secret() -> str:
    return config("SECRET", default="")


def create_admin_token() -> str:
    secret = _secret()
    if not secret:
        raise HTTPException(status_code=500, detail="SECRET no configurado")
    payload = {
        "role": "admin",
        "exp": int(time.time()) + ADMIN_SESSION_HOURS * 3600,
    }
    return jwt.encode(payload, secret, algorithm="HS256")


def verify_admin_request(request: Request) -> None:
    token = request.cookies.get(ADMIN_COOKIE_NAME)
    if not token:
        raise HTTPException(status_code=401, detail="No autenticado")

    secret = _secret()
    if not secret:
        raise HTTPException(status_code=500, detail="SECRET no configurado")

    try:
        payload = jwt.decode(token, secret, algorithms=["HS256"])
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Sesión inválida")

    if payload.get("role") != "admin":
        raise HTTPException(status_code=401, detail="Sesión inválida")
