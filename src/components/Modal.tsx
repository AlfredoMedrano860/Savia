import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { XIcon } from '@animateicons/react/lucide'
import { useBarraScroll } from '../lib/barraScroll'
import { useIconosAnimados } from '../lib/useIconosAnimados'
import { Cinta } from './Cinta'

// Lo que dura la animación de salida (igual que en index.css).
const SALIDA_MS = 320

interface ModalProps {
  // texto pequeño sobre el título (por ejemplo "T19 · Banco de preguntas")
  etiqueta?: string
  titulo: string
  onCerrar: () => void
  children: ReactNode
}

// Ventana sobre la página, con el estilo de Savia. Usa <dialog> nativo: el foco queda
// dentro mientras está abierta y vuelve al botón que la abrió al cerrarla. Se cierra con
// Escape, con la X o tocando fuera. La página de atrás no se desplaza, y el contenido
// largo usa la barra de scroll propia (lib/barraScroll.ts).
export function Modal({ etiqueta, titulo, onCerrar, children }: ModalProps) {
  const dialogo = useRef<HTMLDialogElement>(null)
  const contenido = useRef<HTMLDivElement>(null)
  const [saliendo, setSaliendo] = useState(false)
  const animarIconos = useIconosAnimados()
  useBarraScroll(contenido)

  useEffect(() => {
    const d = dialogo.current
    if (!d) return
    // El botón que abrió el modal recupera el foco al cerrarlo.
    const disparador = document.activeElement instanceof HTMLElement ? document.activeElement : null
    if (!d.open) d.showModal()
    const desbordeAnterior = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = desbordeAnterior
      // Se cierra el <dialog> antes de quitarlo de la página para que el navegador no
      // mande el foco al inicio del documento.
      if (d.open) d.close()
      disparador?.focus({ preventScroll: true })
    }
  }, [])

  // Cierra con la animación de salida (si la persona no pidió reducir el movimiento).
  const cerrar = useCallback(() => {
    if (saliendo) return
    const sinAnimacion =
      window.matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.classList.contains('a11y-reduce-motion')
    if (sinAnimacion) {
      onCerrar()
      return
    }
    setSaliendo(true)
    window.setTimeout(onCerrar, SALIDA_MS)
  }, [saliendo, onCerrar])

  return (
    <dialog
      ref={dialogo}
      className={`modal ${saliendo ? 'is-saliendo' : ''}`}
      aria-labelledby="modal-titulo"
      onCancel={(e) => {
        e.preventDefault()
        cerrar()
      }}
      onClick={(e) => {
        // tocar el fondo oscuro (fuera de la ventana) la cierra
        if (e.target === e.currentTarget) cerrar()
      }}
    >
      {/* Barra fija arriba (no se desplaza): la etiqueta y la X siempre a la vista. */}
      <div className="modal__barra">
        {etiqueta ? <Cinta className="seccion__kicker">{etiqueta}</Cinta> : <span />}
        <button type="button" className="boton-cuadro modal__cerrar" onClick={cerrar} aria-label="Cerrar">
          <XIcon size={22} isAnimated={animarIconos} aria-hidden="true" />
        </button>
      </div>
      <div ref={contenido} className="modal__contenido">
        <h2 id="modal-titulo" className="modal__titulo">
          {titulo}
        </h2>
        {children}
      </div>
    </dialog>
  )
}
