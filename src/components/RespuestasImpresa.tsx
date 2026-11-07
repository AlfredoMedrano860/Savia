import { useEffect, useMemo, useState } from 'react'
import { cargarPreguntas, LETRAS, type Pregunta, type Prueba } from '../lib/banco'
import { enlaceTemario } from '../lib/ruta'
import { BotonGuardar } from './BotonGuardar'
import { HojaCuaderno } from './HojaCuaderno'
import { Cinta } from './Cinta'
import { BotonRegresar } from './BotonRegresar'

interface RespuestasImpresaProps {
  prueba: Prueba
  codigo: string
  onRegresar: () => void
}

/** Código con un espacio en medio para leerlo mejor (Q7K M2X). */
const codigoLegible = (codigo: string) => `${codigo.slice(0, 3)} ${codigo.slice(3)}`

// Lo que se ve al entrar con el código de una prueba impresa: la misma prueba ya resuelta,
// con la respuesta correcta marcada en cada pregunta (en el mismo orden de opciones que en
// el papel) y su explicación. Primero va la hoja de respuestas resuelta, para comparar de un
// vistazo con la hoja de papel; cada número lleva a la explicación de esa pregunta.
export function RespuestasImpresa({ prueba, codigo, onRegresar }: RespuestasImpresaProps) {
  const [preguntas, setPreguntas] = useState<Pregunta[] | null>(null)
  const [errorCarga, setErrorCarga] = useState(false)

  useEffect(() => {
    let vigente = true
    void cargarPreguntas()
      .then((banco) => vigente && setPreguntas(banco))
      .catch((error: unknown) => {
        console.error('No se pudo cargar el banco para mostrar las respuestas.', error)
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
      return pregunta ? [{ ...item, pregunta }] : []
    })
  }, [preguntas, prueba])

  return (
    <main className="resultados respuestas-impresa">
      <BotonRegresar className="resultados__regresar" onClick={onRegresar} />

      <header className="respuestas-impresa__cabecera">
        <Cinta className="seccion__kicker">Respuestas de tu prueba impresa</Cinta>
        <h1 className="respuestas-impresa__titulo">{prueba.nombre.replace(/ para imprimir$/, '')}</h1>
        <p className="respuestas-impresa__datos">
          Código <strong>{codigoLegible(codigo)}</strong> · {prueba.items.length} preguntas
        </p>
        <p className="respuestas-impresa__texto">
          Compara con lo que marcaste en el papel. Las opciones están en el mismo orden que en tu hoja.
        </p>
      </header>

      {errorCarga ? (
        <p className="error-carga" role="alert">
          No se pudo cargar el banco de preguntas. Revisa tu conexión y vuelve a intentarlo.
        </p>
      ) : !items.length ? (
        <p className="pagina__texto" aria-live="polite">
          Cargando respuestas…
        </p>
      ) : (
        <>
          <HojaCuaderno as="section" className="hoja-resuelta" aria-labelledby="hoja-resuelta-titulo">
            <h2 id="hoja-resuelta-titulo" className="papel__subtitulo">
              Hoja de respuestas
            </h2>
            <p className="hoja-resuelta__ayuda">Esta es la hoja resuelta: compárala con la tuya. Abajo está la explicación de cada pregunta.</p>
            <ol className="papel__grilla">
              {items.map(({ id, orden, pregunta }, i) => {
                const correcta = orden.indexOf(pregunta.r)
                return (
                  <li key={id}>
                    <a
                      className="papel__grilla-n"
                      href={`#respuesta-${i + 1}`}
                      aria-label={`Pregunta ${i + 1}: respuesta ${LETRAS[correcta]}. Ver explicación`}
                    >
                      {i + 1}
                    </a>
                    {LETRAS.map((l, posicion) => (
                      <span key={l} className={`papel__burbuja ${posicion === correcta ? 'is-clave' : ''}`} aria-hidden="true">
                        {l}
                      </span>
                    ))}
                  </li>
                )
              })}
            </ol>
          </HojaCuaderno>

          <h2 className="respuestas-impresa__subtitulo">Explicación de cada pregunta</h2>
          <ol className="revision">
            {items.map(({ id, orden, pregunta }, i) => (
              <li key={id} id={`respuesta-${i + 1}`} className="revision__item is-bien">
                <div className="revision__cabecera">
                  <p className="revision__meta">
                    Pregunta {i + 1} · {pregunta.t} · {pregunta.s}
                  </p>
                  <BotonGuardar id={id} compacto />
                </div>
                <h2 className="revision__enunciado">{pregunta.p}</h2>
                <ul className="revision__opciones">
                  {orden.map((original, posicion) => {
                    const esCorrecta = original === pregunta.r
                    return (
                      <li key={original} className={esCorrecta ? 'is-correcta' : undefined}>
                        <span className="revision__letra">{LETRAS[posicion]}</span>
                        <span>{pregunta.o[original]}</span>
                        {esCorrecta && <span className="revision__etiqueta">Correcta</span>}
                      </li>
                    )
                  })}
                </ul>
                <p className="revision__explicacion">{pregunta.e}</p>
                <a className="revision__temario" href={enlaceTemario(pregunta.t, pregunta.s)}>
                  Estudiar {pregunta.s} en el temario
                </a>
              </li>
            ))}
          </ol>
        </>
      )}
    </main>
  )
}
