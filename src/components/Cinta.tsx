import type { ElementType, ReactNode } from 'react'

interface CintaProps {
  // etiqueta HTML (p por defecto; span o div donde haga falta)
  as?: ElementType
  className?: string
  // sin texto es solo un trozo de cinta que sujeta algo
  children?: ReactNode
  [atributo: string]: unknown
}

// Cinta adhesiva escrita a mano de Savia (estilo .cinta en 12-encabezado.css): la de las
// etiquetas de sección ("Pregunta del día", "En papel"…), la del encabezado y las notas
// de la hoja. Cada uso agrega su clase para el tamaño y la posición.
export function Cinta({ as: Etiqueta = 'p', className = '', children, ...resto }: CintaProps) {
  return (
    <Etiqueta className={`cinta ${className}`.trim()} {...resto}>
      {children}
    </Etiqueta>
  )
}
