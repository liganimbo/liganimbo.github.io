// Cuándo empieza y cuánto dura cada escena de un Reel, según la voz generada (src/voz.json).
import { GUIONES, type Reel } from "./guion";
import voz from "./voz.json";

const DURACION_VOZ = voz as Partial<Record<Reel, Record<string, number>>>;
/** Aire tras cada frase y retraso de la voz al empezar la escena (segundos). */
export const AIRE = 0.5;
export const RETRASO_VOZ = 0.15;

export const FPS = 30;

export type Tiempo = { desde: number; duracion: number; voz: boolean };

export function tiempos<R extends Reel>(reel: R) {
  let desde = 0;
  const T = Object.fromEntries(
    GUIONES[reel].map(({ id, minimo }) => {
      const segundos = Math.max(minimo, (DURACION_VOZ[reel]?.[id] ?? 0) + RETRASO_VOZ + AIRE);
      const t = { desde, duracion: Math.round(segundos * FPS), voz: id in (DURACION_VOZ[reel] ?? {}) };
      desde += t.duracion;
      return [id, t];
    }),
  ) as Record<(typeof GUIONES)[R][number]["id"], Tiempo>;
  return { T, total: desde };
}
