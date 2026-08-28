from pony.orm import Required, Optional, Set
from datetime import datetime
from src.db import db, DB_SCHEMA


class Landing(db.Entity):
    _table_ = (DB_SCHEMA, "landings")

    slug = Required(str, unique=True)
    name = Required(str)
    is_active = Required(bool, default=True)
    wa_number = Optional(str)
    code_prefix = Optional(str, default="FLR")
    meta_pixel_id = Optional(str)
    meta_capi_token = Optional(str)
    cierres_json = Optional(str)
    created_at = Required(datetime, default=datetime.utcnow)
    updated_at = Required(datetime, default=datetime.utcnow)

    resources = Set("Resource")
    leads = Set("Lead")


class Resource(db.Entity):
    _table_ = (DB_SCHEMA, "resources")

    landing = Required("Landing")
    resource_level = Required(str)
    name = Required(str)
    description = Optional(str)
    base_content = Optional(str)
    created_at = Required(datetime, default=datetime.utcnow)

    variations = Set("ResourceVariation")


class ResourceVariation(db.Entity):
    _table_ = (DB_SCHEMA, "resource_variations")

    resource = Required("Resource")
    freno_category = Required(str)
    intro_text = Required(str)
    note_text = Optional(str)
    created_at = Required(datetime, default=datetime.utcnow)


class Lead(db.Entity):
    _table_ = (DB_SCHEMA, "leads")

    name         = Required(str)
    email        = Required(str)
    phone        = Required(str)
    ig           = Optional(str)
    access_code  = Required(str, unique=True)
    access_count = Required(int, default=0)

    avatar               = Optional(str)
    bottleneck_areas     = Optional(str)
    bottleneck_marketing = Optional(str)
    bottleneck_ventas    = Optional(str)
    bottleneck_producto  = Optional(str)
    bottleneck_sistemas  = Optional(str)
    revenue              = Optional(str)
    calificado           = Optional(bool)
    bucket_key           = Optional(str)
    responsable          = Optional(str)
    zona                 = Optional(str)
    edad                 = Optional(str)
    quiz_answers         = Optional(str)
    estado               = Optional(str, default="pendiente")

    landing = Optional("Landing")
    step_1_nivel = Optional(int)
    step_2_objetivo = Optional(int)
    step_3a_freno_categoria = Optional(str)
    step_3b_freno_especifico = Optional(int)
    step_4_acompanamiento = Optional(int)
    step_5_inversion = Optional(int)
    recurso_asignado = Optional(str)
    intro_variant = Optional(str)
    cierre_variant = Optional(int)
    recurso_entregado = Optional(str)

    created_at   = Required(datetime, default=datetime.utcnow)
    contacted    = Required(bool, default=False)
    notes        = Optional(str)


class ResourceTemplate(db.Entity):
    _table_ = (DB_SCHEMA, "resource_templates")

    bucket_key = Required(str, unique=True)
    title      = Required(str)
    summary    = Optional(str)
    sections   = Required(str)
    updated_at = Required(datetime, default=datetime.utcnow)


class AdminUser(db.Entity):
    _table_ = (DB_SCHEMA, "admin_users")

    username = Required(str, unique=True)
    password_hash = Required(str)
    is_active = Required(bool, default=True)
    created_at = Required(datetime, default=datetime.utcnow)
    updated_at = Required(datetime, default=datetime.utcnow)
