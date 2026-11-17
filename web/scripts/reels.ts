// Guiones de los Reels de diciembre (PUBLICACIONES.md), sacados del motor: reels/src/datos/diciembre.json.
// Uso: node scripts/reels.ts
//
// Cada Reel es una lista de escenas con su texto y su duración (lo que se tarda en leerlo con calma). Remotion las pinta
// (reels/src/reel) y añade el bucle: el Reel acaba volviendo a su primera escena.
// Las jugadas son de verdad: partidos que juega el motor con una semilla que se puede comprobar. Los amistosos usan su
// semilla fija (navidad-2026-LOCAL-VISITANTE), sin buscar otra que dé un partido más bonito.
import fs from "node:fs";
import path from "node:path";
import { crearAzar } from "../src/motor/azar.ts";
import { type Estilo, describirFirma, estrella, finalApretado, jugarAutomatico } from "../src/motor/ia.ts";
import { AMISTOSOS, semillaAmistoso } from "../src/motor/amistosos.ts";
import { type Mundo, valorCarta } from "../src/motor/mundo.ts";
import { type Jugada, type Partido, type Tipo, REGLAS, castigo, estadisticas, mejorDelPartido, necesita, valorAtaque, valorDefensa } from "../src/motor/reglas.ts";

const mundo: Mundo = JSON.parse(fs.readFileSync(path.resolve(import.meta.dirname, "../../datos/mundo.json"), "utf8"));
const SALIDA = path.resolve(import.meta.dirname, "../../reels/src/datos/diciembre.json");
const franquicias = Object.fromEntries(mundo.franquicias.map((f) => [f.id, f]));
const IDS = mundo.franquicias.map((f) => f.id);
const TIPOS: Tipo[] = ["dentro", "fuera"];

// --- Piezas de los guiones ----------------------------------------------------------

const equipo = (fid: string) => ({ id: fid, nombre: franquicias[fid].nombre, c1: franquicias[fid].colores[0], c2: franquicias[fid].colores[1] });
const ficha = (jid: string) => {
  const j = mundo.jugadores[jid];
  return { nombre: j.nombre, equipo: j.franquicia, meta: `${j.edad} años · ${j.origen}`, ataque: j.ataque, defensa: j.defensa, icono: j.icono, c1: franquicias[j.franquicia].colores[0], c2: franquicias[j.franquicia].colores[1] };
};
type Equipo = ReturnType<typeof equipo>;
type Ficha = ReturnType<typeof ficha>;

type Escena = { segundos?: number; acento?: string } & (
  | { tipo: "titular"; lineas: string[]; colores?: ("texto" | "oro" | "lila")[]; etiqueta?: string; pie?: string; escudos?: Equipo[] }
  | { tipo: "cartas"; titulo: string; cartas: Ficha[]; roles: string[]; pie?: string }
  | { tipo: "marcador"; etiqueta: string; equipos: Equipo[]; puntos: number[]; resalta?: number; titulo?: string; pie?: string }
  | { tipo: "tabla"; titulo: string; tirador: string; tabla: Record<Tipo, Record<Tipo, number>> }
  | { tipo: "pregunta"; lineas: string[]; pie: string }
  | { tipo: "revela"; titulo: string; tira: { quien: string; tipo: Tipo }; cierra: { quien: string; tipo: Tipo }; pie: string; cuenta: ReturnType<typeof cuentaDe> }
  | { tipo: "dados"; dados: number[]; tirada: ReturnType<typeof tiradaDe>; pie?: string }
  | { tipo: "tira"; titulo: string; quien: string; tiro: Tipo; pie: string }
  | { tipo: "tiros"; titulo: string; equipos: Equipo[]; inicio: number[]; tiros: ReturnType<typeof tiroDe>[]; porTiro: number }
  | { tipo: "cierres"; titulo: string; ataque: number; filas: { cierra: Tipo; suma: string; defensa: number; anota: boolean; pie: string }[] }
  | { tipo: "resultado"; titulo: string; bien: boolean; equipos?: Equipo[]; puntos?: number[]; resalta?: number; pie?: string }
  | { tipo: "lista"; titulo: string; items: { escudo?: Equipo; carta?: Ficha; titulo: string; texto: string }[] }
  | { tipo: "carta"; rango?: string; carta: Ficha; titulo: string; pie?: string }
);
type Reel = { id: string; formato: string; fecha: string; titulo: string; texto: string; escenas: Escena[] };

/** Segundos para leer con calma (menos de 2 palabras por segundo) lo que pone en pantalla, con un mínimo por tipo para que se vea lo que pasa. */
const MINIMO: Record<Escena["tipo"], number> = { titular: 3, cartas: 4.5, marcador: 3.5, tabla: 7.5, pregunta: 4.5, revela: 10, dados: 6, resultado: 3.5, lista: 2, carta: 3.8, tira: 4, cierres: 9, tiros: 3 };
/** Lo que tarda en salir el texto que hay que leer (las cartas se giran antes, los dados ruedan antes). */
const RETRASO: Partial<Record<Escena["tipo"], number>> = { tabla: 3.4, revela: 4, dados: 4.5, tira: 1.2, cierres: 0.5 };
const PALABRAS_POR_SEGUNDO = 1.8;
function aLeer(e: Escena): string[] {
  const comunes = [("titulo" in e && e.titulo) || "", ("etiqueta" in e && e.etiqueta) || "", ("pie" in e && e.pie) || ""];
  if (e.tipo === "titular" || e.tipo === "pregunta") return [...e.lineas, ...comunes];
  // La cuenta de la defensa y la del ataque también se leen, con sus números.
  if (e.tipo === "revela") return [e.tira.quien, e.cierra.quien, "Defensa de", e.cuenta.defensor, e.cuenta.muro ? "de Muro" : "", e.cuenta.cierre ? "por acertar" : "", ...comunes];
  if (e.tipo === "dados") {
    const t = e.tirada;
    const contra = t.defensa === undefined ? [] : ["Defensa contra", t.anota ? "llega" : "no llega"];
    return ["Ataque de", t.tirador, t.icono ? "de " + t.icono : "", t.castigo ? "de fuera" : "", ...contra, ...comunes];
  }
  if (e.tipo === "cierres") return [e.titulo, ...e.filas.flatMap((f) => ["Si cierras", f.cierra, "Defensa", f.suma, "contra", f.pie])];
  if (e.tipo === "lista") return [...e.items.flatMap((x) => [x.titulo, x.texto]), ...comunes];
  return comunes;
}
function duracion(e: Escena): number {
  const palabras = aLeer(e).join(" ").split(/\s+/).filter((w) => /\p{L}/u.test(w)).length;
  const extra = e.tipo === "lista" ? 1.8 * e.items.length : 0;
  const leer = (RETRASO[e.tipo] ?? 0) + 1.5 + palabras / PALABRAS_POR_SEGUNDO;
  return Math.round(Math.max(MINIMO[e.tipo], leer) * 10 + extra * 10) / 10;
}

// «los Búhos», «el Vendaval»: el artículo y el verbo dependen de si el nombre es plural.
const plural = (fid: string) => franquicias[fid].nombre.endsWith("s");
const del = (fid: string) => `${plural(fid) ? "de los" : "del"} ${franquicias[fid].nombre}`;
const los = (fid: string) => `${plural(fid) ? "los" : "el"} ${franquicias[fid].nombre}`;
const Los = (fid: string) => los(fid)[0].toUpperCase() + los(fid).slice(1);
const verbo = (fid: string, singular: string, plu: string) => (plural(fid) ? plu : singular);
const nombre = (jid: string) => mundo.jugadores[jid].nombre.split(" ")[0];
const deTipo = (t: Tipo) => (t === "fuera" ? "de 3" : "dentro");
const HASHTAGS = "#LigaNimbo #baloncesto #3x3 #baloncesto3x3";

const equipoAuto = (fid: string, estilo?: Estilo) => ({ franquicia: fid, cartas: franquicias[fid].plantilla.map((j) => mundo.jugadores[j]), estilo: estilo ?? franquicias[fid].estilo });
const jugar = (local: string, visitante: string, semilla: string) => jugarAutomatico(equipoAuto(local), equipoAuto(visitante), crearAzar(semilla));
const antesDe = (p: Partido, i: number) => (i > 0 ? p.jugadas[i - 1].marcador : [0, 0]);

/** Recorre partidos de prueba hasta dar con una jugada que cumpla `vale`. */
function buscar(vale: (p: Partido, j: Jugada, i: number) => boolean, prefijo: string, parejas: [string, string][] = todasLasParejas()) {
  for (let k = 0; k < 60; k++)
    for (const [a, b] of parejas) {
      const semilla = `${prefijo}-${a}-${b}-${k}`;
      const p = jugar(a, b, semilla);
      const i = p.jugadas.findIndex((j, n) => vale(p, j, n));
      if (i >= 0) return { p, i, j: p.jugadas[i], semilla };
    }
  throw new Error(`No encuentro una jugada para ${prefijo}`);
}
function todasLasParejas(): [string, string][] {
  return IDS.flatMap((a) => IDS.filter((b) => b !== a).map((b) => [a, b] as [string, string]));
}

/** La defensa total al descubrir qué se tira y qué se cierra. */
function cuentaDe(j: Jugada) {
  const de = mundo.jugadores[j.defensor];
  return {
    defensor: nombre(j.defensor),
    base: REGLAS.baseDefensa,
    defensa: de.defensa,
    muro: de.icono === "Muro" && (!REGLAS.muroSoloDentro || j.tipo === "dentro") ? REGLAS.bonusMuro : 0,
    cierre: j.cierra === j.tipo ? REGLAS.bonusCierre : 0,
    total: j.defensa,
  };
}

/** La tirada: la defensa que hay que alcanzar y el ataque total con los dados (con el -2, de fuera). Sin defensa, solo el ataque. */
function tiradaDe(j: Jugada, conDefensa = true) {
  const at = mundo.jugadores[j.tirador];
  const ataque = valorAtaque(at, j.tipo);
  return {
    tirador: nombre(j.tirador),
    ataque: at.ataque,
    icono: ataque > at.ataque ? at.icono : null,
    bonus: ataque - at.ataque,
    total: j.ataque,
    defensa: conDefensa ? j.defensa : undefined,
    castigo: castigo(j.tipo),
    anota: conDefensa ? j.anota : undefined,
  };
}
const dadosDe = (j: Jugada, pie?: string): Escena => ({ tipo: "dados", dados: j.dados, tirada: tiradaDe(j), pie });

/** Escenas de una jugada: quién tira y contra quién, qué eligieron con su cuenta, y los dados. */
function escenasJugada(p: Partido, i: number, opciones: { titulo?: string; pieCartas?: string } = {}): Escena[] {
  const j = p.jugadas[i];
  const fa = p.equipos[j.equipo].franquicia;
  const fd = p.equipos[1 - j.equipo].franquicia;
  return [
    { tipo: "cartas", titulo: opciones.titulo ?? `Tira ${nombre(j.tirador)}`, cartas: [ficha(j.tirador), ficha(j.defensor)], roles: ["Tira", "Contra"], pie: opciones.pieCartas, acento: franquicias[fa].colores[0] },
    {
      tipo: "revela",
      titulo: "Los dos eligen en secreto",
      tira: { quien: `${nombre(j.tirador)} tira`, tipo: j.tipo },
      cierra: { quien: `${franquicias[fd].nombre} cierra${plural(fd) ? "n" : ""}`, tipo: j.cierra },
      pie: j.cierra === j.tipo ? "La defensa acierta: +2" : "La defensa falla",
      cuenta: cuentaDe(j),
    },
    dadosDe(j),
  ];
}

function exclamacion(j: Jugada) {
  return j.mate ? "¡Mate!" : j.tapon ? "¡Tapón!" : j.anota ? (j.tipo === "fuera" ? "¡Triple!" : "¡Canasta!") : "¡No entra!";
}

/** El primer titular del Reel, que también lo cierra (el bucle). */
const gancho = (lineas: string[], extra: Partial<Extract<Escena, { tipo: "titular" }>> = {}): Escena => ({ tipo: "titular", lineas, colores: ["texto", "lila"], ...extra });

// --- T · Tráiler -----------------------------------------------------------------------

function trailer(): Escena[] {
  // Un triple que entra con la defensa cerrando dentro: la decisión bien tomada.
  const { p, i } = buscar((p, j) => j.anota && j.tipo === "fuera" && j.cierra === "dentro" && j.necesita >= 7, "trailer");
  const [cartas, revela, dados] = escenasJugada(p, i);
  return [
    gancho(["Tú eliges", "el tiro."]),
    { ...cartas, titulo: "Cartas de verdad", pie: "48 cartas · 12 ciudades · una liga mixta de 3x3" } as Escena,
    { ...revela, titulo: "¿Dentro o fuera?" } as Escena,
    dados,
    { tipo: "resultado", titulo: exclamacion(p.jugadas[i]), bien: true },
    { tipo: "titular", lineas: ["Los dados", "lo cuentan."], colores: ["texto", "oro"], etiqueta: "Liga Nimbo · Temporada 1 · 12 de enero" },
  ];
}

// --- R · Una regla por Reel --------------------------------------------------------------

function reglaFarol(): Escena[] {
  const { p, i } = buscar((p, j) => j.cierra === j.tipo && !j.anota && j.tipo === "fuera", "farol");
  const j = p.jugadas[i];
  return [
    gancho(["Cada ataque", "es un farol."]),
    { tipo: "titular", lineas: ["Quien ataca elige", "en secreto:"], pie: "dentro, que vale 2… o fuera, que vale 3." },
    { tipo: "titular", lineas: ["Quien defiende", "elige qué cierra."], colores: ["texto", "lila"], pie: "Si acierta, su defensa suma +2." },
    ...escenasJugada(p, i, { titulo: `${nombre(j.tirador)} va a por el triple` }),
    { tipo: "resultado", titulo: exclamacion(j), bien: false, pie: `${Los(p.equipos[1 - j.equipo].franquicia)} lo ${verbo(p.equipos[1 - j.equipo].franquicia, "vio", "vieron")} venir.` },
    { tipo: "titular", lineas: ["¿Vas a lo seguro", "o le lees la mente?"], colores: ["texto", "oro"] },
  ];
}

function reglaCuenta(): Escena[] {
  const { p, i } = buscar((p, j) => j.anota && j.tipo === "dentro" && j.cierra === "dentro" && j.dados[0] + j.dados[1] === j.necesita, "cuenta");
  const j = p.jugadas[i];
  const at = mundo.jugadores[j.tirador];
  const de = mundo.jugadores[j.defensor];
  return [
    gancho(["Dos dados", "y una cuenta."]),
    { tipo: "cartas", titulo: "Ataque contra Defensa", cartas: [ficha(j.tirador), ficha(j.defensor)], roles: ["Tira", "Contra"] },
    { tipo: "titular", lineas: ["Ataque:", "dos dados + su Ataque"], colores: ["oro", "texto"], pie: `${nombre(j.tirador)}: dados + ${valorAtaque(at, j.tipo)}${at.icono === "Aro" ? " (su Aro suma 2 al tirar dentro)" : ""}` },
    { tipo: "titular", lineas: ["Defensa:", "5 + su Defensa"], colores: ["lila", "texto"], pie: `${nombre(j.defensor)}: 5 + ${de.defensa}${de.icono === "Muro" ? " + 2 de su Muro" : ""} + 2 porque ha cerrado dentro = ${j.defensa}` },
    dadosDe(j, "Justo lo que valía la defensa. Dentro, con igualarla basta."),
    { tipo: "resultado", titulo: "¡Entra!", bien: true, pie: `Entra si iguala la defensa. De fuera, la tirada tiene -${REGLAS.castigoFuera}.` },
    { tipo: "titular", lineas: ["Así de simple.", "Así de tenso."], colores: ["texto", "oro"] },
  ];
}

function reglaFichas(): Escena[] {
  const item = (fid: string) => ({ escudo: equipo(fid), titulo: franquicias[fid].nombre, texto: describirFirma(franquicias[fid].estilo.firma!) });
  return [
    gancho(["Cada carta", "tira dos veces."]),
    { tipo: "titular", lineas: ["4 cartas.", "8 tiros."], colores: ["texto", "oro"], pie: "Cada equipo ataca 8 veces: no puedes tirar siempre con la misma." },
    { tipo: "titular", lineas: ["¿Gastas a tu estrella", "pronto o al final?"], colores: ["texto", "lila"] },
    { tipo: "lista", titulo: "Cada franquicia lo tiene claro", items: [item("OST"), item("EBA"), item("FER")] },
    { tipo: "titular", lineas: ["¿Y tú?", "¿Cuándo la gastas?"], colores: ["texto", "oro"] },
  ];
}

function reglaIconos(): Escena[] {
  const mejorCon = (icono: string) =>
    Object.values(mundo.jugadores)
      .filter((j) => j.estado === "activa" && j.icono === icono)
      .sort((a, b) => valorCarta(b) - valorCarta(a))[0].id;
  return [
    gancho(["Tres iconos.", "Tres ventajas."]),
    {
      tipo: "lista",
      titulo: "Algunas cartas tienen icono",
      items: [
        { carta: ficha(mejorCon("Tiro")), titulo: "Tiro", texto: `+${REGLAS.bonusTiro} al tirar de fuera` },
        { carta: ficha(mejorCon("Aro")), titulo: "Aro", texto: `+${REGLAS.bonusAro} al tirar de dentro` },
        { carta: ficha(mejorCon("Muro")), titulo: "Muro", texto: `+${REGLAS.bonusMuro} al defender tiros de dentro` },
      ],
    },
    { tipo: "titular", lineas: ["Valen más o menos", "un punto de carta."], colores: ["texto", "lila"], pie: "Medido con miles de partidos simulados." },
    { tipo: "titular", lineas: ["¿Cuál te llevas", "a tu equipo?"], colores: ["texto", "oro"] },
  ];
}

function reglaDuelos(): Escena[] {
  const { p } = buscar((p, j, i) => i === 0, "duelos", [["SGR", "OST"]]);
  const local = p.equipos[0];
  // Los duelos del principio: deshacer el cambio del descanso.
  const cambio = p.cambios.find((c) => c.equipo === 0);
  const pista = local.pista.map((id) => (cambio && id === cambio.entra ? cambio.sale : id));
  // El primer ataque del visitante: quien tira y su pareja de duelo.
  const pareja = p.jugadas.find((j) => j.equipo === 1 && pista.includes(j.defensor))!;
  return [
    gancho(["En casa,", "eliges los duelos."]),
    { tipo: "titular", lineas: ["El local empareja", "a los seis de pista."], pie: "Cada uno marca a su pareja, y su pareja le marca a su vez." },
    { tipo: "cartas", titulo: "Duelo en Sierra Gris", cartas: [ficha(pareja.defensor), ficha(pareja.tirador)], roles: ["Lobos", "Coronas"], pie: `${nombre(pareja.defensor)} defiende a ${nombre(pareja.tirador)}, y ${nombre(pareja.tirador)} defiende a ${nombre(pareja.defensor)}.` },
    { tipo: "titular", lineas: ["En el descanso,", "vuelve a elegir."], colores: ["texto", "lila"], pie: "Y ya sabe a quién le quedan tiros." },
    { tipo: "titular", lineas: ["Por eso el local", "gana el 59 %."], colores: ["texto", "oro"], pie: "Atacar primero no da nada: el visitante empieza." },
  ];
}

function reglaDescanso(): Escena[] {
  const { p } = buscar((p) => p.cambios.length > 0 && mundo.jugadores[p.cambios[0].sale].ataque >= 5, "descanso");
  const c = p.cambios[0];
  return [
    gancho(["En el descanso,", "el suplente entra."]),
    { tipo: "titular", lineas: ["Sí o sí."], colores: ["oro"], pie: "Con sus dos tiros intactos." },
    { tipo: "titular", lineas: ["Sale quien", "ya no tiene tiros."], colores: ["texto", "lila"], pie: "Siempre hay alguien: 4 tiros entre 3 obligan a que alguien repita." },
    { tipo: "cartas", titulo: `Cambio en ${franquicias[p.equipos[c.equipo].franquicia].nombre}`, cartas: [ficha(c.sale), ficha(c.entra)], roles: ["Sale", "Entra"], pie: `${nombre(c.sale)} ya ha gastado sus tiros. Fuera, aunque sea de las buenas.` },
    { tipo: "titular", lineas: ["¿Sacas a tu tirador", "o lo dejas defendiendo?"], colores: ["texto", "oro"] },
  ];
}

function reglaMuerteSubita(): Escena[] {
  const { p, i } = buscar((p, j, i) => i === p.jugadas.length - 1 && i >= 2 * REGLAS.ataquesPorEquipo && j.anota && !j.desempate, "subita");
  const j = p.jugadas[i];
  const empate = p.jugadas[2 * REGLAS.ataquesPorEquipo - 1].marcador;
  const fa = p.equipos[j.equipo].franquicia;
  return [
    gancho(["Empate", "tras 8 ataques."]),
    { tipo: "marcador", etiqueta: "Final… o no", equipos: p.equipos.map((e) => equipo(e.franquicia)), puntos: empate, titulo: "Muerte súbita" },
    { tipo: "titular", lineas: ["Un ataque más", "cada uno."], pie: "Puede tirar cualquiera de pista, tenga tiros o no." },
    ...escenasJugada(p, i, { titulo: `${Los(fa)} ${verbo(fa, "elige", "eligen")} a ${nombre(j.tirador)}` }),
    { tipo: "resultado", titulo: exclamacion(j), bien: true, equipos: p.equipos.map((e) => equipo(e.franquicia)), puntos: j.marcador, resalta: j.equipo },
    { tipo: "titular", lineas: ["¿Y si anotan", "los dos?"], colores: ["texto", "oro"], pie: `Gana quien superó a su defensa por más, y suma ${REGLAS.puntoDesempate} punto. Si fallan los dos, quien se quedó más cerca.` },
  ];
}

function reglaMatesTapones(): Escena[] {
  const mate = buscar((p, j) => j.mate, "mate");
  const tapon = buscar((p, j) => j.tapon, "tapon");
  const jm = mate.j;
  const jt = tapon.j;
  return [
    gancho(["Mates", "y tapones."]),
    { tipo: "titular", lineas: ["Mate:"], colores: ["oro"], pie: `Canasta de dentro que supera a la defensa por ${REGLAS.margenMate} o más.` },
    { tipo: "cartas", titulo: `${nombre(jm.tirador)} contra ${nombre(jm.defensor)}`, cartas: [ficha(jm.tirador), ficha(jm.defensor)], roles: ["Tira", "Contra"] },
    dadosDe(jm, `${jm.ataque - jm.defensa} por encima de la defensa.`),
    { tipo: "resultado", titulo: "¡Mate!", bien: true },
    { tipo: "titular", lineas: ["Tapón:"], colores: ["lila"], pie: `Tiro de dentro que se queda corto por ${REGLAS.margenTapon} o más.` },
    dadosDe(jt, `Se queda ${jt.defensa - jt.ataque} por debajo: tapón de ${nombre(jt.defensor)}.`),
    { tipo: "resultado", titulo: "¡Tapón!", bien: false, pie: "No cambian el marcador. Pero se cantan." },
  ];
}

// --- DF · ¿Dentro o fuera? ------------------------------------------------------------------

/** El último ataque de un partido apretado en el que elegir bien importa: la mejor opción depende de lo que cierre la defensa. */
function esPulso(p: Partido, j: Jugada, i: number) {
  if (i !== p.jugadas.length - 1 || i % 2 === 0) return false;
  const antes = antesDe(p, i);
  const pierde = antes[1 - j.equipo] - antes[j.equipo];
  if (pierde !== 1 && pierde !== 2) return false;
  const at = mundo.jugadores[j.tirador];
  const de = mundo.jugadores[j.defensor];
  const vale = (tipo: Tipo) => (REGLAS.puntos[tipo] > pierde ? 1 : REGLAS.puntos[tipo] === pierde ? 0.5 : 0);
  const valor = (tipo: Tipo, cierra: Tipo) => vale(tipo) * probabilidadDe(necesita(at, de, tipo, cierra));
  return valor("fuera", "dentro") > valor("dentro", "dentro") && valor("dentro", "fuera") > valor("fuera", "fuera");
}
/**
 * Un pulso en el que lo que cierres decide: con esos dados, cerrando lo que tira se para y cerrando lo otro entra.
 * Y sin tiempo muerto de por medio (si le quedara, fallando habría repetido la tirada).
 */
function esDentroOFuera(p: Partido, j: Jugada, i: number) {
  if (!esPulso(p, j, i) || i >= 2 * REGLAS.ataquesPorEquipo || j.tiempoMuerto || !p.equipos[j.equipo].tiempoMuertoUsado) return false;
  const de = mundo.jugadores[j.defensor];
  return j.ataque >= valorDefensa(de, j.tipo, otro(j.tipo)) && j.ataque < valorDefensa(de, j.tipo, j.tipo);
}
const otro = (t: Tipo): Tipo => (t === "dentro" ? "fuera" : "dentro");
const FORMAS_DE_SUMAR = [0, 0, 1, 2, 3, 4, 5, 6, 5, 4, 3, 2, 1];
const probabilidadDe = (n: number) => (n <= 2 ? 1 : n > 12 ? 0 : FORMAS_DE_SUMAR.slice(n).reduce((s, x) => s + x, 0) / 36);

/** Lo que comparten las dos partes: el gancho, el marcador antes del último ataque y el duelo. */
function situacion(p: Partido, i: number, contexto: string, conFirma: boolean, lineas: string[], pieGancho: string): Escena[] {
  const j = p.jugadas[i];
  const fa = p.equipos[j.equipo].franquicia;
  const pierde = antesDe(p, i)[1 - j.equipo] - antesDe(p, i)[j.equipo];
  const at = mundo.jugadores[j.tirador];
  const de = mundo.jugadores[j.defensor];
  const firma = franquicias[fa].estilo.firma;
  return [
    gancho(lineas, { etiqueta: contexto, pie: pieGancho }),
    {
      tipo: "marcador",
      etiqueta: i >= 2 * REGLAS.ataquesPorEquipo ? "Muerte súbita · último ataque" : "Último ataque",
      equipos: p.equipos.map((e) => equipo(e.franquicia)),
      puntos: antesDe(p, i),
      resalta: 1 - j.equipo,
      titulo: `${verbo(fa, "Ataca", "Atacan")} ${los(fa)}`,
      pie: pierde === 1 ? "Pierden de 1: cualquier canasta les da la victoria." : "Pierden de 2: dentro empatan; de 3, ganan.",
      acento: franquicias[fa].colores[0],
    },
    {
      tipo: "cartas",
      titulo: `Tira ${nombre(j.tirador)}`,
      cartas: [ficha(j.tirador), ficha(j.defensor)],
      roles: ["Tira", "Tú le defiendes"],
      pie: conFirma && firma ? `${franquicias[fa].nombre}: «${describirFirma(firma)}»` : [at.icono, de.icono].filter(Boolean).length ? iconosEnJuego(at.icono, de.icono) : undefined,
    },
  ];
}

/** Parte 1: la situación y la pregunta. La tirada, mañana. */
function dentroOFuera1(p: Partido, i: number, contexto: string, conFirma: boolean): Escena[] {
  const j = p.jugadas[i];
  const fd = p.equipos[1 - j.equipo].franquicia;
  const at = mundo.jugadores[j.tirador];
  const de = mundo.jugadores[j.defensor];
  return [
    ...situacion(p, i, contexto, conFirma, ["¿Dentro", "o fuera?"], "Defiendes tú."),
    { tipo: "tabla", titulo: `Lo que necesita ${nombre(j.tirador)}`, tirador: nombre(j.tirador), tabla: Object.fromEntries(TIPOS.map((t) => [t, Object.fromEntries(TIPOS.map((c) => [c, necesita(at, de, t, c)]))])) as Record<Tipo, Record<Tipo, number>> },
    { tipo: "pregunta", lineas: ["¿Qué", "cierras?"], pie: "Comenta DENTRO o FUERA", acento: franquicias[fd].colores[0] },
    { tipo: "titular", lineas: ["Mañana,", "la tirada."], colores: ["texto", "lila"], pie: "Y verás si la habrías parado." },
  ];
}

/** Parte 2: lo que tira, los dados y qué habría pasado cerrando dentro y cerrando fuera. */
function dentroOFuera2(p: Partido, i: number, contexto: string): Escena[] {
  const j = p.jugadas[i];
  const fa = p.equipos[j.equipo].franquicia;
  const fd = p.equipos[1 - j.equipo].franquicia;
  const de = mundo.jugadores[j.defensor];
  const antes = antesDe(p, i);
  const final = (anota: boolean) => {
    const puntos = [...antes];
    if (anota) puntos[j.equipo] += REGLAS.puntos[j.tipo];
    if (puntos[0] === puntos[1]) return "Empate: a muerte súbita";
    const g = p.equipos[puntos[0] > puntos[1] ? 0 : 1].franquicia;
    return `${anota ? "Entra:" : "¡La paras!"} ${anota ? verbo(g, "gana", "ganan") : verbo(g, "Gana", "Ganan")} ${los(g)}, ${puntos[0]}-${puntos[1]}.`;
  };
  // El repaso de la situación, más rápido: ya se vio ayer.
  const [gancho2, marcador, cartas] = situacion(p, i, contexto, false, ["¿Dentro o fuera?", "La tirada"], "Ayer elegiste qué cerrar.");
  return [
    gancho2,
    { ...marcador, segundos: 6 },
    cartas,
    {
      tipo: "tira",
      titulo: "Y tira…",
      quien: `${nombre(j.tirador)} tira`,
      tiro: j.tipo,
      pie: j.tipo === "fuera" ? `De 3, con -${REGLAS.castigoFuera} a la tirada.` : `Dentro: vale ${REGLAS.puntos.dentro}.`,
      acento: franquicias[fa].colores[0],
    },
    { tipo: "dados", dados: j.dados, tirada: tiradaDe(j, false) },
    {
      tipo: "cierres",
      titulo: "¿La paraste?",
      ataque: j.ataque,
      filas: TIPOS.map((c) => {
        const cuenta = cuentaDe({ ...j, cierra: c });
        const defensa = valorDefensa(de, j.tipo, c);
        const suma = [`${cuenta.base}`, `${cuenta.defensa} de ${cuenta.defensor}`, cuenta.muro ? `${cuenta.muro} de Muro` : "", c === j.tipo ? `${REGLAS.bonusCierre} por acertar` : ""].filter(Boolean).join(" + ");
        return { cierra: c, suma, defensa, anota: j.ataque >= defensa, pie: final(j.ataque >= defensa) };
      }),
    },
    { tipo: "titular", lineas: ["¿La paraste?", "Cuéntalo abajo."], colores: ["texto", "lila"], pie: `En el partido, ${los(fd)} ${verbo(fd, "cerró", "cerraron")} ${j.cierra}.` },
  ];
}
function iconosEnJuego(a: string | null, d: string | null) {
  const texto: Record<string, string> = { Tiro: "Tiro: +1 de fuera", Aro: "Aro: +2 dentro", Muro: "Muro: +2 contra dentro" };
  return [a, d].filter((x): x is string => !!x).map((x) => texto[x]).join("\n");
}

// --- FI · Firmas ------------------------------------------------------------------------------

/** Una jugada de verdad en la que se ve la firma de la franquicia. */
function ejemploFirma(fid: string): string {
  const firma = franquicias[fid].estilo.firma!;
  const rivales = IDS.filter((x) => x !== fid);
  const parejas = rivales.flatMap((r) => [[fid, r], [r, fid]] as [string, string][]);
  const lado = (p: Partido) => (p.equipos[0].franquicia === fid ? 0 : 1);
  const rivalDe = (p: Partido) => p.equipos[1 - lado(p)].franquicia;
  // El marcador, siempre local-visitante: por eso se dice quién juega en casa.
  const contra = (p: Partido, i: number) => {
    const m = antesDe(p, i);
    return `${lado(p) === 0 ? `Contra ${los(rivalDe(p))}, en casa` : `En casa ${del(rivalDe(p))}`}, ${m[0]}-${m[1]}`;
  };
  const marcador = (p: Partido, i: number) => {
    const m = antesDe(p, i);
    return `${m[0]}-${m[1]} (${lado(p) === 0 ? `en casa ${del(fid)}` : "en su casa"})`;
  };
  if (firma.tipo === "tiro") {
    const { p, j, i } = buscar((p, j, i) => j.equipo === lado(p) && i >= 2 * REGLAS.ataquesPorEquipo - 2 && finalApretadoAntes(p, i) && j.tipo === firma.va && j.anota, `firma-${fid}`, parejas);
    return `${contra(p, i)} y su último ataque: ${nombre(j.tirador)} tira ${deTipo(j.tipo)}… y entra.`;
  }
  if (firma.tipo === "cierre") {
    const { p, j, i } = buscar((p, j, i) => j.equipo !== lado(p) && i >= 2 * REGLAS.ataquesPorEquipo - 2 && finalApretadoAntes(p, i) && j.cierra === firma.cierra && j.tipo === firma.cierra && !j.anota, `firma-${fid}`, parejas);
    return `${Los(rivalDe(p))} ${verbo(rivalDe(p), "ataca", "atacan")} al final con ${marcador(p, i)}. Cierran ${firma.cierra}… y ${nombre(j.tirador)} falla.`;
  }
  if (firma.tipo === "contraria") {
    const { p, j, i } = buscar((p, j, i) => j.equipo === lado(p) && i >= 2 * REGLAS.ataquesPorEquipo - 2 && finalApretadoAntes(p, i) && j.cierra !== j.tipo && j.anota, `firma-${fid}`, parejas);
    return `${contra(p, i)}. Todos esperaban lo otro: ${nombre(j.tirador)} tira ${deTipo(j.tipo)}… y entra.`;
  }
  const { p } = buscar((p) => true, `firma-${fid}`, parejas);
  const id = estrella(p, lado(p));
  const suyos = p.jugadas.map((j, n) => ({ j, n })).filter(({ j }) => j.tirador === id);
  if (firma.cuando === "pronto") return `${mundo.jugadores[id].nombre} tira en los ataques ${suyos.slice(0, 2).map(({ n }) => Math.floor(n / 2) + 1).join(" y ")}. Sin esperar.`;
  if (firma.cuando === "segunda") return `${mundo.jugadores[id].nombre} no tira hasta el ataque ${Math.floor(suyos[0].n / 2) + 1}. Paciencia.`;
  const ultimo = suyos.at(-1)!;
  return `${mundo.jugadores[id].nombre} se guarda un tiro. Ataque ${Math.floor(ultimo.n / 2) + 1}: ${ultimo.j.anota ? "entra" : "no entra"}.`;
}
/** ¿Estaba el equipo que ataca en la jugada i en su final apretado? (con el marcador de antes de tirar) */
function finalApretadoAntes(p: Partido, i: number) {
  const j = p.jugadas[i];
  const m = antesDe(p, i);
  const ataques = p.jugadas.slice(0, i).filter((x) => x.equipo === j.equipo).length;
  return ataques >= REGLAS.ataquesPorEquipo - 2 && Math.abs(m[0] - m[1]) <= 3;
}

function firmas(grupo: string[]): Escena[] {
  return [
    gancho(["Cada franquicia", "tiene su manía."]),
    { tipo: "titular", lineas: ["En el final", "apretado…"], colores: ["texto", "oro"], pie: "Los dos últimos ataques con el marcador a 3 o menos, y la muerte súbita." },
    ...grupo.map(
      (fid): Escena => ({ tipo: "titular", lineas: [franquicias[fid].nombre, describirFirma(franquicias[fid].estilo.firma!)], colores: ["texto", "oro"], escudos: [equipo(fid)], pie: ejemploFirma(fid), acento: franquicias[fid].colores[0] }),
    ),
    { tipo: "titular", lineas: ["Ahora ya lo sabes.", "¿Cierras?"], colores: ["texto", "lila"] },
  ];
}

// --- CA · Las mejores cartas --------------------------------------------------------------------

function mejoresCartas(): Escena[] {
  const top = Object.values(mundo.jugadores)
    .filter((j) => j.estado === "activa")
    .sort((a, b) => valorCarta(b) - valorCarta(a) || b.techo - a.techo)
    .slice(0, 5)
    .reverse();
  return [
    gancho(["Las 5 mejores cartas", "de la liga."]),
    ...top.map((j, n): Escena => ({ tipo: "carta", rango: `#${5 - n}`, carta: ficha(j.id), titulo: franquicias[j.franquicia].nombre, pie: j.icono ? `${j.icono} · ${j.edad} años` : `${j.edad} años`, acento: franquicias[j.franquicia].colores[0] })),
    { tipo: "titular", lineas: ["¿Cuál quieres", "en tu equipo?"], colores: ["texto", "oro"] },
  ];
}

// --- AM · Amistosos de Navidad -----------------------------------------------------------------

const amistosos = Object.fromEntries(AMISTOSOS.map(([, l, v]) => [`${l}-${v}`, jugar(l, v, semillaAmistoso(l, v))]));

const FECHA = (f: string) => new Date(`${f}T12:00:00Z`).toLocaleDateString("es-ES", { day: "numeric", month: "long", timeZone: "UTC" });

/** Si la muerte súbita acabó igualada, cómo se desempató: por cuánto superó cada uno a su defensa. */
function escenaDesempate(p: Partido): Escena[] {
  const d = p.jugadas.at(-1)!.desempate;
  if (!d) return [];
  const g = p.equipos[d.gana].franquicia;
  const o = p.equipos[1 - d.gana].franquicia;
  const por = (fid: string, m: number) =>
    m > 0 ? `${verbo(fid, "la superó", "la superaron")} por ${m}` : m === 0 ? verbo(fid, "la igualó", "la igualaron") : `${verbo(fid, "se quedó", "se quedaron")} a ${-m}`;
  const empate = p.jugadas.at(-1)!.marcador.map((x, l) => (l === d.gana ? x - REGLAS.puntoDesempate : x));
  return [
    {
      tipo: "titular",
      lineas: [`${empate[0]}-${empate[1]}:`, "desempate."],
      colores: ["texto", "oro"],
      etiqueta: "Muerte súbita",
      pie: `Gana quien superó a su defensa por más. ${Los(g)} ${por(g, d.margen[d.gana])}; ${los(o)}, ${d.margen[1 - d.gana] > 0 ? `por ${d.margen[1 - d.gana]}` : por(o, d.margen[1 - d.gana])}. +${REGLAS.puntoDesempate} para ${los(g)}.`,
      acento: franquicias[g].colores[0],
    },
  ];
}

/** Un ataque en una línea: quién, qué tira, los dados y si entra. */
function tiroDe(j: Jugada) {
  return { equipo: j.equipo, tirador: nombre(j.tirador), tipo: j.tipo, dados: j.dados, anota: j.anota, puntos: j.puntos, mate: j.mate, tapon: j.tapon, marcador: j.marcador, tiempoMuerto: !!j.tiempoMuerto };
}
/** Segundos por ataque en el repaso tiro a tiro. */
const POR_TIRO = 2.5;
/** Los ataques de `desde` a `hasta` (sin incluir), uno tras otro con el marcador arriba. */
function escenaTiros(p: Partido, titulo: string, desde: number, hasta: number): Escena[] {
  if (hasta <= desde) return [];
  const tiros = p.jugadas.slice(desde, hasta).map(tiroDe);
  return [{ tipo: "tiros", titulo, equipos: p.equipos.map((e) => equipo(e.franquicia)), inicio: antesDe(p, desde), tiros, porTiro: POR_TIRO, segundos: tiros.length * POR_TIRO + 1.5 }];
}

/** La canasta que puso al ganador por delante para no volver a ir por detrás (o empatado). */
function puestoPorDelante(p: Partido) {
  const g = p.ganador!;
  let i = -1;
  p.jugadas.forEach((j, n) => {
    if (j.marcador[g] <= j.marcador[1 - g]) i = -1;
    else if (i < 0) i = n;
  });
  return i;
}

/**
 * El momento que de verdad importó, para contarlo entero: el último ataque si con él se podía cambiar el resultado
 * (y la muerte súbita); si no, la canasta que puso al ganador por delante para siempre, si fue en la 2.ª parte;
 * y si no, un mate, un tapón o, en último caso, esa misma canasta aunque fuera pronto. Nunca un tiro que no cambia nada.
 */
function momentoClave(p: Partido): { i: number; por: string } {
  const ultimo = p.jugadas.length - 1;
  const j = p.jugadas[ultimo];
  const antes = antesDe(p, ultimo);
  const pierde = antes[1 - j.equipo] - antes[j.equipo];
  if (ultimo >= 2 * REGLAS.ataquesPorEquipo) return { i: ultimo, por: "La muerte súbita" };
  if (pierde >= 0 && pierde < REGLAS.puntos.fuera) return { i: ultimo, por: "El último ataque" };
  const d = puestoPorDelante(p);
  if (d >= 2 * REGLAS.descansoTras) return { i: d, por: "La canasta que lo decidió" };
  const mate = p.jugadas.findLastIndex((x) => x.mate);
  if (mate >= 0) return { i: mate, por: "El mate del partido" };
  const tapon = p.jugadas.findLastIndex((x) => x.tapon);
  if (tapon >= 0) return { i: tapon, por: "El tapón del partido" };
  return { i: d, por: "Desde aquí, ya no soltaron el mando" };
}

/** Amistoso contado tiro a tiro: la 1.ª parte, el descanso, la 2.ª parte y el momento clave entero, a cámara lenta. */
function amistosoTiroATiro(fecha: string, local: string, visitante: string): Escena[] {
  const p = amistosos[`${local}-${visitante}`];
  const equipos = p.equipos.map((e) => equipo(e.franquicia));
  const mitad = 2 * REGLAS.descansoTras;
  const { i, por } = momentoClave(p);
  const j = p.jugadas[i];
  const fa = p.equipos[j.equipo].franquicia;
  const antes = antesDe(p, i);
  const situacion = antes[j.equipo] === antes[1 - j.equipo] ? "Empate" : antes[j.equipo] < antes[1 - j.equipo] ? `Pierden de ${antes[1 - j.equipo] - antes[j.equipo]}` : `Ganan de ${antes[j.equipo] - antes[1 - j.equipo]}`;
  const subita = p.jugadas.length > 2 * REGLAS.ataquesPorEquipo;
  const mejor = mejorDelPartido(p);
  const linea = estadisticas(p)[mejor];
  const cambios = p.cambios.map((c) => `${franquicias[p.equipos[c.equipo].franquicia].nombre}: entra ${nombre(c.entra)} por ${nombre(c.sale)}`);
  const firma = franquicias[fa].estilo.firma;
  const conFirma = firma?.tipo === "tiro" && finalApretadoAntes(p, i);
  const [cartas, revela, dados] = escenasJugada(p, i, { titulo: `Tira ${nombre(j.tirador)}`, pieCartas: conFirma ? `${franquicias[fa].nombre}: «${describirFirma(firma!)}»` : undefined });
  const parte = (desde: number, hasta: number) => (desde < mitad ? "Primera parte" : desde < 2 * REGLAS.ataquesPorEquipo ? "Segunda parte" : "Muerte súbita");
  // El repaso se para antes del momento clave y sigue después, si quedan ataques.
  const tramos = (desde: number, hasta: number) =>
    i >= desde && i < hasta ? [...escenaTiros(p, parte(desde, i), desde, i), "clave" as const, ...escenaTiros(p, parte(desde, hasta), i + 1, hasta)] : escenaTiros(p, parte(desde, hasta), desde, hasta);
  const clave: Escena[] = [
    { tipo: "marcador", etiqueta: por, equipos, puntos: antes, resalta: j.equipo, titulo: `${verbo(fa, "Ataca", "Atacan")} ${los(fa)}`, pie: `${situacion}.`, acento: franquicias[fa].colores[0] },
    cartas,
    { ...revela, segundos: Math.min(revela.segundos ?? duracion(revela), 12) },
    { ...dados, segundos: Math.min(dados.segundos ?? duracion(dados), 10) },
  ];
  const expandir = (xs: (Escena | "clave")[]) => xs.flatMap((x) => (x === "clave" ? clave : [x]));
  return [
    gancho([franquicias[local].nombre, `contra ${franquicias[visitante].nombre}`], { etiqueta: `Amistosos de Navidad · ${FECHA(fecha)}`, escudos: equipos, pie: subita ? "Tiro a tiro. Y con muerte súbita." : "Tiro a tiro.", segundos: 6 }),
    ...expandir(tramos(0, mitad)),
    { tipo: "marcador", etiqueta: "Al descanso", equipos, puntos: p.jugadas[mitad - 1].marcador, pie: cambios.join("\n") || undefined, segundos: 7 },
    ...expandir(tramos(mitad, 2 * REGLAS.ataquesPorEquipo)),
    ...expandir(tramos(2 * REGLAS.ataquesPorEquipo, p.jugadas.length)),
    ...escenaDesempate(p),
    { tipo: "resultado", titulo: "Final", bien: true, equipos, puntos: p.puntos, resalta: p.ganador!, pie: `Mejor del partido: ${mundo.jugadores[mejor].nombre} (${linea.pts} puntos).`, acento: franquicias[p.equipos[p.ganador!].franquicia].colores[0] },
  ];
}

/** Para los ¿Dentro o fuera? de los amistosos: su último ataque, si es un pulso de verdad. */
function dofDeAmistoso(hasta: string, excluir: string[]) {
  for (const [fecha, l, v] of AMISTOSOS) {
    if (fecha > hasta) break;
    const p = amistosos[`${l}-${v}`];
    const i = p.jugadas.length - 1;
    if (!excluir.includes(`${l}-${v}`) && esDentroOFuera(p, p.jugadas[i], i)) return { p, i, clave: `${l}-${v}` };
  }
  return null;
}

// --- El mes ------------------------------------------------------------------------------------

const reels: Reel[] = [];
const añadir = (id: string, formato: string, fecha: string, titulo: string, texto: string, escenas: Escena[]) =>
  reels.push({ id, formato, fecha, titulo, texto, escenas: escenas.map((e) => ({ ...e, segundos: e.segundos ?? duracion(e) })) });

const pieReglas = `Las reglas completas y las cartas para imprimir, en la bio.\n${HASHTAGS}`;
añadir("T", "Tráiler", "2026-12-01", "Tráiler", `Tú eliges el tiro. Los dados lo cuentan. 🏀🎲\nLiga Nimbo: una liga mixta de baloncesto 3x3 que se decide con cartas y dos dados. Temporada 1 desde el 12 de enero.\n${HASHTAGS} #basket`, trailer());
añadir("R1", "Regla", "2026-12-02", "El farol", `Cada ataque es un farol: dentro vale 2, fuera vale 3… y la defensa intenta adivinarlo. 🃏\n${pieReglas}`, reglaFarol());
añadir("R2", "Regla", "2026-12-03", "La cuenta", `Dos dados + tu Ataque contra 5 + su Defensa. Así de simple. 🎲\n${pieReglas}`, reglaCuenta());

// ¿Dentro o fuera? de partidos de prueba: uno por equipo que ataca, sin repetir.
const usados = new Set<string>();
const dof = (prefijo: string, vale: (p: Partido, j: Jugada) => boolean = () => true) => {
  const r = buscar((p, j, i) => esDentroOFuera(p, j, i) && !usados.has(p.equipos[j.equipo].franquicia) && vale(p, j), prefijo);
  usados.add(r.p.equipos[r.j.equipo].franquicia);
  return r;
};
const textoDof = (p: Partido, i: number) => {
  const j = p.jugadas[i];
  const fa = p.equipos[j.equipo].franquicia;
  const m = antesDe(p, i);
  return `Último ataque. ${Los(fa)} ${verbo(fa, "pierde", "pierden")} de ${m[1 - j.equipo] - m[j.equipo]}. 🏀🎲\nDefiendes tú: ¿qué cierras, dentro o fuera?\nComenta y mañana, la tirada 👇\n${HASHTAGS} #basket`;
};
const textoDof2 = (p: Partido, i: number) =>
  `La tirada de ayer: ${nombre(p.jugadas[i].tirador)} tira y salen los dados. 🎲\n¿La habrías parado con lo que cerraste? Míralo y cuéntalo 👇\n${HASHTAGS} #basket`;
const mañana = (fecha: string) => new Date(Date.parse(fecha) + 86400000).toISOString().slice(0, 10);
/** Las dos partes de un ¿Dentro o fuera?: la pregunta en `fecha` y la tirada al día siguiente. */
const dosPartes = (id: string, fecha: string, titulo: string, p: Partido, i: number, contexto: string, conFirma: boolean, texto = textoDof(p, i)) => {
  añadir(`${id}-1`, "¿Dentro o fuera?", fecha, `${titulo} · la pregunta`, texto, dentroOFuera1(p, i, contexto, conFirma));
  añadir(`${id}-2`, "¿Dentro o fuera?", mañana(fecha), `${titulo} · la tirada`, textoDof2(p, i), dentroOFuera2(p, i, contexto));
};
const df1 = dof("dof-1");
dosPartes("DF1", "2026-12-04", "¿Dentro o fuera? 1", df1.p, df1.i, "Partido de prueba", false);
añadir("R3", "Regla", "2026-12-05", "Dos tiros por carta", `Cada carta tira dos veces. ¿Gastas a tu estrella pronto o la guardas para el final? ⏳\n${pieReglas}`, reglaFichas());
añadir("R4", "Regla", "2026-12-06", "Los iconos", `Tiro, Aro y Muro: tres iconos, tres ventajas. 🏀\n${pieReglas}`, reglaIconos());
const df2 = dof("dof-2", (p, j) => j.tipo === "dentro");
dosPartes("DF2", "2026-12-07", "¿Dentro o fuera? 2", df2.p, df2.i, "Partido de prueba", false);
añadir("FI1", "Firmas", "2026-12-08", "Firmas 1/3", `Cada franquicia tiene su manía en el final apretado (1/3). ¿Te la sabías? 👀\n${HASHTAGS}`, firmas(IDS.slice(0, 4)));
añadir("R5", "Regla", "2026-12-09", "Los duelos", `En casa, eliges los duelos. Por eso el local gana el 59 %. 🏟️\n${pieReglas}`, reglaDuelos());
añadir("FI2", "Firmas", "2026-12-10", "Firmas 2/3", `Más manías del final apretado (2/3). 👀\n${HASHTAGS}`, firmas(IDS.slice(4, 8)));
const df3 = dof("dof-3", (p, j) => {
  const f = franquicias[p.equipos[j.equipo].franquicia].estilo.firma;
  return f?.tipo === "tiro" && f.va === "fuera" && finalApretado(p, j.equipo);
});
dosPartes("DF3", "2026-12-11", "¿Dentro o fuera? 3 (con firma)", df3.p, df3.i, "Partido de prueba", true, textoDof(df3.p, df3.i).replace("Defiendes tú", "En el final siempre tiran de 3. Defiendes tú"));
añadir("FI3", "Firmas", "2026-12-12", "Firmas 3/3", `Las últimas manías del final apretado (3/3). Ya conoces las 12. 👀\n${HASHTAGS}`, firmas(IDS.slice(8, 12)));
añadir("R6", "Regla", "2026-12-13", "El descanso", `En el descanso, el suplente entra sí o sí. Y sale quien ya no tiene tiros. 🔄\n${pieReglas}`, reglaDescanso());
añadir("R7", "Regla", "2026-12-14", "Muerte súbita", `Empate tras 8 ataques: muerte súbita. Un ataque más cada uno… y si anotan los dos, gana quien la metió con más margen. ⚡\n${pieReglas}`, reglaMuerteSubita());
añadir("CA", "Cartas", "2026-12-15", "Las 5 mejores cartas", `Las 5 mejores cartas de la liga, una a una. ¿Cuál quieres en tu equipo? 🃏\n${HASHTAGS}`, mejoresCartas());
const df4 = dof("dof-4", (p, j) => j.tipo === "fuera");
dosPartes("DF4", "2026-12-16", "¿Dentro o fuera? 4", df4.p, df4.i, "Partido de prueba", false);
añadir("R8", "Regla", "2026-12-17", "Mates y tapones", `Mates y tapones: no cambian el marcador, pero se cantan. 💥\n${pieReglas}`, reglaMatesTapones());

const textoAmistoso = (fecha: string, l: string, v: string) => {
  const p = amistosos[`${l}-${v}`];
  const g = p.equipos[p.ganador!].franquicia;
  return `Amistosos de Navidad · ${franquicias[l].nombre} – ${franquicias[v].nombre} 🎄🏀\n${Los(g)} ${verbo(g, "gana", "ganan")} ${p.puntos[0]}-${p.puntos[1]}.\nPartido real: la semilla (${semillaAmistoso(l, v)}) y todas las tiradas, en la crónica (enlace en la bio).\n${HASHTAGS}`;
};
const dofAmistosos: string[] = [];
AMISTOSOS.forEach(([fecha, l, v], n) => {
  añadir(`AM${n + 1}`, "Amistoso", fecha, `${franquicias[l].nombre} – ${franquicias[v].nombre}`, textoAmistoso(fecha, l, v), amistosoTiroATiro(fecha, l, v));
  // Los ¿Dentro o fuera? de los domingos 20 y 27, sacados de los amistosos ya jugados.
  if (fecha === "2026-12-19" || fecha === "2026-12-26") {
    const otro = fecha === "2026-12-19" ? "2026-12-20" : "2026-12-27";
    const id = fecha === "2026-12-19" ? "DF5" : "DF6";
    const r = dofDeAmistoso(fecha, dofAmistosos);
    if (r) {
      dofAmistosos.push(r.clave);
      const [lr, vr] = r.clave.split("-");
      dosPartes(id, otro, `${id.replace("DF", "¿Dentro o fuera? ")} (amistoso)`, r.p, r.i, `Amistoso · ${franquicias[lr].nombre} – ${franquicias[vr].nombre}`, true);
    } else {
      const d = dof(`dof-${id}`);
      dosPartes(id, otro, id.replace("DF", "¿Dentro o fuera? "), d.p, d.i, "Partido de prueba", false);
    }
  }
});

reels.sort((a, b) => a.fecha.localeCompare(b.fecha));
fs.writeFileSync(SALIDA, JSON.stringify(reels, null, 1) + "\n");
for (const r of reels) {
  const total = r.escenas.reduce((s, e) => s + e.segundos!, 0);
  console.log(`${r.fecha} ${r.id.padEnd(4)} ${r.titulo.padEnd(34)} ${r.escenas.length} escenas · ${total.toFixed(0)} s`);
}
console.log(`\n${reels.length} Reels en ${path.relative(process.cwd(), SALIDA)}`);
