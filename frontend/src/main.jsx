import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

const META_PIXEL_ID = import.meta.env.VITE_META_PIXEL_ID

if (META_PIXEL_ID && typeof window !== 'undefined') {
  /* Meta Pixel.
     fbevents.js cuesta 1,3 s de CPU en un movil de gama media y competia con
     el primer pintado. El truco esta en que el stub de fbq encola las
     llamadas: podemos registrar init y PageView de inmediato y traer el
     script despues, que al cargar vacia la cola. No se pierde ningun evento,
     solo se envian unos segundos mas tarde.

     Se dispara con lo que ocurra antes: la primera interaccion del visitante
     o el primer hueco libre del navegador, con tope de 3 s para que tambien
     salga en visitas sin interaccion. */
  /* eslint-disable */
  !(function (f, b, e, v, n, t, s) {
    if (f.fbq) return
    n = f.fbq = function () {
      n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments)
    }
    if (!f._fbq) f._fbq = n
    n.push = n
    n.loaded = !0
    n.version = '2.0'
    n.queue = []
  })(window, document, 'script')
  /* eslint-enable */

  window.fbq('init', META_PIXEL_ID)
  window.fbq('track', 'PageView')

  let pedido = false
  const traerPixel = () => {
    if (pedido) return
    pedido = true
    const s = document.createElement('script')
    s.async = true
    s.src = 'https://connect.facebook.net/en_US/fbevents.js'
    document.head.appendChild(s)
  }

  const interacciones = ['pointerdown', 'keydown', 'touchstart', 'scroll']
  const alInteractuar = () => {
    interacciones.forEach((ev) => window.removeEventListener(ev, alInteractuar))
    traerPixel()
  }
  interacciones.forEach((ev) =>
    window.addEventListener(ev, alInteractuar, { once: true, passive: true }),
  )

  /* Sin interaccion ninguna, se trae pasado un margen desde que la pagina
     termina de cargar. Tiene que ser un temporizador y no requestIdleCallback:
     ese dispara en cuanto hay un hueco libre —que llega enseguida— y su
     timeout es un maximo, no un minimo, asi que el script acababa compitiendo
     igual con el primer pintado. */
  const porSuCuenta = () => setTimeout(traerPixel, 4000)
  if (document.readyState === 'complete') porSuCuenta()
  else window.addEventListener('load', porSuCuenta, { once: true })
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
