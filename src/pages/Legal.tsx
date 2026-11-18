import type { ReactNode } from 'react'
import { PROYECTO, SOPORTE } from '../lib/proyecto'
import { abrirLegal, regresar, RUTAS_LEGALES, type RutaLegal } from '../lib/ruta'
import { Cinta } from '../components/Cinta'
import { BotonRegresar } from '../components/BotonRegresar'
import { useCarrusel } from '../lib/useCarrusel'

// Fecha en que se publicó la versión vigente de estos textos. Si se cambia algo de
// fondo, se actualiza esta fecha.
const VIGENCIA = '17 de noviembre de 2026'

const correo = (
  <a className="enlace" href={`mailto:${SOPORTE.correo}`}>
    {SOPORTE.correo}
  </a>
)

// Lo que Savia guarda en el navegador. Es la lista real de claves que usa el código
// (lib/almacen.ts, lib/aprendizaje.ts, PreguntaDelDia, Accesibilidad; las anteriores "ribosoma:…" se migran en lib/migrarDatos.ts).
const DATOS_LOCALES = [
  ['savia:prueba', 'La práctica que dejaste a medias, para poder retomarla.'],
  ['savia:historial', 'Tus intentos anteriores: fecha, nota y respuestas, para revisarlos.'],
  ['savia:aprendizaje', 'Tu avance por tema y las preguntas que te tocan en el repaso espaciado.'],
  ['savia:guardadas', 'Las preguntas que marcaste con la estrella.'],
  ['savia:diaria', 'La pregunta del día que respondiste y tu racha de días seguidos.'],
  ['savia:accesibilidad', 'Tus preferencias del panel de accesibilidad (tamaño de letra, filtros, etc.).'],
  ['savia:perfil', 'El blobatar que elegiste para tu perfil.'],
  ['savia:sesion', 'Solo si iniciaste sesión: que hay una sesión abierta, para recuperarla al abrir Savia.'],
  ['firebaseLocalStorageDb', 'Solo si iniciaste sesión: la sesión de tu cuenta, que guarda Firebase en el navegador (IndexedDB).'],
]

// Fuentes y bibliotecas de terceros incluidas en Savia, con su licencia.
const LICENCIAS = [
  ['React y React DOM', 'Biblioteca para construir la interfaz', 'MIT'],
  ['Fraunces', 'Fuente de los títulos', 'SIL Open Font License 1.1'],
  ['Bricolage Grotesque', 'Fuente del texto', 'SIL Open Font License 1.1'],
  ['Caveat', 'Fuente manuscrita de las notas', 'SIL Open Font License 1.1'],
  ['OpenDyslexic', 'Fuente opcional para dislexia', 'SIL Open Font License 1.1'],
  ['Fontsource', 'Paquetes para incluir las fuentes en el sitio', 'MIT'],
  ['AnimateIcons (@animateicons/react)', 'Íconos animados', 'MIT'],
  ['Lucide', 'Diseño de los íconos', 'ISC'],
  ['Motion', 'Animaciones de los íconos', 'MIT'],
  ['Blobatar (@blobatar/react)', 'Avatares de perfil', 'MIT'],
  ['Recharts', 'Gráficos de tu avance en Mi perfil', 'MIT'],
  ['Firebase JavaScript SDK', 'Cuentas y progreso en la nube (opcional)', 'Apache 2.0'],
]

interface Bloque {
  titulo: string
  contenido: ReactNode
}

interface Documento {
  titulo: string
  resumen: ReactNode
  bloques: Bloque[]
}

const DOCUMENTOS: Record<RutaLegal, Documento> = {
  terminos: {
    titulo: 'Términos de uso',
    resumen: (
      <>
        Savia es gratis, no necesita cuenta (es opcional) y es solo material de práctica. Úsala para estudiar y compártela sin fines de lucro; no
        es una prueba oficial ni garantiza un resultado en la EDAD II.
      </>
    ),
    bloques: [
      {
        titulo: '1. Quiénes somos',
        contenido: (
          <p>
            Savia es una herramienta educativa gratuita creada en el {PROYECTO.codigo} “{PROYECTO.nombre}” de la {PROYECTO.universidad},{' '}
            {PROYECTO.sede}. Para cualquier consulta sobre estos términos puedes escribir a {correo}.
          </p>
        ),
      },
      {
        titulo: '2. Aceptación',
        contenido: (
          <p>
            Al usar Savia, en la web o instalada como app, aceptas estos términos. Si no estás de acuerdo con ellos, te pedimos no
            usarla.
          </p>
        ),
      },
      {
        titulo: '3. Qué es Savia y qué no es',
        contenido: (
          <ul>
            <li>Es material de práctica de Biología para preparar la prueba de Educación Diversificada a Distancia (EDAD II).</li>
            <li>
              No es una prueba oficial y no tiene relación con el Ministerio de Educación Pública (MEP) ni con las instancias que
              aplican la prueba. Mencionamos “EDAD II” solo para describir para qué sirve el material.
            </li>
            <li>
              No sustituye los temarios, las convocatorias ni los materiales oficiales. Revisa siempre la información oficial del MEP.
            </li>
            <li>Practicar en Savia no garantiza aprobar ni obtener una nota determinada.</li>
          </ul>
        ),
      },
      {
        titulo: '4. Uso permitido',
        contenido: (
          <>
            <p>Puedes usar Savia para estudiar, y también imprimir y compartir sus pruebas para estudiar o dar clases, siempre sin fines de lucro.</p>
            <p>No está permitido:</p>
            <ul>
              <li>Vender Savia, sus preguntas o sus pruebas, o cobrar por acceder a ellas.</li>
              <li>Copiar el banco de preguntas para publicarlo en otro lugar o presentarlo como propio.</li>
              <li>Intentar dañar el sitio, saturarlo o usarlo para algo ilegal.</li>
            </ul>
          </>
        ),
      },
      {
        titulo: '5. Contenido y posibles errores',
        contenido: (
          <p>
            Revisamos las preguntas y explicaciones con cuidado, pero pueden contener errores. Si encuentras uno, escríbenos a {correo}{' '}
            para corregirlo. La información de Savia es educativa y general; no reemplaza la orientación de tus docentes.
          </p>
        ),
      },
      {
        titulo: '6. Propiedad intelectual',
        contenido: (
          <p>
            Los textos, las preguntas, las explicaciones, las ilustraciones, el nombre y el logo de Savia pertenecen a sus autores y al
            proyecto. Las fuentes, los íconos y las bibliotecas de terceros se usan según sus propias licencias, que se detallan en{' '}
            <a className="enlace" href="#/licencias" onClick={(e) => abrirLegal(e, '#/licencias')}>
              Licencias y créditos
            </a>
            .
          </p>
        ),
      },
      {
        titulo: '7. Enlaces a otros sitios',
        contenido: (
          <p>
            Savia enlaza a sitios externos, como la página de Facebook del {PROYECTO.nombreCorto} o el perfil de LinkedIn del
            desarrollador. Esos sitios tienen sus propias reglas y políticas de privacidad, y no somos responsables de su contenido.
          </p>
        ),
      },
      {
        titulo: '8. Disponibilidad',
        contenido: (
          <p>
            Ofrecemos Savia tal como está, de forma gratuita y sin garantía de que esté siempre disponible o libre de fallas. Podemos
            cambiarla, actualizarla o dejar de ofrecerla en cualquier momento. Necesita conexión a internet para funcionar.
          </p>
        ),
      },
      {
        titulo: '9. Responsabilidad',
        contenido: (
          <p>
            En la medida en que la ley lo permita, el proyecto y sus autores no son responsables por decisiones tomadas a partir del
            contenido de Savia, por resultados en pruebas oficiales ni por la pérdida del progreso guardado en tu dispositivo (por
            ejemplo, si se borran los datos del navegador).
          </p>
        ),
      },
      {
        titulo: '10. Personas menores de edad',
        contenido: (
          <p>
            Savia puede usarse a cualquier edad y sin cuenta. Si eres menor de edad y quieres crear una cuenta, hazlo con el permiso y
            el acompañamiento de tu madre, padre o persona encargada. Recomendamos que las personas menores usen Savia con el
            acompañamiento de su familia o docentes.
          </p>
        ),
      },
      {
        titulo: '11. Cambios y ley aplicable',
        contenido: (
          <p>
            Podemos actualizar estos términos; la fecha de la versión vigente aparece al inicio de esta página. Estos términos se rigen
            por las leyes de la República de Costa Rica.
          </p>
        ),
      },
    ],
  },
  privacidad: {
    titulo: 'Política de privacidad',
    resumen: (
      <>
        Puedes usar Savia sin cuenta: así tus respuestas y tu progreso se guardan solo en tu dispositivo. Si decides crear una
        cuenta, guardamos tu correo, tu nombre y tu progreso para que lo encuentres en cualquier dispositivo, y puedes borrarlo todo
        cuando quieras.
      </>
    ),
    bloques: [
      {
        titulo: '1. Responsable y contacto',
        contenido: (
          <p>
            Savia es parte del {PROYECTO.codigo} de la {PROYECTO.universidad}. Esta política sigue los principios de la Ley de
            Protección de la Persona frente al Tratamiento de sus Datos Personales (Ley N.º 8968 de Costa Rica). Para consultas sobre
            privacidad escribe a {correo}.
          </p>
        ),
      },
      {
        titulo: '2. Qué datos recogemos',
        contenido: (
          <ul>
            <li>Sin cuenta, ninguno: no pedimos nombre, correo, teléfono, cédula ni ningún otro dato personal.</li>
            <li>Con cuenta, solo lo que se explica en la sección 4.</li>
            <li>No usamos cookies, analíticas, publicidad ni herramientas de seguimiento de terceros.</li>
            <li>No vendemos, alquilamos ni compartimos tu información con nadie.</li>
          </ul>
        ),
      },
      {
        titulo: '3. Lo que se guarda en tu dispositivo',
        contenido: (
          <>
            <p>
              Para que puedas retomar tus prácticas y ver tu avance, Savia guarda alguna información en el almacenamiento local de tu
              navegador (localStorage). Si no tienes cuenta, esa información se queda en tu dispositivo y solo tú puedes verla.
              El detalle está en{' '}
              <a className="enlace" href="#/cookies" onClick={(e) => abrirLegal(e, '#/cookies')}>
                Cookies y almacenamiento
              </a>
              .
            </p>
          </>
        ),
      },
      {
        titulo: '4. Si creas una cuenta (opcional)',
        contenido: (
          <>
            <p>
              Puedes entrar con Google o con tu correo y una contraseña para guardar tu progreso en la nube. En ese caso guardamos:
            </p>
            <ul>
              <li>Tu correo y tu nombre (y tu foto de perfil, si entras con Google), para identificar tu cuenta.</li>
              <li>
                Tu progreso: intentos y respuestas, avance por tema, repaso, preguntas guardadas, y pregunta del día. Tus
                preferencias de accesibilidad se quedan solo en cada dispositivo.
              </li>
            </ul>
            <p>
              Las cuentas y el progreso se guardan en Firebase, un servicio de Google que actúa como proveedor del proyecto; Google
              trata esos datos según sus{' '}
              <a className="enlace" href="https://firebase.google.com/support/privacy" target="_blank" rel="noopener noreferrer">
                condiciones de privacidad de Firebase
              </a>
              . Las contraseñas no las vemos nunca. Cada cuenta solo puede leer su propio progreso, y solo lo usamos para mostrártelo
              en Savia: no lo analizamos, no lo compartimos ni lo usamos para publicidad.
            </p>
            <p>
              Al cerrar sesión, tu progreso se borra del dispositivo y queda solo en tu cuenta. Puedes borrar tu cuenta y todo lo
              guardado en ella desde “Tu cuenta” → “Borrar mi cuenta”.
            </p>
          </>
        ),
      },
      {
        titulo: '5. Alojamiento del sitio',
        contenido: (
          <p>
            Savia se publica en Cloudflare Pages. Como cualquier servidor web, el proveedor puede registrar datos técnicos de las
            visitas (por ejemplo, la dirección IP, el tipo de navegador y la fecha) para entregar el sitio y protegerlo de ataques.
            El proyecto no usa esos registros para identificarte. Puedes consultar cómo los trata Cloudflare en su{' '}
            <a className="enlace" href="https://www.cloudflare.com/privacypolicy/" target="_blank" rel="noopener noreferrer">
              política de privacidad
            </a>
            .
          </p>
        ),
      },
      {
        titulo: '6. Lector de voz',
        contenido: (
          <p>
            El lector de voz del panel de accesibilidad usa las voces de tu navegador o de tu sistema. Savia no envía el texto a
            ningún servidor, pero algunos navegadores ofrecen voces “en línea” que procesan el texto en los servidores de su
            fabricante. Si prefieres evitarlo, no uses el lector o elige una voz local en la configuración de tu sistema.
          </p>
        ),
      },
      {
        titulo: '7. Si nos escribes',
        contenido: (
          <p>
            Si nos escribes al correo de soporte, usaremos tu dirección de correo solo para responderte y no la
            compartiremos con nadie.
          </p>
        ),
      },
      {
        titulo: '8. Tus derechos y cómo borrar tus datos',
        contenido: (
          <>
            <p>
              Tú decides sobre tus datos: puedes verlos en Savia, borrarlos o dejar de usarla
              cuando quieras.
            </p>
            <ul>
              <li>Si tienes cuenta, usa “Borrar cuenta” en Mi perfil: se borran la cuenta y todo tu progreso guardado en ella.</li>
              <li>Para borrar tus intentos, usa “Borrar historial” en Practicar.</li>
              <li>
                Para borrar todo, elimina los datos del sitio en la configuración de tu navegador o desinstala la app de tu
                dispositivo.
              </li>
            </ul>
            <p>
              Si tienes dudas sobre el tratamiento de datos personales, puedes escribirnos a {correo} o acudir a la Agencia de
              Protección de Datos de los Habitantes (PRODHAB).
            </p>
          </>
        ),
      },
      {
        titulo: '9. Personas menores de edad',
        contenido: (
          <p>
            Savia puede usarse sin cuenta y sin entregar ningún dato personal. Si eres menor de edad, crea una cuenta solo con el
            permiso de tu madre, padre o persona encargada; quien te represente puede pedirnos en cualquier momento que borremos tu
            cuenta escribiendo a {correo}.
          </p>
        ),
      },
      {
        titulo: '10. Cambios a esta política',
        contenido: (
          <p>
            Si Savia empieza a tratar datos de otra forma, actualizaremos esta política antes del cambio y lo avisaremos en el
            sitio. La fecha de la versión vigente aparece al inicio de esta página.
          </p>
        ),
      },
    ],
  },
  cookies: {
    titulo: 'Cookies y almacenamiento',
    resumen: (
      <>
        Savia no usa cookies ni rastreo. Solo guarda en tu navegador lo necesario para que funcionen las prácticas y tu progreso.
      </>
    ),
    bloques: [
      {
        titulo: '1. Cookies',
        contenido: (
          <p>
            Savia no crea cookies propias ni carga cookies de terceros (como las de publicidad, redes sociales o analíticas). Por eso
            no te pedimos aceptar cookies al entrar.
          </p>
        ),
      },
      {
        titulo: '2. Almacenamiento local',
        contenido: (
          <>
            <p>
              En lugar de cookies, Savia usa el almacenamiento local del navegador (localStorage). Sin cuenta, estos datos no salen
              de tu dispositivo; con cuenta, tu progreso también se guarda en ella (ver la política de privacidad). Solo sirven para
              las funciones que usas:
            </p>
            <div className="legal__tabla">
              <table>
                <thead>
                  <tr>
                    <th scope="col">Nombre</th>
                    <th scope="col">Para qué sirve</th>
                  </tr>
                </thead>
                <tbody>
                  {DATOS_LOCALES.map(([clave, uso]) => (
                    <tr key={clave}>
                      <td>
                        <code>{clave}</code>
                      </td>
                      <td>{uso}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p>Se guardan hasta que los borres; no caducan solos.</p>
          </>
        ),
      },
      {
        titulo: '3. Alojamiento',
        contenido: (
          <p>
            El proveedor de alojamiento (Cloudflare) podría usar, solo en casos de seguridad como la protección contra ataques,
            cookies técnicas propias. Savia no las lee ni las usa.
          </p>
        ),
      },
      {
        titulo: '4. Cómo borrarlo',
        contenido: (
          <ul>
            <li>Tus intentos: “Borrar historial” en Practicar.</li>
            <li>Tus preferencias de accesibilidad: “Restablecer” en el panel de accesibilidad.</li>
            <li>
              Todo: en tu navegador, abre la configuración del sitio y elige “Borrar datos” (o “Eliminar datos de sitios”); si
              instalaste la app, desinstálala.
            </li>
          </ul>
        ),
      },
    ],
  },
  licencias: {
    titulo: 'Licencias y créditos',
    resumen: <>Savia se construyó con fuentes y bibliotecas de código abierto. Estas son sus licencias.</>,
    bloques: [
      {
        titulo: '1. Contenido de Savia',
        contenido: (
          <p>
            Las preguntas, las explicaciones, los textos, las ilustraciones, el nombre y el logo de Savia fueron creados para el{' '}
            {PROYECTO.codigo} de la {PROYECTO.universidad}. Puedes usarlos para estudiar y compartirlos sin fines de lucro, como se
            explica en los{' '}
            <a className="enlace" href="#/terminos" onClick={(e) => abrirLegal(e, '#/terminos')}>
              Términos de uso
            </a>
            .
          </p>
        ),
      },
      {
        titulo: '2. Software y fuentes de terceros',
        contenido: (
          <div className="legal__tabla">
            <table>
              <thead>
                <tr>
                  <th scope="col">Componente</th>
                  <th scope="col">Uso en Savia</th>
                  <th scope="col">Licencia</th>
                </tr>
              </thead>
              <tbody>
                {LICENCIAS.map(([nombre, uso, licencia]) => (
                  <tr key={nombre}>
                    <td>{nombre}</td>
                    <td>{uso}</td>
                    <td>{licencia}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ),
      },
      {
        titulo: '3. Marcas',
        contenido: (
          <p>
            Los nombres del Ministerio de Educación Pública, de la prueba EDAD II, del IMAS y de otras instituciones se mencionan solo
            para describir a quién va dirigido el material. Savia no tiene relación oficial con esas instituciones ni cuenta con su
            respaldo.
          </p>
        ),
      },
    ],
  },
}

export function Legal({ documento }: { documento: RutaLegal }) {
  const doc = DOCUMENTOS[documento]
  const nav = useCarrusel<HTMLElement>(documento)

  return (
    <main className="contenedor pagina legal">
      <BotonRegresar className="proyecto-pagina__regresar" onClick={regresar} />

      <nav ref={nav} className="legal__nav" aria-label="Documentos legales">
        {RUTAS_LEGALES.map((r) => (
          <a
            key={r.id}
            href={r.href}
            className={`filtro ${r.id === documento ? 'is-activo' : ''}`}
            aria-current={r.id === documento ? 'page' : undefined}
            onClick={(e) => abrirLegal(e, r.href)}
          >
            {r.nombre}
          </a>
        ))}
      </nav>

      <header className="legal__cabecera">
        <Cinta className="seccion__kicker">Savia · Información legal</Cinta>
        <h1 className="pagina__titulo">{doc.titulo}</h1>
        <p className="legal__vigencia">Vigente desde el {VIGENCIA}</p>
        <p className="legal__resumen">{doc.resumen}</p>
      </header>

      <article className="legal__texto">
        {doc.bloques.map((b) => (
          <section key={b.titulo} className="legal__bloque">
            <h2>{b.titulo}</h2>
            {b.contenido}
          </section>
        ))}
      </article>
    </main>
  )
}
