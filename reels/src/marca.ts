// Estilo de la Liga Nimbo para los vídeos: el mismo que las publicaciones de Instagram
// (fondo azul noche con degradados, logotipo en flat). Ver web/src/styles/temas.css.
import { loadFont as cargarBarlow } from "@remotion/google-fonts/BarlowCondensed";
import { loadFont as cargarInter } from "@remotion/google-fonts/Inter";

export const titulo = cargarBarlow("normal", { weights: ["700", "800"], subsets: ["latin"] }).fontFamily;
export const texto = cargarInter("normal", { weights: ["500", "700"], subsets: ["latin"] }).fontFamily;

export const COLOR = {
  texto: "#f1f2f8",
  apagado: "#a9adcf",
  oro: "#ffc83d",
  lila: "#9b95ff",
  noche: "#0d0f1c",
  verde: "#6ee7a8",
};

/** Fondo de las publicaciones: halos del color protagonista sobre azul noche. */
export const fondo = (acento = "#4f46e5") =>
  [
    `radial-gradient(circle at 90% 0%, color-mix(in srgb, ${acento} 55%, transparent), transparent 55%)`,
    `radial-gradient(circle at 0% 100%, color-mix(in srgb, ${acento} 30%, transparent), transparent 50%)`,
    COLOR.noche,
  ].join(", ");

/** Lo que pinta una carta (los datos salen de datos/mundo.json a través de web/scripts/reels.ts). */
export type DatosCarta = { equipo: string; nombre: string; meta: string; ataque: number; defensa: number; icono: string | null; c1: string; c2: string };
