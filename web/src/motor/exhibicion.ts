// Partido de exhibición: no cuenta para la liga. Sirve para enseñar cómo es la crónica de un partido (web y Reel) antes de
// que empiece la temporada. Lo juega el motor con las cartas actuales; de las primeras semillas, se queda con el primer
// partido apretado que tenga cambios de líder, algún mate y algún tapón.
import type { Mundo } from "./mundo.ts";
import { REGLAS } from "./reglas.ts";
import { fechaNoche, jugarPartido, type PartidoGuardado } from "./temporada.ts";

// Búhos (todo cerca del aro) contra Vendaval (triples a la mínima): dos estilos opuestos. Se juega el viernes antes de la liga.
export const EXHIBICION = { local: "VLU", visitante: "VAL" };

export function cambiosDeLider(p: PartidoGuardado) {
  let lider = 0;
  let cambios = 0;
  for (const j of p.jugadas) {
    const ahora = Math.sign(j.marcador[0] - j.marcador[1]);
    if (ahora !== 0 && ahora !== lider) {
      if (lider !== 0) cambios++;
      lider = ahora;
    }
  }
  return cambios;
}

export function jugarExhibicion(mundo: Mundo): PartidoGuardado {
  let ultimo: PartidoGuardado | null = null;
  for (let n = 1; n <= 3000; n++) {
    const p = jugarPartido(mundo, `EXHIBICION-${n}`, EXHIBICION.local, EXHIBICION.visitante, fechaNoche(-1), "nimbo");
    ultimo = p;
    const apretado = Math.abs(p.marcador[0] - p.marcador[1]) <= 3;
    const regular = p.jugadas.length === 2 * REGLAS.ataquesPorEquipo;
    if (apretado && regular && cambiosDeLider(p) >= 2 && p.jugadas.some((j) => j.mate) && p.jugadas.some((j) => j.tapon)) return p;
  }
  return ultimo!;
}
