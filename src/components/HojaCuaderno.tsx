import type { ElementType, ReactNode } from 'react'

interface HojaCuadernoProps {
  // etiqueta HTML de la hoja (div, section, article, li…)
  as?: ElementType
  // "solo-papel": solo el papel (agujeros, margen y renglones), sin borde ni sombra, para
  // cuando la hoja va dentro de otra tarjeta que ya los tiene.
  variante?: 'normal' | 'solo-papel'
  className?: string
  children: ReactNode
  [atributo: string]: unknown
}

// Hoja de cuaderno de Savia: el mismo papel en toda la app (estilo en 01-base.css,
// clase .hoja-cuaderno). Cada uso solo agrega su propia clase para el relleno y el
// contenido; el papel no se vuelve a dibujar en el CSS de cada componente.
export function HojaCuaderno({ as: Etiqueta = 'div', variante = 'normal', className = '', children, ...resto }: HojaCuadernoProps) {
  const clase = variante === 'solo-papel' ? 'hoja-cuaderno--solo-papel' : 'hoja-cuaderno'
  return (
    <Etiqueta className={`${clase} ${className}`.trim()} {...resto}>
      {children}
    </Etiqueta>
  )
}
