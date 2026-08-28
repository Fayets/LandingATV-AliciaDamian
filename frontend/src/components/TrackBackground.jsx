import styles from './TrackBackground.module.css'

/**
 * Fondo del hero: fotografía de una corredora a contraluz, oscurecida
 * para que el texto siga siendo legible encima.
 *
 * La imagen vive en /public — cambiala ahí y cambia en toda la landing.
 */
export default function TrackBackground() {
  return (
    <div className={styles.bg} aria-hidden="true">
      <div className={styles.photo} />
      <div className={styles.scrim} />
      <div className={styles.grain} />
      <div className={styles.vignette} />
    </div>
  )
}
