import { useSyncExternalStore } from 'react'
import type { Auth, User } from 'firebase/auth'
import type { Firestore } from 'firebase/firestore/lite'
import { alCambiarProgreso } from './cambios'
import { combinarRespaldos, mismoProgreso, sinAccesibilidad } from './combinar'
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

// En el sitio publicado, el inicio de sesión pasa por el mismo dominio de Savia: /__/auth/* se
// reenvía a Firebase (functions/__/auth). En el celular, Safari y Chrome separan los datos de cada
// dominio, y si Google regresaba a firebaseapp.com, Savia no se enteraba de que la persona entró.
// En localhost no hay reenvío y se usa el dominio de Firebase directamente.
const enLocal = typeof location === 'undefined' || ['localhost', '127.0.0.1'].includes(location.hostname)
const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: enLocal || !import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ? import.meta.env.VITE_FIREBASE_AUTH_DOMAIN : location.host,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

/** Si el proyecto tiene Firebase configurado (variables VITE_FIREBASE_* en .env.local). */
export const cuentasDisponibles = Boolean(config.apiKey && config.authDomain && config.projectId && config.appId)

// Marca de que hay una sesión abierta, para cargar Firebase al abrir Savia solo si hace falta.
const CLAVE_SESION = 'savia:sesion'
// Marca de que se fue a Google en esta misma pestaña (celular) y hay que recoger el resultado al volver.
const CLAVE_GOOGLE = 'savia:google'

function vuelveDeGoogle() {
  try {
    const habia = sessionStorage.getItem(CLAVE_GOOGLE) === '1'
    sessionStorage.removeItem(CLAVE_GOOGLE)
    return habia
  } catch {
    return false
  }
}
function yendoAGoogle() {
  try {
    return sessionStorage.getItem(CLAVE_GOOGLE) === '1'
  } catch {
    return false
  }
}
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
  // error al volver de Google en el celular (se muestra en la página para entrar)
  errorEntrada: string | null
  // recién se inició sesión en este dispositivo y todavía no llega el progreso de la cuenta (el
  // perfil y la barra esperan, para no mostrar un blobatar que no es el elegido)
  entrando: boolean
  // Firebase ya descargado: el botón de Google solo se habilita entonces (ver entrarConGoogle)
  conectado: boolean
}

let estado: EstadoCuenta = {
  estado: cuentasDisponibles ? 'fuera' : 'apagado',
  usuario: null,
  sincronizando: false,
  sincronizado: null,
  error: null,
  errorEntrada: null,
  entrando: false,
  conectado: false,
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

// Firebase ya cargado, para usarlo sin esperar (ver entrarConGoogle)
let listos: Servicios | null = null

function cargarFirebase(): Promise<Servicios> {
  servicios ??= (async () => {
    const [{ initializeApp }, a, f] = await Promise.all([import('firebase/app'), import('firebase/auth'), import('firebase/firestore/lite')])
    const app = initializeApp(config)
    const auth = a.getAuth(app)
    auth.languageCode = 'es'
    const db = f.getFirestore(app)
    a.onAuthStateChanged(auth, (usuario) => void alCambiarUsuario(usuario))
    listos = { auth, db, a, f }
    cambiar({ conectado: true })
    if (vuelveDeGoogle()) {
      // el resultado (la sesión) llega por onAuthStateChanged; aquí solo se recogen los errores
      a.getRedirectResult(auth).catch((error: unknown) => cambiar({ estado: 'fuera', errorEntrada: mensajeDeError(error) }))
    }
    return listos
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
  let yaHabiaSesion = false
  try {
    yaHabiaSesion = localStorage.getItem(CLAVE_SESION) === '1'
  } catch {
    yaHabiaSesion = false
  }
  ponerMarcaDeSesion()
  cambiar({ estado: 'dentro', usuario: datosDe(u), error: null, entrando: !yaHabiaSesion })
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
    habiaSesion = localStorage.getItem(CLAVE_SESION) === '1' || yendoAGoogle()
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
    // la accesibilidad es de cada dispositivo: no se sube
    progreso: JSON.stringify(sinAccesibilidad(respaldo)),
    actualizado: s.f.serverTimestamp(),
    version: VERSION_DOCUMENTO,
  })
}

/**
 * Recarga la página para que toda la app lea el progreso nuevo. Al cerrar sesión o borrar la
 * cuenta (arriba = true) vuelve al principio: si no, el navegador conserva el desplazamiento y
 * la persona queda viendo el pie de página.
 */
function recargar(arriba = false) {
  if (arriba) {
    history.scrollRestoration = 'manual'
    window.scrollTo(0, 0)
  }
  window.location.reload()
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
      recargar()
      return
    }
    cambiar({ entrando: false })
  } catch (error: unknown) {
    console.error('No se pudo sincronizar el progreso con la cuenta.', error)
    cambiar({ sincronizando: false, entrando: false, error: 'No se pudo sincronizar con tu cuenta. Tu progreso sigue guardado en este dispositivo.' })
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
  'auth/popup-blocked': 'El navegador bloqueó la ventana de Google. Toca otra vez «Continuar con Google»; si vuelve a pasar, permite las ventanas emergentes para Savia.',
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

/** Descarga Firebase de antemano (al abrir la página para entrar), para que el botón de Google responda al instante. */
export function prepararCuenta() {
  if (cuentasDisponibles) cargarFirebase().catch(() => {})
}

function proveedorGoogle(s: Servicios) {
  const proveedor = new s.a.GoogleAuthProvider()
  proveedor.setCustomParameters({ prompt: 'select_account' })
  return proveedor
}

/** En el celular, Google se abre en esta misma pestaña y regresa a Savia (sin pestañas extra). */
const conToque = () => window.matchMedia('(pointer: coarse)').matches

function irAGoogle(s: Servicios) {
  try {
    sessionStorage.setItem(CLAVE_GOOGLE, '1')
  } catch {
    // sin almacenamiento igual se recupera la sesión al volver
  }
  return s.a.signInWithRedirect(s.auth, proveedorGoogle(s))
}

async function google(s: Servicios) {
  if (conToque()) return irAGoogle(s)
  try {
    await s.a.signInWithPopup(s.auth, proveedorGoogle(s))
  } catch (error: unknown) {
    // si el navegador bloquea la ventana, se va a Google en esta misma pestaña
    const codigo = typeof error === 'object' && error && 'code' in error ? (error as { code: unknown }).code : ''
    if (codigo === 'auth/popup-blocked') return irAGoogle(s)
    throw error
  }
}

/**
 * En computadora, Google se abre en una ventana; en el celular, en la misma pestaña. Safari solo
 * deja abrir la ventana en el mismo momento del clic: si antes se espera a que cargue Firebase,
 * la bloquea. Por eso, si ya está cargado, se llama sin esperar nada.
 */
export async function entrarConGoogle() {
  cambiar({ errorEntrada: null })
  if (listos) {
    await google(listos)
    return
  }
  await google(await cargarFirebase())
}

export async function entrarConCorreo(correo: string, clave: string) {
  cambiar({ errorEntrada: null })
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
  recargar(true)
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
  recargar(true)
}
