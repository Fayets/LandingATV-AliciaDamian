const API_BASE = import.meta.env.VITE_API_URL || '/api'

async function parseError(res) {
  const data = await res.json().catch(() => ({}))
  if (typeof data.detail === 'string') return data.detail
  if (Array.isArray(data.detail)) {
    return data.detail.map((item) => item.msg || String(item)).join(', ')
  }
  return 'Ocurrió un error'
}

export async function adminLogin(username, password) {
  const res = await fetch(`${API_BASE}/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ username, password }),
  })
  if (!res.ok) throw new Error(await parseError(res))
  return res.json()
}

export async function adminLogout() {
  const res = await fetch(`${API_BASE}/admin/logout`, {
    method: 'POST',
    credentials: 'include',
  })
  if (!res.ok) throw new Error(await parseError(res))
  return res.json()
}

export async function getAdminSession() {
  const res = await fetch(`${API_BASE}/admin/session`, {
    credentials: 'include',
  })
  if (!res.ok) return null
  const data = await res.json().catch(() => ({}))
  return data.ok ? data : null
}

export async function getAdminMetrics() {
  const res = await fetch(`${API_BASE}/admin/metrics`, {
    credentials: 'include',
  })
  if (!res.ok) throw new Error(await parseError(res))
  return res.json()
}

export async function getAdminLeads(filters = {}) {
  const params = new URLSearchParams()
  if (filters.estado) params.set('estado', filters.estado)
  if (filters.zona) params.set('zona', filters.zona)
  const query = params.toString()
  const res = await fetch(`${API_BASE}/admin/leads${query ? `?${query}` : ''}`, {
    credentials: 'include',
  })
  if (!res.ok) throw new Error(await parseError(res))
  return res.json()
}

export async function updateAdminLeadEstado(id, estado) {
  const res = await fetch(`${API_BASE}/admin/leads/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ estado }),
  })
  if (!res.ok) throw new Error(await parseError(res))
  return res.json()
}

export async function deleteAllAdminLeads() {
  const res = await fetch(`${API_BASE}/admin/leads`, {
    method: 'DELETE',
    credentials: 'include',
  })
  if (!res.ok) throw new Error(await parseError(res))
  return res.json()
}

export async function getAdminResources() {
  const res = await fetch(`${API_BASE}/admin/resources`, {
    credentials: 'include',
  })
  if (!res.ok) throw new Error(await parseError(res))
  return res.json()
}

export async function saveAdminResource(bucketKey, payload) {
  const res = await fetch(`${API_BASE}/admin/resources`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ bucket_key: bucketKey, ...payload }),
  })
  if (!res.ok) throw new Error(await parseError(res))
  return res.json()
}

export async function getDynamicResources(landingSlug) {
  const res = await fetch(`${API_BASE}/admin/resources/landing/${landingSlug}`, {
    credentials: 'include',
  })
  if (!res.ok) throw new Error(await parseError(res))
  return res.json()
}

export async function updateDynamicResource(resourceId, payload) {
  const res = await fetch(`${API_BASE}/admin/resources/resource/${resourceId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(await parseError(res))
  return res.json()
}

export async function updateResourceVariation(variationId, payload) {
  const res = await fetch(`${API_BASE}/admin/resources/variation/${variationId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(await parseError(res))
  return res.json()
}

export async function createResourceVariation(resourceId, payload) {
  const res = await fetch(`${API_BASE}/admin/resources/resource/${resourceId}/variation`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(await parseError(res))
  return res.json()
}

export async function getLandingCierres(landingSlug) {
  const res = await fetch(`${API_BASE}/admin/resources/landing/${landingSlug}/cierres`, {
    credentials: 'include',
  })
  if (!res.ok) throw new Error(await parseError(res))
  return res.json()
}

export async function updateLandingCierres(landingSlug, cierres) {
  const res = await fetch(`${API_BASE}/admin/resources/landing/${landingSlug}/cierres`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ cierres }),
  })
  if (!res.ok) throw new Error(await parseError(res))
  return res.json()
}
