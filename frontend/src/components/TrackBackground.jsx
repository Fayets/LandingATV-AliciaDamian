import styles from './TrackBackground.module.css'

/**
 * Fondo ambiental de las vistas públicas: hielo azulado con dos focos de
 * luz muy suaves. Antes era una fotografía oscurecida; con el tema claro
 * la imagen competía con el contenido, así que el fondo pasa a ser aire.
 *
 * Lo usan la landing, /recurso, el login y el admin.
 */
export default function TrackBackground() {
  return (
    <div className={styles.bg} aria-hidden="true">
      <div className={styles.wash} />
    </div>
  )
}
