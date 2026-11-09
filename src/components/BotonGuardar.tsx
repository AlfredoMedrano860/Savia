import { StarIcon } from '@animateicons/react/lucide'
import { alternarGuardada, estaGuardada, useAprendizaje } from '../lib/aprendizaje'
import { useIconosAnimados } from '../lib/useIconosAnimados'

// Estrella para guardar una pregunta en "Mis guardadas" y practicarla aparte después.
// A diferencia de "Marcar para revisar" (que solo vale dentro de la prueba), esto queda
// guardado en el navegador. Botón con estrella y texto ("Guardar" / "Guardada") para que se
// vea a primera vista; al guardarla se rellena de amarillo.
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
      <StarIcon className="guardar__icono" size={18} isAnimated={animarIconos} aria-hidden="true" />
      <span className="guardar__texto">{guardada ? 'Guardada' : 'Guardar'}</span>
    </button>
  )
}
