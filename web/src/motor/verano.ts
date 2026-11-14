// El verano Nimbo: lo que pasa entre una temporada y la siguiente (REGLAMENTO.md, «Fuera de la pista»).
// Evolución, retiradas, presupuesto, contratos, draft, ojeo, agencia libre e instalaciones. Las decisiones de cada club las toma la IA según su filosofía.
import { type Azar, crearAzar, dado, gauss } from "./azar.ts";
import { type Franquicia, type Jugador, type Mundo, CARTAS_POR_EQUIPO, afinidad, generarJugador, sueldoDe, techo, valorCarta } from "./mundo.ts";
import type { FilaClasificacion, Serie } from "./temporada.ts";

export const VERANO = {
  presupuestoBase: 11,
  porMercado: { pequeño: 0, mediano: 1, grande: 2 } as Record<string, number>,
  /** +1 por cada ronda de playoffs ganada. */
  porRonda: 1,
  ahorroMaximo: 3,
  costeNivel: 3,
  nivelMaximo: 3,
  edadJoven: 23,
  edadVeterana: 30,
  edadRetiro: 34,
  edadRetiroLibre: 31,
  /** Tamaño máximo de la agencia libre: se quedan las mejores. */
  maxLibres: 24,
  promesas: 12,
};

export type Etapa = "joven" | "plenitud" | "veterana";
export const etapa = (edad: number): Etapa => (edad <= VERANO.edadJoven ? "joven" : edad >= VERANO.edadVeterana ? "veterana" : "plenitud");

/** Tabla de evolución: cuánto cambia una carta según su edad y la tirada (ya con modificadores).
 *  Joven: 5-6 → +1; 7 o más (con bonus) → +2. Plenitud: 1-2 → −1; 6 o más → +1.
 *  Veterana: 1-3 → −1 (desde los 33, 1-4). */
export function cambioPorTirada(edad: number, tirada: number): number {
  const e = etapa(edad);
  if (e === "joven") return tirada >= 7 ? 2 : tirada >= 5 ? 1 : 0;
  if (e === "plenitud") return tirada <= 2 ? -1 : tirada >= 6 ? 1 : 0;
  return tirada <= (edad >= 33 ? 4 : 3) ? -1 : 0;
}

export interface Informe {
  temporada: number;
  presupuestos: Record<string, { ingresos: number; ahorroPrevio: number; total: number; sueldos: number; inversion: number; ahorro: number }>;
  evoluciones: { jugador: string; franquicia: string; edad: number; tirada: number; cambio: number; antes: [number, number]; despues: [number, number] }[];
  retiradas: { jugador: string; franquicia: string; edad: number }[];
  renovaciones: { jugador: string; franquicia: string; sueldo: number; anios: number }[];
  salidas: { jugador: string; franquicia: string; motivo: string }[];
  draft: { numero: number; franquicia: string; jugador: string }[];
  /** Promesas que descubren los ojeadores de cada club: cuántas vio y a cuál ficha (si ficha). */
  ojeo: { franquicia: string; vistas: number; jugador: string | null }[];
  fichajes: { jugador: string; franquicia: string; desde: string }[];
  instalaciones: { franquicia: string; tipo: "ojeadores" | "entrenamiento"; nivel: number }[];
}

export function jugarVerano(
  mundo: Mundo,
  tabla: FilaClasificacion[],
  playoffs: { ronda: string; series: Serie[] }[],
): Informe {
  const azar = crearAzar(`${mundo.semilla}-verano-T${mundo.temporada}`);
  const J = mundo.jugadores;
  const F = Object.fromEntries(mundo.franquicias.map((f) => [f.id, f]));
  const clasificados = new Set(tabla.slice(0, 8).map((f) => f.franquicia));
  const inverso = tabla.map((f) => f.franquicia).reverse(); // el último elige primero
  const informe: Informe = {
    temporada: mundo.temporada,
    presupuestos: {},
    evoluciones: [],
    retiradas: [],
    renovaciones: [],
    salidas: [],
    draft: [],
    ojeo: [],
    fichajes: [],
    instalaciones: [],
  };
  const soltar = (j: Jugador, motivo: string) => {
    const f = F[j.franquicia];
    if (f) f.plantilla = f.plantilla.filter((id) => id !== j.id);
    informe.salidas.push({ jugador: j.id, franquicia: j.franquicia, motivo });
    j.franquicia = "";
    j.estado = "libre";
    if (!mundo.libres.includes(j.id)) mundo.libres.push(j.id);
  };

  // 1. Presupuesto: base + mercado + rondas de playoffs ganadas + ahorro.
  const rondasGanadas = (fid: string) => playoffs.flatMap((r) => r.series).filter((s) => s.ganador === fid).length;
  const caja: Record<string, number> = {};
  for (const f of mundo.franquicias) {
    const ingresos = VERANO.presupuestoBase + VERANO.porMercado[f.mercado] + VERANO.porRonda * rondasGanadas(f.id);
    caja[f.id] = ingresos + f.club.ahorro;
    informe.presupuestos[f.id] = { ingresos, ahorroPrevio: f.club.ahorro, total: caja[f.id], sueldos: 0, inversion: 0, ahorro: 0 };
  }

  // 2. Evolución: un dado por carta según su etapa, hasta su techo. Después, un año más.
  for (const f of mundo.franquicias) {
    const veterania = f.plantilla.some((id) => J[id].rasgo === "Veteranía");
    for (const id of f.plantilla) {
      const j = J[id];
      const e = etapa(j.edad);
      const mods =
        (j.rasgo === "Esfuerzo" ? 1 : 0) +
        (e === "joven" ? f.club.entrenamiento + (veterania && j.rasgo !== "Veteranía" ? 1 : 0) : 0);
      const tirada = dado(azar) + mods;
      const antes: [number, number] = [j.ataque, j.defensa];
      const cambio = ajustar(j, cambioPorTirada(j.edad, tirada), j.techo, f);
      informe.evoluciones.push({ jugador: id, franquicia: f.id, edad: j.edad, tirada, cambio, antes, despues: [j.ataque, j.defensa] });
      // El sueldo no cambia mientras dure el contrato: se recalcula al renovar.
    }
  }
  for (const j of Object.values(J)) if (j.estado !== "retirada") j.edad += 1;

  // 3. Retiradas: desde los 34, con un 1 o un 2. Las libres de 31 o más que nadie ha fichado se retiran.
  for (const j of Object.values(J)) {
    if (j.estado === "retirada") continue;
    const retira = j.estado === "libre" ? j.edad >= VERANO.edadRetiroLibre : j.edad >= VERANO.edadRetiro && dado(azar) <= 2;
    if (retira) {
      if (j.estado === "activa") {
        F[j.franquicia].plantilla = F[j.franquicia].plantilla.filter((id) => id !== j.id);
        informe.retiradas.push({ jugador: j.id, franquicia: j.franquicia, edad: j.edad });
      }
      mundo.libres = mundo.libres.filter((id) => id !== j.id);
      j.estado = "retirada";
      j.franquicia = "";
    }
  }

  // 4. Contratos: pasa un año. «A sueldo» se marcha si no hubo playoffs.
  const pendientes = new Set<string>(); // contrato acabado: el club decide si renueva
  for (const f of mundo.franquicias) {
    for (const id of [...f.plantilla]) {
      const j = J[id];
      j.contrato -= 1;
      if (j.rasgo === "A sueldo" && !clasificados.has(f.id)) soltar(j, "Pide salir: su equipo no jugó playoffs");
      else if (j.contrato <= 0) pendientes.add(id);
    }
  }

  // 5. Draft: 12 promesas. El último de la liga elige primero. Su techo está a la vista de todos.
  const usados = new Set(Object.values(J).map((j) => j.nombre));
  let siguienteId = Math.max(...Object.keys(J).map((id) => Number(id.slice(1)))) + 1;
  /** Una carta nueva que todavía no está en la liga (se registra con `registrar`). */
  const cartaNueva = (total: number, edad: number) => {
    const j = generarJugador(azar, "", azar() < 0.5 ? "f" : "m", total, usados, edad);
    j.techo = techo(azar, j);
    return j;
  };
  const registrar = (j: Jugador) => {
    j.id = `J${String(siguienteId++).padStart(2, "0")}`;
    J[j.id] = j;
    return j;
  };
  const nuevaCarta = (total: number, edad: number) => registrar(cartaNueva(total, edad));
  const nuevaPromesa = () => cartaNueva(Math.round(Math.min(9, Math.max(4, gauss(azar, 5.5, 1)))), 19 + Math.floor(azar() * 3));
  const promesas = Array.from({ length: VERANO.promesas }, () => registrar(nuevaPromesa()));
  /** Lo que vale una promesa para un club: lo que es hoy, lo que puede llegar a ser y si encaja en su filosofía. */
  const puntosPromesa = (f: Franquicia, j: Jugador) =>
    valorCarta(j) + 0.6 * (j.techo - j.ataque - j.defensa) + afinidad(f.filosofia, j) * 0.5;
  const disponibles = new Set(promesas.map((j) => j.id));
  inverso.forEach((fid, i) => {
    const f = F[fid];
    const puntos = (id: string) => puntosPromesa(f, J[id]);
    const elegido = [...disponibles].sort((a, b) => puntos(b) - puntos(a))[0];
    disponibles.delete(elegido);
    const j = J[elegido];
    j.franquicia = fid;
    j.contrato = 3;
    j.sueldo = sueldoDe(j);
    f.plantilla.push(elegido);
    informe.draft.push({ numero: i + 1, franquicia: fid, jugador: elegido });
  });

  const valorPara = (f: Franquicia, j: Jugador) =>
    valorCarta(j) +
    afinidad(f.filosofia, j) * 0.4 +
    0.3 * (j.techo - j.ataque - j.defensa) +
    (etapa(j.edad) === "joven" ? 0.5 : etapa(j.edad) === "veterana" ? -0.5 : 0);

  // 6. Ojeo: cada nivel de ojeadores descubre una promesa que no ha pasado por el draft. El club puede fichar
  //    la que más le guste por el sueldo mínimo si mejora a su peor carta (luego compite por plaza como las demás).
  for (const fid of inverso) {
    const f = F[fid];
    if (!f.club.ojeadores) continue;
    const vistas = Array.from({ length: f.club.ojeadores }, nuevaPromesa).sort((a, b) => puntosPromesa(f, b) - puntosPromesa(f, a));
    const peor = Math.min(...f.plantilla.map((id) => valorPara(f, J[id])));
    const mejor = vistas[0];
    if (puntosPromesa(f, mejor) > peor) {
      registrar(mejor);
      mejor.franquicia = fid;
      mejor.contrato = 3;
      mejor.sueldo = 1;
      f.plantilla.push(mejor.id);
    }
    informe.ojeo.push({ franquicia: fid, vistas: vistas.length, jugador: f.plantilla.includes(mejor.id) ? mejor.id : null });
  }

  // 7. Plantilla de 4 que quepa en el presupuesto. Quien no entra y tenía el contrato acabado, no se renueva.
  const sueldoRenovado = (j: Jugador) => Math.max(1, sueldoDe(j) - (j.rasgo === "Corazón del club" ? 1 : 0));
  const elegidas = new Set(informe.draft.map((d) => d.jugador));
  for (const fid of inverso) {
    const f = F[fid];
    // La promesa recién elegida entra siempre; las demás compiten por el resto de plazas.
    const promesa = f.plantilla.map((id) => J[id]).filter((j) => elegidas.has(j.id));
    const candidatas = f.plantilla.map((id) => J[id]).filter((j) => !elegidas.has(j.id));
    const coste = (j: Jugador) => (pendientes.has(j.id) ? sueldoRenovado(j) : j.sueldo);
    const hueco = caja[fid] - promesa.reduce((s, j) => s + j.sueldo, 0);
    // Las mejores que quepan; si no caben todas las plazas, una menos, y así (el resto se completa en la agencia libre).
    let mejor: Jugador[] = [];
    for (let n = Math.min(CARTAS_POR_EQUIPO - promesa.length, candidatas.length); n > 0 && !mejor.length; n--) {
      mejor = mejorCombinacion(candidatas, n, hueco, (j) => valorPara(f, j), coste);
    }
    mejor = [...mejor, ...promesa];
    for (const j of candidatas) {
      if (mejor.includes(j)) {
        if (pendientes.has(j.id)) {
          j.sueldo = sueldoRenovado(j);
          j.contrato = 1 + Math.floor(azar() * 3);
          informe.renovaciones.push({ jugador: j.id, franquicia: fid, sueldo: j.sueldo, anios: j.contrato });
        }
      } else {
        soltar(j, pendientes.has(j.id) ? "Contrato acabado: no renueva" : "Descartada para hacer sitio");
      }
    }
  }

  // 8. Agencia libre: en orden inverso, cada club completa su plantilla o mejora su peor carta si le cabe.
  const sueldos = (f: Franquicia) => f.plantilla.reduce((s, id) => s + J[id].sueldo, 0);
  const fichar = (f: Franquicia, j: Jugador) => {
    const desde = informe.salidas.find((s) => s.jugador === j.id)?.franquicia ?? "";
    mundo.libres = mundo.libres.filter((id) => id !== j.id);
    j.estado = "activa";
    j.franquicia = f.id;
    j.sueldo = sueldoDe(j);
    j.contrato = 1 + Math.floor(azar() * 2);
    f.plantilla.push(j.id);
    informe.fichajes.push({ jugador: j.id, franquicia: f.id, desde });
  };
  for (let vuelta = 0; vuelta < 2; vuelta++) {
    for (const fid of inverso) {
      const f = F[fid];
      const libres = mundo.libres.map((id) => J[id]).sort((a, b) => valorPara(f, b) - valorPara(f, a));
      if (f.plantilla.length < CARTAS_POR_EQUIPO) {
        const hueco = caja[fid] - sueldos(f);
        const j = libres.find((x) => sueldoDe(x) <= hueco - (CARTAS_POR_EQUIPO - f.plantilla.length - 1));
        if (j) fichar(f, j);
      } else if (vuelta === 0) {
        const peor = f.plantilla.map((id) => J[id]).sort((a, b) => valorPara(f, a) - valorPara(f, b))[0];
        const j = libres.find((x) => valorPara(f, x) > valorPara(f, peor) + 1 && sueldos(f) - peor.sueldo + sueldoDe(x) <= caja[fid]);
        if (j) {
          soltar(peor, "Descartada para hacer sitio");
          fichar(f, j);
        }
      }
    }
  }
  // La agencia libre se queda con las mejores; el resto deja el baloncesto.
  if (mundo.libres.length > VERANO.maxLibres) {
    const orden = [...mundo.libres].sort((a, b) => valorCarta(J[b]) - valorCarta(J[a]));
    for (const id of orden.slice(VERANO.maxLibres)) J[id].estado = "retirada";
    mundo.libres = orden.slice(0, VERANO.maxLibres);
  }

  // Si aún falta alguien, sube una carta de la cantera local (sueldo mínimo).
  for (const f of mundo.franquicias) {
    while (f.plantilla.length < CARTAS_POR_EQUIPO) {
      const j = nuevaCarta(5, 20 + Math.floor(azar() * 4));
      j.franquicia = f.id;
      j.contrato = 1;
      j.sueldo = 1;
      f.plantilla.push(j.id);
      informe.fichajes.push({ jugador: j.id, franquicia: f.id, desde: "cantera" });
    }
  }

  // 9. Lo que sobra: instalaciones (3 por nivel) y, como mucho, 3 de ahorro.
  for (const f of mundo.franquicias) {
    let resto = caja[f.id] - sueldos(f);
    const p = informe.presupuestos[f.id];
    p.sueldos = sueldos(f);
    const prioridad: ("ojeadores" | "entrenamiento")[] =
      f.filosofia.edad === "joven" ? ["entrenamiento", "ojeadores"] : ["ojeadores", "entrenamiento"];
    while (resto >= VERANO.costeNivel) {
      const tipo = [...prioridad].sort((a, b) => f.club[a] - f.club[b])[0];
      if (f.club[tipo] >= VERANO.nivelMaximo) break;
      f.club[tipo] += 1;
      resto -= VERANO.costeNivel;
      p.inversion += VERANO.costeNivel;
      informe.instalaciones.push({ franquicia: f.id, tipo, nivel: f.club[tipo] });
    }
    f.club.ahorro = Math.max(0, Math.min(VERANO.ahorroMaximo, resto));
    f.club.presupuesto = p.total;
    p.ahorro = f.club.ahorro;
  }

  mundo.temporada += 1;
  return informe;
}

/** Reparte una mejora o una pérdida entre Ataque y Defensa, sin pasar del techo ni bajar de 2. */
function ajustar(j: Jugador, cambio: number, techoCarta: number, f: Franquicia): number {
  let aplicado = 0;
  const prefiere: "ataque" | "defensa" =
    (f.filosofia.defensa ?? 0) > (f.filosofia.ataque ?? 0) ? "defensa" : (f.filosofia.ataque ?? 0) > 0 ? "ataque" : j.ataque <= j.defensa ? "ataque" : "defensa";
  for (let i = 0; i < Math.abs(cambio); i++) {
    if (cambio > 0) {
      if (j.ataque + j.defensa >= techoCarta) break;
      const k = j[prefiere] < 6 ? prefiere : prefiere === "ataque" ? "defensa" : "ataque";
      if (j[k] >= 6) break;
      j[k] += 1;
      aplicado += 1;
    } else {
      const k = j.ataque >= j.defensa ? "ataque" : "defensa";
      if (j[k] <= 2) break;
      j[k] -= 1;
      aplicado -= 1;
    }
  }
  return aplicado;
}

/** La mejor combinación de n cartas cuyo coste quepa en el presupuesto, o [] si ninguna cabe (son pocas: fuerza bruta). */
function mejorCombinacion<T>(cartas: T[], n: number, presupuesto: number, valor: (c: T) => number, coste: (c: T) => number): T[] {
  let mejor: T[] = [];
  let mejorValor = -Infinity;
  const recorrer = (desde: number, elegidas: T[]) => {
    if (elegidas.length === n) {
      if (elegidas.reduce((s, c) => s + coste(c), 0) > presupuesto) return;
      const v = elegidas.reduce((s, c) => s + valor(c), 0);
      if (v > mejorValor) [mejor, mejorValor] = [[...elegidas], v];
      return;
    }
    for (let i = desde; i < cartas.length; i++) recorrer(i + 1, [...elegidas, cartas[i]]);
  };
  recorrer(0, []);
  return mejor;
}
