# Bocetos de Savia

Fuente de las ilustraciones a lápiz que usa la app.

- `lamina-original.png`: la lámina dibujada a mano con los 8 bocetos.
- `*.svg`: cada boceto vectorizado (recortado de la lámina, agrandado 4x y trazado en
  4 capas de tono de lápiz con potrace).

La app no usa estos archivos: usa las versiones en imagen de `src/assets/bocetos/*.webp`
(fondo transparente, 720 px por el lado más largo), exportadas desde estos SVG.
Si se edita un SVG, hay que volver a exportarlo a WebP con el mismo nombre.

`celula-portada.svg` es la célula detallada de la versión anterior de Savia. Se conserva
solo para el dibujo principal de la portada (`src/assets/bocetos/celula-portada.webp`);
en el resto de la app se usa la célula nueva.
