import json
from datetime import datetime

from pony.orm import db_session

from src.models import ResourceTemplate
from src.resource_catalog import DEFAULT_DIAGNOSIS, DIAGNOSIS_BY_BUCKET


def _deserialize_sections(value: str) -> list:
    try:
        result = json.loads(value)
        return result if isinstance(result, list) else []
    except (json.JSONDecodeError, TypeError):
        return []


def _template_to_dict(template: ResourceTemplate) -> dict:
    return {
        "bucket_key": template.bucket_key,
        "title": template.title,
        "summary": template.summary or "",
        "sections": _deserialize_sections(template.sections),
        "source": "db",
        "updated_at": f"{template.updated_at.isoformat()}Z",
    }


def get_diagnosis_for_bucket(bucket_key: str) -> dict:
    with db_session:
        template = ResourceTemplate.get(bucket_key=bucket_key)
        if template:
            data = _template_to_dict(template)
            return {
                "title": data["title"],
                "summary": data["summary"],
                "sections": data["sections"],
                "bucket_key": bucket_key,
            }

    diagnosis = DIAGNOSIS_BY_BUCKET.get(bucket_key)
    if diagnosis:
        return {**diagnosis, "bucket_key": bucket_key}

    return {
        **DEFAULT_DIAGNOSIS,
        "bucket_key": bucket_key,
    }


def list_resource_templates(known_bucket_keys: list[str]) -> list[dict]:
    items: dict[str, dict] = {}

    for bucket_key, diagnosis in DIAGNOSIS_BY_BUCKET.items():
        items[bucket_key] = {
            "bucket_key": bucket_key,
            "title": diagnosis.get("title", ""),
            "summary": diagnosis.get("summary", ""),
            "sections": diagnosis.get("sections", []),
            "source": "code",
        }

    with db_session:
        for template in list(ResourceTemplate.select()):
            items[template.bucket_key] = _template_to_dict(template)

    for bucket_key in known_bucket_keys:
        if bucket_key and bucket_key not in items:
            diagnosis = get_diagnosis_for_bucket(bucket_key)
            items[bucket_key] = {
                "bucket_key": bucket_key,
                "title": diagnosis.get("title", ""),
                "summary": diagnosis.get("summary", ""),
                "sections": diagnosis.get("sections", []),
                "source": "default",
            }

    return sorted(items.values(), key=lambda item: item["bucket_key"])


def upsert_resource_template(bucket_key: str, payload: dict) -> dict:
    normalized_key = bucket_key.strip()
    if not normalized_key:
        raise ValueError("bucket_key requerido")

    sections = payload.get("sections") or []
    if not isinstance(sections, list):
        raise ValueError("sections debe ser una lista")

    with db_session:
        template = ResourceTemplate.get(bucket_key=normalized_key)
        if template:
            template.title = payload.get("title", "").strip() or "[Sin título]"
            template.summary = (payload.get("summary") or "").strip() or None
            template.sections = json.dumps(sections)
            template.updated_at = datetime.utcnow()
        else:
            template = ResourceTemplate(
                bucket_key=normalized_key,
                title=payload.get("title", "").strip() or "[Sin título]",
                summary=(payload.get("summary") or "").strip() or None,
                sections=json.dumps(sections),
                updated_at=datetime.utcnow(),
            )
        return _template_to_dict(template)
