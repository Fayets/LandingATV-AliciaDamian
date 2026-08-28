import { useEffect, useState } from 'react'
import { getAdminResources, saveAdminResource } from '../api/admin'
import styles from './ResourcesPanel.module.css'

const EMPTY_SECTION = { heading: '', body: '' }

export default function ResourcesPanel({ onClose }) {
  const [resources, setResources] = useState([])
  const [selectedKey, setSelectedKey] = useState('')
  const [title, setTitle] = useState('')
  const [summary, setSummary] = useState('')
  const [sections, setSections] = useState([EMPTY_SECTION])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [message, setMessage] = useState(null)

  useEffect(() => {
    getAdminResources()
      .then((items) => {
        setResources(items)
        if (items.length > 0) {
          selectResource(items[0])
        }
      })
      .catch((err) => setError(err.message || 'No se pudieron cargar los recursos'))
      .finally(() => setLoading(false))
  }, [])

  function selectResource(item) {
    setSelectedKey(item.bucket_key)
    setTitle(item.title || '')
    setSummary(item.summary || '')
    setSections(item.sections?.length ? item.sections : [EMPTY_SECTION])
    setMessage(null)
    setError(null)
  }

  const handleSave = async () => {
    if (!selectedKey.trim()) {
      setError('Seleccioná o ingresá un bucket_key')
      return
    }
    setSaving(true)
    setError(null)
    setMessage(null)
    try {
      const saved = await saveAdminResource(selectedKey.trim(), {
        title,
        summary,
        sections: sections.filter((section) => section.heading || section.body),
      })
      setResources((current) => {
        const next = current.filter((item) => item.bucket_key !== saved.bucket_key)
        return [...next, saved].sort((a, b) => a.bucket_key.localeCompare(b.bucket_key))
      })
      setMessage('Recurso guardado')
      selectResource(saved)
    } catch (err) {
      setError(err.message || 'No se pudo guardar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.panel} onClick={(e) => e.stopPropagation()}>
        <header className={styles.header}>
          <div>
            <h2>Recursos por bucket</h2>
            <p>Configurá el diagnóstico que ve cada lead en /recurso</p>
          </div>
          <button type="button" className={styles.closeBtn} onClick={onClose}>×</button>
        </header>

        {loading && <p className={styles.muted}>Cargando recursos...</p>}
        {error && <p className={styles.error}>{error}</p>}
        {message && <p className={styles.success}>{message}</p>}

        {!loading && (
          <div className={styles.layout}>
            <aside className={styles.list}>
              {resources.length === 0 ? (
                <p className={styles.muted}>
                  Sin buckets todavía. Creá uno manualmente con el formulario →
                </p>
              ) : resources.map((item) => (
                <button
                  key={item.bucket_key}
                  type="button"
                  className={`${styles.listItem} ${selectedKey === item.bucket_key ? styles.listItemActive : ''}`}
                  onClick={() => selectResource(item)}
                >
                  <code>{item.bucket_key}</code>
                  <span>{item.source}</span>
                </button>
              ))}
            </aside>

            <section className={styles.editor}>
              <label>
                Bucket key
                <input
                  className={styles.input}
                  value={selectedKey}
                  onChange={(e) => setSelectedKey(e.target.value)}
                  placeholder="calificado|avatar|revenue|marketing"
                />
              </label>
              <label>
                Título
                <input className={styles.input} value={title} onChange={(e) => setTitle(e.target.value)} />
              </label>
              <label>
                Resumen
                <textarea className={styles.textarea} value={summary} onChange={(e) => setSummary(e.target.value)} rows={3} />
              </label>

              <div className={styles.sectionsHead}>
                <span>Secciones</span>
                <button
                  type="button"
                  className={styles.linkBtn}
                  onClick={() => setSections((current) => [...current, EMPTY_SECTION])}
                >
                  + Agregar sección
                </button>
              </div>

              {sections.map((section, index) => (
                <div key={index} className={styles.sectionBlock}>
                  <input
                    className={styles.input}
                    value={section.heading}
                    onChange={(e) => setSections((current) => current.map((item, i) => (
                      i === index ? { ...item, heading: e.target.value } : item
                    )))}
                    placeholder="Título de sección"
                  />
                  <textarea
                    className={styles.textarea}
                    value={section.body}
                    onChange={(e) => setSections((current) => current.map((item, i) => (
                      i === index ? { ...item, body: e.target.value } : item
                    )))}
                    placeholder="Contenido"
                    rows={3}
                  />
                </div>
              ))}

              <button type="button" className={styles.saveBtn} onClick={handleSave} disabled={saving}>
                {saving ? 'Guardando...' : 'Guardar recurso'}
              </button>
            </section>
          </div>
        )}
      </div>
    </div>
  )
}
