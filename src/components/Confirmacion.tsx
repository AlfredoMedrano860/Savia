import { useCallback, useEffect, useRef, useState } from 'react'

export interface OpcionesConfirmacion {
  titulo: string
  mensaje: string
  confirmar: string
  cancelar?: string
  // acción que borra o descarta algo: el botón de confirmar se pinta de rojo
  peligro?: boolean
}

interface Pendiente extends OpcionesConfirmacion {
  responder: (aceptado: boolean) => void
}

// Diálogo de confirmación con el estilo de Savia (el mismo del "¿Entregar la prueba?"), en
// lugar de la ventana del navegador. Uso:
//   const [confirmar, dialogo] = useConfirmacion()
//   if (!(await confirmar({ titulo, mensaje, confirmar: 'Borrar' }))) return
//   … y renderizar {dialogo} en algún lugar del componente.
export function useConfirmacion() {
  const [pendiente, setPendiente] = useState<Pendiente | null>(null)
  const dialogo = useRef<HTMLDialogElement>(null)
  const botonCancelar = useRef<HTMLButtonElement>(null)

  const confirmar = useCallback(
    (opciones: OpcionesConfirmacion) =>
      new Promise<boolean>((resolver) => {
        setPendiente({ ...opciones, responder: resolver })
      }),
    [],
  )

  useEffect(() => {
    const d = dialogo.current
    if (!d) return
    if (pendiente && !d.open) {
      d.showModal()
      // el foco empieza en "Cancelar": confirmar por accidente con Enter no descarta nada
      botonCancelar.current?.focus()
    }
    if (!pendiente && d.open) d.close()
  }, [pendiente])

  const responder = (aceptado: boolean) => {
    pendiente?.responder(aceptado)
    setPendiente(null)
  }

  const elemento = (
    <dialog
      ref={dialogo}
      className="dialogo"
      aria-labelledby="confirmacion-titulo"
      aria-describedby="confirmacion-mensaje"
      onCancel={(e) => {
        e.preventDefault()
        responder(false)
      }}
      onClick={(e) => {
        // clic en el fondo oscuro (fuera de la caja) = cancelar
        const caja = e.currentTarget.getBoundingClientRect()
        const fuera = e.clientX < caja.left || e.clientX > caja.right || e.clientY < caja.top || e.clientY > caja.bottom
        if (e.target === e.currentTarget && fuera) responder(false)
      }}
    >
      {pendiente && (
        <>
          <h2 id="confirmacion-titulo">{pendiente.titulo}</h2>
          <p id="confirmacion-mensaje">{pendiente.mensaje}</p>
          <div className="dialogo__acciones">
            <button ref={botonCancelar} type="button" className="boton-discreto" onClick={() => responder(false)}>
              {pendiente.cancelar ?? 'Cancelar'}
            </button>
            <button type="button" className={`boton ${pendiente.peligro ? 'boton--peligro' : 'boton--tinta'}`} onClick={() => responder(true)}>
              {pendiente.confirmar}
            </button>
          </div>
        </>
      )}
    </dialog>
  )

  return [confirmar, elemento] as const
}
