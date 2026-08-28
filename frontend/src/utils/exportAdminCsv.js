import { getQuizAnswerLabel } from '../data/landingQuiz'

function escapeCsv(value) {
  const text = value == null ? '' : String(value)
  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`
  }
  return text
}

function formatCalificado(calificado) {
  if (calificado === true) return 'Calificado'
  if (calificado === false) return 'No calificado'
  return 'Sin calificar'
}

function formatDate(iso) {
  if (!iso) return ''
  const normalized = iso.endsWith('Z') ? iso : `${iso}Z`
  return new Date(normalized).toLocaleString('es-AR')
}

export function buildAdminLeadsCsv(leads) {
  const headers = [
    'id',
    'nombre',
    'email',
    'telefono',
    'instagram',
    'codigo',
    'accesos',
    'inversion',
    'calificado',
    'estado',
    'fecha',
  ]

  const rows = leads.map((lead) => [
    lead.id,
    lead.name,
    lead.email,
    lead.phone,
    lead.ig || '',
    lead.access_code,
    lead.access_count ?? 0,
    getQuizAnswerLabel(
      'step_5_inversion',
      Number(lead.step_5_inversion ?? lead.quiz_answers?.step_5_inversion),
      lead.quiz_answers || {},
    ) || '',
    formatCalificado(lead.calificado),
    lead.estado || 'pendiente',
    formatDate(lead.created_at),
  ])

  return [
    headers.join(','),
    ...rows.map((row) => row.map(escapeCsv).join(',')),
  ].join('\n')
}

export function downloadAdminLeadsCsv(leads) {
  const content = buildAdminLeadsCsv(leads)
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `leads-${new Date().toISOString().slice(0, 10)}.csv`
  anchor.click()
  URL.revokeObjectURL(url)
}
