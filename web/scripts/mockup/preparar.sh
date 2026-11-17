#!/usr/bin/env bash
# Prepara y renderiza las fotos 3D de Liga Nimbo sobre una mesa (instagram/fotos/). Escenas en escenas.py.
# Uso: BLENDER=/ruta/a/blender ./preparar.sh [escena…]   (sin escenas, todas)
# Necesita la web en marcha (npm run dev) y Blender 4.2: BLENDER=/ruta/a/blender ./preparar.sh
# Las texturas de las cartas salen de /ig/mockup/carta/<id>; la madera y la luz, de Poly Haven (CC0).
set -euo pipefail
AQUI=$(cd "$(dirname "$0")" && pwd)
TRABAJO=${TRABAJO:-$AQUI/.trabajo}
SALIDA=$AQUI/../../../instagram/fotos
WEB=${WEB:-http://localhost:4321}
BLENDER=${BLENDER:?Indica dónde está Blender: BLENDER=/ruta/a/blender}
NAV=$(ls -d ~/.cache/ms-playwright/chromium_headless_shell*/chrome-headless-shell-linux64/chrome-headless-shell | tail -1)
mkdir -p "$TRABAJO/tex" "$TRABAJO/pbr" "$SALIDA"
cp "$AQUI/escenas.py" "$TRABAJO/"
cp "$AQUI/../../../datos/mundo.json" "$TRABAJO/"

# Las 48 cartas de la liga, las de elección y el dorso.
for id in $(node -e "console.log(require('$TRABAJO/mundo.json').franquicias.flatMap((f) => f.plantilla).join(' '))") dentro fuera dorso; do
  [ -f "$TRABAJO/tex/$id.png" ] && continue
  "$NAV" --headless --disable-gpu --hide-scrollbars --force-device-scale-factor=6 --window-size=238,333 \
    --virtual-time-budget=5000 --default-background-color=00000000 --screenshot="$TRABAJO/tex/$id.png" "$WEB/ig/mockup/carta/$id" 2>/dev/null
done

# Mesa de madera y luz de una habitación con ventanas.
cd "$TRABAJO/pbr"
for m in diff_2k rough_2k nor_gl_2k; do
  [ -f "wood_$m.jpg" ] || curl -sL -o "wood_$m.jpg" "https://dl.polyhaven.org/file/ph-assets/Textures/jpg/2k/wood_table_001/wood_table_001_$m.jpg"
done
[ -f hdri.hdr ] || curl -sL -o hdri.hdr https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/2k/lebombo_2k.hdr

ESCENAS=("$@")
[ ${#ESCENAS[@]} -gt 0 ] || ESCENAS=(mesa-story mesa-publicacion web navidad mazo presentamos-J21 presentamos-J03 presentamos-J20)
for e in "${ESCENAS[@]}"; do
  "$BLENDER" -b -P "$TRABAJO/escenas.py" -- "$e" 200 "$SALIDA/$e.png" 100 >/dev/null
  echo "✓ instagram/fotos/$e.png"
done
