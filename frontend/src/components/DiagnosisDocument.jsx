import { useEffect, useRef, useState } from 'react'
import * as pdfjs from 'pdfjs-dist'
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import { RESOURCE_COPY } from '../data/landingContent'
import styles from './DiagnosisDocument.module.css'

pdfjs.GlobalWorkerOptions.workerSrc = pdfWorker

const MAX_DOC_WIDTH = 680

function getDisplayWidth(containerEl) {
  const available = Math.floor(containerEl?.clientWidth || 0)
  if (available <= 0) return MAX_DOC_WIDTH
  return Math.min(available, MAX_DOC_WIDTH)
}

/**
 * En pantallas estrechas la página entera entra en pocos cientos de píxeles.
 * Si se renderiza a 1x, al ampliar con los dedos el texto se ve borroso, así
 * que subimos la resolución del lienzo aunque se muestre pequeño.
 */
function renderScaleFor(displayWidth) {
  const dpr = window.devicePixelRatio || 1
  const minima = displayWidth < 520 ? 2.5 : 2
  return Math.min(Math.max(dpr, minima), 3)
}

async function renderPageCanvas(page, displayWidth) {
  const dpr = renderScaleFor(displayWidth)
  const baseViewport = page.getViewport({ scale: 1 })
  const scale = (displayWidth / baseViewport.width) * dpr
  const viewport = page.getViewport({ scale })
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')

  canvas.width = Math.floor(viewport.width)
  canvas.height = Math.floor(viewport.height)
  canvas.style.width = `${displayWidth}px`
  canvas.style.height = `${Math.floor(viewport.height / dpr)}px`
  canvas.className = styles.pageCanvas

  await page.render({ canvasContext: context, viewport }).promise
  return canvas
}

export default function DiagnosisDocument({ fileUrl }) {
  const viewerRef = useRef(null)
  const pagesRef = useRef(null)
  const pdfRef = useRef(null)
  const readyRef = useRef(false)
  const [status, setStatus] = useState('loading')

  useEffect(() => {
    let cancelled = false
    let resizeTimer = null
    const pagesEl = pagesRef.current
    const viewerEl = viewerRef.current
    if (!pagesEl || !viewerEl || !fileUrl) return undefined

    readyRef.current = false

    // Solo el ancho obliga a redibujar. En móvil, al desplazarse se pliega la
    // barra del navegador y cambia la altura: si reaccionáramos a eso, el
    // documento se borraría y repintaría en cada scroll.
    let ultimoAncho = 0

    const renderPages = async () => {
      const pdfDoc = pdfRef.current
      if (!pdfDoc || cancelled) return

      const displayWidth = getDisplayWidth(viewerEl)
      ultimoAncho = Math.floor(viewerEl.clientWidth || 0)
      pagesEl.replaceChildren()

      for (let pageNumber = 1; pageNumber <= pdfDoc.numPages; pageNumber += 1) {
        if (cancelled) return

        const page = await pdfDoc.getPage(pageNumber)
        const canvas = await renderPageCanvas(page, displayWidth)
        canvas.setAttribute('aria-label', `Sección ${pageNumber}`)

        const pageWrap = document.createElement('div')
        pageWrap.className = styles.page
        pageWrap.style.width = `${displayWidth}px`
        pageWrap.appendChild(canvas)
        pagesEl.appendChild(pageWrap)
      }
    }

    const loadDocument = async () => {
      pagesEl.replaceChildren()
      pdfRef.current = null
      setStatus('loading')

      try {
        const pdfDoc = await pdfjs.getDocument({ url: fileUrl }).promise
        if (cancelled) return

        pdfRef.current = pdfDoc
        await renderPages()
        if (cancelled) return

        readyRef.current = true
        setStatus('ready')
      } catch {
        if (!cancelled) setStatus('error')
      }
    }

    loadDocument()

    const observer = new ResizeObserver(() => {
      if (!readyRef.current || !pdfRef.current || cancelled) return
      const ancho = Math.floor(viewerEl.clientWidth || 0)
      if (ancho === ultimoAncho) return
      ultimoAncho = ancho
      clearTimeout(resizeTimer)
      resizeTimer = setTimeout(() => {
        renderPages()
      }, 120)
    })
    observer.observe(viewerEl)

    return () => {
      cancelled = true
      readyRef.current = false
      clearTimeout(resizeTimer)
      observer.disconnect()
    }
  }, [fileUrl])

  return (
    <section
      ref={viewerRef}
      className={styles.viewer}
      aria-label="Tu diagnóstico"
      onContextMenu={(event) => event.preventDefault()}
    >
      {status === 'loading' && (
        <div className={styles.state}>
          <span className={styles.spinner} aria-hidden="true" />
          <p>{RESOURCE_COPY.documentLoading}</p>
        </div>
      )}

      {status === 'error' && (
        <div className={styles.state}>
          <p>{RESOURCE_COPY.documentError}</p>
        </div>
      )}

      <div className={`${styles.sheet} ${status !== 'ready' ? styles.sheetHidden : ''}`}>
        <div ref={pagesRef} className={styles.pages} />
      </div>
    </section>
  )
}
