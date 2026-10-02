import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * El CSS de la primera pantalla bloquea el pintado y, aunque pese poco
 * comprimido, cuesta un viaje de ida y vuelta completo (150 ms en 4G). Al
 * incrustarlo en el HTML el navegador puede pintar con lo que ya tiene.
 *
 * Solo afecta a la hoja de entrada: las de las rutas diferidas (panel,
 * admin, /recurso) siguen como archivos aparte, que es lo que queremos
 * porque no hacen falta para ver la landing.
 */
function incrustarCssDeEntrada() {
  return {
    name: 'incrustar-css-de-entrada',
    apply: 'build',
    enforce: 'post',
    generateBundle(_opciones, paquete) {
      const html = Object.values(paquete).find((a) => a.fileName === 'index.html')
      if (!html) return

      const etiqueta = /<link[^>]+rel="stylesheet"[^>]+href="\/(assets\/index-[^"]+\.css)"[^>]*>/
      const encontrada = html.source.match(etiqueta)
      if (!encontrada) return

      const hoja = paquete[encontrada[1]]
      if (!hoja) return

      html.source = html.source.replace(etiqueta, `<style>${hoja.source}</style>`)
      delete paquete[encontrada[1]]
    },
  }
}

export default defineConfig({
  base: '/',
  plugins: [react(), incrustarCssDeEntrada()],
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
    },
  },
})
