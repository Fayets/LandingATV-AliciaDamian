from pony.orm import db_session

from src.models import Resource, ResourceVariation


def map_nivel_to_resource_level(nivel: int | None) -> str | None:
    """Mapea P1 (1-14) a nivel de recurso A/B/C."""
    if nivel is None:
        return None
    if nivel in (1, 2, 3, 4):
        return "A"
    if nivel in (5, 6, 7, 8):
        return "B"
    if nivel in (9, 10, 11, 12):
        return "C"
    return None


CIERRES_POR_OBJETIVO = {
    1: "Recordá que el running es para disfrutar. No se trata de competir con otras, sino de disfrutar el proceso.",
    2: "Ahora tenés el plan para llegar fuerte a tu carrera. Es el momento de comprometerte y entrenar con propósito.",
    3: "Vos tenés todo para romper ese techo. Este plan es el que te va a llevar al siguiente nivel.",
}


@db_session
def get_resource_for_lead(landing, nivel: int, freno_categoria: str) -> dict | None:
    """
    Retorna el recurso completo para un lead:
    - Nivel → recurso base (A/B/C)
    - Freno → variante de intro
    """
    resource_level = map_nivel_to_resource_level(nivel)
    if not resource_level:
        return None

    resource = Resource.get(landing=landing, resource_level=resource_level)
    if not resource:
        return None

    variation = ResourceVariation.get(
        resource=resource,
        freno_category=freno_categoria,
    )

    return {
        "resource_level": resource_level,
        "resource_name": resource.name,
        "base_content": resource.base_content or "",
        "intro_text": variation.intro_text if variation else "",
        "note_text": variation.note_text if variation else "",
        "resource_id": resource.id,
    }


def assemble_final_resource(
    resource_data: dict,
    objetivo: int,
    cierres: dict | None = None,
) -> dict:
    """Arma intro + contenido base + cierre según objetivo."""
    source = cierres or CIERRES_POR_OBJETIVO
    cierre = source.get(objetivo) or source.get(str(objetivo), "")

    return {
        "recurso_nivel": resource_data["resource_level"],
        "resource_name": resource_data["resource_name"],
        "intro": resource_data["intro_text"],
        "contenido": resource_data["base_content"],
        "nota": resource_data["note_text"],
        "cierre": cierre,
    }
