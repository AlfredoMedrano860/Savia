// Las claves del almacenamiento local se llamaban "ribosoma:…" (el nombre interno
// anterior del proyecto) y ahora se llaman "savia:…". Este módulo se importa primero en
// main.tsx para pasar los datos al nombre nuevo antes de que la app los lea, así nadie
// pierde su progreso, sus guardadas ni sus preferencias al actualizar.
const ANTERIOR = 'ribosoma:'
const NUEVO = 'savia:'

try {
  const viejas: string[] = []
  for (let i = 0; i < localStorage.length; i++) {
    const clave = localStorage.key(i)
    if (clave?.startsWith(ANTERIOR)) viejas.push(clave)
  }
  for (const clave of viejas) {
    const nueva = NUEVO + clave.slice(ANTERIOR.length)
    const valor = localStorage.getItem(clave)
    if (valor !== null && localStorage.getItem(nueva) === null) localStorage.setItem(nueva, valor)
    localStorage.removeItem(clave)
  }
} catch {
  // sin almacenamiento disponible: no hay nada que migrar
}
