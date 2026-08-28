"""
Qué PDF le toca a cada lead.

Fuente: "Mapeo de Recursos — Qué archivo entregar" (Alicia Damián Coach).
Dos preguntas deciden el archivo:

  Paso 1 (nivel)        → documento base A / B / C
  Paso 3b (freno)       → identificador, solo en 6 de las 20 opciones

El Paso 2 (objetivo) y el resto de opciones del Paso 3b no cambian el
archivo: son contexto interno para la llamada.
"""

from pathlib import Path

PDF_DIR = Path(__file__).resolve().parents[2] / "resources_pdf"

# Paso 1 → nivel
NIVELES = {
    "A": {1, 2, 3, 4},
    "B": {5, 6, 7, 8},
    "C": {9, 10, 11, 12},
}

# Paso 1 opciones 13 y 14: federada de rendimiento y lesión activa.
# Por decisión del equipo no reciben entrega automática — entran a nurture.
FUERA_DE_AVATAR = {13, 14}

# Paso 3a → { opción de Paso 3b : identificador }
IDENTIFICADORES = {
    "fisico": {
        3: "Pulsaciones",       # cuesta gestionar respiración / pulsaciones
    },
    "mentalidad": {
        1: "Abandono",          # empieza y abandona a las pocas semanas
        3: "Abandono",          # no encuentra motivación
        5: "Tiempo",            # poco tiempo real en el día a día
    },
    "estructura": {
        1: "Estructura",        # no sabe cuántos días entrenar ni cómo progresar
        4: "Estructura",        # no tiene forma de medir si lo hace bien
    },
}

ARCHIVOS_BASE = {
    "A": "Recurso_A_Guia_de_Arranque.pdf",
    "B": "Recurso_B_Diagnostico_de_Progresion.pdf",
    "C": "Recurso_C_Plan_de_Rendimiento.pdf",
}

NOMBRES = {
    "A": "Guía de arranque",
    "B": "Diagnóstico de progresión",
    "C": "Plan de rendimiento",
}


def _to_int(value):
    try:
        return int(value)
    except (TypeError, ValueError):
        return None


def nivel_de(step_1) -> str | None:
    """A / B / C, o None si está fuera de avatar o falta el dato."""
    nivel = _to_int(step_1)
    if nivel is None:
        return None
    for letra, opciones in NIVELES.items():
        if nivel in opciones:
            return letra
    return None


def identificador_de(step_3a, step_3b) -> str | None:
    if not step_3a:
        return None
    opcion = _to_int(step_3b)
    if opcion is None:
        return None
    return IDENTIFICADORES.get(str(step_3a), {}).get(opcion)


def resolver_recurso(step_1, step_3a=None, step_3b=None) -> dict:
    """
    Devuelve el archivo que le toca al lead.

    estado:
      ok               → hay archivo
      fuera_de_avatar  → opciones 13/14 del Paso 1, sin entrega automática
      incompleto       → falta el nivel para poder resolver
    """
    nivel_raw = _to_int(step_1)

    if nivel_raw in FUERA_DE_AVATAR:
        return {"estado": "fuera_de_avatar", "nivel": None, "identificador": None, "archivo": None}

    nivel = nivel_de(nivel_raw)
    if not nivel:
        return {"estado": "incompleto", "nivel": None, "identificador": None, "archivo": None}

    identificador = identificador_de(step_3a, step_3b)
    archivo = (
        f"Diagnostico_{nivel}_{identificador}.pdf"
        if identificador
        else ARCHIVOS_BASE[nivel]
    )

    return {
        "estado": "ok",
        "nivel": nivel,
        "nombre": NOMBRES[nivel],
        "identificador": identificador,
        "archivo": archivo,
    }


def ruta_del_archivo(archivo: str) -> Path | None:
    """Ruta en disco, validando que no se salga del directorio de recursos."""
    if not archivo:
        return None
    ruta = (PDF_DIR / archivo).resolve()
    if PDF_DIR.resolve() not in ruta.parents or not ruta.is_file():
        return None
    return ruta
