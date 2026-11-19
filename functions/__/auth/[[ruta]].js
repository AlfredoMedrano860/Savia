// Cloudflare Pages Function: reenvía /__/auth/* a Firebase (savia860.firebaseapp.com).
//
// Así el inicio de sesión con Google pasa por el mismo dominio de Savia. En el celular, Safari
// y Chrome separan los datos de cada dominio: si la ventana de Google vive en firebaseapp.com,
// no puede avisarle a Savia que la persona ya entró (se queda en otra pestaña o no regresa).
// Es la opción "proxy" que recomienda Firebase:
// https://firebase.google.com/docs/auth/web/redirect-best-practices

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
