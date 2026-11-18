import { Bar, BarChart, CartesianGrid, LabelList, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { CODIGOS, NOTA_MINIMA, TEMAS, porcentaje, type Resultado, type TemaCodigo } from '../lib/banco'
import type { ProgresoTema } from '../lib/aprendizaje'

// Gráficos del perfil hechos con Recharts: la nota de cada intento (con la línea de la nota
// para aprobar) y el porcentaje de aciertos por tema. Una sola serie cada uno, en el azul de la
// marca; los textos van en las tintas de texto y cada gráfico trae su tabla para lectores de pantalla.
// Sin animación: las etiquetas de las barras salen al terminarla y, si el eje cambia de ancho
// (letra grande o fuente para dislexia), la animación se reiniciaba y nunca aparecían.

const AZUL = '#3770bf'
const CORTO: Record<TemaCodigo, string> = {
  T19: 'Biodiversidad',
  T20: 'Poblaciones',
  T21: 'Ecología trófica',
  T22: 'Genética',
  T23: 'Evolución',
  T24: 'Sucesión',
}

const fechaCorta = (ms: number) => new Date(ms).toLocaleDateString('es-CR', { day: 'numeric', month: 'short' })

type PuntoNota = { n: number; nota: number; fecha: number; nombre: string }

function AyudaNota({ active, payload }: { active?: boolean; payload?: { payload: PuntoNota }[] }) {
  const p = active && payload?.[0]?.payload
  if (!p) return null
  return (
    <div className="grafico__ayuda">
      <div>
        <strong>{p.nota}</strong> de 100
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

function AyudaTema({ active, payload }: { active?: boolean; payload?: { payload: BarraTema }[] }) {
  const b = active && payload?.[0]?.payload
  if (!b) return null
  return (
    <div className="grafico__ayuda">
      <div>
        <strong>{b.dominio}%</strong> de aciertos
      </div>
      <span>
        {TEMAS[b.tema]} · {b.vistas} {b.vistas === 1 ? 'respuesta' : 'respuestas'}
      </span>
    </div>
  )
}

export function GraficoNotas({ historial }: { historial: Resultado[] }) {
  // ordenados por fecha, del más viejo al más nuevo, para que la línea avance hacia la derecha
  const datos: PuntoNota[] = [...historial].sort((a, b) => a.fecha - b.fecha).map((r, i) => ({
    n: i + 1,
    nota: porcentaje(r),
    fecha: r.fecha,
    nombre: r.nombre,
  }))

  return (
    <figure className="grafico">
      <figcaption className="grafico__titulo">Tus notas, intento por intento</figcaption>
      {datos.length < 2 ? (
        <p className="grafico__vacio">Cuando tengas al menos dos intentos, aquí vas a ver cómo cambian tus notas.</p>
      ) : (
        <>
          <div className="grafico__lienzo" aria-hidden="true">
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={datos} margin={{ top: 12, right: 16, bottom: 4, left: 0 }}>
                <CartesianGrid vertical={false} className="grafico__rejilla" />
                <XAxis dataKey="n" tickLine={false} axisLine={false} tickMargin={8} interval="preserveStartEnd" padding={{ left: 12, right: 12 }} />
                <YAxis domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} tickLine={false} axisLine={false} width="auto" />
                <ReferenceLine y={NOTA_MINIMA} className="grafico__meta" strokeDasharray="4 4" />
                <Tooltip content={<AyudaNota />} cursor={{ className: 'grafico__cursor' }} isAnimationActive={false} />
                <Line
                  isAnimationActive={false}
                  type="monotone"
                  dataKey="nota"
                  stroke={AZUL}
                  strokeWidth={2}
                  dot={{ r: 4, fill: AZUL, stroke: '#fff', strokeWidth: 2 }}
                  activeDot={{
                    r: 6,
                    fill: AZUL,
                    stroke: '#fff',
                    strokeWidth: 2,
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="grafico__leyenda">
            <span className="grafico__leyenda-meta" aria-hidden="true" /> Nota para aprobar: {NOTA_MINIMA}
          </p>
          <div className="sr-only">
            <table>
              <caption>Nota de cada intento</caption>
              <thead>
                <tr>
                  <th scope="col">Intento</th>
                  <th scope="col">Fecha</th>
                  <th scope="col">Nota</th>
                </tr>
              </thead>
              <tbody>
                {datos.map((p) => (
                  <tr key={p.n}>
                    <td>{p.n}</td>
                    <td>{fechaCorta(p.fecha)}</td>
                    <td>{p.nota}</td>
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

export function GraficoTemas({ temas }: { temas: ProgresoTema[] }) {
  const porTema = new Map(temas.map((t) => [t.tema, t]))
  const datos: BarraTema[] = CODIGOS.flatMap((tema) => {
    const t = porTema.get(tema)
    return t && t.dominio !== null ? [{ tema, nombre: CORTO[tema], dominio: t.dominio, vistas: t.vistas }] : []
  })
  const sinPracticar = CODIGOS.filter((c) => !datos.some((d) => d.tema === c))

  return (
    <figure className="grafico">
      <figcaption className="grafico__titulo">Aciertos por tema</figcaption>
      {datos.length === 0 ? (
        <p className="grafico__vacio">Responde preguntas de cualquier tema y aquí vas a ver en cuáles te va mejor.</p>
      ) : (
        <>
          <div className="grafico__lienzo" aria-hidden="true">
            <ResponsiveContainer width="100%" height={Math.max(120, datos.length * 40 + 24)}>
              <BarChart data={datos} layout="vertical" margin={{ top: 0, right: 64, bottom: 0, left: 0 }} barCategoryGap={10}>
                <XAxis type="number" domain={[0, 100]} hide />
                <YAxis type="category" dataKey="nombre" tickLine={false} axisLine={false} width="auto" />
                <Tooltip content={<AyudaTema />} cursor={{ className: 'grafico__cursor-barra' }} isAnimationActive={false} />
                <Bar isAnimationActive={false} dataKey="dominio" fill={AZUL} radius={[0, 4, 4, 0]} minPointSize={3} maxBarSize={22} background={{ className: 'grafico__fondo-barra', radius: 4 }}>
                  <LabelList dataKey="dominio" position="right" formatter={(v) => `${String(v)}%`} className="grafico__valor" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="sr-only">
            <table>
              <caption>Porcentaje de aciertos por tema</caption>
              <thead>
                <tr>
                  <th scope="col">Tema</th>
                  <th scope="col">Aciertos</th>
                </tr>
              </thead>
              <tbody>
                {datos.map((d) => (
                  <tr key={d.tema}>
                    <td>{TEMAS[d.tema]}</td>
                    <td>{d.dominio}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
      {datos.length > 0 && sinPracticar.length > 0 && <p className="grafico__nota">Sin practicar todavía: {sinPracticar.map((c) => CORTO[c]).join(', ')}.</p>}
    </figure>
  )
}
