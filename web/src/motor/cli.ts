// La liga desde la terminal: npm run liga -- <orden>
//
//   nueva [semilla]   crea el mundo y el calendario de la temporada, sin jugar nada (pretemporada)
//   siguiente         juega la siguiente noche (una jornada de liga o una noche de playoffs)
//   hasta <n>         juega hasta completar la jornada n de liga
//   todo              juega lo que quede de temporada, playoffs incluidos
//   verano            al acabar la temporada: evolución, contratos, draft, fichajes… y crea la siguiente
//   estilo <ID> <x>   cambia el estilo de juego de una franquicia (0 = todo dentro, 1 = todo fuera, cartas = lo que digan las cartas)
//   estado            muestra en qué punto está la temporada
import fs from "node:fs";
import path from "node:path";
import { generarMundo, type Mundo } from "./mundo.ts";
import { type Estado, type PartidoGuardado, crearTemporada, inicioSiguiente, jugarNoche, siguienteNoche, terminada, vista } from "./temporada.ts";
import { jugarVerano } from "./verano.ts";

const DATOS = path.resolve(import.meta.dirname, "../../../datos");
const RUTA_MUNDO = path.join(DATOS, "mundo.json");
const carpeta = (t: number) => path.join(DATOS, `temporada-${t}`);

const leer = <T>(ruta: string): T => JSON.parse(fs.readFileSync(ruta, "utf-8"));
const escribir = (ruta: string, contenido: unknown) => {
  fs.mkdirSync(path.dirname(ruta), { recursive: true });
  fs.writeFileSync(ruta, JSON.stringify(contenido));
};

function cargar() {
  const mundo = leer<Mundo>(RUTA_MUNDO);
  const dir = carpeta(mundo.temporada);
  const estado = leer<Estado>(path.join(dir, "estado.json"));
  const dirPartidos = path.join(dir, "partidos");
  const partidos = fs.existsSync(dirPartidos)
    ? fs.readdirSync(dirPartidos).sort().map((f) => leer<PartidoGuardado>(path.join(dirPartidos, f)))
    : [];
  return { mundo, estado, partidos };
}

function guardar(mundo: Mundo, estado: Estado, partidos: PartidoGuardado[], nuevos: PartidoGuardado[] = []) {
  const dir = carpeta(estado.temporada);
  for (const p of nuevos) escribir(path.join(dir, "partidos", `${p.id}.json`), p);
  escribir(path.join(dir, "estado.json"), estado);
  escribir(path.join(dir, "temporada.json"), vista(mundo, estado, [...partidos, ...nuevos]));
  escribir(RUTA_MUNDO, mundo);
}

const nombre = (mundo: Mundo, fid: string) => {
  const f = mundo.franquicias.find((x) => x.id === fid)!;
  return `${f.nombre} de ${f.ciudad}`;
};

function noche(mundo: Mundo, estado: Estado, partidos: PartidoGuardado[]) {
  const nuevos = jugarNoche(mundo, estado, partidos);
  if (!nuevos.length) return [];
  console.log(`\n${nuevos[0].fecha}`);
  for (const p of nuevos) {
    console.log(`  ${nombre(mundo, p.visitante).padEnd(28)} ${String(p.marcador[1]).padStart(2)} - ${String(p.marcador[0]).padEnd(2)} ${nombre(mundo, p.local)}`);
  }
  return nuevos;
}

function resumen(mundo: Mundo, estado: Estado) {
  const prox = siguienteNoche(estado);
  console.log(`\nTemporada ${estado.temporada} · jornadas de liga jugadas: ${estado.jugadas}/${estado.calendario.length}`);
  if (estado.campeon) console.log(`Campeón: ${nombre(mundo, estado.campeon)}`);
  else if (prox) console.log(`Siguiente: ${prox.descripcion} (${prox.fecha})`);
}

const [orden = "estado", ...args] = process.argv.slice(2);

switch (orden) {
  case "nueva": {
    const semilla = args[0] ?? "nimbo";
    fs.rmSync(DATOS, { recursive: true, force: true });
    const mundo = generarMundo(semilla);
    const estado = crearTemporada(mundo);
    guardar(mundo, estado, []);
    console.log(`Liga creada con la semilla "${semilla}": ${Object.keys(mundo.jugadores).length} cartas, ${estado.calendario.length} jornadas. Pretemporada.`);
    resumen(mundo, estado);
    break;
  }
  case "siguiente":
  case "hasta":
  case "todo": {
    const { mundo, estado, partidos } = cargar();
    const objetivo = orden === "hasta" ? Number(args[0]) : orden === "siguiente" ? -1 : Infinity;
    const nuevos: PartidoGuardado[] = [];
    do {
      const jugados = noche(mundo, estado, [...partidos, ...nuevos]);
      if (!jugados.length) break;
      nuevos.push(...jugados);
    } while (orden !== "siguiente" && !terminada(estado) && (objetivo === Infinity || estado.jugadas < objetivo));
    guardar(mundo, estado, partidos, nuevos);
    if (!nuevos.length) console.log("La temporada ya ha terminado.");
    resumen(mundo, estado);
    break;
  }
  case "verano": {
    const { mundo, estado, partidos } = cargar();
    if (!terminada(estado)) {
      console.error(`La Temporada ${estado.temporada} aún no ha terminado: el verano llega después de las Finales.`);
      process.exit(1);
    }
    const tabla = vista(mundo, estado, partidos).clasificacion;
    const informe = jugarVerano(mundo, tabla, estado.playoffs);
    const nueva = crearTemporada(mundo, mundo.temporada, inicioSiguiente(estado));
    guardar(mundo, nueva, []);
    escribir(path.join(carpeta(nueva.temporada), "verano.json"), informe);
    const n = (id: string) => mundo.jugadores[id].nombre;
    console.log(`Verano de la Temporada ${informe.temporada}:`);
    console.log(`  Retiradas: ${informe.retiradas.map((r) => n(r.jugador)).join(", ") || "ninguna"}`);
    console.log(`  Draft (1ª elección): ${n(informe.draft[0].jugador)} → ${nombre(mundo, informe.draft[0].franquicia)}`);
    console.log(`  Fichajes: ${informe.fichajes.length} · salidas: ${informe.salidas.length} · renovaciones: ${informe.renovaciones.length}`);
    console.log(`  Instalaciones nuevas: ${informe.instalaciones.map((i) => `${i.franquicia} ${i.tipo} ${i.nivel}`).join(", ") || "ninguna"}`);
    resumen(mundo, nueva);
    break;
  }
  case "estilo": {
    const { mundo, estado, partidos } = cargar();
    const [id, valor] = [args[0]?.toUpperCase(), args[1] === "cartas" ? null : Number(args[1])];
    const f = mundo.franquicias.find((x) => x.id === id);
    if (!f || !(valor === null || (valor >= 0 && valor <= 1))) {
      console.error("Uso: npm run liga -- estilo <ID> <0..1 | cartas>   (0 = todo dentro, 1 = todo fuera, cartas = lo que digan las cartas)");
      process.exit(1);
    }
    f.estilo.fuera = valor;
    guardar(mundo, estado, partidos);
    console.log(`${nombre(mundo, f.id)}: estilo de tiro exterior = ${valor ?? "lo que digan las cartas"}`);
    break;
  }
  case "estado": {
    const { mundo, estado } = cargar();
    resumen(mundo, estado);
    break;
  }
  default:
    console.error(`Orden desconocida: ${orden}. Mira el comentario al principio de src/motor/cli.ts.`);
    process.exit(1);
}
