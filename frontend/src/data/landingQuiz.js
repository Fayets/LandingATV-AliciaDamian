/**
 * Quiz P1–P5 con branching — sincronizado con backend/src/calificacion.py
 */

export const ESTADO_OPTIONS = [
  'pendiente',
  'contactado',
  'agendado',
  'cerrado',
  'descartado',
]

export const ZONA_FILTER_OPTIONS = [
  { value: '', label: 'Todas las zonas' },
]

export const QUIZ_STEPS = [
  {
    id: 'step_1_nivel',
    title: '¿Cuál es tu nivel actual corriendo?',
    type: 'single',
    required: true,
    options: [
      { value: 1, label: 'Nunca he corrido, quiero empezar desde cero' },
      { value: 2, label: 'He salido a correr alguna vez suelta, sin ningún hábito' },
      { value: 3, label: 'Corrí hace tiempo, lo dejé, y quiero retomar desde cero' },
      { value: 4, label: 'Hago otro deporte pero nunca he corrido en serio' },
      { value: 5, label: 'Corro de forma irregular, sin plan, entre 5 y 10km' },
      { value: 6, label: 'Corro con cierta constancia pero no supero los 10km' },
      { value: 7, label: 'Corro 5-10km y quiero preparar mi primera carrera (5K o 10K)' },
      { value: 8, label: 'Corro 5-10km pero siento que llevo tiempo sin mejorar mis tiempos' },
      { value: 9, label: 'Corro más de 10km de forma habitual' },
      { value: 10, label: 'Ya he corrido carreras de 10K o media maratón y quiero mejorar mi marca' },
      { value: 11, label: 'Estoy entrenando para una maratón u otra distancia larga' },
      { value: 12, label: 'Corro con regularidad pero nunca he seguido un plan estructurado' },
      { value: 13, label: 'Soy corredora federada / de rendimiento, busco entrenamiento de alto nivel competitivo', qualification: 'out_of_avatar' },
      { value: 14, label: 'Tengo una lesión activa diagnosticada que no puede tratarse con entrenamiento', qualification: 'out_of_avatar' },
    ],
  },
  {
    id: 'step_2_objetivo',
    title: '¿Cuál es tu objetivo principal ahora mismo?',
    type: 'single',
    required: true,
    options: [
      { value: 1, label: 'Disfrutar corriendo sin agobios ni ansiedad' },
      { value: 2, label: 'Prepararme para una carrera concreta (5K, 10K, media...)' },
      { value: 3, label: 'Salir del estancamiento y progresar' },
    ],
  },
  {
    id: 'step_3a_freno_categoria',
    title: '¿Qué es lo que más te frena hoy?',
    type: 'single',
    required: true,
    options: [
      { value: 'fisico', label: 'Físico / técnica' },
      { value: 'mentalidad', label: 'Mentalidad / constancia' },
      { value: 'estructura', label: 'Estructura / plan' },
    ],
  },
  {
    id: 'step_3b_freno_especifico',
    title: 'Cuéntame más específicamente...',
    type: 'single',
    required: true,
    conditional: 'step_3a_freno_categoria',
    optionsByCategory: {
      fisico: [
        { value: 1, label: 'Me lesiono/tengo molestias constantemente', type: 'flag' },
        { value: 2, label: 'Tengo dudas sobre mi técnica de carrera (pisada, postura)', type: 'flag' },
        { value: 3, label: 'Me cuesta gestionar la respiración o las pulsaciones', type: 'flag' },
        { value: 4, label: 'Tengo dolor muscular o articular después de correr', type: 'flag' },
        { value: 5, label: 'No tengo ninguna molestia, es solo falta de forma física', type: 'flag' },
        { value: 6, label: 'Tengo una lesión activa diagnosticada por un médico ahora mismo', type: 'hard_disqualifier' },
      ],
      mentalidad: [
        { value: 1, label: 'Empiezo y abandono a las pocas semanas', type: 'flag' },
        { value: 2, label: 'Me comparo con otras corredoras y me desanimo', type: 'flag' },
        { value: 3, label: 'No encuentro motivación para salir a entrenar', type: 'flag' },
        { value: 4, label: 'Siento ansiedad o me exijo demasiado al entrenar', type: 'flag' },
        { value: 5, label: 'Tengo poco tiempo real en mi día a día', type: 'flag' },
        { value: 6, label: 'Tengo menos de 2 días a la semana para entrenar', type: 'flag' },
        { value: 7, label: 'No creo que el running sea para mí, no tengo interés real', type: 'hard_disqualifier' },
      ],
      estructura: [
        { value: 1, label: 'No sé cuántos días entrenar ni cómo progresar', type: 'flag' },
        { value: 2, label: 'Sigo rutinas de internet sin personalizar', type: 'flag' },
        { value: 3, label: 'No sé cómo combinar fuerza con running', type: 'flag' },
        { value: 4, label: 'No tengo forma de medir si lo estoy haciendo bien', type: 'flag' },
        { value: 5, label: 'Entreno sin plan, según me apetece cada día', type: 'flag' },
        { value: 6, label: 'Ya tengo entrenador/a y estoy contenta', type: 'hard_disqualifier' },
        { value: 7, label: 'Sigo un plan genérico creado por IA y me va bien', type: 'hard_disqualifier' },
      ],
    },
  },
  {
    id: 'step_4_acompanamiento',
    title: 'Cuando tengas tu diagnóstico, ¿qué te gustaría hacer con él?',
    type: 'single',
    required: true,
    options: [
      { value: 1, label: 'Prefiero aplicarlo por mi cuenta, sin acompañamiento', qualification: 'hard_disqualifier' },
      { value: 2, label: 'Todavía no lo sé, quiero verlo primero', qualification: 'flag' },
      { value: 3, label: 'Me gustaría que alguien me guíe para aplicarlo bien', qualification: 'qualified' },
      { value: 4, label: 'Busco justo esto: un acompañamiento que me lleve de la mano', qualification: 'qualified' },
    ],
  },
  {
    id: 'step_5_inversion',
    title: 'Si encontraras el programa perfecto, ¿cuánto estarías dispuesta a invertir?',
    type: 'single',
    required: true,
    options: [
      { value: 1, label: '€0-€250', qualification: 'hard_disqualifier' },
      { value: 2, label: '€250-€500', qualification: 'hard_disqualifier' },
      { value: 3, label: '€500-€1000', qualification: 'flag' },
      { value: 4, label: '€1000-€2000', qualification: 'qualified' },
      { value: 5, label: '€2000+', qualification: 'qualified' },
    ],
  },
]

export const QUIZ_QUESTION_COUNT = QUIZ_STEPS.length

export const INITIAL_ANSWERS = Object.fromEntries(
  QUIZ_STEPS.map((step) => [step.id, null]),
)

export const QUIZ_FIELD_LABELS = Object.fromEntries(
  QUIZ_STEPS.map((step) => [step.id, step.title]),
)

/** Compatibilidad con dashboard y componentes legacy */
export const QUIZ_QUESTIONS = QUIZ_STEPS.map((step) => ({
  id: step.id,
  type: 'options',
  question: step.title,
  sub: null,
  placeholder: null,
  opts: getStepOptions(step, {}),
}))

export function getStepOptions(step, answers = {}) {
  if (step.optionsByCategory) {
    const category = answers[step.conditional]
    return step.optionsByCategory[category] || []
  }
  return step.options || []
}

export function isOutOfAvatar(step1Value) {
  const value = Number(step1Value)
  return value >= 13
}

export function getQuizAnswerLabel(stepId, value, answers = {}) {
  if (value == null || value === '') return null
  const step = QUIZ_STEPS.find((item) => item.id === stepId)
  if (!step) return String(value)
  const options = getStepOptions(step, answers)
  const match = options.find((opt) => opt.value === value)
  return match?.label || String(value)
}

export function matchesZonaFilter() {
  return true
}

export function buildLeadQuizPayload(answers) {
  return {
    quiz_answers: answers,
  }
}

export function buildQuizUpdatePayload(answers) {
  return buildLeadQuizPayload(answers)
}

// Compatibilidad con código legacy del template ATV
export const BOTTLENECK_AREAS = []
export const BOTTLENECK_SUB_OPTS = {}
export const AREA_TO_ANSWER_KEY = {}
export const REVENUE_OPTIONS = []
export const REVENUE_QUALIFIED = []
export const AVATAR_OPTIONS = []
export const AVATAR_QUALIFIED = []

export function isBottleneckValid() {
  return false
}
