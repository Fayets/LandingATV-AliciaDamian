import { useEffect, useState } from 'react'
import DashboardPage from './pages/DashboardPage'
import LandingPage from './pages/LandingPage'
import AccessCodePage from './pages/AccessCodePage'
import ResourcePage from './pages/ResourcePage'
import LoginPage from './pages/LoginPage'
import AdminPage from './pages/AdminPage'
import ProtectedRoute from './components/ProtectedRoute'
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
    return <ResourcePage />
  }
  if (path === '/login') {
    return <LoginPage />
  }
  if (path === '/dashboard') {
    return (
      <ProtectedRoute>
        <DashboardPage />
      </ProtectedRoute>
    )
  }
  if (path === '/admin') {
    return (
      <ProtectedRoute>
        <AdminPage />
      </ProtectedRoute>
    )
  }

  window.location.replace('/acceso')
  return null
}
