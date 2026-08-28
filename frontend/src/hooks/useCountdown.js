import { useEffect, useMemo, useState } from 'react'
import { resolveDeadline, splitRemaining } from '../utils/deadline'

/** Cuenta atrás viva hacia el cierre de convocatoria. */
export function useCountdown(config) {
  const deadline = useMemo(() => resolveDeadline(config), [config])
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (!deadline) return undefined
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [deadline])

  if (!deadline) return null
  return { ...splitRemaining(deadline.getTime() - now), deadline }
}

/**
 * Reserva de plaza durante el cuestionario. El contador arranca cuando
 * `active` pasa a true (al entrar al quiz), no al cargar la página.
 */
export function useHold(minutes, active = true) {
  const totalMs = minutes * 60000
  const [startedAt, setStartedAt] = useState(null)
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (!active) {
      setStartedAt(null)
      return undefined
    }
    setStartedAt(Date.now())
    setNow(Date.now())
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [active])

  if (!startedAt) return splitRemaining(totalMs)
  return splitRemaining(startedAt + totalMs - now)
}
