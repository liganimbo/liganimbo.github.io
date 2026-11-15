// Qué contar en Instagram: jugadas decisivas, partidos destacados y clasificación por jornada.
import { clasificacion } from "../motor/temporada.ts";
import { necesita, type Jugada, type Tipo } from "../motor/reglas.ts";
import { crearAzar, dosDados } from "../motor/azar.ts";
import type { Jugador } from "../motor/mundo.ts";
import type { PartidoGuardado } from "../motor/temporada.ts";
import { activas, jugadores, mundo, partido, statsRegular, temporada } from "./liga";

export const USUARIO = "@liganimbo";

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
  activas().sort((a, b) => b.ataque + b.defensa + (b.icono ? 1 : 0) - (a.ataque + a.defensa + (a.icono ? 1 : 0)));

export const statsDe = (jid: string) => statsRegular[jid];

/** Story "¿Dentro o fuera?": un ataque con dos cartas reales. Un día se vota, al siguiente se tiran los dados. */
export interface Situacion {
  n: number;
  atacante: Jugador;
  defensor: Jugador;
  cierra: Tipo;
  dados: [number, number];
  /** Lo que tenían que sumar los dados para que entrara, según lo que cerró la defensa. */
  necesita: Record<Tipo, number>;
  entra: Record<Tipo, boolean>;
}

const TIPOS: Tipo[] = ["dentro", "fuera"];
const valor = (j: Jugador) => j.ataque + j.defensa + (j.icono ? 1 : 0);

/** Tres situaciones fijas, con la respuesta buena alternando:
 *  1. Aro contra Muro (gana dentro), 2. Tiro contra la mejor defensa (gana fuera),
 *  3. el mejor ataque sin icono contra otro Muro (gana fuera: el Muro no frena los triples). */
export function situaciones(): Situacion[] {
  const usadas = new Set<string>();
  const elegir = (filtro: (j: Jugador) => boolean, orden: (j: Jugador) => number) => {
    const j = activas()
      .filter((x) => !usadas.has(x.id) && filtro(x))
      .sort((a, b) => orden(b) - orden(a) || valor(b) - valor(a))[0];
    usadas.add(j.id);
    return j;
  };
  const parejas: [Jugador, Jugador, Tipo][] = [];
  const a1 = elegir((j) => j.icono === "Aro", (j) => j.ataque);
  parejas.push([a1, elegir((j) => j.icono === "Muro" && j.franquicia !== a1.franquicia, (j) => j.defensa), "dentro"]);
  const a2 = elegir((j) => j.icono === "Tiro", (j) => j.ataque);
  parejas.push([a2, elegir((j) => j.franquicia !== a2.franquicia, (j) => j.defensa), "fuera"]);
  const a3 = elegir((j) => !j.icono, (j) => j.ataque);
  parejas.push([a3, elegir((j) => j.icono === "Muro" && j.franquicia !== a3.franquicia, (j) => j.defensa), "fuera"]);

  return parejas.map(([atacante, defensor, buena], i) => {
    // Se buscan unos dados con los que solo habría entrado la opción buena: así la respuesta es clara.
    for (let intento = 0; ; intento++) {
      const azar = crearAzar(`historia-${i + 1}-${intento}`);
      const cierra: Tipo = azar() < 0.5 ? "dentro" : "fuera";
      const dados = dosDados(azar);
      const n = Object.fromEntries(TIPOS.map((t) => [t, necesita(atacante, defensor, t, cierra)])) as Record<Tipo, number>;
      const entra = Object.fromEntries(TIPOS.map((t) => [t, dados[0] + dados[1] >= n[t]])) as Record<Tipo, boolean>;
      if (entra[buena] && !entra[buena === "dentro" ? "fuera" : "dentro"]) return { n: i + 1, atacante, defensor, cierra, dados, necesita: n, entra };
    }
  });
}
