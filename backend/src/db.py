import psycopg2
from pony.orm import Database, db_session
from decouple import config

db = Database()
DB_SCHEMA = config("DB_SCHEMA", default="landing")
_DB_INITIALIZED = False

MIGRATION_COLUMNS = {
    "avatar": "TEXT",
    "bottleneck_areas": "TEXT",
    "bottleneck_marketing": "TEXT",
    "bottleneck_ventas": "TEXT",
    "bottleneck_producto": "TEXT",
    "bottleneck_sistemas": "TEXT",
    "revenue": "TEXT",
    "ig": "TEXT",
    "responsable": "TEXT",
    "calificado": "BOOLEAN",
    "access_count": "INTEGER DEFAULT 0",
    "bucket_key": "TEXT",
    "zona": "TEXT",
    "edad": "TEXT",
    "quiz_answers": "TEXT",
    "estado": "TEXT DEFAULT 'pendiente'",
    "landing": "INTEGER",
    "step_1_nivel": "INTEGER",
    "step_2_objetivo": "INTEGER",
    "step_3a_freno_categoria": "VARCHAR",
    "step_3b_freno_especifico": "INTEGER",
    "step_4_acompanamiento": "INTEGER",
    "step_5_inversion": "INTEGER",
    "recurso_asignado": "VARCHAR",
    "intro_variant": "VARCHAR",
    "cierre_variant": "INTEGER",
    "recurso_entregado": "TEXT",
}


def _db_connect():
    return psycopg2.connect(
        host=config("DB_HOST"),
        port=int(config("DB_PORT", default=5432)),
        database=config("DB_NAME"),
        user=config("DB_USER"),
        password=config("DB_PASSWORD"),
        sslmode=config("DB_SSLMODE", default="require"),
    )


def _ensure_schema():
    conn = _db_connect()
    conn.autocommit = True
    try:
        with conn.cursor() as cur:
            cur.execute(f'CREATE SCHEMA IF NOT EXISTS "{DB_SCHEMA}"')
    finally:
        conn.close()


LANDING_MIGRATION_COLUMNS = {
    "cierres_json": "TEXT",
}


def _ensure_landing_columns():
    conn = _db_connect()
    conn.autocommit = True
    try:
        with conn.cursor() as cur:
            table = f'"{DB_SCHEMA}"."landings"'
            cur.execute(
                f"""
                SELECT EXISTS (
                    SELECT 1
                    FROM information_schema.tables
                    WHERE table_schema = %s AND table_name = 'landings'
                )
                """,
                (DB_SCHEMA,),
            )
            if not cur.fetchone()[0]:
                return

            for column, col_type in LANDING_MIGRATION_COLUMNS.items():
                cur.execute(
                    f"ALTER TABLE {table} ADD COLUMN IF NOT EXISTS {column} {col_type}"
                )
    finally:
        conn.close()


def _ensure_columns():
    conn = _db_connect()
    conn.autocommit = True
    try:
        with conn.cursor() as cur:
            table = f'"{DB_SCHEMA}"."leads"'
            for column, col_type in MIGRATION_COLUMNS.items():
                cur.execute(
                    f"ALTER TABLE {table} ADD COLUMN IF NOT EXISTS {column} {col_type}"
                )
    finally:
        conn.close()


def seed_resources():
    from src.models import Landing, Resource, ResourceVariation

    with db_session:
        landing = Landing.get(slug="running-alicia")
        if not landing:
            landing = Landing(
                slug="running-alicia",
                name="Running Alicia",
                is_active=True,
            )

        if landing.resources.count() > 0:
            return

        intro_by_freno = {
            "fisico": "Como vemos que lo tuyo es físico, vamos a trabajar en técnica y fuerza.",
            "mentalidad": "Tu freno está en la mentalidad. Acá te doy las herramientas para que rompas esa barrera.",
            "estructura": "Lo que te falta es un plan claro. Eso es lo que vas a tener.",
        }

        for level, name in [
            ("A", "Guía de arranque"),
            ("B", "Plan de progresión"),
            ("C", "Plan de rendimiento"),
        ]:
            resource = Resource(
                landing=landing,
                resource_level=level,
                name=name,
                base_content=f"[Contenido base del Recurso {level}]",
            )

            for freno, intro in intro_by_freno.items():
                ResourceVariation(
                    resource=resource,
                    freno_category=freno,
                    intro_text=intro,
                )


def seed_admin_user():
    from decouple import config

    from src.services.admin_auth_service import create_admin_user

    username = config("ADMIN_USER", default="").strip()
    password = config("ADMIN_PASSWORD", default="")
    if not username or not password:
        return

    create_admin_user(username, password)


def init_db():
    global _DB_INITIALIZED
    from src import models  # noqa: F401

    _ensure_schema()

    if not _DB_INITIALIZED:
        db.bind(
            provider="postgres",
            host=config("DB_HOST"),
            port=int(config("DB_PORT", default=5432)),
            database=config("DB_NAME"),
            user=config("DB_USER"),
            password=config("DB_PASSWORD"),
        )
        _ensure_columns()
        _ensure_landing_columns()
        db.generate_mapping(create_tables=True)
        _DB_INITIALIZED = True

    seed_resources()
    seed_admin_user()
