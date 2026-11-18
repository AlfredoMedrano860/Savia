# Savia

Aplicación gratuita para practicar Biología de la prueba EDAD II. Incluye 1000 preguntas explicadas, prácticas cronometradas, temario y repaso de errores. Se puede usar sin cuenta; con una cuenta (opcional), el progreso se guarda en la nube. Fue creada en el TCU-704 de la Universidad de Costa Rica.

## Funciones

- **Practicar:** prueba completa (60 preguntas), prueba corta (30) y quiz (15), con reloj, hoja de respuestas, preguntas marcadas para revisar antes de entregar y revisión explicada de cada intento.
- **Mi progreso:** pregunta del día con racha, repaso espaciado de las preguntas falladas, puntos débiles, preguntas guardadas y avance por tema.
- **Temario:** los seis temas con sus subtemas y un banco de preguntas por tema, con buscador y respuestas tapadas.
- **En papel:** pruebas para imprimir o guardar en PDF; las respuestas no se imprimen y se consultan después con el código de la prueba.
- **Cuenta (opcional):** entrar con Google o con correo y contraseña para guardar el progreso en la nube y usarlo en varios dispositivos.
- **App:** se puede instalar en el teléfono desde el navegador.
- **Accesibilidad:** lector de voz, tamaño de texto, fuente para dislexia, filtros de color, guía y máscara de lectura, entre otras opciones.

## Desarrollo local

```sh
npm install
npm run dev
```

## Verificación y publicación

```sh
npm run lint
npm test          # pruebas de la lógica (calificación, progreso, respaldo, sincronización)
npm run build
npm run revisar   # revisa el banco de preguntas (opciones repetidas, duplicados, etc.)
```

El sitio generado en `dist/` se publica en Cloudflare Pages: conecta el repositorio y configura `npm run build` como comando de compilación y `dist` como directorio de salida. No hace falta un servidor propio.

## Cuentas con Firebase

Las cuentas son opcionales. Si no se configuran, Savia funciona igual que siempre y el botón «Entrar» no aparece.

1. **Crear el proyecto.** En [console.firebase.google.com](https://console.firebase.google.com), crea un proyecto (Google Analytics no hace falta).
2. **Registrar la app web.** En *Configuración del proyecto → Tus apps*, agrega una app web. Copia los valores de `firebaseConfig`.
3. **Activar el inicio de sesión.** En *Authentication → Sign-in method*, activa **Google** y **Correo electrónico/contraseña**.
4. **Autorizar los dominios.** En *Authentication → Settings → Authorized domains*, agrega el dominio de Cloudflare Pages (`tu-proyecto.pages.dev`) y el dominio propio si lo hay. `localhost` ya viene autorizado.
5. **Crear la base de datos.** En *Firestore Database*, crea la base en modo producción (elige una región, por ejemplo `us-east1`; no se puede cambiar después).
6. **Publicar las reglas.** Copia el contenido de [`firestore.rules`](firestore.rules) en *Firestore Database → Reglas* y publícalas. Con ellas, cada persona solo puede leer y escribir su propio progreso.
7. **Configurar las variables.** Copia `.env.example` como `.env.local` y llena los cuatro valores (`VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_APP_ID`). En Cloudflare Pages, agrégalos en *Settings → Environment variables* y vuelve a publicar. Estos valores son públicos; la seguridad la dan las reglas.
8. **Revisar la seguridad del sitio.** `public/_headers` ya permite a Firebase en la Content-Security-Policy. Si usas un `authDomain` propio (distinto de `*.firebaseapp.com`), agrégalo a `frame-src`.

### Cómo funciona

- El progreso de cada persona se guarda en el documento `usuarios/{uid}` de Firestore, en el mismo formato con el que se guarda en el navegador (`src/lib/respaldo.ts`).
- Al entrar, y cada vez que se abre Savia con la sesión iniciada, se combina el progreso del dispositivo con el de la cuenta sin perder nada (`src/lib/combinar.ts`). Cuando cambia el progreso, se sube unos segundos después (`src/lib/cuenta.ts`).
- Firebase solo se descarga cuando alguien inicia sesión o ya tenía una sesión abierta. Se usa Firestore Lite, que pesa menos.
- Al cerrar sesión, el progreso se borra del dispositivo (puede ser un equipo compartido) y queda en la cuenta. «Borrar mi cuenta» elimina la cuenta y su progreso.

## Información legal

Las páginas Términos de uso, Privacidad, Cookies y almacenamiento, y Licencias y créditos están en `src/pages/Legal.tsx` y se enlazan desde el pie de página. Si Savia empieza a guardar datos de otra forma (analíticas, otro servicio), hay que actualizar esos textos y su fecha de vigencia antes de publicar el cambio.

## Progreso

Sin cuenta, los intentos, la prueba en curso, el progreso por tema y las preguntas guardadas se guardan solo en el almacenamiento local del navegador; borrar los datos del navegador los elimina. Con cuenta, además se guardan en Firestore y se sincronizan entre dispositivos.
