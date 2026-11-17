// Los Amistosos de Navidad (motor/amistosos.ts), jugados al construir la web. Solo se publica lo que ya se ha jugado
// (la web se reconstruye cada tarde en diciembre); en local, con npm run dev, se ve todo.
import { AMISTOSOS, idAmistoso, jugarAmistoso, semillaAmistoso } from "../motor/amistosos.ts";
import { mundo } from "./liga";

const hoy = new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Madrid" });
/** ¿Se puede publicar ya lo de esta fecha? */
export const publicado = (fecha: string) => import.meta.env.DEV || fecha <= hoy;

/** Los 12, en orden de fecha (también los que aún no se han jugado: solo para lo que no enseña resultados). */
export const todos = AMISTOSOS.map(([fecha, local, visitante]) => ({
  id: idAmistoso(local, visitante),
  semilla: semillaAmistoso(local, visitante),
  fecha,
  local,
  visitante,
  p: jugarAmistoso(mundo, fecha, local, visitante),
}));
export type Amistoso = (typeof todos)[number];

export const amistosos = todos.filter((a) => publicado(a.fecha));
export const quedan = todos.length - amistosos.length;

/** Las cifras de un grupo de amistosos: para el carrusel de cómo van (27 dic) y el balance (1 ene). */
export function resumen(lista: Amistoso[]) {
  const ps = lista.map((a) => a.p);
  const subita = (p: Amistoso["p"]) => p.jugadas.length > 16;
  const total = (p: Amistoso["p"]) => p.marcador[0] + p.marcador[1];
  const dif = (p: Amistoso["p"]) => Math.abs(p.marcador[0] - p.marcador[1]);
  // Puntos de cada carta en todos los partidos, con su franquicia.
  const anotadores = new Map<string, number>();
  for (const p of ps) for (const [jid, s] of Object.entries(p.estadisticas)) anotadores.set(jid, (anotadores.get(jid) ?? 0) + s.pts);
  // Balance de cada franquicia.
  const tabla = new Map<string, { v: number; d: number; pf: number; pc: number }>();
  for (const p of ps)
    [p.local, p.visitante].forEach((fid, lado) => {
      const t = tabla.get(fid) ?? { v: 0, d: 0, pf: 0, pc: 0 };
      const gana = p.marcador[lado] > p.marcador[1 - lado];
      tabla.set(fid, { v: t.v + (gana ? 1 : 0), d: t.d + (gana ? 0 : 1), pf: t.pf + p.marcador[lado], pc: t.pc + p.marcador[1 - lado] });
    });
  return {
    jugados: lista.length,
    localGana: ps.filter((p) => p.marcador[0] > p.marcador[1]).length,
    mates: ps.reduce((s, p) => s + p.jugadas.filter((j) => j.mate).length, 0),
    tapones: ps.reduce((s, p) => s + p.jugadas.filter((j) => j.tapon).length, 0),
    subitas: lista.filter((a) => subita(a.p)),
    masPuntos: [...lista].sort((a, b) => total(b.p) - total(a.p))[0],
    paliza: [...lista].sort((a, b) => dif(b.p) - dif(a.p))[0],
    masAjustado: [...lista].sort((a, b) => dif(a.p) - dif(b.p))[0],
    anotadores: [...anotadores].sort((a, b) => b[1] - a[1]).map(([jid, pts]) => ({ jid, pts })),
    tabla: [...tabla].map(([fid, t]) => ({ fid, ...t })).sort((a, b) => b.v - a.v || b.pf - b.pc - (a.pf - a.pc) || b.pf - a.pf),
  };
}

/** Los carruseles con resultados: el día que se publican y cuántas diapositivas tienen. */
export const CARRUSELES = {
  van: { fecha: "2026-12-27", diapositivas: 6 },
  balance: { fecha: "2027-01-01", diapositivas: 7 },
} as const;
