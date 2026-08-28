from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List, Any


class LeadCreate(BaseModel):
    name: str
    email: str
    phone: str
    ig: Optional[str] = None
    avatar: Optional[str] = None
    bottleneck_areas: Optional[List[str]] = None
    bottleneck_marketing: Optional[List[str]] = None
    bottleneck_ventas: Optional[List[str]] = None
    bottleneck_producto: Optional[List[str]] = None
    bottleneck_sistemas: Optional[List[str]] = None
    revenue: Optional[str] = None
    calificado: Optional[bool] = None
    zona: Optional[str] = None
    edad: Optional[str] = None
    quiz_answers: Optional[dict[str, Any]] = None


class LeadUpdate(BaseModel):
    contacted: Optional[bool] = None
    notes: Optional[str] = None
    ig: Optional[str] = None
    responsable: Optional[str] = None
    avatar: Optional[str] = None
    bottleneck_areas: Optional[List[str]] = None
    bottleneck_marketing: Optional[List[str]] = None
    bottleneck_ventas: Optional[List[str]] = None
    bottleneck_producto: Optional[List[str]] = None
    bottleneck_sistemas: Optional[List[str]] = None
    revenue: Optional[str] = None
    calificado: Optional[bool] = None
    zona: Optional[str] = None
    estado: Optional[str] = None


class AdminLeadUpdate(BaseModel):
    estado: str


class AdminLogin(BaseModel):
    username: str = ""
    password: str


class ResourceSection(BaseModel):
    heading: str
    body: str


class ResourceTemplateUpdate(BaseModel):
    bucket_key: str
    title: str
    summary: Optional[str] = ""
    sections: List[ResourceSection] = []


class ResourceDynamicUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    base_content: Optional[str] = None


class ResourceVariationUpdate(BaseModel):
    intro_text: Optional[str] = None
    note_text: Optional[str] = None


class ResourceVariationCreate(BaseModel):
    freno_category: str
    intro_text: str
    note_text: Optional[str] = ""


class CierresUpdate(BaseModel):
    cierres: dict[str, str]


class LeadOut(BaseModel):
    id: int
    name: str
    email: str
    phone: str
    ig: Optional[str] = None
    access_code: str
    access_count: Optional[int] = 0
    avatar: Optional[str] = None
    bottleneck_areas: Optional[List[str]] = None
    bottleneck_marketing: Optional[List[str]] = None
    bottleneck_ventas: Optional[List[str]] = None
    bottleneck_producto: Optional[List[str]] = None
    bottleneck_sistemas: Optional[List[str]] = None
    revenue: Optional[str] = None
    calificado: Optional[bool] = None
    bucket_key: Optional[str] = None
    responsable: Optional[str] = None
    zona: Optional[str] = None
    edad: Optional[str] = None
    quiz_answers: Optional[dict[str, Any]] = None
    estado: Optional[str] = None
    created_at: datetime
    contacted: bool
    notes: Optional[str] = None
