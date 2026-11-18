import { describe, expect, it } from 'vitest'
import datos from '../data/preguntas.json'
import type { Pregunta } from './banco'
import { SOPORTE } from './proyecto'
import { enlaceReporte } from './reporte'

const pregunta = (datos as Pregunta[])[41]

describe('enlaceReporte', () => {
  const url = new URL(enlaceReporte(pregunta))

  it('va al correo de soporte con el número de la pregunta en el asunto', () => {
    expect(url.protocol).toBe('mailto:')
    expect(url.pathname).toBe(SOPORTE.correo)
    expect(url.searchParams.get('subject')).toBe(`Error en la pregunta #${pregunta.id}`)
  })

  it('trae el enunciado y el texto de la respuesta correcta, no su letra', () => {
    const cuerpo = url.searchParams.get('body')!
    expect(cuerpo).toContain(pregunta.p)
    expect(cuerpo).toContain(`Respuesta que Savia da como correcta: ${pregunta.o[pregunta.r]}`)
    expect(cuerpo).toContain(pregunta.s)
  })

  it('codifica los caracteres especiales del texto', () => {
    expect(enlaceReporte(pregunta)).not.toMatch(/\s/)
    expect(enlaceReporte({ ...pregunta, p: '¿A & B = C?' })).toContain(encodeURIComponent('¿A & B = C?'))
  })
})
