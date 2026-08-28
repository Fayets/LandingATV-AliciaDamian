import { useEffect, useState } from 'react'
import { buildWhatsappUrl, hasWhatsappNumber } from '../utils/buildWhatsappMessage'
import { ACCESS_COPY, BRAND } from '../data/landingContent'
import TrackBackground from '../components/TrackBackground'
import styles from './AccessCodePage.module.css'

const COUNTDOWN_SECONDS = 10

export default function AccessCodePage({ data }) {
  const [copied, setCopied] = useState(false)
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS)
  const code = data?.access_code || '---'
  const firstName = data?.name?.split(' ')[0] || ''
  const waUrl = buildWhatsappUrl(data || {})

  useEffect(() => {
    if (countdown <= 0) {
      if (hasWhatsappNumber) window.location.replace(waUrl)
      return undefined
    }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [countdown, waUrl])

  const handleCopy = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const progress = ((COUNTDOWN_SECONDS - countdown) / COUNTDOWN_SECONDS) * 100

  return (
    <div className={styles.page}>
      <TrackBackground />

      <div className={styles.inner}>
        <span className={styles.badge}>
          <span className={styles.dot} />
          {ACCESS_COPY.badge}
        </span>

        <h1 className={styles.title}>
          {firstName && <span className={styles.name}>{firstName},</span>}
          <mark>{ACCESS_COPY.titleSuffix}</mark>
        </h1>

        <p className={styles.sub}>{ACCESS_COPY.sub}</p>

        {/* Dorsal */}
        <div className={styles.bib}>
          <div className={styles.bibTop}>
            <span>{ACCESS_COPY.dorsalLabel}</span>
            <span>{BRAND.coach}</span>
          </div>
          <div className={styles.bibNumber}>{code}</div>
          <div className={styles.bibPerf} aria-hidden="true" />
          <div className={styles.bibBottom}>
            <span className={styles.bibLabel}>{ACCESS_COPY.codeLabel}</span>
            <button type="button" className={styles.copyBtn} onClick={handleCopy}>
              {copied ? ACCESS_COPY.copiedBtn : ACCESS_COPY.copyBtn}
            </button>
          </div>
        </div>

        <a href={waUrl} className={styles.waBtn}>
          <i className="ti ti-brand-whatsapp" aria-hidden="true" />
          {ACCESS_COPY.waBtn}
        </a>

        <div className={styles.redirect}>
          <p>
            {ACCESS_COPY.countdownPrefix}
            {' '}
            <b>{countdown > 0 ? `${countdown}s` : '…'}</b>
          </p>
          <div className={styles.redirectBar}>
            <div className={styles.redirectFill} style={{ width: `${progress}%` }} />
          </div>
        </div>

        {!hasWhatsappNumber && (
          <p className={styles.configWarning}>
            Falta el WhatsApp de Alicia: configurá <code>VITE_WA_NUMBER</code> en el .env
            del frontend o <code>BRAND.whatsappNumber</code> en <code>landingContent.js</code>.
          </p>
        )}

        <p className={styles.warning}>{ACCESS_COPY.warning}</p>
      </div>
    </div>
  )
}
