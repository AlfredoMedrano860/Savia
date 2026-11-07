import { useEffect, useRef } from 'react'

/**
 * Fila de pestañas que en celular se desliza de lado (adaptado de useTabCarousel de
 * My Green Farm). Cada vez que cambia `activo`, centra la pestaña marcada con
 * aria-current si la fila no cabe en la pantalla. La primera vez salta directo y
 * después se desliza con suavidad.
 */
export function useCarrusel<T extends HTMLElement = HTMLElement>(activo: unknown) {
  const ref = useRef<T>(null)
  const primera = useRef(true)

  useEffect(() => {
    const fila = ref.current
    const suave = !primera.current
    primera.current = false
    if (!fila || fila.scrollWidth <= fila.clientWidth) return
    const pestana = fila.querySelector<HTMLElement>('[aria-current]')
    if (!pestana) return
    const reducir = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    fila.scrollTo({
      left: pestana.offsetLeft - (fila.clientWidth - pestana.offsetWidth) / 2,
      behavior: suave && !reducir ? 'smooth' : 'auto',
    })
  }, [activo])

  return ref
}
