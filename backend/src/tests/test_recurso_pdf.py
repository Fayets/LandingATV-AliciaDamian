"""Mapeo de recursos — "Qué archivo entregar" (Alicia Damián Coach)."""

import pytest

from src.services.recurso_pdf import PDF_DIR, resolver_recurso, ruta_del_archivo

LISTAS_3B = {"fisico": range(1, 7), "mentalidad": range(1, 8), "estructura": range(1, 8)}


@pytest.mark.parametrize("nivel,esperado", [
    (1, "A"), (4, "A"), (5, "B"), (8, "B"), (9, "C"), (12, "C"),
])
def test_paso_1_decide_el_documento_base(nivel, esperado):
    assert resolver_recurso(nivel, "fisico", 1)["nivel"] == esperado


@pytest.mark.parametrize("categoria,opcion,identificador", [
    ("fisico", 3, "Pulsaciones"),
    ("mentalidad", 1, "Abandono"),
    ("mentalidad", 3, "Abandono"),
    ("mentalidad", 5, "Tiempo"),
    ("estructura", 1, "Estructura"),
    ("estructura", 4, "Estructura"),
])
def test_las_seis_opciones_que_activan_identificador(categoria, opcion, identificador):
    resultado = resolver_recurso(6, categoria, opcion)
    assert resultado["identificador"] == identificador
    assert resultado["archivo"] == f"Diagnostico_B_{identificador}.pdf"


@pytest.mark.parametrize("categoria,opcion", [
    ("fisico", 1), ("fisico", 5), ("mentalidad", 2), ("mentalidad", 7),
    ("estructura", 3), ("estructura", 6),
])
def test_el_resto_de_opciones_entrega_el_archivo_base(categoria, opcion):
    assert resolver_recurso(6, categoria, opcion)["archivo"] == "Recurso_B_Diagnostico_de_Progresion.pdf"


@pytest.mark.parametrize("nivel", [13, 14])
def test_fuera_de_avatar_no_recibe_entrega_automatica(nivel):
    resultado = resolver_recurso(nivel, "mentalidad", 1)
    assert resultado["estado"] == "fuera_de_avatar"
    assert resultado["archivo"] is None


def test_sin_nivel_no_se_puede_resolver():
    assert resolver_recurso(None, "fisico", 3)["estado"] == "incompleto"


def test_el_paso_2_no_cambia_el_archivo():
    """El objetivo es contexto de venta, no entra en la decisión del archivo."""
    base = resolver_recurso(7, "estructura", 1)["archivo"]
    assert base == "Diagnostico_B_Estructura.pdf"


def test_toda_combinacion_apunta_a_un_pdf_que_existe():
    for nivel in range(1, 15):
        for categoria, opciones in LISTAS_3B.items():
            for opcion in opciones:
                resultado = resolver_recurso(nivel, categoria, opcion)
                if resultado["archivo"]:
                    assert ruta_del_archivo(resultado["archivo"]), resultado


def test_los_quince_pdf_son_alcanzables():
    alcanzados = {
        resolver_recurso(nivel, categoria, opcion)["archivo"]
        for nivel in range(1, 15)
        for categoria, opciones in LISTAS_3B.items()
        for opcion in opciones
    } - {None}
    en_disco = {ruta.name for ruta in PDF_DIR.glob("*.pdf")}
    assert alcanzados == en_disco


def test_no_se_puede_salir_del_directorio_de_recursos():
    assert ruta_del_archivo("../.env") is None
    assert ruta_del_archivo("../../etc/passwd") is None
