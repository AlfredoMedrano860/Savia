import { describe, expect, it } from 'vitest'
import type { RegistroPregunta } from './aprendizaje'
import type { Resultado } from './banco'
import { combinarRespaldos, MAX_INTENTOS, mismoProgreso, sinAccesibilidad } from './combinar'
import type { Respaldo } from './respaldo'

const respaldo = (datos: Respaldo['datos']): Respaldo => ({ app: 'savia', version: 1, fecha: 1, datos })
const intento = (fecha: number, correctas = 5): Resultado =>
  ({ modo: 'quiz', nombre: 'Quiz', fecha, segundos: 60, total: 15, correctas, sinResponder: 0, porTema: {}, detalle: [] }) as unknown as Resultado
const registro = (ultima: number, vistas = 1): RegistroPregunta => ({ t: 'T19', s: 'Adaptaciones', vistas, aciertos: 1, fallos: vistas - 1, caja: 0, proxima: 0, ultima })

describe('combinarRespaldos', () => {
  it('junta los intentos de los dos lados sin repetir, del más nuevo al más viejo', () => {
    const local = respaldo({ historial: [intento(300), intento(100)] })
    const nube = respaldo({ historial: [intento(200), intento(100)] })
    const r = combinarRespaldos(local, nube)
    expect((r.datos.historial as Resultado[]).map((i) => i.fecha)).toEqual([300, 200, 100])
  })

  it(`se queda con los ${MAX_INTENTOS} intentos más nuevos`, () => {
    const local = respaldo({ historial: Array.from({ length: 25 }, (_, i) => intento(i * 2)) })
    const nube = respaldo({ historial: Array.from({ length: 25 }, (_, i) => intento(i * 2 + 1)) })
    const historial = combinarRespaldos(local, nube).datos.historial as Resultado[]
    expect(historial).toHaveLength(MAX_INTENTOS)
    expect(historial[0].fecha).toBe(49)
    expect(historial.at(-1)!.fecha).toBe(20)
  })

  it('por pregunta, gana el registro usado más recientemente', () => {
    const local = respaldo({ aprendizaje: { 1: registro(500), 2: registro(100) } })
    const nube = respaldo({ aprendizaje: { 2: registro(900, 4), 3: registro(50) } })
    const a = combinarRespaldos(local, nube).datos.aprendizaje as Record<string, RegistroPregunta>
    expect(Object.keys(a).sort()).toEqual(['1', '2', '3'])
    expect(a[1].ultima).toBe(500)
    expect(a[2]).toEqual(registro(900, 4))
  })

  it('une las guardadas, primero las de este dispositivo', () => {
    const r = combinarRespaldos(respaldo({ guardadas: [5, 2] }), respaldo({ guardadas: [2, 9] }))
    expect(r.datos.guardadas).toEqual([5, 2, 9])
  })

  it('la pregunta del día más reciente gana', () => {
    const r = combinarRespaldos(respaldo({ diaria: { fecha: '2026-11-10', racha: 2 } }), respaldo({ diaria: { fecha: '2026-11-12', racha: 4 } }))
    expect(r.datos.diaria).toEqual({ fecha: '2026-11-12', racha: 4 })
  })

  it('la accesibilidad es solo la de este dispositivo, aunque no tenga', () => {
    expect(combinarRespaldos(respaldo({ accesibilidad: { tamano: 'grande' } }), respaldo({ accesibilidad: { tamano: 'maximo' } })).datos.accesibilidad).toEqual({ tamano: 'grande' })
    expect(combinarRespaldos(respaldo({}), respaldo({ accesibilidad: { mascaraLectura: true } })).datos.accesibilidad).toBeUndefined()
  })

  it('no cuenta la accesibilidad al comparar ni la sube a la cuenta', () => {
    const conAjustes = respaldo({ guardadas: [3], accesibilidad: { mascaraLectura: true } })
    expect(mismoProgreso(conAjustes, respaldo({ guardadas: [3] }))).toBe(true)
    expect(sinAccesibilidad(conAjustes).datos).toEqual({ guardadas: [3] })
  })

  it('un dispositivo nuevo recibe todo lo de la cuenta', () => {
    const nube = respaldo({ historial: [intento(5)], aprendizaje: { 7: registro(5) }, guardadas: [7] })
    expect(mismoProgreso(combinarRespaldos(respaldo({}), nube), nube)).toBe(true)
  })

  it('una cuenta vacía recibe todo lo del dispositivo', () => {
    const local = respaldo({ historial: [intento(5)], aprendizaje: { 7: registro(5) }, guardadas: [7] })
    expect(mismoProgreso(combinarRespaldos(local, respaldo({})), local)).toBe(true)
  })

  it('combinar dos veces no cambia nada (no hay recargas en bucle)', () => {
    const local = respaldo({ historial: [intento(3)], guardadas: [1] })
    const nube = respaldo({ historial: [intento(4)], guardadas: [2] })
    const una = combinarRespaldos(local, nube)
    expect(mismoProgreso(combinarRespaldos(una, una), una)).toBe(true)
    expect(mismoProgreso(combinarRespaldos(una, nube), una)).toBe(true)
  })
})

describe('mismoProgreso', () => {
  it('no depende del orden de las claves ni de la fecha del respaldo', () => {
    const a: Respaldo = { app: 'savia', version: 1, fecha: 1, datos: { guardadas: [1], diaria: { fecha: 'x', racha: 1 } } }
    const b: Respaldo = { app: 'savia', version: 1, fecha: 99, datos: { diaria: { racha: 1, fecha: 'x' }, guardadas: [1] } }
    expect(mismoProgreso(a, b)).toBe(true)
    expect(mismoProgreso(a, { ...b, datos: { ...b.datos, guardadas: [2] } })).toBe(false)
  })
})

describe('perfil', () => {
  it('gana el blobatar elegido más recientemente', () => {
    const viejo = { avatar: 'luna', actualizado: 10 }
    const nuevo = { avatar: 'sol', actualizado: 20 }
    expect(combinarRespaldos(respaldo({ perfil: viejo }), respaldo({ perfil: nuevo })).datos.perfil).toEqual(nuevo)
    expect(combinarRespaldos(respaldo({ perfil: nuevo }), respaldo({ perfil: viejo })).datos.perfil).toEqual(nuevo)
    expect(combinarRespaldos(respaldo({}), respaldo({ perfil: viejo })).datos.perfil).toEqual(viejo)
  })
})
