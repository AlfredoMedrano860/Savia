import { useEffect, useMemo, useState } from 'react'
import { ArrowLeftIcon, EyeIcon, EyeOffIcon, PrinterIcon } from '@animateicons/react/lucide'
import { cargarPreguntas, LETRAS, NOTA_MINIMA, TEMAS, type Pregunta, type Prueba } from '../lib/banco'
import { useIconosAnimados } from '../lib/useIconosAnimados'

interface ImprimibleProps {
  prueba: Prueba
  codigo: string
  onRegresar: () => void
}

/** Código con un espacio en medio para leerlo y copiarlo mejor (Q7K M2X). */
const codigoLegible = (codigo: string) => `${codigo.slice(0, 3)} ${codigo.slice(3)}`

// Prueba lista para imprimir o guardar en PDF. Lo impreso lleva el encabezado, el código de la
// prueba, las preguntas y una hoja de respuestas en blanco; las respuestas NO se imprimen.
// En la web, la hoja de respuestas se puede marcar y abajo está "Revelar respuestas", que
// muestra la clave con las explicaciones y, si marcaste, tu nota.
export function Imprimible({ prueba, codigo, onRegresar }: ImprimibleProps) {
  const [preguntas, setPreguntas] = useState<Pregunta[] | null>(null)
  const [errorCarga, setErrorCarga] = useState(false)
  const [marcadas, setMarcadas] = useState<(number | null)[]>(() => prueba.items.map(() => null))
  const [revelada, setRevelada] = useState(false)
  const animarIconos = useIconosAnimados()

  useEffect(() => {
    let vigente = true
    void cargarPreguntas()
      .then((banco) => vigente && setPreguntas(banco))
      .catch((error: unknown) => {
        console.error('No se pudo cargar el banco para la prueba imprimible.', error)
        if (vigente) setErrorCarga(true)
      })
    return () => {
      vigente = false
    }
  }, [])

  const items = useMemo(() => {
    if (!preguntas) return []
    const porId = new Map(preguntas.map((p) => [p.id, p]))
    return prueba.items.flatMap((item) => {
      const pregunta = porId.get(item.id)
      return pregunta ? [{ ...item, pregunta, correcta: item.orden.indexOf(pregunta.r) }] : []
    })
  }, [preguntas, prueba])

  const minutos = Math.round((prueba.limite - prueba.inicio) / 60_000)
  const respondidas = marcadas.filter((m) => m !== null).length
  const aciertos = items.filter((it, i) => marcadas[i] === it.correcta).length
  const nota = items.length ? Math.round((aciertos / items.length) * 100) : 0

  const marcar = (i: number, posicion: number) => {
    if (revelada) return
    setMarcadas((actuales) => actuales.map((m, j) => (j === i ? (m === posicion ? null : posicion) : m)))
  }

  return (
    <main className="imprimible">
      <div className="imprimible__barra no-imprimir">
        <button type="button" className="seccion__enlace imprimible__regresar" onClick={onRegresar}>
          <ArrowLeftIcon size={18} isAnimated={animarIconos} aria-hidden="true" />
          Regresar
        </button>
        <div className="imprimible__accion">
          <button type="button" className="boton boton--tinta" onClick={() => window.print()} disabled={!items.length}>
            <PrinterIcon size={18} isAnimated={animarIconos} aria-hidden="true" />
            Imprimir o guardar PDF
          </button>
          <p className="imprimible__ayuda">Las respuestas no se imprimen. Guarda el código para revisarla después en Savia.</p>
        </div>
      </div>

      {errorCarga ? (
        <p className="error-carga" role="alert">
          No se pudo cargar el banco de preguntas. Revisa tu conexión y vuelve a intentarlo.
        </p>
      ) : !items.length ? (
        <p className="pagina__texto" aria-live="polite">
          Preparando la prueba…
        </p>
      ) : (
        <>
          <article className="papel">
            <header className="papel__cabecera">
              <div>
                <p className="papel__marca">Savia · EDAD II · Biología</p>
                <h1 className="papel__titulo">{prueba.nombre}</h1>
                <p className="papel__datos">
                  {items.length} preguntas · {minutos} minutos
                </p>
              </div>
              <dl className="papel__campos">
                <div>
                  <dt>Nombre</dt>
                  <dd />
                </div>
                <div>
                  <dt>Fecha</dt>
                  <dd />
                </div>
                <div>
                  <dt>Nota</dt>
                  <dd />
                </div>
              </dl>
            </header>

            <div className="papel__codigo">
              <span className="papel__codigo-rotulo">Código de la prueba</span>
              <strong className="papel__codigo-valor">{codigoLegible(codigo)}</strong>
              <span className="papel__codigo-texto">
                Al terminar, entra a Savia, ve a Practicar y escribe este código para ver las respuestas.
              </span>
            </div>

            <p className="papel__instrucciones">
              Marca con una X una sola respuesta por pregunta. Para aprobar necesitas {NOTA_MINIMA} o más.
            </p>

            <ol className="papel__preguntas">
              {items.map(({ id, orden, pregunta }, i) => (
                <li key={id} className="papel__pregunta">
                  <p className="papel__enunciado">
                    <span className="papel__numero">{i + 1}.</span> {pregunta.p}
                  </p>
                  <ol className="papel__opciones">
                    {orden.map((original, posicion) => (
                      <li key={original}>
                        <span className="papel__letra">{LETRAS[posicion]}</span>
                        {pregunta.o[original]}
                      </li>
                    ))}
                  </ol>
                </li>
              ))}
            </ol>

            <section className="papel__hoja" aria-labelledby="hoja-titulo">
              <h2 id="hoja-titulo" className="papel__subtitulo">
                Hoja de respuestas
              </h2>
              <p className="papel__hoja-ayuda no-imprimir">
                Si resolviste en papel, marca aquí lo que respondiste y luego revela las respuestas para ver tu nota.
              </p>
              <ol className="papel__grilla">
                {items.map(({ id, correcta }, i) => (
                  <li key={id} className={revelada && marcadas[i] !== null ? (marcadas[i] === correcta ? 'is-bien' : 'is-mal') : undefined}>
                    <span className="papel__grilla-n">{i + 1}</span>
                    {LETRAS.map((l, posicion) => {
                      const elegida = marcadas[i] === posicion
                      const esCorrecta = revelada && posicion === correcta
                      return (
                        <button
                          key={l}
                          type="button"
                          className={`papel__burbuja ${elegida ? 'is-elegida' : ''} ${esCorrecta ? 'is-correcta' : ''}`}
                          onClick={() => marcar(i, posicion)}
                          aria-pressed={elegida}
                          aria-label={`Pregunta ${i + 1}, opción ${l}`}
                          disabled={revelada}
                        >
                          {l}
                        </button>
                      )
                    })}
                  </li>
                ))}
              </ol>
            </section>
          </article>

          <section className="revelar no-imprimir" aria-labelledby="revelar-titulo">
            <div className="revelar__cabecera">
              <div>
                <p className="seccion__kicker">Solo en la web</p>
                <h2 id="revelar-titulo" className="practica__subtitulo">
                  Respuestas
                </h2>
                <p className="revelar__texto">
                  {revelada
                    ? respondidas
                      ? `Marcaste ${respondidas} de ${items.length}. Acertaste ${aciertos}.`
                      : 'Estas son las respuestas correctas con su explicación.'
                    : respondidas
                      ? `Marcaste ${respondidas} de ${items.length}. Cuando estés listo, revela las respuestas para ver tu nota.`
                      : 'Resuelve la prueba primero. Las respuestas quedan ocultas hasta que las reveles.'}
                </p>
              </div>
              <button type="button" className={`boton ${revelada ? '' : 'boton--tinta'}`} onClick={() => setRevelada((r) => !r)} aria-expanded={revelada} aria-controls="clave">
                {revelada ? (
                  <EyeOffIcon size={18} isAnimated={animarIconos} aria-hidden="true" />
                ) : (
                  <EyeIcon size={18} isAnimated={animarIconos} aria-hidden="true" />
                )}
                {revelada ? 'Ocultar respuestas' : 'Revelar respuestas'}
              </button>
            </div>

            {revelada && respondidas > 0 && (
              <p className={`revelar__nota ${nota >= NOTA_MINIMA ? 'is-aprobada' : 'is-reprobada'}`} role="status">
                <strong>{nota}</strong>/100 · {nota >= NOTA_MINIMA ? 'Aprobada' : `No aprobada · necesitas ${NOTA_MINIMA}`}
              </p>
            )}

            {revelada && (
              <ol id="clave" className="revelar__clave">
                {items.map(({ id, pregunta, correcta }, i) => {
                  const marcada = marcadas[i]
                  const estado = marcada === null ? '' : marcada === correcta ? 'is-bien' : 'is-mal'
                  return (
                    <li key={id} className={`revelar__item ${estado}`}>
                      <p className="revelar__respuesta">
                        <span className="revelar__numero">{i + 1}.</span>
                        <span className="revelar__letra">{LETRAS[correcta]}</span>
                        {pregunta.o[pregunta.r]}
                        {marcada !== null && marcada !== correcta && (
                          <span className="revelar__tuya">Marcaste {LETRAS[marcada]}</span>
                        )}
                      </p>
                      <p className="revelar__tema">
                        {pregunta.t} · {TEMAS[pregunta.t]} · {pregunta.s}
                      </p>
                      <p className="revelar__explicacion">{pregunta.e}</p>
                    </li>
                  )
                })}
              </ol>
            )}
          </section>
        </>
      )}
    </main>
  )
}
