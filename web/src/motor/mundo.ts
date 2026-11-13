// Generación del mundo: franquicias, cartas de jugador y draft de fundación.
import { type Azar, barajar, crearAzar, elegir, gauss } from "./azar.ts";
import { APELLIDOS, HISTORIAS, NEGOCIOS, NOMBRES, ORIGENES_EXTRANJEROS } from "./nombres.ts";
import type { Carta, Icono } from "./reglas.ts";
import type { Estilo } from "./ia.ts";

export const CARTAS_POR_EQUIPO = 4;

/** Lo que busca una franquicia en el draft: da forma a su plantilla. */
export interface Filosofia {
  ataque?: number;
  defensa?: number;
  icono?: Icono;
  edad?: "joven" | "veterana";
}

export interface Franquicia {
  id: string;
  ciudad: string;
  nombre: string;
  mercado: "grande" | "mediano" | "pequeño";
  colores: [string, string];
  /** Una frase sobre la ciudad y su forma de entender el baloncesto. */
  caracter: string;
  filosofia: Filosofia;
  estilo: Estilo;
  plantilla: string[];
  /** Economía del club (ver verano.ts). */
  club: Club;
}

export interface Club {
  /** Ahorro que pasa de un verano al siguiente. */
  ahorro: number;
  /** Nivel de ojeadores (0-3): ver el potencial de las cartas del draft. */
  ojeadores: number;
  /** Nivel del centro de entrenamiento (0-3): +1 al dado de evolución de las jóvenes por nivel. */
  entrenamiento: number;
  /** Presupuesto de la última temporada, cuando ya ha habido un verano. */
  presupuesto: number | null;
}

export interface Jugador extends Carta {
  genero: "f" | "m";
  edad: number;
  origen: string;
  historia: string;
  rasgo: string | null;
  /** Sueldo de 1 a 5, según el valor de la carta. */
  sueldo: number;
  /** Temporadas de contrato que le quedan. */
  contrato: number;
  estado: "activa" | "libre" | "retirada";
  /** Franquicia actual ("" si está libre o retirada). */
  franquicia: string;
}

// Nombres provisionales: la identidad definitiva la votarán los socios.
// Cada ciudad tiene un carácter y una filosofía que guían su draft y su estilo de juego.
export const FRANQUICIAS: Omit<Franquicia, "plantilla" | "club">[] = [
  { id: "PAL", ciudad: "Puerto Albar", nombre: "Albatros", mercado: "mediano", colores: ["#1D3557", "#E9C46A"],
    caracter: "Ciudad portuaria y obrera. Aquí se gana trabajando atrás.", filosofia: { defensa: 1 }, estilo: { fuera: 0.4 } },
  { id: "VAL", ciudad: "Valcierzo", nombre: "Vendaval", mercado: "mediano", colores: ["#2A9D8F", "#F1FAEE"],
    caracter: "La ciudad del viento. Juego rápido y triples a la mínima.", filosofia: { ataque: 0.6, icono: "Tiro" }, estilo: { fuera: 0.7 } },
  { id: "OST", ciudad: "Ostria", nombre: "Coronas", mercado: "grande", colores: ["#6A0DAD", "#FFD166"],
    caracter: "La capital. Dinero, focos y estrellas que tienen que ganar ya.", filosofia: { ataque: 1 }, estilo: { fuera: 0.5 } },
  { id: "MIR", ciudad: "Mirasol", nombre: "Halcones", mercado: "grande", colores: ["#F4A261", "#264653"],
    caracter: "Costa y glamour. Su afición quiere espectáculo de fuera.", filosofia: { ataque: 0.6, icono: "Tiro" }, estilo: { fuera: 0.65 } },
  { id: "TOR", ciudad: "Torreal", nombre: "Gigantes", mercado: "mediano", colores: ["#5C5C5C", "#E63946"],
    caracter: "Ciudad industrial. Defensa, dureza y nada de florituras.", filosofia: { defensa: 1, icono: "Muro" }, estilo: { fuera: 0.3 } },
  { id: "BRE", ciudad: "Las Brezas", nombre: "Corsarios", mercado: "pequeño", colores: ["#0B6E4F", "#FAF3DD"],
    caracter: "La más pequeña. Nadie cuenta con ellos, y eso les encanta.", filosofia: { defensa: 0.6, edad: "joven" }, estilo: { fuera: 0.45 } },
  { id: "FER", ciudad: "Ciudad Ferro", nombre: "Forjadores", mercado: "mediano", colores: ["#8B2500", "#D9D9D9"],
    caracter: "La franquicia con más tradición. Confía en la veteranía.", filosofia: { edad: "veterana" }, estilo: { fuera: 0.45 } },
  { id: "ALC", ciudad: "Alcorva", nombre: "Cuervos", mercado: "pequeño", colores: ["#111111", "#C1121F"],
    caracter: "Ciudad universitaria. Cantera, juventud y paciencia.", filosofia: { edad: "joven" }, estilo: { fuera: 0.5 } },
  { id: "STE", ciudad: "San Telmar", nombre: "Relámpagos", mercado: "grande", colores: ["#003F88", "#FDC500"],
    caracter: "El eterno rival de Ostria. Orgullo y tiradores.", filosofia: { ataque: 0.5, icono: "Tiro" }, estilo: { fuera: 0.6 } },
  { id: "EBA", ciudad: "Nuevo Ébano", nombre: "Panteras", mercado: "grande", colores: ["#3C096C", "#00B4D8"],
    caracter: "Ciudad nueva y con prisa. Atacar, atacar y atacar.", filosofia: { ataque: 1 }, estilo: { fuera: 0.55 } },
  { id: "SGR", ciudad: "Sierra Gris", nombre: "Lobos", mercado: "pequeño", colores: ["#495867", "#BDD5EA"],
    caracter: "Montaña y frío. El pabellón más temido de la liga.", filosofia: { defensa: 0.8, icono: "Muro" }, estilo: { fuera: 0.35 } },
  { id: "VLU", ciudad: "Valdelaluna", nombre: "Búhos", mercado: "pequeño", colores: ["#1B1B3A", "#E0AFA0"],
    caracter: "Ciudad nocturna y afición ruidosa. Todo pasa cerca del aro.", filosofia: { ataque: 0.4, icono: "Pintura" }, estilo: { fuera: 0.3 } },
];

// Solo afectan a la gestión del club, nunca al partido.
export const RASGOS: Record<string, string> = {
  "Corazón del club": "Acepta renovar por menos si es para quedarse.",
  "A sueldo": "Pide el traspaso si su equipo se queda sin playoffs.",
  "Veteranía": "Ayuda a mejorar a las cartas jóvenes de su equipo.",
  "Esfuerzo": "Tiene más opciones de mejorar al acabar la temporada.",
  "Polvorín": "Talento y conflictos a partes iguales.",
  "Imán de prensa": "Todo lo que hace es noticia.",
};

const ICONOS: Icono[] = ["Tiro", "Pintura", "Muro"];
const limitar = (v: number, min: number, max: number) => Math.max(min, Math.min(max, Math.round(v)));

/** Valor de una carta para comparar y para el salario: un icono vale más o menos un punto. */
export const valorCarta = (c: Carta) => c.ataque + c.defensa + (c.icono ? 1 : 0);

/** Sueldo según el valor de la carta: hasta 6, 1; 7, 2; 8, 3; 9, 4; 10 o más, 5. */
export function sueldoDe(c: Carta): number {
  const v = valorCarta(c);
  return v <= 6 ? 1 : v >= 10 ? 5 : v - 5;
}

export function generarJugador(azar: Azar, id: string, genero: "f" | "m", total: number, usados: Set<string>, edad?: number): Jugador {
  const local = azar() < 0.7;
  const procedencia = local ? "local" : "extranjero";
  let nombre: string;
  do {
    nombre = `${elegir(azar, NOMBRES[procedencia][genero])} ${elegir(azar, APELLIDOS[procedencia])}`;
  } while (usados.has(nombre));
  usados.add(nombre);
  const origen = local ? elegir(azar, FRANQUICIAS).ciudad : elegir(azar, ORIGENES_EXTRANJEROS);

  // Reparto del total entre ataque y defensa: perfiles atacantes, defensivos y equilibrados.
  const sesgo = gauss(azar, 0, 1.4);
  const ataque = limitar(total / 2 + sesgo, 2, 6);
  const defensa = limitar(total - ataque, 2, 6);
  let icono: Icono | null = null;
  if (azar() < 0.55) {
    if (ataque >= defensa + 2) icono = azar() < 0.5 ? "Tiro" : "Pintura";
    else if (defensa >= ataque + 2) icono = "Muro";
    else icono = elegir(azar, ICONOS);
  }

  const carta: Carta = { id, nombre, ataque, defensa, icono };
  return {
    ...carta,
    genero,
    edad: edad ?? Math.round(19 + azar() * 16),
    origen,
    historia: elegir(azar, HISTORIAS).replace("{origen}", origen).replace("{negocio}", elegir(azar, NEGOCIOS)),
    rasgo: azar() < 0.45 ? elegir(azar, Object.keys(RASGOS)) : null,
    sueldo: sueldoDe(carta),
    contrato: 1,
    estado: "activa",
    franquicia: "",
  };
}

export function generarMundo(semilla: string) {
  const azar = crearAzar(`mundo-${semilla}`);
  const cantidad = FRANQUICIAS.length * CARTAS_POR_EQUIPO;
  // Mitad y mitad, en orden aleatorio.
  const generos = barajar(azar, Array.from({ length: cantidad }, (_, i) => (i % 2 ? "f" : "m") as "f" | "m"));
  // Suma de ataque y defensa: casi todos entre 5 y 8; unas pocas estrellas por encima.
  const totales = Array.from({ length: cantidad }, () => limitar(gauss(azar, 6.3, 1.2), 3, 10));
  for (const i of barajar(azar, [...totales.keys()]).slice(0, 6)) totales[i] = Math.min(11, totales[i] + 2);

  const usados = new Set<string>();
  const jugadores = totales.map((t, i) => generarJugador(azar, `J${String(i + 1).padStart(2, "0")}`, generos[i], t, usados));
  const { orden, elecciones } = draftFundacion(azar, jugadores);

  const franquicias: Franquicia[] = FRANQUICIAS.map((f) => ({
    ...f,
    estilo: { ...f.estilo },
    plantilla: elecciones.filter((e) => e.franquicia === f.id).map((e) => e.jugador),
    club: { ahorro: 0, ojeadores: 0, entrenamiento: 0, presupuesto: null },
  }));
  // Contratos con su propia secuencia aleatoria, para no cambiar las cartas ya generadas.
  const azarContratos = crearAzar(`contratos-${semilla}`);
  for (const j of jugadores) j.contrato = 1 + Math.floor(azarContratos() * 3);
  return {
    semilla,
    temporada: 1,
    franquicias,
    jugadores: Object.fromEntries(jugadores.map((j) => [j.id, j])),
    /** Cartas sin equipo, disponibles en la agencia libre. */
    libres: [] as string[],
    draftFundacion: { orden, elecciones },
    rasgos: RASGOS,
  };
}

/** Techo secreto de una carta: lo máximo que pueden sumar su Ataque y su Defensa. Las jóvenes tienen margen. */
export function techo(azar: Azar, j: Jugador): number {
  const margen = j.edad <= 21 ? 1 + Math.floor(azar() * 5) : j.edad <= 23 ? Math.floor(azar() * 5) : j.edad <= 26 ? Math.floor(azar() * 3) : 0;
  return Math.min(12, j.ataque + j.defensa + margen);
}

/** Potenciales secretos (no se publican: se guardan en datos/potenciales.json, fuera del repositorio). */
export function generarPotenciales(mundo: { semilla: string; jugadores: Record<string, Jugador> }): Record<string, number> {
  const azar = crearAzar(`potencial-${mundo.semilla}`);
  return Object.fromEntries(Object.values(mundo.jugadores).map((j) => [j.id, techo(azar, j)]));
}

export type Mundo = ReturnType<typeof generarMundo>;

/** Cuánto le gusta una carta a una franquicia según su filosofía. */
export function afinidad(f: Filosofia, j: Jugador): number {
  return (
    (f.ataque ?? 0) * (j.ataque - 3.5) * 0.6 +
    (f.defensa ?? 0) * (j.defensa - 3.5) * 0.6 +
    (f.icono && j.icono === f.icono ? 1.4 : 0) +
    (f.edad === "joven" && j.edad <= 23 ? 1.2 : 0) +
    (f.edad === "veterana" && j.edad >= 29 ? 1.2 : 0)
  );
}

/** Draft en serpiente: cada franquicia elige según su filosofía y lo que ve de cada carta (con ruido: información incompleta). */
function draftFundacion(azar: Azar, jugadores: Jugador[]) {
  const orden = barajar(azar, FRANQUICIAS.map((f) => f.id));
  const percepcion = new Map(jugadores.map((j) => [j.id, valorCarta(j) + gauss(azar, 0, 0.8)]));
  const disponibles = new Set(jugadores.map((j) => j.id));
  const porId = new Map(jugadores.map((j) => [j.id, j]));
  const elecciones: { numero: number; ronda: number; franquicia: string; jugador: string }[] = [];
  for (let ronda = 0; ronda < CARTAS_POR_EQUIPO; ronda++) {
    const turno = ronda % 2 === 0 ? orden : [...orden].reverse();
    for (const franquicia of turno) {
      const filosofia = FRANQUICIAS.find((f) => f.id === franquicia)!.filosofia;
      const puntuacion = (id: string) => percepcion.get(id)! + afinidad(filosofia, porId.get(id)!);
      const elegido = [...disponibles].sort((a, b) => puntuacion(b) - puntuacion(a))[0];
      disponibles.delete(elegido);
      porId.get(elegido)!.franquicia = franquicia;
      elecciones.push({ numero: elecciones.length + 1, ronda: ronda + 1, franquicia, jugador: elegido });
    }
  }
  return { orden, elecciones };
}

/** Perfil de juego de una franquicia, calculado a partir de sus cartas y su estilo. */
export function perfilEquipo(f: Franquicia, jugadores: Record<string, Jugador>) {
  const cartas = f.plantilla.map((id) => jugadores[id]);
  const ataque = cartas.reduce((s, c) => s + c.ataque, 0);
  const defensa = cartas.reduce((s, c) => s + c.defensa, 0);
  const iconos = cartas.map((c) => c.icono).filter((i): i is Icono => i !== null);
  const edadMedia = Math.round(cartas.reduce((s, c) => s + c.edad, 0) / cartas.length);
  const estrella = [...cartas].sort((a, b) => valorCarta(b) - valorCarta(a))[0];
  const balance = ataque - defensa;
  return {
    ataque,
    defensa,
    iconos,
    edadMedia,
    estrella,
    perfil: balance >= 3 ? "Ofensivo" : balance <= -3 ? "Defensivo" : "Equilibrado",
    estilo: f.estilo.fuera >= 0.6 ? "Vive del triple" : f.estilo.fuera <= 0.4 ? "Juega dentro" : "Dentro y fuera",
  };
}
