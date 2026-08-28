# Sincronizar con frontend/src/data/landingQuiz.js y frontend/src/utils/calificacion.js

STEP_3B_OPTIONS = {
    "fisico": {
        6: "hard_disqualifier",
    },
    "mentalidad": {
        7: "hard_disqualifier",
    },
    "estructura": {
        6: "hard_disqualifier",
        7: "hard_disqualifier",
    },
}

# P5 — valores sincronizados con landingQuiz.js
STEP_5_DISQUALIFY = {1, 2}  # €0-250, €250-500
STEP_5_FLAG = {3}           # €500-1000
STEP_5_QUALIFIED = {4, 5}   # €1000-2000, €2000+


def _to_int(value) -> int | None:
    if value is None or value == "":
        return None
    try:
        return int(value)
    except (TypeError, ValueError):
        return None


def calcular_calificacion(quiz_answers: dict | None) -> dict:
    answers = quiz_answers or {}

    step1 = _to_int(answers.get("step_1_nivel"))
    step4 = _to_int(answers.get("step_4_acompanamiento"))
    step3a = answers.get("step_3a_freno_categoria")
    step3b = _to_int(answers.get("step_3b_freno_especifico"))
    step5 = _to_int(answers.get("step_5_inversion"))

    # P5 — gate principal: inversión insuficiente descalifica aunque el resto califique.
    if step5 in STEP_5_DISQUALIFY:
        return {"calificado": False, "razon": "inversion_insuficiente"}

    if step1 is not None and step1 >= 13:
        return {"calificado": False, "razon": "out_of_avatar"}

    if step4 == 1:
        return {"calificado": False, "razon": "prefiere_sin_acompanamiento"}

    if step4 not in (2, 3, 4):
        return {"calificado": False, "razon": "p4_no_califica"}

    if step3a and step3b is not None:
        category_opts = STEP_3B_OPTIONS.get(step3a, {})
        if category_opts.get(step3b) == "hard_disqualifier":
            return {"calificado": False, "razon": "hard_disqualifier_p3b"}

    step5_qualification = None
    if step5 in STEP_5_FLAG:
        step5_qualification = "flag"
    elif step5 in STEP_5_QUALIFIED:
        step5_qualification = "qualified"

    return {
        "calificado": True,
        "step5_qualification": step5_qualification,
    }


def es_calificado(
    avatar: str | None = None,
    revenue: str | None = None,
    edad: str | None = None,
    quiz_answers: dict | None = None,
) -> bool | None:
    if quiz_answers:
        return calcular_calificacion(quiz_answers)["calificado"]

    if edad is not None:
        return None

    if not avatar and not revenue:
        return None

    return False
