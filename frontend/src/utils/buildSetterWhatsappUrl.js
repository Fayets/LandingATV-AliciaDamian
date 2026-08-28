const COURSE_URL = import.meta.env.VITE_COURSE_URL || import.meta.env.VITE_LANDING_URL || ''
const ZWSP = '\u200B'

// WhatsApp genera preview de links detectados. Los ZWSP evitan que lo reconozca como URL.
function urlWithoutPreview(url) {
  return url.replace(/([./:])/g, `$1${ZWSP}`)
}

function getFirstName(name) {
  return (name || '').trim().split(/\s+/)[0] || ''
}

function getLeadProblema(lead) {
  const subs = [
    ...(lead.bottleneck_marketing || []),
    ...(lead.bottleneck_ventas || []),
    ...(lead.bottleneck_producto || []),
    ...(lead.bottleneck_sistemas || []),
  ]
  if (subs.length > 0) return subs[0].toLowerCase()
  if (lead.avatar) return lead.avatar.toLowerCase()
  const areas = (lead.bottleneck_areas || []).join(' y ')
  if (areas) return `problemas en ${areas}`.toLowerCase()
  return 'tu situación'
}

function isLeadComplete(lead) {
  return lead.avatar != null && lead.avatar !== ''
}

function buildSoloDatosMessage(lead) {
  const nombre = getFirstName(lead.name)
  return (
    `hola ${nombre}\n\n` +
    'te escribo porque empezaste a completar el formulario y no quiero que pierdas tu acceso.\n\n' +
    '¿lo dejaste por algo puntual o se te complicó?\n\n' +
    'avisame y lo resolvemos por acá'
  )
}

function buildCompletoMessage(lead) {
  const link = urlWithoutPreview(COURSE_URL)
  const problema = getLeadProblema(lead)
  return (
    `hola, ¿cómo andás?\n\n` +
    (link ? `te dejo el link:\n${link}\n\n` : '') +
    `vi que venías con ${problema}. contame un poco más para ayudarte con los próximos pasos.\n\n` +
    'mandame un audio si querés'
  )
}

export function buildSetterWhatsappMessage(lead) {
  if (isLeadComplete(lead)) return buildCompletoMessage(lead)
  return buildSoloDatosMessage(lead)
}

export function buildSetterWhatsappUrl(lead) {
  const digits = (lead.phone || '').replace(/\D/g, '')
  const text = encodeURIComponent(buildSetterWhatsappMessage(lead))
  return `https://wa.me/${digits}?text=${text}`
}
