import { useCallback, useEffect, useState } from 'react'
import {
  createResourceVariation,
  getDynamicResources,
  getLandingCierres,
  updateDynamicResource,
  updateLandingCierres,
  updateResourceVariation,
} from '../../api/admin'
import './ResourcesPanel.css'

const DEFAULT_CIERRES = {
  1: 'Recordá que el running es para disfrutar. No se trata de competir con otras, sino de disfrutar el proceso.',
  2: 'Ahora tenés el plan para llegar fuerte a tu carrera. Es el momento de comprometerte y entrenar con propósito.',
  3: 'Vos tenés todo para romper ese techo. Este plan es el que te va a llevar al siguiente nivel.',
}

const FRENOS = ['fisico', 'mentalidad', 'estructura']

export default function ResourcesPanel({ landingSlug }) {
  const [resources, setResources] = useState([])
  const [cierres, setCierres] = useState(DEFAULT_CIERRES)
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState(null)
  const [editData, setEditData] = useState({})
  const [error, setError] = useState(null)
  const [message, setMessage] = useState(null)
  const [saving, setSaving] = useState(false)

  const fetchResources = useCallback(async () => {
    setError(null)
    try {
      const [resourcesData, cierresData] = await Promise.all([
        getDynamicResources(landingSlug),
        getLandingCierres(landingSlug),
      ])
      setResources(resourcesData)
      setCierres({ ...DEFAULT_CIERRES, ...(cierresData.cierres || {}) })
    } catch (err) {
      setError(err.message || 'No se pudieron cargar los recursos')
    } finally {
      setLoading(false)
    }
  }, [landingSlug])

  useEffect(() => {
    fetchResources()
  }, [fetchResources])

  const resetEdit = () => {
    setEditingId(null)
    setEditData({})
  }

  const handleEditResource = (resource) => {
    setEditingId(`resource-${resource.id}`)
    setEditData({
      name: resource.name || '',
      description: resource.description || '',
      base_content: resource.base_content || '',
    })
    setMessage(null)
  }

  const handleSaveResource = async (resourceId) => {
    setSaving(true)
    setError(null)
    setMessage(null)
    try {
      await updateDynamicResource(resourceId, editData)
      resetEdit()
      setMessage('Recurso actualizado')
      await fetchResources()
    } catch (err) {
      setError(err.message || 'No se pudo guardar el recurso')
    } finally {
      setSaving(false)
    }
  }

  const handleEditVariation = (variation) => {
    setEditingId(`variation-${variation.id}`)
    setEditData({
      intro_text: variation.intro_text || '',
      note_text: variation.note_text || '',
    })
    setMessage(null)
  }

  const handleSaveVariation = async (variationId) => {
    setSaving(true)
    setError(null)
    setMessage(null)
    try {
      await updateResourceVariation(variationId, editData)
      resetEdit()
      setMessage('Variante actualizada')
      await fetchResources()
    } catch (err) {
      setError(err.message || 'No se pudo guardar la variante')
    } finally {
      setSaving(false)
    }
  }

  const handleCreateMissingVariation = async (resource, frenoCategory) => {
    setSaving(true)
    setError(null)
    setMessage(null)
    try {
      await createResourceVariation(resource.id, {
        freno_category: frenoCategory,
        intro_text: `Intro para ${frenoCategory} — editá este texto.`,
        note_text: '',
      })
      setMessage(`Variante ${frenoCategory} creada`)
      await fetchResources()
    } catch (err) {
      setError(err.message || 'No se pudo crear la variante')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveCierres = async () => {
    setSaving(true)
    setError(null)
    setMessage(null)
    try {
      await updateLandingCierres(landingSlug, {
        1: cierres[1] || '',
        2: cierres[2] || '',
        3: cierres[3] || '',
      })
      setMessage('Cierres actualizados')
    } catch (err) {
      setError(err.message || 'No se pudieron guardar los cierres')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="resources-panel">Cargando recursos...</div>

  return (
    <div className="resources-panel">
      <h2>Gestión de Recursos</h2>
      {error && <p className="resources-panel__error">{error}</p>}
      {message && <p className="resources-panel__success">{message}</p>}

      <section className="cierres-card">
        <h3>Cierres por objetivo (P2)</h3>
        <div className="cierres-edit">
          {[1, 2, 3].map((objetivo) => (
            <div key={objetivo} className="cierres-item">
              <label htmlFor={`cierre-${objetivo}`}>Objetivo {objetivo}</label>
              <textarea
                id={`cierre-${objetivo}`}
                rows={3}
                value={cierres[objetivo] || ''}
                onChange={(e) => setCierres((prev) => ({ ...prev, [objetivo]: e.target.value }))}
              />
            </div>
          ))}
        </div>
        <div className="cierres-actions">
          <button type="button" onClick={handleSaveCierres} disabled={saving}>
            Guardar cierres
          </button>
        </div>
      </section>

      {resources.map((resource) => {
        const existingFrenos = new Set(resource.variations.map((item) => item.freno_category))
        const missingFrenos = FRENOS.filter((freno) => !existingFrenos.has(freno))

        return (
          <div key={resource.id} className="resource-card">
            <div className="resource-header">
              <h3>
                Recurso {resource.level} — {resource.name}
              </h3>
              {editingId === `resource-${resource.id}` ? (
                <div>
                  <button type="button" onClick={() => handleSaveResource(resource.id)} disabled={saving}>
                    Guardar
                  </button>
                  <button type="button" className="secondary" onClick={resetEdit} disabled={saving}>
                    Cancelar
                  </button>
                </div>
              ) : (
                <button type="button" onClick={() => handleEditResource(resource)} disabled={saving}>
                  Editar
                </button>
              )}
            </div>

            {editingId === `resource-${resource.id}` ? (
              <div className="edit-form">
                <input
                  type="text"
                  placeholder="Nombre"
                  value={editData.name || ''}
                  onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                />
                <textarea
                  placeholder="Descripción"
                  value={editData.description || ''}
                  onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                  rows={3}
                />
                <textarea
                  placeholder="Contenido base"
                  value={editData.base_content || ''}
                  onChange={(e) => setEditData({ ...editData, base_content: e.target.value })}
                  rows={8}
                />
              </div>
            ) : (
              <div className="resource-content">
                <p><strong>Descripción:</strong> {resource.description || '—'}</p>
                <p>
                  <strong>Contenido base (primeras 100 chars):</strong>{' '}
                  {resource.base_content
                    ? `${resource.base_content.substring(0, 100)}${resource.base_content.length > 100 ? '...' : ''}`
                    : '—'}
                </p>
              </div>
            )}

            <div className="variations">
              <h4>Intros por freno</h4>
              {resource.variations.map((variation) => (
                <div key={variation.id} className="variation-item">
                  <div className="variation-header">
                    <strong>{variation.freno_category}</strong>
                    {editingId === `variation-${variation.id}` ? (
                      <div>
                        <button type="button" onClick={() => handleSaveVariation(variation.id)} disabled={saving}>
                          Guardar
                        </button>
                        <button type="button" className="secondary" onClick={resetEdit} disabled={saving}>
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <button type="button" onClick={() => handleEditVariation(variation)} disabled={saving}>
                        Editar
                      </button>
                    )}
                  </div>

                  {editingId === `variation-${variation.id}` ? (
                    <div className="variation-edit">
                      <textarea
                        placeholder="Intro text"
                        value={editData.intro_text || ''}
                        onChange={(e) => setEditData({ ...editData, intro_text: e.target.value })}
                        rows={3}
                      />
                      <textarea
                        placeholder="Nota del día (opcional)"
                        value={editData.note_text || ''}
                        onChange={(e) => setEditData({ ...editData, note_text: e.target.value })}
                        rows={2}
                      />
                    </div>
                  ) : (
                    <div className="variation-view">
                      <p>{variation.intro_text}</p>
                      {variation.note_text && <p className="note">{variation.note_text}</p>}
                    </div>
                  )}
                </div>
              ))}

              {missingFrenos.length > 0 && (
                <div className="variation-item">
                  <p>Faltan variantes: {missingFrenos.join(', ')}</p>
                  {missingFrenos.map((freno) => (
                    <button
                      key={freno}
                      type="button"
                      onClick={() => handleCreateMissingVariation(resource, freno)}
                      disabled={saving}
                    >
                      Crear intro {freno}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
