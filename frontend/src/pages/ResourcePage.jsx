import { useEffect, useState } from 'react'
import { fetchResourceByCode, resourceFileUrl } from '../api/resource'
import DiagnosisDocument from '../components/DiagnosisDocument'
import TrackBackground from '../components/TrackBackground'
import { BRAND, RESOURCE_COPY } from '../data/landingContent'
import styles from './ResourcePage.module.css'

function readCodeFromUrl() {
  if (typeof window === 'undefined') return ''
  return new URLSearchParams(window.location.search).get('code')?.trim() || ''
}

export default function ResourcePage() {
  const [code, setCode] = useState(() => readCodeFromUrl())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)

  useEffect(() => {
    const fromUrl = readCodeFromUrl()
    if (fromUrl) setCode(fromUrl.toUpperCase())
  }, [])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError(null)
    setResult(null)

    const trimmed = code.trim()
    if (!trimmed) {
      setError(RESOURCE_COPY.emptyError)
      return
    }

    setLoading(true)
    try {
      const data = await fetchResourceByCode(trimmed)
      setResult({ ...data, code: trimmed })
    } catch (err) {
      setError(err.message || 'Clave inválida o inexistente')
    } finally {
      setLoading(false)
    }
  }

  const firstName = result?.lead?.name?.split(' ')[0]

  return (
    <div className={styles.page}>
      <TrackBackground />

      <div className={`${styles.inner} ${result?.pdf?.estado === 'ok' ? styles.innerWide : ''}`}>
        <a className={styles.brand} href={BRAND.instagramUrl} target="_blank" rel="noreferrer">
          <img className={styles.brandMark} src={BRAND.avatar} alt={BRAND.coach} />
          <span className={styles.brandText}>
            <b>{BRAND.coach}</b>
            <i>{BRAND.credential}</i>
          </span>
        </a>

        {!result && (
          <div className={styles.card}>
            <span className={styles.badge}>{RESOURCE_COPY.badge}</span>
            <h1 className={styles.title}>{RESOURCE_COPY.title}</h1>
            <p className={styles.sub}>{RESOURCE_COPY.sub}</p>

            <form className={styles.form} onSubmit={handleSubmit}>
              <label className={styles.label} htmlFor="access-code">
                {RESOURCE_COPY.label}
              </label>
              <input
                id="access-code"
                className={styles.input}
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="QF-1234"
                autoComplete="off"
              />
              <button className={styles.button} type="submit" disabled={loading}>
                {loading ? RESOURCE_COPY.loadingCta : RESOURCE_COPY.cta}
              </button>
            </form>

            {error && <p className={styles.error}>{error}</p>}
          </div>
        )}

        {result && result.pdf?.estado === 'ok' && (
          <article className={styles.delivery}>
            <header className={styles.deliveryHead}>
              <span className={styles.diagLabel}>{RESOURCE_COPY.deliveryLabel}</span>
              <h1 className={styles.deliveryTitle}>
                {firstName
                  ? `${firstName}${RESOURCE_COPY.deliveryTitleSuffix}`
                  : RESOURCE_COPY.deliveryFallbackTitle}
              </h1>
              <p className={styles.deliverySub}>
                {result.pdf.nombre}
                {result.pdf.identificador ? ` · ${result.pdf.identificador}` : ''}
              </p>
            </header>

            <DiagnosisDocument fileUrl={resourceFileUrl(result.code)} />
          </article>
        )}

        {result && result.pdf && result.pdf.estado !== 'ok' && (
          <div className={styles.card}>
            <span className={styles.badge}>Sin entrega automática</span>
            <h1 className={styles.title}>Esto lo revisa Alicia</h1>
            <p className={styles.sub}>
              {result.pdf.estado === 'fuera_de_avatar'
                ? 'Por lo que nos contaste, tu caso necesita una mirada personal antes de darte un plan. Escríbele a Alicia por Instagram y lo vemos contigo.'
                : 'Faltan respuestas para poder prepararte el diagnóstico. Escríbele a Alicia y lo resolvemos en un minuto.'}
            </p>
            <a
              className={styles.button}
              href={BRAND.instagramUrl}
              target="_blank"
              rel="noreferrer"
              style={{ display: 'block', textAlign: 'center', textDecoration: 'none' }}
            >
              Escribir a {BRAND.firstName}
            </a>
          </div>
        )}

      </div>
    </div>
  )
}
