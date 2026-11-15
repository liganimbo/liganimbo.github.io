// Exporta la crónica de un partido para el Reel «Crónica» (reels/src/datos/cronica.json).
// Uso: node scripts/cronica.ts                 (el partido de exhibición)
//      node scripts/cronica.ts T1-J03-2        (un partido jugado de la temporada)
//      node scripts/cronica.ts T1-J03-2 salida.json
import fs from "node:fs";
import path from "node:path";
import { jugarExhibicion } from "../src/motor/exhibicion.ts";
import { type Mundo, perfilEquipo } from "../src/motor/mundo.ts";
import type { PartidoGuardado } from "../src/motor/temporada.ts";

const [id = "exhibicion", salida = "../reels/src/datos/cronica.json"] = process.argv.slice(2);
const DATOS = path.resolve(import.meta.dirname, "../../datos");
const mundo: Mundo = JSON.parse(fs.readFileSync(path.join(DATOS, "mundo.json"), "utf8"));
const franquicias = Object.fromEntries(mundo.franquicias.map((f) => [f.id, f]));

let p: PartidoGuardado;
let contexto: string;
if (id === "exhibicion") {
  p = jugarExhibicion(mundo);
  contexto = "Partido de exhibición";
} else {
  const t = id.match(/^T(\d+)-/)?.[1] ?? String(mundo.temporada);
  p = JSON.parse(fs.readFileSync(path.join(DATOS, `temporada-${t}/partidos/${id}.json`), "utf8"));
  const jornada = id.match(/-J(\d+)-/)?.[1];
  contexto = jornada ? `Jornada ${Number(jornada)}` : "Playoffs";
}

const lados = [p.local, p.visitante];
const ganador = p.marcador[0] > p.marcador[1] ? 0 : 1;
const nombre = (jid: string) => mundo.jugadores[jid].nombre;

// La canasta decisiva: la que puso al ganador por delante para no volver a ir por detrás.
let decisiva = 0;
let delanteDesde: number | null = null;
p.jugadas.forEach((j, i) => {
  const delante = j.marcador[ganador] > j.marcador[1 - ganador];
  if (!delante) delanteDesde = null;
  else if (delanteDesde === null) delanteDesde = i;
});
decisiva = delanteDesde ?? p.jugadas.length - 1;

let maxVentaja = { puntos: 0, lado: 0, tras: 0 };
p.jugadas.forEach((j, i) => {
  const dif = j.marcador[0] - j.marcador[1];
  if (Math.abs(dif) > maxVentaja.puntos) maxVentaja = { puntos: Math.abs(dif), lado: dif > 0 ? 0 : 1, tras: i + 1 };
});

const ficha = (jid: string) => {
  const j = mundo.jugadores[jid];
  const f = franquicias[j.franquicia];
  return { nombre: j.nombre, equipo: f.id, meta: `${j.edad} años · ${j.origen}`, ataque: j.ataque, defensa: j.defensa, icono: j.icono, c1: f.colores[0], c2: f.colores[1] };
};
const d = p.jugadas[decisiva];
const mejor = p.estadisticas[p.mejor];

const cronica = {
  id: p.id,
  contexto,
  fecha: p.fecha,
  equipos: lados.map((fid) => ({
    id: fid,
    nombre: franquicias[fid].nombre,
    ciudad: franquicias[fid].ciudad,
    c1: franquicias[fid].colores[0],
    c2: franquicias[fid].colores[1],
    estilo: perfilEquipo(franquicias[fid], mundo.jugadores).estilo,
  })),
  jugadas: p.jugadas.map((j) => ({
    equipo: j.equipo,
    tirador: nombre(j.tirador),
    defensor: nombre(j.defensor),
    tipo: j.tipo,
    cierra: j.cierra,
    dados: j.dados,
    ataque: j.ataque,
    defensa: j.defensa,
    necesita: j.necesita,
    anota: j.anota,
    puntos: j.puntos,
    mate: j.mate,
    tapon: j.tapon,
    marcador: j.marcador,
  })),
  /** Ataques jugados antes del descanso. */
  descanso: p.cambios[0]?.tras ?? 8,
  cambios: p.cambios.map((c) => ({ equipo: c.equipo, entra: nombre(c.entra), sale: nombre(c.sale) })),
  final: p.marcador,
  ganador,
  muerteSubita: p.jugadas.length > 16,
  maxVentaja,
  decisiva: { indice: decisiva, tirador: ficha(d.tirador), defensor: ficha(d.defensor) },
  mejor: { nombre: nombre(p.mejor), pts: mejor.pts, paradas: mejor.paradas },
};

fs.writeFileSync(path.resolve(salida), JSON.stringify(cronica, null, 2) + "\n");
console.log(`${contexto}: ${cronica.equipos[1].nombre} ${p.marcador[1]}-${p.marcador[0]} ${cronica.equipos[0].nombre} → ${salida}`);
console.log(`Decisiva: ataque ${decisiva + 1}, ${nombre(d.tirador)} (${d.tipo})${d.mate ? ", mate" : ""}`);
