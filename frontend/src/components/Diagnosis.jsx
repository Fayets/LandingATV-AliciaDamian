import { useEffect, useMemo, useState } from 'react'
import styles from './Diagnosis.module.css'

const LOADING_MESSAGES = [
  'Analizando tus respuestas...',
  'Identificando tu perfil de negocio...',
  'Detectando tu cuello de botella real...',
  'Cruzando tu perfil con +1.200 casos...',
  'Evaluando el impacto en tu facturación...',
  'Comparando con patrones similares...',
  'Armando tu diagnóstico...',
  'Finalizando análisis...',
]

const AVATAR_OPENING = {
  'Creador de contenido': 'Tenés alcance. Lo que no tenés es un sistema que convierta eso en clientes.',
  'Creador de contenido con infoproducto': 'Ya dejaste de ser solo un creador. El problema ahora es de negocio, no de contenido.',
  'Experto en infoproducto / Growth Operator': 'Sabés lo que hacés. El problema no es la habilidad, es la estructura alrededor.',
  'Dueño de Negocio': 'Tenés negocio. Lo que falta es que deje de depender 100% de vos.',
  'Dueño de Agencia': 'Tenés clientes. La pregunta es si tu agencia escala o si solo escalás vos trabajando más horas.',
  'Habilidades de alto valor (setter, closer, content, etc.)': 'Tenés la habilidad. Lo que te falta es el sistema que la multiplique.',
  'Otro': 'Tu negocio tiene potencial. El problema está en algo puntual que podemos identificar.',
}

const AREA_BODY = {
  Marketing: 'En marketing: estás generando movimiento, pero no el tipo de movimiento que se convierte en plata. Esto no se arregla con más contenido — se arregla con sistema. La mayoría de los negocios en tu situación confunden "estar activos" con "estar generando demanda real", y son cosas completamente distintas.',
  Ventas: 'En ventas: el problema no es que falten leads, es que los que llegan no se convierten. Cada conversación que no cierra es una oportunidad que ya pagaste y no cobraste. Sin un proceso de ventas estructurado, estás dejando que cada conversación dependa de tu estado de ánimo del día, no de un sistema repetible.',
  Producto: 'En producto: tu oferta tiene una fuga. Mientras no la cierres, todo lo que metas en marketing y ventas se va a filtrar por el mismo agujero. No importa cuánta gente entre arriba del embudo si la base no retiene ni convierte resultados en testimonios que vendan solos.',
  Sistemas: 'En sistemas: todo pasa por vos. Eso no es un negocio, es un trabajo que te disfrazaste de empresario. Si mañana te enfermás una semana, tu facturación de ese mes se cae — y eso no es un negocio escalable, es una dependencia operativa con tu nombre.',
}

const CONTEXT_PARAGRAPH = 'Esto no es casualidad ni mala suerte. Es un patrón que vemos una y otra vez en negocios con tu mismo perfil — y la buena noticia es que tiene solución concreta, no genérica.'

const REVENUE_CLOSING = {
  '$0 a $1k': 'Estás en la etapa donde cada decisión cuenta el doble. Resolver esto ahora te evita meses de esfuerzo sin retorno.',
  '$1k a $5k': 'Esto no se resuelve facturando más. Se resuelve resolviendo esto primero — sino, vas a seguir en el mismo lugar facturando más esfuerzo, no más resultado.',
  '$5k a $10k': 'Estás en el momento exacto donde esto se corrige rápido o se vuelve un techo de cristal. Cada mes que pasa sin resolverlo, se hace más caro de corregir.',
  '$10k a $30k': 'A este nivel, el problema ya no es chico. Si no lo corregís ahora, no vas a escalar — vas a repetir el mismo error con más volumen.',
  '$30k a $50k': 'Llegaste hasta acá a pesar de esto, no gracias a esto. Imaginate lo que cambia cuando dejes de cargar con este problema.',
  '+$50k': 'El problema en este nivel no es de esfuerzo, es de estructura. Lo que te trajo hasta acá no te va a llevar al siguiente nivel.',
}

const DIAGNOSIS_CTA = 'Esto es exactamente lo que vemos en consultoría: el problema nunca es lo que la persona cree que es. Si querés que lo revisemos juntos, dale Continuar.'

function buildDiagnosisText(answers) {
  const opening = AVATAR_OPENING[answers.avatar] || AVATAR_OPENING['Otro']
  const bodyParts = answers.bottleneckAreas.map((area) => AREA_BODY[area]).filter(Boolean)
  const closing = REVENUE_CLOSING[answers.revenue] || ''
  return {
    opening,
    bodyParts,
    context: CONTEXT_PARAGRAPH,
    closing,
    cta: DIAGNOSIS_CTA,
  }
}

function formatDiagnosisString(diagnosis) {
  return [diagnosis.opening, ...diagnosis.bodyParts, diagnosis.context, diagnosis.closing, diagnosis.cta]
    .filter(Boolean)
    .join('\n\n')
}

export default function Diagnosis({ answers, onContinue }) {
  const [phase, setPhase] = useState('loading')
  const [messageIndex, setMessageIndex] = useState(0)

  const diagnosis = useMemo(() => buildDiagnosisText(answers), [answers])

  useEffect(() => {
    const messageTimer = setInterval(() => {
      setMessageIndex((i) => (i + 1) % LOADING_MESSAGES.length)
    }, 930)

    const doneTimer = setTimeout(() => {
      setPhase('result')
    }, 7500)

    return () => {
      clearInterval(messageTimer)
      clearTimeout(doneTimer)
    }
  }, [])

  const handleContinue = () => {
    onContinue(formatDiagnosisString(diagnosis))
  }

  return (
    <div className={styles.card}>
      {phase === 'loading' ? (
        <div className={styles.loadingBody}>
          <i className={`ti ti-loader-2 ${styles.spinner}`} />
          <p className={styles.loadingText}>{LOADING_MESSAGES[messageIndex]}</p>
        </div>
      ) : (
        <>
          <div className={styles.resultBody}>
            <span className={styles.eyebrow}>Diagnóstico crítico</span>
            <p className={styles.opening}>{diagnosis.opening}</p>
            {diagnosis.bodyParts.map((part) => (
              <p key={part} className={styles.bodyText}>{part}</p>
            ))}
            <p className={styles.bodyText}>{diagnosis.context}</p>
            {diagnosis.closing && (
              <p className={styles.closing}>{diagnosis.closing}</p>
            )}
            <p className={styles.cta}>{diagnosis.cta}</p>
          </div>
          <div className={styles.footer}>
            <button type="button" className={styles.nextBtn} onClick={handleContinue}>
              Continuar
              <i className="ti ti-arrow-right" />
            </button>
          </div>
        </>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
