import styles from './CosmicBackground.module.css'

export default function CosmicBackground() {
  return (
    <div className={styles.bg} aria-hidden="true">
      <div className={styles.nebula} />
      <div className={styles.stars} />
      <div className={styles.starsDim} />
      <div className={styles.gridWrap}>
        <div className={styles.grid} />
      </div>
      <div className={styles.glow} />
      <div className={styles.vignette} />
    </div>
  )
}
