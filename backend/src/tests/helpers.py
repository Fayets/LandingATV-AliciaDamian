import json
import os
import uuid

from pony.orm import db_session

from src.models import Landing, Resource, ResourceVariation
from src.services.resource_service import CIERRES_POR_OBJETIVO

TEST_LANDING_SLUG = "test-e2e-quiz"

INTRO_BY_FRENO = {
    "fisico": "E2E fisico: Vemos que lo tuyo es físico. Vamos a trabajar en técnica y fuerza.",
    "mentalidad": "E2E mentalidad: Tu freno está en la mentalidad. Acá te doy las herramientas para romper esa barrera.",
    "estructura": "E2E estructura: Lo que te falta es un plan claro. Eso es lo que vas a tener.",
}


def ensure_test_landing() -> Landing:
    with db_session:
        landing = Landing.get(slug=TEST_LANDING_SLUG)
        if not landing:
            landing = Landing(
                slug=TEST_LANDING_SLUG,
                name="Test E2E Running",
                is_active=True,
            )

        landing.cierres_json = json.dumps(
            {str(key): value for key, value in CIERRES_POR_OBJETIVO.items()},
            ensure_ascii=False,
        )

        for level, name in [
            ("A", "Guía de arranque E2E"),
            ("B", "Plan de progresión E2E"),
            ("C", "Plan de rendimiento E2E"),
        ]:
            resource = Resource.get(landing=landing, resource_level=level)
            if not resource:
                resource = Resource(
                    landing=landing,
                    resource_level=level,
                    name=name,
                    description=f"Descripción recurso {level}",
                    base_content=f"Contenido base del Recurso {level}\n\nEste es el plan personalizado para ti.",
                )
            else:
                resource.name = name
                resource.base_content = (
                    f"Contenido base del Recurso {level}\n\nEste es el plan personalizado para ti."
                )

            for freno, intro in INTRO_BY_FRENO.items():
                variation = ResourceVariation.get(resource=resource, freno_category=freno)
                if not variation:
                    ResourceVariation(
                        resource=resource,
                        freno_category=freno,
                        intro_text=intro,
                    )
                else:
                    variation.intro_text = intro

        return landing


def unique_email(prefix: str = "lead") -> str:
    return f"{prefix}-{uuid.uuid4().hex[:8]}@example.com"


def create_lead(client, quiz_answers: dict, **overrides):
    payload = {
        "name": overrides.get("name", "María García"),
        "email": overrides.get("email", unique_email("maria")),
        "phone": overrides.get("phone", "+34612345678"),
        "ig": overrides.get("ig", "maria.corriendo"),
        "quiz_answers": quiz_answers,
    }
    response = client.post("/api/leads/", json=payload)
    assert response.status_code == 200, response.text
    body = response.json()
    assert body.get("access_code"), body
    return body
