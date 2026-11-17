import { describe, expect, it } from 'vitest'
import { formatoDuracion, formatoReloj } from './formato'

describe('formatoReloj', () => {
  it('muestra minutos y segundos con dos cifras', () => {
    expect(formatoReloj(0)).toBe('00:00')
    expect(formatoReloj(65)).toBe('01:05')
    expect(formatoReloj(59.9)).toBe('00:59')
  })

  it('agrega las horas cuando hay', () => {
    expect(formatoReloj(3600)).toBe('1:00:00')
    expect(formatoReloj(7325)).toBe('2:02:05')
  })

  it('nunca muestra tiempo negativo', () => {
    expect(formatoReloj(-12)).toBe('00:00')
  })
})

describe('formatoDuracion', () => {
  it('describe la duración en palabras cortas', () => {
    expect(formatoDuracion(45)).toBe('45 s')
    expect(formatoDuracion(90)).toBe('1 min 30 s')
    expect(formatoDuracion(7200)).toBe('2 h')
    expect(formatoDuracion(5400)).toBe('1 h 30 min')
  })

  it('no muestra segundos cuando hay horas o se pide redondo', () => {
    expect(formatoDuracion(3605)).toBe('1 h')
    expect(formatoDuracion(90, true)).toBe('1 min')
  })

  it('dice 0 min cuando no hay tiempo que mostrar', () => {
    expect(formatoDuracion(0)).toBe('0 min')
    expect(formatoDuracion(20, true)).toBe('0 min')
  })
})
