from fastapi import APIRouter, HTTPException, Request, Response

from src.admin_auth import ADMIN_COOKIE_NAME, create_admin_token, verify_admin_request
from src.resources import list_resource_templates, upsert_resource_template
from src.schemas import AdminLeadUpdate, AdminLogin, ResourceTemplateUpdate
from src.services.admin_auth_service import authenticate_admin
from src.services.leads_services import LeadsServices

router = APIRouter()
svc = LeadsServices()


@router.post("/login")
def admin_login(data: AdminLogin, response: Response):
    user = authenticate_admin(data.username, data.password)
    if not user:
        raise HTTPException(status_code=401, detail="Usuario o contraseña incorrectos")

    token = create_admin_token()
    response.set_cookie(
        key=ADMIN_COOKIE_NAME,
        value=token,
        httponly=True,
        samesite="lax",
        secure=False,
        max_age=12 * 3600,
    )
    return {"ok": True, "username": user.username}


@router.post("/logout")
def admin_logout(response: Response):
    response.delete_cookie(ADMIN_COOKIE_NAME)
    return {"ok": True}


@router.get("/session")
def admin_session(request: Request):
    token = request.cookies.get(ADMIN_COOKIE_NAME)
    if not token:
        return {"ok": False}

    try:
        verify_admin_request(request)
    except HTTPException:
        return {"ok": False}

    return {"ok": True, "role": "admin"}


@router.get("/metrics")
def admin_metrics(request: Request):
    verify_admin_request(request)
    return svc.get_admin_metrics()


@router.get("/leads")
def admin_leads(
    request: Request,
    estado: str | None = None,
    zona: str | None = None,
):
    verify_admin_request(request)
    return svc.get_admin_leads(estado=estado, zona=zona)


@router.patch("/leads/{lead_id}")
def admin_update_lead(lead_id: int, data: AdminLeadUpdate, request: Request):
    verify_admin_request(request)
    try:
        lead = svc.update_admin_lead_estado(lead_id, data.estado)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    if not lead:
        raise HTTPException(status_code=404, detail="Lead no encontrado")
    return lead


@router.delete("/leads")
def admin_delete_all_leads(request: Request):
    verify_admin_request(request)
    return svc.delete_all_leads()


@router.get("/resources")
def admin_resources(request: Request):
    verify_admin_request(request)
    bucket_keys = svc.get_known_bucket_keys()
    return list_resource_templates(bucket_keys)


@router.put("/resources")
def admin_upsert_resource(data: ResourceTemplateUpdate, request: Request):
    verify_admin_request(request)
    try:
        payload = data.model_dump()
        bucket_key = payload.pop("bucket_key")
        return upsert_resource_template(bucket_key, payload)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc