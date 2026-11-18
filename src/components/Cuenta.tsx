import { Blobatar } from '@blobatar/react'
import 'blobatar/motion.css'
import { LogInIcon } from '@animateicons/react/lucide'
import { useCuenta } from '../lib/cuenta'
import { useAvatarElegido } from '../lib/perfil'
import { useIconosAnimados } from '../lib/useIconosAnimados'

/** Botón de la barra de arriba: «Entrar» sin sesión, o el blobatar y el nombre con sesión. */
export function BotonCuenta() {
  const cuenta = useCuenta()
  const animarIconos = useIconosAnimados()
  const elegido = useAvatarElegido()
  if (cuenta.estado === 'apagado') return null

  if (cuenta.estado === 'dentro' && cuenta.usuario) {
    const { nombre, correo } = cuenta.usuario
    return (
      <a href="#/perfil" className="nav__cuenta" aria-label={`Mi perfil: ${nombre}`}>
        <Blobatar name={elegido ?? correo} size={28} animate="hover" className="nav__cuenta-avatar" />
        <span className="nav__cuenta-texto">{nombre.split(' ')[0]}</span>
      </a>
    )
  }

  return (
    <a href="#/entrar" className="nav__cuenta" aria-disabled={cuenta.estado === 'cargando' || undefined}>
      <LogInIcon size={18} isAnimated={animarIconos} aria-hidden="true" />
      <span className="nav__cuenta-texto">{cuenta.estado === 'cargando' ? 'Cargando…' : 'Entrar'}</span>
    </a>
  )
}
