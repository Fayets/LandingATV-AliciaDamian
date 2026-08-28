import re


def slugify(value: str) -> str:
    text = value.strip().lower()
    text = re.sub(r"[^a-z0-9]+", "_", text)
    return text.strip("_") or "none"


def compute_bucket_key(
    *,
    zona: str | None = None,
    avatar: str | None = None,
    revenue: str | None = None,
    calificado: bool | None = None,
    bottleneck_areas: list[str] | None = None,
    entrenamientos: str | None = None,
    dias: str | None = None,
) -> str:
    """Bucket corredora: zona|tiempo|entrenamientos|dias"""
    zona_bucket = slugify(zona) if zona else "none"
    tiempo_bucket = slugify(avatar) if avatar else "none"
    entrenamientos_bucket = slugify(entrenamientos) if entrenamientos else "none"
    dias_bucket = slugify(dias) if dias else "none"
    return f"{zona_bucket}|{tiempo_bucket}|{entrenamientos_bucket}|{dias_bucket}"


def deserialize_areas(value: str | None) -> list[str]:
    if not value:
        return []
    try:
        import json
        result = json.loads(value)
        return result if isinstance(result, list) else []
    except (json.JSONDecodeError, TypeError):
        return []
