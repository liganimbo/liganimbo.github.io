// Acceso a los datos que genera el motor (carpeta ../datos).
import fs from "node:fs";
import path from "node:path";
import { REGLAS, type Jugada } from "../motor/reglas.ts";
import type { Franquicia, Jugador, Mundo } from "../motor/mundo.ts";
import type { Acumulado, PartidoGuardado, Temporada } from "../motor/temporada.ts";

const DATOS = path.resolve(process.cwd(), "../datos");
const leer = (ruta: string) => JSON.parse(fs.readFileSync(path.join(DATOS, ruta), "utf-8"));

export const mundo: Mundo = leer("mundo.json");
export const temporada: Omit<Temporada, "partidos"> = leer(`temporada-${1}/temporada.json`);

export const franquicias: Record<string, Franquicia> = Object.fromEntries(mundo.franquicias.map((f) => [f.id, f]));
export const jugadores: Record<string, Jugador> = mundo.jugadores;

const cache = new Map<string, PartidoGuardado>();
export function partido(id: string): PartidoGuardado {
  if (!cache.has(id)) cache.set(id, leer(`temporada-1/partidos/${id}.json`));
  return cache.get(id)!;
}

export const NOMBRES_RONDA: Record<string, string> = {
  cuartos: "Cuartos de final",
  semifinales: "Semifinales",
  final: "Finales Nimbo",
};

export interface Resumen {
  id: string;
  fecha: string;
  local: string;
  visitante: string;
  marcador: [number, number];
  mejor: string;
  prorroga: boolean;
  contexto: string;
  jornada?: number;
}

// Todos los partidos (liga y playoffs) en orden cronológico, con su contexto.
const resumenes: Resumen[] = [
  ...temporada.jornadas.flatMap((j) =>
    j.partidos.map((id) => ({ id, jornada: j.jornada, contexto: `Jornada ${j.jornada}` })),
  ),
  ...temporada.playoffs.rondas.flatMap((r) =>
    r.series.flatMap((s) => s.partidos.map((id, n) => ({ id, contexto: `${NOMBRES_RONDA[r.ronda]} · partido ${n + 1}` }))),
  ),
].map((x) => {
  const p = partido(x.id);
  const prorroga = p.jugadas.length > 2 * REGLAS.ataquesPorEquipo;
  return { ...x, fecha: p.fecha, local: p.local, visitante: p.visitante, marcador: p.marcador, mejor: p.mejor, prorroga };
});

export const todosLosPartidos = () => resumenes;
export const resumen = (id: string) => resumenes.find((r) => r.id === id)!;
export const partidosDe = (fid: string) => resumenes.filter((p) => p.local === fid || p.visitante === fid);

export const nombreEquipo = (fid: string) => `${franquicias[fid].nombre} de ${franquicias[fid].ciudad}`;

export const url = (ruta = "") => `${import.meta.env.BASE_URL.replace(/\/$/, "")}/${ruta.replace(/^\//, "")}`;

/** Número con coma decimal, como se escribe en español. */
export const dec = (v: number, decimales = 1) => v.toLocaleString("es-ES", { minimumFractionDigits: 0, maximumFractionDigits: decimales });

export const pct = (v: number | null | undefined) => (v == null ? "–" : `${Math.round(v * 100)}%`);

export const fecha = (iso: string) =>
  new Date(`${iso}T12:00:00`).toLocaleDateString("es-ES", { weekday: "short", day: "numeric", month: "short" });

export const statsRegular: Record<string, Acumulado> = temporada.estadisticas.regular;
export const statsPlayoffs: Record<string, Acumulado> = temporada.estadisticas.playoffs;

const partidosLiga = Math.max(...temporada.clasificacion.map((f) => f.v + f.d));
export const elegibles = () => Object.entries(statsRegular).filter(([, s]) => s.pj >= partidosLiga * 0.6);

export function lideres(valor: (s: Acumulado) => number | null, n = 5, filtro: (s: Acumulado) => boolean = () => true) {
  return elegibles()
    .filter(([, s]) => filtro(s) && valor(s) != null)
    .sort(([, a], [, b]) => valor(b)! - valor(a)!)
    .slice(0, n);
}

/** Índice provisional de MVP: puntos y paradas por partido más un plus por las victorias del equipo. */
export function carreraMvp(n = 5) {
  const porcentaje = Object.fromEntries(temporada.clasificacion.map((f) => [f.franquicia, f.pct]));
  return elegibles()
    .map(([jid, s]) => ({ jid, s, indice: s.medias.pts + s.medias.paradas + 4 * porcentaje[s.franquicia] }))
    .sort((a, b) => b.indice - a.indice)
    .slice(0, n);
}

export const TIPO = { dentro: "dentro", fuera: "de fuera" } as const;

export function describirJugada(j: Jugada): string {
  const tirador = jugadores[j.tirador].nombre;
  if (j.anota) return `${tirador} anota ${j.tipo === "fuera" ? "un triple" : "dentro"}`;
  return `${tirador} falla ${TIPO[j.tipo]}`;
}
