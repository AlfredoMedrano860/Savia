import { Blobatar } from '@blobatar/react'
import 'blobatar/motion.css'
import { LogInIcon } from '@animateicons/react/lucide'
import { prepararCuenta, useCuenta } from '../lib/cuenta'
import { useAvatarElegido } from '../lib/perfil'
import { useIconosAnimados } from '../lib/useIconosAnimados'

/** Botón de la barra de arriba: «Iniciar sesión» sin sesión, o solo el blobatar con sesión. */
export function BotonCuenta() {
  const cuenta = useCuenta()
  const animarIconos = useIconosAnimados()
  const elegido = useAvatarElegido()
  if (cuenta.estado === 'apagado') return null

  if (cuenta.estado === 'dentro' && cuenta.usuario) {
    const { nombre, correo } = cuenta.usuario
    return (
      <a href="#/perfil" className="nav__cuenta nav__cuenta--perfil" aria-label={`Mi perfil: ${nombre}`} title="Mi perfil">
        <Blobatar name={elegido ?? correo} size={40} animate="hover" className="nav__cuenta-avatar" />
      </a>
    )
  }

  return (
    <a
      href="#/entrar"
      className="nav__cuenta nav__cuenta--entrar"
      aria-disabled={cuenta.estado === 'cargando' || undefined}
      // empieza a descargar Firebase en cuanto se acerca el dedo o el mouse: así, en la página para
      // entrar, la ventana de Google se abre en el mismo toque y el navegador no la bloquea
      onPointerDown={prepararCuenta}
      onPointerEnter={prepararCuenta}
      onFocus={prepararCuenta}
    >
      <LogInIcon size={18} isAnimated={animarIconos} aria-hidden="true" />
      <span className="nav__cuenta-texto">{cuenta.estado === 'cargando' ? 'Cargando…' : 'Iniciar sesión'}</span>
    </a>
  )
}
