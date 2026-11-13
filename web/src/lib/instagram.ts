// Qué contar en Instagram: jugadas decisivas, partidos destacados y clasificación por jornada.
import { clasificacion } from "../motor/temporada.ts";
import type { Jugada } from "../motor/reglas.ts";
import type { PartidoGuardado } from "../motor/temporada.ts";
import { jugadores, mundo, partido, statsRegular, temporada } from "./liga";

export const USUARIO = "@liganimbo"; // provisional: comprobar que está libre

/** La canasta que puso al ganador por delante para no volver a ir por detrás. */
export function jugadaDecisiva(p: PartidoGuardado): { jugada: Jugada; quedaban: number } | null {
  const ganador = p.marcador[0] > p.marcador[1] ? 0 : 1;
  let decisiva: number | null = null;
  p.jugadas.forEach((j, i) => {
    const [a, b] = j.marcador;
    const delante = ganador === 0 ? a > b : b > a;
    if (!delante) decisiva = null;
    else if (decisiva === null) decisiva = i;
  });
  if (decisiva === null) return null;
  return { jugada: p.jugadas[decisiva], quedaban: p.jugadas.length - 1 - decisiva };
}

/** Mayor desventaja que llegó a tener el ganador. */
export function remontada(p: PartidoGuardado): number {
  const ganador = p.marcador[0] > p.marcador[1] ? 0 : 1;
  return Math.max(0, ...p.jugadas.map((j) => j.marcador[1 - ganador] - j.marcador[ganador]));
}

/** El partido más emocionante de una jornada: muerte súbita, remontada o el más ajustado. */
export function partidoDestacado(jornada: number): PartidoGuardado {
  const ids = temporada.jornadas[jornada - 1].partidos;
  const puntuacion = (p: PartidoGuardado) =>
    (p.jugadas.length > 16 ? 6 : 0) + remontada(p) - Math.abs(p.marcador[0] - p.marcador[1]);
  return ids.map(partido).sort((a, b) => puntuacion(b) - puntuacion(a))[0];
}

export function clasificacionTras(jornada: number) {
  const ids = temporada.jornadas.slice(0, jornada).flatMap((j) => j.partidos);
  return clasificacion(mundo.franquicias.map((f) => f.id), ids.map(partido));
}

/** Quien más destacó en una jornada (puntos + paradas). */
export function mejorDeLaJornada(jornada: number) {
  const lineas = temporada.jornadas[jornada - 1].partidos.flatMap((id) =>
    Object.entries(partido(id).estadisticas).map(([jid, l]) => ({ jid, l, id })),
  );
  return lineas.sort((a, b) => b.l.pts + b.l.paradas - (a.l.pts + a.l.paradas) || b.l.pts - a.l.pts)[0];
}

/** Cartas para presentar, de mejor a peor. */
export const cartasDestacadas = () =>
  Object.values(jugadores).sort((a, b) => b.ataque + b.defensa + (b.icono ? 1 : 0) - (a.ataque + a.defensa + (a.icono ? 1 : 0)));

export const statsDe = (jid: string) => statsRegular[jid];
