import { useSyncExternalStore } from 'react'
import type { Auth, User } from 'firebase/auth'
import type { Firestore } from 'firebase/firestore/lite'
import { alCambiarProgreso } from './cambios'
import { combinarRespaldos, mismoProgreso } from './combinar'
import { borrarProgresoLocal, crearRespaldo, leerRespaldo, restaurarRespaldo, type Respaldo } from './respaldo'

/*
 * Cuenta de Savia con Firebase (opcional). Sin sesión, Savia funciona igual que siempre: todo
 * queda en este navegador. Con sesión, el progreso se guarda además en Firestore, en el
 * documento usuarios/{uid}, y se sincroniza entre dispositivos:
 *  - al entrar (y cada vez que se abre Savia con la sesión iniciada) se combina el progreso de
 *    este dispositivo con el de la cuenta, sin perder nada (lib/combinar.ts);
 *  - cada vez que cambia el progreso se sube, unos segundos después, combinado con lo que haya
 *    en la nube, para no pisar lo que se hizo en otro dispositivo.
 * Firebase solo se descarga cuando alguien inicia sesión o ya tenía una sesión abierta.
 */

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

/** Si el proyecto tiene Firebase configurado (variables VITE_FIREBASE_* en .env.local). */
export const cuentasDisponibles = Boolean(config.apiKey && config.authDomain && config.projectId && config.appId)

// Marca de que hay una sesión abierta, para cargar Firebase al abrir Savia solo si hace falta.
const CLAVE_SESION = 'savia:sesion'
const ESPERA_SUBIDA_MS = 3000
const VERSION_DOCUMENTO = 1

export interface Usuario {
  uid: string
  nombre: string
  correo: string
  foto: string | null
  conGoogle: boolean
  // fecha de creación de la cuenta (ms), si Firebase la informa
  creada: number | null
}

export interface EstadoCuenta {
  // apagado: sin Firebase configurado · cargando: revisando la sesión · fuera / dentro
  estado: 'apagado' | 'cargando' | 'fuera' | 'dentro'
  usuario: Usuario | null
  sincronizando: boolean
  // momento de la última sincronización correcta con la nube
  sincronizado: number | null
  error: string | null
}

let estado: EstadoCuenta = {
  estado: cuentasDisponibles ? 'fuera' : 'apagado',
  usuario: null,
  sincronizando: false,
  sincronizado: null,
  error: null,
}
const oyentes = new Set<() => void>()
function cambiar(parcial: Partial<EstadoCuenta>) {
  estado = { ...estado, ...parcial }
  oyentes.forEach((o) => o())
}

/** Estado de la cuenta para los componentes. */
export function useCuenta() {
  return useSyncExternalStore(
    (o) => {
      oyentes.add(o)
      return () => oyentes.delete(o)
    },
    () => estado,
  )
}

// ---------- Firebase (carga diferida) ----------

interface Servicios {
  auth: Auth
  db: Firestore
  a: typeof import('firebase/auth')
  f: typeof import('firebase/firestore/lite')
}
let servicios: Promise<Servicios> | null = null

function cargarFirebase(): Promise<Servicios> {
  servicios ??= (async () => {
    const [{ initializeApp }, a, f] = await Promise.all([import('firebase/app'), import('firebase/auth'), import('firebase/firestore/lite')])
    const app = initializeApp(config)
    const auth = a.getAuth(app)
    auth.languageCode = 'es'
    const db = f.getFirestore(app)
    a.onAuthStateChanged(auth, (usuario) => void alCambiarUsuario(usuario))
    return { auth, db, a, f }
  })()
  return servicios
}

function datosDe(u: User): Usuario {
  return {
    uid: u.uid,
    nombre: u.displayName || u.email?.split('@')[0] || 'Estudiante',
    correo: u.email ?? '',
    foto: u.photoURL,
    conGoogle: u.providerData.some((p) => p.providerId === 'google.com'),
    creada: u.metadata.creationTime ? Date.parse(u.metadata.creationTime) : null,
  }
}

async function alCambiarUsuario(u: User | null) {
  if (!u) {
    sacarMarcaDeSesion()
    cambiar({ estado: 'fuera', usuario: null, sincronizado: null, sincronizando: false })
    return
  }
  ponerMarcaDeSesion()
  cambiar({ estado: 'dentro', usuario: datosDe(u), error: null })
  await sincronizarAlEntrar(u.uid)
}

function ponerMarcaDeSesion() {
  try {
    localStorage.setItem(CLAVE_SESION, '1')
  } catch {
    // sin almacenamiento: la sesión igual se recupera al entrar de nuevo
  }
}
function sacarMarcaDeSesion() {
  try {
    localStorage.removeItem(CLAVE_SESION)
  } catch {
    // nada que quitar
  }
}

/** Al abrir Savia: si había una sesión, carga Firebase para recuperarla y sincronizar. */
export function iniciarCuenta() {
  if (!cuentasDisponibles) return
  alCambiarProgreso(programarSubida)
  window.addEventListener('pagehide', subirSiQuedaPendiente)
  let habiaSesion = false
  try {
    habiaSesion = localStorage.getItem(CLAVE_SESION) === '1'
  } catch {
    habiaSesion = false
  }
  if (habiaSesion) {
    cambiar({ estado: 'cargando' })
    cargarFirebase().catch((error: unknown) => {
      console.error('No se pudo cargar Firebase.', error)
      cambiar({ estado: 'fuera', error: 'No se pudo conectar con tu cuenta. Tu progreso sigue guardado en este dispositivo.' })
    })
  }
}

// ---------- sincronización ----------

const progresoLocal = () => leerRespaldo(JSON.stringify(crearRespaldo()))

async function leerNube(s: Servicios, uid: string): Promise<Respaldo | null> {
  const instantanea = await s.f.getDoc(s.f.doc(s.db, 'usuarios', uid))
  if (!instantanea.exists()) return null
  const progreso: unknown = instantanea.data().progreso
  if (typeof progreso !== 'string') return null
  try {
    return leerRespaldo(progreso)
  } catch (error: unknown) {
    console.warn('El progreso guardado en la cuenta no es válido; se reemplaza por el de este dispositivo.', error)
    return null
  }
}

async function escribirNube(s: Servicios, uid: string, respaldo: Respaldo) {
  await s.f.setDoc(s.f.doc(s.db, 'usuarios', uid), {
    progreso: JSON.stringify(respaldo),
    actualizado: s.f.serverTimestamp(),
    version: VERSION_DOCUMENTO,
  })
}

async function sincronizarAlEntrar(uid: string) {
  cambiar({ sincronizando: true, error: null })
  try {
    const s = await cargarFirebase()
    const local = progresoLocal()
    const nube = await leerNube(s, uid)
    const combinado = nube ? combinarRespaldos(local, nube) : local
    if (!nube || !mismoProgreso(combinado, nube)) await escribirNube(s, uid, combinado)
    cambiar({ sincronizando: false, sincronizado: Date.now() })
    // Si llegó progreso de la cuenta, se guarda aquí y se recarga una vez para que toda la
    // app lo lea (el registro de aprendizaje y el historial viven en memoria).
    if (!mismoProgreso(combinado, local)) {
      restaurarRespaldo(combinado)
      window.location.reload()
    }
  } catch (error: unknown) {
    console.error('No se pudo sincronizar el progreso con la cuenta.', error)
    cambiar({ sincronizando: false, error: 'No se pudo sincronizar con tu cuenta. Tu progreso sigue guardado en este dispositivo.' })
  }
}

let temporizador: ReturnType<typeof setTimeout> | null = null

function programarSubida() {
  if (estado.estado !== 'dentro') return
  if (temporizador) clearTimeout(temporizador)
  temporizador = setTimeout(() => void subirAhora(), ESPERA_SUBIDA_MS)
}

function subirSiQuedaPendiente() {
  if (temporizador) void subirAhora()
}

/**
 * Sube el progreso de este dispositivo combinado con lo que ya hay en la nube. No cambia lo
 * que hay en este dispositivo: lo que venga de otro se recibe la próxima vez que se abra Savia.
 */
async function subirAhora() {
  if (temporizador) clearTimeout(temporizador)
  temporizador = null
  const uid = estado.usuario?.uid
  if (estado.estado !== 'dentro' || !uid) return
  cambiar({ sincronizando: true })
  try {
    const s = await cargarFirebase()
    const local = progresoLocal()
    const nube = await leerNube(s, uid)
    const combinado = nube ? combinarRespaldos(local, nube) : local
    if (!nube || !mismoProgreso(combinado, nube)) await escribirNube(s, uid, combinado)
    cambiar({ sincronizando: false, sincronizado: Date.now(), error: null })
  } catch (error: unknown) {
    console.error('No se pudo guardar el progreso en la cuenta.', error)
    cambiar({ sincronizando: false, error: 'No se pudo guardar en tu cuenta. Lo intentaremos de nuevo con tu próximo avance.' })
  }
}

// ---------- entrar, salir y borrar ----------

const MENSAJES: Record<string, string> = {
  'auth/invalid-credential': 'El correo o la contraseña no son correctos.',
  'auth/invalid-login-credentials': 'El correo o la contraseña no son correctos.',
  'auth/wrong-password': 'El correo o la contraseña no son correctos.',
  'auth/user-not-found': 'No hay una cuenta con ese correo.',
  'auth/invalid-email': 'Ese correo no es válido.',
  'auth/missing-password': 'Escribe tu contraseña.',
  'auth/email-already-in-use': 'Ya hay una cuenta con ese correo. Entra con tu contraseña o con Google.',
  'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres.',
  'auth/too-many-requests': 'Hubo demasiados intentos. Espera unos minutos y vuelve a intentarlo.',
  'auth/network-request-failed': 'No hay conexión a internet. Revisa tu conexión e inténtalo de nuevo.',
  'auth/popup-blocked': 'El navegador bloqueó la ventana de Google. Permite las ventanas emergentes para Savia e inténtalo de nuevo.',
  'auth/operation-not-allowed': 'Esta forma de entrar no está activada todavía.',
  'auth/unauthorized-domain': 'Este sitio no está autorizado para iniciar sesión. Avísale a soporte.',
  'auth/requires-recent-login': 'Por seguridad, vuelve a entrar a tu cuenta y repite la acción.',
  'auth/account-exists-with-different-credential': 'Ese correo ya tiene una cuenta con otra forma de entrar.',
}

/** Mensaje para la persona a partir de un error de Firebase (null si no hay que mostrar nada). */
export function mensajeDeError(error: unknown): string | null {
  const codigo = typeof error === 'object' && error && 'code' in error ? String((error as { code: unknown }).code) : ''
  if (codigo === 'auth/popup-closed-by-user' || codigo === 'auth/cancelled-popup-request') return null
  if (codigo.startsWith('auth/api-key') || codigo === 'auth/invalid-api-key' || codigo === 'auth/configuration-not-found') {
    console.error('Firebase no está bien configurado: revisa las variables VITE_FIREBASE_* y que Authentication esté activado.', error)
    return 'Las cuentas no están bien configuradas todavía. Tu progreso sigue guardado en este dispositivo.'
  }
  return MENSAJES[codigo] ?? 'Algo salió mal. Inténtalo de nuevo en un momento.'
}

export async function entrarConGoogle() {
  const s = await cargarFirebase()
  const proveedor = new s.a.GoogleAuthProvider()
  proveedor.setCustomParameters({ prompt: 'select_account' })
  await s.a.signInWithPopup(s.auth, proveedor)
}

export async function entrarConCorreo(correo: string, clave: string) {
  const s = await cargarFirebase()
  await s.a.signInWithEmailAndPassword(s.auth, correo.trim(), clave)
}

export async function crearCuentaConCorreo(nombre: string, correo: string, clave: string) {
  const s = await cargarFirebase()
  const { user } = await s.a.createUserWithEmailAndPassword(s.auth, correo.trim(), clave)
  if (nombre.trim()) {
    await s.a.updateProfile(user, { displayName: nombre.trim() })
    cambiar({ usuario: datosDe(user) })
  }
}

/** Cambia el nombre que se muestra en la cuenta. */
export async function cambiarNombre(nombre: string) {
  const s = await cargarFirebase()
  const usuario = s.auth.currentUser
  if (!usuario || !nombre.trim()) return
  await s.a.updateProfile(usuario, { displayName: nombre.trim().slice(0, 60) })
  cambiar({ usuario: datosDe(usuario) })
}

export async function recuperarClave(correo: string) {
  const s = await cargarFirebase()
  await s.a.sendPasswordResetEmail(s.auth, correo.trim())
}

/**
 * Cierra la sesión. Antes sube lo que falte y después borra el progreso de este navegador,
 * porque ya está guardado en la cuenta y el equipo puede ser compartido.
 */
export async function cerrarSesion() {
  const s = await cargarFirebase()
  if (temporizador) await subirAhora()
  await s.a.signOut(s.auth)
  borrarProgresoLocal()
  sacarMarcaDeSesion()
  window.location.reload()
}

/** Borra el progreso guardado en la nube y la cuenta. El progreso de este navegador también se borra. */
export async function borrarCuenta() {
  const s = await cargarFirebase()
  const usuario = s.auth.currentUser
  if (!usuario) return
  if (temporizador) clearTimeout(temporizador)
  temporizador = null
  try {
    await s.f.deleteDoc(s.f.doc(s.db, 'usuarios', usuario.uid))
    await s.a.deleteUser(usuario)
  } catch (error: unknown) {
    // Firebase pide haber entrado hace poco para borrar una cuenta: con Google se puede
    // confirmar ahí mismo; con correo hay que volver a entrar.
    const codigo = typeof error === 'object' && error && 'code' in error ? String((error as { code: unknown }).code) : ''
    if (codigo !== 'auth/requires-recent-login' || !datosDe(usuario).conGoogle) throw error
    await s.a.reauthenticateWithPopup(usuario, new s.a.GoogleAuthProvider())
    await s.f.deleteDoc(s.f.doc(s.db, 'usuarios', usuario.uid))
    await s.a.deleteUser(usuario)
  }
  borrarProgresoLocal()
  sacarMarcaDeSesion()
  window.location.reload()
}
