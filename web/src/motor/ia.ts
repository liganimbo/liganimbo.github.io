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
  VISITANTE,
} from "./reglas.ts";

/** Carácter de juego de un equipo. `fuera`: cuánto le gusta tirar de 3 (0-1). */
export interface Estilo {
  fuera: number;
}
export const ESTILO_NEUTRO: Estilo = { fuera: 0.5 };

const TIPOS: Tipo[] = ["dentro", "fuera"];
const valorCarta = (c: Carta) => c.ataque + c.defensa + (c.icono ? 1 : 0);
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
  const opciones = opcionesDeAtaque(p).map((o) => {
    // Antes del descanso conviene gastar los tiros de quien peor defiende: será quien salga.
    const flojo = p.descansoHecho ? 1 : 1 + 0.12 * (6 - muralla(carta(p, lado, o.tirador)));
    return {
      valor: o,
      // Las mejores opciones pesan mucho más, pero nunca es del todo previsible.
      peso: Math.exp(o.esperado / 0.3) * (o.tipo === "fuera" ? 0.5 + estilo.fuera : 1.5 - estilo.fuera) * flojo,
    };
  });
  const { tirador, tipo } = ponderado(azar, opciones);
  return { tirador, tipo };
}

/** Cierra lo que más daño puede hacer el rival, con algo de farol. */
export function decidirCierre(p: Partido, azar: Azar): Tipo {
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
    const cierra = decidirCierre(p, azar);
    atacar(p, tirador, tipo, cierra, dosDados(azar));
    if (decidirTiempoMuerto(p, lado)) tiempoMuerto(p, lado, dosDados(azar));
  }
  return p;
}
