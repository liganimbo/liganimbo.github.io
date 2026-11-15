// Reglas del partido de Nimbo (REGLAMENTO.md v0.5). Sin decisiones: eso es cosa de quien juega o de la IA.

export type Icono = "Tiro" | "Aro" | "Muro";
export type Tipo = "dentro" | "fuera";
export type Lado = 0 | 1;

export interface Carta {
  id: string;
  nombre: string;
  ataque: number;
  defensa: number;
  icono: Icono | null;
}

/** Versión del reglamento (REGLAMENTO.md). */
export const VERSION_REGLAMENTO = "0.5";

export const REGLAS = {
  fichasPorCarta: 2,
  ataquesPorEquipo: 8,
  descansoTras: 4,
  baseDefensa: 5,
  bonusTiro: 1,
  bonusAro: 2,
  bonusMuro: 2,
  /** El Muro solo suma contra los tiros de dentro. */
  muroSoloDentro: true,
  bonusCierre: 2,
  margenFuera: 2,
  /** Canasta de dentro que supera a la defensa por esto o más: mate. Solo se cuenta, no cambia nada. */
  margenMate: 6,
  /** Tiro de dentro que se queda corto por esto o más: tapón. Solo se cuenta, no cambia nada. */
  margenTapon: 4,
  puntos: { dentro: 2, fuera: 3 } as Record<Tipo, number>,
};

/** Texto de cada icono, sacado de los números de las reglas. */
export const DESCRIPCION_ICONO: Record<Icono, string> = {
  get Tiro() {
    return `+${REGLAS.bonusTiro} al tirar de fuera`;
  },
  get Aro() {
    return `+${REGLAS.bonusAro} al tirar de dentro`;
  },
  get Muro() {
    return `+${REGLAS.bonusMuro} al defender ${REGLAS.muroSoloDentro ? "tiros de dentro" : "cualquier tiro"}`;
  },
};

export interface Equipo {
  franquicia: string;
  cartas: Record<string, Carta>;
  pista: string[];
  suplente: string | null;
  /** id del rival en pista → id de quien le marca. */
  marcajes: Record<string, string>;
  /** Tiros que le quedan a cada carta. */
  fichas: Record<string, number>;
  cambioHecho: boolean;
  tiempoMuertoUsado: boolean;
}

export interface Jugada {
  equipo: Lado;
  tirador: string;
  defensor: string;
  tipo: Tipo;
  cierra: Tipo;
  dados: [number, number];
  ataque: number;
  defensa: number;
  necesita: number;
  anota: boolean;
  puntos: number;
  mate: boolean;
  tapon: boolean;
  marcador: [number, number];
  tiempoMuerto?: { dadosAnteriores: [number, number] };
}

export interface Cambio {
  tras: number;
  equipo: Lado;
  sale: string;
  entra: string;
}

export type Fase = "juego" | "descanso" | "final";

export interface Partido {
  equipos: [Equipo, Equipo];
  puntos: [number, number];
  ataques: [number, number];
  turno: Lado;
  fase: Fase;
  descansoHecho: boolean;
  jugadas: Jugada[];
  cambios: Cambio[];
  ganador: Lado | null;
}

export interface Alineacion {
  franquicia: string;
  cartas: Carta[];
  pista: string[];
  suplente: string | null;
}

export const rival = (lado: Lado): Lado => (lado === 0 ? 1 : 0);

export function crearPartido(a: Alineacion, b: Alineacion, primero: Lado): Partido {
  const equipo = (al: Alineacion): Equipo => ({
    franquicia: al.franquicia,
    cartas: Object.fromEntries(al.cartas.map((c) => [c.id, c])),
    pista: [...al.pista],
    suplente: al.suplente,
    marcajes: {},
    fichas: Object.fromEntries(al.cartas.map((c) => [c.id, REGLAS.fichasPorCarta])),
    cambioHecho: false,
    tiempoMuertoUsado: false,
  });
  return {
    equipos: [equipo(a), equipo(b)],
    puntos: [0, 0],
    ataques: [0, 0],
    turno: primero,
    fase: "juego",
    descansoHecho: false,
    jugadas: [],
    cambios: [],
    ganador: null,
  };
}

/** Fija a quién marca cada jugador en pista de `lado`. Debe ser uno a uno con la pista rival. */
export function fijarMarcajes(p: Partido, lado: Lado, marcajes: Record<string, string>) {
  const propios = p.equipos[lado].pista;
  const rivales = p.equipos[rival(lado)].pista;
  const asignados = rivales.map((r) => marcajes[r]);
  if (asignados.some((d) => !propios.includes(d)) || new Set(asignados).size !== propios.length) {
    throw new Error("Marcajes no válidos: cada jugador en pista debe marcar a un rival distinto.");
  }
  p.equipos[lado].marcajes = Object.fromEntries(rivales.map((r) => [r, marcajes[r]]));
}

export const carta = (p: Partido, lado: Lado, id: string) => p.equipos[lado].cartas[id];

/** ¿Se ha pasado de los 8 ataques? Entonces es muerte súbita y puede tirar cualquiera de pista. */
export const enProrroga = (p: Partido, lado: Lado) => p.ataques[lado] >= REGLAS.ataquesPorEquipo;

export function tiradoresDisponibles(p: Partido): string[] {
  const eq = p.equipos[p.turno];
  if (enProrroga(p, p.turno)) return [...eq.pista];
  return eq.pista.filter((id) => eq.fichas[id] > 0);
}

export function valorAtaque(c: Carta, tipo: Tipo): number {
  if (c.icono === "Tiro" && tipo === "fuera") return c.ataque + REGLAS.bonusTiro;
  if (c.icono === "Aro" && tipo === "dentro") return c.ataque + REGLAS.bonusAro;
  return c.ataque;
}

export function valorDefensa(c: Carta, tipo: Tipo, cierra: Tipo): number {
  return (
    REGLAS.baseDefensa +
    c.defensa +
    (c.icono === "Muro" && (!REGLAS.muroSoloDentro || tipo === "dentro") ? REGLAS.bonusMuro : 0) +
    (cierra === tipo ? REGLAS.bonusCierre : 0)
  );
}

/** Lo que tienen que sumar los dos dados para que entre. */
export function necesita(atacante: Carta, defensor: Carta, tipo: Tipo, cierra: Tipo): number {
  const margen = tipo === "fuera" ? REGLAS.margenFuera : 0;
  return valorDefensa(defensor, tipo, cierra) + margen - valorAtaque(atacante, tipo);
}

const FORMAS_DE_SUMAR = [0, 0, 1, 2, 3, 4, 5, 6, 5, 4, 3, 2, 1];
/** Probabilidad de que dos dados sumen `n` o más. */
export function probabilidad(n: number): number {
  if (n <= 2) return 1;
  if (n > 12) return 0;
  return FORMAS_DE_SUMAR.slice(n).reduce((s, x) => s + x, 0) / 36;
}

export const defensorDe = (p: Partido, tirador: string) => p.equipos[rival(p.turno)].marcajes[tirador];

/** Resuelve un ataque del equipo con el turno. */
export function atacar(p: Partido, tirador: string, tipo: Tipo, cierra: Tipo, dados: [number, number]): Jugada {
  if (p.fase !== "juego") throw new Error(`No se puede atacar en la fase "${p.fase}".`);
  if (!tiradoresDisponibles(p).includes(tirador)) throw new Error("Ese jugador no puede tirar ahora.");
  const lado = p.turno;
  const defensor = defensorDe(p, tirador);
  const jugada = resolver(p, lado, tirador, defensor, tipo, cierra, dados);
  p.jugadas.push(jugada);
  if (!enProrroga(p, lado)) p.equipos[lado].fichas[tirador] -= 1;
  p.ataques[lado] += 1;
  p.turno = rival(lado);
  comprobarEstado(p, lado);
  return jugada;
}

function resolver(p: Partido, lado: Lado, tirador: string, defensor: string, tipo: Tipo, cierra: Tipo, dados: [number, number]): Jugada {
  const at = carta(p, lado, tirador);
  const de = carta(p, rival(lado), defensor);
  const ataque = dados[0] + dados[1] + valorAtaque(at, tipo);
  const defensa = valorDefensa(de, tipo, cierra);
  const anota = ataque >= defensa + (tipo === "fuera" ? REGLAS.margenFuera : 0);
  const puntos = anota ? REGLAS.puntos[tipo] : 0;
  p.puntos[lado] += puntos;
  return {
    equipo: lado,
    tirador,
    defensor,
    tipo,
    cierra,
    dados,
    ataque,
    defensa,
    necesita: necesita(at, de, tipo, cierra),
    anota,
    puntos,
    mate: tipo === "dentro" && anota && ataque - defensa >= REGLAS.margenMate,
    tapon: tipo === "dentro" && !anota && defensa - ataque >= REGLAS.margenTapon,
    marcador: [p.puntos[0], p.puntos[1]],
  };
}

/** ¿Puede `lado` pedir tiempo muerto para repetir su último ataque fallado? */
export function puedeTiempoMuerto(p: Partido, lado: Lado): boolean {
  const ultima = p.jugadas.at(-1);
  // Vale también si ese fallo acaba de cerrar el partido por el límite de ataques.
  return (
    (p.fase !== "final" || p.ganador !== lado) &&
    !p.equipos[lado].tiempoMuertoUsado &&
    !!ultima &&
    ultima.equipo === lado &&
    !ultima.anota &&
    !ultima.tiempoMuerto
  );
}

export function tiempoMuerto(p: Partido, lado: Lado, dados: [number, number]): Jugada {
  if (!puedeTiempoMuerto(p, lado)) throw new Error("No se puede pedir tiempo muerto ahora.");
  const anterior = p.jugadas.pop()!;
  p.equipos[lado].tiempoMuertoUsado = true;
  const nueva = resolver(p, lado, anterior.tirador, anterior.defensor, anterior.tipo, anterior.cierra, dados);
  nueva.tiempoMuerto = { dadosAnteriores: anterior.dados };
  p.jugadas.push(nueva);
  if (p.fase === "final") {
    p.fase = "juego";
    p.ganador = null;
  }
  comprobarEstado(p, lado);
  return nueva;
}

function comprobarEstado(p: Partido, lado: Lado) {
  const [a, b] = p.ataques;
  // El partido acaba cuando los dos han atacado lo mismo (8 o más) y no hay empate.
  if (a === b && a >= REGLAS.ataquesPorEquipo && p.puntos[0] !== p.puntos[1]) {
    p.ganador = p.puntos[0] > p.puntos[1] ? 0 : 1;
    p.fase = "final";
    return;
  }
  if (!p.descansoHecho && a >= REGLAS.descansoTras && b >= REGLAS.descansoTras) p.fase = "descanso";
}

/** Quién puede salir en el descanso: solo quien ya ha gastado sus tiros. */
export function puedenSalir(p: Partido, lado: Lado): string[] {
  const eq = p.equipos[lado];
  return eq.pista.filter((id) => eq.fichas[id] === 0);
}

/** Cambio obligatorio del descanso: sale `sale` y entra el suplente. */
export function cambiar(p: Partido, lado: Lado, sale: string) {
  const eq = p.equipos[lado];
  if (p.fase !== "descanso" || eq.cambioHecho) throw new Error("Los cambios solo se hacen en el descanso, uno por equipo.");
  if (!eq.suplente || !puedenSalir(p, lado).includes(sale)) throw new Error("Solo puede salir quien ya ha gastado sus tiros.");
  const entra = eq.suplente;
  eq.pista = eq.pista.map((id) => (id === sale ? entra : id));
  eq.suplente = sale;
  eq.cambioHecho = true;
  p.cambios.push({ tras: p.jugadas.length, equipo: lado, sale, entra });
}

/** Cierra el descanso. Antes hay que hacer los dos cambios y volver a fijar los marcajes. */
export function terminarDescanso(p: Partido) {
  if (p.fase !== "descanso") return;
  if (p.equipos.some((eq) => eq.suplente && !eq.cambioHecho)) throw new Error("Falta el cambio de algún equipo.");
  p.descansoHecho = true;
  p.fase = "juego";
}

// --- Estadísticas -------------------------------------------------------------

export interface LineaJugador {
  pts: number;
  dentro: [number, number];
  fuera: [number, number];
  paradas: number;
  marcados: number;
  mates: number;
  tapones: number;
}

export const lineaVacia = (): LineaJugador => ({ pts: 0, dentro: [0, 0], fuera: [0, 0], paradas: 0, marcados: 0, mates: 0, tapones: 0 });

export function estadisticas(p: Partido): Record<string, LineaJugador> {
  const stats: Record<string, LineaJugador> = {};
  for (const eq of p.equipos) for (const id of Object.keys(eq.cartas)) stats[id] = lineaVacia();
  for (const j of p.jugadas) {
    const at = stats[j.tirador];
    const de = stats[j.defensor];
    at.pts += j.puntos;
    const casilla = at[j.tipo];
    casilla[1] += 1;
    if (j.anota) casilla[0] += 1;
    de.marcados += 1;
    if (!j.anota) de.paradas += 1;
    if (j.mate) at.mates += 1;
    if (j.tapon) de.tapones += 1;
  }
  return stats;
}

export const valoracionPartido = (l: LineaJugador) => l.pts + l.paradas;

export function mejorDelPartido(p: Partido): string {
  const stats = estadisticas(p);
  return Object.entries(stats).sort(([, a], [, b]) => valoracionPartido(b) - valoracionPartido(a) || b.pts - a.pts)[0][0];
}
