import { useCallback, useEffect, useRef, useState } from 'react'
import { useConfirmacion } from './components/Confirmacion'
import { Examen } from './components/Examen'
import { Imprimible } from './components/Imprimible'
import { RespuestasImpresa } from './components/RespuestasImpresa'
import { Marco } from './components/Marco'
import { Notificaciones, type Notificacion } from './components/Notificaciones'
import { Resultados } from './components/Resultados'
import { agregarAlHistorial, borrarHistorial, cargarHistorial, cargarPrueba, guardarPrueba } from './lib/almacen'
import { registrarResultado } from './lib/aprendizaje'
import { calificar, nuevaPrueba, nuevoCodigo, pruebaDeRepaso, pruebaDeTema, pruebaImprimible, type Prueba, type Resultado } from './lib/banco'
import { esRutaLegal, irA, RUTAS, RUTAS_LEGALES, useRuta } from './lib/ruta'
import { Portada } from './pages/Portada'
import { MiProgreso } from './pages/MiProgreso'
import { Practicar } from './pages/Practicar'
import { Legal } from './pages/Legal'
import { Proyecto } from './pages/Proyecto'
import { Temario } from './pages/Temario'

type Vista = { tipo: 'sitio' } | { tipo: 'examen' } | { tipo: 'resultado'; resultado: Resultado } | { tipo: 'imprimir'; prueba: Prueba; codigo: string; soloRespuestas: boolean }

function estadoInicial(): { prueba: Prueba | null; vista: Vista } {
  return { prueba: cargarPrueba(), vista: { tipo: 'sitio' } }
}

export default function App() {
  const ruta = useRuta()
  const [{ prueba: inicial, vista: vistaInicial }] = useState(estadoInicial)
  const [prueba, setPrueba] = useState<Prueba | null>(inicial)
  const [vista, setVista] = useState<Vista>(vistaInicial)
  const [historial, setHistorial] = useState(cargarHistorial)
  const [ocupado, setOcupado] = useState(false)
  const [errorOperacion, setErrorOperacion] = useState('')
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([])
  const idNotificacion = useRef(0)
  const entregando = useRef(false)
  const [confirmar, dialogoConfirmacion] = useConfirmacion()

  const notificar = useCallback((tipo: Notificacion['tipo'], titulo: string, mensaje: string) => {
    const id = ++idNotificacion.current
    setNotificaciones((actuales) => [{ id, tipo, titulo, mensaje }, ...actuales].slice(0, 3))
  }, [])

  const cerrarNotificacion = useCallback((id: number) => {
    setNotificaciones((actuales) => actuales.filter((notificacion) => notificacion.id !== id))
  }, [])

  const avisos = (
    <>
      <Notificaciones notificaciones={notificaciones} onCerrar={cerrarNotificacion} />
      {dialogoConfirmacion}
    </>
  )

  useEffect(() => {
    guardarPrueba(prueba)
  }, [prueba])

  // Una prueba guardada cuyo tiempo venció mientras no estabas: se califica en segundo
  // plano y queda en el historial, sin sacarte de la página en la que entraste. (Si el
  // tiempo se acaba durante el examen, Examen la entrega y muestra los resultados.)
  useEffect(() => {
    if (!prueba || Date.now() < prueba.limite || entregando.current) return
    let vigente = true
    entregando.current = true
    void calificar(prueba)
      .then((resultado) => {
        if (!vigente) return
        agregarAlHistorial(resultado)
        void registrarResultado(resultado)
        setHistorial(cargarHistorial())
        setPrueba(null)
        notificar(
          'info',
          'Se acabó el tiempo de tu práctica',
          `${resultado.nombre} se calificó con lo que alcanzaste a responder. Puedes revisarla en Practicar.`,
        )
      })
      .catch((error: unknown) => {
        console.error('No se pudo calificar la prueba guardada.', error)
        if (!vigente) return
        setPrueba(null)
        guardarPrueba(null)
        setErrorOperacion('No se pudo calificar la prueba guardada. Puedes iniciar una prueba nueva.')
      })
      .finally(() => {
        entregando.current = false
      })
    return () => {
      vigente = false
      entregando.current = false
    }
  }, [prueba, notificar])

  // Al navegar por el menú se sale de la pantalla de resultados.
  const rutaAnterior = useRef(ruta)
  useEffect(() => {
    if (rutaAnterior.current === ruta) return
    rutaAnterior.current = ruta
    setVista((v) => (v.tipo === 'resultado' || v.tipo === 'imprimir' ? { tipo: 'sitio' } : v))
  }, [ruta])

  useEffect(() => {
    const pagina = [...RUTAS, ...RUTAS_LEGALES].find((r) => r.id === ruta)?.nombre
    const titulo =
      vista.tipo === 'examen' && prueba
        ? `${prueba.nombre} · Savia`
        : vista.tipo === 'resultado'
          ? 'Resultados · Savia'
          : vista.tipo === 'imprimir'
            ? vista.soloRespuestas
              ? 'Respuestas de tu prueba · Savia'
              : 'Prueba para imprimir · Savia'
          : ruta === 'inicio'
            ? 'Savia · Biología para EDAD II'
            : `${pagina} · Savia`
    const descripciones: Record<typeof ruta, string> = {
      inicio: 'Prepárate para la prueba EDAD II de Biología con 1 000 preguntas explicadas, prácticas gratuitas y recursos para estudiar a tu ritmo.',
      practicar: 'Elige una práctica corta, un quiz o una prueba completa para EDAD II. Tus intentos se guardan en este dispositivo.',
      progreso: 'Tu pregunta del día, el repaso de lo que fallaste y tu avance en cada tema de Biología para EDAD II.',
      temario: 'Explora los seis temas de Biología de EDAD II, revisa sus subtemas y practica cada área con preguntas gratuitas.',
      proyecto: 'Conoce Savia, una herramienta gratuita de apoyo educativo creada como parte de un proyecto comunitario de la Universidad de Costa Rica.',
      terminos: 'Condiciones para usar Savia, la práctica gratuita de Biología para EDAD II.',
      privacidad: 'Savia no pide cuentas ni datos personales: tu progreso se guarda solo en tu dispositivo.',
      cookies: 'Savia no usa cookies ni rastreo. Qué guarda en tu navegador y cómo borrarlo.',
      licencias: 'Fuentes, íconos y bibliotecas de código abierto que usa Savia y sus licencias.',
    }
    const descripcion =
      vista.tipo === 'examen'
        ? 'Responde preguntas de Biología para tu práctica EDAD II. Tu progreso se guarda localmente en este dispositivo.'
        : vista.tipo === 'resultado'
          ? 'Revisa tu resultado de práctica EDAD II de Biología y aprende de las respuestas explicadas.'
          : descripciones[ruta]
    document.title = titulo
    document.querySelector('meta[name="description"]')?.setAttribute('content', descripcion)
    document.querySelector('meta[property="og:title"]')?.setAttribute('content', titulo)
    document.querySelector('meta[property="og:description"]')?.setAttribute('content', descripcion)
    document.querySelector('link[rel="canonical"]')?.setAttribute('href', `${window.location.origin}${window.location.pathname}`)
  }, [vista, prueba, ruta])

  // Mientras hay una prueba en curso, avisar antes de cerrar la pestaña.
  useEffect(() => {
    if (vista.tipo !== 'examen') return
    const onSalir = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener('beforeunload', onSalir)
    return () => window.removeEventListener('beforeunload', onSalir)
  }, [vista.tipo])

  const empezar = async (crear: () => Prueba | Promise<Prueba>) => {
    if (
      prueba &&
      !(await confirmar({
        titulo: 'Tienes una prueba sin terminar',
        mensaje: `Si empiezas otra, se descarta ${prueba.nombre} con lo que llevas respondido.`,
        confirmar: 'Descartar y empezar',
        cancelar: 'Mantener la que tengo',
        peligro: true,
      }))
    )
      return
    setErrorOperacion('')
    setOcupado(true)
    try {
      const nueva = await crear()
      setPrueba(nueva)
      setVista({ tipo: 'examen' })
      notificar('success', 'Práctica lista', `${nueva.nombre} ya está en tu bitácora. ¡A estudiar!`)
      window.scrollTo({ top: 0 })
    } catch (error: unknown) {
      console.error('No se pudo preparar la prueba.', error)
      setErrorOperacion('No se pudo preparar la prueba. Revisa tu conexión e inténtalo de nuevo.')
    } finally {
      setOcupado(false)
    }
  }

  // Prueba para imprimir: sale de un código (la misma prueba para el mismo código) y no queda
  // como prueba en curso. Con un código ya usado, se vuelve a armar para ver sus respuestas.
  const abrirImprimible = async (codigo: string, soloRespuestas = false) => {
    setErrorOperacion('')
    try {
      const prueba = await pruebaImprimible(codigo)
      setVista({ tipo: 'imprimir', prueba, codigo, soloRespuestas })
      window.scrollTo({ top: 0 })
    } catch (error: unknown) {
      console.error('No se pudo preparar la prueba para imprimir.', error)
      setErrorOperacion('No se pudo preparar la prueba. Revisa tu conexión e inténtalo de nuevo.')
    }
  }

  const entregar = useCallback(() => {
    if (!prueba || entregando.current) return
    entregando.current = true
    setOcupado(true)
    void calificar(prueba)
      .then((resultado) => {
        agregarAlHistorial(resultado)
        void registrarResultado(resultado)
        setHistorial(cargarHistorial())
        setPrueba(null)
        setVista({ tipo: 'resultado', resultado })
        setErrorOperacion('')
        window.scrollTo({ top: 0 })
      })
      .catch((error: unknown) => {
        console.error('No se pudo calificar la prueba.', error)
        setErrorOperacion('No se pudo calificar la prueba. Recarga la página para volver a intentarlo.')
      })
      .finally(() => {
        setOcupado(false)
        entregando.current = false
      })
  }, [prueba])

  const borrarTodosLosIntentos = async () => {
    if (
      !(await confirmar({
        titulo: '¿Borrar tu historial?',
        mensaje: 'Se eliminarán todos tus intentos guardados en este dispositivo. Esta acción no se puede deshacer.',
        confirmar: 'Borrar historial',
        peligro: true,
      }))
    )
      return
    borrarHistorial()
    setHistorial([])
    notificar('info', 'Historial despejado', 'Tus intentos anteriores se eliminaron de este dispositivo.')
  }

  if (ocupado) {
    return (
      <>
        <Marco ruta={ruta}>
          <main className="contenedor pagina" aria-live="polite">
            <p className="pagina__texto">Preparando tu práctica…</p>
          </main>
        </Marco>
        {avisos}
      </>
    )
  }

  if (vista.tipo === 'examen' && prueba) {
    return (
      <>
        <Examen
          prueba={prueba}
          error={errorOperacion}
          onCambio={setPrueba}
          onEntregar={entregar}
          onSalir={() => {
            setVista({ tipo: 'sitio' })
            irA('practicar')
          }}
        />
        {avisos}
      </>
    )
  }

  if (vista.tipo === 'imprimir') {
    return (
      <>
        <Marco ruta={null}>
          {vista.soloRespuestas ? (
            <RespuestasImpresa
              prueba={vista.prueba}
              codigo={vista.codigo}
              onRegresar={() => {
                setVista({ tipo: 'sitio' })
                irA('practicar')
              }}
            />
          ) : (
            <Imprimible
              prueba={vista.prueba}
              codigo={vista.codigo}
              onRegresar={() => {
                setVista({ tipo: 'sitio' })
                irA('practicar')
              }}
            />
          )}
        </Marco>
        {avisos}
      </>
    )
  }

  if (vista.tipo === 'resultado') {
    return (
      <>
        <Marco ruta={null}>
          <Resultados
            resultado={vista.resultado}
            onInicio={() => {
              setVista({ tipo: 'sitio' })
              irA('practicar')
            }}
            onRepasar={(ids) => empezar(() => pruebaDeRepaso(ids))}
          />
        </Marco>
        {avisos}
      </>
    )
  }

  return (
    <>
      <Marco ruta={ruta}>
        {errorOperacion && (
          <p className="contenedor error-carga" role="alert">
            {errorOperacion}
          </p>
        )}
        {ruta === 'inicio' && <Portada />}
        {esRutaLegal(ruta) && <Legal documento={ruta} />}
        {ruta === 'practicar' && (
          <Practicar
            enCurso={prueba}
            historial={historial}
            onEmpezar={(modo) => empezar(() => nuevaPrueba(modo))}
            onContinuar={() => {
              setVista({ tipo: 'examen' })
              notificar('info', 'Retomamos la práctica', 'Tu avance sigue guardado en este dispositivo.')
            }}
            onVerIntento={(resultado) => {
              setVista({ tipo: 'resultado', resultado })
              window.scrollTo({ top: 0 })
            }}
            onBorrarHistorial={borrarTodosLosIntentos}
            onImprimir={(modo) => abrirImprimible(nuevoCodigo(modo))}
            onAbrirCodigo={(codigo) => abrirImprimible(codigo, true)}
          />
        )}
        {ruta === 'progreso' && (
          <MiProgreso
            onRepasar={(ids) => empezar(() => pruebaDeRepaso(ids, 'Repaso del día'))}
            onGuardadas={(ids) => empezar(() => pruebaDeRepaso(ids, 'Mis preguntas guardadas'))}
            onPracticarTema={(t) => empezar(() => pruebaDeTema(t))}
          />
        )}
        {ruta === 'temario' && <Temario onPracticarTema={(t) => empezar(() => pruebaDeTema(t))} />}
        {ruta === 'proyecto' && <Proyecto />}
      </Marco>
      {avisos}
    </>
  )
}
