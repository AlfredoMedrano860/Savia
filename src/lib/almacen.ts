import { CODIGOS, TOTAL_PREGUNTAS, type ModoId, type Prueba, type Resultado } from './banco'

const CLAVE_PRUEBA = 'ribosoma:prueba'
const CLAVE_HISTORIAL = 'ribosoma:historial'
const MAX_HISTORIAL = 30

function esObjeto(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === 'object' && valor !== null
}

function esOrdenOpciones(valor: unknown): valor is number[] {
  return Array.isArray(valor) && valor.length === 4 && valor.every((n) => Number.isInteger(n) && n >= 0 && n < 4) && new Set(valor).size === 4
}

function esPrueba(valor: unknown): valor is Prueba {
  if (!esObjeto(valor)) return false
  const modos: ModoId[] = ['completa', 'corta', 'quiz', 'repaso', 'tema']
  const { items, respuestas, marcadas, actual, inicio, limite, modo, nombre } = valor
  if (!modos.includes(modo as ModoId) || typeof nombre !== 'string' || nombre.length > 200) return false
  if (!Array.isArray(items) || items.length === 0 || items.length > TOTAL_PREGUNTAS) return false
  if (!Array.isArray(respuestas) || respuestas.length !== items.length || !respuestas.every((r) => r === null || (Number.isInteger(r) && r >= 0 && r < 4))) return false
  if (!Array.isArray(marcadas) || marcadas.length !== items.length || !marcadas.every((m) => typeof m === 'boolean')) return false
  if (!Number.isInteger(actual) || (actual as number) < 0 || (actual as number) >= items.length) return false
  if (typeof inicio !== 'number' || !Number.isFinite(inicio) || typeof limite !== 'number' || !Number.isFinite(limite) || limite <= inicio) return false
  return items.every(
    (item) =>
      esObjeto(item) &&
      Number.isInteger(item.id) &&
      (item.id as number) > 0 &&
      (item.id as number) <= TOTAL_PREGUNTAS &&
      esOrdenOpciones(item.orden),
  )
}

function esConteoTema(valor: unknown): valor is { correctas: number; total: number } {
  return (
    esObjeto(valor) &&
    Number.isInteger(valor.correctas) &&
    Number.isInteger(valor.total) &&
    (valor.correctas as number) >= 0 &&
    (valor.total as number) >= (valor.correctas as number)
  )
}

export function esResultado(valor: unknown): valor is Resultado {
  if (!esObjeto(valor)) return false
  const modos: ModoId[] = ['completa', 'corta', 'quiz', 'repaso', 'tema']
  const { modo, nombre, fecha, segundos, total, correctas, sinResponder, porTema, detalle } = valor
  if (!modos.includes(modo as ModoId) || typeof nombre !== 'string' || nombre.length > 200) return false
  if (![fecha, segundos, total, correctas, sinResponder].every((n) => typeof n === 'number' && Number.isFinite(n))) return false
  if ((total as number) <= 0 || (total as number) > TOTAL_PREGUNTAS || (correctas as number) < 0 || (sinResponder as number) < 0) return false
  if ((correctas as number) + (sinResponder as number) > (total as number) || (segundos as number) < 0) return false
  if (!esObjeto(porTema) || !CODIGOS.every((codigo) => esConteoTema(porTema[codigo]))) return false
  const conteos = CODIGOS.map((codigo) => porTema[codigo] as { correctas: number; total: number })
  if (conteos.reduce((sum, item) => sum + item.total, 0) !== total) return false
  if (conteos.reduce((sum, item) => sum + item.correctas, 0) !== correctas) return false
  if (!Array.isArray(detalle) || detalle.length > (total as number)) return false
  return detalle.every(
    (item) =>
      esObjeto(item) &&
      Number.isInteger(item.id) &&
      (item.id as number) > 0 &&
      (item.id as number) <= TOTAL_PREGUNTAS &&
      (item.elegida === null || (Number.isInteger(item.elegida) && (item.elegida as number) >= 0 && (item.elegida as number) < 4)) &&
      esOrdenOpciones(item.orden),
  )
}

function leer(clave: string): unknown | null {
  try {
    const valor = localStorage.getItem(clave)
    if (!valor) return null
    try {
      return JSON.parse(valor) as unknown
    } catch (error: unknown) {
      console.warn(`Se descartaron datos de almacenamiento dañados (${clave}).`, error)
      localStorage.removeItem(clave)
      return null
    }
  } catch (error: unknown) {
    console.warn(`No se pudo leer el almacenamiento local (${clave}).`, error)
    return null
  }
}

function escribir(clave: string, valor: unknown) {
  try {
    if (valor === null) localStorage.removeItem(clave)
    else localStorage.setItem(clave, JSON.stringify(valor))
  } catch (error: unknown) {
    console.warn(`No se pudo guardar el almacenamiento local (${clave}).`, error)
  }
}

export function cargarPrueba(): Prueba | null {
  const valor = leer(CLAVE_PRUEBA)
  if (valor === null) return null
  if (esPrueba(valor)) return valor
  console.warn('Se descartó una prueba guardada con datos inválidos.')
  escribir(CLAVE_PRUEBA, null)
  return null
}

export const guardarPrueba = (prueba: Prueba | null) => escribir(CLAVE_PRUEBA, prueba)

export function cargarHistorial(): Resultado[] {
  const valor = leer(CLAVE_HISTORIAL)
  if (valor === null) return []
  if (!Array.isArray(valor)) {
    console.warn('Se descartó un historial guardado con formato inválido.')
    escribir(CLAVE_HISTORIAL, null)
    return []
  }
  const validos = valor.filter(esResultado)
  if (validos.length !== valor.length) {
    console.warn('Se descartaron intentos guardados con datos inválidos.')
    escribir(CLAVE_HISTORIAL, validos)
  }
  return validos
}

// Cada intento guarda su detalle (pregunta, opción elegida y orden de opciones) para poder
// revisarlo después desde el historial. Son pocos datos por intento (unos 2 KB en una
// prueba completa), así que los 30 intentos caben de sobra en el almacenamiento.
export function agregarAlHistorial(resultado: Resultado) {
  escribir(CLAVE_HISTORIAL, [resultado, ...cargarHistorial()].slice(0, MAX_HISTORIAL))
}

export const borrarHistorial = () => escribir(CLAVE_HISTORIAL, null)
