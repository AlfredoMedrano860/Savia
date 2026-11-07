import { StarIcon } from '@animateicons/react/lucide'
import { alternarGuardada, estaGuardada, useAprendizaje } from '../lib/aprendizaje'
import { useIconosAnimados } from '../lib/useIconosAnimados'

// Estrella para guardar una pregunta en "Mis guardadas" y practicarla aparte después.
// A diferencia de "Marcar para revisar" (que solo vale dentro de la prueba), esto queda
// guardado en el navegador. Es solo la estrella (vacía o rellena); el texto queda para
// lectores de pantalla.
export function BotonGuardar({ id }: { id: number }) {
  useAprendizaje()
  const animarIconos = useIconosAnimados()
  const guardada = estaGuardada(id)

  return (
    <button
      type="button"
      className={`guardar ${guardada ? 'is-guardada' : ''}`}
      aria-pressed={guardada}
      onClick={() => alternarGuardada(id)}
      title={guardada ? 'Quitar de mis guardadas' : 'Guardar para practicar después'}
    >
      <StarIcon className="guardar__icono" size={20} isAnimated={animarIconos} aria-hidden="true" />
      <span className="sr-only">{guardada ? 'Guardada' : 'Guardar'}</span>
    </button>
  )
}
