import { APP_NAME } from '../config/app'

const AREA_FIELD_MAP = {
  Marketing: 'bottleneck_marketing',
  Ventas: 'bottleneck_ventas',
  Producto: 'bottleneck_producto',
  Sistemas: 'bottleneck_sistemas',
}

const STATUS_LABELS = {
  all: 'Todos',
  pending: 'Pendientes',
  contacted: 'Contactados',
  complete: 'Completos',
  'solo-datos': 'Solo datos',
  calificado: 'Calificados',
  'no-calificado': 'No calificados',
}

function parseUtcDate(iso) {
  if (!iso) return new Date(NaN)
  if (iso.endsWith('Z') || /[+-]\d{2}:\d{2}$/.test(iso)) return new Date(iso)
  return new Date(`${iso}Z`)
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

function exportStamp() {
  return new Date().toLocaleString('es-AR', {
    timeZone: 'America/Argentina/Buenos_Aires',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function fileDateSuffix() {
  return new Date().toLocaleDateString('en-CA', {
    timeZone: 'America/Argentina/Buenos_Aires',
  })
}

function downloadFile(filename, content, mime) {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function isLeadComplete(lead) {
  return lead.avatar != null && lead.avatar !== ''
}

function formatCalificado(calificado) {
  if (calificado === true) return 'Calificado'
  if (calificado === false) return 'No calificado'
  return 'Sin calificar'
}

function formatTipoLead(lead) {
  return isLeadComplete(lead) ? 'Completo' : 'Solo datos'
}

function formatList(values) {
  if (!values || values.length === 0) return '—'
  return values.join(', ')
}

function formatBottleneckText(lead) {
  const areas = lead.bottleneck_areas || []
  if (areas.length === 0) return 'Sin completar'

  return areas.map((area) => {
    const field = AREA_FIELD_MAP[area]
    const subs = field ? (lead[field] || []) : []
    const detail = subs.length > 0 ? subs.join('; ') : 'Sin detalle'
    return `${area}: ${detail}`
  }).join('\n  ')
}

function describeActiveFilters(filters = {}) {
  const parts = []

  if (filters.search?.trim()) parts.push(`Búsqueda: "${filters.search.trim()}"`)
  if (filters.areaFilter) parts.push(`Área: ${filters.areaFilter}`)
  if (filters.responsableFilter) parts.push(`Responsable: ${filters.responsableFilter}`)
  if (filters.avatarFilter) parts.push(`Avatar: ${filters.avatarFilter}`)
  if (filters.revenueFilter) parts.push(`Facturación: ${filters.revenueFilter}`)
  if (filters.dateFilter) parts.push(`Día: ${filters.dateFilter}`)
  if (filters.statusFilter && filters.statusFilter !== 'all') {
    parts.push(`Estado: ${STATUS_LABELS[filters.statusFilter] || filters.statusFilter}`)
  }

  return parts.length > 0 ? parts.join(' · ') : 'Sin filtros activos'
}

function countByResponsable(leads) {
  return leads.reduce((acc, lead) => {
    const key = lead.responsable || 'Sin asignar'
    acc[key] = (acc[key] || 0) + 1
    return acc
  }, {})
}

function formatResponsableSummary(counts) {
  const entries = Object.entries(counts)
  if (entries.length === 0) return 'Sin asignar: 0'
  return entries.map(([name, count]) => `${name}: ${count}`).join(' · ')
}

function computeSummary(leads) {
  return {
    total: leads.length,
    calificados: leads.filter((l) => l.calificado === true).length,
    noCalificados: leads.filter((l) => l.calificado === false).length,
    sinCalificar: leads.filter((l) => l.calificado == null).length,
    completos: leads.filter(isLeadComplete).length,
    soloDatos: leads.filter((l) => !isLeadComplete(l)).length,
    contactados: leads.filter((l) => l.contacted).length,
    pendientes: leads.filter((l) => !l.contacted).length,
    responsables: countByResponsable(leads),
    totalAccesos: leads.reduce((sum, l) => sum + (l.access_count ?? 0), 0),
  }
}

function buildReportMeta(leads, filters) {
  return {
    generatedAt: exportStamp(),
    filtersText: describeActiveFilters(filters),
    summary: computeSummary(leads),
  }
}

function buildLeadBlockText(lead) {
  const lines = [
    `${'═'.repeat(52)}`,
    `REGISTRO #${lead.id} — ${lead.name}`,
    `${'═'.repeat(52)}`,
    '',
    `Fecha de registro: ${formatDateFull(lead.created_at)}`,
    `Estado: ${lead.contacted ? 'Contactado' : 'Pendiente'} · ${formatTipoLead(lead)} · ${formatCalificado(lead.calificado)}`,
    `Responsable: ${lead.responsable || 'Sin asignar'}`,
    '',
    'Contacto',
    `  Email: ${lead.email}`,
    `  WhatsApp: ${lead.phone}`,
    `  Instagram: ${lead.ig ? (lead.ig.startsWith('@') ? lead.ig : `@${lead.ig}`) : '—'}`,
    '',
    'Acceso',
    `  Clave: ${lead.access_code}`,
    `  Accesos con clave: ${lead.access_count ?? 0}`,
    '',
    'Quiz',
    `  Avatar: ${lead.avatar || 'Sin completar'}`,
    `  Facturación: ${lead.revenue || 'Sin completar'}`,
    '',
    'Cuello de botella',
    `  ${formatBottleneckText(lead).replace(/\n/g, '\n  ')}`,
    '',
    'Notas internas',
    `  ${(lead.notes || '').trim() || '—'}`,
    '',
  ]
  return lines.join('\n')
}

export function buildLeadsReportText(leads, filters = {}) {
  const meta = buildReportMeta(leads, filters)
  const { summary } = meta

  const header = [
    `${APP_NAME.toUpperCase()} — REPORTE DE REGISTRADOS`,
    `Generado: ${meta.generatedAt}`,
    `Registros incluidos: ${summary.total}`,
    `Filtros: ${meta.filtersText}`,
    '',
    '── RESUMEN ──',
    `Total: ${summary.total}`,
    `Calificados: ${summary.calificados} · No calificados: ${summary.noCalificados} · Sin calificar: ${summary.sinCalificar}`,
    `Completos: ${summary.completos} · Solo datos: ${summary.soloDatos}`,
    `Contactados: ${summary.contactados} · Pendientes: ${summary.pendientes}`,
    `Responsables: ${formatResponsableSummary(summary.responsables)}`,
    `Accesos totales con clave: ${summary.totalAccesos}`,
    '',
  ].join('\n')

  if (leads.length === 0) {
    return `${header}\nNo hay registrados que coincidan con la selección actual.\n`
  }

  return `${header}${leads.map(buildLeadBlockText).join('\n')}`
}

export function downloadLeadsTxt(leads, filters = {}) {
  const content = buildLeadsReportText(leads, filters)
  downloadFile(`registrados-${fileDateSuffix()}.txt`, content, 'text/plain;charset=utf-8')
}
