// Amistosos de Navidad (18-31 dic 2026): 12 partidos de verdad, con semilla fija y sin buscar, antes de la Temporada 1.
// Cada franquicia juega uno en casa y otro fuera. Los cuentan los Reels (scripts/reels.ts) y la web (/partidos/navidad).
import type { Mundo } from "./mundo.ts";
import { jugarPartido, type PartidoGuardado } from "./temporada.ts";

/** [fecha, local, visitante] */
export const AMISTOSOS: [string, string, string][] = [
  ["2026-12-18", "VAL", "VLU"],
  ["2026-12-19", "SGR", "TOR"],
  ["2026-12-21", "MIR", "STE"],
  ["2026-12-22", "PAL", "EBA"],
  ["2026-12-23", "ALC", "FER"],
  ["2026-12-24", "OST", "BRE"],
  ["2026-12-25", "STE", "OST"],
  ["2026-12-26", "VLU", "SGR"],
  ["2026-12-28", "TOR", "VAL"],
  ["2026-12-29", "EBA", "MIR"],
  ["2026-12-30", "FER", "PAL"],
  ["2026-12-31", "BRE", "ALC"],
];

const SEMILLA = "navidad-2026";
export const idAmistoso = (local: string, visitante: string) => `${local}-${visitante}`;
/** La semilla con la que se juega: la misma que se publica en el Reel. */
export const semillaAmistoso = (local: string, visitante: string) => `${SEMILLA}-${idAmistoso(local, visitante)}`;

export const jugarAmistoso = (mundo: Mundo, fecha: string, local: string, visitante: string): PartidoGuardado =>
  jugarPartido(mundo, idAmistoso(local, visitante), local, visitante, fecha, SEMILLA);
