import json
from datetime import datetime

from pony.orm import db_session

from src.models import Landing, Resource, ResourceVariation
from src.services.resource_service import CIERRES_POR_OBJETIVO


def _parse_cierres(landing: Landing) -> dict[int, str]:
    if landing.cierres_json:
        try:
            raw = json.loads(landing.cierres_json)
            return {int(key): value for key, value in raw.items()}
        except (json.JSONDecodeError, TypeError, ValueError):
            pass
    return dict(CIERRES_POR_OBJETIVO)


def _serialize_cierres(cierres: dict) -> str:
    normalized = {str(key): value for key, value in cierres.items()}
    return json.dumps(normalized, ensure_ascii=False)


def _resource_to_dict(resource: Resource) -> dict:
    variations = sorted(
        list(resource.variations),
        key=lambda item: item.freno_category,
    )
    return {
        "id": resource.id,
        "level": resource.resource_level,
        "name": resource.name,
        "description": resource.description or "",
        "base_content": resource.base_content or "",
        "variations": [
            {
                "id": variation.id,
                "freno_category": variation.freno_category,
                "intro_text": variation.intro_text,
                "note_text": variation.note_text or "",
            }
            for variation in variations
        ],
    }


@db_session
def get_resources_by_landing_slug(slug: str) -> list[dict] | None:
    landing = Landing.get(slug=slug)
    if not landing:
        return None

    resources = sorted(list(landing.resources), key=lambda resource: resource.resource_level)
    return [_resource_to_dict(resource) for resource in resources]


@db_session
def get_cierres_by_landing_slug(slug: str) -> dict[int, str] | None:
    landing = Landing.get(slug=slug)
    if not landing:
        return None
    return _parse_cierres(landing)


@db_session
def update_resource(resource_id: int, data: dict) -> dict | None:
    resource = Resource.get(id=resource_id)
    if not resource:
        return None

    if "name" in data and data["name"] is not None:
        resource.name = data["name"].strip() or resource.name
    if "description" in data:
        resource.description = (data.get("description") or "").strip() or None
    if "base_content" in data:
        resource.base_content = (data.get("base_content") or "").strip() or None

    return _resource_to_dict(resource)


@db_session
def update_variation(variation_id: int, data: dict) -> dict | None:
    variation = ResourceVariation.get(id=variation_id)
    if not variation:
        return None

    if "intro_text" in data and data["intro_text"] is not None:
        variation.intro_text = data["intro_text"].strip()
    if "note_text" in data:
        variation.note_text = (data.get("note_text") or "").strip() or None

    return {
        "id": variation.id,
        "freno_category": variation.freno_category,
        "intro_text": variation.intro_text,
        "note_text": variation.note_text or "",
    }


@db_session
def create_variation(resource_id: int, data: dict) -> dict | None:
    resource = Resource.get(id=resource_id)
    if not resource:
        return None

    freno_category = (data.get("freno_category") or "").strip()
    intro_text = (data.get("intro_text") or "").strip()
    if not freno_category or not intro_text:
        raise ValueError("freno_category e intro_text son requeridos")

    existing = ResourceVariation.get(resource=resource, freno_category=freno_category)
    if existing:
        raise ValueError("Variante ya existe")

    variation = ResourceVariation(
        resource=resource,
        freno_category=freno_category,
        intro_text=intro_text,
        note_text=(data.get("note_text") or "").strip() or None,
    )

    return {
        "id": variation.id,
        "freno_category": variation.freno_category,
        "intro_text": variation.intro_text,
        "note_text": variation.note_text or "",
    }


@db_session
def update_cierres(landing_slug: str, data: dict) -> dict | None:
    landing = Landing.get(slug=landing_slug)
    if not landing:
        return None

    cierres = data.get("cierres") if isinstance(data.get("cierres"), dict) else data
    normalized: dict[int, str] = {}
    for key, value in cierres.items():
        if value is None:
            continue
        normalized[int(key)] = str(value).strip()

    landing.cierres_json = _serialize_cierres(normalized)
    landing.updated_at = datetime.utcnow()
    return normalized


@db_session
def get_cierres_for_landing_id(landing_id: int | None) -> dict[int, str]:
    if not landing_id:
        return dict(CIERRES_POR_OBJETIVO)
    landing = Landing.get(id=landing_id)
    if not landing:
        return dict(CIERRES_POR_OBJETIVO)
    return _parse_cierres(landing)
