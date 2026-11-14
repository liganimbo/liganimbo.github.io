// Guiones de los Reels: qué dice la voz en cada escena y cuánto dura como mínimo (en segundos).
// Si la voz es más larga, la escena se alarga para que quepa (ver tiempos.ts). Sin texto, la escena va sin voz.
import dof1 from "./datos/dof-1.json" with { type: "json" };
import dof2 from "./datos/dof-2.json" with { type: "json" };

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
} as const;

export type Reel = keyof typeof GUIONES;
