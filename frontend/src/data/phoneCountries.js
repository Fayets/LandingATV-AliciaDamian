export function countryFlag(iso) {
  if (!iso || iso.length !== 2) return '🌐'
  const code = iso.toUpperCase()
  return String.fromCodePoint(...[...code].map((c) => 127397 + c.charCodeAt(0)))
}

export const PHONE_COUNTRIES = [
  { iso: 'AR', name: 'Argentina', dial: '54' },
  { iso: 'BO', name: 'Bolivia', dial: '591' },
  { iso: 'BR', name: 'Brasil', dial: '55' },
  { iso: 'CL', name: 'Chile', dial: '56' },
  { iso: 'CO', name: 'Colombia', dial: '57' },
  { iso: 'CR', name: 'Costa Rica', dial: '506' },
  { iso: 'CU', name: 'Cuba', dial: '53' },
  { iso: 'EC', name: 'Ecuador', dial: '593' },
  { iso: 'SV', name: 'El Salvador', dial: '503' },
  { iso: 'ES', name: 'España', dial: '34' },
  { iso: 'US', name: 'Estados Unidos', dial: '1' },
  { iso: 'GT', name: 'Guatemala', dial: '502' },
  { iso: 'HN', name: 'Honduras', dial: '504' },
  { iso: 'MX', name: 'México', dial: '52' },
  { iso: 'NI', name: 'Nicaragua', dial: '505' },
  { iso: 'PA', name: 'Panamá', dial: '507' },
  { iso: 'PY', name: 'Paraguay', dial: '595' },
  { iso: 'PE', name: 'Perú', dial: '51' },
  { iso: 'DO', name: 'Rep. Dominicana', dial: '1' },
  { iso: 'UY', name: 'Uruguay', dial: '598' },
  { iso: 'VE', name: 'Venezuela', dial: '58' },
  { iso: 'CA', name: 'Canadá', dial: '1' },
  { iso: 'GB', name: 'Reino Unido', dial: '44' },
  { iso: 'DE', name: 'Alemania', dial: '49' },
  { iso: 'FR', name: 'Francia', dial: '33' },
  { iso: 'IT', name: 'Italia', dial: '39' },
  { iso: 'PT', name: 'Portugal', dial: '351' },
  { iso: 'NL', name: 'Países Bajos', dial: '31' },
  { iso: 'CH', name: 'Suiza', dial: '41' },
  { iso: 'AU', name: 'Australia', dial: '61' },
  { iso: 'NZ', name: 'Nueva Zelanda', dial: '64' },
  { iso: 'IL', name: 'Israel', dial: '972' },
  { iso: 'AE', name: 'Emiratos Árabes', dial: '971' },
  { iso: 'IN', name: 'India', dial: '91' },
  { iso: 'JP', name: 'Japón', dial: '81' },
  { iso: 'CN', name: 'China', dial: '86' },
  { iso: 'KR', name: 'Corea del Sur', dial: '82' },
  { iso: 'ZA', name: 'Sudáfrica', dial: '27' },
]

/** España por defecto: el público de Alicia está en España. */
export const DEFAULT_COUNTRY = PHONE_COUNTRIES.find((c) => c.iso === 'ES') || PHONE_COUNTRIES[0]

export function buildFullPhone(country, localValue) {
  const digits = localValue.replace(/\D/g, '')
  if (!digits) return ''
  return `+${country.dial}${digits}`
}

export function parsePhoneValue(value) {
  if (!value) {
    return { country: DEFAULT_COUNTRY, local: '' }
  }

  const digits = value.replace(/\D/g, '')
  if (!digits) {
    return { country: DEFAULT_COUNTRY, local: '' }
  }

  const sorted = [...PHONE_COUNTRIES].sort((a, b) => b.dial.length - a.dial.length)
  for (const country of sorted) {
    if (digits.startsWith(country.dial)) {
      return {
        country,
        local: digits.slice(country.dial.length),
      }
    }
  }

  return { country: DEFAULT_COUNTRY, local: digits }
}
