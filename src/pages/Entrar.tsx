import { useEffect, useRef, useState, type CSSProperties, type FormEvent } from 'react'
import { Blobatar } from '@blobatar/react'
import { useGaze } from '@blobatar/react/gaze'
import { happy, idle, love, sad, shy } from 'blobatar/expression'
import 'blobatar/motion.css'
import 'blobatar/gaze.css'
import { ArrowLeftIcon, EyeIcon, EyeOffIcon } from '@animateicons/react/lucide'
import { Cinta } from '../components/Cinta'
import { Logo } from '../components/Marco'
import { crearCuentaConCorreo, entrarConCorreo, entrarConGoogle, mensajeDeError, prepararCuenta, recuperarClave, useCuenta } from '../lib/cuenta'
import { irA, regresar } from '../lib/ruta'

type Modo = 'entrar' | 'crear' | 'recuperar'

// Lo que tarda en desvanecerse el formulario antes de armar el de la otra pestaña.
const SALIDA_MS = 200

const sinMovimiento = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.classList.contains('a11y-reduce-motion')

// Logo de Google (los cuatro colores oficiales), para el botón de Google.
function LogoGoogle() {
  return (
    <svg className="entrar__google" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  )
}

// Solo recuperar la contraseña lleva un texto que explica qué va a pasar; los demás, solo el título.
const TEXTOS: Record<Modo, { titulo: string; texto?: string; boton: string }> = {
  entrar: {
    titulo: '¡Qué bueno verte de nuevo!',
    boton: 'Entrar',
  },
  crear: {
    titulo: 'Crea tu cuenta',
    boton: 'Crear cuenta',
  },
  recuperar: {
    titulo: 'Recupera tu contraseña',
    texto: 'Escribe el correo de tu cuenta y te enviaremos un enlace para crear una contraseña nueva.',
    boton: 'Enviar enlace',
  },
}

// Página para entrar o crear una cuenta: a la izquierda, un panel con la marca y pestañas;
// a la derecha, el formulario con un blobatar que se arma con el correo, sigue el cursor con
// la mirada y cambia de cara (tímido con la contraseña, triste si algo falla, feliz al entrar).
export function Entrar() {
  const cuenta = useCuenta()
  const { ref: mirada } = useGaze({ lookAt: 'pointer', travel: 3 })
  // modo: lo que muestra el formulario · destino: la pestaña elegida (cambia al instante, para
  // que la forma blanca empiece a deslizarse mientras el formulario se desvanece)
  const [modo, setModo] = useState<Modo>('entrar')
  const [destino, setDestino] = useState<Modo>('entrar')
  const [saliendo, setSaliendo] = useState(false)
  const temporizador = useRef<number | undefined>(undefined)
  const [nombre, setNombre] = useState('')
  const [correo, setCorreo] = useState('')
  const [clave, setClave] = useState('')
  const [verClave, setVerClave] = useState(false)
  const [enClave, setEnClave] = useState(false)
  const [ocupado, setOcupado] = useState(false)
  const [error, setError] = useState('')
  const [aviso, setAviso] = useState('')

  // con la sesión iniciada, esta página lleva al perfil
  useEffect(() => {
    if (cuenta.estado === 'dentro') irA('perfil')
  }, [cuenta.estado])

  useEffect(() => () => window.clearTimeout(temporizador.current), [])

  // Firebase se descarga al abrir la página: así la ventana de Google se abre en el mismo toque
  // (Safari en iPhone la bloquea si hay que esperar)
  useEffect(prepararCuenta, [])

  const intentar = async (accion: () => Promise<void>) => {
    setOcupado(true)
    setError('')
    setAviso('')
    try {
      await accion()
    } catch (e: unknown) {
      setError(mensajeDeError(e) ?? '')
    } finally {
      setOcupado(false)
    }
  }

  const enviar = (e: FormEvent) => {
    e.preventDefault()
    if (modo === 'recuperar') {
      void intentar(async () => {
        await recuperarClave(correo)
        setAviso('Si hay una cuenta con ese correo, te enviamos un enlace para crear una contraseña nueva. Revisa también el correo no deseado.')
      })
    } else if (modo === 'crear') void intentar(() => crearCuentaConCorreo(nombre, correo, clave))
    else void intentar(() => entrarConCorreo(correo, clave))
  }

  // Al cambiar de pestaña, el formulario se desvanece y el nuevo se arma en cascada.
  const cambiarModo = (nuevo: Modo) => {
    if (nuevo === destino) return
    setDestino(nuevo)
    setError('')
    setAviso('')
    window.clearTimeout(temporizador.current)
    if (sinMovimiento()) {
      setModo(nuevo)
      return
    }
    setSaliendo(true)
    temporizador.current = window.setTimeout(() => {
      setModo(nuevo)
      setSaliendo(false)
    }, SALIDA_MS)
  }

  // orden en que aparece cada elemento del formulario al armarse (en el orden en que se dibujan)
  let orden = 0
  const enCascada = (): CSSProperties => ({ '--orden': orden++ }) as CSSProperties

  const expresion = cuenta.estado === 'dentro' ? love : error || cuenta.errorEntrada ? sad : enClave && !verClave ? shy : /\S+@\S+\.\S+/.test(correo) ? happy : idle
  const { titulo, texto, boton } = TEXTOS[modo]

  if (cuenta.estado === 'apagado') {
    return (
      <main className="contenedor pagina">
        <h1 className="pagina__titulo">Las cuentas no están disponibles</h1>
        <p className="pagina__texto">Por ahora Savia funciona sin cuenta: tu progreso se guarda en este dispositivo.</p>
        <a className="boton boton--tinta" href="#/">
          Volver a Savia
        </a>
      </main>
    )
  }

  return (
    <main className="contenedor entrar">
      <div className="entrar__tarjeta">
        <section className="entrar__marca" aria-label="Savia">
          <span className="entrar__circulos" aria-hidden="true">
            <span className="entrar__circulo entrar__circulo--1" />
            <span className="entrar__circulo entrar__circulo--2" />
            <span className="entrar__circulo entrar__circulo--3" />
          </span>

          {/* esta página no lleva la barra de arriba: este enlace es la salida */}
          <button type="button" className="entrar__volver" onClick={regresar}>
            <ArrowLeftIcon size={18} isAnimated={false} aria-hidden="true" />
            Volver a Savia
          </button>

          <div className="entrar__pestanas" role="tablist" aria-label="Elige qué hacer" data-activa={destino === 'crear' ? 'crear' : 'entrar'}>
            {/* la forma blanca de la pestaña activa: es una sola y se desliza al cambiar */}
            <span className="entrar__indicador" aria-hidden="true" />
            <button type="button" role="tab" aria-selected={destino !== 'crear'} className="entrar__pestana" onClick={() => cambiarModo('entrar')}>
              Entrar
            </button>
            <button type="button" role="tab" aria-selected={destino === 'crear'} className="entrar__pestana" onClick={() => cambiarModo('crear')}>
              Crear cuenta
            </button>
          </div>

          <div className="entrar__lema">
            <a className="entrar__logo" href="#/" aria-label="Savia, ir al inicio">
              <Logo />
              <span>Savia</span>
            </a>
            <Cinta className="seccion__kicker">Con tu cuenta puedes</Cinta>
            <p className="entrar__titular">Estudiar desde cualquier dispositivo sin perder tu avance.</p>
          </div>
        </section>

        <section className="entrar__panel" aria-labelledby="entrar-titulo">
          <div key={modo} className={`entrar__contenido ${saliendo ? 'is-saliendo' : ''}`}>
          <div className="entrar__encabezado">
            <div className="entrar__avatar entrar__anima" style={enCascada()}>
              <Blobatar ref={mirada} name={correo.trim().toLowerCase() || 'savia'} size={84} animate="always" expression={expresion} title="Tu blobatar" />
            </div>
            <h1 id="entrar-titulo" className="entrar__titulo entrar__anima" style={enCascada()}>
              {titulo}
            </h1>
          </div>
          {texto && (
            <p className="entrar__texto entrar__anima" style={enCascada()}>
              {texto}
            </p>
          )}

          <form className="entrar__formulario" onSubmit={enviar}>
            {modo === 'crear' && (
              <label className="entrar__campo entrar__anima" style={enCascada()}>
                <span>Tu nombre</span>
                <input value={nombre} onChange={(e) => setNombre(e.target.value)} autoComplete="given-name" maxLength={60} />
              </label>
            )}
            <label className="entrar__campo entrar__anima" style={enCascada()}>
              <span>Correo</span>
              <input type="email" required value={correo} onChange={(e) => setCorreo(e.target.value)} autoComplete="email" inputMode="email" />
            </label>
            {modo !== 'recuperar' && (
              <label className="entrar__campo entrar__anima" style={enCascada()}>
                <span className="entrar__rotulo-clave">
                  Contraseña
                  {modo === 'crear' && <small>al menos 6 caracteres</small>}
                </span>
                <span className="entrar__clave">
                  <input
                    type={verClave ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={clave}
                    onChange={(e) => setClave(e.target.value)}
                    onFocus={() => setEnClave(true)}
                    onBlur={() => setEnClave(false)}
                    autoComplete={modo === 'crear' ? 'new-password' : 'current-password'}
                  />
                  <button
                    type="button"
                    className="entrar__ver"
                    onClick={() => setVerClave((v) => !v)}
                    aria-label={verClave ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    aria-pressed={verClave}
                  >
                    {verClave ? <EyeOffIcon size={20} isAnimated={false} aria-hidden="true" /> : <EyeIcon size={20} isAnimated={false} aria-hidden="true" />}
                  </button>
                </span>
              </label>
            )}

            {modo === 'entrar' && (
              <button type="button" className="enlace entrar__olvide entrar__anima" style={enCascada()} onClick={() => cambiarModo('recuperar')}>
                ¿Olvidaste tu contraseña?
              </button>
            )}

            {(error || cuenta.errorEntrada) && (
              <p className="entrar__mensaje is-error" role="alert">
                {error || cuenta.errorEntrada}
              </p>
            )}
            {aviso && (
              <p className="entrar__mensaje" role="status">
                {aviso}
              </p>
            )}

            <button type="submit" className="boton boton--tinta boton--ancho entrar__anima" style={enCascada()} disabled={ocupado}>
              {ocupado ? 'Un momento…' : boton}
            </button>
          </form>

          {modo !== 'recuperar' && (
            <>
              <p className="entrar__separador entrar__anima" style={enCascada()}>
                <span>o</span>
              </p>
              <button type="button" className="boton-discreto boton--ancho entrar__anima" style={enCascada()} disabled={ocupado || !cuenta.conectado} onClick={() => void intentar(entrarConGoogle)}>
                <LogoGoogle /> {cuenta.conectado ? 'Continuar con Google' : 'Preparando Google…'}
              </button>
            </>
          )}

          <p className="entrar__pie entrar__anima" style={enCascada()}>
            {modo === 'entrar' && (
              <>
                ¿No tienes cuenta?{' '}
                <button type="button" className="enlace" onClick={() => cambiarModo('crear')}>
                  Crear una
                </button>
              </>
            )}
            {modo === 'crear' && (
              <>
                ¿Ya tienes cuenta?{' '}
                <button type="button" className="enlace" onClick={() => cambiarModo('entrar')}>
                  Entrar
                </button>
              </>
            )}
            {modo === 'recuperar' && (
              <button type="button" className="enlace" onClick={() => cambiarModo('entrar')}>
                Volver a entrar
              </button>
            )}
          </p>

          <p className="entrar__nota entrar__anima" style={enCascada()}>
            La cuenta es opcional: al cerrar sesión, tu progreso queda en ella y se borra de este dispositivo.{' '}
            <a className="enlace" href="#/privacidad">
              Privacidad
            </a>
          </p>
          </div>
        </section>
      </div>
    </main>
  )
}
