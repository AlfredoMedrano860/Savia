import { beforeEach, describe, expect, it, vi } from 'vitest'

beforeEach(() => {
  localStorage.clear()
  vi.resetModules()
})

describe('migración de "ribosoma:" a "savia:"', () => {
  it('pasa los datos al nombre nuevo y borra los viejos', async () => {
    localStorage.setItem('ribosoma:historial', '[1]')
    localStorage.setItem('ribosoma:guardadas', '[5]')
    await import('./migrarDatos')
    expect(localStorage.getItem('savia:historial')).toBe('[1]')
    expect(localStorage.getItem('savia:guardadas')).toBe('[5]')
    expect(localStorage.getItem('ribosoma:historial')).toBeNull()
    expect(localStorage.getItem('ribosoma:guardadas')).toBeNull()
  })

  it('no pisa datos nuevos que ya existen', async () => {
    localStorage.setItem('ribosoma:historial', '["viejo"]')
    localStorage.setItem('savia:historial', '["nuevo"]')
    await import('./migrarDatos')
    expect(localStorage.getItem('savia:historial')).toBe('["nuevo"]')
    expect(localStorage.getItem('ribosoma:historial')).toBeNull()
  })

  it('no toca claves de otras apps', async () => {
    localStorage.setItem('otra-app:datos', 'x')
    await import('./migrarDatos')
    expect(localStorage.getItem('otra-app:datos')).toBe('x')
  })
})
