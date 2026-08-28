import { useEffect, useMemo, useState } from 'react'
import { fetchLeads as getLeads, updateLead, deleteLead } from '../api/leads'
import { adminLogout, deleteAllAdminLeads } from '../api/admin'
import {
  ESTADO_OPTIONS,
  getQuizAnswerLabel,
  QUIZ_FIELD_LABELS,
  QUIZ_QUESTIONS,
  ZONA_FILTER_OPTIONS,
  matchesZonaFilter,
} from '../data/landingQuiz'
import { buildLeadWhatsappUrl } from '../utils/buildWhatsappMessage'
import { downloadAdminLeadsCsv } from '../utils/exportAdminCsv'
import ResourcesPanel from '../components/ResourcesPanel'
import '../styles/atv-dashboard.css'
import styles from './DashboardPage.module.css'

const LOGO_FILE = import.meta.env.VITE_LOGO_FILE || 'logo.svg'
const LOGO_SRC = `${import.meta.env.BASE_URL}${LOGO_FILE}`
const CONFIGURED_RESPONSABLES = (import.meta.env.VITE_LEAD_RESPONSABLES || '')
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean)

const API_BASE = import.meta.env.VITE_API_URL || '/api'
const PAGE_SIZE = 20

async function getMetrics() {
  const res = await fetch(`${API_BASE}/leads/metrics`)
  if (!res.ok) throw new Error('No se pudieron cargar las métricas')
  return res.json()
}

function parseUtcDate(iso) {
  if (!iso) return new Date(NaN)
  if (iso.endsWith('Z') || /[+-]\d{2}:\d{2}$/.test(iso)) return new Date(iso)
  return new Date(`${iso}Z`)
}

function formatDateShort(iso) {
  const d = parseUtcDate(iso)
  return d.toLocaleDateString('es-AR', {
    timeZone: 'America/Argentina/Buenos_Aires',
    day: '2-digit',
    month: '2-digit',
  })
}

function formatDateInputValue(iso) {
  const d = parseUtcDate(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('en-CA', {
    timeZone: 'America/Argentina/Buenos_Aires',
  })
}

function formatDateFull(iso) {
  return parseUtcDate(iso).toLocaleString('es-AR', {
    timeZone: 'America/Argentina/Buenos_Aires',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function igToUrl(ig) {
  const handle = (ig || '').trim().replace(/^@/, '')
  return handle ? `https://instagram.com/${handle}` : null
}

function objectToSortedEntries(obj) {
  if (!obj) return []
  return Object.entries(obj).sort((a, b) => b[1] - a[1])
}

function formatInversion(row) {
  const answers = row.quiz_answers || {}
  const value = row.step_5_inversion ?? answers.step_5_inversion
  if (value == null || value === '') return '—'
  return getQuizAnswerLabel('step_5_inversion', Number(value), answers) || '—'
}

function formatEstadoLabel(estado) {
  const value = estado || 'pendiente'
  return value.charAt(0).toUpperCase() + value.slice(1)
}

function HorizontalBar({ label, value, max }) {
  const pct = max > 0 ? (value / max) * 100 : 0
  return (
    <div className={styles.hBarRow}>
      <span className={styles.hBarLabel} title={label}>{label}</span>
      <div className={styles.hBarTrack}>
        <div className={styles.hBarFill} style={{ width: `${pct}%` }} />
      </div>
      <span className={styles.hBarValue}>{value}</span>
    </div>
  )
}

function AnalyticsCharts({
  dailyData,
  maxDaily,
  zonaData,
  maxZona,
  tiempoData,
  maxTiempo,
  diasData,
  maxDias,
  entrenamientosData,
  maxEntrenamientos,
  calificadosCount,
  noCalificadosCount,
}) {
  return (
    <section className={styles.chartsGrid}>
      <div className={`${styles.chartCard} ${styles.chartCardDaily}`}>
        <h2 className={styles.chartTitle}>Registros últimos 14 días</h2>
        <div className={styles.barChart}>
          {dailyData.map((day) => (
            <div
              key={day.key}
              className={styles.barCol}
              title={`${day.count} registro${day.count === 1 ? '' : 's'} el ${day.label}`}
            >
              <div className={styles.barTrack}>
                <div
                  className={styles.barFill}
                  style={{
                    height: day.count > 0
                      ? `${Math.max((day.count / maxDaily) * 100, 2)}%`
                      : '0',
                    minHeight: day.count > 0 ? 2 : 0,
                  }}
                />
              </div>
              <span className={styles.barCount}>{day.count}</span>
              <span className={styles.barLabel}>{day.label}</span>
            </div>
          ))}
        </div>
        <div className={styles.dailyCalificados}>
          <span className={styles.dailyCalificadosLabel}>Edad 30–60</span>
          <div className={styles.metricSplit}>
            <span className={styles.metricSplitLucas}>Sí: {calificadosCount}</span>
            <span className={styles.metricSplitSep}>|</span>
            <span className={styles.metricSplitJero}>No: {noCalificadosCount}</span>
          </div>
        </div>
      </div>
      <div className={styles.chartCard}>
        <h2 className={styles.chartTitle}>Por zona</h2>
        <div className={styles.hBarList}>
          {zonaData.length === 0 ? (
            <p className={styles.cellMuted}>Sin datos todavía</p>
          ) : zonaData.map(([label, value]) => (
            <HorizontalBar key={label} label={label} value={value} max={maxZona} />
          ))}
        </div>
      </div>
      <div className={styles.chartCard}>
        <h2 className={styles.chartTitle}>Tiempo corriendo</h2>
        <div className={styles.hBarList}>
          {tiempoData.length === 0 ? (
            <p className={styles.cellMuted}>Sin datos todavía</p>
          ) : tiempoData.map(([label, value]) => (
            <HorizontalBar key={label} label={label} value={value} max={maxTiempo} />
          ))}
        </div>
      </div>
      <div className={styles.chartCard}>
        <h2 className={styles.chartTitle}>Días por semana</h2>
        <div className={styles.hBarList}>
          {diasData.length === 0 ? (
            <p className={styles.cellMuted}>Sin datos todavía</p>
          ) : diasData.map(([label, value]) => (
            <HorizontalBar key={label} label={label} value={value} max={maxDias} />
          ))}
        </div>
      </div>
      <div className={styles.chartCard}>
        <h2 className={styles.chartTitle}>Tipo de entrenamiento</h2>
        <div className={styles.hBarList}>
          {entrenamientosData.length === 0 ? (
            <p className={styles.cellMuted}>Sin datos todavía</p>
          ) : entrenamientosData.map(([label, value]) => (
            <HorizontalBar key={label} label={label} value={value} max={maxEntrenamientos} />
          ))}
        </div>
      </div>
    </section>
  )
}

function StatusPill({ contacted, onClick, fullWidth = false }) {
  return (
    <button
      type="button"
      className={`${styles.statusPill} ${contacted ? styles.statusContacted : styles.statusPending} ${fullWidth ? styles.statusFull : ''}`}
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
    >
      <i className={`ti ${contacted ? 'ti-check' : 'ti-clock'}`} />
      {contacted ? 'Contactado' : 'Pendiente'}
    </button>
  )
}

function CalificadoBadge({ calificado }) {
  if (calificado === true) {
    return <span className={`${styles.statusPill} ${styles.statusCalificado}`}>✓ Enviado a Meta</span>
  }
  if (calificado === false) {
    return <span className={`${styles.statusPill} ${styles.statusNoCalificado}`}>✗ Sin Meta</span>
  }
  return <span className={`${styles.statusPill} ${styles.statusSinCalificar}`}>Sin calificar</span>
}

function isLeadComplete(lead) {
  const answers = lead.quiz_answers || {}
  return Boolean(answers.objetivo && answers.edad)
}

function EstadoSelect({ lead, onChange }) {
  return (
    <select
      className={styles.estadoSelect}
      value={lead.estado || 'pendiente'}
      onClick={(e) => e.stopPropagation()}
      onChange={(e) => onChange(lead.id, e.target.value)}
    >
      {ESTADO_OPTIONS.map((estado) => (
        <option key={estado} value={estado}>{formatEstadoLabel(estado)}</option>
      ))}
    </select>
  )
}

function TipoLeadBadge({ lead }) {
  if (isLeadComplete(lead)) {
    return <span className={`${styles.statusPill} ${styles.statusCompleto}`}>Completo</span>
  }
  return <span className={`${styles.statusPill} ${styles.statusSoloDatos}`}>Solo datos</span>
}

function ResponsableBadge({ responsable }) {
  if (!responsable) {
    return <span className={`${styles.statusPill} ${styles.responsableSinAsignar}`}>Sin asignar</span>
  }
  return <span className={`${styles.statusPill} ${styles.responsableLucas}`}>{responsable}</span>
}

function getRowClass(calificado) {
  if (calificado === true) return styles.rowCalificado
  if (calificado === false) return styles.rowNoCalificado
  return ''
}

function getPanelClass(calificado) {
  if (calificado === true) return styles.panelCalificado
  if (calificado === false) return styles.panelNoCalificado
  return ''
}

export default function DashboardPage() {
  const [leads, setLeads] = useState([])
  const [metricsData, setMetricsData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [zonaFilter, setZonaFilter] = useState('')
  const [estadoFilter, setEstadoFilter] = useState('')
  const [dateFilter, setDateFilter] = useState('')
  const [selectedId, setSelectedId] = useState(null)
  const [noteDraft, setNoteDraft] = useState('')
  const [regenConfirming, setRegenConfirming] = useState(false)
  const [regenLoading, setRegenLoading] = useState(false)
  const [regenError, setRegenError] = useState(null)
  const [codeCopied, setCodeCopied] = useState(false)
  const [deleteConfirming, setDeleteConfirming] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError, setDeleteError] = useState(null)
  const [deleteAllConfirming, setDeleteAllConfirming] = useState(false)
  const [deleteAllLoading, setDeleteAllLoading] = useState(false)
  const [deleteAllError, setDeleteAllError] = useState(null)
  const [showAnalytics, setShowAnalytics] = useState(false)
  const [showResources, setShowResources] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    let cancelled = false

    async function loadDashboard() {
      setLoading(true)
      try {
        const [leadsResult, metricsResult] = await Promise.allSettled([
          getLeads(),
          getMetrics(),
        ])
        if (!cancelled) {
          setLeads(leadsResult.status === 'fulfilled' ? leadsResult.value : [])
          setMetricsData(metricsResult.status === 'fulfilled' ? metricsResult.value : null)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadDashboard()
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    if (!showAnalytics) return undefined
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setShowAnalytics(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [showAnalytics])

  useEffect(() => {
    setCurrentPage(1)
  }, [search, zonaFilter, estadoFilter, dateFilter])

  const filteredLeads = useMemo(() => {
    const q = search.trim().toLowerCase()
    return leads.filter((lead) => {
      if (zonaFilter && !matchesZonaFilter(lead.zona, zonaFilter)) return false
      if (estadoFilter && (lead.estado || 'pendiente') !== estadoFilter) return false
      if (dateFilter && formatDateInputValue(lead.created_at) !== dateFilter) return false
      if (!q) return true
      return (
        lead.name.toLowerCase().includes(q)
        || lead.email.toLowerCase().includes(q)
        || lead.phone.toLowerCase().includes(q)
        || (lead.ig || '').toLowerCase().includes(q)
        || (lead.access_code || '').toLowerCase().includes(q)
        || (lead.revenue || '').toLowerCase().includes(q)
      )
    })
  }, [leads, search, zonaFilter, estadoFilter, dateFilter])

  const exportFilters = useMemo(() => ({
    search,
    zonaFilter,
    estadoFilter,
    dateFilter,
  }), [search, zonaFilter, estadoFilter, dateFilter])

  function handleExport() {
    if (filteredLeads.length === 0) return
    downloadAdminLeadsCsv(filteredLeads)
  }

  async function handleLogout() {
    await adminLogout()
    window.location.replace('/login')
  }

  const totalPages = Math.max(1, Math.ceil(filteredLeads.length / PAGE_SIZE))

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages)
  }, [currentPage, totalPages])

  const paginatedLeads = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE
    return filteredLeads.slice(start, start + PAGE_SIZE)
  }, [filteredLeads, currentPage])

  const pageRangeStart = filteredLeads.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1
  const pageRangeEnd = Math.min(currentPage * PAGE_SIZE, filteredLeads.length)

  const metrics = useMemo(() => {
    const total = leads.length
    const pendientes = leads.filter((l) => (l.estado || 'pendiente') === 'pendiente').length
    const contactados = leads.filter((l) => l.estado === 'contactado').length
    const agendados = leads.filter((l) => l.estado === 'agendado').length
    const calificadosCount = leads.filter((l) => l.calificado === true).length
    const noCalificadosCount = leads.filter((l) => l.calificado === false).length
    const avgAccessCount = metricsData?.avg_access_count ?? 0
    const totalAccesses = metricsData?.total_accesses ?? 0
    return {
      total,
      pendientes,
      contactados,
      agendados,
      calificadosCount,
      noCalificadosCount,
      avgAccessCount,
      totalAccesses,
    }
  }, [metricsData, leads])

  const dailyData = useMemo(() => (
    (metricsData?.daily ?? []).map((day) => ({
      key: day.date,
      label: formatDateShort(day.date),
      count: day.count,
    }))
  ), [metricsData])

  const maxDaily = useMemo(() => Math.max(...dailyData.map((d) => d.count), 1), [dailyData])
  const zonaData = useMemo(() => objectToSortedEntries(metricsData?.by_zona), [metricsData])
  const tiempoData = useMemo(() => objectToSortedEntries(metricsData?.by_tiempo), [metricsData])
  const diasData = useMemo(() => objectToSortedEntries(metricsData?.by_dias), [metricsData])
  const entrenamientosData = useMemo(
    () => objectToSortedEntries(metricsData?.by_entrenamientos),
    [metricsData],
  )
  const maxZona = zonaData[0]?.[1] ?? 1
  const maxTiempo = tiempoData[0]?.[1] ?? 1
  const maxDias = diasData[0]?.[1] ?? 1
  const maxEntrenamientos = entrenamientosData[0]?.[1] ?? 1

  const responsableFilterOptions = useMemo(() => (
    [...new Set([
      ...CONFIGURED_RESPONSABLES,
      ...leads.map((lead) => lead.responsable).filter(Boolean),
    ])].sort((a, b) => a.localeCompare(b, 'es'))
  ), [leads])

  const selectedLead = leads.find((l) => l.id === selectedId) ?? null

  const handleEstadoChange = async (id, estado) => {
    try {
      const updated = await updateLead(id, { estado })
      setLeads((prev) => prev.map((l) => (l.id === id ? updated : l)))
    } catch {
      // keep current state on error
    }
  }

  const toggleContacted = async (id) => {
    const lead = leads.find((l) => l.id === id)
    if (!lead) return
    try {
      const updated = await updateLead(id, { contacted: !lead.contacted })
      setLeads((prev) => prev.map((l) => (l.id === id ? updated : l)))
    } catch {
      // keep current state on error
    }
  }

  const openPanel = (lead) => {
    setSelectedId(lead.id)
    setNoteDraft(lead.notes || '')
    setRegenConfirming(false)
    setRegenLoading(false)
    setRegenError(null)
    setCodeCopied(false)
    setDeleteConfirming(false)
    setDeleteLoading(false)
    setDeleteError(null)
  }

  const closePanel = () => {
    setSelectedId(null)
    setRegenConfirming(false)
    setRegenLoading(false)
    setRegenError(null)
    setCodeCopied(false)
    setDeleteConfirming(false)
    setDeleteLoading(false)
    setDeleteError(null)
  }

  const handleCopyCode = () => {
    if (!selectedLead?.access_code) return
    navigator.clipboard.writeText(selectedLead.access_code)
    setCodeCopied(true)
    setTimeout(() => setCodeCopied(false), 2000)
  }

  const handleConfirmRegenerar = async () => {
    if (!selectedLead) return
    setRegenLoading(true)
    setRegenError(null)
    try {
      const res = await fetch(`${API_BASE}/leads/${selectedLead.id}/regenerar-codigo`, {
        method: 'POST',
      })
      if (!res.ok) throw new Error('No se pudo regenerar la clave')
      const updated = await res.json()
      setLeads((prev) => prev.map((l) => (l.id === updated.id ? updated : l)))
      setRegenConfirming(false)
    } catch {
      setRegenError('No se pudo regenerar la clave. Intentá de nuevo.')
    } finally {
      setRegenLoading(false)
    }
  }

  const saveNote = async () => {
    if (!selectedLead) return
    try {
      const updated = await updateLead(selectedLead.id, { notes: noteDraft })
      setLeads((prev) => prev.map((l) => (l.id === selectedLead.id ? updated : l)))
    } catch {
      // keep current state on error
    }
  }

  const handleResponsableChange = async (nuevoValor) => {
    if (!selectedLead) return
    try {
      const updated = await updateLead(selectedLead.id, { responsable: nuevoValor })
      setLeads((prev) => prev.map((l) => (l.id === selectedLead.id ? updated : l)))
    } catch {
      // keep current state on error
    }
  }

  const handleConfirmDelete = async () => {
    if (!selectedLead) return
    setDeleteLoading(true)
    setDeleteError(null)
    try {
      await deleteLead(selectedLead.id)
      setLeads((prev) => prev.filter((l) => l.id !== selectedLead.id))
      closePanel()
    } catch {
      setDeleteError('No se pudo eliminar el registrado. Intentá de nuevo.')
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleConfirmDeleteAll = async () => {
    setDeleteAllLoading(true)
    setDeleteAllError(null)
    try {
      await deleteAllAdminLeads()
      setLeads([])
      setSelectedId(null)
      setDeleteAllConfirming(false)
    } catch {
      setDeleteAllError('No se pudieron eliminar los leads. Intentá de nuevo.')
    } finally {
      setDeleteAllLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="atv-metrics-page">
        <div className="atv-page__glow atv-page__glow--metrics" aria-hidden="true" />
        <div className={`${styles.page} atv-metrics-page--loading`}>
          <img
            src={LOGO_SRC}
            alt="Logo"
            className="atv-metrics-loading-logo"
            width={112}
            height={36}
          />
          <span className="atv-metrics-spinner" aria-hidden="true" />
          <p className={styles.cellMuted}>Cargando métricas...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="atv-metrics-page">
      <div className="atv-page__glow atv-page__glow--metrics" aria-hidden="true" />
      <div className={styles.page}>
      <nav className={styles.navbar}>
        <div className={styles.navLeft}>
          <img
            src={LOGO_SRC}
            alt="Logo"
            className={styles.logo}
            width={112}
            height={36}
          />
        </div>
        <div className={styles.navActions}>
          <button
            type="button"
            className={styles.btnAnalytics}
            onClick={() => setShowResources(true)}
          >
            <i className="ti ti-file-text" />
            Recursos
          </button>
          <button
            type="button"
            className={styles.btnAnalytics}
            onClick={() => setShowAnalytics(true)}
          >
            <i className="ti ti-chart-bar" />
            Ver análisis
          </button>
          <button
            type="button"
            className={styles.btnLogout}
            onClick={handleLogout}
          >
            Cerrar sesión
          </button>
        </div>
      </nav>

      <main className={styles.content}>
        <header className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>Panel de leads</h1>
        </header>

        <section className={styles.metricsGrid}>
          <div className={styles.metricCard}>
            <div className={styles.metricHead}>
              <span className={styles.metricLabel}>Total leads</span>
              <i className="ti ti-users" />
            </div>
            <div className={styles.metricNum}>{metrics.total}</div>
          </div>
          <div className={`${styles.metricCard} ${styles.metricHighlight}`}>
            <div className={styles.metricHead}>
              <span className={styles.metricLabel}>Pendientes</span>
              <i className="ti ti-clock" />
            </div>
            <div className={`${styles.metricNum} ${styles.metricNumRed}`}>{metrics.pendientes}</div>
          </div>
          <div className={styles.metricCard}>
            <div className={styles.metricHead}>
              <span className={styles.metricLabel}>Contactados</span>
              <i className="ti ti-check" />
            </div>
            <div className={styles.metricNum}>{metrics.contactados}</div>
          </div>
          <div className={styles.metricCard}>
            <div className={styles.metricHead}>
              <span className={styles.metricLabel}>Agendados</span>
              <i className="ti ti-calendar" />
            </div>
            <div className={styles.metricNum}>{metrics.agendados}</div>
          </div>
        </section>

        <section className={styles.toolbar}>
          <div className={styles.toolbarTop}>
            <div className={styles.toolbarCol}>
              <label className={styles.searchWrap}>
                <i className="ti ti-search" />
                <input
                  type="search"
                  className={styles.searchInput}
                  placeholder="Buscar por nombre, teléfono o instagram..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </label>
            </div>
            <div className={styles.toolbarCol}>
              <div className={styles.toolbarFilters}>
                <div className={styles.filterField}>
                  <span className={styles.filterLabel}>Estado</span>
                  <select className={styles.select} value={estadoFilter} onChange={(e) => setEstadoFilter(e.target.value)}>
                    <option value="">Todos los estados</option>
                    {ESTADO_OPTIONS.map((estado) => (
                      <option key={estado} value={estado}>{formatEstadoLabel(estado)}</option>
                    ))}
                  </select>
                </div>
                <div className={styles.filterField}>
                  <span className={styles.filterLabel}>Zona</span>
                  <select className={styles.select} value={zonaFilter} onChange={(e) => setZonaFilter(e.target.value)}>
                    {ZONA_FILTER_OPTIONS.map((option) => (
                      <option key={option.value || 'all'} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
                <div className={styles.filterField}>
                  <span className={styles.filterLabel}>Día</span>
                  <input
                    type="date"
                    className={styles.select}
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                  />
                </div>
                {dateFilter && (
                  <button
                    type="button"
                    className={styles.btnClearDate}
                    onClick={() => setDateFilter('')}
                  >
                    Limpiar
                  </button>
                )}
              </div>
            </div>
          </div>
          <div className={styles.toolbarActions}>
            <span className={styles.leadCount}>{filteredLeads.length} leads mostrados</span>
            <button
              type="button"
              className={styles.btnExport}
              onClick={handleExport}
              disabled={filteredLeads.length === 0}
            >
              <i className="ti ti-download" />
              Exportar CSV
            </button>
            {!deleteAllConfirming ? (
              <button
                type="button"
                className={styles.btnDeleteAll}
                onClick={() => {
                  setDeleteAllConfirming(true)
                  setDeleteAllError(null)
                }}
                disabled={leads.length === 0}
              >
                <i className="ti ti-trash" />
                Eliminar todos
              </button>
            ) : (
              <div className={styles.deleteAllConfirm}>
                <span>¿Eliminar {leads.length} leads?</span>
                <button
                  type="button"
                  className={styles.btnDeleteAllConfirm}
                  onClick={handleConfirmDeleteAll}
                  disabled={deleteAllLoading}
                >
                  {deleteAllLoading ? 'Eliminando…' : 'Sí, eliminar'}
                </button>
                <button
                  type="button"
                  className={styles.btnDeleteAllCancel}
                  onClick={() => {
                    setDeleteAllConfirming(false)
                    setDeleteAllError(null)
                  }}
                  disabled={deleteAllLoading}
                >
                  Cancelar
                </button>
              </div>
            )}
            {deleteAllError && (
              <p className={styles.deleteAllError}>{deleteAllError}</p>
            )}
          </div>
        </section>

        <section className={styles.tableCard}>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Nombre</th>
                  <th>Instagram</th>
                  <th>Teléfono</th>
                  <th>Código</th>
                  <th>Accesos</th>
                  <th>Inversión</th>
                  <th>Estado</th>
                  <th>Fecha</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {filteredLeads.length === 0 ? (
                  <tr>
                    <td colSpan={10} className={styles.cellMuted}>No hay leads que coincidan</td>
                  </tr>
                ) : (
                  paginatedLeads.map((lead, index) => (
                    <tr key={lead.id} className={getRowClass(lead.calificado)} onClick={() => openPanel(lead)}>
                      <td className={styles.cellMuted}>{(currentPage - 1) * PAGE_SIZE + index + 1}</td>
                      <td className={styles.cellName}>{lead.name}</td>
                      <td className={styles.cellMuted}>
                        {lead.ig ? (lead.ig.startsWith('@') ? lead.ig : `@${lead.ig}`) : '—'}
                      </td>
                      <td>
                        <a
                          href={buildLeadWhatsappUrl(lead)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.waLink}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {lead.phone}
                        </a>
                      </td>
                      <td>
                        <span className={styles.accessCode}>{lead.access_code}</span>
                      </td>
                      <td className={styles.cellMuted}>{lead.access_count ?? 0}</td>
                      <td className={styles.cellMuted}>{formatInversion(lead)}</td>
                      <td>
                        <EstadoSelect lead={lead} onChange={handleEstadoChange} />
                      </td>
                      <td className={styles.cellMuted}>{formatDateShort(lead.created_at)}</td>
                      <td>
                        <button type="button" className={styles.rowAction} onClick={(e) => { e.stopPropagation(); openPanel(lead) }}>
                          <i className="ti ti-chevron-right" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {filteredLeads.length > 0 && (
            <footer className={styles.pagination}>
              <span className={styles.paginationInfo}>
                Mostrando {pageRangeStart}–{pageRangeEnd} de {filteredLeads.length}
              </span>
              <div className={styles.paginationControls}>
                <button
                  type="button"
                  className={styles.paginationBtn}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage <= 1}
                >
                  <i className="ti ti-chevron-left" />
                  Anterior
                </button>
                <span className={styles.paginationPage}>
                  Página {currentPage} de {totalPages}
                </span>
                <button
                  type="button"
                  className={styles.paginationBtn}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages}
                >
                  Siguiente
                  <i className="ti ti-chevron-right" />
                </button>
              </div>
            </footer>
          )}
        </section>
      </main>

      {showAnalytics && (
        <>
          <button
            type="button"
            className={styles.overlay}
            aria-label="Cerrar análisis"
            onClick={() => setShowAnalytics(false)}
          />
          <div className={styles.analyticsModal} role="dialog" aria-modal="true" aria-labelledby="analytics-title">
            <header className={styles.analyticsHeader}>
              <h2 id="analytics-title" className={styles.analyticsTitle}>Análisis de registrados</h2>
              <button
                type="button"
                className={styles.analyticsClose}
                onClick={() => setShowAnalytics(false)}
                aria-label="Cerrar"
              >
                <i className="ti ti-x" />
              </button>
            </header>
            <div className={styles.analyticsBody}>
              <AnalyticsCharts
                dailyData={dailyData}
                maxDaily={maxDaily}
                zonaData={zonaData}
                maxZona={maxZona}
                tiempoData={tiempoData}
                maxTiempo={maxTiempo}
                diasData={diasData}
                maxDias={maxDias}
                entrenamientosData={entrenamientosData}
                maxEntrenamientos={maxEntrenamientos}
                calificadosCount={metrics.calificadosCount}
                noCalificadosCount={metrics.noCalificadosCount}
              />
            </div>
          </div>
        </>
      )}

      {showResources && (
        <ResourcesPanel onClose={() => setShowResources(false)} />
      )}

      {selectedLead && (
        <>
          <button type="button" className={styles.overlay} aria-label="Cerrar panel" onClick={closePanel} />
          <aside className={`${styles.panel} ${getPanelClass(selectedLead.calificado)}`}>
            <header className={styles.panelHeader}>
              <div>
                <p className={styles.panelEyebrow}>Registro #{selectedLead.id}</p>
                <h2 className={styles.panelName}>{selectedLead.name}</h2>
                <p className={styles.panelDate}>{formatDateFull(selectedLead.created_at)}</p>
              </div>
              <button type="button" className={styles.panelClose} onClick={closePanel} aria-label="Cerrar">
                <i className="ti ti-x" />
              </button>
            </header>

            <div className={styles.panelBody}>
            <section className={styles.panelCard}>
              <h3 className={styles.panelSectionTitle}>Contacto</h3>
              <div className={styles.panelContactList}>
              <a href={`mailto:${selectedLead.email}`} className={styles.panelContactItem}>
                <i className="ti ti-mail" />
                <span>{selectedLead.email}</span>
              </a>
              <a href={buildLeadWhatsappUrl(selectedLead)} target="_blank" rel="noopener noreferrer" className={styles.panelContactItem}>
                <i className="ti ti-brand-whatsapp" />
                <span>{selectedLead.phone}</span>
              </a>
              {selectedLead.ig && (
                <a
                  href={igToUrl(selectedLead.ig)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.panelContactItem}
                >
                  <i className="ti ti-brand-instagram" />
                  <span>{selectedLead.ig.startsWith('@') ? selectedLead.ig : `@${selectedLead.ig}`}</span>
                </a>
              )}
              </div>
            </section>

            <section className={styles.panelCard}>
              <h3 className={styles.panelSectionTitle}>Clave de acceso</h3>
              <div className={styles.panelCodeBlock}>
                <div className={styles.panelAccessCode}>{selectedLead.access_code}</div>
                <p className={styles.panelMeta}>
                  Accesos con clave: {selectedLead.access_count ?? 0}
                </p>
                <div className={styles.codeActions}>
                  <button type="button" className={styles.btnCopyCode} onClick={handleCopyCode}>
                    {codeCopied ? 'Copiado' : 'Copiar'}
                  </button>
                  <button
                    type="button"
                    className={styles.btnRegenCode}
                    onClick={() => setRegenConfirming(true)}
                    disabled={regenLoading || regenConfirming}
                  >
                    <i className="ti ti-refresh" aria-hidden="true" />
                    Regenerar
                  </button>
                </div>
                {regenConfirming && (
                  <div className={styles.regenConfirmBox}>
                    <p className={styles.regenConfirmText}>
                      ¿Confirmar? La clave anterior quedará inválida.
                    </p>
                    <div className={styles.regenConfirmActions}>
                      <button
                        type="button"
                        className={styles.btnRegenConfirm}
                        onClick={handleConfirmRegenerar}
                        disabled={regenLoading}
                      >
                        {regenLoading ? 'Generando…' : 'Confirmar'}
                      </button>
                      <button
                        type="button"
                        className={styles.btnRegenCancel}
                        onClick={() => {
                          setRegenConfirming(false)
                          setRegenError(null)
                        }}
                        disabled={regenLoading}
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}
                {regenError && <p className={styles.regenError}>{regenError}</p>}
              </div>
            </section>

            <section className={styles.panelCard}>
              <h3 className={styles.panelSectionTitle}>Respuestas del quiz</h3>
              <div className={styles.panelFieldGrid}>
                {QUIZ_QUESTIONS.map((question) => {
                  const raw = selectedLead.quiz_answers?.[question.id]
                  const value = getQuizAnswerLabel(
                    question.id,
                    raw,
                    selectedLead.quiz_answers || {},
                  )
                  return (
                    <div key={question.id} className={styles.quizField}>
                      <span className={styles.quizLabel}>{QUIZ_FIELD_LABELS[question.id]}</span>
                      <div className={styles.quizValue}>{value || 'Sin completar'}</div>
                    </div>
                  )
                })}
              </div>
            </section>

            <section className={styles.panelCard}>
              <h3 className={styles.panelSectionTitle}>Estado CRM</h3>
              <EstadoSelect lead={selectedLead} onChange={handleEstadoChange} />
              <div className={styles.statusBadges}>
                <TipoLeadBadge lead={selectedLead} />
                <CalificadoBadge calificado={selectedLead.calificado} />
              </div>
            </section>

            <section className={styles.panelCard}>
              <h3 className={styles.panelSectionTitle}>Notas internas</h3>
              <textarea
                className={styles.notesArea}
                value={noteDraft}
                onChange={(e) => setNoteDraft(e.target.value)}
                placeholder="Agregar notas sobre este registrado..."
                rows={4}
              />
              <button type="button" className={styles.btnSaveNote} onClick={saveNote}>
                Guardar nota
              </button>
            </section>

            <section className={`${styles.panelCard} ${styles.panelCardDanger}`}>
              <h3 className={styles.panelSectionTitle}>Eliminar registrado</h3>
              {!deleteConfirming ? (
                <button
                  type="button"
                  className={styles.btnDeleteLead}
                  onClick={() => setDeleteConfirming(true)}
                  disabled={deleteLoading}
                >
                  <i className="ti ti-trash" />
                  Eliminar registro
                </button>
              ) : (
                <div className={styles.deleteConfirmBox}>
                  <p className={styles.deleteConfirmText}>
                    ¿Eliminar a {selectedLead.name}? Esta acción no se puede deshacer.
                  </p>
                  <div className={styles.deleteConfirmActions}>
                    <button
                      type="button"
                      className={styles.btnDeleteConfirm}
                      onClick={handleConfirmDelete}
                      disabled={deleteLoading}
                    >
                      {deleteLoading ? 'Eliminando…' : 'Sí, eliminar'}
                    </button>
                    <button
                      type="button"
                      className={styles.btnDeleteCancel}
                      onClick={() => {
                        setDeleteConfirming(false)
                        setDeleteError(null)
                      }}
                      disabled={deleteLoading}
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
              {deleteError && <p className={styles.deleteError}>{deleteError}</p>}
            </section>
            </div>
          </aside>
        </>
      )}
      </div>
    </div>
  )
}
