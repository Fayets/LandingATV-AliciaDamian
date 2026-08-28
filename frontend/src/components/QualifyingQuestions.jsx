import { useState } from 'react'
import styles from './QualifyingQuestions.module.css'

const QUALIFYING_FIELDS = [
  { id: 'agendas', label: '¿Cuántas agendas generás por mes?' },
  { id: 'conversaciones', label: '¿Cuántas conversaciones de venta tenés por mes?' },
  { id: 'pctAgenda', label: '¿Qué % de esas conversaciones se convierten en agenda?' },
  { id: 'pctCierre', label: '¿Qué % de tus agendas terminan en cierre?' },
  { id: 'pctShowUp', label: '¿Qué % de tus agendados efectivamente se presentan a la llamada?' },
]

const INITIAL_DATA = {
  agendas: '',
  conversaciones: '',
  pctAgenda: '',
  pctCierre: '',
  pctShowUp: '',
}

export default function QualifyingQuestions({ onComplete }) {
  const [data, setData] = useState(INITIAL_DATA)

  const canSubmit = QUALIFYING_FIELDS.every(({ id }) => data[id] !== '' && data[id] != null)

  const handleChange = (id, value) => {
    setData((prev) => ({ ...prev, [id]: value }))
  }

  const handleSubmit = () => {
    if (!canSubmit) return
    onComplete(data)
  }

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div className={styles.stepLabel}>Último paso</div>
        <div className={styles.title}>Contanos un poco más sobre tu operación</div>
      </div>

      <div className={styles.body}>
        {QUALIFYING_FIELDS.map(({ id, label }) => (
          <div key={id} className={styles.field}>
            <label className={styles.label} htmlFor={id}>{label}</label>
            <input
              id={id}
              className={styles.input}
              type="number"
              min="0"
              value={data[id]}
              onChange={(e) => handleChange(id, e.target.value)}
            />
          </div>
        ))}
      </div>

      <div className={styles.footer}>
        <button
          type="button"
          className={styles.nextBtn}
          onClick={handleSubmit}
          disabled={!canSubmit}
        >
          <span>Quiero mi diagnóstico</span>
          <i className="ti ti-arrow-right" />
        </button>
      </div>
    </div>
  )
}
