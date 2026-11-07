import { useEffect, useState, type ReactNode } from 'react'
import { Accesibilidad } from './Accesibilidad'
import { Bocetos } from './Bocetos'
import { VolverArriba } from './VolverArriba'
import { DESARROLLADOR, PROYECTO } from '../lib/proyecto'
import { abrirLegal, RUTAS, RUTAS_LEGALES, type Ruta } from '../lib/ruta'
import { MenuIcon, XIcon } from '@animateicons/react/lucide'
import { useIconosAnimados } from '../lib/useIconosAnimados'
import hojaBoceto from '../assets/bocetos/hoja.svg'
import { IconoContacto, type TipoContacto } from './IconoContacto'
import { instalar, useInstalable } from '../lib/pwa'
import { DownloadIcon } from '@animateicons/react/lucide'

function IconoPie({ tipo }: { tipo: TipoContacto }) {
  return <IconoContacto tipo={tipo} className="contraportada__icono" />
}

// Símbolo de Savia (kit en src/assets/logo). El cuadrado toma el color del CSS para conservar el hover.
function Logo() {
  return (
    <svg className="logo__icono" viewBox="0 0 64 64" aria-hidden="true">
      <rect width="64" height="64" rx="14" fill="currentColor" />
      <path d="M43.28 51.64 16.31 54Q16.11 54.01 15.91 53.94Q15.72 53.88 15.57 53.73L14.94 53.11Q14 52.19 14.77 51.12Q15.53 50.05 14.59 49.13Q13.65 48.21 14.42 47.14Q15.19 46.07 14.25 45.15Q13.31 44.23 14.07 43.16L14.59 42.45Q14.71 42.28 14.88 42.18Q15.06 42.08 15.27 42.06L32.31 40.57L16.21 25.25Q16.11 25.15 16.04 25.03Q15.97 24.92 15.94 24.79Q15.91 24.65 15.92 24.52Q15.92 24.38 15.97 24.25L19.91 12.99Q19.96 12.86 20.03 12.75Q20.11 12.64 20.22 12.56Q20.33 12.47 20.46 12.42Q20.58 12.38 20.72 12.36L47.69 10Q47.89 9.99 48.09 10.06Q48.28 10.12 48.43 10.27L49.06 10.89Q50 11.81 49.23 12.88Q48.47 13.95 49.41 14.87Q50.35 15.79 49.58 16.86Q48.81 17.93 49.75 18.85Q50.69 19.77 49.93 20.84L49.41 21.55Q49.29 21.72 49.12 21.82Q48.94 21.92 48.73 21.94L31.69 23.43L47.79 38.75Q47.89 38.85 47.96 38.97Q48.03 39.08 48.06 39.22Q48.09 39.35 48.08 39.48Q48.08 39.62 48.03 39.75L44.09 51.01Q44.04 51.14 43.97 51.25Q43.89 51.36 43.78 51.44Q43.67 51.53 43.55 51.58Q43.42 51.62 43.28 51.64Z" fill="#D6E9E2" className="logo__trazo logo__trazo--fondo" />
      <path d="M43.28 51.64 16.31 54Q16.11 54.01 15.91 53.94Q15.72 53.88 15.57 53.73L14.94 53.11Q14 52.19 14.77 51.12Q15.53 50.05 14.59 49.13Q13.65 48.21 14.42 47.14Q15.09 46.21 14.45 45.39Q14.36 45.27 14.25 45.15Q13.31 44.23 14.07 43.16L14.59 42.45L14.59 42.45Q14.71 42.28 14.88 42.18Q15.06 42.08 15.27 42.06L48.05 39.19Q48.05 39.2 48.06 39.22Q48.09 39.35 48.08 39.48Q48.08 39.62 48.03 39.75L44.09 51.01Q44.04 51.14 43.97 51.25Q43.89 51.36 43.78 51.44Q43.67 51.53 43.55 51.58Q43.42 51.62 43.28 51.64ZM31.69 23.43 20.24 12.54Q20.34 12.47 20.46 12.42Q20.58 12.38 20.72 12.36L47.69 10Q47.89 9.99 48.09 10.06Q48.28 10.12 48.43 10.27L48.43 10.27L49.06 10.89Q50 11.81 49.23 12.88Q48.47 13.95 49.41 14.87Q50.35 15.79 49.58 16.86Q48.81 17.93 49.75 18.85Q50.69 19.77 49.93 20.84L49.41 21.55L49.41 21.55Q49.29 21.72 49.12 21.82Q48.94 21.92 48.73 21.94Z" fill="#FFFFFF" className="logo__trazo logo__trazo--frente" />
    </svg>
  )
}

export function Marco({ ruta, children }: { ruta: Ruta | null; children: ReactNode }) {
  const [abierto, setAbierto] = useState(false)
  const animarIconos = useIconosAnimados()
  const instalable = useInstalable()

  useEffect(() => {
    setAbierto(false)
  }, [ruta])

  return (
    <>
      <a href="#contenido" className="saltar">
        Saltar al contenido
      </a>
      <header className="nav">
        <div className="nav__contenedor">
          <a href="#/" className="logo">
            <Logo />
            <span className="logo__texto">
              Savia
              <span className="logo__sub">EDAD II · Biología</span>
            </span>
          </a>
          <button
            type="button"
            className="nav__menu"
            aria-expanded={abierto}
            aria-controls="nav-enlaces"
            onClick={() => setAbierto((a) => !a)}
          >
            <span className="sr-only">{abierto ? 'Cerrar menú' : 'Abrir menú'}</span>
            {abierto ? (
              <XIcon size={22} isAnimated={animarIconos} aria-hidden="true" />
            ) : (
              <MenuIcon size={22} isAnimated={animarIconos} aria-hidden="true" />
            )}
          </button>
          <nav id="nav-enlaces" className={`nav__enlaces ${abierto ? 'is-abierto' : ''}`} aria-label="Principal">
            {RUTAS.filter((r) => r.id !== 'proyecto').map((r) => (
              <a key={r.id} href={r.href} className="nav__enlace" aria-current={ruta === r.id ? 'page' : undefined}>
                {r.nombre}
              </a>
            ))}
          </nav>
        </div>
      </header>

      <div id="contenido" tabIndex={-1} className="contenido">
        <Bocetos ruta={ruta} />
        {children}
      </div>

      <footer className="contraportada">
        <svg className="contraportada__ola" viewBox="0 0 1440 60" preserveAspectRatio="none" aria-hidden="true">
          <path d="M0 30C240 6 480 6 720 30s480 24 720 0V60H0Z" />
        </svg>
        <img className="contraportada__boceto" src={hojaBoceto} alt="" aria-hidden="true" loading="lazy" decoding="async" />

        <div className="contraportada__contenedor">
          <div className="contraportada__marca">
            <a href="#/" className="contraportada__logo" aria-label="Savia, ir al inicio">
              <Logo />
              <span>Savia</span>
            </a>
            <p className="contraportada__lema">una semilla de aprendizaje</p>
            {instalable && (
              <button type="button" className="contraportada__instalar" onClick={() => void instalar()}>
                <span className="contraportada__instalar-icono" aria-hidden="true">
                  <DownloadIcon size={20} isAnimated={animarIconos} />
                </span>
                <span className="contraportada__instalar-texto">
                  <strong>Instalar Savia</strong>
                  <span>Úsala como app, también sin internet</span>
                </span>
              </button>
            )}
            <p className="contraportada__texto">
              Práctica gratuita para la prueba EDAD II de Biología, hecha en el {PROYECTO.codigo} de la {PROYECTO.universidad} para
              estudiantes atendidos por el IMAS y el MEP.
            </p>
          </div>

          <nav className="contraportada__columna" aria-label="Pie de página">
            <p className="contraportada__titulo">Explora</p>
            <ul className="contraportada__lista">
              {RUTAS.map((r) => (
                <li key={r.id}>
                  <a href={r.href}>{r.nombre}</a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="contraportada__columna">
            <p className="contraportada__titulo">Contacto</p>
            <ul className="contraportada__lista contraportada__lista--contacto">
              <li>
                <IconoPie tipo="persona" />
                <span>{PROYECTO.docente}</span>
              </li>
              <li>
                <IconoPie tipo="correo" />
                <a href={`mailto:${PROYECTO.correo}`}>{PROYECTO.correo}</a>
              </li>
              <li>
                <IconoPie tipo="telefono" />
                <a href={`tel:+506${PROYECTO.telefono}`}>{PROYECTO.telefonoVisible}</a>
              </li>
              <li>
                <IconoPie tipo="facebook" />
                <a href={PROYECTO.facebook} target="_blank" rel="noopener noreferrer">
                  Facebook del consultorio
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="contraportada__base">
          <div className="contraportada__aviso">
            <p>
              Material de práctica sin fines de lucro. No es una prueba oficial del MEP ni sustituye las convocatorias y los materiales
              oficiales.
            </p>
            <ul className="contraportada__legal" aria-label="Información legal">
              {RUTAS_LEGALES.map((r) => (
                <li key={r.id}>
                  <a href={r.href} onClick={(e) => abrirLegal(e, r.href)}>
                    {r.nombre}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div className="contraportada__creditos">
            <p className="contraportada__firma">{PROYECTO.codigo} · Puntarenas</p>
            <p className="contraportada__autor">
              Desarrollado por{' '}
              <a href={DESARROLLADOR.linkedin} target="_blank" rel="noopener noreferrer">
                {DESARROLLADOR.nombre}
              </a>
            </p>
          </div>
        </div>
      </footer>
      <Accesibilidad />
      <VolverArriba />
    </>
  )
}
