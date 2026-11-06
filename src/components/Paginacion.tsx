import { ChevronLeftIcon, ChevronRightIcon } from '@animateicons/react/lucide'
import { useIconosAnimados } from '../lib/useIconosAnimados'

interface PaginacionProps {
  pagina: number
  totalPaginas: number
  onCambiar: (pagina: number) => void
  // qué se está paginando, para lectores de pantalla (p. ej. "preguntas")
  etiqueta?: string
}

// Cuántos números de página se ven alrededor de la actual (además de la primera y la última).
const VECINAS = 1

/** Lista de páginas a mostrar, con "…" donde se saltan páginas: 1 … 4 5 6 … 17. */
function paginasVisibles(actual: number, total: number): (number | '…')[] {
  const desde = Math.max(2, actual - VECINAS)
  const hasta = Math.min(total - 1, actual + VECINAS)
  const lista: (number | '…')[] = [1]
  if (desde > 2) lista.push('…')
  for (let p = desde; p <= hasta; p++) lista.push(p)
  if (hasta < total - 1) lista.push('…')
  if (total > 1) lista.push(total)
  return lista
}

// Paginación adaptada de la de My Green Farm (flechas, números y página actual marcada,
// flechas desactivadas en los extremos) con el estilo de Savia. Muestra la primera y la
// última página con "…" entre medio para que quepa en celular aunque haya muchas páginas.
export function Paginacion({ pagina, totalPaginas, onCambiar, etiqueta = 'resultados' }: PaginacionProps) {
  const animarIconos = useIconosAnimados()
  if (totalPaginas <= 1) return null

  return (
    <nav className="paginacion" aria-label={`Páginas de ${etiqueta}`}>
      <button
        type="button"
        className="boton-cuadro paginacion__boton paginacion__flecha"
        onClick={() => onCambiar(pagina - 1)}
        disabled={pagina === 1}
        aria-label="Página anterior"
      >
        <ChevronLeftIcon size={18} isAnimated={animarIconos} aria-hidden="true" />
      </button>

      <ol className="paginacion__numeros">
        {paginasVisibles(pagina, totalPaginas).map((p, i) =>
          p === '…' ? (
            <li key={`salto-${i}`} className="paginacion__salto" aria-hidden="true">
              …
            </li>
          ) : (
            <li key={p}>
              <button
                type="button"
                className={`boton-cuadro paginacion__boton ${p === pagina ? 'is-actual' : ''}`}
                onClick={() => onCambiar(p)}
                aria-current={p === pagina ? 'page' : undefined}
                aria-label={`Página ${p}`}
              >
                {p}
              </button>
            </li>
          ),
        )}
      </ol>

      <button
        type="button"
        className="boton-cuadro paginacion__boton paginacion__flecha"
        onClick={() => onCambiar(pagina + 1)}
        disabled={pagina === totalPaginas}
        aria-label="Página siguiente"
      >
        <ChevronRightIcon size={18} isAnimated={animarIconos} aria-hidden="true" />
      </button>

      <p className="paginacion__resumen" aria-live="polite">
        Página {pagina} de {totalPaginas}
      </p>
    </nav>
  )
}
