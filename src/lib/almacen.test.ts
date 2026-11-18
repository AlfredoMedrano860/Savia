import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import datos from '../data/preguntas.json'
import { agregarAlHistorial, borrarHistorial, cargarHistorial, cargarPrueba, esResultado, guardarPrueba } from './almacen'
import { calificar, pruebaDeRepaso, type Pregunta, type Resultado } from './banco'

const banco = datos as Pregunta[]

beforeAll(() => {
  vi.stubGlobal('fetch', async () => new Response(JSON.stringify(banco)))
})

beforeEach(() => {
  localStorage.clear()
  vi.spyOn(console, 'warn').mockImplementation(() => {})
})

const resultadoDePrueba = async (fecha = Date.now()): Promise<Resultado> => {
  const prueba = pruebaDeRepaso([banco[0].id, banco[1].id])
  prueba.respuestas = [banco[0].r, null]
  return calificar(prueba, fecha)
}

describe('prueba en curso', () => {
  it('se guarda y se recupera igual', () => {
    const prueba = pruebaDeRepaso([1, 2, 3])
    prueba.respuestas[1] = 2
    guardarPrueba(prueba)
    expect(cargarPrueba()).toEqual(prueba)
  })

  it('se puede borrar', () => {
    guardarPrueba(pruebaDeRepaso([1]))
    guardarPrueba(null)
    expect(cargarPrueba()).toBeNull()
  })

  it('descarta datos dañados en vez de romper la app', () => {
    localStorage.setItem('savia:prueba', '{esto no es json')
    expect(cargarPrueba()).toBeNull()
    expect(localStorage.getItem('savia:prueba')).toBeNull()
  })

  it('descarta una prueba con respuestas fuera de rango', () => {
    const prueba = pruebaDeRepaso([1, 2])
    localStorage.setItem('savia:prueba', JSON.stringify({ ...prueba, respuestas: [7, null] }))
    expect(cargarPrueba()).toBeNull()
  })
})

describe('historial', () => {
  it('guarda los intentos del más nuevo al más viejo', async () => {
    const viejo = await resultadoDePrueba(Date.now() + 1_000)
    const nuevo = await resultadoDePrueba(Date.now() + 2_000)
    agregarAlHistorial(viejo)
    agregarAlHistorial(nuevo)
    expect(cargarHistorial().map((r) => r.fecha)).toEqual([nuevo.fecha, viejo.fecha])
  })

  it('se queda con los últimos 30 intentos', async () => {
    const base = await resultadoDePrueba()
    for (let i = 0; i < 35; i++) agregarAlHistorial({ ...base, fecha: i })
    const historial = cargarHistorial()
    expect(historial).toHaveLength(30)
    expect(historial[0].fecha).toBe(34)
  })

  it('quita solo los intentos inválidos y conserva los demás', async () => {
    const bueno = await resultadoDePrueba()
    localStorage.setItem('savia:historial', JSON.stringify([bueno, { modo: 'quiz', total: -1 }]))
    expect(cargarHistorial()).toEqual([bueno])
  })

  it('se puede borrar', async () => {
    agregarAlHistorial(await resultadoDePrueba())
    borrarHistorial()
    expect(cargarHistorial()).toEqual([])
  })
})

describe('esResultado', () => {
  it('acepta un resultado real', async () => {
    expect(esResultado(await resultadoDePrueba())).toBe(true)
  })

  it('rechaza un resultado cuyas sumas por tema no cuadran con el total', async () => {
    const r = await resultadoDePrueba()
    expect(esResultado({ ...r, correctas: r.correctas + 1 })).toBe(false)
    expect(esResultado({ ...r, total: r.total + 1 })).toBe(false)
  })

  it('rechaza datos que no son un resultado', () => {
    expect(esResultado(null)).toBe(false)
    expect(esResultado('hola')).toBe(false)
    expect(esResultado({})).toBe(false)
  })
})
