/// <reference types="vite/client" />

declare module 'virtual:resumen-temas' {
  import type { TemaCodigo } from './lib/banco'

  // Calculado al compilar desde src/data/preguntas.json (ver vite.config.ts).
  const resumen: Record<TemaCodigo, { preguntas: number; subtemas: { nombre: string; total: number }[] }>
  export default resumen
}
