// Guiones de los Reels, tal como los escribe web/scripts/reels.ts en src/datos/diciembre.json.
import diciembre from "../datos/diciembre.json" with { type: "json" };

export type Tipo = "dentro" | "fuera";
export type Equipo = { id: string; nombre: string; c1: string; c2: string };
export type Ficha = { nombre: string; equipo: string; meta: string; ataque: number; defensa: number; icono: string | null; c1: string; c2: string };
export type Color = "texto" | "oro" | "lila";
/** La defensa total al descubrir qué se tira y qué se cierra. */
export type Cuenta = { defensor: string; base: number; defensa: number; muro: number; cierre: number; total: number };
/** La tirada: el ataque total con los dados, contra la defensa (sin ella, solo el ataque). `castigo`: de fuera, -2. */
export type Tirada = { tirador: string; ataque: number; icono: string | null; bonus: number; castigo: number; total: number; defensa?: number; anota?: boolean };
/** Un ataque en una línea, para el repaso tiro a tiro. */
export type Tiro = { equipo: number; tirador: string; tipo: Tipo; dados: number[]; anota: boolean; puntos: number; mate: boolean; tapon: boolean; marcador: number[]; tiempoMuerto: boolean };
/** Qué habría pasado cerrando dentro o fuera, con los mismos dados. */
export type Cierre = { cierra: Tipo; suma: string; defensa: number; anota: boolean; pie: string };

export type Escena = { segundos: number; acento?: string } & (
  | { tipo: "titular"; lineas: string[]; colores?: Color[]; etiqueta?: string; pie?: string; escudos?: Equipo[] }
  | { tipo: "cartas"; titulo: string; cartas: Ficha[]; roles: string[]; pie?: string }
  | { tipo: "marcador"; etiqueta: string; equipos: Equipo[]; puntos: number[]; resalta?: number; titulo?: string; pie?: string }
  | { tipo: "tabla"; titulo: string; tirador: string; tabla: Record<Tipo, Record<Tipo, number>> }
  | { tipo: "pregunta"; lineas: string[]; pie: string }
  | { tipo: "revela"; titulo: string; tira: { quien: string; tipo: Tipo }; cierra: { quien: string; tipo: Tipo }; pie: string; cuenta: Cuenta }
  | { tipo: "dados"; dados: number[]; tirada: Tirada; pie?: string }
  | { tipo: "tira"; titulo: string; quien: string; tiro: Tipo; pie: string }
  | { tipo: "tiros"; titulo: string; equipos: Equipo[]; inicio: number[]; tiros: Tiro[]; porTiro: number }
  | { tipo: "cierres"; titulo: string; ataque: number; filas: Cierre[] }
  | { tipo: "resultado"; titulo: string; bien: boolean; equipos?: Equipo[]; puntos?: number[]; resalta?: number; pie?: string }
  | { tipo: "lista"; titulo: string; items: { escudo?: Equipo; carta?: Ficha; titulo: string; texto: string }[] }
  | { tipo: "carta"; rango?: string; carta: Ficha; titulo: string; pie?: string }
);

export type Guion = { id: string; formato: string; fecha: string; titulo: string; texto: string; escenas: Escena[] };

export const REELS = diciembre as Guion[];
