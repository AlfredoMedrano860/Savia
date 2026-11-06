import { useEffect, useState } from 'react'
import { ArrowUpIcon } from '@animateicons/react/lucide'
import { useIconosAnimados } from '../lib/useIconosAnimados'

export function VolverArriba() {
  const [visible, setVisible] = useState(false)
  const animarIconos = useIconosAnimados()

  useEffect(() => {
    let frame = 0
    const actualizar = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => setVisible(window.scrollY > 420))
    }
    actualizar()
    window.addEventListener('scroll', actualizar, { passive: true })
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', actualizar)
    }
  }, [])

  return (
    <button
      type="button"
      className={`volver-arriba ${visible ? 'is-visible' : ''}`}
      aria-label="Volver al inicio de la página"
      aria-hidden={!visible}
      tabIndex={visible ? 0 : -1}
      onClick={() => {
        const reducirMovimiento =
          document.documentElement.classList.contains('a11y-reduce-motion') ||
          window.matchMedia('(prefers-reduced-motion: reduce)').matches
        window.scrollTo({ top: 0, behavior: reducirMovimiento ? 'instant' : 'smooth' })
      }}
    >
      <ArrowUpIcon size={24} isAnimated={animarIconos} aria-hidden="true" />
    </button>
  )
}
