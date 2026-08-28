import json
import random
from datetime import datetime, timedelta
from pony.orm import db_session, flush
from src.config import ACCESS_CODE_PREFIX, DEFAULT_LANDING_SLUG, LEAD_RESPONSABLES
from src.models import Lead, Landing
from src.schemas import LeadCreate, LeadUpdate
from src.calificacion import es_calificado
from src.buckets import compute_bucket_key
from src.resources import get_diagnosis_for_bucket
from src.services.resource_service import (
    assemble_final_resource,
    get_resource_for_lead,
    map_nivel_to_resource_level,
)
from src.services.resources_admin_service import get_cierres_for_landing_id
from src.services.recurso_pdf import resolver_recurso

VALID_ESTADOS = {"pendiente", "contactado", "agendado", "cerrado", "descartado"}


def _to_int(value) -> int | None:
    if value is None or value == "":
        return None
    try:
        return int(value)
    except (TypeError, ValueError):
        return None


class LeadsServices:

    def _generate_code(self) -> str:
        number = random.randint(1000, 9999)
        return f"{ACCESS_CODE_PREFIX}-{number}"

    def _code_exists(self, code: str) -> bool:
        with db_session:
            return Lead.get(access_code=code) is not None

    def _unique_code(self) -> str:
        code = self._generate_code()
        while self._code_exists(code):
            code = self._generate_code()
        return code

    def _resolve_default_landing(self):
        with db_session:
            return Landing.get(slug=DEFAULT_LANDING_SLUG, is_active=True)

    def _apply_quiz_steps(self, lead_kwargs: dict, quiz: dict) -> None:
        step_1 = _to_int(quiz.get("step_1_nivel"))
        step_2 = _to_int(quiz.get("step_2_objetivo"))
        step_3a = quiz.get("step_3a_freno_categoria")
        step_3b = _to_int(quiz.get("step_3b_freno_especifico"))
        step_4 = _to_int(quiz.get("step_4_acompanamiento"))
        step_5 = _to_int(quiz.get("step_5_inversion"))

        if step_1 is not None:
            lead_kwargs["step_1_nivel"] = step_1
            recurso = map_nivel_to_resource_level(step_1)
            if recurso is not None:
                lead_kwargs["recurso_asignado"] = recurso
        if step_2 is not None:
            lead_kwargs["step_2_objetivo"] = step_2
            lead_kwargs["cierre_variant"] = step_2
        if step_3a:
            lead_kwargs["step_3a_freno_categoria"] = step_3a
            lead_kwargs["intro_variant"] = step_3a
        if step_3b is not None:
            lead_kwargs["step_3b_freno_especifico"] = step_3b
        if step_4 is not None:
            lead_kwargs["step_4_acompanamiento"] = step_4
        if step_5 is not None:
            lead_kwargs["step_5_inversion"] = step_5

    def create_lead(self, data: LeadCreate) -> dict:
        with db_session:
            total = Lead.select().count()
        if LEAD_RESPONSABLES:
            responsable = LEAD_RESPONSABLES[total % len(LEAD_RESPONSABLES)]
        else:
            responsable = None

        code = self._unique_code()
        with db_session:
            lead_kwargs = {
                "name": data.name,
                "email": data.email,
                "phone": data.phone,
                "access_code": code,
                "created_at": datetime.utcnow(),
                "contacted": False,
            }
            if responsable is not None:
                lead_kwargs["responsable"] = responsable
            if data.ig is not None:
                lead_kwargs["ig"] = data.ig.strip() or None
            if data.avatar is not None:
                lead_kwargs["avatar"] = data.avatar
            if data.bottleneck_areas is not None:
                lead_kwargs["bottleneck_areas"] = json.dumps(data.bottleneck_areas)
            if data.bottleneck_marketing is not None:
                lead_kwargs["bottleneck_marketing"] = json.dumps(data.bottleneck_marketing)
            if data.bottleneck_ventas is not None:
                lead_kwargs["bottleneck_ventas"] = json.dumps(data.bottleneck_ventas)
            if data.bottleneck_producto is not None:
                lead_kwargs["bottleneck_producto"] = json.dumps(data.bottleneck_producto)
            if data.bottleneck_sistemas is not None:
                lead_kwargs["bottleneck_sistemas"] = json.dumps(data.bottleneck_sistemas)
            if data.revenue is not None:
                lead_kwargs["revenue"] = data.revenue
            if data.zona is not None:
                lead_kwargs["zona"] = data.zona.strip() or None
            if data.edad is not None:
                lead_kwargs["edad"] = data.edad.strip() or None
            if data.quiz_answers is not None:
                lead_kwargs["quiz_answers"] = json.dumps(data.quiz_answers)
                lead_kwargs["calificado"] = es_calificado(quiz_answers=data.quiz_answers)
                self._apply_quiz_steps(lead_kwargs, data.quiz_answers)
            elif data.calificado is not None:
                lead_kwargs["calificado"] = data.calificado
            elif data.edad is not None:
                lead_kwargs["calificado"] = es_calificado(edad=data.edad)
            elif data.avatar is not None or data.revenue is not None:
                lead_kwargs["calificado"] = es_calificado(data.avatar, data.revenue)

            quiz = data.quiz_answers or {}
            lead_kwargs["bucket_key"] = compute_bucket_key(
                zona=data.zona,
                avatar=data.avatar,
                entrenamientos=quiz.get("entrenamientos"),
                dias=quiz.get("dias"),
            )
            lead_kwargs["estado"] = "pendiente"

            landing = self._resolve_default_landing()
            if landing:
                lead_kwargs["landing"] = landing

            lead = Lead(**lead_kwargs)
            flush()
            return {"ok": True, "id": lead.id, "access_code": lead.access_code}

    def get_all_leads(self) -> list[dict]:
        with db_session:
            leads = list(Lead.select())
            leads.sort(key=lambda l: l.created_at, reverse=True)
            return [self._to_dict(l) for l in leads]

    def get_lead_by_id(self, lead_id: int) -> dict | None:
        with db_session:
            lead = Lead.get(id=lead_id)
            return self._to_dict(lead) if lead else None

    def verify_code(self, code: str) -> dict | None:
        with db_session:
            lead = Lead.get(access_code=code)
            if not lead:
                return None
            lead.access_count = (lead.access_count or 0) + 1
            return self._to_dict(lead)

    def update_lead(self, lead_id: int, data: LeadUpdate) -> dict | None:
        with db_session:
            lead = Lead.get(id=lead_id)
            if not lead:
                return None
            if data.contacted is not None:
                lead.contacted = data.contacted
            if data.notes is not None:
                lead.notes = data.notes
            if data.ig is not None:
                lead.ig = data.ig.strip() or None
            if data.avatar is not None:
                lead.avatar = data.avatar
            if data.bottleneck_areas is not None:
                lead.bottleneck_areas = json.dumps(data.bottleneck_areas)
            if data.bottleneck_marketing is not None:
                lead.bottleneck_marketing = json.dumps(data.bottleneck_marketing)
            if data.bottleneck_ventas is not None:
                lead.bottleneck_ventas = json.dumps(data.bottleneck_ventas)
            if data.bottleneck_producto is not None:
                lead.bottleneck_producto = json.dumps(data.bottleneck_producto)
            if data.bottleneck_sistemas is not None:
                lead.bottleneck_sistemas = json.dumps(data.bottleneck_sistemas)
            if data.revenue is not None:
                lead.revenue = data.revenue
            if data.calificado is not None:
                lead.calificado = data.calificado
            elif data.avatar is not None or data.revenue is not None:
                lead.calificado = es_calificado(lead.avatar, lead.revenue)
            if data.responsable is not None:
                lead.responsable = data.responsable
            if data.zona is not None:
                lead.zona = data.zona.strip() or None
            if data.estado is not None:
                lead.estado = data.estado
                if data.estado == "contactado":
                    lead.contacted = True
            return self._to_dict(lead)

    def regenerar_codigo(self, lead_id: int) -> dict | None:
        nuevo_codigo = self._unique_code()
        with db_session:
            lead = Lead.get(id=lead_id)
            if not lead:
                return None
            lead.access_code = nuevo_codigo
            return self._to_dict(lead)

    def reset_all_access_codes(self) -> dict:
        with db_session:
            lead_ids = [lead.id for lead in list(Lead.select())]

        with db_session:
            for lead_id in lead_ids:
                lead = Lead.get(id=lead_id)
                lead.access_code = f"TMP-{lead_id}-{random.randint(100000, 999999)}"

        with db_session:
            leads = list(Lead.select())
            used_codes: set[str] = set()
            for lead in leads:
                code = self._generate_code()
                while code in used_codes:
                    code = self._generate_code()
                used_codes.add(code)
                lead.access_code = code

            return {"ok": True, "total": len(leads), "updated": len(leads)}

    def get_recurso_by_code(self, code: str) -> dict | None:
        normalized = code.strip()
        if not normalized:
            return None

        with db_session:
            lead = Lead.get(access_code=normalized)
            if not lead:
                return None

            quiz = self._deserialize_quiz_answers(lead.quiz_answers)
            nivel = lead.step_1_nivel if lead.step_1_nivel is not None else _to_int(quiz.get("step_1_nivel"))
            freno_categoria = lead.step_3a_freno_categoria or quiz.get("step_3a_freno_categoria")
            objetivo = lead.step_2_objetivo if lead.step_2_objetivo is not None else _to_int(quiz.get("step_2_objetivo"))

            if not all([nivel, freno_categoria, objetivo]):
                raise ValueError("Respuestas incompletas")

            landing = lead.landing or Landing.get(slug=DEFAULT_LANDING_SLUG, is_active=True)
            if not landing:
                return None

            resource_data = get_resource_for_lead(landing, int(nivel), freno_categoria)
            if not resource_data:
                return None

            final_resource = assemble_final_resource(
                resource_data,
                int(objetivo),
                get_cierres_for_landing_id(landing.id),
            )

            lead.access_count = (lead.access_count or 0) + 1
            lead.recurso_asignado = resource_data["resource_level"]
            lead.intro_variant = freno_categoria
            lead.cierre_variant = int(objetivo)

            return final_resource

    def get_pdf_by_code(self, code: str) -> dict | None:
        """
        Qué PDF le toca al lead, según el mapeo de Alicia:
        Paso 1 decide el documento base y Paso 3b el identificador.
        No depende de que haya contenido cargado en base.
        """
        normalized = (code or "").strip()
        if not normalized:
            return None

        with db_session:
            lead = Lead.get(access_code=normalized)
            if not lead:
                return None

            quiz = self._deserialize_quiz_answers(lead.quiz_answers)
            step_1 = (
                lead.step_1_nivel
                if lead.step_1_nivel is not None
                else quiz.get("step_1_nivel")
            )
            step_3a = lead.step_3a_freno_categoria or quiz.get("step_3a_freno_categoria")
            step_3b = (
                lead.step_3b_freno_especifico
                if lead.step_3b_freno_especifico is not None
                else quiz.get("step_3b_freno_especifico")
            )

            return resolver_recurso(step_1, step_3a, step_3b)

    def get_resource_by_code(self, code: str) -> dict | None:
        normalized = code.strip()
        if not normalized:
            return None

        pdf = self.get_pdf_by_code(normalized)

        try:
            recurso = self.get_recurso_by_code(normalized)
            if recurso:
                with db_session:
                    lead = Lead.get(access_code=normalized)
                    lead_dict = self._to_dict(lead) if lead else {}
                return {
                    "lead": {
                        "id": lead_dict.get("id"),
                        "name": lead_dict.get("name"),
                        "access_code": lead_dict.get("access_code"),
                        "calificado": lead_dict.get("calificado"),
                        "recurso_asignado": lead_dict.get("recurso_asignado"),
                        "intro_variant": lead_dict.get("intro_variant"),
                        "cierre_variant": lead_dict.get("cierre_variant"),
                    },
                    "pdf": pdf,
                    "recurso": recurso,
                    "diagnosis": {
                        "title": recurso.get("resource_name") or f"Recurso {recurso.get('recurso_nivel')}",
                        "summary": recurso.get("intro") or "",
                        "sections": [
                            {"heading": "Contenido", "body": recurso.get("contenido") or ""},
                            *([{"heading": "Nota", "body": recurso.get("nota")}] if recurso.get("nota") else []),
                            {"heading": "Cierre", "body": recurso.get("cierre") or ""},
                        ],
                    },
                }
        except ValueError:
            pass

        with db_session:
            lead = Lead.get(access_code=normalized)
            if not lead:
                return None
            lead.access_count = (lead.access_count or 0) + 1
            lead_dict = self._to_dict(lead)
            bucket_key = lead.bucket_key or compute_bucket_key(
                zona=lead.zona,
                avatar=lead.avatar,
                entrenamientos=self._deserialize_quiz_answers(lead.quiz_answers).get("entrenamientos"),
                dias=self._deserialize_quiz_answers(lead.quiz_answers).get("dias"),
            )
            return {
                "lead": {
                    "id": lead_dict["id"],
                    "name": lead_dict["name"],
                    "access_code": lead_dict["access_code"],
                    "bucket_key": bucket_key,
                    "avatar": lead_dict["avatar"],
                    "revenue": lead_dict["revenue"],
                    "calificado": lead_dict["calificado"],
                    "bottleneck_areas": lead_dict["bottleneck_areas"],
                },
                "pdf": pdf,
                "diagnosis": get_diagnosis_for_bucket(bucket_key),
            }

    def get_admin_metrics(self) -> dict:
        with db_session:
            leads = list(Lead.select())
            total = len(leads)
            pendientes = sum(1 for l in leads if (l.estado or "pendiente") == "pendiente")
            contactados = sum(1 for l in leads if l.estado == "contactado")
            agendados = sum(1 for l in leads if l.estado == "agendado")
            return {
                "total": total,
                "pendientes": pendientes,
                "contactados": contactados,
                "agendados": agendados,
            }

    def get_admin_leads(self, estado: str | None = None, zona: str | None = None) -> list[dict]:
        with db_session:
            leads = list(Lead.select())
            leads.sort(key=lambda l: l.created_at, reverse=True)
            result = [self._to_dict(l) for l in leads]

        if estado:
            result = [l for l in result if (l.get("estado") or "pendiente") == estado]
        if zona:
            result = [l for l in result if (l.get("zona") or "") == zona]
        return result

    def update_admin_lead_estado(self, lead_id: int, estado: str) -> dict | None:
        normalized = estado.strip().lower()
        if normalized not in VALID_ESTADOS:
            raise ValueError(f"Estado inválido: {estado}")

        with db_session:
            lead = Lead.get(id=lead_id)
            if not lead:
                return None
            lead.estado = normalized
            if normalized == "contactado":
                lead.contacted = True
            return self._to_dict(lead)

    def get_known_bucket_keys(self) -> list[str]:
        with db_session:
            keys = {
                lead.bucket_key
                for lead in list(Lead.select())
                if lead.bucket_key
            }
            return sorted(keys)

    def delete_lead(self, lead_id: int) -> bool:
        with db_session:
            lead = Lead.get(id=lead_id)
            if not lead:
                return False
            lead.delete()
            return True

    def delete_all_leads(self) -> dict:
        with db_session:
            leads = list(Lead.select())
            total = len(leads)
            for lead in leads:
                lead.delete()
            return {"ok": True, "deleted": total}

    def recalculate_all_calificado(self) -> dict:
        with db_session:
            leads = list(Lead.select())
            updated = 0
            calificados = 0
            no_calificados = 0
            sin_calificar = 0

            for lead in leads:
                nuevo = es_calificado(lead.avatar, lead.revenue, lead.edad)
                if lead.calificado != nuevo:
                    lead.calificado = nuevo
                    updated += 1
                if nuevo is True:
                    calificados += 1
                elif nuevo is False:
                    no_calificados += 1
                else:
                    sin_calificar += 1

            return {
                "ok": True,
                "total": len(leads),
                "updated": updated,
                "calificados": calificados,
                "no_calificados": no_calificados,
                "sin_calificar": sin_calificar,
            }

    def get_metrics(self) -> dict:
        with db_session:
            all_leads = list(Lead.select())
            total = len(all_leads)
            contacted = sum(1 for lead in all_leads if lead.contacted)

            by_zona = {}
            by_tiempo = {}
            by_dias = {}
            by_entrenamientos = {}

            today = datetime.utcnow().date()
            daily = {
                (today - timedelta(days=i)).isoformat(): 0
                for i in range(13, -1, -1)
            }

            for lead in all_leads:
                zona = lead.zona or "Sin dato"
                by_zona[zona] = by_zona.get(zona, 0) + 1

                tiempo = lead.avatar or "Sin dato"
                by_tiempo[tiempo] = by_tiempo.get(tiempo, 0) + 1

                quiz = self._deserialize_quiz_answers(lead.quiz_answers)
                dias = quiz.get("dias") or "Sin dato"
                by_dias[dias] = by_dias.get(dias, 0) + 1

                entrenamientos = quiz.get("entrenamientos") or "Sin dato"
                by_entrenamientos[entrenamientos] = by_entrenamientos.get(entrenamientos, 0) + 1

                day_key = lead.created_at.date().isoformat()
                if day_key in daily:
                    daily[day_key] += 1

            access_counts = [(lead.access_count or 0) for lead in all_leads]
            total_accesses = sum(access_counts)
            avg_access_count = round(total_accesses / total, 2) if total > 0 else 0.0

            return {
                "total": total,
                "contacted": contacted,
                "pending": total - contacted,
                "avg_access_count": avg_access_count,
                "total_accesses": total_accesses,
                "by_zona": by_zona,
                "by_tiempo": by_tiempo,
                "by_dias": by_dias,
                "by_entrenamientos": by_entrenamientos,
                "by_avatar": by_tiempo,
                "by_bottleneck_area": by_dias,
                "by_sub_obstacle": by_entrenamientos,
                "by_revenue": {},
                "daily": [{"date": day, "count": count} for day, count in daily.items()],
            }

    def _deserialize_quiz_answers(self, value: str | None) -> dict:
        if not value:
            return {}
        try:
            result = json.loads(value)
            return result if isinstance(result, dict) else {}
        except (json.JSONDecodeError, TypeError):
            return {}

    def _deserialize_list(self, value: str | None) -> list:
        if not value:
            return []
        try:
            result = json.loads(value)
            return result if isinstance(result, list) else []
        except (json.JSONDecodeError, TypeError):
            return []

    def _to_dict(self, lead) -> dict:
        return {
            "id": lead.id,
            "name": lead.name,
            "email": lead.email,
            "phone": lead.phone,
            "ig": lead.ig,
            "access_code": lead.access_code,
            "access_count": lead.access_count or 0,
            "avatar": lead.avatar,
            "bottleneck_areas": self._deserialize_list(lead.bottleneck_areas),
            "bottleneck_marketing": self._deserialize_list(lead.bottleneck_marketing),
            "bottleneck_ventas": self._deserialize_list(lead.bottleneck_ventas),
            "bottleneck_producto": self._deserialize_list(lead.bottleneck_producto),
            "bottleneck_sistemas": self._deserialize_list(lead.bottleneck_sistemas),
            "revenue": lead.revenue,
            "calificado": lead.calificado,
            "bucket_key": lead.bucket_key,
            "responsable": lead.responsable,
            "zona": lead.zona,
            "edad": lead.edad,
            "quiz_answers": self._deserialize_quiz_answers(lead.quiz_answers),
            "step_1_nivel": lead.step_1_nivel,
            "step_2_objetivo": lead.step_2_objetivo,
            "step_3a_freno_categoria": lead.step_3a_freno_categoria,
            "step_3b_freno_especifico": lead.step_3b_freno_especifico,
            "step_4_acompanamiento": lead.step_4_acompanamiento,
            "step_5_inversion": lead.step_5_inversion,
            "recurso_asignado": lead.recurso_asignado,
            "intro_variant": lead.intro_variant,
            "cierre_variant": lead.cierre_variant,
            "recurso_entregado": lead.recurso_entregado,
            "estado": lead.estado or "pendiente",
            "created_at": f"{lead.created_at.isoformat()}Z",
            "contacted": lead.contacted,
            "notes": lead.notes,
        }
