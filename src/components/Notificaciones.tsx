import { useEffect, useState, type CSSProperties } from 'react'
import { BookOpenIcon, CircleCheckIcon, XIcon } from '@animateicons/react/lucide'
import { useIconosAnimados } from '../lib/useIconosAnimados'
import { Cinta } from './Cinta'

// Tiempo en pantalla de cada aviso (se pausa con el cursor o el foco encima).
const DURACION_MS = 4000

export type Notificacion = {
  id: number
  tipo: 'success' | 'info'
  titulo: string
  mensaje: string
}

interface NotificacionesProps {
  notificaciones: Notificacion[]
  onCerrar: (id: number) => void
}

function IconoNotificacion({ tipo }: { tipo: Notificacion['tipo'] }) {
  const animarIconos = useIconosAnimados()
  if (tipo === 'success') {
    return <CircleCheckIcon size={21} isAnimated={animarIconos} aria-hidden="true" />
  }

  return <BookOpenIcon size={21} isAnimated={animarIconos} aria-hidden="true" />
}

function NotificacionVista({ notificacion, onCerrar }: { notificacion: Notificacion; onCerrar: (id: number) => void }) {
  const [pausada, setPausada] = useState(false)
  const animarIconos = useIconosAnimados()

  useEffect(() => {
    if (pausada) return
    const temporizador = window.setTimeout(() => onCerrar(notificacion.id), DURACION_MS)
    return () => window.clearTimeout(temporizador)
  }, [notificacion.id, onCerrar, pausada])

  return (
    <article
      className={`aviso-savia aviso-savia--${notificacion.tipo} ${pausada ? 'is-pausada' : ''}`}
      style={{ '--aviso-duracion': `${DURACION_MS}ms` } as CSSProperties}
      role="status"
      onMouseEnter={() => setPausada(true)}
      onMouseLeave={() => setPausada(false)}
      onFocusCapture={() => setPausada(true)}
      onBlurCapture={(evento) => {
        const destino = evento.relatedTarget
        if (!(destino instanceof Node) || !evento.currentTarget.contains(destino)) setPausada(false)
      }}
    >
      <Cinta as="span" className="aviso-savia__cinta" aria-hidden="true" />
      <span className="aviso-savia__icono">
        <IconoNotificacion tipo={notificacion.tipo} />
      </span>
      <div className="aviso-savia__contenido">
        <h2 className="aviso-savia__titulo">{notificacion.titulo}</h2>
        <p className="aviso-savia__mensaje">{notificacion.mensaje}</p>
      </div>
      <button
        type="button"
        className="aviso-savia__cerrar"
        aria-label={`Cerrar aviso: ${notificacion.titulo}`}
        onClick={() => onCerrar(notificacion.id)}
      >
        <XIcon size={16} isAnimated={animarIconos} aria-hidden="true" />
      </button>
      <span className="aviso-savia__tiempo" aria-hidden="true" />
    </article>
  )
}

export function Notificaciones({ notificaciones, onCerrar }: NotificacionesProps) {
  if (notificaciones.length === 0) return null

  return (
    <div className="avisos-savia" role="region" aria-label="Avisos de Savia">
      {notificaciones.map((notificacion) => (
        <NotificacionVista key={notificacion.id} notificacion={notificacion} onCerrar={onCerrar} />
      ))}
    </div>
  )
}
