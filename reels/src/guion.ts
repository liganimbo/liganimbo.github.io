// Guiones de los Reels: qué dice la voz en cada escena y cuánto dura como mínimo (en segundos).
// Si la voz es más larga, la escena se alarga para que quepa (ver tiempos.ts). Sin texto, la escena va sin voz.
import dof1 from "./datos/dof-1.json" with { type: "json" };
import dof2 from "./datos/dof-2.json" with { type: "json" };
import cronicaDatos from "./datos/cronica.json" with { type: "json" };

const NUMEROS = ["cero", "uno", "dos", "tres", "cuatro", "cinco", "seis", "siete", "ocho", "nueve", "diez", "once", "doce", "trece"];
type Ficha = Omit<typeof dof1.tirador, "icono"> & { icono: string | null };
export type DatosDof = Omit<typeof dof1, "tirador" | "defensor"> & { tirador: Ficha; defensor: Ficha };
export const DOF: Record<string, DatosDof> = { "dentro-o-fuera-1": dof1, "dentro-o-fuera-2": dof2 };

/** «¿Dentro o fuera?»: voz solo en el gancho y en la revelación (el resto, texto en pantalla). */
const dentroOFuera = (d: DatosDof) => {
  const tira = d.tirador.nombre.split(" ")[0];
  const ataca = d.equipos[d.ataca];
  const defiende = d.equipos[1 - d.ataca];
  const final = d.anota
    ? d.despues[d.ataca] > d.despues[1 - d.ataca] ? `¡Canasta! Ganan los ${ataca.nombre}.` : "¡Canasta! Empate."
    : `¡No entra! Ganan los ${defiende.nombre}.`;
  return [
    { id: "gancho", minimo: 3, texto: "¿Dentro o fuera? Esta vez, defiendes tú." },
    { id: "contexto", minimo: 4.5, texto: "" },
    { id: "duelo", minimo: 4.5, texto: "" },
    { id: "tabla", minimo: 7, texto: "" },
    { id: "pregunta", minimo: 4, texto: "" },
    { id: "revela", minimo: 4.5, texto: `${tira} tira… de ${d.tipo}. Y los ${defiende.nombre} cerraron ${d.cierra}.` },
    { id: "dados", minimo: 4.5, texto: `Necesita ${NUMEROS[d.necesita]}… ${NUMEROS[d.dados[0]]} y ${NUMEROS[d.dados[1]]}.` },
    { id: "final", minimo: 3, texto: final },
    { id: "cierre", minimo: 3.5, texto: "¿Acertaste? Cuéntanoslo en comentarios." },
  ] as const;
};

/** Número en palabras, para que la voz lea bien los marcadores. */
const UNIDADES = ["cero", "uno", "dos", "tres", "cuatro", "cinco", "seis", "siete", "ocho", "nueve", "diez", "once", "doce", "trece", "catorce", "quince", "dieciséis", "diecisiete", "dieciocho", "diecinueve", "veinte", "veintiuno", "veintidós", "veintitrés", "veinticuatro", "veinticinco", "veintiséis", "veintisiete", "veintiocho", "veintinueve"];
const enLetra = (n: number) => UNIDADES[n] ?? (n < 40 ? `treinta y ${UNIDADES[n - 30]}` : String(n));

export type DatosCronica = typeof cronicaDatos;
export const CRONICA: DatosCronica = cronicaDatos;

/** «Crónica»: un partido entero en unos 45 segundos, con la jugada decisiva contada despacio. */
const cronica = (c: DatosCronica) => {
  const [loc, vis] = c.equipos;
  const eq = (lado: number) => c.equipos[lado].nombre;
  // «Los Búhos ganan», «el Vendaval gana»: el artículo y el verbo dependen de si el nombre es plural.
  const plural = (nombre: string) => nombre.endsWith("s");
  const art = (nombre: string) => (plural(nombre) ? "los" : "el");
  const conArt = (nombre: string) => `${art(nombre)} ${nombre}`;
  const mayus = (t: string) => t[0].toUpperCase() + t.slice(1);
  const gana = (nombre: string) => `${conArt(nombre)} ${plural(nombre) ? "ganan" : "gana"}`;
  const marcador = (m: number[]) =>
    m[0] === m[1] ? `empate a ${enLetra(m[0])}` : `${gana(eq(m[0] > m[1] ? 0 : 1))} ${enLetra(Math.max(m[0], m[1]))} a ${enLetra(Math.min(m[0], m[1]))}`;
  const ESTILO: Record<string, string> = { "Vive del triple": "del triple", "Juega dentro": "cerca del aro", "Dentro y fuera": "de todo un poco" };
  const accion = (j: DatosCronica["jugadas"][number]) =>
    j.mate ? "un mate" : j.tapon ? "un tapón" : j.anota ? (j.tipo === "fuera" ? "un triple" : "una canasta") : "un fallo";
  const primera = c.jugadas.find((j) => j.anota) ?? c.jugadas[0];
  const alDescanso = c.jugadas[c.descanso - 1].marcador;
  const d = c.jugadas[c.decisiva.indice];
  const antes = c.decisiva.indice > 0 ? c.jugadas[c.decisiva.indice - 1].marcador : [0, 0];
  const ultimo = c.decisiva.indice === c.jugadas.length - 1;
  const tapon = c.jugadas.find((j, i) => j.tapon && i >= c.descanso);
  const ventaja = c.maxVentaja.puntos >= 3 ? `${mayus(conArt(eq(c.maxVentaja.lado)))} ${plural(eq(c.maxVentaja.lado)) ? "llegan" : "llega"} a ir ${enLetra(c.maxVentaja.puntos)} arriba` : "Nadie se escapa";
  const tira = d.tirador.split(" ")[0];
  const ganador = eq(c.ganador);
  return [
    {
      id: "gancho",
      minimo: 3.5,
      texto: `${mayus(conArt(vis.nombre))} contra ${conArt(loc.nombre)}. ${mayus(enLetra(c.jugadas.length))} ataques… y se decidió en ${ultimo ? "el último" : `el ataque ${c.decisiva.indice + 1}`}.`,
    },
    {
      id: "estilos",
      minimo: 4,
      texto: `${mayus(conArt(loc.nombre))} ${plural(loc.nombre) ? "viven" : "vive"} ${ESTILO[loc.estilo]}. ${mayus(conArt(vis.nombre))}, ${ESTILO[vis.estilo]}.`,
    },
    {
      id: "primera",
      minimo: 0.8 * c.descanso + 1.5,
      texto: `Abre ${primera.tirador.split(" ")[0]} con ${accion(primera)}. Al descanso, ${marcador(alDescanso)}.`,
    },
    {
      id: "segunda",
      minimo: 0.8 * Math.min(8, c.decisiva.indice - c.descanso) + 1.5,
      texto: `${ventaja}${tapon ? `, tapón de ${tapon.defensor.split(" ")[0]}` : ""}… y a falta de ${ultimo ? "un ataque" : "lo mejor"}, ${marcador(antes)}.`,
    },
    {
      id: "decisiva",
      minimo: 8,
      texto: `Tira ${tira}. Va ${d.tipo}… y le cierran ${d.cierra}. ${mayus(enLetra(d.dados[0]))} y ${enLetra(d.dados[1])}.`,
    },
    {
      id: "final",
      minimo: 4,
      texto: `¡${d.mate ? "Mate" : d.tipo === "fuera" ? "Triple" : "Canasta"}! ${mayus(gana(ganador))} ${enLetra(Math.max(...c.final))} a ${enLetra(Math.min(...c.final))}.`,
    },
    { id: "cierre", minimo: 4, texto: "Cada partido, jugada a jugada, en la web de la liga. Enlace en la bio." },
  ] as const;
};

export const GUIONES = {
  "como-se-juega": [
    { id: "gancho", minimo: 2.5, texto: "¿Baloncesto… con cartas y dos dados?" },
    { id: "cartas", minimo: 4.5, texto: "Cada carta tiene ataque y defensa. Nico ataca; Zoe le defiende." },
    { id: "secreto", minimo: 4.5, texto: "Los dos eligen en secreto: dentro vale dos, fuera vale tres… y Zoe ha acertado." },
    { id: "dados", minimo: 5, texto: "Seis y cinco. Dieciocho de ataque, contra catorce de defensa…" },
    { id: "canasta", minimo: 3, texto: "¡Canasta!" },
    { id: "cierre", minimo: 3.5, texto: "Liga Nimbo. Reglas y cartas para imprimir, en el enlace de la bio." },
  ],
  amistoso: [
    { id: "gancho", minimo: 3, texto: "Amistoso de pretemporada. Muerte súbita… y los Lobos ganan de dos." },
    { id: "reto", minimo: 5, texto: "Último ataque de los Gigantes. Una canasta de dos solo les da el empate. Para ganar, necesitan un triple." },
    { id: "tiradora", minimo: 4, texto: "Tira Carla Echeverría. Ataque: dos. No es una tiradora." },
    { id: "farol", minimo: 5, texto: "Los Lobos esperan que vaya a lo seguro, y cierran dentro. Pero Carla… tira de tres." },
    { id: "necesita", minimo: 10, texto: "La defensa de Ciro vale siete. Para meter un triple, hay que superarla por dos: nueve. Carla pone dos de ataque… así que los dados tienen que sumar siete o más." },
    { id: "dados", minimo: 4, texto: "Tres… y seis. ¡Nueve!" },
    { id: "final", minimo: 3.5, texto: "¡Triple! Los Gigantes ganan diez a nueve." },
    { id: "cierre", minimo: 3.5, texto: "La Temporada 1 empieza el doce de enero. ¿Con quién vas?" },
  ],
  "dentro-o-fuera-1": dentroOFuera(dof1),
  "dentro-o-fuera-2": dentroOFuera(dof2),
  cronica: cronica(cronicaDatos),
} as const;

export type Reel = keyof typeof GUIONES;
