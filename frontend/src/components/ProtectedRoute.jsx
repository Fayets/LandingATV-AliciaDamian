import { useEffect, useState } from 'react'
import { getAdminSession } from '../api/admin'
import '../styles/atv-dashboard.css'

const LOGO_FILE = import.meta.env.VITE_LOGO_FILE || 'logo.svg'
const LOGO_SRC = `${import.meta.env.BASE_URL}${LOGO_FILE}`

export default function ProtectedRoute({ children }) {
  const [status, setStatus] = useState('loading')

  useEffect(() => {
    getAdminSession()
      .then((session) => {
        if (session) {
          setStatus('authenticated')
        } else {
          window.location.replace('/login')
        }
      })
      .catch(() => {
        window.location.replace('/login')
      })
  }, [])

  if (status === 'loading') {
    return (
      <div className="atv-metrics-page atv-metrics-page--loading">
        <div className="atv-page__glow atv-page__glow--metrics" aria-hidden="true" />
        <img
          src={LOGO_SRC}
          alt="Logo"
          className="atv-metrics-loading-logo"
          width={112}
          height={36}
        />
        <span className="atv-metrics-spinner" aria-hidden="true" />
      </div>
    )
  }

  return children
}
