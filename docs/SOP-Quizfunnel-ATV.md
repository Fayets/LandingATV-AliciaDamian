# SOP — Cómo está armado el Quizfunnel de ATV

Guía para reconstruir una landing tipo ATV (quiz funnel + clave de acceso + WhatsApp + dashboard).

Está escrita para que alguien que **no conoce el código** pueda:

1. Entender el proceso de punta a punta.
2. Copiarlo a su propio negocio (cambiando copy, preguntas y reglas).
3. Pedirle a Claude / Cursor prompts concretos para implementarlo.

---

## 1. Qué es este funnel (en una frase)

No es una landing clásica de “dejá tu email y te mando el PDF”.

Es un **quiz de 4 pasos** que:

1. Captura contacto **antes** de las preguntas (opt-in primero).
2. Califica al lead según **perfil + facturación**.
3. Guarda todo en una base.
4. Entrega una **clave única** (`ATV-XXXX`).
5. Redirige a WhatsApp con un mensaje prearmado (el lead “cae” al setter con todos sus datos).
6. Muestra esos leads en un dashboard interno para que el equipo los trabaje.

El usuario **siempre** recibe clave y WhatsApp, esté calificado o no. La calificación sirve para **ads (Meta)** y para **priorizar** en el dashboard, no para bloquear el acceso.

---

## 2. Mapa del producto

Hay **3 superficies**, no una sola página:

| Superficie | URL (prod) | Quién la ve | Para qué |
|---|---|---|---|
| Landing / quiz | `https://atvos.io/acceso/` | El prospecto | Captar + calificar + generar clave |
| Página de clave | `https://atvos.io/acceso/acceso` | El prospecto, justo después del quiz | Mostrar clave y mandarlo a WhatsApp |
| Dashboard | `https://atvos.io/acceso/dashboard` | Equipo interno (auth del ecosystem) | Ver leads, filtrar, contactar, exportar |

El backend es una API FastAPI (`/api/leads`, `/api/auth`) que guarda en Postgres (schema `landing.leads`).

---

## 3. El viaje del usuario (paso a paso)

```
Entra a /acceso
        │
        ▼
┌───────────────────────────────┐
│ PASO 0 — Hero + formulario    │
│ Nombre, email, WhatsApp, IG   │
│ CTA: “QUIERO MI ACCESO”       │
└──────────────┬────────────────┘
               │ (aún NO se guarda en DB)
               ▼
┌───────────────────────────────┐
│ PASO 1 — Avatar / perfil      │
│ “¿Cuál es tu perfil hoy?”     │
│ 1 opción de 17                │
└──────────────┬────────────────┘
               ▼
┌───────────────────────────────┐
│ PASO 2 — Cuello de botella    │
│ Elige 1+ áreas: Marketing,    │
│ Ventas, Producto              │
│ Por cada área, 1+ sub-opciones│
└──────────────┬────────────────┘
               ▼
┌───────────────────────────────┐
│ PASO 3 — Facturación          │
│ “¿Cuánto facturas por mes?”   │
│ 1 opción de 9 rangos          │
│ CTA: “OBTENER MI CLAVE”       │
└──────────────┬────────────────┘
               │
               ▼
     POST /api/leads  →  se crea el lead
     Se genera clave ATV-XXXX
     Se asigna setter (Lucas / Jero, round-robin)
     Si está CALIFICADO → Pixel + CAPI (Lead + registroCompletado)
               │
               ▼
┌───────────────────────────────┐
│ PÁGINA DE CLAVE               │
│ Muestra ATV-XXXX              │
│ Countdown 10s → WhatsApp      │
│ Mensaje prellenado con todos  │
│ los datos del registro        │
└───────────────────────────────┘
```

**Regla importante:** el lead **no se guarda** al completar el formulario de contacto. Se guarda **al final**, cuando elige facturación. Si abandona a mitad del quiz, no queda registro (salvo que más adelante se implemente un “save parcial”).

---

## 4. Copy y psicología de la landing (qué copiar conceptualmente)

La landing no vende un producto en 3 párrafos. Vende **acceso limitado + método**.

Elementos que hay que replicar (aunque el texto sea distinto):

1. **Headline de resultado concreto**  
   Ejemplo ATV: *“Escalé a +$170k/mes en orgánico, sin ads y 6 piezas de contenido.”*

2. **Promesa de método replicable**  
   *“Te muestro el método que me lo permitió y cómo replicarlo.”*

3. **CTA de acceso, no de “enviar”**  
   Primer botón: `QUIERO MI ACCESO`. Último: `OBTENER MI CLAVE`.

4. **Escasez visual**  
   Badge de cupos que baja solo (empieza en 52, baja 1 cada 25s, piso en 9). Es UX, no stock real.

5. **Barra de progreso**  
   El quiz se siente corto. 4 pasos. Siempre se puede ir “Atrás”.

6. **Nota bajo el primer CTA**  
   *“Luego de completar el formulario vas a obtener una clave única e intransferible.”*  
   Eso justifica por qué pedimos datos primero.

7. **Página de clave = ritual**  
   No es un “gracias”. Es: “ya sos parte”, copiá la clave, confirmá por WhatsApp.

Si reconstruís el funnel, **no copies el copy de ATV**. Copiá esta estructura.

---

## 5. El quiz: 4 pasos, 3 tipos de pregunta

Definido en `frontend/src/data/landingQuiz.js`.

### Paso 0 — Formulario (opt-in)

Campos **obligatorios**:

- Nombre
- Email
- WhatsApp (con selector de país)
- Instagram (`@usuario`)

Sin esos 4, el botón está deshabilitado.

### Paso 1 — Avatar (una sola opción)

Pregunta: *¿Cuál es tu perfil hoy?*

Opciones actuales (17):

- Coaching / Mentoria / Consultoria
- Creador con infoproducto
- Creador de contenido sin infoproducto
- Experto en infoproductos / Growth Operator
- Dueño de negocio con infoproducto
- Dueño de negocio con tienda fisica
- Dueño de agencia
- CCO (director)
- Tienda de ecommerce
- Infoproducto de ecommerce
- Tienda fisica
- Agente inmobiliarios / Real State con infoproducto
- Agente inmobiliarios / Real State sin infoproducto
- Profesional independiente
- Habilidades de alto valor (setter, closer, editor de videos, etc)
- No tengo negocio
- Otro

### Paso 2 — Cuello de botella (multi + condicional)

1. Elige **una o más áreas**: Marketing, Ventas, Producto.
2. Por **cada área marcada**, tiene que marcar **al menos una** sub-opción.

No puede continuar si eligió un área y no marcó detalle.

Sub-opciones:

**Marketing**

- Mis leads son de mala calidad / no califican
- No tengo contenido que convierta (soy viral pero no vendo)
- Dependo de anuncios y mi orgánico no funciona
- No genero suficientes leads
- No tengo métricas claras de mi negocio

**Ventas**

- Tengo un close rate bajo
- Mi tasa de show up rate es baja
- No tengo un proceso de ventas claro
- Tengo una tasa de agenda baja
- No tengo métricas claras de mi negocio

**Producto**

- No tengo casos de éxito
- Tengo una alta tasa de refunds
- No tengo un sistema de upsell y recompras claro
- El producto depende demasiado de mí
- No tengo métricas claras de mi negocio

### Paso 3 — Facturación (una sola opción)

Pregunta: *¿Cuánto facturas por mes hoy?*

- `$0 a 250 usd`
- `$250 a 500 usd`
- `$500 a 1k`
- `$1k a 3k`
- `$3k a 5k`
- `$5k a 10k`
- `$10k a 30k`
- `$30k a 50k`
- `+$50k`

Al confirmar este paso se dispara el `POST` al backend.

---

## 6. Calificación (la regla de negocio más importante)

Un lead está **calificado** solo si cumple **las dos** condiciones:

1. Su avatar está en la lista `AVATAR_QUALIFIED`.
2. Su facturación está en `REVENUE_QUALIFIED` (`$5k a 10k` o más).

Avatares que califican:

- Coaching / Mentoria / Consultoria
- Creador con infoproducto
- Experto en infoproductos / Growth Operator
- Dueño de negocio con infoproducto
- Dueño de agencia
- Profesional independiente
- CCO (director)
- Infoproducto de ecommerce
- Agente inmobiliarios / Real State con infoproducto

Avatares que **no** califican (aunque facturen mucho): creador sin infoproducto, tienda física, ecommerce de producto, “no tengo negocio”, habilidades de alto valor, “otro”, etc.

La lógica vive **duplicada a propósito** (hay que mantenerlas iguales):

- Frontend: `frontend/src/utils/calificacion.js`
- Backend: `backend/src/calificacion.py`

El frontend manda `calificado: true/false` al crear el lead. El backend también puede recalcularlo si faltan datos.

### Para qué se usa `calificado`

| Uso | ¿Calificado? | ¿No calificado? |
|---|---|---|
| Recibe clave | Sí | Sí |
| Va a WhatsApp | Sí | Sí |
| Evento Meta Pixel `Lead` | Sí | No |
| Evento custom `registroCompletado` | Sí | No |
| CAPI (Conversions API) | Sí | No |
| Color en dashboard | Verde | Rojo |

**No dispares Lead de Meta a todo el mundo.** Solo a los que cumplen el ICP. Si no, vas a optimizar ads hacia gente que no sirve.

---

## 7. Qué pasa al guardar el lead

Endpoint: `POST /api/leads/`

El backend:

1. Genera una clave única `ATV-XXXX` (4 dígitos, sin repetir).
2. Asigna **responsable** en round-robin: lead 1 Lucas, lead 2 Jero, lead 3 Lucas…
3. Guarda contacto + quiz + `calificado`.
4. Devuelve `{ ok, id, access_code }`.

Campos que se persisten:

- Contacto: `name`, `email`, `phone`, `ig`
- Acceso: `access_code`, `access_count` (empieza en 0; sube cuando alguien usa la clave)
- Quiz: `avatar`, `revenue`, `bottleneck_areas`, `bottleneck_marketing/ventas/producto`
- Operación: `calificado`, `responsable`, `contacted`, `notes`, `created_at`

---

## 8. Página de clave + WhatsApp del lead

Después del `POST` exitoso:

1. Se guarda el lead en `sessionStorage` (para que si recarga `/acceso/acceso` no pierda la clave).
2. Se muestra la clave grande, con botón copiar.
3. Countdown de **10 segundos**.
4. Redirect automático a `https://wa.me/{NUMERO_DEL_SETTER}?text=...`

El mensaje que **el lead le manda al equipo** (no al revés) incluye:

```
Hola! Acabo de completar mi registro en ATV.
Quiero recibir mi acceso al contenido.

DATOS DE CONTACTO
Nombre: ...
Email: ...
WhatsApp: ...
Instagram: https://instagram.com/usuario

MI SITUACIÓN
Perfil: ...
Facturación mensual: ...

CUELLO DE BOTELLA
Marketing:
- ...

MI CLAVE DE ACCESO
ATV-XXXX
```

Archivo: `frontend/src/utils/buildWhatsappMessage.js`  
Número destino: `VITE_WA_NUMBER` (default `5491162626702`).

Esto es el “cae con el link de IG”: el setter recibe el chat ya armado, no tiene que pedir datos de nuevo.

---

## 9. Meta Pixel + CAPI (solo calificados)

### Pixel (browser)

En `frontend/index.html`:

- `fbq('init', PIXEL_ID)`
- `fbq('track', 'PageView')` en cada carga

Al terminar el quiz, **si está calificado**:

- `fbq('track', 'Lead', { content_name: 'webinar_calificado' }, { eventID })`
- `fbq('trackCustom', 'registroCompletado', { content_name: 'webinar_calificado' }, { eventID })`

### CAPI (servidor)

El frontend llama `POST /api/leads/{id}/capi` dos veces (mismos `event_id` que el Pixel, para deduplicar).

El backend hashea email y teléfono (SHA-256) y los manda a Graph API.

Token: env `META_CAPI_TOKEN`.  
Pixel ID actual: `1502839491117808`.

Si copiás el funnel: cambiá Pixel ID, token, y los nombres de eventos si tu campaña usa otros.

---

## 10. Dashboard interno (lo que el equipo usa después)

No es parte de la experiencia del prospecto, pero **sí es parte del SOP del funnel**. Sin esto, el quiz tira leads a un agujero.

El dashboard (`/acceso/dashboard`) permite:

- Ver todos los registrados (tabla + panel lateral).
- Filtrar por área, responsable, avatar, facturación, día, estado.
- Ver si está calificado / completo / contactado.
- Abrir WhatsApp **hacia el lead** con un mensaje distinto según si terminó el quiz o no:
  - **Solo datos** (abandonó conceptualmente / sin avatar): “¿por qué no completaste el formulario?”
  - **Completo**: link del curso + primer problema detectado.
- Reasignar setter, notas, regenerar clave, marcar contactado, exportar `.txt`, borrar.

Auth: cookie de sesión del ecosystem (`ecosystem.atvos.io`). Sin sesión, redirect.

---

## 11. Cómo reconstruirlo (orden de armado)

No empieces por el dashboard ni por Meta. Orden recomendado:

### Fase 1 — Quiz visible (1–2 días)

1. Una sola página con hero + 4 pasos.
2. Validaciones de cada paso.
3. Al final, `console.log` del payload. Todavía sin backend.

### Fase 2 — Guardar leads

4. Tabla `leads` con contacto + respuestas + `access_code` + `calificado`.
5. `POST /leads` que genera la clave y devuelve `{ id, access_code }`.
6. Página de “ya sos parte” con la clave.

### Fase 3 — WhatsApp

7. Armar el mensaje con todos los campos (incluido IG como URL).
8. Countdown + redirect a `wa.me`.

### Fase 4 — Calificación + ads

9. Función `esCalificado(avatar, revenue)`.
10. Pixel PageView.
11. Pixel + CAPI **solo si calificado**, con el mismo `event_id`.

### Fase 5 — Operación

12. Dashboard mínimo: lista, filtros, WhatsApp al lead, marcar contactado.
13. Round-robin de setters.
14. Export `.txt` para análisis.

---

## 12. Decisiones que tenés que tomar vos (no copies las de ATV)

Antes de pedirle código a Claude, definí esto en un doc corto:

1. **Oferta:** ¿qué “ganan” al terminar? (clave, diagnóstico, clase, comunidad)
2. **ICP:** ¿quién sí / quién no? (equivalente a avatar + facturación)
3. **Preguntas:** 3–5 máximo. Primero datos, después calificación.
4. **WhatsApp destino:** un número de setter, no el del founder si no va a contestar.
5. **Qué evento de Meta pagás:** normalmente `Lead` solo en calificados.
6. **Qué pasa con los no calificados:** en ATV igual reciben clave; en tu caso podés mandarlos a otro mensaje / otra lista.
7. **Quién trabaja el lead:** 1 persona, round-robin, o CRM.

---

## 13. Prompts listos para Claude / Cursor

Copiá y completá los corchetes. Pedí **una fase por chat**, no todo junto.

### Prompt A — Especificar el funnel (antes de codear)

```
Quiero armar un quiz funnel similar al de ATV, pero para [MI NEGOCIO].

Contexto de ATV (no copies el copy, copies la estructura):
- Landing con headline de resultado + quiz de 4 pasos
- Paso 0: captura nombre, email, WhatsApp, Instagram (obligatorios)
- Paso 1: avatar / perfil (1 opción)
- Paso 2: cuello de botella (áreas + sub-opciones condicionales)
- Paso 3: facturación
- Recién al final se guarda el lead y se genera una clave única
- Página de clave + redirect a WhatsApp con mensaje prellenado (incluye link de IG)
- Calificado = avatar ICP + facturación mínima. Todos reciben clave; solo calificados disparan Meta Lead + CAPI
- Dashboard interno para el equipo

Mi oferta: [QUÉ ENTREGO]
Mi ICP: [QUIÉN SÍ / QUIÉN NO]
Facturación mínima para calificar: [ej $5k/mes]
Avatares que califican: [lista]
Avatares que no: [lista]
Preguntas de cuello de botella: [áreas y sub-opciones]
Número de WhatsApp destino: [+54...]
Eventos Meta: PageView para todos; Lead + registroCompletado solo calificados

Ayudame a:
1. Redactar headline, sub, CTAs y nota de escasez (sin copiar ATV)
2. Dejar el mapa de pasos y validaciones
3. Escribir la regla de calificación en una función clara
4. Armar el template del mensaje de WhatsApp
No escribas código todavía.
```

### Prompt B — Implementar la landing + quiz

```
Implementá la landing del quiz funnel según este spec:

[PEGÁ EL OUTPUT DEL PROMPT A]

Stack: React + Vite. Una sola página pública.
Requisitos:
- 4 pasos con barra de progreso y botón Atrás
- Formulario primero (nombre, email, phone con país, Instagram)
- No guardar en API hasta el último paso
- Validar cada paso (cuello de botella: si marca un área, debe marcar ≥1 sub-opción)
- Al final POST /api/leads y navegar a la pantalla de clave
- No toques ads todavía
```

### Prompt C — Backend de leads

```
Creá el backend de leads para este quiz funnel.

Al crear un lead:
- Generar access_code único con formato [PREFIJO]-XXXX
- Asignar responsable round-robin entre [Setter A] y [Setter B]
- Guardar contacto + respuestas del quiz + calificado
- Devolver { ok, id, access_code }

Calificación:
calificado = avatar ∈ [LISTA] AND revenue ∈ [LISTA]

Endpoints mínimos:
POST /api/leads
GET /api/leads
GET /api/leads/metrics
PATCH /api/leads/:id
POST /api/leads/:id/capi
```

### Prompt D — Página de clave + WhatsApp

```
Después de crear el lead, mostrá una página de “acceso confirmado”:
- Clave grande + copiar
- Countdown de 10s
- Redirect a wa.me con mensaje prellenado

El mensaje debe incluir:
DATOS DE CONTACTO (nombre, email, WhatsApp, Instagram como https://instagram.com/handle)
MI SITUACIÓN (perfil + facturación)
CUELLO DE BOTELLA (áreas y bullets)
MI CLAVE DE ACCESO

Guardá el lead en sessionStorage para que un refresh no pierda la clave.
Si no hay lead válido, volvé a la landing.
```

### Prompt E — Meta solo calificados

```
Integrá Meta Pixel + CAPI.

- PageView en todas las páginas
- Al completar el quiz, SOLO si esCalificado(avatar, revenue):
  - fbq Lead + fbq custom registroCompletado
  - Mismo eventID en Pixel y CAPI para deduplicar
  - CAPI hashea email y phone SHA-256
- No dispares Lead si no está calificado
```

### Prompt F — Dashboard mínimo

```
Armá un dashboard interno de registrados:
- Tabla con nombre, WhatsApp, IG, clave, responsable, avatar, áreas, facturación, fecha, calificado
- Filtros
- Panel lateral con todo el detalle
- Click en WhatsApp abre wa.me al número del lead con mensaje distinto si está completo vs solo datos
- Exportar .txt con el detalle de los leads filtrados
- Auth: si no hay sesión, redirect al login
No toques la landing pública.
```

---

## 14. Checklist para saber si “está igual de armado”

- [ ] El contacto se pide **antes** de las preguntas de calificación.
- [ ] El lead se persiste **recién al final**.
- [ ] Hay clave única visible.
- [ ] WhatsApp se abre solo, con ficha completa (incluido IG clickeable).
- [ ] Calificado = ICP + plata, no “llenó el form”.
- [ ] Meta Lead **no** se dispara a no calificados.
- [ ] El equipo ve los leads en un tablero el mismo día.
- [ ] Cada lead tiene un responsable.
- [ ] Se puede filtrar y exportar para sacar conclusiones.

Si falta alguno de esos 9, todavía no es el funnel de ATV: es un formulario con estética de quiz.

---

## 15. Archivos de referencia en este repo

| Qué | Dónde |
|---|---|
| Pasos y opciones del quiz | `frontend/src/data/landingQuiz.js` |
| UI de la landing | `frontend/src/pages/LandingPage.jsx` |
| Calificación (front) | `frontend/src/utils/calificacion.js` |
| Calificación (back) | `backend/src/calificacion.py` |
| Mensaje WA del lead → setter | `frontend/src/utils/buildWhatsappMessage.js` |
| Mensaje WA del setter → lead | `frontend/src/utils/buildSetterWhatsappUrl.js` |
| Página de clave | `frontend/src/pages/AccessCodePage.jsx` |
| Ruteo landing / clave / dashboard | `frontend/src/App.jsx` |
| Crear lead + round-robin + clave | `backend/src/services/leads_services.py` |
| Pixel + CAPI | `frontend/index.html` + `backend/src/controllers/leads_controller.py` |
| Modelo de datos | `backend/src/models.py` |

---

*Documento interno para reconstruir el quiz funnel. No incluye secretos (tokens, cookies). El copy de ATV es de referencia: al clonar, reescribir.*
