# Quiz Funnel Template

Template reutilizable para captar leads con un quiz, generar una clave de acceso única, redirigir a WhatsApp y entregar diagnósticos por código. Incluye Panel Setter (admin) y dashboard de métricas opcional.

## Qué incluye

- **Landing + quiz** en `/acceso` (`landingQuiz.js` + copy en `LandingPage.jsx`)
- **Clave de acceso** generada en backend con prefijo configurable
- **Página post-quiz** en `/acceso/clave` con countdown y redirect a WhatsApp
- **Recurso autogestionado** en `/recurso` (diagnóstico por código de acceso)
- **Panel Setter** en `/admin` (login con contraseña única + gestión de leads)
- **Dashboard ecosystem** en `/dashboard` (opcional, requiere `VITE_ECOSYSTEM_URL`)
- **Meta Pixel + Conversions API** (opcional)

## Rutas

| Ruta | Descripción |
|---|---|
| `/` | Redirect a `/acceso` |
| `/acceso` | Landing + quiz |
| `/acceso/clave` | Página con clave generada (post-quiz) |
| `/recurso` | Input de código → diagnóstico por bucket |
| `/login` | Login del panel interno |
| `/dashboard` | Métricas, leads y configuración de recursos (requiere login) |

## Stack

- **Frontend:** React + Vite + CSS Modules
- **Backend:** FastAPI + Pony ORM + PostgreSQL

## Inicio rápido

### 1. Clonar y configurar variables

```bash
cd backend && cp .env.template .env
cd ../frontend && cp .env.template .env
```

Completar al menos: `DB_*`, `SECRET`, `ADMIN_PASSWORD`, `ACCESS_CODE_PREFIX`, `VITE_WA_NUMBER`, `VITE_API_URL`.

### 2. Personalizar el funnel

| Archivo | Qué editar |
|---|---|
| `frontend/src/data/landingContent.js` | **Todo el copy y la urgencia**: hero, cupos, cierre, testimonios, FAQ, marca |
| `frontend/src/index.css` | Paleta y tipografías (bloque de tokens al inicio) |
| `frontend/src/data/landingQuiz.js` | Preguntas, opciones y criterios de calificación |
| `backend/src/resources.py` | Diagnósticos por bucket (ver sección abajo) |
| `backend/src/calificacion.py` | Sync con la calificación del frontend |

### Urgencia (FOMO)

El objeto `FOMO` en `landingContent.js` controla los tres mecanismos:

| Bloque | Qué hace |
|---|---|
| `deadline` | Cuenta atrás al cierre de convocatoria (semanal recurrente o fecha fija) |
| `cupos` | Plazas restantes + barra de ocupación |
| `activity` | Avisos de registros recientes. **Apagado por defecto**: los nombres son inventados y mostrarlos como reales es publicidad engañosa (LGDCU art. 5/7) |

### 3. Levantar en local

```bash
# Terminal 1 — backend
cd backend
pip install -r requirements.txt
uvicorn main:app --reload

# Terminal 2 — frontend
cd frontend
npm install
npm run dev
```

- Landing: `http://localhost:5173/acceso`
- Recurso: `http://localhost:5173/recurso`
- Panel Setter: `http://localhost:5173/admin`

### 4. Deploy con Docker

```bash
docker compose up --build -d
```

- Frontend: `http://localhost:8085/acceso`
- Backend: `http://localhost:8005/health`

## Diagnósticos por bucket (`/recurso`)

Al crear un lead, el backend persiste un campo **`bucket_key`** calculado una sola vez en el submit (no se recalcula en `/recurso`).

### Formato de `bucket_key`

```
{calificacion}|{avatar}|{revenue}|{bottleneck_principal}
```

| Segmento | Valores |
|---|---|
| `calificacion` | `calificado` · `no_calificado` · `sin_calificar` |
| `avatar` | slug del avatar (ej. `coaching_mentoria`) o `none` |
| `revenue` | slug del revenue (ej. `5k_a_10k`) o `none` |
| `bottleneck_principal` | slug de la primera área en `bottleneck_areas` o `none` |

**Ejemplo:** `calificado|coaching_mentoria|5k_a_10k|marketing`

### Cómo completar el contenido

Editá `backend/src/resources.py`:

```python
DIAGNOSIS_BY_BUCKET = {
    "calificado|coaching_mentoria|5k_a_10k|marketing": {
        "title": "Tu diagnóstico",
        "summary": "...",
        "sections": [{"heading": "...", "body": "..."}],
    },
}
```

Si no hay match, se usa `DEFAULT_DIAGNOSIS`.

El endpoint es `GET /api/leads/resource?code=QF-1234`.

## Panel interno (`/login` → `/dashboard`)

Auth con usuario/contraseña (`ADMIN_USER` + `ADMIN_PASSWORD` en backend).

- `POST /api/admin/login` → cookie httpOnly con JWT
- `GET /api/admin/resources` → listado de diagnósticos por bucket
- `PUT /api/admin/resources` → guardar/editar recurso de un bucket

Desde el dashboard podés ver métricas, leads y el botón **Recursos** para configurar qué ve cada lead en `/recurso`.

## Variables de entorno

### backend/.env

| Variable | Descripción |
|---|---|
| `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` | PostgreSQL |
| `ACCESS_CODE_PREFIX` | Prefijo de claves (ej: `QF` → `QF-1234`) |
| `ADMIN_PASSWORD` | Contraseña del Panel Setter |
| `SECRET` | Secret para JWT (admin + ecosystem) |
| `ALLOWED_ORIGINS` | Orígenes CORS separados por coma |
| `LANDING_URL` | URL pública de la landing |
| `META_PIXEL_ID`, `META_CAPI_TOKEN` | Meta (opcional) |
| `LEAD_RESPONSABLES` | Round-robin de responsables (opcional) |

### frontend/.env

| Variable | Descripción |
|---|---|
| `VITE_API_URL` | URL base del backend (local: `http://localhost:8000/api`, prod: `/api`) |
| `VITE_APP_NAME` | Nombre de la app |
| `VITE_WA_NUMBER` | WhatsApp destino |
| `VITE_META_PIXEL_ID` | Meta Pixel (opcional) |
| `VITE_ECOSYSTEM_URL` | Login ecosystem para `/dashboard` |

## API Endpoints

| Método | Ruta | Descripción |
|---|---|---|
| `POST` | `/api/leads/` | Crear lead desde el quiz |
| `GET` | `/api/leads/resource?code=` | Diagnóstico por código |
| `POST` | `/api/admin/login` | Login Panel Setter |
| `GET` | `/api/admin/leads` | Leads para admin |
| `PATCH` | `/api/admin/leads/{id}` | Actualizar estado |
| `GET` | `/health` | Health check |

## Flujo del usuario

1. Llega a `/` → redirect a `/acceso`
2. Completa el quiz → backend guarda lead + `bucket_key` + clave
3. Redirige a `/acceso/clave` → WhatsApp con la clave
4. Luego puede ir a `/recurso`, ingresar su código y ver el diagnóstico
5. El equipo gestiona leads en `/admin`

## Mensaje de WhatsApp

```
Hola {nombre}, tu clave es {clave}.
```

Editá `frontend/src/utils/buildWhatsappMessage.js` para personalizarlo.

## Checklist antes del primer deploy

- [ ] `backend/.env` y `frontend/.env` completos (incl. `ADMIN_PASSWORD`)
- [ ] Preguntas en `landingQuiz.js` y copy en `LandingPage.jsx`
- [ ] Diagnósticos en `backend/src/resources.py`
- [ ] `ALLOWED_ORIGINS` incluye tu dominio de producción
- [ ] Criterios de calificación sync entre frontend y backend

## Notas

- Los archivos `.env` no deben committearse.
- El campo **`bucket_key`** se persiste al crear el lead.
- El campo **`zona`** es string libre (no existía antes; se agregó para filtros del admin).
- El campo **`estado`** es string libre con default `pendiente` (no existía antes; reemplaza la gestión binaria de `contacted` en el admin).
