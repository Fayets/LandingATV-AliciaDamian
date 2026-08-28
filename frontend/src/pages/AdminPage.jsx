import { adminLogout } from '../api/admin'
import ResourcesPanel from '../components/admin/ResourcesPanel'
import TrackBackground from '../components/TrackBackground'
import styles from './AdminPage.module.css'

const LANDING_SLUG = import.meta.env.VITE_DEFAULT_LANDING_SLUG || 'running-alicia'

export default function AdminPage() {
  const goTo = (path) => {
    window.history.pushState({}, '', path)
    window.dispatchEvent(new PopStateEvent('popstate'))
  }

  const handleLogout = async () => {
    try {
      await adminLogout()
    } finally {
      goTo('/login')
    }
  }

  return (
    <div className={styles.page}>
      <TrackBackground />
      <div className={styles.shell}>
        <header className={styles.header}>
          <div>
            <p className={styles.eyebrow}>Administración</p>
            <h1 className={styles.title}>Panel de Recursos</h1>
          </div>
          <div className={styles.actions}>
            <button type="button" className={styles.linkBtn} onClick={() => goTo('/dashboard')}>
              Ir al dashboard
            </button>
            <button type="button" className={styles.linkBtn} onClick={handleLogout}>
              Cerrar sesión
            </button>
          </div>
        </header>

        <ResourcesPanel landingSlug={LANDING_SLUG} />
      </div>
    </div>
  )
}
