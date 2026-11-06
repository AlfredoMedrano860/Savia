import { StarIcon } from '@animateicons/react/lucide'
import { alternarGuardada, estaGuardada, useAprendizaje } from '../lib/aprendizaje'
import { useIconosAnimados } from '../lib/useIconosAnimados'

// Estrella para guardar una pregunta en "Mis guardadas" y practicarla aparte después.
// A diferencia de "Marcar para revisar" (que solo vale dentro de la prueba), esto queda
// guardado en el navegador.
export function BotonGuardar({ id, compacto = false }: { id: number; compacto?: boolean }) {
  useAprendizaje()
  const animarIconos = useIconosAnimados()
  const guardada = estaGuardada(id)

  return (
    <button
      type="button"
      className={`guardar ${guardada ? 'is-guardada' : ''} ${compacto ? 'guardar--compacto' : ''}`}
      aria-pressed={guardada}
      onClick={() => alternarGuardada(id)}
      title={guardada ? 'Quitar de mis guardadas' : 'Guardar para practicar después'}
    >
      <StarIcon className="guardar__icono" size={16} isAnimated={animarIconos} aria-hidden="true" />
      <span className={compacto ? 'sr-only' : undefined}>{guardada ? 'Guardada' : 'Guardar'}</span>
    </button>
  )
}
