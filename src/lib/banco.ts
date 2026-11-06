export interface Pregunta {
  id: number
  t: TemaCodigo
  s: string
  p: string
  o: string[]
  r: number
  e: string
}

export type TemaCodigo = 'T19' | 'T20' | 'T21' | 'T22' | 'T23' | 'T24'

export const TOTAL_PREGUNTAS = 1000

let preguntasPendientes: Promise<Pregunta[]> | undefined

function esPregunta(valor: unknown): valor is Pregunta {
  if (typeof valor !== 'object' || valor === null) return false
  const pregunta = valor as Partial<Pregunta>
  return (
    Number.isSafeInteger(pregunta.id) &&
    (pregunta.id ?? 0) > 0 &&
    (pregunta.id ?? TOTAL_PREGUNTAS + 1) <= TOTAL_PREGUNTAS &&
    esTemaCodigo(pregunta.t) &&
    typeof pregunta.s === 'string' &&
    typeof pregunta.p === 'string' &&
    Array.isArray(pregunta.o) &&
    pregunta.o.length === 4 &&
    pregunta.o.every((opcion) => typeof opcion === 'string') &&
    Number.isInteger(pregunta.r) &&
    (pregunta.r ?? -1) >= 0 &&
    (pregunta.r ?? 4) < pregunta.o.length &&
    typeof pregunta.e === 'string'
  )
}

export function cargarPreguntas(): Promise<Pregunta[]> {
  preguntasPendientes ??= import('../data/preguntas.json?url').then(async ({ default: url }) => {
    const respuesta = await fetch(url, { credentials: 'same-origin' })
    if (!respuesta.ok) throw new Error(`No se pudo cargar el banco de preguntas (HTTP ${respuesta.status}).`)
    const datos: unknown = await respuesta.json()
    if (!Array.isArray(datos) || datos.length !== TOTAL_PREGUNTAS) {
      throw new Error('El banco de preguntas está incompleto o tiene un formato inválido.')
    }
    const preguntas = datos.filter((dato: unknown): dato is Pregunta => esPregunta(dato))
    const ids = new Set(preguntas.map((pregunta) => pregunta.id))
    if (preguntas.length !== datos.length || ids.size !== TOTAL_PREGUNTAS) {
      throw new Error('El banco de preguntas contiene datos inválidos.')
    }
    return preguntas
  })
  return preguntasPendientes
}

export const TEMAS: Record<TemaCodigo, string> = {
  T19: 'Sistemas biológicos, adaptaciones y biodiversidad',
  T20: 'Poblaciones y relaciones entre seres vivos',
  T21: 'Ecología trófica, fotosíntesis y ciclos',
  T22: 'Ácidos nucleicos, genética y biotecnología',
  T23: 'Evolución',
  T24: 'Sucesión, restauración y desarrollo sostenible',
}
export const CODIGOS = Object.keys(TEMAS) as TemaCodigo[]

function esTemaCodigo(valor: unknown): valor is TemaCodigo {
  return typeof valor === 'string' && CODIGOS.some((codigo) => codigo === valor)
}

export type ModoId = 'completa' | 'corta' | 'quiz' | 'repaso' | 'tema'

export interface Modo {
  id: ModoId
  nombre: string
  preguntas: number
  minutos: number
}

// La prueba completa dura 2 horas: 2 minutos por pregunta en todos los modos.
export const MINUTOS_POR_PREGUNTA = 2
export const NOTA_MINIMA = 70

export const MODOS: Modo[] = [
  { id: 'completa', nombre: 'Prueba completa', preguntas: 60, minutos: 120 },
  { id: 'corta', nombre: 'Prueba corta', preguntas: 30, minutos: 60 },
  { id: 'quiz', nombre: 'Quiz', preguntas: 15, minutos: 30 },
]

export const LETRAS = ['A', 'B', 'C', 'D']

export interface ItemPrueba {
  id: number
  // orden en que se muestran las opciones (índices de la pregunta original)
  orden: number[]
}

export interface Prueba {
  modo: ModoId
  nombre: string
  items: ItemPrueba[]
  // respuesta elegida por ítem: índice de la opción original, o null
  respuestas: (number | null)[]
  marcadas: boolean[]
  actual: number
  inicio: number
  limite: number
}

function aleatorio(max: number) {
  const buf = new Uint32Array(1)
  crypto.getRandomValues(buf)
  return buf[0] % max
}

export function mezclar<T>(lista: T[]): T[] {
  const copia = [...lista]
  for (let i = copia.length - 1; i > 0; i--) {
    const j = aleatorio(i + 1)
    ;[copia[i], copia[j]] = [copia[j], copia[i]]
  }
  return copia
}

// Reparte las preguntas lo más parejo posible entre los seis temas.
function cuposPorTema(total: number): Map<TemaCodigo, number> {
  const base = Math.floor(total / CODIGOS.length)
  const extra = total % CODIGOS.length
  const conExtra = new Set(mezclar(CODIGOS).slice(0, extra))
  return new Map(CODIGOS.map((t) => [t, base + (conExtra.has(t) ? 1 : 0)]))
}

function crearPrueba(modo: ModoId, nombre: string, ids: number[], minutos: number): Prueba {
  const inicio = Date.now()
  return {
    modo,
    nombre,
    items: ids.map((id) => ({ id, orden: mezclar([0, 1, 2, 3]) })),
    respuestas: ids.map(() => null),
    marcadas: ids.map(() => false),
    actual: 0,
    inicio,
    limite: inicio + minutos * 60_000,
  }
}

export async function nuevaPrueba(modo: Modo): Promise<Prueba> {
  const preguntas = await cargarPreguntas()
  const cupos = cuposPorTema(modo.preguntas)
  const ids = CODIGOS.flatMap((t) =>
    mezclar(preguntas.filter((p) => p.t === t))
      .slice(0, cupos.get(t))
      .map((p) => p.id),
  )
  return crearPrueba(modo.id, modo.nombre, mezclar(ids), modo.minutos)
}

// ---------- pruebas imprimibles ----------
// Cada prueba impresa tiene un código (por ejemplo Q7KM2X) del que sale siempre la misma
// prueba: la letra inicial dice el tamaño (Q quiz, C corta, P completa) y el resto es la
// semilla. Así, quien la resolvió en papel puede escribir el código en Savia para ver las
// respuestas, aunque haya cerrado la página.
const LETRA_MODO: Record<string, ModoId> = { Q: 'quiz', C: 'corta', P: 'completa' }
const ALFABETO_CODIGO = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'

/** Limpia lo que escribió la persona (mayúsculas, sin espacios ni guiones) y lo valida. */
export function normalizarCodigo(texto: string): string | null {
  const codigo = texto.toUpperCase().replace(/[\s-]/g, '')
  return /^[QCP][ABCDEFGHJKMNPQRSTUVWXYZ2-9]{5}$/.test(codigo) ? codigo : null
}

/** Código nuevo al azar para una prueba imprimible del tamaño indicado. */
export function nuevoCodigo(modo: Modo): string {
  const letra = Object.entries(LETRA_MODO).find(([, id]) => id === modo.id)?.[0] ?? 'Q'
  return letra + Array.from({ length: 5 }, () => ALFABETO_CODIGO[aleatorio(ALFABETO_CODIGO.length)]).join('')
}

/** Generador de números pseudoaleatorios con semilla (mulberry32): misma semilla, mismos números. */
function generadorConSemilla(texto: string) {
  let h = 1779033703 ^ texto.length
  for (let i = 0; i < texto.length; i++) h = Math.imul(h ^ texto.charCodeAt(i), 3432918353)
  let a = h >>> 0
  return (max: number) => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return (((t ^ (t >>> 14)) >>> 0) % max)
  }
}

function mezclarCon<T>(lista: T[], azar: (max: number) => number): T[] {
  const copia = [...lista]
  for (let i = copia.length - 1; i > 0; i--) {
    const j = azar(i + 1)
    ;[copia[i], copia[j]] = [copia[j], copia[i]]
  }
  return copia
}

/** Arma la prueba imprimible que corresponde a un código (siempre la misma para el mismo código). */
export async function pruebaImprimible(codigo: string): Promise<Prueba> {
  const modo = MODOS.find((m) => m.id === LETRA_MODO[codigo[0]])
  if (!modo) throw new Error(`Código de prueba inválido: ${codigo}`)
  const preguntas = await cargarPreguntas()
  const azar = generadorConSemilla(codigo)
  const base = Math.floor(modo.preguntas / CODIGOS.length)
  const conExtra = new Set(mezclarCon(CODIGOS, azar).slice(0, modo.preguntas % CODIGOS.length))
  const ids = CODIGOS.flatMap((t) =>
    mezclarCon(preguntas.filter((p) => p.t === t), azar)
      .slice(0, base + (conExtra.has(t) ? 1 : 0))
      .map((p) => p.id),
  )
  const ordenados = mezclarCon(ids, azar)
  const inicio = Date.now()
  return {
    modo: modo.id,
    nombre: `${modo.nombre} para imprimir`,
    items: ordenados.map((id) => ({ id, orden: mezclarCon([0, 1, 2, 3], azar) })),
    respuestas: ordenados.map(() => null),
    marcadas: ordenados.map(() => false),
    actual: 0,
    inicio,
    limite: inicio + modo.minutos * 60_000,
  }
}

export const PREGUNTAS_POR_TEMA = 15

export async function pruebaDeTema(tema: TemaCodigo): Promise<Prueba> {
  const preguntas = await cargarPreguntas()
  const ids = mezclar(preguntas.filter((p) => p.t === tema))
    .slice(0, PREGUNTAS_POR_TEMA)
    .map((p) => p.id)
  return crearPrueba('tema', `Práctica · ${TEMAS[tema]}`, ids, PREGUNTAS_POR_TEMA * MINUTOS_POR_PREGUNTA)
}

export function subtemas(tema: TemaCodigo, preguntas: Pregunta[]) {
  const conteo = new Map<string, number>()
  for (const p of preguntas) if (p.t === tema) conteo.set(p.s, (conteo.get(p.s) ?? 0) + 1)
  return [...conteo].map(([nombre, total]) => ({ nombre, total }))
}

// Práctica con preguntas elegidas (repaso de errores, repaso espaciado o guardadas).
export function pruebaDeRepaso(ids: number[], nombre = 'Repaso de errores'): Prueba {
  return crearPrueba('repaso', nombre, mezclar(ids), ids.length * MINUTOS_POR_PREGUNTA)
}

export interface Resultado {
  modo: ModoId
  nombre: string
  fecha: number
  segundos: number
  total: number
  correctas: number
  sinResponder: number
  porTema: Record<TemaCodigo, { correctas: number; total: number }>
  // id de pregunta → opción elegida (índice original) o null
  detalle: { id: number; elegida: number | null; orden: number[] }[]
}

export async function calificar(prueba: Prueba, fin = Date.now()): Promise<Resultado> {
  const preguntas = await cargarPreguntas()
  const porId = new Map(preguntas.map((p) => [p.id, p]))
  const porTema = Object.fromEntries(CODIGOS.map((t) => [t, { correctas: 0, total: 0 }])) as Resultado['porTema']
  let correctas = 0
  let sinResponder = 0
  prueba.items.forEach((item, i) => {
    const p = porId.get(item.id)
    if (!p) throw new Error(`No se encontró la pregunta ${item.id} al calificar.`)
    const elegida = prueba.respuestas[i]
    porTema[p.t].total++
    if (elegida === null) sinResponder++
    else if (elegida === p.r) {
      correctas++
      porTema[p.t].correctas++
    }
  })
  return {
    modo: prueba.modo,
    nombre: prueba.nombre,
    fecha: fin,
    segundos: Math.round((Math.min(fin, prueba.limite) - prueba.inicio) / 1000),
    total: prueba.items.length,
    correctas,
    sinResponder,
    porTema,
    detalle: prueba.items.map((item, i) => ({ id: item.id, elegida: prueba.respuestas[i], orden: item.orden })),
  }
}

export const porcentaje = (r: Pick<Resultado, 'correctas' | 'total'>) => Math.round((r.correctas / r.total) * 100)
