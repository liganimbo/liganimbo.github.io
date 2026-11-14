// Busca jugadas para los Reels de «¿Dentro o fuera?»: el último ataque de un partido apretado en el que
// elegir bien importa (la mejor opción del atacante depende de lo que cierre la defensa, y al revés).
// Uso: node scripts/dentro-o-fuera.ts                 (lista candidatas)
//      node scripts/dentro-o-fuera.ts SEMILLA N salida  (guarda la jugada N de esa semilla para un Reel)
import fs from "node:fs";
import path from "node:path";
import { crearAzar } from "../src/motor/azar.ts";
import { jugarAutomatico } from "../src/motor/ia.ts";
import { REGLAS, type Tipo, necesita, probabilidad, valorAtaque, valorDefensa } from "../src/motor/reglas.ts";
import type { Mundo } from "../src/motor/mundo.ts";

const mundo: Mundo = JSON.parse(fs.readFileSync(path.resolve(import.meta.dirname, "../../datos/mundo.json"), "utf8"));
const franquicias = Object.fromEntries(mundo.franquicias.map((f) => [f.id, f]));
const equipo = (fid: string) => ({
  franquicia: fid,
  cartas: franquicias[fid].plantilla.map((jid) => mundo.jugadores[jid]),
  estilo: franquicias[fid].estilo,
});
const TIPOS: Tipo[] = ["dentro", "fuera"];

/** Jugadas que sirven: último ataque del segundo equipo (o de muerte súbita) perdiendo de 1 o de 2, y pulso de verdad. */
function candidatas(semilla: string) {
  const [local, visitante] = semilla.split("-").slice(1, 3);
  const p = jugarAutomatico(equipo(local), equipo(visitante), crearAzar(semilla));
  const fuera: { n: number; datos: ReturnType<typeof resumir> }[] = [];
  p.jugadas.forEach((d, i) => {
    if (i !== p.jugadas.length - 1 || i % 2 === 0) return; // el último ataque, y que sea el que cierra la ronda
    const antes = i > 0 ? p.jugadas[i - 1].marcador : [0, 0];
    const pierde = antes[1 - d.equipo] - antes[d.equipo];
    if (pierde !== 1 && pierde !== 2) return;
    const tirador = mundo.jugadores[d.tirador];
    const defensor = mundo.jugadores[d.defensor];
    // Lo que vale cada tiro para el atacante: ganar es 1; empatar (muerte súbita) es medio.
    const vale = (tipo: Tipo) => (REGLAS.puntos[tipo] > pierde ? 1 : REGLAS.puntos[tipo] === pierde ? 0.5 : 0);
    const valor = (tipo: Tipo, cierra: Tipo) => vale(tipo) * probabilidad(necesita(tirador, defensor, tipo, cierra));
    const pulso = valor("fuera", "dentro") > valor("dentro", "dentro") && valor("dentro", "fuera") > valor("fuera", "fuera");
    if (!pulso) return;
    fuera.push({ n: i, datos: resumir(semilla, p, i, pierde) });
  });
  return fuera;
}

function resumir(semilla: string, p: ReturnType<typeof jugarAutomatico>, i: number, pierde: number) {
  const d = p.jugadas[i];
  const tirador = mundo.jugadores[d.tirador];
  const defensor = mundo.jugadores[d.defensor];
  const ficha = (j: typeof tirador) => ({
    nombre: j.nombre,
    equipo: j.franquicia,
    meta: `${j.edad} años · ${j.origen}`,
    ataque: j.ataque,
    defensa: j.defensa,
    icono: j.icono,
    c1: franquicias[j.franquicia].colores[0],
    c2: franquicias[j.franquicia].colores[1],
  });
  const eq = (fid: string) => ({ id: fid, nombre: franquicias[fid].nombre, ciudad: franquicias[fid].ciudad, c1: franquicias[fid].colores[0], c2: franquicias[fid].colores[1] });
  const local = p.equipos[0].franquicia;
  const visitante = p.equipos[1].franquicia;
  return {
    semilla,
    jugada: i,
    equipos: [eq(local), eq(visitante)],
    /** Equipo que ataca (0 local, 1 visitante). */
    ataca: d.equipo,
    antes: i > 0 ? p.jugadas[i - 1].marcador : [0, 0],
    despues: d.marcador,
    pierde,
    muerteSubita: i >= REGLAS.ataquesPorEquipo * 2,
    tirador: ficha(tirador),
    defensor: ficha(defensor),
    /** Lo que tienen que sumar los dados en cada caso: tabla[tipo][cierra]. */
    tabla: Object.fromEntries(TIPOS.map((t) => [t, Object.fromEntries(TIPOS.map((c) => [c, necesita(tirador, defensor, t, c)]))])) as Record<Tipo, Record<Tipo, number>>,
    tipo: d.tipo,
    cierra: d.cierra,
    dados: d.dados,
    ataque: valorAtaque(tirador, d.tipo),
    defensa: valorDefensa(defensor, d.tipo, d.cierra),
    necesita: d.necesita,
    anota: d.anota,
    tiempoMuerto: !!d.tiempoMuerto,
  };
}

const [semilla, n, salida] = process.argv.slice(2);
if (semilla) {
  const c = candidatas(semilla).find((x) => x.n === Number(n));
  if (!c) throw new Error(`La semilla ${semilla} no tiene una jugada ${n} que sirva`);
  fs.mkdirSync(path.dirname(path.resolve(salida)), { recursive: true });
  fs.writeFileSync(salida, JSON.stringify(c.datos, null, 2) + "\n");
  console.log(`Guardada en ${salida}`);
  process.exit(0);
}

// Lista: una por pareja de equipos, como mucho.
const ids = mundo.franquicias.map((f) => f.id);
for (const a of ids)
  for (const b of ids) {
    if (a === b) continue;
    for (let k = 0; k < 40; k++) {
      const s = `dof-${a}-${b}-${k}`;
      const [c] = candidatas(s);
      if (!c) continue;
      const d = c.datos;
      const t = d.tabla;
      console.log(
        `${s} ${c.n} · ${d.tirador.nombre} (A${d.tirador.ataque} ${d.tirador.icono ?? "-"}) vs ${d.defensor.nombre} (D${d.defensor.defensa} ${d.defensor.icono ?? "-"}) · pierde de ${d.pierde}${d.muerteSubita ? " (m.s.)" : ""} · ` +
          `dentro ${t.dentro.dentro}/${t.dentro.fuera} fuera ${t.fuera.dentro}/${t.fuera.fuera} · tira ${d.tipo}, cierra ${d.cierra}, dados ${d.dados.join("+")} ${d.anota ? "ENTRA" : "no"}`,
      );
      break;
    }
  }
