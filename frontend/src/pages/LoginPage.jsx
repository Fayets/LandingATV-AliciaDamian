import { useEffect, useState } from 'react'
import { adminLogin, getAdminSession } from '../api/admin'
import { BRAND } from '../data/landingContent'
import TrackBackground from '../components/TrackBackground'
import styles from './LoginPage.module.css'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    getAdminSession()
      .then((session) => {
        if (session) {
          window.history.replaceState({}, '', '/dashboard')
          window.dispatchEvent(new PopStateEvent('popstate'))
        }
      })
      .finally(() => setChecking(false))
  }, [])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await adminLogin(username, password)
      window.history.pushState({}, '', '/dashboard')
      window.dispatchEvent(new PopStateEvent('popstate'))
    } catch (err) {
      setError(err.message || 'Usuario o contraseña incorrectos')
    } finally {
      setLoading(false)
    }
  }

  if (checking) {
    return (
      <div className={styles.page}>
        <TrackBackground />
        <div className={styles.checking}>
          <div className={styles.spinner} />
          <p>Verificando sesión…</p>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <TrackBackground />

      <div className={styles.box}>
        <img className={styles.brandMark} src={BRAND.avatar} alt={BRAND.coach} />
        <h1 className={styles.title}>{BRAND.coach}</h1>
        <p className={styles.sub}>{BRAND.credential}</p>

        <form className={styles.form} onSubmit={handleSubmit}>
          <input
            className={styles.input}
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Usuario"
            autoComplete="username"
          />
          <input
            className={styles.input}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Contraseña"
            autoComplete="current-password"
          />
          <button className={styles.button} type="submit" disabled={loading}>
            {loading ? 'Entrando…' : 'Entrar'}
          </button>
        </form>

        {error && <p className={styles.error}>{error}</p>}
      </div>
    </div>
  )
}
