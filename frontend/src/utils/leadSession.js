export const LEAD_STORAGE_KEY = 'quiz_funnel_lead'

export function readStoredLead() {
  try {
    const stored = sessionStorage.getItem(LEAD_STORAGE_KEY)
    return stored ? JSON.parse(stored) : null
  } catch {
    return null
  }
}

export function saveLead(data) {
  sessionStorage.setItem(LEAD_STORAGE_KEY, JSON.stringify(data))
}

export function isValidLead(data) {
  if (!data || typeof data !== 'object') return false

  return Boolean(
    data.name?.trim()
    && data.email?.trim()
    && data.phone?.trim()
    && data.access_code?.trim(),
  )
}

export function clearLead() {
  sessionStorage.removeItem(LEAD_STORAGE_KEY)
}
