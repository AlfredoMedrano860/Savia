import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import datos from '../data/preguntas.json'
import { agregarAlHistorial } from './almacen'
import { calificar, pruebaDeRepaso, type Pregunta } from './banco'
import { VERSION_RESPALDO, crearRespaldo, leerRespaldo, restaurarRespaldo } from './respaldo'

const banco = datos as Pregunta[]

beforeAll(() => {
  vi.stubGlobal('fetch', async () => new Response(JSON.stringify(banco)))
})

beforeEach(() => {
  localStorage.clear()
})

const registro = {
  [banco[0].id]: { t: banco[0].t, s: banco[0].s, vistas: 2, aciertos: 1, fallos: 1, caja: 1, proxima: 1, ultima: 1 },
}

async function llenarProgreso() {
  const prueba = pruebaDeRepaso([banco[0].id, banco[1].id])
  prueba.respuestas = [banco[0].r, null]
  agregarAlHistorial(await calificar(prueba))
  localStorage.setItem('savia:aprendizaje', JSON.stringify(registro))
  localStorage.setItem('savia:guardadas', JSON.stringify([3, 8]))
  localStorage.setItem('savia:accesibilidad', JSON.stringify({ tamano: 'grande' }))
  localStorage.setItem('savia:prueba', JSON.stringify({ en: 'curso' }))
}

describe('crear y restaurar un respaldo', () => {
  it('lo que se respalda vuelve igual en otro dispositivo', async () => {
    await llenarProgreso()
    const antes = { ...localStorage }
    const texto = JSON.stringify(crearRespaldo())

    localStorage.clear()
    restaurarRespaldo(leerRespaldo(texto))

    for (const clave of ['savia:historial', 'savia:aprendizaje', 'savia:guardadas', 'savia:accesibilidad']) {
      expect(localStorage.getItem(clave)).toBe(antes[clave])
    }
  })

  it('no respalda la prueba en curso', async () => {
    await llenarProgreso()
    expect(JSON.stringify(crearRespaldo())).not.toContain('curso')
  })

  it('restaurar reemplaza todo el progreso, incluso lo que el respaldo no trae', () => {
    localStorage.setItem('savia:guardadas', JSON.stringify([1, 2]))
    restaurarRespaldo(leerRespaldo(JSON.stringify({ app: 'savia', version: 1, fecha: 1, datos: { guardadas: [9] } })))
    expect(localStorage.getItem('savia:guardadas')).toBe('[9]')
    localStorage.setItem('savia:historial', '[]')
    restaurarRespaldo(leerRespaldo(JSON.stringify({ app: 'savia', version: 1, fecha: 1, datos: {} })))
    expect(localStorage.getItem('savia:historial')).toBeNull()
  })
})

describe('leer un archivo de respaldo', () => {
  it('rechaza archivos que no son de Savia', () => {
    expect(() => leerRespaldo('hola')).toThrow('no es un respaldo de Savia')
    expect(() => leerRespaldo('{"app":"otra","version":1,"datos":{}}')).toThrow('no es un respaldo de Savia')
    expect(() => leerRespaldo('[1,2,3]')).toThrow('no es un respaldo de Savia')
  })

  it('avisa si el respaldo es de una versión más nueva', () => {
    const texto = JSON.stringify({ app: 'savia', version: VERSION_RESPALDO + 1, fecha: 1, datos: {} })
    expect(() => leerRespaldo(texto)).toThrow('versión más nueva')
  })

  it('descarta las partes dañadas y conserva el resto', async () => {
    await llenarProgreso()
    const respaldo = crearRespaldo()
    const historial = respaldo.datos.historial as unknown[]
    respaldo.datos.historial = [...historial, { modo: 'quiz', total: -3 }]
    respaldo.datos.aprendizaje = { ...registro, 99999: { t: 'T19' }, abc: {} }
    respaldo.datos.guardadas = [3, 3, 0, 5000, 8]
    const leido = leerRespaldo(JSON.stringify(respaldo))
    expect(leido.datos.historial).toHaveLength(1)
    expect(Object.keys(leido.datos.aprendizaje as object)).toEqual([String(banco[0].id)])
    expect(leido.datos.guardadas).toEqual([3, 8])
  })

  it('rechaza archivos demasiado grandes', () => {
    expect(() => leerRespaldo('x'.repeat(3 * 1024 * 1024))).toThrow('demasiado grande')
  })
})
