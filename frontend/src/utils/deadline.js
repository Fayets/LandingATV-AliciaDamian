/**
 * Cierre de convocatoria. Soporta un cierre fijo (una fecha) o
 * recurrente semanal (ej: todos los domingos a las 23:59).
 */
export function resolveDeadline(config, from = new Date()) {
  if (!config?.enabled) return null

  if (config.mode === 'fixed') {
    if (!config.fixedDate) return null
    const fixed = new Date(config.fixedDate)
    return Number.isNaN(fixed.getTime()) ? null : fixed
  }

  const target = new Date(from)
  target.setHours(config.hour ?? 23, config.minute ?? 59, 0, 0)

  const weekday = config.weekday ?? 0
  let delta = (weekday - target.getDay() + 7) % 7
  if (delta === 0 && target <= from) delta = 7
  target.setDate(target.getDate() + delta)

  return target
}

export function splitRemaining(ms) {
  const safe = Math.max(0, ms)
  const totalSeconds = Math.floor(safe / 1000)
  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
    expired: safe <= 0,
  }
}

export const pad2 = (n) => String(n).padStart(2, '0')
