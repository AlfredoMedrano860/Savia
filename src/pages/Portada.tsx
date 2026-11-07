import { ArrowRightIcon, ArrowUpRightIcon, AtomIcon, BookOpenIcon, GiftIcon, LayersIcon, ListChecksIcon } from '@animateicons/react/lucide'
import { CODIGOS, TEMAS, TOTAL_PREGUNTAS, type TemaCodigo } from '../lib/banco'
import { PROYECTO } from '../lib/proyecto'
import celulaBoceto from '../assets/bocetos/celula.webp'
import adnBoceto from '../assets/bocetos/adn.webp'
import balonBoceto from '../assets/bocetos/balon.webp'
import matrazBoceto from '../assets/bocetos/matraz.webp'
import microscopioBoceto from '../assets/bocetos/microscopio.webp'
import petriBoceto from '../assets/bocetos/petri.webp'
import plantaBoceto from '../assets/bocetos/planta.webp'
import { useIconosAnimados } from '../lib/useIconosAnimados'
import resumenTemas from 'virtual:resumen-temas'
import { HojaCuaderno } from '../components/HojaCuaderno'
import { Cinta } from '../components/Cinta'
import { MarcoDoble } from '../components/MarcoDoble'

// Boceto a lápiz de cada lámina de tema.
const BOCETOS: Record<TemaCodigo, string> = {
  T19: microscopioBoceto,
  T20: petriBoceto,
  T21: plantaBoceto,
  T22: adnBoceto,
  T23: balonBoceto,
  T24: matrazBoceto,
}

const PASOS = [
  { titulo: 'Elige el tipo de prueba', texto: 'Completa de 60 preguntas, corta de 30 o un quiz de 15, según el tiempo que tengas.' },
  { titulo: 'Responde marcando con X', texto: 'Como en la prueba real: una sola respuesta por pregunta, con el reloj corriendo.' },
  { titulo: 'Revisa tus errores', texto: 'Al terminar ves tu nota, en qué temas fallaste y por qué cada respuesta es la correcta.' },
]

export function Portada() {
  const animarIconos = useIconosAnimados()

  return (
    <main>
      <section className="heroe">
        <div className="contenedor heroe__contenido">
          <div className="heroe__copia">
            <Cinta as="div" className="heroe__etiqueta">
              <BookOpenIcon className="heroe__etiqueta-icono" size={18} isAnimated={animarIconos} aria-hidden="true" />
              Cuaderno de estudio
            </Cinta>
            <h1 className="heroe__titulo">
              Biología,<br /><span className="heroe__resaltado">pregunta por pregunta.</span>
            </h1>
            <p className="heroe__texto">
              Un espacio para practicar, revisar tus respuestas y volver sobre los temas que quieras entender mejor.
            </p>
            <div className="heroe__acciones">
              <a href="#/practicar" className="boton boton--claro">
                Empezar a practicar <ArrowUpRightIcon size={18} isAnimated={animarIconos} aria-hidden="true" />
              </a>
              <a href="#/temario" className="boton boton--contorno">
                <LayersIcon size={18} isAnimated={animarIconos} aria-hidden="true" /> Explorar temas
              </a>
            </div>
            <ul className="heroe__datos" aria-label="Características de Savia">
              <li>
                <ListChecksIcon className="heroe__dato-icono" size={20} isAnimated={animarIconos} aria-hidden="true" />
                <strong>{TOTAL_PREGUNTAS.toLocaleString('es-CR')}</strong>
                <span>preguntas</span>
              </li>
              <li>
                <LayersIcon className="heroe__dato-icono" size={20} isAnimated={animarIconos} aria-hidden="true" />
                <strong>6</strong>
                <span>temas de Biología</span>
              </li>
              <li>
                <GiftIcon className="heroe__dato-icono" size={20} isAnimated={animarIconos} aria-hidden="true" />
                <strong>Gratis</strong>
                <span>sin registrarte</span>
              </li>
            </ul>
          </div>
          <div className="heroe__escena">
            <HojaCuaderno className="heroe__marco-arte">
              <span className="heroe__numero" aria-hidden="true">01 / 06</span>
              <div className="heroe__arte">
                <img className="ilustracion-biologia" src={celulaBoceto} alt="Boceto a lápiz de una célula" width={694} height={720} />
              </div>
              <span className="heroe__sello">
                <AtomIcon className="heroe__sello-icono" size={26} isAnimated={animarIconos} aria-hidden="true" />
                <span>La vida<br />en estudio</span>
              </span>
            </HojaCuaderno>
            <Cinta as="span" className="heroe__nota heroe__nota--arriba" aria-hidden="true">apuntes de biología</Cinta>
            <Cinta as="span" className="heroe__nota heroe__nota--abajo" aria-hidden="true">lámina 01 · célula</Cinta>
          </div>
        </div>
        {/* Ola: onda periódica del doble de ancho que se desliza en bucle */}
        <svg className="heroe__ola" viewBox="0 0 1440 100" preserveAspectRatio="none" aria-hidden="true">
          <g className="heroe__ola-capa heroe__ola-capa--fondo">
            <path
              className="heroe__ola-relleno"
              d="M0 46C240 86 480 86 720 46S1200 6 1440 46 1920 86 2160 46 2640 6 2880 46V100H0Z"
            />
          </g>
        </svg>
      </section>

      <section className="contenedor seccion" aria-labelledby="como-titulo">
        <div className="seccion__cabecera seccion__cabecera--vertical">
          <div>
            <Cinta className="seccion__kicker">Cómo usar este cuaderno</Cinta>
            <h2 id="como-titulo" className="seccion__titulo">Una práctica en tres pasos</h2>
          </div>
          <p className="seccion__introduccion">Elige una modalidad, responde y usa la revisión para decidir qué estudiar después.</p>
        </div>
        <ol className="rejilla-3 pasos">
          {PASOS.map((paso, i) => (
            <HojaCuaderno as="li" key={paso.titulo} className="paso">
              <span className="paso__numero" aria-hidden="true">
                {String(i + 1).padStart(2, '0')}
              </span>
              <h3 className="paso__titulo">{paso.titulo}</h3>
              <p className="paso__texto">{paso.texto}</p>
            </HojaCuaderno>
          ))}
        </ol>
      </section>

      <section className="contenedor seccion" aria-labelledby="temas-portada">
        <div className="seccion__cabecera">
          <div>
            <Cinta className="seccion__kicker">Índice de contenidos</Cinta>
            <h2 id="temas-portada" className="seccion__titulo">Explora por tema</h2>
          </div>
          <a className="seccion__enlace" href="#/temario">
            Abrir temario completo <ArrowRightIcon size={18} isAnimated={animarIconos} aria-hidden="true" />
          </a>
        </div>
        <ul className="rejilla-3 laminas">
          {CODIGOS.map((t, i) => (
            <li key={t}>
              <MarcoDoble as="a" interactivo href="#/temario" className="lamina">
                <span className="lamina__cabecera">
                  <span className="lamina__numero">Lámina {String(i + 1).padStart(2, '0')}</span>
                  <span className="lamina__dato">{resumenTemas[t].preguntas} preguntas</span>
                </span>
                <span className="lamina__boceto" aria-hidden="true">
                  <img src={BOCETOS[t]} alt="" loading="lazy" decoding="async" />
                </span>
                <span className="lamina__titulo">
                  <span className="lamina__nombre">{TEMAS[t]}</span>
                  <span className="lamina__flecha" aria-hidden="true">
                    <ArrowRightIcon size={16} isAnimated={animarIconos} aria-hidden="true" />
                  </span>
                </span>
              </MarcoDoble>
            </li>
          ))}
        </ul>
      </section>

      <section className="franja-herbario" aria-labelledby="proyecto-portada">
        <HojaCuaderno className="contenedor herbario">
          <div className="herbario__copia">
            <Cinta className="seccion__kicker">De dónde viene</Cinta>
            <h2 id="proyecto-portada" className="herbario__titulo">
              Savia nació en el {PROYECTO.nombreCorto}
            </h2>
            <p className="herbario__texto">
              Una semilla de aprendizaje sembrada por estudiantes del trabajo comunal de la Universidad de Costa Rica.
            </p>
            <a href="#/proyecto" className="seccion__enlace">
              Conocer el proyecto <ArrowRightIcon size={18} isAnimated={animarIconos} aria-hidden="true" />
            </a>
          </div>

          <MarcoDoble className="herbario__etiqueta">
            <p className="herbario__etiqueta-titulo">Etiqueta de herbario</p>
            <dl className="herbario__ficha">
              <div>
                <dt>Espécimen</dt>
                <dd><em>Savia</em> · EDAD II</dd>
              </div>
              <div>
                <dt>Proyecto</dt>
                <dd>{PROYECTO.codigo}</dd>
              </div>
              <div>
                <dt>Institución</dt>
                <dd>{PROYECTO.universidad}</dd>
              </div>
              <div>
                <dt>Procedencia</dt>
                <dd>{PROYECTO.sede}</dd>
              </div>
              <div>
                <dt>Región</dt>
                <dd>{PROYECTO.region}</dd>
              </div>
            </dl>
            <Cinta as="span" className="herbario__cinta" aria-hidden="true" />
          </MarcoDoble>
        </HojaCuaderno>
      </section>
    </main>
  )
}
