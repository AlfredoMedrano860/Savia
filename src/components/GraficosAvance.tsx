import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { CODIGOS, NOTA_MINIMA, TEMAS, porcentaje, type Resultado, type TemaCodigo } from '../lib/banco'
import type { ProgresoTema } from '../lib/aprendizaje'
import type { CSSProperties } from 'react'

// Gráficos del perfil: la nota de las últimas pruebas (Recharts, con su tabla para lectores de
// pantalla) y el porcentaje de aciertos por tema (barras en HTML). En el azul de la marca, sin
// animación: si el eje cambiaba de ancho (letra grande o fuente para dislexia) se reiniciaba.

const AZUL = '#3770bf'
// puntos de cada prueba: el mismo azul, más claro, para que la línea del promedio resalte
const AZUL_TENUE = '#9db8df'
const CORTO: Record<TemaCodigo, string> = {
  T19: 'Biodiversidad',
  T20: 'Poblaciones',
  T21: 'Ecología trófica',
  T22: 'Genética',
  T23: 'Evolución',
  T24: 'Sucesión',
}

const fechaCorta = (ms: number) => new Date(ms).toLocaleDateString('es-CR', { day: 'numeric', month: 'short' })

// Pruebas que se muestran en el gráfico y cuántas entran en el promedio de la línea.
const INTENTOS_VISIBLES = 20
const VENTANA = 5

type PuntoNota = { n: number; nota: number; promedio: number; fecha: number; nombre: string }

const promedio = (notas: number[]) => Math.round(notas.reduce((a, b) => a + b, 0) / notas.length)

function AyudaNota({ active, payload }: { active?: boolean; payload?: { payload: PuntoNota }[] }) {
  const p = active && payload?.[0]?.payload
  if (!p) return null
  return (
    <div className="grafico__ayuda">
      <div>
        <strong>{p.nota}</strong> de 100 · promedio {p.promedio}
      </div>
      <span>
        Intento {p.n} · {p.nombre} · {fechaCorta(p.fecha)}
      </span>
    </div>
  )
}

type BarraTema = {
  tema: TemaCodigo
  nombre: string
  dominio: number
  vistas: number
}

/**
 * Nota de las últimas pruebas: cada prueba es un punto tenue y la línea es el promedio de las
 * últimas {@link VENTANA}, que muestra si vas mejorando aunque las notas suban y bajen mucho de
 * una prueba a otra. Solo se dibujan las últimas {@link INTENTOS_VISIBLES} para que siga legible
 * con muchos intentos, y se dejan fuera las que se entregaron sin responder nada.
 */
export function GraficoNotas({ historial }: { historial: Resultado[] }) {
  // ordenados por fecha, del más viejo al más nuevo, para que la línea avance hacia la derecha
  const ordenados = [...historial].sort((a, b) => a.fecha - b.fecha)
  const respondidos = ordenados.filter((r) => r.sinResponder < r.total)
  const vacios = ordenados.length - respondidos.length
  const notas = respondidos.map(porcentaje)
  const todos: PuntoNota[] = respondidos.map((r, i) => ({
    n: i + 1,
    nota: notas[i],
    promedio: promedio(notas.slice(Math.max(0, i + 1 - VENTANA), i + 1)),
    fecha: r.fecha,
    nombre: r.nombre,
  }))
  const datos = todos.slice(-INTENTOS_VISIBLES)

  // las últimas VENTANA frente a las VENTANA anteriores
  const recientes = notas.slice(-VENTANA)
  const anteriores = notas.slice(-2 * VENTANA, -VENTANA)
  const actual = recientes.length ? promedio(recientes) : 0
  const cambio = anteriores.length ? actual - promedio(anteriores) : null

  return (
    <figure className="grafico">
      <figcaption className="grafico__titulo">Cómo van tus notas</figcaption>
      {datos.length < 2 ? (
        <p className="grafico__vacio">Cuando tengas al menos dos pruebas respondidas, aquí vas a ver cómo cambian tus notas.</p>
      ) : (
        <>
          <p className="grafico__resumen">
            <strong>{actual}</strong> de promedio en tus últimas {recientes.length} pruebas
            {cambio !== null && (
              <>
                {' · '}
                <strong className={cambio > 0 ? 'is-sube' : cambio < 0 ? 'is-baja' : undefined}>
                  {cambio > 0 ? `${cambio} puntos más` : cambio < 0 ? `${-cambio} puntos menos` : 'igual'}
                </strong>{' '}
                que las {anteriores.length} anteriores
              </>
            )}
          </p>
          <div className="grafico__lienzo" aria-hidden="true">
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={datos} margin={{ top: 12, right: 16, bottom: 4, left: 0 }}>
                <CartesianGrid vertical={false} className="grafico__rejilla" />
                <XAxis dataKey="n" tickLine={false} axisLine={false} tickMargin={8} interval="preserveStartEnd" minTickGap={16} padding={{ left: 12, right: 12 }} />
                <YAxis domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} tickLine={false} axisLine={false} width="auto" />
                <ReferenceLine y={NOTA_MINIMA} className="grafico__meta" strokeDasharray="4 4" />
                <Tooltip content={<AyudaNota />} cursor={{ className: 'grafico__cursor' }} isAnimationActive={false} />
                {/* cada prueba: solo el punto, sin línea que los una */}
                <Line
                  isAnimationActive={false}
                  dataKey="nota"
                  stroke="none"
                  dot={{ r: 4, fill: AZUL_TENUE, stroke: '#fff', strokeWidth: 1 }}
                  activeDot={{ r: 6, fill: AZUL, stroke: '#fff', strokeWidth: 2 }}
                />
                <Line isAnimationActive={false} type="linear" dataKey="promedio" stroke={AZUL} strokeWidth={3} dot={false} activeDot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="grafico__leyenda">
            <span>
              <span className="grafico__leyenda-punto" aria-hidden="true" /> Una prueba
            </span>
            <span>
              <span className="grafico__leyenda-linea" aria-hidden="true" /> Promedio de las últimas {VENTANA}
            </span>
            <span>
              <span className="grafico__leyenda-meta" aria-hidden="true" /> Para aprobar: {NOTA_MINIMA}
            </span>
          </div>
          {(todos.length > datos.length || vacios > 0) && (
            <p className="grafico__nota">
              {todos.length > datos.length && `Se muestran tus últimas ${datos.length} pruebas de ${todos.length}.`}
              {todos.length > datos.length && vacios > 0 && ' '}
              {vacios > 0 && (vacios === 1 ? 'No cuenta 1 prueba entregada sin respuestas.' : `No cuentan ${vacios} pruebas entregadas sin respuestas.`)}
            </p>
          )}
          <div className="sr-only">
            <table>
              <caption>Nota de cada prueba y promedio de las últimas {VENTANA}</caption>
              <thead>
                <tr>
                  <th scope="col">Intento</th>
                  <th scope="col">Fecha</th>
                  <th scope="col">Nota</th>
                  <th scope="col">Promedio</th>
                </tr>
              </thead>
              <tbody>
                {datos.map((p) => (
                  <tr key={p.n}>
                    <td>{p.n}</td>
                    <td>{fechaCorta(p.fecha)}</td>
                    <td>{p.nota}</td>
                    <td>{p.promedio}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </figure>
  )
}

/**
 * Porcentaje de aciertos por tema en barras horizontales hechas con HTML: ocupan todo el ancho de
 * la tarjeta, se reparten en su alto (va al lado del gráfico de notas) y marcan la nota para
 * aprobar con la misma línea punteada.
 */
export function GraficoTemas({ temas }: { temas: ProgresoTema[] }) {
  const porTema = new Map(temas.map((t) => [t.tema, t]))
  const datos: BarraTema[] = CODIGOS.flatMap((tema) => {
    const t = porTema.get(tema)
    return t && t.dominio !== null ? [{ tema, nombre: CORTO[tema], dominio: t.dominio, vistas: t.vistas }] : []
  })
  const sinPracticar = CODIGOS.filter((c) => !datos.some((d) => d.tema === c))

  return (
    <figure className="grafico grafico--temas">
      <figcaption className="grafico__titulo">Aciertos por tema</figcaption>
      {datos.length === 0 ? (
        <p className="grafico__vacio">Responde preguntas de cualquier tema y aquí vas a ver en cuáles te va mejor.</p>
      ) : (
        <>
          <ul className="barras" style={{ '--meta': `${NOTA_MINIMA}%` } as CSSProperties}>
            {datos.map((d) => {
              const detalle = `${TEMAS[d.tema]}: ${d.dominio}% de aciertos en ${d.vistas} ${d.vistas === 1 ? 'respuesta' : 'respuestas'}`
              return (
                <li key={d.tema} className={`barras__fila ${d.dominio >= NOTA_MINIMA ? 'is-aprobado' : ''}`} title={detalle}>
                  <span className="barras__nombre" aria-hidden="true">
                    {d.nombre}
                  </span>
                  <span className="barras__pista" aria-hidden="true">
                    <span className="barras__relleno" style={{ width: `${Math.max(d.dominio, 2)}%` }} />
                  </span>
                  <span className="barras__valor" aria-hidden="true">
                    {d.dominio}%
                  </span>
                  <span className="sr-only">{detalle}</span>
                </li>
              )
            })}
          </ul>
          <div className="grafico__leyenda">
            <span>
              <span className="grafico__leyenda-meta" aria-hidden="true" /> Para aprobar: {NOTA_MINIMA}%
            </span>
          </div>
        </>
      )}
      {datos.length > 0 && sinPracticar.length > 0 && <p className="grafico__nota">Sin practicar todavía: {sinPracticar.map((c) => CORTO[c]).join(', ')}.</p>}
    </figure>
  )
}
