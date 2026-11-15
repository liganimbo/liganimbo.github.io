// La temporada como un estado que avanza noche a noche: liga regular y playoffs.
import { type Azar, barajar, crearAzar } from "./azar.ts";
import { jugarAutomatico } from "./ia.ts";
import { type LineaJugador, estadisticas, lineaVacia, mejorDelPartido } from "./reglas.ts";
import type { Mundo } from "./mundo.ts";

export const CONFIG = {
  temporada: 1,
  inicio: "2027-01-12", // primer martes de la Temporada 1; hay partidos martes y viernes
  /** Semanas de verano entre la última noche de una temporada y el inicio de la siguiente. */
  semanasDeVerano: 18,
  playoffs: 8,
  victoriasPorRonda: { cuartos: 2, semifinales: 2, final: 3 } as Record<string, number>,
};

const RONDAS = ["cuartos", "semifinales", "final"] as const;

export function fechaNoche(numero: number, inicio = CONFIG.inicio): string {
  const d = new Date(`${inicio}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 7 * Math.floor(numero / 2) + (numero % 2 ? 3 : 0));
  return d.toISOString().slice(0, 10);
}

/** Liga a doble vuelta por el método del círculo. */
export function calendario(ids: string[], azar: Azar): [string, string][][] {
  let equipos = barajar(azar, ids);
  const n = equipos.length;
  const ida: [string, string][][] = [];
  for (let ronda = 0; ronda < n - 1; ronda++) {
    const cruces: [string, string][] = [];
    for (let i = 0; i < n / 2; i++) {
      const a = equipos[i];
      const b = equipos[n - 1 - i];
      cruces.push((ronda + i) % 2 === 0 ? [a, b] : [b, a]);
    }
    ida.push(cruces);
    equipos = [equipos[0], equipos[n - 1], ...equipos.slice(1, n - 1)];
  }
  return [...ida, ...ida.map((cruces) => cruces.map(([a, b]) => [b, a] as [string, string]))];
}

export interface PartidoGuardado {
  id: string;
  semilla: string;
  fecha: string;
  local: string;
  visitante: string;
  marcador: [number, number];
  primero: 0 | 1;
  alineaciones: { pista: string[]; suplente: string | null }[];
  jugadas: ReturnType<typeof jugarAutomatico>["jugadas"];
  cambios: ReturnType<typeof jugarAutomatico>["cambios"];
  estadisticas: Record<string, LineaJugador>;
  mejor: string;
}

function jugar(mundo: Mundo, id: string, local: string, visitante: string, fecha: string, semilla: string): PartidoGuardado {
  const franquicias = Object.fromEntries(mundo.franquicias.map((f) => [f.id, f]));
  const equipo = (fid: string) => ({
    franquicia: fid,
    cartas: franquicias[fid].plantilla.map((jid) => mundo.jugadores[jid]),
    estilo: franquicias[fid].estilo,
  });
  const p = jugarAutomatico(equipo(local), equipo(visitante), crearAzar(`${semilla}-${id}`));
  // Alineación inicial: la actual, deshaciendo el cambio si lo hubo.
  const alineaciones = p.equipos.map((eq, lado) => {
    let pista = [...eq.pista];
    let suplente = eq.suplente;
    for (const c of p.cambios.filter((c) => c.equipo === lado)) {
      pista = pista.map((x) => (x === c.entra ? c.sale : x));
      suplente = c.entra;
    }
    return { pista, suplente };
  });
  const stats = estadisticas(p);
  const presentes = new Set([...p.jugadas.flatMap((j) => [j.tirador, j.defensor]), ...p.cambios.map((c) => c.entra)]);
  for (const jid of Object.keys(stats)) if (!presentes.has(jid)) delete stats[jid];
  return {
    id,
    semilla: `${semilla}-${id}`,
    fecha,
    local,
    visitante,
    marcador: p.puntos,
    primero: p.jugadas[0].equipo,
    alineaciones,
    jugadas: p.jugadas,
    cambios: p.cambios,
    estadisticas: stats,
    mejor: mejorDelPartido(p),
  };
}

// --- Estado de la temporada -----------------------------------------------------

export interface Serie {
  ronda: string;
  codigo: string;
  alto: string;
  bajo: string;
  victorias: [number, number];
  ganador: string | null;
  partidos: string[];
}

export interface Estado {
  temporada: number;
  semilla: string;
  /** Primer martes de la temporada. */
  inicio: string;
  calendario: { jornada: number; fecha: string; cruces: [string, string][] }[];
  /** Jornadas de liga regular ya jugadas. */
  jugadas: number;
  /** Noches jugadas en total (liga y playoffs), para fechar las siguientes. */
  noches: number;
  playoffs: { ronda: string; series: Serie[] }[];
  campeon: string | null;
}

export function crearTemporada(mundo: Mundo, numero = mundo.temporada, inicio = CONFIG.inicio): Estado {
  const semilla = `${mundo.semilla}-T${numero}`;
  const cruces = calendario(mundo.franquicias.map((f) => f.id), crearAzar(`calendario-${semilla}`));
  return {
    temporada: numero,
    semilla,
    inicio,
    calendario: cruces.map((c, i) => ({ jornada: i + 1, fecha: fechaNoche(i, inicio), cruces: c })),
    jugadas: 0,
    noches: 0,
    playoffs: [],
    campeon: null,
  };
}

export const terminada = (e: Estado) => e.campeon !== null;

/** Describe lo que se jugará en la siguiente noche. */
export function siguienteNoche(e: Estado): { fecha: string; descripcion: string } | null {
  if (terminada(e)) return null;
  if (e.jugadas < e.calendario.length) {
    const j = e.calendario[e.jugadas];
    return { fecha: j.fecha, descripcion: `Jornada ${j.jornada}` };
  }
  const ronda = rondaEnJuego(e);
  return { fecha: fechaNoche(e.noches + 1, e.inicio), descripcion: ronda ? nombreRonda(ronda.ronda) : "Cuartos de final" };
}

const nombreRonda = (r: string) => ({ cuartos: "Cuartos de final", semifinales: "Semifinales", final: "Finales Nimbo" })[r] ?? r;
const rondaEnJuego = (e: Estado) => e.playoffs.find((r) => r.series.some((s) => !s.ganador));

/** Juega la siguiente noche. Devuelve los partidos jugados (vacío si la temporada ha terminado). */
export function jugarNoche(mundo: Mundo, e: Estado, partidosPrevios: PartidoGuardado[]): PartidoGuardado[] {
  if (terminada(e)) return [];
  const t = e.temporada;

  // Liga regular.
  if (e.jugadas < e.calendario.length) {
    const j = e.calendario[e.jugadas];
    const jugados = j.cruces.map(([loc, vis], n) => jugar(mundo, `T${t}-J${String(j.jornada).padStart(2, "0")}-${n + 1}`, loc, vis, j.fecha, e.semilla));
    e.jugadas += 1;
    e.noches += 1;
    return jugados;
  }

  // Playoffs: abrir ronda si hace falta y jugar el siguiente partido de cada serie viva.
  let ronda = rondaEnJuego(e);
  if (!ronda) {
    const siguiente = RONDAS[e.playoffs.length];
    const cruces = crucesDeRonda(mundo, e, siguiente, partidosPrevios);
    ronda = { ronda: siguiente, series: cruces };
    e.playoffs.push(ronda);
    e.noches += 1; // noche de descanso antes de cada ronda
  }
  const fecha = fechaNoche(e.noches, e.inicio);
  const necesarias = CONFIG.victoriasPorRonda[ronda.ronda];
  const campos = necesarias === 2 ? [true, false, true] : [true, true, false, false, true];
  const jugados: PartidoGuardado[] = [];
  for (const s of ronda.series.filter((s) => !s.ganador)) {
    const n = s.partidos.length;
    const [loc, vis] = campos[n] ? [s.alto, s.bajo] : [s.bajo, s.alto];
    const p = jugar(mundo, `T${t}-PO-${s.codigo}-${n + 1}`, loc, vis, fecha, e.semilla);
    const ganador = p.marcador[0] > p.marcador[1] ? loc : vis;
    s.victorias[ganador === s.alto ? 0 : 1]++;
    s.partidos.push(p.id);
    if (Math.max(...s.victorias) === necesarias) s.ganador = s.victorias[0] > s.victorias[1] ? s.alto : s.bajo;
    jugados.push(p);
  }
  e.noches += 1;
  if (ronda.ronda === "final" && ronda.series[0].ganador) e.campeon = ronda.series[0].ganador;
  return jugados;
}

function crucesDeRonda(mundo: Mundo, e: Estado, ronda: string, partidos: PartidoGuardado[]): Serie[] {
  const tabla = clasificacion(mundo.franquicias.map((f) => f.id), partidos.filter((p) => p.id.includes("-J")));
  const sembrados = tabla.slice(0, CONFIG.playoffs).map((f) => f.franquicia);
  const mejor = (a: string, b: string): [string, string] => (sembrados.indexOf(a) < sembrados.indexOf(b) ? [a, b] : [b, a]);
  const serie = (codigo: string, [alto, bajo]: [string, string]): Serie => ({ ronda, codigo, alto, bajo, victorias: [0, 0], ganador: null, partidos: [] });
  if (ronda === "cuartos") {
    return [[0, 7], [3, 4], [1, 6], [2, 5]].map(([a, b], i) => serie(`C${i + 1}`, [sembrados[a], sembrados[b]]));
  }
  const previas = e.playoffs.at(-1)!.series.map((s) => s.ganador!);
  if (ronda === "semifinales") return [serie("S1", mejor(previas[0], previas[1])), serie("S2", mejor(previas[2], previas[3]))];
  return [serie("F", mejor(previas[0], previas[1]))];
}

// --- Lo que lee la web ---------------------------------------------------------

export interface FilaClasificacion {
  franquicia: string;
  posicion: number;
  v: number;
  d: number;
  pct: number;
  pf: number;
  pc: number;
  dif: number;
  local: [number, number];
  visitante: [number, number];
  racha: string;
  ultimos5: string;
}

export function clasificacion(ids: string[], partidos: PartidoGuardado[]): FilaClasificacion[] {
  const tabla = new Map(ids.map((id) => [id, { franquicia: id, v: 0, d: 0, pf: 0, pc: 0, local: [0, 0], visitante: [0, 0], res: [] as string[] }]));
  const duelos = new Map<string, number>();
  for (const p of partidos) {
    const ganaLocal = p.marcador[0] > p.marcador[1];
    for (const [fid, rivalId, esLocal, pf, pc] of [
      [p.local, p.visitante, true, p.marcador[0], p.marcador[1]],
      [p.visitante, p.local, false, p.marcador[1], p.marcador[0]],
    ] as const) {
      const fila = tabla.get(fid)!;
      const gana = ganaLocal === esLocal;
      gana ? fila.v++ : fila.d++;
      fila.pf += pf;
      fila.pc += pc;
      fila[esLocal ? "local" : "visitante"][gana ? 0 : 1]++;
      fila.res.push(gana ? "V" : "D");
      if (gana) duelos.set(`${fid}>${rivalId}`, (duelos.get(`${fid}>${rivalId}`) ?? 0) + 1);
    }
  }
  const filas = [...tabla.values()].map((f) => {
    const ultimo = f.res.at(-1) ?? "";
    let racha = 0;
    for (const r of [...f.res].reverse()) {
      if (r !== ultimo) break;
      racha++;
    }
    const jugados = f.v + f.d;
    return {
      franquicia: f.franquicia,
      v: f.v,
      d: f.d,
      pct: jugados ? Math.round((f.v / jugados) * 1000) / 1000 : 0,
      pf: f.pf,
      pc: f.pc,
      dif: f.pf - f.pc,
      local: f.local as [number, number],
      visitante: f.visitante as [number, number],
      racha: racha ? `${ultimo}${racha}` : "",
      ultimos5: f.res.slice(-5).join(""),
      posicion: 0,
    };
  });
  // Desempate: porcentaje, enfrentamientos directos entre empatados y diferencia de puntos.
  const directos = (f: FilaClasificacion) =>
    filas.filter((o) => o.pct === f.pct && o !== f).reduce((s, o) => s + (duelos.get(`${f.franquicia}>${o.franquicia}`) ?? 0), 0);
  filas.sort((a, b) => b.pct - a.pct || directos(b) - directos(a) || b.dif - a.dif);
  filas.forEach((f, i) => (f.posicion = i + 1));
  return filas;
}

export interface Acumulado extends LineaJugador {
  franquicia: string;
  pj: number;
  mejor: number;
  medias: { pts: number; paradas: number; dentro: number | null; fuera: number | null; acierto: number | null };
}

export function acumular(mundo: Mundo, partidos: PartidoGuardado[]): Record<string, Acumulado> {
  const totales: Record<string, Acumulado> = {};
  for (const p of partidos) {
    for (const [jid, l] of Object.entries(p.estadisticas)) {
      const acc = (totales[jid] ??= { ...lineaVacia(), franquicia: mundo.jugadores[jid].franquicia, pj: 0, mejor: 0, medias: null as never });
      acc.pj++;
      acc.pts += l.pts;
      acc.paradas += l.paradas;
      acc.marcados += l.marcados;
      acc.mates += l.mates ?? 0;
      acc.tapones += l.tapones ?? 0;
      for (const k of ["dentro", "fuera"] as const) acc[k] = [acc[k][0] + l[k][0], acc[k][1] + l[k][1]];
      if (p.mejor === jid) acc.mejor++;
    }
  }
  const r = (x: number) => Math.round(x * 10) / 10;
  const pct = ([a, i]: [number, number]) => (i ? Math.round((a / i) * 1000) / 1000 : null);
  for (const acc of Object.values(totales)) {
    const tiros: [number, number] = [acc.dentro[0] + acc.fuera[0], acc.dentro[1] + acc.fuera[1]];
    acc.medias = { pts: r(acc.pts / acc.pj), paradas: r(acc.paradas / acc.pj), dentro: pct(acc.dentro), fuera: pct(acc.fuera), acierto: pct(tiros) };
  }
  return totales;
}

/** Resumen de la temporada para la web, a partir del estado y de los partidos jugados. */
export function vista(mundo: Mundo, e: Estado, partidos: PartidoGuardado[]) {
  const liga = partidos.filter((p) => p.id.includes("-J"));
  const po = partidos.filter((p) => p.id.includes("-PO-"));
  const porJornada = new Map<number, string[]>();
  for (const p of liga) {
    const n = Number(p.id.split("-J")[1].split("-")[0]);
    porJornada.set(n, [...(porJornada.get(n) ?? []), p.id]);
  }
  return {
    temporada: e.temporada,
    calendario: e.calendario,
    jornadas: e.calendario
      .filter((j) => j.jornada <= e.jugadas)
      .map((j) => ({ jornada: j.jornada, fecha: j.fecha, partidos: porJornada.get(j.jornada) ?? [] })),
    proxima: siguienteNoche(e),
    clasificacion: clasificacion(mundo.franquicias.map((f) => f.id), liga),
    playoffs: { rondas: e.playoffs, campeon: e.campeon },
    estadisticas: { regular: acumular(mundo, liga), playoffs: acumular(mundo, po) },
  };
}

export type Temporada = ReturnType<typeof vista>;

/** Inicio de la siguiente temporada: el primer martes tras el verano. */
export function inicioSiguiente(e: Estado): string {
  const d = new Date(`${fechaNoche(e.noches - 1, e.inicio)}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 7 * CONFIG.semanasDeVerano);
  while (d.getUTCDay() !== 2) d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}
