// Cloudflare Pages Function: reenvía /__/firebase/* (la configuración que lee la página de
// inicio de sesión) a Firebase. Ver functions/__/auth/[[ruta]].js.

// Reenvía la petición tal cual al dominio de Firebase del proyecto (VITE_FIREBASE_AUTH_DOMAIN,
// la misma variable de entorno de Cloudflare Pages que usa la app) y devuelve su respuesta.
// Las redirecciones no se siguen aquí: las sigue el navegador, como si hablara con Firebase.
export async function onRequest({ request, env }) {
  const dominio = env.VITE_FIREBASE_AUTH_DOMAIN
  if (!dominio) return new Response('Falta VITE_FIREBASE_AUTH_DOMAIN', { status: 500 })
  const url = new URL(request.url)
  const destino = `https://${dominio}${url.pathname}${url.search}`
  const cabeceras = new Headers(request.headers)
  cabeceras.delete('host')
  return fetch(destino, {
    method: request.method,
    headers: cabeceras,
    body: ['GET', 'HEAD'].includes(request.method) ? undefined : request.body,
    redirect: 'manual',
  })
}
