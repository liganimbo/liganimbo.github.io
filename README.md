# Liga Nimbo

Liga mixta de baloncesto 3x3, ficticia, que se juega con cartas y dos dados.

Web: **https://liganimbo.github.io** · Instagram: **@liganimbo**

- [REGLAMENTO.md](REGLAMENTO.md): las reglas del partido (v0.2).

## Cómo está montado

Todo vive en `web/` (Astro + TypeScript, sin más dependencias):

```
web/src/motor/     el juego: reglas, IA, generación del mundo y simulación de la temporada
web/src/pages/     la web, incluida la página Jugar (el partido en el navegador)
datos/             lo que genera el motor: mundo.json y temporada-1/
```

El mismo motor sirve para jugar en la web y para simular los partidos oficiales de la liga, así que lo que juega la gente y lo que decide la liga son exactamente las mismas reglas.

## Órdenes

Desde `web/`:

```bash
npm install                    # solo la primera vez
npm run dev                    # web en http://localhost:4321 (se queda en segundo plano)
npx astro dev stop             # parar la web (reiníciala tras avanzar la liga si no ves los cambios)

npm run liga -- nueva          # crea la liga en pretemporada (mundo y calendario, sin partidos)
npm run liga -- siguiente      # juega la siguiente Noche Nimbo (una jornada o una noche de playoffs)
npm run liga -- hasta 10       # juega hasta completar la jornada 10
npm run liga -- todo           # juega lo que quede, playoffs incluidos (útil para ver la temporada entera)
npm run liga -- verano         # tras las Finales: evolución, contratos, draft, fichajes… y crea la siguiente temporada
npm run liga -- estilo VLU 0.7 # estilo de juego de una franquicia: 0 = todo dentro, 1 = todo fuera
npm run liga -- estado         # en qué punto está la temporada

npm run instagram              # exporta a ../instagram/ las publicaciones del plan (con la web en marcha)
npm run build                  # web estática en web/dist
```

Cada Noche Nimbo: `npm run liga -- siguiente`, revisar la web, `npm run instagram` y publicar. Al acabar la temporada, `npm run liga -- verano`.

El potencial secreto de cada carta está en `datos/potenciales.json`, que no se sube al repositorio. **No lo borres**: sin él no se puede jugar el verano.

## Publicación

`.github/workflows/web.yml` publica la web en https://liganimbo.github.io cada vez que se sube algo a la rama `main`, con los datos que haya en `datos/`.

## Instagram

- `http://localhost:4321/instagram`: simulación del perfil con el plan de publicaciones (no aparece en el menú).
- Cada publicación es una página de 1080×1350 en `/ig/...`: bienvenida, carta de cada jugador o jugadora, resultado de cada partido, resultados de cada jornada y clasificación tras cada jornada.
- `npm run instagram` las convierte en PNG con el Chromium sin interfaz que haya en el equipo.
- Las stories (1080×1920) están en `/ig/historia/...`: «¿Dentro o fuera?» (pregunta y respuesta), «¿Con quién vas?» y los resultados de cada Noche Nimbo. Se exportan como `historia-*.png`.

## Reels

Los vídeos están en `reels/`, hechos con [Remotion](https://www.remotion.dev) (gratis para equipos de hasta 3 personas). Primero `npm install` dentro de `reels/`.

```
npm run dev     # Remotion Studio: ver y retocar los vídeos en el navegador
npm run video   # genera ../instagram/reel-como-se-juega.mp4 y su portada
```

Formato 1080×1920 a 30 fps y sin música: se añade en Instagram, desde su biblioteca, para evitar problemas de derechos.

Tras volver a simular, recarga el navegador (o reinicia el servidor si no cambia).
