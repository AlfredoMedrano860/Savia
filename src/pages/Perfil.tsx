import { useState, type FormEvent } from 'react'
import { Blobatar } from '@blobatar/react'
import { useGaze } from '@blobatar/react/gaze'
import { happy } from 'blobatar/expression'
import 'blobatar/motion.css'
import 'blobatar/gaze.css'
import { LogOutIcon, PencilIcon, Trash2Icon } from '@animateicons/react/lucide'
import { useConfirmacion } from '../components/Confirmacion'
import { Cinta } from '../components/Cinta'
import { cargarHistorial } from '../lib/almacen'
import { idsGuardadas, progresoPorTema, useAprendizaje } from '../lib/aprendizaje'
import { NOTA_MINIMA, TOTAL_PREGUNTAS, porcentaje } from '../lib/banco'
import { borrarCuenta, cambiarNombre, cerrarSesion, mensajeDeError, useCuenta, type Usuario } from '../lib/cuenta'
import { elegirAvatar, opcionesDeAvatar, useAvatarElegido } from '../lib/perfil'
import { useIconosAnimados } from '../lib/useIconosAnimados'

const fecha = (ms: number) => new Date(ms).toLocaleDateString('es-CR', { day: 'numeric', month: 'long', year: 'numeric' })
const hora = (ms: number) => new Date(ms).toLocaleTimeString('es-CR', { hour: 'numeric', minute: '2-digit' })
const plural = (n: number, uno: string, varios: string) => `${n} ${n === 1 ? uno : varios}`

/** Racha de la pregunta del día que sigue vigente (respondió hoy o ayer). */
function rachaVigente() {
  try {
    const d = JSON.parse(localStorage.getItem('savia:diaria') ?? 'null') as { racha?: number; ultimaFecha?: string | null } | null
    if (!d?.racha || !d.ultimaFecha) return 0
    const dia = (desfase: number) => {
      const f = new Date()
      f.setDate(f.getDate() - desfase)
      return `${f.getFullYear()}-${String(f.getMonth() + 1).padStart(2, '0')}-${String(f.getDate()).padStart(2, '0')}`
    }
    return d.ultimaFecha === dia(0) || d.ultimaFecha === dia(1) ? d.racha : 0
  } catch {
    return 0
  }
}

function Estadisticas() {
  useAprendizaje()
  const historial = cargarHistorial()
  const notas = historial.map(porcentaje)
  const vistas = progresoPorTema().reduce((s, t) => s + t.distintas, 0)
  const datos: [string, string, string?][] = [
    ['Intentos', String(historial.length), historial[0] ? `el último el ${fecha(historial[0].fecha)}` : 'todavía ninguno'],
    ['Mejor nota', notas.length ? `${Math.max(...notas)}` : '—', notas.length ? (Math.max(...notas) >= NOTA_MINIMA ? 'aprobada' : `necesitas ${NOTA_MINIMA}`) : undefined],
    ['Promedio', notas.length ? `${Math.round(notas.reduce((a, b) => a + b, 0) / notas.length)}` : '—', notas.length ? `de ${plural(notas.length, 'intento', 'intentos')}` : undefined],
    ['Preguntas vistas', String(vistas), `de ${TOTAL_PREGUNTAS} del banco`],
    ['Racha diaria', String(rachaVigente()), 'días seguidos con la pregunta del día'],
    ['Guardadas', String(idsGuardadas().length), 'preguntas con estrella'],
  ]
  return (
    <section className="perfil__bloque" aria-labelledby="perfil-avance">
      <h2 id="perfil-avance" className="practica__subtitulo">
        Tu avance
      </h2>
      <ul className="perfil__datos">
        {datos.map(([rotulo, valor, detalle]) => (
          <li key={rotulo} className="perfil__dato">
            <span className="perfil__dato-rotulo">{rotulo}</span>
            <strong className="perfil__dato-valor">{valor}</strong>
            {detalle && <span className="perfil__dato-detalle">{detalle}</span>}
          </li>
        ))}
      </ul>
      <a className="enlace perfil__mas" href="#/progreso">
        Ver todo en Mi progreso
      </a>
    </section>
  )
}

function Ficha({ usuario }: { usuario: Usuario }) {
  const animarIconos = useIconosAnimados()
  const { ref: mirada } = useGaze({ lookAt: 'pointer', travel: 3 })
  const elegido = useAvatarElegido()
  const avatar = elegido ?? usuario.correo
  const [eligiendo, setEligiendo] = useState(false)
  const [editando, setEditando] = useState(false)
  const [nombre, setNombre] = useState(usuario.nombre)
  const [error, setError] = useState('')

  const guardarNombre = async (e: FormEvent) => {
    e.preventDefault()
    try {
      await cambiarNombre(nombre)
      setEditando(false)
      setError('')
    } catch (err: unknown) {
      setError(mensajeDeError(err) ?? '')
    }
  }

  return (
    <section className="perfil__ficha" aria-label="Tus datos">
      <div className="perfil__avatar">
        <Blobatar ref={mirada} name={avatar} size={132} animate="always" expression={happy} title="Tu blobatar" />
      </div>
      <div className="perfil__identidad">
        {editando ? (
          <form className="perfil__nombre-form" onSubmit={(e) => void guardarNombre(e)}>
            <label className="sr-only" htmlFor="perfil-nombre">
              Tu nombre
            </label>
            <input id="perfil-nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} maxLength={60} autoFocus />
            <button type="submit" className="boton boton--tinta">
              Guardar
            </button>
            <button type="button" className="boton-discreto" onClick={() => setEditando(false)}>
              Cancelar
            </button>
          </form>
        ) : (
          <h1 className="perfil__nombre">
            {usuario.nombre}
            <button type="button" className="perfil__editar" onClick={() => setEditando(true)} aria-label="Cambiar tu nombre">
              <PencilIcon size={18} isAnimated={animarIconos} aria-hidden="true" />
            </button>
          </h1>
        )}
        {error && (
          <p className="perfil__mensaje is-error" role="alert">
            {error}
          </p>
        )}
        <p className="perfil__correo">{usuario.correo}</p>
        <ul className="perfil__meta">
          <li>Entras con {usuario.conGoogle ? 'Google' : 'correo y contraseña'}</li>
          {usuario.creada && <li>En Savia desde el {fecha(usuario.creada)}</li>}
        </ul>
        <button type="button" className="boton-discreto perfil__cambiar" aria-expanded={eligiendo} onClick={() => setEligiendo((v) => !v)}>
          {eligiendo ? 'Listo' : 'Cambiar mi blobatar'}
        </button>
      </div>

      {eligiendo && (
        <div className="perfil__opciones" role="radiogroup" aria-label="Elige tu blobatar">
          {opcionesDeAvatar(usuario.correo).map((opcion, i) => (
            <button
              key={opcion}
              type="button"
              role="radio"
              aria-checked={opcion === avatar}
              aria-label={`Blobatar ${i + 1}`}
              className="perfil__opcion"
              onClick={() => elegirAvatar(opcion)}
            >
              <Blobatar name={opcion} size={64} animate="hover" />
            </button>
          ))}
        </div>
      )}
    </section>
  )
}

function AccionesCuenta() {
  const cuenta = useCuenta()
  const animarIconos = useIconosAnimados()
  const [confirmar, dialogo] = useConfirmacion()
  const [ocupado, setOcupado] = useState(false)
  const [error, setError] = useState('')

  const ejecutar = async (accion: () => Promise<void>) => {
    setOcupado(true)
    try {
      await accion()
    } catch (e: unknown) {
      setError(mensajeDeError(e) ?? '')
      setOcupado(false)
    }
  }

  const borrar = async () => {
    const aceptado = await confirmar({
      titulo: '¿Borrar tu cuenta?',
      mensaje: 'Se borran tu cuenta y todo el progreso guardado en ella (intentos, repaso, guardadas), también de este dispositivo. No se puede deshacer.',
      confirmar: 'Borrar cuenta',
      peligro: true,
    })
    if (aceptado) await ejecutar(borrarCuenta)
  }

  const estado = cuenta.sincronizando
    ? 'Guardando tu progreso en tu cuenta…'
    : (cuenta.error ?? (cuenta.sincronizado ? `Tu progreso está guardado en tu cuenta (última vez a las ${hora(cuenta.sincronizado)}).` : 'Tu progreso se guarda en tu cuenta.'))

  return (
    <section className="perfil__bloque" aria-labelledby="perfil-cuenta">
      {dialogo}
      <h2 id="perfil-cuenta" className="practica__subtitulo">
        Tu cuenta
      </h2>
      <p className={`perfil__mensaje ${cuenta.error ? 'is-error' : ''}`} role="status">
        {estado}
      </p>
      {error && (
        <p className="perfil__mensaje is-error" role="alert">
          {error}
        </p>
      )}
      <div className="perfil__acciones">
        <button type="button" className="boton-discreto" disabled={ocupado} onClick={() => void ejecutar(cerrarSesion)}>
          <LogOutIcon size={18} isAnimated={animarIconos} aria-hidden="true" /> Cerrar sesión
        </button>
        <button type="button" className="boton-discreto perfil__borrar" disabled={ocupado} onClick={() => void borrar()}>
          <Trash2Icon size={18} isAnimated={animarIconos} aria-hidden="true" /> Borrar mi cuenta
        </button>
      </div>
      <p className="perfil__nota">Al cerrar sesión, tu progreso se borra de este dispositivo y queda guardado en tu cuenta.</p>
    </section>
  )
}

// Página "Mi perfil": el blobatar y los datos de la cuenta, un resumen del avance y las
// acciones de la cuenta. Sin sesión, invita a entrar.
export function Perfil() {
  const cuenta = useCuenta()
  const usuario = cuenta.estado === 'dentro' ? cuenta.usuario : null

  if (!usuario) {
    return (
      <main className="contenedor pagina perfil">
        <header className="pagina__cabecera">
          <h1 className="pagina__titulo">Mi perfil</h1>
          <p className="pagina__texto">
            {cuenta.estado === 'cargando' ? 'Cargando tu cuenta…' : 'Entra a tu cuenta para ver tu perfil y guardar tu progreso en la nube.'}
          </p>
        </header>
        {cuenta.estado === 'fuera' && (
          <a className="boton boton--tinta" href="#/entrar">
            Entrar
          </a>
        )}
      </main>
    )
  }

  return (
    <main className="contenedor pagina perfil">
      <Cinta className="seccion__kicker">Mi perfil</Cinta>
      <Ficha usuario={usuario} />
      <Estadisticas />
      <AccionesCuenta />
    </main>
  )
}
