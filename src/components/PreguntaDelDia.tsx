import { useEffect, useMemo, useState } from 'react'
import { ArrowRightIcon, CheckIcon, FlameIcon, XIcon } from '@animateicons/react/lucide'
import { registrarRespuesta } from '../lib/aprendizaje'
import { cargarPreguntas, LETRAS, TEMAS, TOTAL_PREGUNTAS, type Pregunta } from '../lib/banco'
import { enlaceTemario } from '../lib/ruta'
import { useIconosAnimados } from '../lib/useIconosAnimados'
import { BotonGuardar } from './BotonGuardar'

const CLAVE = 'ribosoma:diaria'

interface EstadoDiario {
  fecha: string
  elegida: number | null
  racha: number
  // último día en que respondió (para saber si la racha sigue)
  ultimaFecha: string | null
}

/** Fecha local en formato AAAA-MM-DD. */
function claveDia(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** Número entero estable a partir de un texto (la misma fecha siempre da el mismo número). */
function semilla(texto: string) {
  let h = 2166136261
  for (let i = 0; i < texto.length; i++) h = Math.imul(h ^ texto.charCodeAt(i), 16777619)
  return h >>> 0
}

/** Mezcla las cuatro opciones con una semilla fija, para que el orden no cambie al recargar. */
function ordenDelDia(s: number) {
  const orden = [0, 1, 2, 3]
  let x = s || 1
  for (let i = orden.length - 1; i > 0; i--) {
    x = (Math.imul(x, 1103515245) + 12345) >>> 0
    const j = x % (i + 1)
    ;[orden[i], orden[j]] = [orden[j], orden[i]]
  }
  return orden
}

function leerEstado(hoy: string): EstadoDiario {
  try {
    const valor: unknown = JSON.parse(localStorage.getItem(CLAVE) ?? 'null')
    if (typeof valor === 'object' && valor !== null) {
      const v = valor as Partial<EstadoDiario>
      const racha = Number.isInteger(v.racha) ? (v.racha as number) : 0
      const ultimaFecha = typeof v.ultimaFecha === 'string' ? v.ultimaFecha : null
      if (v.fecha === hoy) return { fecha: hoy, elegida: typeof v.elegida === 'number' ? v.elegida : null, racha, ultimaFecha }
      return { fecha: hoy, elegida: null, racha, ultimaFecha }
    }
  } catch {
    // datos dañados o sin almacenamiento: se empieza de cero
  }
  return { fecha: hoy, elegida: null, racha: 0, ultimaFecha: null }
}

function guardarEstado(estado: EstadoDiario) {
  try {
    localStorage.setItem(CLAVE, JSON.stringify(estado))
  } catch {
    // sin almacenamiento: la pregunta funciona igual, pero no se recuerda
  }
}

// Una pregunta distinta cada día (la misma para todas las personas ese día), con la
// explicación al responder y una racha de días seguidos para crear el hábito.
export function PreguntaDelDia() {
  const hoy = claveDia()
  const ayer = claveDia(new Date(Date.now() - 86_400_000))
  const animarIconos = useIconosAnimados()
  const [pregunta, setPregunta] = useState<Pregunta | null>(null)
  const [error, setError] = useState(false)
  const [estado, setEstado] = useState(() => leerEstado(hoy))
  const s = semilla(hoy)
  const orden = useMemo(() => ordenDelDia(s), [s])

  useEffect(() => {
    let vigente = true
    void cargarPreguntas()
      .then((banco) => {
        if (vigente) setPregunta(banco.find((p) => p.id === (s % TOTAL_PREGUNTAS) + 1) ?? banco[0])
      })
      .catch((e: unknown) => {
        console.error('No se pudo cargar la pregunta del día.', e)
        if (vigente) setError(true)
      })
    return () => {
      vigente = false
    }
  }, [s])

  // La racha se muestra solo si sigue viva (respondió hoy o ayer).
  const rachaViva = estado.ultimaFecha === hoy || estado.ultimaFecha === ayer ? estado.racha : 0

  const responder = (original: number) => {
    if (!pregunta || estado.elegida !== null) return
    const racha = estado.ultimaFecha === ayer ? estado.racha + 1 : estado.ultimaFecha === hoy ? estado.racha : 1
    const nuevo = { fecha: hoy, elegida: original, racha, ultimaFecha: hoy }
    setEstado(nuevo)
    guardarEstado(nuevo)
    registrarRespuesta(pregunta, original)
  }

  if (error) return null

  const respondida = estado.elegida !== null
  const acerto = pregunta !== null && estado.elegida === pregunta.r
  const fecha = new Date().toLocaleDateString('es-CR', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <section className="diaria-seccion" aria-labelledby="diaria-titulo">
      <div className="diaria">
        <header className="diaria__cabecera">
          <div>
            <p className="seccion__kicker">Pregunta del día</p>
            <h2 id="diaria-titulo" className="diaria__fecha">
              {fecha.charAt(0).toUpperCase() + fecha.slice(1)}
            </h2>
          </div>
          {rachaViva > 0 && (
            <div className="diaria__racha">
              <FlameIcon size={18} isAnimated={animarIconos} aria-hidden="true" />
              {rachaViva} {rachaViva === 1 ? 'día' : 'días seguidos'}
            </div>
          )}
        </header>

        {!pregunta ? (
          <p className="pagina__texto" aria-live="polite">
            Cargando la pregunta de hoy…
          </p>
        ) : (
          <>
            <p className="diaria__meta">
              {pregunta.t} · {TEMAS[pregunta.t]}
            </p>
            <p className="diaria__enunciado">{pregunta.p}</p>
            <ul className="diaria__opciones" role="list">
              {orden.map((original, posicion) => {
                const esCorrecta = original === pregunta.r
                const esElegida = original === estado.elegida
                const clase = respondida ? (esCorrecta ? 'is-correcta' : esElegida ? 'is-error' : 'is-apagada') : ''
                return (
                  <li key={original}>
                    <button
                      type="button"
                      className={`diaria__opcion ${clase}`}
                      onClick={() => responder(original)}
                      disabled={respondida}
                      aria-pressed={esElegida}
                    >
                      <span className="diaria__letra">{LETRAS[posicion]}</span>
                      <span>{pregunta.o[original]}</span>
                      {respondida && esCorrecta && <CheckIcon className="diaria__marca" size={18} aria-hidden="true" />}
                      {respondida && esElegida && !esCorrecta && <XIcon className="diaria__marca" size={18} aria-hidden="true" />}
                    </button>
                  </li>
                )
              })}
            </ul>

            {respondida && (
              <div className={`diaria__respuesta ${acerto ? 'is-bien' : 'is-mal'}`} role="status">
                <p className="diaria__veredicto">
                  {acerto ? '¡Correcto!' : `Casi. La respuesta es la ${LETRAS[orden.indexOf(pregunta.r)]}.`}
                </p>
                <p className="diaria__explicacion">{pregunta.e}</p>
                <div className="diaria__acciones">
                  <a className="seccion__enlace" href={enlaceTemario(pregunta.t, pregunta.s)}>
                    Estudiar {pregunta.s} <ArrowRightIcon size={18} isAnimated={animarIconos} aria-hidden="true" />
                  </a>
                  <BotonGuardar id={pregunta.id} />
                </div>
                <p className="diaria__manana">Vuelve mañana por otra pregunta.</p>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  )
}
