import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import datos from '../data/preguntas.json'
import type { Pregunta } from './banco'

const banco = datos as Pregunta[]
const DIA = 86_400_000

beforeAll(() => {
  vi.stubGlobal('fetch', async () => new Response(JSON.stringify(banco)))
})

// El registro se lee de localStorage al importar el módulo, así que cada prueba lo importa
// de nuevo con el almacenamiento limpio.
async function nuevoAprendizaje() {
  vi.resetModules()
  return import('./aprendizaje')
}

beforeEach(() => {
  localStorage.clear()
})

const pregunta = banco.find((p) => p.t === 'T21')!
const mal = (p: Pregunta) => (p.r + 1) % 4
const mediaNoche = (ms: number, dias: number) => {
  const d = new Date(ms)
  d.setHours(0, 0, 0, 0)
  return d.getTime() + dias * DIA
}

describe('repaso espaciado', () => {
  it('una pregunta fallada vuelve a salir desde mañana', async () => {
    const a = await nuevoAprendizaje()
    vi.useFakeTimers({ now: new Date(2026, 10, 10, 15, 0) })
    a.registrarRespuesta(pregunta, mal(pregunta))
    expect(a.pendientesDeRepaso()).toEqual([])
    expect(a.pendientesDeRepaso(mediaNoche(Date.now(), 1))).toEqual([pregunta.id])
    vi.useRealTimers()
  })

  it('cada acierto después de fallar alarga la espera, y con 3 queda dominada', async () => {
    const a = await nuevoAprendizaje()
    let ahora = new Date(2026, 10, 10, 9, 0).getTime()
    vi.useFakeTimers({ now: ahora })
    a.registrarRespuesta(pregunta, mal(pregunta))
    const esperas = [3, 7, 14]
    for (const dias of esperas) {
      ahora = mediaNoche(ahora, 30)
      vi.setSystemTime(ahora)
      a.registrarRespuesta(pregunta, pregunta.r)
      expect(a.pendientesDeRepaso(mediaNoche(ahora, dias) - 1)).toEqual([])
    }
    // tres aciertos seguidos después del fallo: ya no vuelve al repaso
    expect(a.pendientesDeRepaso(ahora + 365 * DIA)).toEqual([])
    expect(a.estadoRepaso(ahora).dominadas).toBe(1)
    vi.useRealTimers()
  })

  it('fallar otra vez la regresa al principio', async () => {
    const a = await nuevoAprendizaje()
    a.registrarRespuesta(pregunta, mal(pregunta))
    a.registrarRespuesta(pregunta, pregunta.r)
    a.registrarRespuesta(pregunta, mal(pregunta))
    expect(a.pendientesDeRepaso(mediaNoche(Date.now(), 1))).toEqual([pregunta.id])
  })

  it('una pregunta que nunca se falló no entra al repaso', async () => {
    const a = await nuevoAprendizaje()
    a.registrarRespuesta(pregunta, pregunta.r)
    expect(a.pendientesDeRepaso(Date.now() + 365 * DIA)).toEqual([])
    expect(a.estadoRepaso().enCurso).toBe(0)
  })

  it('el registro sobrevive a recargar la página', async () => {
    const a = await nuevoAprendizaje()
    a.registrarRespuesta(pregunta, mal(pregunta))
    const b = await nuevoAprendizaje()
    expect(b.estadoRepaso().enCurso).toBe(1)
  })
})

describe('progreso por tema', () => {
  it('calcula el dominio y el subtema más débil', async () => {
    const a = await nuevoAprendizaje()
    const delTema = banco.filter((p) => p.t === 'T20')
    const subtemas = [...new Set(delTema.map((p) => p.s))]
    const [fuerte, debil] = subtemas
    const deFuerte = delTema.filter((p) => p.s === fuerte).slice(0, 2)
    const deDebil = delTema.filter((p) => p.s === debil).slice(0, 2)
    for (const p of deFuerte) a.registrarRespuesta(p, p.r)
    for (const p of deDebil) a.registrarRespuesta(p, mal(p))
    const t20 = a.progresoPorTema().find((t) => t.tema === 'T20')!
    expect(t20.vistas).toBe(4)
    expect(t20.dominio).toBe(50)
    expect(t20.distintas).toBe(4)
    expect(t20.subtemaDebil).toBe(debil)
  })

  it('un tema sin respuestas no tiene dominio', async () => {
    const a = await nuevoAprendizaje()
    expect(a.progresoPorTema().every((t) => t.dominio === null && t.subtemaDebil === null)).toBe(true)
  })

  it('registrar un resultado completo ignora las preguntas sin responder', async () => {
    const a = await nuevoAprendizaje()
    const { calificar, pruebaDeRepaso } = await import('./banco')
    const [p1, p2] = banco
    const prueba = pruebaDeRepaso([p1.id, p2.id])
    prueba.items = [{ id: p1.id, orden: [0, 1, 2, 3] }, { id: p2.id, orden: [0, 1, 2, 3] }]
    prueba.respuestas = [mal(p1), null]
    await a.registrarResultado(await calificar(prueba))
    expect(a.progresoPorTema().reduce((s, t) => s + t.vistas, 0)).toBe(1)
  })
})

describe('preguntas guardadas', () => {
  it('guarda y quita una pregunta', async () => {
    const a = await nuevoAprendizaje()
    expect(a.alternarGuardada(7)).toBe(true)
    expect(a.estaGuardada(7)).toBe(true)
    expect(a.alternarGuardada(7)).toBe(false)
    expect(a.idsGuardadas()).toEqual([])
  })

  it('borrar el registro no toca las guardadas', async () => {
    const a = await nuevoAprendizaje()
    a.alternarGuardada(7)
    a.registrarRespuesta(pregunta, mal(pregunta))
    a.borrarRegistro()
    expect(a.estadoRepaso().enCurso).toBe(0)
    expect(a.idsGuardadas()).toEqual([7])
  })
})

describe('puntos débiles', () => {
  const delSubtema = (tema: string) => {
    const lista = banco.filter((p) => p.t === tema)
    const subtema = lista[0].s
    return lista.filter((p) => p.s === subtema)
  }

  it('sin respuestas no hay puntos débiles', async () => {
    const a = await nuevoAprendizaje()
    expect(a.preguntasDebiles()).toEqual([])
    expect(await a.idsPuntosDebiles()).toEqual([])
  })

  it('incluye las preguntas que falla la mitad de las veces o más, de la peor a la mejor', async () => {
    const a = await nuevoAprendizaje()
    const [siempre, mitad, casiNunca] = banco.filter((p) => p.t === 'T24')
    a.registrarRespuesta(siempre, mal(siempre))
    a.registrarRespuesta(siempre, mal(siempre))
    a.registrarRespuesta(mitad, mal(mitad))
    a.registrarRespuesta(mitad, mitad.r)
    a.registrarRespuesta(casiNunca, mal(casiNunca))
    a.registrarRespuesta(casiNunca, casiNunca.r)
    a.registrarRespuesta(casiNunca, casiNunca.r)
    expect(a.preguntasDebiles()).toEqual([siempre.id, mitad.id])
  })

  it('completa con preguntas nuevas del subtema más débil', async () => {
    const a = await nuevoAprendizaje()
    const subtema = delSubtema('T19')
    const [p1, p2] = subtema
    a.registrarRespuesta(p1, mal(p1))
    a.registrarRespuesta(p2, mal(p2))
    expect(a.subtemasDebiles()).toEqual([{ tema: 'T19', subtema: p1.s }])
    const ids = await a.idsPuntosDebiles()
    expect(ids.slice(0, 2).sort()).toEqual([p1.id, p2.id].sort())
    expect(ids.length).toBe(Math.min(a.MAX_PUNTOS_DEBILES, subtema.length))
    expect(new Set(ids).size).toBe(ids.length)
    expect(ids.every((id) => subtema.some((p) => p.id === id))).toBe(true)
  })

  it('un subtema con 70 % o más de aciertos no cuenta como débil', async () => {
    const a = await nuevoAprendizaje()
    const subtema = delSubtema('T22')
    for (const p of subtema.slice(0, 7)) a.registrarRespuesta(p, p.r)
    for (const p of subtema.slice(7, 10)) a.registrarRespuesta(p, mal(p))
    expect(a.subtemasDebiles()).toEqual([])
  })
})
