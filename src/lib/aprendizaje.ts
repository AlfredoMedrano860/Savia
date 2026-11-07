import { useSyncExternalStore } from 'react'
import { CODIGOS, TOTAL_PREGUNTAS, cargarPreguntas, type Pregunta, type Resultado, type TemaCodigo } from './banco'

/*
 * Registro de aprendizaje: cómo le ha ido a la persona con cada pregunta. Se guarda solo en
 * este navegador y alimenta tres cosas:
 *  - el progreso por tema (qué porcentaje acierta en cada tema y cuánto del banco ha visto),
 *  - el repaso espaciado (las preguntas falladas vuelven días después hasta dominarlas),
 *  - las preguntas guardadas por la persona.
 */

const CLAVE_REGISTRO = 'savia:aprendizaje'
const CLAVE_GUARDADAS = 'savia:guardadas'
const DIA = 86_400_000

// Repaso espaciado (sistema de cajas de Leitner): al fallar, la pregunta vuelve a la caja 0
// y sale al día siguiente; cada acierto la sube de caja y la espera crece. Con CAJA_DOMINADA
// aciertos seguidos después de un fallo se considera dominada y deja de salir en el repaso.
const ESPERA_DIAS = [1, 3, 7, 14]
export const CAJA_DOMINADA = 3

export interface RegistroPregunta {
  t: TemaCodigo
  s: string
  vistas: number
  aciertos: number
  fallos: number
  caja: number
  // momento desde el que vuelve a tocar repasarla (solo cuenta si alguna vez se falló)
  proxima: number
  ultima: number
}

type Registro = Record<string, RegistroPregunta>

function leer<T>(clave: string, valido: (v: unknown) => v is T, vacio: T): T {
  try {
    const crudo = localStorage.getItem(clave)
    if (!crudo) return vacio
    const valor: unknown = JSON.parse(crudo)
    return valido(valor) ? valor : vacio
  } catch {
    return vacio
  }
}

function escribir(clave: string, valor: unknown) {
  try {
    localStorage.setItem(clave, JSON.stringify(valor))
  } catch (error: unknown) {
    console.warn(`No se pudo guardar el almacenamiento local (${clave}).`, error)
  }
}

const esRegistro = (v: unknown): v is Registro => typeof v === 'object' && v !== null && !Array.isArray(v)
const esListaIds = (v: unknown): v is number[] =>
  Array.isArray(v) && v.every((n) => Number.isInteger(n) && n > 0 && n <= TOTAL_PREGUNTAS)

let registro: Registro = typeof window === 'undefined' ? {} : leer(CLAVE_REGISTRO, esRegistro, {})
let guardadas: number[] = typeof window === 'undefined' ? [] : leer(CLAVE_GUARDADAS, esListaIds, [])
const oyentes = new Set<() => void>()
const avisar = () => oyentes.forEach((o) => o())

/** Inicio del día de mañana (la pregunta fallada vuelve a salir desde ese momento). */
function inicioDeDia(desde: number, dias: number) {
  const d = new Date(desde)
  d.setHours(0, 0, 0, 0)
  return d.getTime() + dias * DIA
}

/** Anota una respuesta de la persona a una pregunta. */
function anotar(pregunta: Pregunta, acerto: boolean, ahora: number) {
  const previo = registro[pregunta.id]
  const r: RegistroPregunta = previo ?? { t: pregunta.t, s: pregunta.s, vistas: 0, aciertos: 0, fallos: 0, caja: 0, proxima: 0, ultima: 0 }
  r.vistas++
  r.ultima = ahora
  if (acerto) {
    r.aciertos++
    if (r.fallos > 0) {
      r.caja = Math.min(r.caja + 1, ESPERA_DIAS.length)
      r.proxima = inicioDeDia(ahora, ESPERA_DIAS[Math.min(r.caja, ESPERA_DIAS.length - 1)])
    }
  } else {
    r.fallos++
    r.caja = 0
    r.proxima = inicioDeDia(ahora, ESPERA_DIAS[0])
  }
  registro = { ...registro, [pregunta.id]: r }
}

/**
 * Anota en el registro todas las preguntas respondidas de un resultado. Las que se dejaron
 * sin responder no cuentan (por ejemplo, si se acabó el tiempo).
 */
export async function registrarResultado(resultado: Resultado) {
  if (!resultado.detalle.length) return
  const preguntas = await cargarPreguntas()
  const porId = new Map(preguntas.map((p) => [p.id, p]))
  for (const d of resultado.detalle) {
    const pregunta = porId.get(d.id)
    if (pregunta && d.elegida !== null) anotar(pregunta, d.elegida === pregunta.r, resultado.fecha)
  }
  escribir(CLAVE_REGISTRO, registro)
  avisar()
}

/** Anota una sola respuesta (la pregunta del día). */
export function registrarRespuesta(pregunta: Pregunta, elegida: number) {
  anotar(pregunta, elegida === pregunta.r, Date.now())
  escribir(CLAVE_REGISTRO, registro)
  avisar()
}

/** Ids de las preguntas falladas que ya toca repasar (sin dominar y con su fecha cumplida). */
export function pendientesDeRepaso(ahora = Date.now()) {
  return Object.entries(registro)
    .filter(([, r]) => r.fallos > 0 && r.caja < CAJA_DOMINADA && r.proxima <= ahora)
    .sort((a, b) => a[1].proxima - b[1].proxima)
    .map(([id]) => Number(id))
}

/** Cuántas preguntas falladas siguen sin dominarse, y cuándo toca la próxima. */
export function estadoRepaso(ahora = Date.now()) {
  const enCurso = Object.values(registro).filter((r) => r.fallos > 0 && r.caja < CAJA_DOMINADA)
  const futuras = enCurso.filter((r) => r.proxima > ahora).map((r) => r.proxima)
  const dominadas = Object.values(registro).filter((r) => r.fallos > 0 && r.caja >= CAJA_DOMINADA).length
  return {
    pendientes: enCurso.length - futuras.length,
    enCurso: enCurso.length,
    dominadas,
    siguiente: futuras.length ? Math.min(...futuras) : null,
  }
}

export interface ProgresoTema {
  tema: TemaCodigo
  vistas: number
  aciertos: number
  // preguntas distintas del tema que ya respondió al menos una vez
  distintas: number
  // porcentaje de aciertos sobre todas sus respuestas en el tema (null si no ha respondido)
  dominio: number | null
  // subtema con menos aciertos (con al menos 2 respuestas), para sugerir qué repasar
  subtemaDebil: string | null
}

/** Progreso de la persona en cada uno de los seis temas. */
export function progresoPorTema(): ProgresoTema[] {
  return CODIGOS.map((tema) => {
    const lista = Object.values(registro).filter((r) => r.t === tema)
    const vistas = lista.reduce((s, r) => s + r.vistas, 0)
    const aciertos = lista.reduce((s, r) => s + r.aciertos, 0)
    const porSubtema = new Map<string, { vistas: number; aciertos: number }>()
    for (const r of lista) {
      const s = porSubtema.get(r.s) ?? { vistas: 0, aciertos: 0 }
      s.vistas += r.vistas
      s.aciertos += r.aciertos
      porSubtema.set(r.s, s)
    }
    const candidatos = [...porSubtema].filter(([, s]) => s.vistas >= 2).sort((a, b) => a[1].aciertos / a[1].vistas - b[1].aciertos / b[1].vistas)
    const peor = candidatos[0]
    return {
      tema,
      vistas,
      aciertos,
      distintas: lista.length,
      dominio: vistas ? Math.round((aciertos / vistas) * 100) : null,
      subtemaDebil: peor && peor[1].aciertos / peor[1].vistas < 1 ? peor[0] : null,
    }
  })
}

/** Borra el registro de aprendizaje (no toca las preguntas guardadas). */
export function borrarRegistro() {
  registro = {}
  escribir(CLAVE_REGISTRO, registro)
  avisar()
}

export const estaGuardada = (id: number) => guardadas.includes(id)
export const idsGuardadas = () => guardadas

/** Guarda o quita una pregunta de "Mis preguntas guardadas". Devuelve si quedó guardada. */
export function alternarGuardada(id: number) {
  guardadas = guardadas.includes(id) ? guardadas.filter((g) => g !== id) : [id, ...guardadas]
  escribir(CLAVE_GUARDADAS, guardadas)
  avisar()
  return guardadas.includes(id)
}

let version = 0
oyentes.add(() => version++)
const suscribir = (o: () => void) => {
  oyentes.add(o)
  return () => oyentes.delete(o)
}

/** Vuelve a renderizar el componente cada vez que cambia el registro o las guardadas. */
export function useAprendizaje() {
  useSyncExternalStore(suscribir, () => version)
}
