const API_BASE = import.meta.env.VITE_API_URL || '/api'

/** URL del PDF que le toca a esa clave. El backend valida el código. */
export function resourceFileUrl(code) {
  const params = new URLSearchParams({ code: (code || '').trim() })
  return `${API_BASE}/leads/resource/file?${params}`
}

export async function fetchResourceByCode(code) {
  const params = new URLSearchParams({ code: code.trim() })
  const res = await fetch(`${API_BASE}/leads/resource?${params}`)
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data.detail || 'Código inválido o inexistente')
  }
  return data
}
