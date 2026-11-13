// Cuándo empieza y cuánto dura cada escena, según la voz generada (src/voz.json).
import { GUION, type Escena } from "./guion";
import voz from "./voz.json";

const DURACION_VOZ = voz as Partial<Record<Escena, number>>;
/** Aire tras cada frase y retraso de la voz al empezar la escena (segundos). */
export const AIRE = 0.5;
export const RETRASO_VOZ = 0.15;

export const FPS = 30;

export const TIEMPOS = (() => {
  let desde = 0;
  return Object.fromEntries(
    GUION.map(({ id, minimo }) => {
      const segundos = Math.max(minimo, (DURACION_VOZ[id] ?? 0) + RETRASO_VOZ + AIRE);
      const t = { desde, duracion: Math.round(segundos * FPS), voz: id in DURACION_VOZ };
      desde += t.duracion;
      return [id, t];
    }),
  ) as Record<Escena, { desde: number; duracion: number; voz: boolean }>;
})();

export const TOTAL = Object.values(TIEMPOS).reduce((s, t) => s + t.duracion, 0);
