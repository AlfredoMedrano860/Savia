import { ArrowLeftIcon } from '@animateicons/react/lucide'
import { useIconosAnimados } from '../lib/useIconosAnimados'

interface BotonRegresarProps {
  onClick: () => void
  // clase de la página para el margen (p. ej. proyecto-pagina__regresar)
  className?: string
}

// Botón "Regresar" con flecha, igual en todas las páginas (estilo .regresar).
export function BotonRegresar({ onClick, className = '' }: BotonRegresarProps) {
  const animarIconos = useIconosAnimados()
  return (
    <button type="button" className={`seccion__enlace regresar ${className}`.trim()} onClick={onClick}>
      <ArrowLeftIcon size={18} isAnimated={animarIconos} aria-hidden="true" />
      Regresar
    </button>
  )
}
