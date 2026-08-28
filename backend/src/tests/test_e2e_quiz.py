"""
Test end-to-end del flujo quiz P1-P5 → lead → recurso personalizado → admin.
"""

from src.tests.helpers import create_lead, unique_email


def test_e2e_quiz_flow(client, admin_client):
    """
    Simula un lead completando el quiz P1-P5 y verifica:
    1. Lead se crea con código único
    2. Recurso se asigna correctamente (A/B/C por P1)
    3. Intro se personaliza (por P3a)
    4. Cierre se personaliza (por P2)
    5. Admin leads muestra recurso e intro correctos
    """
    quiz_answers = {
        "step_1_nivel": 6,
        "step_2_objetivo": 2,
        "step_3a_freno_categoria": "mentalidad",
        "step_3b_freno_especifico": 3,
        "step_4_acompanamiento": 4,
        "step_5_inversion": 4,
    }

    lead = create_lead(
        client,
        quiz_answers,
        email=unique_email("e2e-main"),
    )
    code = lead["access_code"]

    verify_res = client.get(f"/api/leads/verify/{code}")
    assert verify_res.status_code == 200, verify_res.text
    lead_detail = verify_res.json()

    assert lead_detail["name"] == "María García"
    assert lead_detail["calificado"] is True
    assert lead_detail["step_1_nivel"] == 6
    assert lead_detail["step_2_objetivo"] == 2
    assert lead_detail["step_3a_freno_categoria"] == "mentalidad"
    assert lead_detail["recurso_asignado"] == "B"
    assert lead_detail["intro_variant"] == "mentalidad"
    assert lead_detail["cierre_variant"] == 2

    recurso_res = client.get(f"/api/leads/{code}/recurso")
    assert recurso_res.status_code == 200, recurso_res.text
    recurso = recurso_res.json()

    assert recurso["recurso_nivel"] == "B"
    assert "E2E fisico" not in recurso["intro"]
    assert "E2E mentalidad" in recurso["intro"]
    assert "mentalidad" in recurso["intro"].lower()
    assert "carrera" in recurso["cierre"].lower()
    assert "Contenido base del Recurso B" in recurso["contenido"]

    admin_res = admin_client.get("/api/admin/leads")
    assert admin_res.status_code == 200, admin_res.text
    leads_list = admin_res.json()

    lead_in_admin = next((item for item in leads_list if item["access_code"] == code), None)
    assert lead_in_admin is not None, "Lead no aparece en admin/leads"
    assert lead_in_admin["recurso_asignado"] == "B"
    assert lead_in_admin["intro_variant"] == "mentalidad"
    assert lead_in_admin["cierre_variant"] == 2


def test_descalificacion_por_p1(client):
    """P1=13 (federada) → out_of_avatar, no califica."""
    quiz_answers = {
        "step_1_nivel": 13,
    }

    lead = create_lead(client, quiz_answers, email=unique_email("p1-dq"))
    code = lead["access_code"]

    verify_res = client.get(f"/api/leads/verify/{code}")
    assert verify_res.status_code == 200
    lead_detail = verify_res.json()

    assert lead_detail["calificado"] is False
    assert lead_detail["step_1_nivel"] == 13
    assert not lead_detail.get("recurso_asignado")

    recurso_res = client.get(f"/api/leads/{code}/recurso")
    assert recurso_res.status_code == 400
    assert "incompletas" in recurso_res.json()["detail"].lower()


def test_descalificacion_por_p4(client):
    """P4=1 (por mi cuenta) → descalificador duro."""
    quiz_answers = {
        "step_1_nivel": 6,
        "step_2_objetivo": 2,
        "step_3a_freno_categoria": "mentalidad",
        "step_3b_freno_especifico": 3,
        "step_4_acompanamiento": 1,
        "step_5_inversion": 4,
    }

    lead = create_lead(client, quiz_answers, email=unique_email("p4-dq"))
    verify_res = client.get(f"/api/leads/verify/{lead['access_code']}")
    assert verify_res.status_code == 200
    assert verify_res.json()["calificado"] is False


def test_descalificacion_por_p5(client):
    """P5=1 o P5=2 (€0-500) → descalifica aunque el resto del quiz sea ideal."""
    for inversion in (1, 2):
        quiz_answers = {
            "step_1_nivel": 6,
            "step_2_objetivo": 2,
            "step_3a_freno_categoria": "mentalidad",
            "step_3b_freno_especifico": 3,
            "step_4_acompanamiento": 4,
            "step_5_inversion": inversion,
        }

        lead = create_lead(client, quiz_answers, email=unique_email(f"p5-dq-{inversion}"))
        verify_res = client.get(f"/api/leads/verify/{lead['access_code']}")
        assert verify_res.status_code == 200
        assert verify_res.json()["calificado"] is False


def test_descalificacion_por_p3b(client):
    """P3b=6 lesión activa (físico) → descalificador duro."""
    quiz_answers = {
        "step_1_nivel": 6,
        "step_2_objetivo": 2,
        "step_3a_freno_categoria": "fisico",
        "step_3b_freno_especifico": 6,
        "step_4_acompanamiento": 4,
        "step_5_inversion": 4,
    }

    lead = create_lead(client, quiz_answers, email=unique_email("p3b-dq"))
    verify_res = client.get(f"/api/leads/verify/{lead['access_code']}")
    assert verify_res.status_code == 200
    assert verify_res.json()["calificado"] is False

    recurso_res = client.get(f"/api/leads/{lead['access_code']}/recurso")
    assert recurso_res.status_code == 200
    recurso = recurso_res.json()
    assert recurso["recurso_nivel"] == "B"
    assert "E2E fisico" in recurso["intro"]


if __name__ == "__main__":
    import pytest

    raise SystemExit(pytest.main([__file__, "-v", "-s"]))
