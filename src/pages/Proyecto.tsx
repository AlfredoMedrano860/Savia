import { ArrowLeftIcon, ArrowUpRightIcon } from '@animateicons/react/lucide'
import fotoAutor from '../assets/fotos/alfredo-medrano.webp'
import { IconoContacto } from '../components/IconoContacto'
import { DESARROLLADOR, PROYECTO } from '../lib/proyecto'
import { regresar } from '../lib/ruta'
import { useIconosAnimados } from '../lib/useIconosAnimados'

const ACTIVIDADES = [
  'Talleres educativos y psicoeducativos en comunidades.',
  'Tutorías psicoeducativas, de inglés y de herramientas digitales.',
  'Talleres de cuento y dibujo para promover habilidades expresivas, verbales y lúdicas.',
  'Talleres de prevención de la violencia y desarrollo de habilidades sociales y comunicativas.',
  'Ferias comunitarias sobre organización, autocuidado, salud comunitaria y trabajo en equipo.',
  'Creación de materiales, afiches y recursos digitales para talleres y sesiones virtuales.',
]

// "Consultorio comunitario: un abordaje…" → título corto y bajada.
const [TITULO, BAJADA] = PROYECTO.nombre.split(': ')

export function Proyecto() {
  const animarIconos = useIconosAnimados()

  return (
    <main className="contenedor pagina proyecto-pagina">
      <button type="button" className="seccion__enlace proyecto-pagina__regresar" onClick={regresar}>
        <ArrowLeftIcon size={18} isAnimated={animarIconos} aria-hidden="true" />
        Regresar
      </button>

      <header className="proyecto-pagina__cabecera">
        <p className="seccion__kicker">
          {PROYECTO.codigo} · {PROYECTO.universidad}
        </p>
        <h1 className="pagina__titulo">{TITULO}</h1>
        {BAJADA && <p className="pagina__texto proyecto-pagina__bajada">{BAJADA.charAt(0).toUpperCase() + BAJADA.slice(1)}.</p>}
      </header>

      <section className="proyecto-pagina__intro" aria-labelledby="trata-titulo">
        <div className="prosa">
          <h2 id="trata-titulo" className="practica__subtitulo">
            ¿De qué trata?
          </h2>
          <p>
            El Trabajo Comunal Universitario {PROYECTO.codigo} promueve acciones de prevención y construcción de vínculos mediante
            talleres psicoeducativos y apoyo a la organización comunitaria, para desarrollar capacidades grupales y comunitarias de
            resistencia y resiliencia.
          </p>
          <p>
            El trabajo se realiza en espacios comunitarios de la {PROYECTO.region} donde la exclusión social y la violencia han venido
            afectando a las comunidades, siempre en conjunto con las personas que viven en ellas.
          </p>
        </div>

        <div className="herbario__etiqueta proyecto-pagina__ficha">
          <p className="herbario__etiqueta-titulo">Ficha del proyecto</p>
          <dl className="herbario__ficha">
            <div>
              <dt>Código</dt>
              <dd>{PROYECTO.codigo}</dd>
            </div>
            <div>
              <dt>Sede</dt>
              <dd>{PROYECTO.sede}</dd>
            </div>
            <div>
              <dt>Dónde</dt>
              <dd>Comunidades de la {PROYECTO.region}</dd>
            </div>
            <div>
              <dt>En alianza con</dt>
              <dd>IMAS y MEP</dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="proyecto-pagina__savia" aria-labelledby="savia-titulo">
        <p className="proyecto-pagina__savia-rotulo">¿Por qué Savia?</p>
        <h2 id="savia-titulo" className="proyecto-pagina__savia-titulo">
          Material de práctica para quien no lo tenía.
        </h2>
        <p>
          Muchas personas jóvenes y adultas que retoman sus estudios por medio de la Educación Diversificada a Distancia (EDAD) no
          tienen acceso a material de práctica. Savia se desarrolló dentro del proyecto como herramienta de apoyo para estudiantes
          atendidos por el Instituto Mixto de Ayuda Social (IMAS) y el Ministerio de Educación Pública (MEP).
        </p>
        <ul className="proyecto-pagina__rasgos">
          <li>Funciona en el celular</li>
          <li>No pide registro</li>
          <li>No tiene costo</li>
        </ul>
      </section>

      <section className="proyecto-pagina__bloque" aria-labelledby="actividades-titulo">
        <h2 id="actividades-titulo" className="practica__subtitulo">
          ¿Qué actividades realiza?
        </h2>
        <ol className="actividades">
          {ACTIVIDADES.map((a, i) => (
            <li key={a} className="actividad">
              <span className="actividad__numero" aria-hidden="true">
                {String(i + 1).padStart(2, '0')}
              </span>
              <span>{a}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="proyecto-pagina__bloque" aria-labelledby="contacto-titulo">
        <h2 id="contacto-titulo" className="practica__subtitulo">
          Contacto
        </h2>
        <ul className="contacto-tarjetas">
          <li className="contacto-tarjeta">
            <IconoContacto tipo="persona" className="contacto-tarjeta__icono" />
            <span className="contacto-tarjeta__rotulo">Docente responsable</span>
            <span className="contacto-tarjeta__valor">{PROYECTO.docente}</span>
          </li>
          <li className="contacto-tarjeta">
            <IconoContacto tipo="correo" className="contacto-tarjeta__icono" />
            <span className="contacto-tarjeta__rotulo">Correo</span>
            <a className="contacto-tarjeta__valor" href={`mailto:${PROYECTO.correo}`}>
              {/* si no cabe, se parte después de la arroba y no a mitad de palabra */}
              {PROYECTO.correo.split('@')[0]}
              <wbr />@{PROYECTO.correo.split('@')[1]}
            </a>
          </li>
          <li className="contacto-tarjeta">
            <IconoContacto tipo="telefono" className="contacto-tarjeta__icono" />
            <span className="contacto-tarjeta__rotulo">Teléfono</span>
            <a className="contacto-tarjeta__valor" href={`tel:+506${PROYECTO.telefono}`}>
              {PROYECTO.telefonoVisible}
            </a>
          </li>
          <li className="contacto-tarjeta">
            <IconoContacto tipo="facebook" className="contacto-tarjeta__icono" />
            <span className="contacto-tarjeta__rotulo">Redes</span>
            <a className="contacto-tarjeta__valor" href={PROYECTO.facebook} target="_blank" rel="noopener noreferrer">
              Facebook del consultorio
            </a>
          </li>
        </ul>
      </section>

      <section className="proyecto-pagina__bloque" aria-labelledby="autor-titulo">
        <div className="autor">
          <figure className="autor__polaroid">
            <img src={fotoAutor} alt={`Foto de ${DESARROLLADOR.nombre}`} width={480} height={600} loading="lazy" decoding="async" />
            <figcaption>{DESARROLLADOR.nombre}</figcaption>
          </figure>
          <div className="autor__texto">
            <p className="seccion__kicker">Desarrollado por</p>
            <h2 id="autor-titulo" className="autor__nombre">
              {DESARROLLADOR.nombre}
            </h2>
            <p className="autor__rol">Estudiante del {PROYECTO.nombreCorto} · 2026–2027</p>
            <p className="autor__descripcion">
              Desarrollé Savia como parte del {PROYECTO.codigo} para que las nuevas generaciones que preparan la prueba EDAD II tengan
              material gratuito para practicar y aprender de sus errores.
            </p>
            <p className="autor__nota">¡Mucho éxito en tu prueba!</p>
            <a className="autor__enlace" href={DESARROLLADOR.linkedin} target="_blank" rel="noopener noreferrer">
              <svg className="autor__linkedin" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.03-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13ZM7.12 20.45H3.56V9h3.56v11.45ZM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0Z" />
              </svg>
              Ver perfil en LinkedIn
              <ArrowUpRightIcon size={16} isAnimated={animarIconos} aria-hidden="true" />
            </a>
          </div>
        </div>
      </section>
    </main>
  )
}
