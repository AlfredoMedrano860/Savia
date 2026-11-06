import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { EyeIcon, EyeOffIcon } from '@animateicons/react/lucide'
import { LETRAS, type Pregunta } from '../lib/banco'
import { useIconosAnimados } from '../lib/useIconosAnimados'
import { BotonGuardar } from './BotonGuardar'
import { Paginacion } from './Paginacion'

const POR_PAGINA = 10

interface BancoTemaProps {
  preguntas: Pregunta[]
  subtemas: { nombre: string; total: number }[]
  // subtema elegido desde la lista del temario (o null para ver todos)
  subtema: string | null
  onSubtema: (subtema: string | null) => void
}

/** Quita tildes y pasa a minúsculas para buscar sin importar cómo se escriba. */
const normalizar = (texto: string) => texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

// Banco de preguntas de un tema: todas sus preguntas con buscador y filtro por subtema. La
// respuesta de cada una está tapada hasta tocar "Ver respuesta" (o "Mostrar las respuestas"), para
// poder estudiar intentando responder primero.
export function BancoTema({ preguntas, subtemas, subtema, onSubtema }: BancoTemaProps) {
  const [busqueda, setBusqueda] = useState('')
  const [pagina, setPagina] = useState(1)
  const conteo = useRef<HTMLParagraphElement>(null)
  const [reveladas, setReveladas] = useState<Set<number>>(() => new Set())
  const [todas, setTodas] = useState(false)
  const animarIconos = useIconosAnimados()
  const idBusqueda = useId()

  const lista = useMemo(() => {
    const q = normalizar(busqueda.trim())
    return preguntas.filter(
      (p) =>
        (!subtema || p.s === subtema) &&
        (!q || normalizar(p.p).includes(q) || p.o.some((o) => normalizar(o).includes(q)) || normalizar(p.e).includes(q)),
    )
  }, [preguntas, subtema, busqueda])

  // Al cambiar el filtro se vuelve a la primera página.
  useEffect(() => setPagina(1), [subtema, busqueda])

  const totalPaginas = Math.max(1, Math.ceil(lista.length / POR_PAGINA))
  const actual = Math.min(pagina, totalPaginas)
  const deLaPagina = lista.slice((actual - 1) * POR_PAGINA, actual * POR_PAGINA)

  // Al cambiar de página se sube al inicio de la lista (dentro del modal o de la página).
  const irAPagina = (nueva: number) => {
    setPagina(nueva)
    conteo.current?.scrollIntoView({ block: 'start', behavior: 'smooth' })
  }

  const alternar = (id: number) =>
    setReveladas((actuales) => {
      const nuevas = new Set(actuales)
      if (nuevas.has(id)) nuevas.delete(id)
      else nuevas.add(id)
      return nuevas
    })

  return (
    <div className="banco">
      <div className="banco__controles">
        <div className="banco__busqueda">
          <label className="sr-only" htmlFor={idBusqueda}>
            Buscar en las preguntas de este tema
          </label>
          <input
            id={idBusqueda}
            type="search"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar una palabra, p. ej. fotosíntesis"
            autoComplete="off"
          />
        </div>
        <button type="button" className="boton-discreto" onClick={() => setTodas((t) => !t)} aria-pressed={todas}>
          {todas ? (
            <EyeOffIcon size={18} isAnimated={animarIconos} aria-hidden="true" />
          ) : (
            <EyeIcon size={18} isAnimated={animarIconos} aria-hidden="true" />
          )}
          {todas ? 'Ocultar las respuestas' : 'Mostrar las respuestas'}
        </button>
      </div>

      <div className="banco__filtros" role="group" aria-label="Filtrar por subtema">
        <button type="button" className={`filtro ${subtema === null ? 'is-activo' : ''}`} aria-pressed={subtema === null} onClick={() => onSubtema(null)}>
          Todos ({preguntas.length})
        </button>
        {subtemas.map((s) => (
          <button
            key={s.nombre}
            type="button"
            className={`filtro ${subtema === s.nombre ? 'is-activo' : ''}`}
            aria-pressed={subtema === s.nombre}
            onClick={() => onSubtema(s.nombre)}
          >
            {s.nombre} ({s.total})
          </button>
        ))}
      </div>

      <p ref={conteo} className="banco__conteo" role="status">
        {lista.length === 1 ? '1 pregunta' : `${lista.length} preguntas`}
        {busqueda.trim() && ` con “${busqueda.trim()}”`}
      </p>

      {lista.length === 0 ? (
        <p className="vacio">No hay preguntas con esa búsqueda. Prueba con otra palabra o elige otro subtema.</p>
      ) : (
        <ol className="banco__lista">
          {deLaPagina.map((p) => {
            const abierta = todas || reveladas.has(p.id)
            return (
              <li key={p.id} className={`banco__item ${abierta ? 'is-abierta' : ''}`}>
                <div className="revision__cabecera">
                  <p className="revision__meta">
                    #{p.id} · {p.s}
                  </p>
                  <BotonGuardar id={p.id} compacto />
                </div>
                <h3 className="revision__enunciado">{p.p}</h3>
                <ul className="revision__opciones">
                  {p.o.map((opcion, i) => {
                    const correcta = abierta && i === p.r
                    return (
                      <li key={opcion} className={correcta ? 'is-correcta' : undefined}>
                        <span className="revision__letra">{LETRAS[i]}</span>
                        <span>{opcion}</span>
                        {correcta && <span className="revision__etiqueta">Correcta</span>}
                      </li>
                    )
                  })}
                </ul>
                {abierta ? (
                  <p className="revision__explicacion">{p.e}</p>
                ) : null}
                {!todas && (
                  <button type="button" className="banco__ver" onClick={() => alternar(p.id)} aria-expanded={abierta}>
                    {abierta ? 'Ocultar respuesta' : 'Ver respuesta'}
                  </button>
                )}
              </li>
            )
          })}
        </ol>
      )}

      <Paginacion pagina={actual} totalPaginas={totalPaginas} onCambiar={irAPagina} etiqueta="preguntas" />
    </div>
  )
}
