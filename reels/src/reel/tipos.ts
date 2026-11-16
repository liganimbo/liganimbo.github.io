// Guiones de los Reels, tal como los escribe web/scripts/reels.ts en src/datos/diciembre.json.
import diciembre from "../datos/diciembre.json" with { type: "json" };

export type Tipo = "dentro" | "fuera";
export type Equipo = { id: string; nombre: string; c1: string; c2: string };
export type Ficha = { nombre: string; equipo: string; meta: string; ataque: number; defensa: number; icono: string | null; c1: string; c2: string };
export type Color = "texto" | "oro" | "lila";
/** La cuenta antes de tirar: defensa total, lo que suma el ataque y lo que tienen que sacar los dados. */
export type Cuenta = {
  tirador: string;
  defensor: string;
  ataque: number;
  icono: string | null;
  bonus: number;
  base: number;
  defensa: number;
  muro: number;
  cierre: number;
  total: number;
  margen: number;
  necesita: number;
};

export type Escena = { segundos: number; acento?: string } & (
  | { tipo: "titular"; lineas: string[]; colores?: Color[]; etiqueta?: string; pie?: string; escudos?: Equipo[] }
  | { tipo: "cartas"; titulo: string; cartas: Ficha[]; roles: string[]; pie?: string }
  | { tipo: "marcador"; etiqueta: string; equipos: Equipo[]; puntos: number[]; resalta?: number; titulo?: string; pie?: string }
  | { tipo: "tabla"; titulo: string; tirador: string; tabla: Record<Tipo, Record<Tipo, number>> }
  | { tipo: "pregunta"; lineas: string[]; pie: string }
  | { tipo: "revela"; titulo: string; tira: { quien: string; tipo: Tipo }; cierra: { quien: string; tipo: Tipo }; pie: string; cuenta: Cuenta }
  | { tipo: "dados"; necesita: number; dados: number[]; pie?: string }
  | { tipo: "resultado"; titulo: string; bien: boolean; equipos?: Equipo[]; puntos?: number[]; resalta?: number; pie?: string }
  | { tipo: "lista"; titulo: string; items: { escudo?: Equipo; carta?: Ficha; titulo: string; texto: string }[] }
  | { tipo: "carta"; rango?: string; carta: Ficha; titulo: string; pie?: string }
);

export type Guion = { id: string; formato: string; fecha: string; titulo: string; texto: string; escenas: Escena[] };

export const REELS = diciembre as Guion[];
