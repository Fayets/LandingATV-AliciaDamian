const APP_NAME = import.meta.env.VITE_APP_NAME || 'Quiz Funnel'

const PAGE_TITLES = {
  '/': `Diagnóstico para corredoras — ${APP_NAME}`,
  '/acceso': `Diagnóstico para corredoras — ${APP_NAME}`,
  '/acceso/clave': `Tu plaza está dentro — ${APP_NAME}`,
  '/recurso': `Tu diagnóstico — ${APP_NAME}`,
  '/login': `${APP_NAME} — Login`,
  '/dashboard': `${APP_NAME} — Dashboard`,
  '/admin': `${APP_NAME} — Admin Recursos`,
}

export { APP_NAME, PAGE_TITLES }
