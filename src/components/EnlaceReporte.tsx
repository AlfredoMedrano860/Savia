import { FlagIcon } from '@animateicons/react/lucide'
import type { Pregunta } from '../lib/banco'
import { enlaceReporte } from '../lib/reporte'

// "Reportar un error" de una pregunta: abre un correo a soporte con los datos de la pregunta.
export function EnlaceReporte({ pregunta }: { pregunta: Pregunta }) {
  return (
    <a className="reportar" href={enlaceReporte(pregunta)} aria-label={`Reportar un error en la pregunta ${pregunta.id}`}>
      <FlagIcon size={14} isAnimated={false} aria-hidden="true" />
      Reportar un error
    </a>
  )
}
