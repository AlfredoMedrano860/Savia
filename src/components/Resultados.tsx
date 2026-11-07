import { useEffect, useMemo, useState } from 'react'
import { cargarPreguntas, CODIGOS, LETRAS, NOTA_MINIMA, TEMAS, porcentaje, type Pregunta, type Resultado } from '../lib/banco'
import { formatoDuracion } from '../lib/formato'
import { enlaceTemario } from '../lib/ruta'
import { BotonGuardar } from './BotonGuardar'
import { BotonRegresar } from './BotonRegresar'

type Filtro = 'todas' | 'incorrectas' | 'sin-responder'

interface ResultadosProps {
  resultado: Resultado
  onInicio: () => void
  onRepasar: (ids: number[]) => void
}

export function Resultados({ resultado, onInicio, onRepasar }: ResultadosProps) {
  const [filtro, setFiltro] = useState<Filtro>('incorrectas')
  const [preguntas, setPreguntas] = useState<Pregunta[] | null>(null)
  const [errorCarga, setErrorCarga] = useState(false)
  const nota = porcentaje(resultado)
  const aprobada = nota >= NOTA_MINIMA
  const incorrectas = resultado.total - resultado.correctas - resultado.sinResponder

  useEffect(() => {
    let vigente = true
    void cargarPreguntas()
      .then((banco) => {
        if (vigente) setPreguntas(banco)
      })
      .catch((error: unknown) => {
        console.error('No se pudo cargar el banco de preguntas para revisar el resultado.', error)
        if (vigente) setErrorCarga(true)
      })
    return () => {
      vigente = false
    }
  }, [])

  const porId = useMemo(() => new Map(preguntas?.map((p) => [p.id, p]) ?? []), [preguntas])
  const falladas = useMemo(() => {
    return resultado.detalle.flatMap((detalle) => {
      const pregunta = porId.get(detalle.id)
      return pregunta && detalle.elegida !== pregunta.r ? [detalle.id] : []
    })
  }, [resultado, porId])

  const lista = resultado.detalle.flatMap((detalle, i) => {
    const pregunta = porId.get(detalle.id)
    if (!pregunta) return []
    if (filtro === 'incorrectas' && (detalle.elegida === null || detalle.elegida === pregunta.r)) return []
    if (filtro === 'sin-responder' && detalle.elegida !== null) return []
    return [{ ...detalle, numero: i + 1, pregunta }]
  })

  return (
    <main className="resultados">
      <BotonRegresar className="resultados__regresar" onClick={onInicio} />
      <section className={`calificacion ${aprobada ? 'is-aprobada' : 'is-reprobada'}`} aria-labelledby="nota-titulo">
        <p className="calificacion__modo">{resultado.nombre}</p>
        <h1 id="nota-titulo" className="calificacion__nota">
          {nota}
          <span className="calificacion__sobre">/100</span>
        </h1>
        <p className="calificacion__veredicto">{aprobada ? 'Aprobada' : `No aprobada · necesitas ${NOTA_MINIMA}`}</p>
        <dl className="calificacion__datos">
          <div>
            <dt>Correctas</dt>
            <dd>
              {resultado.correctas} de {resultado.total}
            </dd>
          </div>
          <div>
            <dt>Incorrectas</dt>
            <dd>{incorrectas}</dd>
          </div>
          <div>
            <dt>Sin responder</dt>
            <dd>{resultado.sinResponder}</dd>
          </div>
          <div>
            <dt>Tiempo</dt>
            <dd>{formatoDuracion(resultado.segundos)}</dd>
          </div>
        </dl>
        <div className="calificacion__acciones">
          <button type="button" className="boton boton--tinta" onClick={onInicio}>
            Nueva prueba
          </button>
          {falladas.length > 0 && (
            <button type="button" className="boton-discreto" onClick={() => onRepasar(falladas)}>
              Repasar las {falladas.length} que fallé
            </button>
          )}
        </div>
      </section>

      <section aria-labelledby="temas-res-titulo">
        <h2 id="temas-res-titulo" className="titulo-seccion">
          Por tema
        </h2>
        <ul className="por-tema">
          {CODIGOS.filter((t) => resultado.porTema[t].total > 0).map((t) => {
            const { correctas, total } = resultado.porTema[t]
            const pct = Math.round((correctas / total) * 100)
            return (
              <li key={t}>
                <div className="por-tema__fila">
                  <span>
                    <span className="temas__codigo">{t}</span> {TEMAS[t]}
                  </span>
                  <span className="por-tema__dato">
                    {correctas}/{total}
                  </span>
                </div>
                <div className="por-tema__barra" aria-hidden="true">
                  <span className={pct >= NOTA_MINIMA ? 'is-bien' : 'is-mal'} style={{ width: `${pct}%` }} />
                </div>
              </li>
            )
          })}
        </ul>
      </section>

      {resultado.detalle.length > 0 && (
        <section aria-labelledby="revision-titulo">
          <h2 id="revision-titulo" className="titulo-seccion">
            Revisión
          </h2>
          <div className="filtros" role="group" aria-label="Filtrar preguntas">
            {(
              [
                ['incorrectas', `Incorrectas (${incorrectas})`],
                ['sin-responder', `Sin responder (${resultado.sinResponder})`],
                ['todas', `Todas (${resultado.total})`],
              ] as [Filtro, string][]
            ).map(([valor, texto]) => (
              <button
                key={valor}
                type="button"
                className={`filtro ${filtro === valor ? 'is-activo' : ''}`}
                aria-pressed={filtro === valor}
                onClick={() => setFiltro(valor)}
              >
                {texto}
              </button>
            ))}
          </div>

          {errorCarga ? (
            <p className="error-carga" role="alert">
              No se pudo cargar el banco para revisar tus respuestas. Recarga la página para intentarlo de nuevo.
            </p>
          ) : !preguntas ? (
            <p className="pagina__texto" aria-live="polite">
              Cargando revisión…
            </p>
          ) : lista.length === 0 ? (
            <p className="vacio">No hay preguntas en este grupo.</p>
          ) : (
            <ol className="revision">
              {lista.map(({ id, numero, pregunta, elegida, orden }) => {
                const bien = elegida === pregunta.r
                return (
                  <li key={id} className={`revision__item ${bien ? 'is-bien' : elegida === null ? 'is-vacia' : 'is-mal'}`}>
                    <div className="revision__cabecera">
                      <p className="revision__meta">
                        Pregunta {numero} · {pregunta.t} · {pregunta.s}
                      </p>
                      <BotonGuardar id={id} />
                    </div>
                    <h3 className="revision__enunciado">{pregunta.p}</h3>
                    <ul className="revision__opciones">
                      {orden.map((original, posicion) => {
                        const esCorrecta = original === pregunta.r
                        const esElegida = original === elegida
                        return (
                          <li
                            key={original}
                            className={`${esCorrecta ? 'is-correcta' : ''} ${esElegida && !esCorrecta ? 'is-error' : ''}`}
                          >
                            <span className="revision__letra">{LETRAS[posicion]}</span>
                            <span>{pregunta.o[original]}</span>
                            {esCorrecta && <span className="revision__etiqueta">Correcta</span>}
                            {esElegida && !esCorrecta && <span className="revision__etiqueta">Tu respuesta</span>}
                          </li>
                        )
                      })}
                    </ul>
                    {elegida === null && <p className="revision__aviso">No la respondiste.</p>}
                    <p className="revision__explicacion">{pregunta.e}</p>
                    <a className="revision__temario" href={enlaceTemario(pregunta.t, pregunta.s)}>
                      Estudiar {pregunta.s} en el temario
                    </a>
                  </li>
                )
              })}
            </ol>
          )}
        </section>
      )}
    </main>
  )
}
