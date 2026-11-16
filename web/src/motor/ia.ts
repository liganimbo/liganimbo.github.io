// Decisiones automáticas: rivales en la web y plan de partido de las franquicias en la liga.
import { type Azar, dosDados, ponderado } from "./azar.ts";
import {
  type Carta,
  type Lado,
  type Partido,
  type Tipo,
  REGLAS,
  atacar,
  cambiar,
  carta,
  crearPartido,
  defensorDe,
  fijarDuelos,
  LOCAL,
  necesita,
  probabilidad,
  puedeTiempoMuerto,
  puedenSalir,
  rival,
  terminarDescanso,
  tiempoMuerto,
  tiradoresDisponibles,
  valorAtaque,
  VISITANTE,
} from "./reglas.ts";

/**
 * Lo que una franquicia hace siempre en el final apretado: sus dos últimos ataques con el marcador a 3 o menos, y la muerte
 * súbita. Las manías no las aprende nadie: están para que se vean y se cuenten.
 */
export type Firma =
  /** Tira siempre dentro, o siempre de fuera. */
  | { tipo: "tiro"; va: Tipo }
  /** Cuando ataca el rival, cierra siempre lo mismo. */
  | { tipo: "cierre"; cierra: Tipo }
  /** Su estrella (la carta con más Ataque) se guarda un tiro para el final, tira en cuanto puede o espera a la 2.ª parte. */
  | { tipo: "estrella"; cuando: "final" | "pronto" | "segunda" }
  /** Tira lo que menos le conviene: lo que nadie espera. */
  | { tipo: "contraria" };

/** Manías de juego de un equipo. `fuera`: parte de sus tiros que van de fuera (0-1), o null para lo que digan las cartas. */
export interface Estilo {
  fuera: number | null;
  firma: Firma | null;
}
export const ESTILO_NEUTRO: Estilo = { fuera: null, firma: null };

export function describirFirma(f: Firma): string {
  if (f.tipo === "tiro") return f.va === "fuera" ? "En el final apretado, siempre de 3." : "En el final apretado, siempre dentro.";
  if (f.tipo === "cierre") return `Cuando el rival se la juega al final, cierra ${f.cierra}.`;
  if (f.tipo === "contraria") return "En el final apretado, lo que nadie espera.";
  if (f.cuando === "final") return "El último tiro es para su estrella.";
  if (f.cuando === "pronto") return "Su estrella tira en cuanto puede.";
  return "Su estrella no tira hasta la 2.ª parte.";
}

/** Los dos últimos ataques de `lado` con el marcador a 3 o menos, y la muerte súbita. */
export function finalApretado(p: Partido, lado: Lado): boolean {
  return p.ataques[lado] >= REGLAS.ataquesPorEquipo - 2 && Math.abs(p.puntos[lado] - p.puntos[rival(lado)]) <= 3;
}

/** La carta del equipo con más Ataque (contando su icono). */
export function estrella(p: Partido, lado: Lado): string {
  const cartas = Object.values(p.equipos[lado].cartas);
  return cartas.sort((a, b) => amenaza(b) - amenaza(a))[0].id;
}

const TIPOS: Tipo[] = ["dentro", "fuera"];
const valorCarta = (c: Carta) => c.ataque + c.defensa + (c.icono ? 1 : 0);
const amenaza = (c: Carta) => Math.max(...TIPOS.map((tipo) => valorAtaque(c, tipo)));
const muralla = (c: Carta) => c.defensa + (c.icono === "Muro" ? REGLAS.bonusMuro / 2 : 0);

export function alinear(cartas: Carta[]): { pista: string[]; suplente: string | null } {
  const orden = [...cartas].sort((a, b) => valorCarta(b) - valorCarta(a));
  return { pista: orden.slice(0, 3).map((c) => c.id), suplente: orden[3]?.id ?? null };
}

/** Puntos esperados de `at` tirando `tipo` contra `de`, si la defensa cierra al 50%. */
function esperado(at: Carta, de: Carta, tipo: Tipo) {
  const pCierra = probabilidad(necesita(at, de, tipo, tipo));
  const pAbierto = probabilidad(necesita(at, de, tipo, tipo === "dentro" ? "fuera" : "dentro"));
  return REGLAS.puntos[tipo] * (pCierra + pAbierto) / 2;
}
const esperadoContra = (at: Carta, de: Carta) => Math.max(...TIPOS.map((tipo) => esperado(at, de, tipo)));

function permutaciones<T>(lista: T[]): T[][] {
  if (lista.length <= 1) return [lista];
  return lista.flatMap((x, i) => permutaciones([...lista.slice(0, i), ...lista.slice(i + 1)]).map((resto) => [x, ...resto]));
}

/** Los duelos que más convienen al local: lo que anotan los suyos menos lo que anotan los rivales, según los tiros que les quedan. */
export function emparejar(p: Partido): Record<string, string> {
  const locales = p.equipos[LOCAL].pista;
  const valor = (visitantes: string[]) =>
    locales.reduce((suma, l, i) => {
      const mio = carta(p, LOCAL, l);
      const suyo = carta(p, VISITANTE, visitantes[i]);
      const tiros = (lado: Lado, id: string) => Math.max(p.equipos[lado].fichas[id], 0.5);
      return suma + esperadoContra(mio, suyo) * tiros(LOCAL, l) - esperadoContra(suyo, mio) * tiros(VISITANTE, visitantes[i]);
    }, 0);
  const mejor = permutaciones(p.equipos[VISITANTE].pista).sort((a, b) => valor(b) - valor(a))[0];
  return Object.fromEntries(locales.map((l, i) => [l, mejor[i]]));
}

/** Puntos esperados de cada opción de ataque, suponiendo que la defensa cierra al 50%. */
export function opcionesDeAtaque(p: Partido) {
  const lado = p.turno;
  return tiradoresDisponibles(p).flatMap((id) => {
    const at = carta(p, lado, id);
    const de = carta(p, rival(lado), defensorDe(p, id));
    return TIPOS.map((tipo) => ({ tirador: id, tipo, esperado: esperado(at, de, tipo) }));
  });
}

export function decidirAtaque(p: Partido, azar: Azar, estilo = ESTILO_NEUTRO): { tirador: string; tipo: Tipo } {
  const lado = p.turno;
  const final = finalApretado(p, lado);
  const firma = estilo.firma;
  let opciones = opcionesDeAtaque(p);
  const mejor = (lista: typeof opciones) => lista.reduce((a, b) => (b.esperado > a.esperado ? b : a));

  // La estrella: se reserva o se fuerza según su firma. Si es la única que puede tirar, tira.
  if (firma?.tipo === "estrella") {
    const id = estrella(p, lado);
    const suyas = opciones.filter((o) => o.tirador === id);
    const otras = opciones.filter((o) => o.tirador !== id);
    if (suyas.length) {
      const fichas = p.equipos[lado].fichas[id];
      if ((firma.cuando === "final" && final) || (firma.cuando === "pronto" && !p.descansoHecho)) opciones = suyas;
      else if (otras.length && ((firma.cuando === "final" && fichas <= 1) || (firma.cuando === "segunda" && !p.descansoHecho))) opciones = otras;
    }
  }
  if (final && firma?.tipo === "tiro") {
    const { tirador, tipo } = mejor(opciones.filter((o) => o.tipo === firma.va));
    return { tirador, tipo };
  }
  if (final && firma?.tipo === "contraria") {
    const { tirador, tipo } = mejor(opciones);
    return { tirador, tipo: tipo === "dentro" ? "fuera" : "dentro" };
  }

  // Dentro o fuera según su estilo; si no tiene, lo que digan las cartas.
  if (estilo.fuera !== null) {
    const tipo: Tipo = azar() < estilo.fuera ? "fuera" : "dentro";
    opciones = opciones.filter((o) => o.tipo === tipo);
  }
  const { tirador, tipo } = ponderado(
    azar,
    opciones.map((o) => {
      // Antes del descanso conviene gastar los tiros de quien peor defiende: será quien salga.
      const flojo = p.descansoHecho ? 1 : 1 + 0.12 * (6 - muralla(carta(p, lado, o.tirador)));
      // Las mejores opciones pesan mucho más, pero nunca es del todo previsible.
      return { valor: o, peso: Math.exp(o.esperado / 0.3) * flojo };
    }),
  );
  return { tirador, tipo };
}

/** Cierra lo que más daño puede hacer el rival, con algo de farol; en el final apretado, lo que diga su firma. */
export function decidirCierre(p: Partido, azar: Azar, estilo = ESTILO_NEUTRO): Tipo {
  if (estilo.firma?.tipo === "cierre" && finalApretado(p, p.turno)) return estilo.firma.cierra;
  const amenazaPorTipo = { dentro: 0, fuera: 0 };
  for (const o of opcionesDeAtaque(p)) amenazaPorTipo[o.tipo] = Math.max(amenazaPorTipo[o.tipo], o.esperado);
  const principal: Tipo = amenazaPorTipo.fuera > amenazaPorTipo.dentro ? "fuera" : "dentro";
  return azar() < 0.65 ? principal : principal === "dentro" ? "fuera" : "dentro";
}

export function decidirTiempoMuerto(p: Partido, lado: Lado): boolean {
  if (!puedeTiempoMuerto(p, lado)) return false;
  const final = p.ataques[lado] >= REGLAS.ataquesPorEquipo - 2;
  return final && p.puntos[lado] <= p.puntos[rival(lado)] + 3;
}

/** Cambio obligatorio del descanso: sale, de quienes ya no tienen tiros, quien peor defiende. */
export function decidirCambio(p: Partido, lado: Lado): string | null {
  if (!p.equipos[lado].suplente) return null;
  return [...puedenSalir(p, lado)].sort((a, b) => muralla(carta(p, lado, a)) - muralla(carta(p, lado, b)))[0];
}

export interface EquipoAutomatico {
  franquicia: string;
  cartas: Carta[];
  estilo?: Estilo;
}

/** Juega un partido entero de máquina contra máquina (partidos oficiales de la liga). */
export function jugarAutomatico(local: EquipoAutomatico, visitante: EquipoAutomatico, azar: Azar): Partido {
  const equipos = [local, visitante];
  const p = crearPartido(
    { franquicia: local.franquicia, cartas: local.cartas, ...alinear(local.cartas) },
    { franquicia: visitante.franquicia, cartas: visitante.cartas, ...alinear(visitante.cartas) },
  );
  fijarDuelos(p, emparejar(p));

  while (p.fase !== "final") {
    if (p.fase === "descanso") {
      for (const lado of [0, 1] as Lado[]) {
        const sale = decidirCambio(p, lado);
        if (sale) cambiar(p, lado, sale);
      }
      fijarDuelos(p, emparejar(p));
      terminarDescanso(p);
      continue;
    }
    const lado = p.turno;
    const { tirador, tipo } = decidirAtaque(p, azar, equipos[lado].estilo);
    const cierra = decidirCierre(p, azar, equipos[rival(lado)].estilo);
    atacar(p, tirador, tipo, cierra, dosDados(azar));
    if (decidirTiempoMuerto(p, lado)) tiempoMuerto(p, lado, dosDados(azar));
  }
  return p;
}
