# Savia

Aplicación estática gratuita para practicar Biología de la prueba EDAD II. Incluye 1000 preguntas explicadas, prácticas cronometradas, temario y repaso de errores, y no requiere cuentas. Fue creada en el TCU-704 de la Universidad de Costa Rica.

## Funciones

- **Practicar:** prueba completa (60 preguntas), prueba corta (30) y quiz (15), con reloj, hoja de respuestas y revisión explicada de cada intento.
- **Mi progreso:** pregunta del día con racha, repaso espaciado de las preguntas falladas, preguntas guardadas y avance por tema.
- **Temario:** los seis temas con sus subtemas y un banco de preguntas por tema, con buscador y respuestas tapadas.
- **En papel:** pruebas para imprimir o guardar en PDF; las respuestas no se imprimen y se consultan después con el código de la prueba.
- **Sin internet:** se puede instalar como app y practicar sin conexión después de la primera visita.
- **Accesibilidad:** lector de voz, tamaño de texto, fuente para dislexia, filtros de color, guía y máscara de lectura, entre otras opciones.

## Desarrollo local

```sh
npm install
npm run dev
```

## Verificación y publicación

```sh
npm run lint
npm run build
npm run revisar   # revisa el banco de preguntas (opciones repetidas, duplicados, etc.)
```

El sitio generado en `dist/` se puede publicar en un hosting estático gratuito, como Cloudflare Pages o Render Static Sites. No requiere servidor de aplicación ni base de datos. Para Cloudflare Pages, conecta el repositorio y configura `npm run build` como comando de compilación y `dist` como directorio de salida.

El modo sin internet (service worker) solo funciona en la versión compilada, no con `npm run dev`.

## Progreso

Los intentos, la prueba en curso, el progreso por tema y las preguntas guardadas se guardan en el almacenamiento local del navegador. No se envían a ningún servidor ni se sincronizan entre dispositivos. Borrar los datos del navegador puede eliminar el progreso guardado.
