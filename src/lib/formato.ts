export function formatoReloj(segundos: number) {
  const s = Math.max(0, Math.floor(segundos))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const resto = s % 60
  const dos = (n: number) => String(n).padStart(2, '0')
  return h > 0 ? `${h}:${dos(m)}:${dos(resto)}` : `${dos(m)}:${dos(resto)}`
}

export function formatoDuracion(segundos: number, redondo = false) {
  const h = Math.floor(segundos / 3600)
  const m = Math.floor((segundos % 3600) / 60)
  const s = segundos % 60
  const partes = []
  if (h) partes.push(`${h} h`)
  if (m) partes.push(`${m} min`)
  if (!redondo && !h && s) partes.push(`${s} s`)
  return partes.join(' ') || '0 min'
}

const FECHA = new Intl.DateTimeFormat('es-CR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
export const formatoFecha = (ms: number) => FECHA.format(ms)
