import { esResultado } from './almacen'
import { CODIGOS, TOTAL_PREGUNTAS } from './banco'

/*
 * Respaldo del progreso. Todo lo que la persona construye en Savia vive solo en el
 * localStorage de este navegador, que se pierde al cambiar de teléfono, al borrar los datos
 * del navegador o, en iPhone, cuando Safari limpia los sitios que no se abren en una semana.
 * Con esto se descarga un archivo con todo el progreso y se puede restaurar después, en este
 * u otro dispositivo.
 */

export const VERSION_RESPALDO = 1
const TAMANO_MAXIMO = 2 * 1024 * 1024

// Lo que se respalda. La prueba en curso no entra: tiene un tiempo límite y no tiene sentido
// retomarla días después en otro dispositivo.
const CLAVES = {
  historial: 'savia:historial',
  aprendizaje: 'savia:aprendizaje',
  guardadas: 'savia:guardadas',
  diaria: 'savia:diaria',
  accesibilidad: 'savia:accesibilidad',
} as const

type Seccion = keyof typeof CLAVES
const SECCIONES = Object.keys(CLAVES) as Seccion[]

export interface Respaldo {
  app: 'savia'
  version: number
  fecha: number
  datos: Partial<Record<Seccion, unknown>>
}

export interface ResumenRespaldo {
  fecha: number
  intentos: number
  preguntasVistas: number
  guardadas: number
}

const esObjeto = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)
const esIdPregunta = (v: unknown) => Number.isInteger(v) && (v as number) > 0 && (v as number) <= TOTAL_PREGUNTAS
const esConteo = (v: unknown) => typeof v === 'number' && Number.isFinite(v) && v >= 0

function esEntradaAprendizaje(id: string, r: unknown) {
  return (
    esIdPregunta(Number(id)) &&
    esObjeto(r) &&
    CODIGOS.some((c) => c === r.t) &&
    typeof r.s === 'string' &&
    ['vistas', 'aciertos', 'fallos', 'caja', 'proxima', 'ultima'].every((campo) => esConteo(r[campo]))
  )
}

function leerClave(clave: string): unknown {
  try {
    const crudo = localStorage.getItem(clave)
    return crudo ? (JSON.parse(crudo) as unknown) : null
  } catch {
    return null
  }
}

/** Arma el respaldo con todo lo que hay guardado en este navegador. */
export function crearRespaldo(ahora = Date.now()): Respaldo {
  const datos: Respaldo['datos'] = {}
  for (const seccion of SECCIONES) {
    const valor = leerClave(CLAVES[seccion])
    if (valor !== null) datos[seccion] = valor
  }
  return { app: 'savia', version: VERSION_RESPALDO, fecha: ahora, datos }
}

/** Cuánto progreso trae un respaldo, para mostrarlo antes de restaurarlo. */
export function resumirRespaldo(respaldo: Respaldo): ResumenRespaldo {
  const { historial, aprendizaje, guardadas } = respaldo.datos
  return {
    fecha: respaldo.fecha,
    intentos: Array.isArray(historial) ? historial.length : 0,
    preguntasVistas: esObjeto(aprendizaje) ? Object.keys(aprendizaje).length : 0,
    guardadas: Array.isArray(guardadas) ? guardadas.length : 0,
  }
}

/**
 * Lee y valida el texto de un archivo de respaldo. Descarta las partes dañadas (por ejemplo
 * un intento con datos inválidos) y lanza un error con un mensaje para la persona si el
 * archivo no es un respaldo de Savia.
 */
export function leerRespaldo(texto: string): Respaldo {
  if (texto.length > TAMANO_MAXIMO) throw new Error('El archivo es demasiado grande para ser un respaldo de Savia.')
  let valor: unknown
  try {
    valor = JSON.parse(texto)
  } catch {
    throw new Error('El archivo no es un respaldo de Savia.')
  }
  if (!esObjeto(valor) || valor.app !== 'savia' || !esObjeto(valor.datos)) throw new Error('El archivo no es un respaldo de Savia.')
  if (!Number.isInteger(valor.version) || (valor.version as number) < 1) throw new Error('El archivo no es un respaldo de Savia.')
  if ((valor.version as number) > VERSION_RESPALDO) {
    throw new Error('Este respaldo viene de una versión más nueva de Savia. Recarga la página e inténtalo de nuevo.')
  }
  const fecha = typeof valor.fecha === 'number' && Number.isFinite(valor.fecha) ? valor.fecha : Date.now()
  const entrada = valor.datos
  const datos: Respaldo['datos'] = {}

  if (Array.isArray(entrada.historial)) datos.historial = entrada.historial.filter(esResultado)
  if (esObjeto(entrada.aprendizaje)) {
    datos.aprendizaje = Object.fromEntries(Object.entries(entrada.aprendizaje).filter(([id, r]) => esEntradaAprendizaje(id, r)))
  }
  if (Array.isArray(entrada.guardadas)) datos.guardadas = [...new Set(entrada.guardadas.filter(esIdPregunta))]
  // la pregunta del día y los ajustes de accesibilidad se validan al leerlos en su componente
  if (esObjeto(entrada.diaria)) datos.diaria = entrada.diaria
  if (esObjeto(entrada.accesibilidad)) datos.accesibilidad = entrada.accesibilidad

  return { app: 'savia', version: VERSION_RESPALDO, fecha, datos }
}

/**
 * Reemplaza el progreso de este navegador por el del respaldo. Lo que no venga en el
 * respaldo se borra, para que el resultado sea exactamente lo que se respaldó. Hay que
 * recargar la página después, porque el registro de aprendizaje vive en memoria.
 */
export function restaurarRespaldo(respaldo: Respaldo) {
  for (const seccion of SECCIONES) {
    const valor = respaldo.datos[seccion]
    if (valor === undefined) localStorage.removeItem(CLAVES[seccion])
    else localStorage.setItem(CLAVES[seccion], JSON.stringify(valor))
  }
}

/** Nombre del archivo, con la fecha local: savia-progreso-2026-11-16.json */
export function nombreArchivo(fecha = new Date()) {
  const dos = (n: number) => String(n).padStart(2, '0')
  return `savia-progreso-${fecha.getFullYear()}-${dos(fecha.getMonth() + 1)}-${dos(fecha.getDate())}.json`
}

/** Descarga el respaldo como archivo. */
export function descargarRespaldo() {
  const respaldo = crearRespaldo()
  const url = URL.createObjectURL(new Blob([JSON.stringify(respaldo)], { type: 'application/json' }))
  const enlace = document.createElement('a')
  enlace.href = url
  enlace.download = nombreArchivo(new Date(respaldo.fecha))
  document.body.appendChild(enlace)
  enlace.click()
  enlace.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
  return resumirRespaldo(respaldo)
}
