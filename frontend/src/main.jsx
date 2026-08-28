import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

const META_PIXEL_ID = import.meta.env.VITE_META_PIXEL_ID

if (META_PIXEL_ID && typeof window !== 'undefined') {
  /* Meta Pixel — se inicializa solo si VITE_META_PIXEL_ID está configurado */
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
    t = b.createElement(e)
    t.async = !0
    t.src = v
    s = b.getElementsByTagName(e)[0]
    s.parentNode.insertBefore(t, s)
  })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js')
  /* eslint-enable */

  window.fbq('init', META_PIXEL_ID)
  window.fbq('track', 'PageView')
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
