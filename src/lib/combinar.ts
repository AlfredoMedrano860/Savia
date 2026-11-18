import type { RegistroPregunta } from './aprendizaje'
import type { Resultado } from './banco'
import { VERSION_RESPALDO, type Respaldo } from './respaldo'

/*
 * Junta el progreso de este dispositivo con el guardado en la cuenta, sin perder nada:
 *  - intentos: la unión de los dos (sin repetir) y, como en el historial local, los 30 más nuevos;
 *  - aprendizaje: por pregunta, el registro que se usó más recientemente;
 *  - guardadas: la unión, primero las de este dispositivo;
 *  - pregunta del día: la del día más reciente;
 *  - accesibilidad: solo la de este dispositivo, aunque no tenga (es una preferencia de la pantalla que se usa);
 *  - perfil (el blobatar elegido): el que se eligió más recientemente.
 * Los dos respaldos tienen que venir ya validados con leerRespaldo().
 */
export const MAX_INTENTOS = 30

type Registro = Record<string, RegistroPregunta>
interface Diaria {
  fecha: string
}
interface Perfil {
  avatar: string
  actualizado: number
}

const claveIntento = (r: Resultado) => `${r.fecha}|${r.modo}|${r.nombre}|${r.correctas}/${r.total}`

function combinarHistorial(a: Resultado[] = [], b: Resultado[] = []) {
  const vistos = new Map<string, Resultado>()
  for (const r of [...a, ...b]) if (!vistos.has(claveIntento(r))) vistos.set(claveIntento(r), r)
  return [...vistos.values()].sort((x, y) => y.fecha - x.fecha).slice(0, MAX_INTENTOS)
}

function combinarAprendizaje(a: Registro = {}, b: Registro = {}) {
  const resultado: Registro = { ...b }
  for (const [id, local] of Object.entries(a)) {
    const nube = resultado[id]
    if (!nube || local.ultima > nube.ultima || (local.ultima === nube.ultima && local.vistas >= nube.vistas)) resultado[id] = local
  }
  return resultado
}

const combinarGuardadas = (a: number[] = [], b: number[] = []) => [...new Set([...a, ...b])]

function combinarDiaria(a?: Diaria, b?: Diaria) {
  if (!a) return b
  if (!b) return a
  return b.fecha > a.fecha ? b : a
}

export function combinarRespaldos(local: Respaldo, nube: Respaldo, ahora = Date.now()): Respaldo {
  const l = local.datos
  const n = nube.datos
  const datos: Respaldo['datos'] = {}
  const historial = combinarHistorial(l.historial as Resultado[] | undefined, n.historial as Resultado[] | undefined)
  if (historial.length) datos.historial = historial
  const aprendizaje = combinarAprendizaje(l.aprendizaje as Registro | undefined, n.aprendizaje as Registro | undefined)
  if (Object.keys(aprendizaje).length) datos.aprendizaje = aprendizaje
  const guardadas = combinarGuardadas(l.guardadas as number[] | undefined, n.guardadas as number[] | undefined)
  if (guardadas.length || l.guardadas || n.guardadas) datos.guardadas = guardadas
  const diaria = combinarDiaria(l.diaria as Diaria | undefined, n.diaria as Diaria | undefined)
  if (diaria) datos.diaria = diaria
  // solo la de este dispositivo, nunca la de la cuenta: al apagar todos los ajustes se borran
  // del navegador, y tomar la de la cuenta los volvía a encender al recargar
  if (l.accesibilidad) datos.accesibilidad = l.accesibilidad
  const pl = l.perfil as Perfil | undefined
  const pn = n.perfil as Perfil | undefined
  const perfil = pl && pn ? (pn.actualizado > pl.actualizado ? pn : pl) : (pl ?? pn)
  if (perfil) datos.perfil = perfil
  return { app: 'savia', version: VERSION_RESPALDO, fecha: ahora, datos }
}

/** Si dos respaldos traen exactamente el mismo progreso (sin mirar la fecha del respaldo). */
/** El progreso sin los ajustes de accesibilidad, que son de cada dispositivo y no se suben a la cuenta. */
export function sinAccesibilidad(respaldo: Respaldo): Respaldo {
  const datos = { ...respaldo.datos }
  delete datos.accesibilidad
  return { ...respaldo, datos }
}

/** Si dos respaldos traen el mismo progreso (sin contar la accesibilidad de cada dispositivo). */
export const mismoProgreso = (a: Respaldo, b: Respaldo) => JSON.stringify(ordenar(sinAccesibilidad(a).datos)) === JSON.stringify(ordenar(sinAccesibilidad(b).datos))

function ordenar(valor: unknown): unknown {
  if (Array.isArray(valor)) return valor.map(ordenar)
  if (valor && typeof valor === 'object') {
    return Object.fromEntries(Object.keys(valor).sort().map((k) => [k, ordenar((valor as Record<string, unknown>)[k])]))
  }
  return valor
}
