import { useRef, useState } from 'react'
import { DownloadIcon, SmartphoneIcon, UploadIcon } from '@animateicons/react/lucide'
import { instalar, useInstalable } from '../lib/pwa'
import { descargarRespaldo, leerRespaldo, restaurarRespaldo, resumirRespaldo } from '../lib/respaldo'
import { useIconosAnimados } from '../lib/useIconosAnimados'
import { useConfirmacion } from './Confirmacion'

const plural = (n: number, uno: string, varios: string) => `${n} ${n === 1 ? uno : varios}`
const fechaLarga = (ms: number) => new Date(ms).toLocaleDateString('es-CR', { day: 'numeric', month: 'long', year: 'numeric' })

function enPantallaDeInicio() {
  return window.matchMedia?.('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true
}
const esIOS = () => /iPhone|iPad|iPod/.test(navigator.userAgent)

// El progreso vive solo en este navegador. Esta sección deja descargarlo y restaurarlo, e
// invita a instalar Savia: instalada, Safari en iPhone ya no borra sus datos por no usarla.
export function RespaldoProgreso() {
  const animarIconos = useIconosAnimados()
  const instalable = useInstalable()
  const [confirmar, dialogo] = useConfirmacion()
  const archivo = useRef<HTMLInputElement>(null)
  const [estado, setEstado] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null)
  const instalada = enPantallaDeInicio()

  const descargar = () => {
    const r = descargarRespaldo()
    setEstado({
      tipo: 'ok',
      texto: `Listo: el respaldo trae ${plural(r.intentos, 'intento', 'intentos')}, ${plural(r.preguntasVistas, 'pregunta respondida', 'preguntas respondidas')} y ${plural(r.guardadas, 'guardada', 'guardadas')}. Guárdalo en tu correo o en la nube.`,
    })
  }

  const restaurar = async (lista: FileList | null) => {
    const elegido = lista?.[0]
    if (archivo.current) archivo.current.value = ''
    if (!elegido) return
    try {
      const respaldo = leerRespaldo(await elegido.text())
      const r = resumirRespaldo(respaldo)
      const aceptado = await confirmar({
        titulo: '¿Restaurar este respaldo?',
        mensaje: `Es del ${fechaLarga(r.fecha)} y trae ${plural(r.intentos, 'intento', 'intentos')}, ${plural(r.preguntasVistas, 'pregunta respondida', 'preguntas respondidas')} y ${plural(r.guardadas, 'guardada', 'guardadas')}. Va a reemplazar el progreso que tienes ahora en este dispositivo.`,
        confirmar: 'Restaurar',
        peligro: true,
      })
      if (!aceptado) return
      restaurarRespaldo(respaldo)
      window.location.reload()
    } catch (error: unknown) {
      setEstado({ tipo: 'error', texto: error instanceof Error ? error.message : 'No se pudo leer el respaldo.' })
    }
  }

  return (
    <section className="respaldo" aria-labelledby="respaldo-titulo">
      {dialogo}
      <h2 id="respaldo-titulo" className="practica__subtitulo">
        Tu progreso en este dispositivo
      </h2>
      <p className="pagina__texto respaldo__intro">
        Savia guarda tu avance solo en este navegador. Si cambias de teléfono o se borran los datos del navegador, se pierde: descarga un
        respaldo de vez en cuando.
      </p>

      <div className="progreso__accesos">
        <article className="acceso">
          <span className="acceso__icono" aria-hidden="true">
            <DownloadIcon size={22} isAnimated={animarIconos} aria-hidden="true" />
          </span>
          <h3 className="acceso__titulo">Respaldo</h3>
          <p className="acceso__texto">Un archivo con tus intentos, tu repaso, tus guardadas y tus ajustes. Puedes restaurarlo aquí o en otro dispositivo.</p>
          <div className="respaldo__acciones">
            <button type="button" className="boton boton--tinta" onClick={descargar}>
              <DownloadIcon size={18} isAnimated={animarIconos} aria-hidden="true" /> Descargar respaldo
            </button>
            <button type="button" className="boton" onClick={() => archivo.current?.click()}>
              <UploadIcon size={18} isAnimated={animarIconos} aria-hidden="true" /> Restaurar respaldo
            </button>
            <input
              ref={archivo}
              type="file"
              accept="application/json,.json"
              className="sr-only"
              tabIndex={-1}
              aria-hidden="true"
              onChange={(e) => void restaurar(e.target.files)}
            />
          </div>
          {estado && (
            <p className={`respaldo__estado ${estado.tipo === 'error' ? 'is-error' : ''}`} role={estado.tipo === 'error' ? 'alert' : 'status'}>
              {estado.texto}
            </p>
          )}
        </article>

        <article className="acceso">
          <span className="acceso__icono" aria-hidden="true">
            <SmartphoneIcon size={22} isAnimated={animarIconos} aria-hidden="true" />
          </span>
          <h3 className="acceso__titulo">Instala Savia</h3>
          {instalada ? (
            <p className="acceso__texto">Savia ya está instalada en este dispositivo. Ábrela desde su ícono para no perder tu avance.</p>
          ) : instalable ? (
            <>
              <p className="acceso__texto">Ábrela como una app desde tu pantalla de inicio. Así es más rápido volver a practicar y tu avance queda más protegido.</p>
              <button type="button" className="boton" onClick={() => void instalar()}>
                <SmartphoneIcon size={18} isAnimated={animarIconos} aria-hidden="true" /> Instalar Savia
              </button>
            </>
          ) : esIOS() ? (
            <p className="acceso__texto">
              En iPhone, Safari borra los datos de los sitios que no abres en una semana. Para evitarlo, toca «Compartir» y luego «Agregar a
              inicio».
            </p>
          ) : (
            <p className="acceso__texto">
              Desde el menú de tu navegador puedes instalarla o agregarla a la pantalla de inicio para abrirla como una app.
            </p>
          )}
        </article>
      </div>
    </section>
  )
}
