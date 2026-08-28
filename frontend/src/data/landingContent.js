/**
 * ─────────────────────────────────────────────────────────────────────
 *  TODO EL COPY Y LA URGENCIA DE LA LANDING VIVEN ACÁ.
 *  No hace falta tocar JSX ni CSS para cambiar textos, cupos o cierre.
 *
 *  [PLACEHOLDER] = reemplazar con dato real de Alicia antes de publicar.
 * ─────────────────────────────────────────────────────────────────────
 */

export const BRAND = {
  coach: 'Alicia Damián',
  firstName: 'Alicia',
  handle: '@adamiancoach14',
  instagramUrl: 'https://www.instagram.com/adamiancoach14/',
  followers: '41.500',
  credential: 'Entrenadora de running especializada en mujeres',
  promise: 'Mujeres +35 corriendo sus primeros 5, 10 y 21K disfrutando y sin sufrir',
  /** Corredoras acompañadas. Se usa en el hero y en las métricas: cambiala aquí y cambia en los dos sitios. */
  alumnas: '+347',
  /** Foto de perfil de Alicia (recorte cuadrado, /public). */
  avatar: '/alicia-avatar.jpg',
  /** Foto completa, por si se usa en algún bloque grande. */
  coachPhoto: '/alicia.jpg',
  /** WhatsApp de Alicia: código de país + número, sin + ni espacios. Ej: 34612345678 */
  whatsappNumber: '',
}

/**
 * ── URGENCIA ────────────────────────────────────────────────────────
 * Cada bloque se enciende/apaga con `enabled`.
 *
 * ⚠️ `activity` inventa registros recientes. Es la práctica habitual en
 *    funnels, pero es información falsa mostrada al usuario. En España
 *    entra en el terreno de publicidad engañosa (LGDCU art. 5/7).
 *    Viene APAGADO por defecto: enciendelo solo si asumís esa decisión.
 */
export const FOMO = {
  /** Cierre de convocatoria. mode: 'weekly' | 'fixed' */
  deadline: {
    enabled: true,
    mode: 'weekly',
    weekday: 0,        // 0 = domingo
    hour: 23,
    minute: 59,
    fixedDate: null,   // ISO string si mode === 'fixed'. Ej: '2026-09-01T23:59:00'
    label: 'La convocatoria de esta semana cierra en',
    expiredLabel: 'Última llamada — quedan horas',
  },

  /** Plazas. Bajan solas hasta `floor` para reflejar que se llenan. */
  cupos: {
    enabled: true,
    total: 50,
    start: 47,
    floor: 9,
    tickMs: 25000,
    label: 'plazas de esta semana',
  },

  /** Motivo real de la escasez. Sin esto, el contador es humo. */
  scarcityReason:
    'Cada diagnóstico lo revisa Alicia una por una. Por eso solo abre 50 plazas por semana.',

  /** Registros recientes en vivo. Ver aviso de arriba. */
  activity: {
    enabled: false,
    firstDelayMs: 14000,
    intervalMs: 26000,
    items: [
      // [PLACEHOLDER] Estos nombres son inventados.
      { name: 'Marta G.', city: 'Valencia', ago: 'hace 3 min' },
      { name: 'Cristina L.', city: 'Madrid', ago: 'hace 7 min' },
      { name: 'Nuria B.', city: 'Sevilla', ago: 'hace 12 min' },
      { name: 'Elena R.', city: 'Bilbao', ago: 'hace 18 min' },
    ],
  },
}

export const HERO = {
  /** El texto entre ~~ se resalta en amarillo. */
  title: 'CORRER MÁS ~~NO~~ TE ESTÁ HACIENDO MEJOR CORREDORA',
  /** Primera persona: habla Alicia. La cifra sale de BRAND.alumnas. */
  subtitle:
    `Con mi método FLUIR he ayudado a ${BRAND.alumnas} corredoras a dejar de sufrir y volver a disfrutar corriendo. Hoy te digo qué te está frenando a ti.`,
  formTitle: 'Reserva tu plaza',
  formSub: 'Rellena tus datos y empieza el diagnóstico',
  formCta: 'QUIERO MI DIAGNÓSTICO',
  formFine: '6 preguntas · 2 minutos · resultado inmediato',
  gdprText: (brand) =>
    `Acepto recibir comunicaciones de ${brand}. Puedo darme de baja cuando quiera.`,
  gdprError: 'Necesitas aceptar para continuar.',
}

/**
 * Caras del hero. Poné 4 fotos de alumnas en /public y listalas acá
 * (ej: ['/alumna-1.jpg', ...]). Con null se ven como círculos neutros.
 */
export const PROOF_AVATARS = [null, null, null, null]  // [PLACEHOLDER]

/** Métricas de prueba social del hero. */
export const PROOF_STATS = [
  { value: '41.500', label: 'corredoras la siguen' },          // real (Instagram)
  { value: '5·10·21K', label: 'las distancias que prepara' },   // real
  { value: BRAND.alumnas, label: 'corredoras acompañadas' },
]

/**
 * ── LO QUE SE LLEVA ─────────────────────────────────────────────────
 * Capturas reales del documento, dentro del hero. Para regenerarlas:
 *   pdftoppm -jpeg -r 150 backend/resources_pdf/Recurso_B_*.pdf pv
 * y guardar las páginas 1, 2 y 4 en /public con estos nombres.
 */
export const DELIVERABLE = {
  label: 'Completa el formulario y llévate esto',
  pages: [
    { image: '/preview-diagnostico.jpg', title: 'Tu diagnóstico' },
    { image: '/preview-plan.jpg', title: 'Tu semana, día a día' },
    { image: '/preview-seguimiento.jpg', title: 'Qué vigilar' },
    // Los títulos ya solo se usan como texto alternativo de cada imagen.
  ],
}

/** Lo que se lleva, con "precio" de cada pieza para justificar los 200 €. */
export const DELIVERABLES = [
  {
    km: '01',
    title: 'Tu diagnóstico honesto',
    text: 'Qué te frena de verdad — no lo que crees que te frena. Escrito para tu caso, no un PDF genérico.',
    worth: '90 €',
  },
  {
    km: '02',
    title: 'El giro que te falta',
    text: 'Por qué lo que llevas intentando meses no ha funcionado, y qué cambia a partir de ahora.',
    worth: '50 €',
  },
  {
    km: '03',
    title: 'Una semana de entrenamientos',
    text: 'Adaptada a tu nivel, a tus días reales y a tus molestias. Lista para empezar el lunes.',
    worth: '60 €',
  },
]

export const HOW_IT_WORKS = [
  { n: '1', title: 'Respondes 6 preguntas', text: 'Sobre ti, tu cuerpo y cómo entrenas hoy. Dos minutos.' },
  { n: '2', title: 'Recibes tu clave', text: 'Una clave única que identifica tu perfil dentro de la convocatoria.' },
  { n: '3', title: 'Te llega tu diagnóstico', text: 'Por WhatsApp, revisado uno a uno. En menos de 24 h.' },
]

/** Testimonios. Los rellenamos con capturas reales de Instagram. */
export const TESTIMONIALS = [
  {
    quote: '[Testimonio real de una alumna: qué le pasaba antes y qué consiguió.]', // [PLACEHOLDER]
    name: '[Nombre]',
    meta: '[edad] años · [ciudad]',
    result: '[10K en 58 min]',
  },
  {
    quote: '[Testimonio real de una alumna.]',
    name: '[Nombre]',
    meta: '[edad] años · [ciudad]',
    result: '[Primera media maratón]',
  },
  {
    quote: '[Testimonio real de una alumna.]',
    name: '[Nombre]',
    meta: '[edad] años · [ciudad]',
    result: '[6 meses sin lesiones]',
  },
]

export const QUALIFY = {
  forYou: {
    title: 'Esto es para ti si',
    items: [
      'Tienes entre 30 y 60 años y corres (o quieres empezar).',
      'Llevas meses estancada, con molestias o empezando y abandonando.',
      'Estás dispuesta a que alguien te diga la verdad sobre tu entrenamiento.',
    ],
  },
  notForYou: {
    title: 'No es para ti si',
    items: [
      'Eres corredora federada buscando alto rendimiento.',
      'Tienes una lesión activa que necesita médico, no entrenamiento.',
      'Solo quieres el PDF gratis y no piensas aplicar nada.',
    ],
  },
}

export const FAQ = [
  {
    q: '¿Es realmente gratis?',
    a: 'Sí. El diagnóstico y la semana de entrenamientos son gratis. Lo que no es ilimitado son las plazas: Alicia revisa cada uno personalmente.',
  },
  {
    q: '¿Quién es Alicia Damián?',
    a: 'Entrenadora de running especializada en mujeres. Acompaña a corredoras de +35 a correr sus primeros 5, 10 y 21K disfrutando y sin sufrir. La siguen 41.500 corredoras en Instagram (@adamiancoach14).',
  },
  {
    q: '¿Cuánto tarda?',
    a: 'El cuestionario son 6 preguntas, unos 2 minutos. El diagnóstico te llega por WhatsApp en menos de 24 h.',
  },
  {
    q: 'Hace años que no corro. ¿Sirve igual?',
    a: 'Sí. La primera pregunta es justo tu nivel: el diagnóstico se adapta desde cero absoluto hasta media maratón.',
  },
  {
    q: '¿Me vais a llenar de spam?',
    a: 'No. Recibes tu diagnóstico y las novedades que Alicia comparte. Te das de baja cuando quieras, en un clic.',
  },
]

export const LOADING_COPY = {
  title: 'Analizando tu perfil',
  sub: 'Cruzando tus respuestas con tu nivel y tus días de entreno',
}

export const LOADING_STEPS = [
  'Procesando tus respuestas',
  'Identificando tu patrón',
  'Construyendo tu diagnóstico',
  'Preparando tu semana de entrenamientos',
]

export const QUIZ_COPY = {
  eyebrow: 'Diagnóstico en curso',
  holdLabel: 'Tu plaza queda reservada',
  holdMinutes: 10,
  holdExpired: 'Tu reserva ha expirado — puedes seguir, pero la plaza ya no está garantizada.',
  back: 'Atrás',
}

export const ACCESS_COPY = {
  badge: 'Plaza confirmada',
  titleSuffix: 'tu plaza está dentro.',
  sub: 'Tu diagnóstico ya se está preparando. Para recibirlo, escríbenos por WhatsApp con tu clave — te lo enviamos en menos de 24 h.',
  codeLabel: 'Tu clave de acceso',
  dorsalLabel: 'Dorsal',
  copyBtn: 'Copiar clave',
  copiedBtn: 'Clave copiada',
  countdownPrefix: 'Te llevamos a WhatsApp en',
  waBtn: 'Ir a WhatsApp ahora',
  warning: 'Si cierras esta página sin escribir, tu plaza vuelve a la lista.',
}

export const RESOURCE_COPY = {
  badge: 'Acceso privado',
  title: 'Abre tu diagnóstico',
  sub: 'Introduce la clave que recibiste al terminar el cuestionario.',
  label: 'Tu clave de acceso',
  cta: 'Ver mi diagnóstico',
  loadingCta: 'Verificando…',
  emptyError: 'Introduce tu clave de acceso',
  deliveryLabel: 'Diagnóstico personalizado',
  deliveryTitleSuffix: ', aquí está el tuyo',
  deliveryFallbackTitle: 'Aquí está tu diagnóstico',
  documentLoading: 'Preparando tu diagnóstico…',
  documentError: 'No pudimos cargar el contenido. Probá de nuevo en un momento.',
}
