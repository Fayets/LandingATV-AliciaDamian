from decouple import config


def _csv_env(name: str, default: str = "") -> list[str]:
    raw = config(name, default=default)
    return [item.strip() for item in raw.split(",") if item.strip()]


ACCESS_CODE_PREFIX = config("ACCESS_CODE_PREFIX", default="QF")
DEFAULT_LANDING_SLUG = config("DEFAULT_LANDING_SLUG", default="running-alicia")
ALLOWED_ORIGINS = _csv_env(
    "ALLOWED_ORIGINS",
    default="http://localhost:5173,http://localhost:5174,http://localhost:3000",
)
LEAD_RESPONSABLES = _csv_env("LEAD_RESPONSABLES")
META_PIXEL_ID = config("META_PIXEL_ID", default="")
# Código de prueba del Administrador de eventos: con él los eventos salen
# en la pestaña "Eventos de prueba" sin ensuciar las métricas reales.
META_TEST_EVENT_CODE = config("META_TEST_EVENT_CODE", default="")
LANDING_URL = config("LANDING_URL", default="")
ADMIN_USER = config("ADMIN_USER", default="")
ADMIN_PASSWORD = config("ADMIN_PASSWORD", default="")
