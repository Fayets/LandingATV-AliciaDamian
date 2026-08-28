import styles from './ThankYouPage.module.css'
import { buildWhatsappUrl } from '../utils/buildWhatsappMessage'

const LOGO_FILE = import.meta.env.VITE_LOGO_FILE || 'logo.svg'

export default function ThankYouPage({ data }) {
  const waUrl = buildWhatsappUrl(data || {})

  return (
    <div className={styles.page}>
      <nav className={styles.nav}>
        <img
          src={`${import.meta.env.BASE_URL}${LOGO_FILE}`}
          alt="Logo"
          className={styles.logo}
          width={36}
          height={36}
        />
      </nav>

      <div className={styles.center}>
        <div className={styles.iconWrap}>
          <i className="ti ti-check" />
        </div>
        <h1 className={styles.title}>[Tu mensaje de confirmación aquí]</h1>
        <p className={styles.sub}>
          [Descripción de los próximos pasos para el usuario]
        </p>

        <a href={waUrl} target="_blank" rel="noopener noreferrer" className={styles.waBtn}>
          <i className="ti ti-brand-whatsapp" />
          [CTA WhatsApp]
        </a>

        <p className={styles.disclaimer}>
          [Nota de confianza o disclaimer opcional]
        </p>
      </div>
    </div>
  )
}
