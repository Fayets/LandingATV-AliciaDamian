import { INSTAGRAM_PROFILE, INSTAGRAM_SUCCESS_CASES } from '../data/instagramSuccessCases'
import SuccessCaseCard from './SuccessCaseCard'
import styles from './InstagramSuccess.module.css'

export default function InstagramSuccess() {
  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <h2 className={styles.sectionTitle}>Resultados de clientes</h2>
      </div>

      <div className={styles.list}>
        {INSTAGRAM_SUCCESS_CASES.map((item) => (
          <SuccessCaseCard key={item.url} item={item} />
        ))}
      </div>

      <div className={styles.footer}>
        <a
          href={INSTAGRAM_PROFILE.url}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.followBtn}
        >
          <i className="ti ti-brand-instagram" />
          Ver todos los casos en @{INSTAGRAM_PROFILE.username}
        </a>
      </div>
    </section>
  )
}
