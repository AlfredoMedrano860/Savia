import type { ElementType, ReactNode } from 'react'

interface MarcoDobleProps {
  // etiqueta HTML (div por defecto; a o button cuando la tarjeta es clicable)
  as?: ElementType
  // con hover celeste y anillo de foco, para tarjetas clicables
  interactivo?: boolean
  className?: string
  children: ReactNode
  [atributo: string]: unknown
}

// Papel con borde fino y un segundo marco por dentro, como una lámina impresa (estilo
// .marco-doble en 14-laminas.css). Lo usan las láminas de temas, las fichas de práctica y
// la etiqueta de herbario; cada uso agrega su clase para el relleno y el contenido.
export function MarcoDoble({ as: Etiqueta = 'div', interactivo = false, className = '', children, ...resto }: MarcoDobleProps) {
  const clase = `marco-doble ${interactivo ? 'marco-doble--interactivo ' : ''}${className}`.trim()
  return (
    <Etiqueta className={clase} {...resto}>
      {children}
    </Etiqueta>
  )
}
