// Juega un amistoso de exhibición (no cuenta para la liga) y guarda su jugada decisiva para un Reel.
// Uso: node scripts/amistoso.ts LOCAL VISITANTE [salida]
// Prueba semillas hasta dar con un partido apretado que se decida en los últimos ataques.
import fs from "node:fs";
import path from "node:path";
import { crearAzar } from "../src/motor/azar.ts";
import { jugarAutomatico } from "../src/motor/ia.ts";
import { estadisticas, valorAtaque, valorDefensa } from "../src/motor/reglas.ts";
import type { Mundo } from "../src/motor/mundo.ts";

const [local = "TOR", visitante = "SGR", salida = "../reels/src/datos/amistoso.json"] = process.argv.slice(2);
const mundo: Mundo = JSON.parse(fs.readFileSync(path.resolve(import.meta.dirname, "../../datos/mundo.json"), "utf8"));
const franquicias = Object.fromEntries(mundo.franquicias.map((f) => [f.id, f]));
const equipo = (fid: string) => ({
  franquicia: fid,
  cartas: franquicias[fid].plantilla.map((jid) => mundo.jugadores[jid]),
  estilo: franquicias[fid].estilo,
});

for (let intento = 0; intento < 5000; intento++) {
  const p = jugarAutomatico(equipo(local), equipo(visitante), crearAzar(`amistoso-${local}-${visitante}-${intento}`));
  const ganador = p.puntos[0] > p.puntos[1] ? 0 : 1;
  // La decisiva: la canasta que puso al ganador por delante para no volver a ir por detrás.
  let decisiva: number | null = null;
  p.jugadas.forEach((j, i) => {
    const delante = j.marcador[ganador] > j.marcador[1 - ganador];
    if (!delante) decisiva = null;
    else if (decisiva === null) decisiva = i;
  });
  if (decisiva === null) continue;
  const d = p.jugadas[decisiva];
  const margen = Math.abs(p.puntos[0] - p.puntos[1]);
  // Apretado, con puntos, decidido en los dos últimos ataques y con un triple: lo más vistoso para un Reel.
  if (margen > 3 || decisiva < p.jugadas.length - 2 || d.tipo !== "fuera" || p.puntos[0] + p.puntos[1] < 18) continue;

  const carta = (id: string) => mundo.jugadores[id];
  const tirador = carta(d.tirador);
  const defensor = carta(d.defensor);
  const antes = decisiva > 0 ? p.jugadas[decisiva - 1].marcador : [0, 0];
  const stats = estadisticas(p);
  const mejor = Object.entries(stats).sort(([, a], [, b]) => b.pts + b.paradas - (a.pts + a.paradas))[0];
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
  const resumen = {
    semilla: `amistoso-${local}-${visitante}-${intento}`,
    equipos: [local, visitante].map((fid) => ({
      id: fid,
      nombre: franquicias[fid].nombre,
      ciudad: franquicias[fid].ciudad,
      c1: franquicias[fid].colores[0],
      c2: franquicias[fid].colores[1],
    })),
    /** Marcador [local, visitante] tras cada ataque. */
    marcadores: p.jugadas.map((j) => j.marcador),
    final: p.puntos,
    ganador,
    muerteSubita: p.jugadas.length > 16,
    decisiva: {
      numero: decisiva + 1,
      equipo: d.equipo,
      antes,
      despues: d.marcador,
      tirador: ficha(tirador),
      defensor: ficha(defensor),
      tipo: d.tipo,
      cierra: d.cierra,
      dados: d.dados,
      ataque: valorAtaque(tirador, d.tipo),
      defensa: valorDefensa(defensor, d.tipo, d.cierra),
      necesita: d.necesita,
      anota: d.anota,
      tiempoMuerto: !!d.tiempoMuerto,
    },
    mejor: { nombre: carta(mejor[0]).nombre, pts: mejor[1].pts, paradas: mejor[1].paradas },
  };
  fs.mkdirSync(path.dirname(path.resolve(salida)), { recursive: true });
  fs.writeFileSync(salida, JSON.stringify(resumen, null, 2) + "\n");
  console.log(`${resumen.semilla}: ${local} ${p.puntos[0]}-${p.puntos[1]} ${visitante} · decisiva en el ataque ${decisiva + 1} de ${p.jugadas.length}: ${tirador.nombre} ${d.tipo}, dados ${d.dados.join("+")}`);
  process.exit(0);
}
console.error("No he encontrado un amistoso así. Prueba con otros equipos.");
process.exit(1);
