import { useEffect, useState } from 'react'

export function useIconosAnimados() {
  const [animados, setAnimados] = useState(() => (
    typeof window !== 'undefined' &&
    !window.matchMedia('(prefers-reduced-motion: reduce)').matches &&
    !document.documentElement.classList.contains('a11y-reduce-motion')
  ))

  useEffect(() => {
    const movimientoReducido = window.matchMedia('(prefers-reduced-motion: reduce)')
    const actualizar = () => {
      setAnimados(!movimientoReducido.matches && !document.documentElement.classList.contains('a11y-reduce-motion'))
    }
    const observer = new MutationObserver(actualizar)

    actualizar()
    movimientoReducido.addEventListener('change', actualizar)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })

    return () => {
      movimientoReducido.removeEventListener('change', actualizar)
      observer.disconnect()
    }
  }, [])

  return animados
}
