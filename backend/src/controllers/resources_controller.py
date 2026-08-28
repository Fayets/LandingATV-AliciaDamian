from fastapi import APIRouter, HTTPException, Request

from src.admin_auth import verify_admin_request
from src.schemas import CierresUpdate, ResourceDynamicUpdate, ResourceVariationCreate, ResourceVariationUpdate
from src.services.resources_admin_service import (
    create_variation,
    get_cierres_by_landing_slug,
    get_resources_by_landing_slug,
    update_cierres,
    update_resource,
    update_variation,
)

router = APIRouter()


@router.get("/landing/{landing_slug}")
def get_resources_by_landing(landing_slug: str, request: Request):
    verify_admin_request(request)
    resources = get_resources_by_landing_slug(landing_slug)
    if resources is None:
        raise HTTPException(status_code=404, detail="Landing no encontrada")
    return resources


@router.get("/landing/{landing_slug}/cierres")
def get_cierres(landing_slug: str, request: Request):
    verify_admin_request(request)
    cierres = get_cierres_by_landing_slug(landing_slug)
    if cierres is None:
        raise HTTPException(status_code=404, detail="Landing no encontrada")
    return {"cierres": cierres}


@router.put("/resource/{resource_id}")
def update_resource_endpoint(resource_id: int, data: ResourceDynamicUpdate, request: Request):
    verify_admin_request(request)
    resource = update_resource(resource_id, data.model_dump(exclude_unset=True))
    if not resource:
        raise HTTPException(status_code=404, detail="Recurso no encontrado")
    return {"message": "Recurso actualizado", "resource": resource}


@router.put("/variation/{variation_id}")
def update_variation_endpoint(variation_id: int, data: ResourceVariationUpdate, request: Request):
    verify_admin_request(request)
    variation = update_variation(variation_id, data.model_dump(exclude_unset=True))
    if not variation:
        raise HTTPException(status_code=404, detail="Variante no encontrada")
    return {"message": "Variante actualizada", "variation": variation}


@router.post("/resource/{resource_id}/variation")
def create_variation_endpoint(resource_id: int, data: ResourceVariationCreate, request: Request):
    verify_admin_request(request)
    try:
        variation = create_variation(resource_id, data.model_dump())
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    if variation is None:
        raise HTTPException(status_code=404, detail="Recurso no encontrado")
    return {"id": variation["id"], "message": "Variante creada", "variation": variation}


@router.put("/landing/{landing_slug}/cierres")
def update_cierres_endpoint(landing_slug: str, data: CierresUpdate, request: Request):
    verify_admin_request(request)
    updated = update_cierres(landing_slug, data.model_dump())
    if updated is None:
        raise HTTPException(status_code=404, detail="Landing no encontrada")
    return {"message": "Cierres actualizados", "cierres": updated}
