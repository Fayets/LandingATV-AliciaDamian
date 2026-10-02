import { lazy, Suspense, useEffect, useState } from 'react'
import LandingPage from './pages/LandingPage'
import AccessCodePage from './pages/AccessCodePage'
import ProtectedRoute from './components/ProtectedRoute'

/* La landing y su pantalla de clave van en el paquete principal porque son
   la entrada del lead. El resto se carga solo cuando se visita: el visor de
   /recurso arrastra pdfjs, y el panel y el admin son pantallas internas que
   ningun visitante abre. Juntos eran 134 de los 177 KiB que se descargaba
   quien entraba a /acceso sin llegar a usarlos nunca. */
const ResourcePage = lazy(() => import('./pages/ResourcePage'))
const LoginPage = lazy(() => import('./pages/LoginPage'))
const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const AdminPage = lazy(() => import('./pages/AdminPage'))
import { esCalificado } from './utils/calificacion'
import {
  isValidLead,
  readStoredLead,
  saveLead,
} from './utils/leadSession'
import { PAGE_TITLES } from './config/app'

function normalizePath(pathname) {
  if (!pathname || pathname === '/') return '/'
  return pathname.replace(/\/+$/, '') || '/'
}

/** Envoltorio de las vistas que se cargan bajo demanda. El hueco va del
    color del fondo para que no haya un parpadeo blanco mientras llega. */
function Diferida({ children }) {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: 'var(--ink)' }} />}>
      {children}
    </Suspense>
  )
}

export default function App() {
  const [path, setPath] = useState(() => normalizePath(window.location.pathname))
  const [leadData, setLeadData] = useState(() => (
    normalizePath(window.location.pathname) === '/acceso/clave' ? readStoredLead() : null
  ))

  useEffect(() => {
    const syncPath = () => setPath(normalizePath(window.location.pathname))
    window.addEventListener('popstate', syncPath)
    return () => window.removeEventListener('popstate', syncPath)
  }, [])

  useEffect(() => {
    document.title = PAGE_TITLES[path] || PAGE_TITLES['/acceso']
  }, [path])

  useEffect(() => {
    if (path === '/') {
      window.history.replaceState({}, '', '/acceso')
      setPath('/acceso')
    }
  }, [path])

  useEffect(() => {
    if (path !== '/acceso/clave') return

    const stored = readStoredLead()
    if (isValidLead(stored)) {
      setLeadData(stored)
      return
    }

    setLeadData(null)
    window.history.replaceState({}, '', '/acceso')
    setPath('/acceso')
  }, [path])

  const handleComplete = (data) => {
    const calificado = esCalificado(data)
    const payload = { ...data, calificado }
    saveLead(payload)
    setLeadData(payload)
    window.history.pushState({}, '', '/acceso/clave')
    setPath('/acceso/clave')
  }

  if (path === '/acceso/clave') {
    if (!isValidLead(leadData)) return null
    return <AccessCodePage data={leadData} calificado={leadData.calificado} />
  }
  if (path === '/acceso') {
    return <LandingPage onComplete={handleComplete} />
  }
  if (path === '/recurso') {
    return <Diferida><ResourcePage /></Diferida>
  }
  if (path === '/login') {
    return <Diferida><LoginPage /></Diferida>
  }
  if (path === '/dashboard') {
    return (
      <Diferida>
        <ProtectedRoute>
          <DashboardPage />
        </ProtectedRoute>
      </Diferida>
    )
  }
  if (path === '/admin') {
    return (
      <Diferida>
        <ProtectedRoute>
          <AdminPage />
        </ProtectedRoute>
      </Diferida>
    )
  }

  window.location.replace('/acceso')
  return null
}
