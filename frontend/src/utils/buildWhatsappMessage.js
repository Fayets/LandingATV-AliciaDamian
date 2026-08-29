import { BRAND } from '../data/landingContent'
import { getQuizAnswerLabel, QUIZ_STEPS } from '../data/landingQuiz'

const WA_NUMBER = (import.meta.env.VITE_WA_NUMBER || BRAND.whatsappNumber || '').replace(/\D/g, '')
const ZWSP = '\u200B'

/** Sin número configurado, wa.me lleva a una página genérica de WhatsApp. */
export const hasWhatsappNumber = Boolean(WA_NUMBER.replace(/\D/g, ''))

function urlWithoutPreview(url) {
  return url.replace(/([./:?=&])/g, `$1${ZWSP}`)
}

const FRENO_HOOKS = {
  fisico: {
    1: 'te lesionás o tenés molestias seguido cuando corrés',
    2: 'tenés dudas con la técnica (pisada, postura)',
    3: 'te cuesta gestionar respiración o pulsaciones',
    4: 'te quedan dolores después de salir a correr',
    5: 'no tenés molestias fuertes, pero sentís que te falta forma física',
  },
  mentalidad: {
    1: 'arrancás y a las pocas semanas se te complica sostener',
    2: 'te comparás con otras corredoras y eso te desgasta',
    3: 'te cuesta encontrar motivación para salir a entrenar',
    4: 'te exigís mucho o te genera ansiedad entrenar',
    5: 'tenés poco tiempo real en el día a día',
    6: 'hoy tenés muy pocos días a la semana para entrenar',
  },
  estructura: {
    1: 'no tenés claro cuántos días entrenar ni cómo progresar',
    2: 'seguís rutinas de internet sin adaptarlas a vos',
    3: 'no sabés cómo combinar fuerza con running',
    4: 'no tenés forma clara de medir si lo estás haciendo bien',
    5: 'entrenás sin plan, según te apetece cada día',
  },
}

const FRENO_FALLBACK = {
  fisico: 'lo tuyo está más en lo físico — técnica, molestias o confianza en el cuerpo',
  mentalidad: 'tu freno principal está en la cabeza: motivación, constancia o presión al entrenar',
  estructura: 'venís corriendo sin estructura y eso te frena más que las ganas',
}

const OBJETIVO_HINTS = {
  1: 'querés disfrutar más corriendo, sin tanta presión',
  2: 'estás apuntando a una carrera concreta',
  3: 'sentís que estás estancada y querés progresar de verdad',
}

function field(value, fallback = '') {
  const text = typeof value === 'string' ? value.trim() : value
  return text || fallback
}

function getSiteBase() {
  const landing = import.meta.env.VITE_LANDING_URL || ''
  const fromLanding = landing.replace(/\/acceso\/?$/i, '').replace(/\/+$/, '')
  if (fromLanding) return fromLanding
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin.replace(/\/+$/, '')
  }
  return ''
}

export function getResourceLink(code = '') {
  const course = (import.meta.env.VITE_COURSE_URL || '').trim()
  if (course) return course

  const base = getSiteBase()
  const path = base ? `${base}/recurso` : '/recurso'
  const normalizedCode = field(code)
  if (!normalizedCode) return path
  return `${path}?code=${encodeURIComponent(normalizedCode)}`
}

function buildSituationLine(respuestas = {}) {
  const categoria = respuestas.step_3a_freno_categoria
  const especifico = Number(respuestas.step_3b_freno_especifico)
  const objetivo = Number(respuestas.step_2_objetivo)

  let line = ''

  if (categoria && FRENO_HOOKS[categoria]?.[especifico]) {
    line = `Vi que ${FRENO_HOOKS[categoria][especifico]}`
  } else if (categoria && FRENO_FALLBACK[categoria]) {
    line = `Vi que ${FRENO_FALLBACK[categoria]}`
  } else if (respuestas.step_1_nivel != null && Number(respuestas.step_1_nivel) <= 12) {
    line = 'Vi tus respuestas del diagnóstico y creo que hay varias cosas con las que te puedo dar una mano'
  } else {
    line = 'Vi que completaste el diagnóstico y quiero entender un poco más tu situación'
  }

  if (OBJETIVO_HINTS[objetivo]) {
    line += `, y que ${OBJETIVO_HINTS[objetivo]}`
  }

  return `${line}.`
}

/** Etiqueta corta de cada pregunta para el mensaje de WhatsApp. */
const ETIQUETAS_QUIZ = {
  step_1_nivel: 'Nivel',
  step_2_objetivo: 'Objetivo',
  step_3a_freno_categoria: 'Lo que más me frena',
  step_3b_freno_especifico: 'En concreto',
  step_4_acompanamiento: 'Qué quiero hacer con el diagnóstico',
  step_5_inversion: 'Dispuesta a invertir',
}

/**
 * Mensaje que envía LA CORREDORA al abrir el chat desde /acceso/clave.
 * Va en primera persona y lleva las seis respuestas del cuestionario, para
 * que el setter tenga el contexto completo nada más abrir WhatsApp.
 */
export function buildLeadIntroText(lead = {}, respuestas = {}) {
  const nombre = field(lead?.name, '').split(' ')[0]
  const code = field(lead?.access_code)
  const coach = BRAND.firstName || 'Alicia'
  const saludo = nombre ? `¡Hola ${coach}! Soy ${nombre}.` : `¡Hola ${coach}!`

  const lineas = QUIZ_STEPS
    .map((step) => {
      const etiqueta = ETIQUETAS_QUIZ[step.id]
      const valor = getQuizAnswerLabel(step.id, respuestas[step.id], respuestas)
      return etiqueta && valor ? `• ${etiqueta}: ${valor}` : ''
    })
    .filter(Boolean)

  // Por bloques, para que WhatsApp los separe con línea en blanco
  return [
    `${saludo}\nAcabo de terminar el diagnóstico y vengo a por el mío.`,
    code ? `Mi clave: ${code}` : '',
    lineas.length ? ['Esto es lo que respondí:', ...lineas].join('\n') : '',
  ].filter(Boolean).join('\n\n')
}

export function buildWhatsappMessageText(lead, respuestas = {}) {
  const nombre = field(lead?.name, 'ahí').split(' ')[0]
  const code = field(lead?.access_code)
  const coach = BRAND.firstName || 'Alicia'
  const link = urlWithoutPreview(getResourceLink(code))
  const situacion = buildSituationLine(respuestas)

  return [
    `Buenas ${nombre}, ¿cómo andamos?`,
    '',
    `Por acá ${coach}. Te dejo el link de tu diagnóstico: ${link}`,
    code ? `Tu clave es ${code}.` : '',
    '',
    `${situacion} Contame un poco más así te doy una mano con lo que te va a servir del diagnóstico. Si querés también te puedo pasar recursos más exclusivos según tu caso.`,
    '',
    'Mandame un audio si querés, no me molesta.',
  ].filter(Boolean).join('\n')
}

export function buildWhatsappMessage(lead, respuestas = {}) {
  return encodeURIComponent(buildWhatsappMessageText(lead, respuestas))
}

export function buildWhatsappUrl(data = {}) {
  const respuestas = { ...data, ...(data.quiz_answers || {}) }
  const msg = encodeURIComponent(buildLeadIntroText(data, respuestas))
  return `https://wa.me/${WA_NUMBER}?text=${msg}`
}

/** Abre chat con el lead (teléfono del lead) y mensaje personalizado para el setter. */
export function buildLeadWhatsappUrl(lead = {}) {
  const digits = (lead.phone || '').replace(/\D/g, '')
  if (!digits) return '#'

  const respuestas = { ...lead, ...(lead.quiz_answers || {}) }
  const msg = buildWhatsappMessage(lead, respuestas)
  return `https://wa.me/${digits}?text=${msg}`
}
