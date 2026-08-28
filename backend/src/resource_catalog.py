"""
Plantillas de diagnóstico por bucket (código estático).

Clave de combinación (bucket_key):
  {zona}|{tiempo}|{entrenamientos}|{dias}

Ejemplo:
  "espana|1_a_3_anos|combino_easy_run_series_y_algun_rodaje_largo_pero_sin_estructura|3_a_4_dias"
"""

DEFAULT_DIAGNOSIS = {
    "title": "[Título del diagnóstico por defecto]",
    "summary": "[Resumen placeholder — personalizá este contenido al clonar]",
    "sections": [
        {
            "heading": "[Sección 1]",
            "body": "[Contenido placeholder]",
        },
    ],
}

DIAGNOSIS_BY_BUCKET: dict[str, dict] = {
    # Ejemplo (vacío de contenido real):
    # "calificado|coaching_mentoria|5k_a_10k|marketing": {
    #     "title": "Diagnóstico para coaching con foco en marketing",
    #     "summary": "...",
    #     "sections": [
    #         {"heading": "Prioridad", "body": "..."},
    #     ],
    # },
}
