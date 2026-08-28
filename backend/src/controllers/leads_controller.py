from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import FileResponse
import httpx
import os
import hashlib
import time
from src.config import LANDING_URL, META_PIXEL_ID, META_TEST_EVENT_CODE
from src.schemas import LeadCreate, LeadUpdate
from src.services.leads_services import LeadsServices
from src.services.recurso_pdf import ruta_del_archivo

router = APIRouter()
svc = LeadsServices()

META_ACCESS_TOKEN = os.getenv("META_CAPI_TOKEN", "")


def hash_data(value: str) -> str:
    return hashlib.sha256(value.strip().lower().encode()).hexdigest()


@router.post("/")
def create_lead(data: LeadCreate):
    return svc.create_lead(data)


@router.get("/")
def get_all_leads():
    return svc.get_all_leads()


@router.get("/metrics")
def get_metrics():
    return svc.get_metrics()


@router.post("/recalculate-calificacion")
def recalculate_calificacion():
    return svc.recalculate_all_calificado()


@router.post("/reset-all-codigos")
def reset_all_codigos():
    return svc.reset_all_access_codes()


@router.get("/resource")
def get_resource(code: str):
    result = svc.get_resource_by_code(code)
    if not result:
        raise HTTPException(status_code=404, detail="Código inválido o inexistente")
    return result


@router.get("/resource/file")
def get_resource_file(code: str):
    """Sirve el PDF que le toca al lead. Sin clave válida no hay archivo."""
    pdf = svc.get_pdf_by_code(code)
    if not pdf:
        raise HTTPException(status_code=404, detail="Código inválido o inexistente")

    if pdf["estado"] != "ok":
        raise HTTPException(status_code=409, detail=pdf["estado"])

    ruta = ruta_del_archivo(pdf["archivo"])
    if not ruta:
        raise HTTPException(status_code=404, detail="El archivo no está disponible")

    return FileResponse(
        ruta,
        media_type="application/pdf",
        headers={"Content-Disposition": f'inline; filename="{pdf["archivo"]}"'},
    )


@router.get("/{code}/recurso")
def get_recurso_for_lead(code: str):
    try:
        result = svc.get_recurso_by_code(code)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    if not result:
        raise HTTPException(status_code=404, detail="Recurso no encontrado")
    return result


@router.get("/verify/{code}")
def verify_code(code: str):
    lead = svc.verify_code(code)
    if not lead:
        raise HTTPException(status_code=404, detail="Código inválido")
    return lead


@router.get("/{lead_id}")
def get_lead(lead_id: int):
    lead = svc.get_lead_by_id(lead_id)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead no encontrado")
    return lead


@router.patch("/{lead_id}")
def update_lead(lead_id: int, data: LeadUpdate):
    lead = svc.update_lead(lead_id, data)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead no encontrado")
    return lead


@router.post("/{lead_id}/regenerar-codigo")
def regenerar_codigo(lead_id: int):
    lead = svc.regenerar_codigo(lead_id)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead no encontrado")
    return lead


@router.post("/{lead_id}/capi")
async def send_capi_event(lead_id: int, request: Request):
    body = await request.json()
    event_name = body.get("event_name", "Lead")
    event_id = body.get("event_id", f"{event_name}_{lead_id}_{int(time.time())}")
    email = body.get("email", "")
    phone = body.get("phone", "")
    source_url = body.get("source_url") or LANDING_URL or request.headers.get("origin", "")

    if not META_ACCESS_TOKEN or not META_PIXEL_ID:
        return {"ok": False, "error": "META_CAPI_TOKEN o META_PIXEL_ID no configurado"}

    # Cuanto más dato de usuario, mejor empareja Meta el evento de servidor
    # con la persona. La IP y el user-agent son los que más suben la calidad.
    client_ip = (
        (request.headers.get("x-forwarded-for") or "").split(",")[0].strip()
        or (request.client.host if request.client else "")
    )

    user_data = {
        "em": [hash_data(email)] if email else [],
        "ph": [hash_data(phone)] if phone else [],
    }
    if client_ip:
        user_data["client_ip_address"] = client_ip
    if request.headers.get("user-agent"):
        user_data["client_user_agent"] = request.headers["user-agent"]
    # Cookies del píxel: identifican el clic del anuncio y el navegador
    if body.get("fbp"):
        user_data["fbp"] = body["fbp"]
    if body.get("fbc"):
        user_data["fbc"] = body["fbc"]

    event = {
        "event_name": event_name,
        "event_time": int(time.time()),
        "event_id": event_id,       # mismo id que el evento del navegador → sin duplicados
        "action_source": "website",
        "event_source_url": source_url,
        "user_data": user_data,
    }

    payload = {"data": [event]}
    if META_TEST_EVENT_CODE:
        payload["test_event_code"] = META_TEST_EVENT_CODE

    async with httpx.AsyncClient() as client:
        res = await client.post(
            f"https://graph.facebook.com/v19.0/{META_PIXEL_ID}/events",
            params={"access_token": META_ACCESS_TOKEN},
            json=payload
        )

    result = res.json()
    print(f"[CAPI] Status: {res.status_code} | Response: {result}", flush=True)
    return result


@router.delete("/{lead_id}")
def delete_lead(lead_id: int):
    ok = svc.delete_lead(lead_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Lead no encontrado")
    return {"ok": True}
