/// <reference types="vite/client" />

// Configuración pública de Firebase (ver .env.example). Si faltan, Savia funciona sin cuentas.
interface ImportMetaEnv {
  readonly VITE_FIREBASE_API_KEY?: string
  readonly VITE_FIREBASE_AUTH_DOMAIN?: string
  readonly VITE_FIREBASE_PROJECT_ID?: string
  readonly VITE_FIREBASE_APP_ID?: string
}

declare module 'virtual:resumen-temas' {
  import type { TemaCodigo } from './lib/banco'

  // Calculado al compilar desde src/data/preguntas.json (ver vite.config.ts).
  const resumen: Record<TemaCodigo, { preguntas: number; subtemas: { nombre: string; total: number }[] }>
  export default resumen
}
