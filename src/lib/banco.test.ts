import { beforeAll, describe, expect, it, vi } from 'vitest'
import datos from '../data/preguntas.json'
import {
  CODIGOS,
  MODOS,
  NOTA_MINIMA,
  TOTAL_PREGUNTAS,
  calificar,
  cargarPreguntas,
  mezclar,
  normalizarCodigo,
  nuevaPrueba,
  nuevoCodigo,
  porcentaje,
  pruebaDeRepaso,
  pruebaDeTema,
  pruebaImprimible,
  type Pregunta,
  type Prueba,
} from './banco'

const banco = datos as Pregunta[]
const porId = new Map(banco.map((p) => [p.id, p]))
const [completa, corta, quiz] = MODOS

beforeAll(() => {
  vi.stubGlobal('fetch', async () => new Response(JSON.stringify(banco)))
})

const temaDe = (id: number) => porId.get(id)!.t
const conteoPorTema = (prueba: Prueba) => {
  const conteo = new Map<string, number>()
  for (const { id } of prueba.items) conteo.set(temaDe(id), (conteo.get(temaDe(id)) ?? 0) + 1)
  return conteo
}

describe('banco de preguntas', () => {
  it('carga las 1000 preguntas válidas, con ids únicos', async () => {
    const preguntas = await cargarPreguntas()
    expect(preguntas).toHaveLength(TOTAL_PREGUNTAS)
    expect(new Set(preguntas.map((p) => p.id)).size).toBe(TOTAL_PREGUNTAS)
  })

  it('la nota mínima para aprobar es 70', () => {
    expect(NOTA_MINIMA).toBe(70)
  })
})

describe('mezclar', () => {
  it('devuelve los mismos elementos sin cambiar la lista original', () => {
    const original = [1, 2, 3, 4, 5, 6, 7, 8]
    const mezclada = mezclar(original)
    expect(original).toEqual([1, 2, 3, 4, 5, 6, 7, 8])
    expect([...mezclada].sort((a, b) => a - b)).toEqual(original)
  })
})

describe('nuevaPrueba', () => {
  it.each([completa, corta, quiz])('$nombre tiene sus $preguntas preguntas, sin repetir', async (modo) => {
    const prueba = await nuevaPrueba(modo)
    expect(prueba.items).toHaveLength(modo.preguntas)
    expect(new Set(prueba.items.map((i) => i.id)).size).toBe(modo.preguntas)
    expect(prueba.respuestas.every((r) => r === null)).toBe(true)
    expect(prueba.limite - prueba.inicio).toBe(modo.minutos * 60_000)
  })

  it('reparte las preguntas parejo entre los seis temas', async () => {
    const conteo = conteoPorTema(await nuevaPrueba(quiz))
    // 15 preguntas entre 6 temas: tres temas con 3 y tres con 2
    expect(CODIGOS.map((t) => conteo.get(t) ?? 0).sort()).toEqual([2, 2, 2, 3, 3, 3])
    const completaConteo = conteoPorTema(await nuevaPrueba(completa))
    expect(CODIGOS.every((t) => completaConteo.get(t) === 10)).toBe(true)
  })

  it('cada pregunta trae un orden válido de sus cuatro opciones', async () => {
    const prueba = await nuevaPrueba(quiz)
    for (const item of prueba.items) expect([...item.orden].sort()).toEqual([0, 1, 2, 3])
  })
})

describe('códigos de pruebas impresas', () => {
  it('normaliza lo que escribe la persona', () => {
    expect(normalizarCodigo(' q7km-2x ')).toBe('Q7KM2X')
    expect(normalizarCodigo('c 2345 6')).toBe('C23456')
  })

  it('rechaza códigos con otra letra inicial, largo o caracteres ambiguos', () => {
    expect(normalizarCodigo('X7KM2X')).toBeNull()
    expect(normalizarCodigo('Q7KM2')).toBeNull()
    expect(normalizarCodigo('Q7KM0X')).toBeNull() // el 0 se confunde con la O
    expect(normalizarCodigo('Q7KMIX')).toBeNull() // la I se confunde con el 1
  })

  it('genera códigos válidos con la letra de cada tamaño', () => {
    expect(nuevoCodigo(quiz)).toMatch(/^Q/)
    expect(nuevoCodigo(corta)).toMatch(/^C/)
    expect(nuevoCodigo(completa)).toMatch(/^P/)
    for (let i = 0; i < 50; i++) expect(normalizarCodigo(nuevoCodigo(quiz))).not.toBeNull()
  })

  it('el mismo código arma siempre la misma prueba', async () => {
    const a = await pruebaImprimible('Q7KM2X')
    const b = await pruebaImprimible('Q7KM2X')
    expect(b.items).toEqual(a.items)
    expect(a.items).toHaveLength(quiz.preguntas)
    const otra = await pruebaImprimible('Q7KM2Y')
    expect(otra.items).not.toEqual(a.items)
  })

  it('el tamaño de la prueba impresa sale de la letra del código', async () => {
    expect((await pruebaImprimible('C23456')).items).toHaveLength(corta.preguntas)
    expect((await pruebaImprimible('P23456')).items).toHaveLength(completa.preguntas)
  })
})

describe('práctica por tema y repaso', () => {
  it('la práctica de un tema solo trae preguntas de ese tema', async () => {
    const prueba = await pruebaDeTema('T22')
    expect(prueba.items).toHaveLength(15)
    expect(prueba.items.every((i) => temaDe(i.id) === 'T22')).toBe(true)
  })

  it('el repaso usa exactamente las preguntas pedidas', () => {
    const prueba = pruebaDeRepaso([5, 9, 12], 'Repaso del día')
    expect(prueba.nombre).toBe('Repaso del día')
    expect(prueba.items.map((i) => i.id).sort((a, b) => a - b)).toEqual([5, 9, 12])
  })
})

describe('calificar', () => {
  const armar = (ids: number[], respuestas: (number | null)[]): Prueba => ({
    ...pruebaDeRepaso(ids),
    items: ids.map((id) => ({ id, orden: [0, 1, 2, 3] })),
    respuestas,
  })

  it('cuenta correctas, incorrectas y sin responder', async () => {
    const [a, b, c, d] = banco
    const incorrecta = (p: Pregunta) => (p.r + 1) % 4
    const prueba = armar([a.id, b.id, c.id, d.id], [a.r, incorrecta(b), null, d.r])
    const r = await calificar(prueba)
    expect(r.total).toBe(4)
    expect(r.correctas).toBe(2)
    expect(r.sinResponder).toBe(1)
    expect(porcentaje(r)).toBe(50)
  })

  it('reparte el resultado por tema', async () => {
    const delT19 = banco.find((p) => p.t === 'T19')!
    const delT23 = banco.find((p) => p.t === 'T23')!
    const r = await calificar(armar([delT19.id, delT23.id], [delT19.r, null]))
    expect(r.porTema.T19).toEqual({ correctas: 1, total: 1 })
    expect(r.porTema.T23).toEqual({ correctas: 0, total: 1 })
    expect(r.porTema.T20).toEqual({ correctas: 0, total: 0 })
  })

  it('el tiempo no pasa del límite aunque se entregue tarde', async () => {
    const prueba = armar([banco[0].id], [null])
    const r = await calificar(prueba, prueba.limite + 600_000)
    expect(r.segundos).toBe(Math.round((prueba.limite - prueba.inicio) / 1000))
  })

  it('70 aprueba y 68 no', () => {
    expect(porcentaje({ correctas: 7, total: 10 }) >= NOTA_MINIMA).toBe(true)
    expect(porcentaje({ correctas: 41, total: 60 }) >= NOTA_MINIMA).toBe(false) // 68
  })
})
