import { useEffect, useState } from 'react'
import styles from './InstagramSuccess.module.css'

const INTERVAL_MS = 3500

export default function SuccessCaseCard({ item }) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [isHovering, setIsHovering] = useState(false)
  const images = item.images?.length ? item.images : [item.avatar]

  useEffect(() => {
    if (!isHovering || images.length <= 1) return undefined

    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % images.length)
    }, INTERVAL_MS)

    return () => clearInterval(timer)
  }, [isHovering, images.length])

  const handleMouseEnter = () => setIsHovering(true)

  const handleMouseLeave = () => {
    setIsHovering(false)
    setActiveIndex(0)
  }

  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className={styles.card}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className={styles.cardContent}>
        <h3 className={styles.cardHeadline}>{item.headline}</h3>
        <p className={styles.cardDescription}>{item.description}</p>

        <div className={styles.author}>
          <img src={item.avatar} alt={item.name} className={styles.authorAvatar} />
          <div className={styles.authorInfo}>
            <div className={styles.authorName}>{item.name}</div>
            <div className={styles.authorMeta}>
              <span>{item.tag}</span>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.cardVisual}>
        {images.map((src, index) => (
          <img
            key={src}
            src={src}
            alt=""
            className={`${styles.slideImage} ${index === activeIndex ? styles.slideActive : ''}`}
            loading="lazy"
          />
        ))}
        <div className={styles.visualFade} />

        {isHovering && images.length > 1 && (
          <div className={styles.dots}>
            {images.map((_, index) => (
              <span
                key={index}
                className={`${styles.dot} ${index === activeIndex ? styles.dotActive : ''}`}
              />
            ))}
          </div>
        )}
      </div>
    </a>
  )
}
