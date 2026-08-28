import { useEffect, useMemo, useRef, useState } from 'react'
import { submitLead, sendCapiEvent } from '../api/leads'
import PhoneInput from '../components/PhoneInput'
import TrackBackground from '../components/TrackBackground'
import { useCountdown, useHold } from '../hooks/useCountdown'
import { pad2 } from '../utils/deadline'
import {
  buildLeadQuizPayload,
  getStepOptions,
  INITIAL_ANSWERS,
  isOutOfAvatar,
  QUIZ_QUESTION_COUNT,
  QUIZ_STEPS,
} from '../data/landingQuiz'
import {
  BRAND,
  DELIVERABLE,
  FOMO,
  HERO,
  LOADING_COPY,
  LOADING_STEPS,
  PROOF_AVATARS,
  PROOF_STATS,
  QUIZ_COPY,
} from '../data/landingContent'
import { esCalificado } from '../utils/calificacion'
import styles from './LandingPage.module.css'

const LOADING_STEP_MS = 900
const OPTION_ADVANCE_MS = 420

/** Resalta en amarillo el texto marcado entre ~~ en el copy. */
function Highlighted({ text }) {
  return text.split('~~').map((chunk, i) => (
    i % 2 === 1
      ? <mark key={chunk + i} className={styles.mark}>{chunk}</mark>
      : <span key={chunk + i}>{chunk}</span>
  ))
}

function Countdown({ value }) {
  if (!value) return null
  const cells = value.days > 0
    ? [[value.days, 'd'], [value.hours, 'h'], [value.minutes, 'm']]
    : [[value.hours, 'h'], [value.minutes, 'm'], [value.seconds, 's']]

  return (
    <span className={styles.clock}>
      {cells.map(([n, unit]) => (
        <span key={unit} className={styles.clockCell}>
          <b>{pad2(n)}</b>
          <i>{unit}</i>
        </span>
      ))}
    </span>
  )
}

export default function LandingPage({ onComplete }) {
  const [phase, setPhase] = useState('optin')
  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState(INITIAL_ANSWERS)
  const [form, setForm] = useState({ name: '', email: '', phone: '', ig: '' })
  const [acceptedComms, setAcceptedComms] = useState(false)
  const [gdprError, setGdprError] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loadingStep, setLoadingStep] = useState(0)
  const [error, setError] = useState(null)
  const [cuposRestantes, setCuposRestantes] = useState(FOMO.cupos.start)
  const [advancing, setAdvancing] = useState(false)
  const [toast, setToast] = useState(null)
  const [showStickyCta, setShowStickyCta] = useState(false)
  const advanceTimerRef = useRef(null)
  const formRef = useRef(null)

  const countdown = useCountdown(FOMO.deadline)
  const hold = useHold(QUIZ_COPY.holdMinutes, phase === 'quiz')

  const cuposPct = useMemo(() => {
    const taken = FOMO.cupos.total - cuposRestantes
    return Math.min(100, Math.round((taken / FOMO.cupos.total) * 100))
  }, [cuposRestantes])

  /* Plazas que se van llenando */
  useEffect(() => {
    if (!FOMO.cupos.enabled) return undefined
    const interval = setInterval(() => {
      setCuposRestantes((prev) => (prev <= FOMO.cupos.floor ? prev : prev - 1))
    }, FOMO.cupos.tickMs)
    return () => clearInterval(interval)
  }, [])

  /* Pasos del loader */
  useEffect(() => {
    if (!loading) return undefined
    setLoadingStep(0)
    const interval = setInterval(() => {
      setLoadingStep((prev) => (prev >= LOADING_STEPS.length - 1 ? prev : prev + 1))
    }, LOADING_STEP_MS)
    return () => clearInterval(interval)
  }, [loading])

  /* Avisos de actividad reciente (apagados por defecto) */
  useEffect(() => {
    if (!FOMO.activity.enabled || phase !== 'optin') return undefined
    let index = 0
    let cycle
    const show = () => {
      setToast(FOMO.activity.items[index % FOMO.activity.items.length])
      index += 1
      setTimeout(() => setToast(null), 6000)
    }
    const first = setTimeout(() => {
      show()
      cycle = setInterval(show, FOMO.activity.intervalMs)
    }, FOMO.activity.firstDelayMs)
    return () => {
      clearTimeout(first)
      if (cycle) clearInterval(cycle)
    }
  }, [phase])

  /* CTA fijo en móvil cuando el formulario sale de pantalla */
  useEffect(() => {
    if (phase !== 'optin') return undefined
    const node = formRef.current
    if (!node || typeof IntersectionObserver === 'undefined') return undefined
    const observer = new IntersectionObserver(
      ([entry]) => {
        // Solo cuando el formulario ya quedó ARRIBA del viewport: si aún no
        // se llegó a él, mostrar el CTA fijo sería redundante.
        const passed = entry.boundingClientRect.top < 0
        setShowStickyCta(!entry.isIntersecting && passed)
      },
      { threshold: 0.25 },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [phase])

  useEffect(() => () => {
    if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current)
  }, [])

  const step = QUIZ_STEPS[current]
  const stepOptions = getStepOptions(step, answers)
  const progress = Math.round(((current + 1) / QUIZ_QUESTION_COUNT) * 100)

  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    setTimeout(() => formRef.current?.querySelector('input')?.focus(), 600)
  }

  const submitQuiz = async (finalAnswers) => {
    setLoading(true)
    setError(null)
    try {
      const { quiz_answers: quizAnswers } = buildLeadQuizPayload(finalAnswers)
      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        ig: form.ig.trim(),
        quiz_answers: quizAnswers,
      }

      const calificado = esCalificado({ quiz_answers: quizAnswers })
      const res = await submitLead(payload)

      if (!res?.id) {
        throw new Error('No se pudo crear tu registro. Prueba de nuevo.')
      }

      if (calificado) {
        const leadEventId = `lead_${res.id}_${Date.now()}`
        const registroEventId = `registroCompletado_${res.id}_${Date.now()}`

        if (typeof window.fbq !== 'undefined') {
          window.fbq('track', 'Lead', { content_name: 'diagnostico_corredora' }, { eventID: leadEventId })
          window.fbq('trackCustom', 'registroCompletado', { content_name: 'diagnostico_corredora' }, { eventID: registroEventId })
        }

        await sendCapiEvent(res.id, {
          event_name: 'Lead',
          event_id: leadEventId,
          email: form.email,
          phone: form.phone,
        })

        await sendCapiEvent(res.id, {
          event_name: 'registroCompletado',
          event_id: registroEventId,
          email: form.email,
          phone: form.phone,
        })
      }

      onComplete({
        ...payload,
        id: res.id,
        access_code: res.access_code,
        calificado,
      })
    } catch (e) {
      setError(e.message || 'Ha ocurrido un error. Inténtalo de nuevo.')
      setLoading(false)
      setAdvancing(false)
    }
  }

  const advanceQuiz = (stepIndex, updatedAnswers, forceSubmit = false) => {
    if (advanceTimerRef.current) {
      clearTimeout(advanceTimerRef.current)
      advanceTimerRef.current = null
    }

    setError(null)
    setAnswers(updatedAnswers)

    if (forceSubmit || stepIndex >= QUIZ_STEPS.length - 1) {
      setAdvancing(true)
      submitQuiz(updatedAnswers)
      return
    }

    setAdvancing(true)
    advanceTimerRef.current = setTimeout(() => {
      setCurrent(stepIndex + 1)
      setAdvancing(false)
      advanceTimerRef.current = null
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }, OPTION_ADVANCE_MS)
  }

  const canStartQuiz = (
    form.name.trim()
    && form.email.trim()
    && form.phone.trim()
    && form.ig.trim()
    && acceptedComms
  )

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleOption = (opt) => {
    if (advancing || loading) return

    const updatedAnswers = { ...answers, [step.id]: opt.value }

    if (step.id === 'step_3a_freno_categoria') {
      updatedAnswers.step_3b_freno_especifico = null
    }

    if (step.id === 'step_1_nivel' && (opt.qualification === 'out_of_avatar' || isOutOfAvatar(opt.value))) {
      advanceQuiz(current, updatedAnswers, true)
      return
    }

    advanceQuiz(current, updatedAnswers)
  }

  const handleStartQuiz = () => {
    if (!acceptedComms) {
      setGdprError(true)
      return
    }
    if (!canStartQuiz) return
    setGdprError(false)
    setError(null)
    setAnswers(INITIAL_ANSWERS)
    setCurrent(0)
    setPhase('quiz')
    window.scrollTo({ top: 0 })
  }

  const handleBack = () => {
    if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current)
    setAdvancing(false)
    if (current === 0) {
      setPhase('optin')
      return
    }
    setCurrent((prev) => prev - 1)
  }

  /* ── Loader ────────────────────────────────────────────────────── */
  if (loading) {
    return (
      <div className={styles.loadingWrap}>
        <TrackBackground />
        <div className={styles.loadingContent}>
          <div className={styles.loaderRing} />
          <h2 className={styles.loadingTitle}>{LOADING_COPY.title}</h2>
          <p className={styles.loadingSub}>{LOADING_COPY.sub}</p>
          <ul className={styles.loadingSteps}>
            {LOADING_STEPS.map((label, index) => (
              <li
                key={label}
                className={[
                  styles.lstep,
                  index < loadingStep ? styles.lstepDone : '',
                  index === loadingStep ? styles.lstepActive : '',
                ].filter(Boolean).join(' ')}
              >
                <span className={styles.lstepDot} />
                {label}
              </li>
            ))}
          </ul>
        </div>
      </div>
    )
  }

  /* ── Cuestionario ──────────────────────────────────────────────── */
  if (phase === 'quiz') {
    return (
      <div className={styles.quizPage}>
        <TrackBackground />

        <div className={styles.testTopbar}>
          <div className={styles.testTopInner}>
            <div className={styles.testMeta}>
              <span className={styles.testKm}>
                KM {pad2(current + 1)}
                <i>/ {pad2(QUIZ_QUESTION_COUNT)}</i>
              </span>
              {!hold.expired ? (
                <span className={styles.hold}>
                  {QUIZ_COPY.holdLabel}
                  {' '}
                  <b>{pad2(hold.minutes)}:{pad2(hold.seconds)}</b>
                </span>
              ) : (
                <span className={styles.holdExpired}>{QUIZ_COPY.holdExpired}</span>
              )}
            </div>
            <div className={styles.testProgress}>
              <div className={styles.testFill} style={{ width: `${progress}%` }} />
            </div>
          </div>
        </div>

        <div className={styles.testMain}>
          <div className={styles.testBody}>
            <span className={styles.testEyebrow}>{QUIZ_COPY.eyebrow}</span>
            <h2 className={styles.testQ}>{step.title}</h2>

            <div className={styles.options}>
              {stepOptions.map((opt, i) => (
                <button
                  key={opt.value}
                  type="button"
                  className={`${styles.opt} ${answers[step.id] === opt.value ? styles.optSelected : ''}`}
                  onClick={() => handleOption(opt)}
                  disabled={advancing || loading || stepOptions.length === 0}
                >
                  <span className={styles.optKey}>{String.fromCharCode(65 + i)}</span>
                  <span className={styles.optLabel}>{opt.label}</span>
                </button>
              ))}
            </div>

            {step.id === 'step_3b_freno_especifico' && stepOptions.length === 0 && (
              <p className={styles.openHint}>Vuelve atrás y elige qué te frena hoy.</p>
            )}

            {error && <p className={styles.error}>{error}</p>}
          </div>
        </div>

        <div className={styles.testBottombar}>
          <button
            type="button"
            className={styles.backBtn}
            onClick={handleBack}
            disabled={advancing || loading}
          >
            ← {QUIZ_COPY.back}
          </button>
          <span className={styles.testFine}>
            {FOMO.cupos.enabled && `Quedan ${cuposRestantes} ${FOMO.cupos.label}`}
          </span>
        </div>
      </div>
    )
  }

  /* ── Landing ───────────────────────────────────────────────────── */
  return (
    <div className={styles.page}>
      {/* Barra de urgencia */}
      <div className={styles.urgencyBar}>
        <div className={styles.urgencyInner}>
          <a className={styles.brand} href={BRAND.instagramUrl} target="_blank" rel="noreferrer">
            <img className={styles.brandMark} src={BRAND.avatar} alt={BRAND.coach} />
            <span className={styles.brandText}>
              <b>{BRAND.coach}</b>
              <i>{BRAND.credential}</i>
            </span>
          </a>

          <span className={styles.urgencyMid}>
          <span className={styles.urgencyLeft}>
            <span className={styles.liveDot} />
            <span className={styles.urgFull}>
              {FOMO.deadline.enabled && countdown && !countdown.expired
                ? FOMO.deadline.label
                : FOMO.deadline.expiredLabel}
            </span>
            <span className={styles.urgShort}>Cierra en</span>
          </span>
          {countdown && !countdown.expired && <Countdown value={countdown} />}
          </span>
          {FOMO.cupos.enabled && (
            <span className={styles.urgencyRight}>
              <b>{cuposRestantes}</b> / {FOMO.cupos.total} plazas
            </span>
          )}
        </div>
      </div>

      <div className={styles.heroZone}>
        <TrackBackground />

      {/* HERO */}
      <section className={styles.hero}>
        <div className={styles.heroGrid}>
          <div className={styles.heroHead}>
            <h1 className={styles.headline}>
              <Highlighted text={HERO.title} />
            </h1>
            <p className={styles.sub}>{HERO.subtitle}</p>
          </div>

          <div className={styles.previews}>
            <span className={styles.previewsLabel}>{DELIVERABLE.label}</span>
            <ul className={styles.previewList}>
              {DELIVERABLE.pages.map((page, i) => (
                <li key={page.title} className={styles[`fan${i}`]}>
                  <img
                    src={page.image}
                    alt={page.title}
                    loading={i === 1 ? 'eager' : 'lazy'}
                    width="880"
                    height="1245"
                  />
                </li>
              ))}
            </ul>
          </div>

          {/* Formulario */}
          <div className={styles.formCard} ref={formRef}>
            <div className={styles.formTop}>
              <h2 className={styles.formTitle}>{HERO.formTitle}</h2>
            </div>

            {FOMO.cupos.enabled && (
              <div className={styles.cupos}>
                <div className={styles.cuposHead}>
                  <span>
                    <b>{cuposRestantes}</b> {FOMO.cupos.label}
                  </span>
                  <span className={styles.cuposPct}>{cuposPct}% ocupadas</span>
                </div>
                <div className={styles.cuposBar}>
                  <div className={styles.cuposFill} style={{ width: `${cuposPct}%` }} />
                </div>
              </div>
            )}

            <div className={styles.formBody}>
              <input
                className={styles.input}
                type="text"
                name="name"
                placeholder="Tu nombre completo"
                value={form.name}
                onChange={handleChange}
              />
              <input
                className={styles.input}
                type="email"
                name="email"
                placeholder="Tu email"
                value={form.email}
                onChange={handleChange}
              />
              <PhoneInput
                value={form.phone}
                onChange={(phone) => setForm((prev) => ({ ...prev, phone }))}
                placeholder="Tu número de WhatsApp"
              />
              <input
                className={styles.input}
                type="text"
                name="ig"
                placeholder="Tu Instagram (@usuaria)"
                value={form.ig}
                onChange={handleChange}
              />

              <div className={styles.checkboxWrap}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={acceptedComms}
                    onChange={(e) => {
                      setAcceptedComms(e.target.checked)
                      if (e.target.checked) setGdprError(false)
                    }}
                  />
                  <span className={styles.cbBox} />
                  <span className={styles.cbTxt}>{HERO.gdprText(BRAND.coach)}</span>
                </label>
                {gdprError && <p className={styles.cbError}>{HERO.gdprError}</p>}
              </div>
            </div>

            {error && <p className={styles.error}>{error}</p>}

            <button
              type="button"
              className={styles.cta}
              onClick={handleStartQuiz}
              disabled={!canStartQuiz}
            >
              {HERO.formCta}
              <i className={styles.ctaArrow}>→</i>
            </button>
            <p className={styles.ctaNote}>{HERO.formFine}</p>
          </div>

          <ul className={styles.statRow}>
            {PROOF_STATS.map((stat) => (
              <li key={stat.label}>
                <b>{stat.value}</b>
                <span>{stat.label}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
      </div>

      {/* CTA fijo en móvil */}
      <div className={`${styles.stickyCta} ${showStickyCta ? styles.stickyOn : ''}`}>
        <div className={styles.stickyInfo}>
          <b>{cuposRestantes} plazas</b>
          {countdown && !countdown.expired && (
            <i>cierra en {pad2(countdown.days > 0 ? countdown.days : countdown.hours)}{countdown.days > 0 ? 'd' : 'h'} {pad2(countdown.days > 0 ? countdown.hours : countdown.minutes)}{countdown.days > 0 ? 'h' : 'm'}</i>
          )}
        </div>
        <button type="button" onClick={scrollToForm}>Reservar mi plaza</button>
      </div>

      {/* Actividad reciente */}
      {toast && (
        <div className={styles.toast} role="status">
          <span className={styles.toastDot} />
          <p>
            <b>{toast.name}</b> de {toast.city} reservó su plaza
            <i>{toast.ago}</i>
          </p>
        </div>
      )}
    </div>
  )
}
