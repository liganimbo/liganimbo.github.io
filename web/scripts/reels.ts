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
import { type Mundo, valorCarta } from "../src/motor/mundo.ts";
import { type Jugada, type Partido, type Tipo, REGLAS, estadisticas, mejorDelPartido, necesita, valorAtaque } from "../src/motor/reglas.ts";

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
  | { tipo: "revela"; titulo: string; tira: { quien: string; tipo: Tipo }; cierra: { quien: string; tipo: Tipo }; pie: string }
  | { tipo: "dados"; necesita: number; dados: number[]; pie?: string }
  | { tipo: "resultado"; titulo: string; bien: boolean; equipos?: Equipo[]; puntos?: number[]; resalta?: number; pie?: string }
  | { tipo: "lista"; titulo: string; items: { escudo?: Equipo; carta?: Ficha; titulo: string; texto: string }[] }
  | { tipo: "carta"; rango?: string; carta: Ficha; titulo: string; pie?: string }
);
type Reel = { id: string; formato: string; fecha: string; titulo: string; texto: string; escenas: Escena[] };

/** Segundos para leer con calma (3 palabras por segundo) lo que pone en pantalla, con un mínimo por tipo para que se vea lo que pasa. */
const MINIMO: Record<Escena["tipo"], number> = { titular: 2, cartas: 3, marcador: 2.5, tabla: 5, pregunta: 4, revela: 3.8, dados: 3.2, resultado: 2.5, lista: 1.5, carta: 2.6 };
function aLeer(e: Escena): string[] {
  const comunes = [("titulo" in e && e.titulo) || "", ("etiqueta" in e && e.etiqueta) || "", ("pie" in e && e.pie) || ""];
  if (e.tipo === "titular" || e.tipo === "pregunta") return [...e.lineas, ...comunes];
  if (e.tipo === "revela") return [e.tira.quien, e.cierra.quien, ...comunes];
  if (e.tipo === "lista") return [...e.items.flatMap((x) => [x.titulo, x.texto]), ...comunes];
  return comunes;
}
function duracion(e: Escena): number {
  const palabras = aLeer(e).join(" ").split(/\s+/).filter((w) => /\p{L}/u.test(w)).length;
  const extra = e.tipo === "lista" ? 1.2 * e.items.length : 0;
  return Math.round(Math.max(MINIMO[e.tipo], 0.8 + palabras / 3) * 10 + extra * 10) / 10;
}

// «los Búhos», «el Vendaval»: el artículo y el verbo dependen de si el nombre es plural.
const plural = (fid: string) => franquicias[fid].nombre.endsWith("s");
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

/** Escenas de una jugada: quién tira y contra quién, qué eligieron, los dados y lo que pasó. */
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
    },
    { tipo: "dados", necesita: j.necesita, dados: j.dados, pie: `${j.dados[0]} + ${j.dados[1]} + ${valorAtaque(mundo.jugadores[j.tirador], j.tipo)} de ataque contra ${j.defensa} de defensa${j.tipo === "fuera" ? ", que de fuera hay que superar por 2" : ""}` },
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
    { tipo: "dados", necesita: j.necesita, dados: j.dados, pie: `Necesita ${j.necesita}. Saca justo ${j.necesita}.` },
    { tipo: "resultado", titulo: "¡Entra!", bien: true, pie: "Dentro entra si iguala la defensa. Fuera, si la supera por 2." },
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
  const { p, i } = buscar((p, j, i) => i === p.jugadas.length - 1 && i >= 2 * REGLAS.ataquesPorEquipo && j.anota, "subita");
  const j = p.jugadas[i];
  const empate = p.jugadas[2 * REGLAS.ataquesPorEquipo - 1].marcador;
  const fa = p.equipos[j.equipo].franquicia;
  return [
    gancho(["Empate", "tras 8 ataques."]),
    { tipo: "marcador", etiqueta: "Final… o no", equipos: p.equipos.map((e) => equipo(e.franquicia)), puntos: empate, titulo: "Muerte súbita" },
    { tipo: "titular", lineas: ["Un ataque más", "cada uno."], pie: "Puede tirar cualquiera de pista, tenga tiros o no. Hasta que alguien quede por delante." },
    ...escenasJugada(p, i, { titulo: `${Los(fa)} ${verbo(fa, "elige", "eligen")} a ${nombre(j.tirador)}` }),
    { tipo: "resultado", titulo: exclamacion(j), bien: true, equipos: p.equipos.map((e) => equipo(e.franquicia)), puntos: j.marcador, resalta: j.equipo },
    { tipo: "titular", lineas: ["Aquí no hay", "segunda oportunidad."], colores: ["texto", "oro"] },
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
    { tipo: "dados", necesita: jm.necesita, dados: jm.dados, pie: `${jm.ataque} de ataque contra ${jm.defensa} de defensa: ${jm.ataque - jm.defensa} por encima.` },
    { tipo: "resultado", titulo: "¡Mate!", bien: true },
    { tipo: "titular", lineas: ["Tapón:"], colores: ["lila"], pie: `Tiro de dentro que se queda corto por ${REGLAS.margenTapon} o más.` },
    { tipo: "dados", necesita: jt.necesita, dados: jt.dados, pie: `${nombre(jt.tirador)} saca ${jt.ataque} contra ${jt.defensa} de ${nombre(jt.defensor)}.` },
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
const FORMAS_DE_SUMAR = [0, 0, 1, 2, 3, 4, 5, 6, 5, 4, 3, 2, 1];
const probabilidadDe = (n: number) => (n <= 2 ? 1 : n > 12 ? 0 : FORMAS_DE_SUMAR.slice(n).reduce((s, x) => s + x, 0) / 36);

function dentroOFuera(p: Partido, i: number, contexto: string, conFirma: boolean): Escena[] {
  const j = p.jugadas[i];
  const fa = p.equipos[j.equipo].franquicia;
  const fd = p.equipos[1 - j.equipo].franquicia;
  const antes = antesDe(p, i);
  const pierde = antes[1 - j.equipo] - antes[j.equipo];
  const at = mundo.jugadores[j.tirador];
  const de = mundo.jugadores[j.defensor];
  const firma = franquicias[fa].estilo.firma;
  const equipos = p.equipos.map((e) => equipo(e.franquicia));
  const despues = j.marcador;
  const ganador = despues[0] === despues[1] ? null : despues[0] > despues[1] ? 0 : 1;
  return [
    gancho(["¿Dentro", "o fuera?"], { etiqueta: contexto, pie: "Defiendes tú." }),
    {
      tipo: "marcador",
      etiqueta: i >= 2 * REGLAS.ataquesPorEquipo ? "Muerte súbita · último ataque" : "Último ataque",
      equipos,
      puntos: antes,
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
    { tipo: "tabla", titulo: `Lo que necesita ${nombre(j.tirador)}`, tirador: nombre(j.tirador), tabla: Object.fromEntries(TIPOS.map((t) => [t, Object.fromEntries(TIPOS.map((c) => [c, necesita(at, de, t, c)]))])) as Record<Tipo, Record<Tipo, number>> },
    { tipo: "pregunta", lineas: ["¿Qué", "cierras?"], pie: "Comenta DENTRO o FUERA", acento: franquicias[fd].colores[0] },
    {
      tipo: "revela",
      titulo: "Y pasó esto",
      tira: { quien: `${nombre(j.tirador)} tira`, tipo: j.tipo },
      cierra: { quien: `${franquicias[fd].nombre} cierra${plural(fd) ? "n" : ""}`, tipo: j.cierra },
      pie: j.cierra === j.tipo ? "La defensa acierta: +2" : "La defensa falla",
    },
    { tipo: "dados", necesita: j.necesita, dados: j.dados },
    {
      tipo: "resultado",
      titulo: exclamacion(j),
      bien: j.anota,
      equipos,
      puntos: despues,
      resalta: ganador ?? undefined,
      pie: ganador === null ? "Empate: a muerte súbita" : `${verbo(p.equipos[ganador].franquicia, "Gana", "Ganan")} ${los(p.equipos[ganador].franquicia)}`,
      acento: franquicias[j.anota ? fa : fd].colores[0],
    },
    { tipo: "titular", lineas: ["¿Acertaste?", "Cuéntalo abajo."], colores: ["texto", "lila"] },
  ];
}
function iconosEnJuego(a: string | null, d: string | null) {
  const texto: Record<string, string> = { Tiro: "Tiro: +1 de fuera", Aro: "Aro: +2 dentro", Muro: "Muro: +2 contra dentro" };
  return [a, d].filter((x): x is string => !!x).map((x) => texto[x]).join(" · ");
}

// --- FI · Firmas ------------------------------------------------------------------------------

/** Una jugada de verdad en la que se ve la firma de la franquicia. */
function ejemploFirma(fid: string): string {
  const firma = franquicias[fid].estilo.firma!;
  const rivales = IDS.filter((x) => x !== fid);
  const parejas = rivales.flatMap((r) => [[fid, r], [r, fid]] as [string, string][]);
  const lado = (p: Partido) => (p.equipos[0].franquicia === fid ? 0 : 1);
  const rivalDe = (p: Partido) => p.equipos[1 - lado(p)].franquicia;
  const marcador = (p: Partido, i: number) => {
    const m = antesDe(p, i);
    return `${m[lado(p)]}-${m[1 - lado(p)]}`;
  };
  if (firma.tipo === "tiro") {
    const { p, j, i } = buscar((p, j, i) => j.equipo === lado(p) && i >= 2 * REGLAS.ataquesPorEquipo - 2 && finalApretadoAntes(p, i) && j.tipo === firma.va && j.anota, `firma-${fid}`, parejas);
    return `Contra ${los(rivalDe(p))}, ${marcador(p, i)} y su último ataque: ${nombre(j.tirador)} tira ${deTipo(j.tipo)}… y entra.`;
  }
  if (firma.tipo === "cierre") {
    const { p, j, i } = buscar((p, j, i) => j.equipo !== lado(p) && i >= 2 * REGLAS.ataquesPorEquipo - 2 && finalApretadoAntes(p, i) && j.cierra === firma.cierra && j.tipo === firma.cierra && !j.anota, `firma-${fid}`, parejas);
    return `${Los(rivalDe(p))} ${verbo(rivalDe(p), "ataca", "atacan")} al final con ${marcador(p, i)}. Cierran ${firma.cierra}… y ${nombre(j.tirador)} falla.`;
  }
  if (firma.tipo === "contraria") {
    const { p, j, i } = buscar((p, j, i) => j.equipo === lado(p) && i >= 2 * REGLAS.ataquesPorEquipo - 2 && finalApretadoAntes(p, i) && j.cierra !== j.tipo && j.anota, `firma-${fid}`, parejas);
    return `Contra ${los(rivalDe(p))}, ${marcador(p, i)}. Todos esperaban lo otro: ${nombre(j.tirador)} tira ${deTipo(j.tipo)}… y entra.`;
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

const AMISTOSOS: [string, string, string][] = [
  ["2026-12-18", "VAL", "VLU"],
  ["2026-12-19", "SGR", "TOR"],
  ["2026-12-21", "MIR", "STE"],
  ["2026-12-22", "PAL", "EBA"],
  ["2026-12-23", "ALC", "FER"],
  ["2026-12-24", "OST", "BRE"],
  ["2026-12-25", "STE", "OST"],
  ["2026-12-26", "VLU", "SGR"],
  ["2026-12-28", "TOR", "VAL"],
  ["2026-12-29", "EBA", "MIR"],
  ["2026-12-30", "FER", "PAL"],
  ["2026-12-31", "BRE", "ALC"],
];
const semillaAmistoso = (local: string, visitante: string) => `navidad-2026-${local}-${visitante}`;
const amistosos = Object.fromEntries(AMISTOSOS.map(([, l, v]) => [`${l}-${v}`, jugar(l, v, semillaAmistoso(l, v))]));

/** La jugada que lo decidió: la que puso al ganador por delante para no volver a ir por detrás (o, si ganó de principio a fin, su última canasta). */
function decisiva(p: Partido) {
  const g = p.ganador!;
  let i: number | null = null;
  p.jugadas.forEach((j, n) => {
    if (j.marcador[g] <= j.marcador[1 - g]) i = null;
    else if (i === null) i = n;
  });
  if (i !== null && i >= 6) return i;
  return p.jugadas.findLastIndex((j) => j.equipo === g && j.anota);
}

const FECHA = (f: string) => new Date(`${f}T12:00:00Z`).toLocaleDateString("es-ES", { day: "numeric", month: "long", timeZone: "UTC" });

function amistoso(fecha: string, local: string, visitante: string): Escena[] {
  const p = amistosos[`${local}-${visitante}`];
  const i = decisiva(p);
  const j = p.jugadas[i];
  const fa = p.equipos[j.equipo].franquicia;
  const equipos = p.equipos.map((e) => equipo(e.franquicia));
  const descanso = p.jugadas[2 * REGLAS.descansoTras - 1].marcador;
  const ataque = Math.floor(i / 2) + 1;
  const subita = i >= 2 * REGLAS.ataquesPorEquipo;
  const firma = franquicias[fa].estilo.firma;
  const conFirma = firma?.tipo === "tiro" && finalApretadoAntes(p, i);
  const mejor = mejorDelPartido(p);
  const linea = estadisticas(p)[mejor];
  const antes = antesDe(p, i);
  const situacion = antes[j.equipo] === antes[1 - j.equipo] ? "Empate" : antes[j.equipo] < antes[1 - j.equipo] ? `Pierden de ${antes[1 - j.equipo] - antes[j.equipo]}` : `Ganan de ${antes[j.equipo] - antes[1 - j.equipo]}`;
  const [cartas, revela, dados] = escenasJugada(p, i, { titulo: `Tira ${nombre(j.tirador)}`, pieCartas: conFirma ? `${franquicias[fa].nombre}: «${describirFirma(firma!)}»` : undefined });
  return [
    gancho([franquicias[local].nombre, `contra ${franquicias[visitante].nombre}`], { etiqueta: `Amistosos de Navidad · ${FECHA(fecha)}`, escudos: equipos, pie: subita ? "Se decidió en la muerte súbita." : ataque >= 7 ? "Se decidió al final." : "Un partido de verdad, tirada a tirada." }),
    { tipo: "marcador", etiqueta: "Al descanso", equipos, puntos: descanso },
    { tipo: "marcador", etiqueta: subita ? "Muerte súbita" : `Ataque ${ataque} de ${REGLAS.ataquesPorEquipo}`, equipos, puntos: antes, resalta: j.equipo, titulo: `${verbo(fa, "Ataca", "Atacan")} ${los(fa)}`, pie: `${situacion}.`, acento: franquicias[fa].colores[0] },
    cartas,
    revela,
    dados,
    { tipo: "resultado", titulo: exclamacion(j), bien: j.anota, equipos, puntos: p.puntos, resalta: p.ganador!, pie: `Final. Mejor del partido: ${mundo.jugadores[mejor].nombre} (${linea.pts} puntos).`, acento: franquicias[p.equipos[p.ganador!].franquicia].colores[0] },
  ];
}

/** Para los ¿Dentro o fuera? de los amistosos: su último ataque, si es un pulso de verdad. */
function dofDeAmistoso(hasta: string, excluir: string[]) {
  for (const [fecha, l, v] of AMISTOSOS) {
    if (fecha > hasta) break;
    const p = amistosos[`${l}-${v}`];
    const i = p.jugadas.length - 1;
    if (!excluir.includes(`${l}-${v}`) && esPulso(p, p.jugadas[i], i)) return { p, i, clave: `${l}-${v}` };
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
  const r = buscar((p, j, i) => esPulso(p, j, i) && !usados.has(p.equipos[j.equipo].franquicia) && vale(p, j), prefijo);
  usados.add(r.p.equipos[r.j.equipo].franquicia);
  return r;
};
const textoDof = (p: Partido, i: number) => {
  const j = p.jugadas[i];
  const fa = p.equipos[j.equipo].franquicia;
  const m = antesDe(p, i);
  return `Último ataque. ${Los(fa)} ${verbo(fa, "pierde", "pierden")} de ${m[1 - j.equipo] - m[j.equipo]}. 🏀🎲\nDefiendes tú: ¿qué cierras, dentro o fuera?\nComenta antes de ver el final 👇\n${HASHTAGS} #basket`;
};
const df1 = dof("dof-1");
añadir("DF1", "¿Dentro o fuera?", "2026-12-04", "¿Dentro o fuera? 1", textoDof(df1.p, df1.i), dentroOFuera(df1.p, df1.i, "Partido de prueba", false));
añadir("R3", "Regla", "2026-12-05", "Dos tiros por carta", `Cada carta tira dos veces. ¿Gastas a tu estrella pronto o la guardas para el final? ⏳\n${pieReglas}`, reglaFichas());
añadir("R4", "Regla", "2026-12-06", "Los iconos", `Tiro, Aro y Muro: tres iconos, tres ventajas. 🏀\n${pieReglas}`, reglaIconos());
const df2 = dof("dof-2", (p, j) => j.cierra === j.tipo);
añadir("DF2", "¿Dentro o fuera?", "2026-12-07", "¿Dentro o fuera? 2", textoDof(df2.p, df2.i), dentroOFuera(df2.p, df2.i, "Partido de prueba", false));
añadir("FI1", "Firmas", "2026-12-08", "Firmas 1/3", `Cada franquicia tiene su manía en el final apretado (1/3). ¿Te la sabías? 👀\n${HASHTAGS}`, firmas(IDS.slice(0, 4)));
añadir("R5", "Regla", "2026-12-09", "Los duelos", `En casa, eliges los duelos. Por eso el local gana el 59 %. 🏟️\n${pieReglas}`, reglaDuelos());
añadir("FI2", "Firmas", "2026-12-10", "Firmas 2/3", `Más manías del final apretado (2/3). 👀\n${HASHTAGS}`, firmas(IDS.slice(4, 8)));
const df3 = dof("dof-3", (p, j) => {
  const f = franquicias[p.equipos[j.equipo].franquicia].estilo.firma;
  return f?.tipo === "tiro" && f.va === "fuera" && finalApretado(p, j.equipo);
});
añadir("DF3", "¿Dentro o fuera?", "2026-12-11", "¿Dentro o fuera? 3 (con firma)", textoDof(df3.p, df3.i).replace("Defiendes tú", "En el final siempre tiran de 3. Defiendes tú"), dentroOFuera(df3.p, df3.i, "Partido de prueba", true));
añadir("FI3", "Firmas", "2026-12-12", "Firmas 3/3", `Las últimas manías del final apretado (3/3). Ya conoces las 12. 👀\n${HASHTAGS}`, firmas(IDS.slice(8, 12)));
añadir("R6", "Regla", "2026-12-13", "El descanso", `En el descanso, el suplente entra sí o sí. Y sale quien ya no tiene tiros. 🔄\n${pieReglas}`, reglaDescanso());
añadir("R7", "Regla", "2026-12-14", "Muerte súbita", `Empate tras 8 ataques: muerte súbita. Un ataque más cada uno, hasta que alguien quede por delante. ⚡\n${pieReglas}`, reglaMuerteSubita());
añadir("CA", "Cartas", "2026-12-15", "Las 5 mejores cartas", `Las 5 mejores cartas de la liga, una a una. ¿Cuál quieres en tu equipo? 🃏\n${HASHTAGS}`, mejoresCartas());
const df4 = dof("dof-4", (p, j) => j.cierra !== j.tipo);
añadir("DF4", "¿Dentro o fuera?", "2026-12-16", "¿Dentro o fuera? 4", textoDof(df4.p, df4.i), dentroOFuera(df4.p, df4.i, "Partido de prueba", false));
añadir("R8", "Regla", "2026-12-17", "Mates y tapones", `Mates y tapones: no cambian el marcador, pero se cantan. 💥\n${pieReglas}`, reglaMatesTapones());

const textoAmistoso = (fecha: string, l: string, v: string) => {
  const p = amistosos[`${l}-${v}`];
  const g = p.equipos[p.ganador!].franquicia;
  return `Amistosos de Navidad · ${franquicias[l].nombre} – ${franquicias[v].nombre} 🎄🏀\n${Los(g)} ${verbo(g, "gana", "ganan")} ${Math.max(...p.puntos)}-${Math.min(...p.puntos)}.\nPartido real: la semilla (${semillaAmistoso(l, v)}) y todas las tiradas, en la crónica (enlace en la bio).\n${HASHTAGS}`;
};
const dofAmistosos: string[] = [];
AMISTOSOS.forEach(([fecha, l, v], n) => {
  añadir(`AM${n + 1}`, "Amistoso", fecha, `${franquicias[l].nombre} – ${franquicias[v].nombre}`, textoAmistoso(fecha, l, v), amistoso(fecha, l, v));
  // Los ¿Dentro o fuera? de los domingos 20 y 27, sacados de los amistosos ya jugados.
  if (fecha === "2026-12-19" || fecha === "2026-12-26") {
    const otro = fecha === "2026-12-19" ? "2026-12-20" : "2026-12-27";
    const id = fecha === "2026-12-19" ? "DF5" : "DF6";
    const r = dofDeAmistoso(fecha, dofAmistosos);
    if (r) {
      dofAmistosos.push(r.clave);
      const [lr, vr] = r.clave.split("-");
      añadir(id, "¿Dentro o fuera?", otro, `${id.replace("DF", "¿Dentro o fuera? ")} (amistoso)`, textoDof(r.p, r.i), dentroOFuera(r.p, r.i, `Amistoso · ${franquicias[lr].nombre} – ${franquicias[vr].nombre}`, true));
    } else {
      const d = dof(`dof-${id}`);
      añadir(id, "¿Dentro o fuera?", otro, id.replace("DF", "¿Dentro o fuera? "), textoDof(d.p, d.i), dentroOFuera(d.p, d.i, "Partido de prueba", false));
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
