const API_BASE = import.meta.env.VITE_API_URL || '/api'

export async function submitLead(data) {
  const res = await fetch(`${API_BASE}/leads/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('No se pudo completar el registro')
  return res.json()
}

export async function fetchLeads() {
  const res = await fetch(`${API_BASE}/leads/`)
  if (!res.ok) throw new Error('No se pudieron cargar los registrados')
  return res.json()
}

export async function updateLead(id, data) {
  const res = await fetch(`${API_BASE}/leads/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('No se pudo actualizar')
  return res.json()
}

export async function regenerarCodigo(id) {
  const res = await fetch(`${API_BASE}/leads/${id}/regenerar-codigo`, {
    method: 'POST',
  })
  if (!res.ok) throw new Error('No se pudo regenerar la clave')
  return res.json()
}

export async function deleteLead(id) {
  const res = await fetch(`${API_BASE}/leads/${id}`, {
    method: 'DELETE',
  })
  if (!res.ok) throw new Error('No se pudo eliminar el registrado')
  return res.json()
}

/** Cookies que deja el píxel: _fbp identifica el navegador y _fbc el clic del anuncio. */
function readPixelCookie(name) {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : null
}

export async function sendCapiEvent(leadId, eventData) {
  try {
    await fetch(`${API_BASE}/leads/${leadId}/capi`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...eventData,
        source_url: window.location.href,
        fbp: readPixelCookie('_fbp'),
        fbc: readPixelCookie('_fbc'),
      }),
    })
  } catch (e) {
    console.error('CAPI error:', e)
  }
}
