// Generador de números aleatorios con semilla: la misma semilla da siempre las mismas tiradas.

export type Azar = () => number;

function hash(texto: string): number {
  let h = 1779033703 ^ texto.length;
  for (let i = 0; i < texto.length; i++) {
    h = Math.imul(h ^ texto.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  h = Math.imul(h ^ (h >>> 16), 2246822507);
  h = Math.imul(h ^ (h >>> 13), 3266489909);
  return (h ^= h >>> 16) >>> 0;
}

export function crearAzar(semilla: string): Azar {
  let a = hash(semilla);
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Azar sin semilla, para partidas amistosas en el navegador. */
export const azarLibre: Azar = Math.random;

export const dado = (azar: Azar) => 1 + Math.floor(azar() * 6);
export const dosDados = (azar: Azar): [number, number] => [dado(azar), dado(azar)];

export function elegir<T>(azar: Azar, lista: readonly T[]): T {
  return lista[Math.floor(azar() * lista.length)];
}

export function barajar<T>(azar: Azar, lista: T[]): T[] {
  const copia = [...lista];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(azar() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

export function gauss(azar: Azar, media: number, desviacion: number): number {
  const u = 1 - azar();
  const v = azar();
  return media + desviacion * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

/** Elige un elemento con probabilidad proporcional a su peso. */
export function ponderado<T>(azar: Azar, opciones: { valor: T; peso: number }[]): T {
  const total = opciones.reduce((s, o) => s + o.peso, 0);
  let r = azar() * total;
  for (const o of opciones) {
    r -= o.peso;
    if (r <= 0) return o.valor;
  }
  return opciones[opciones.length - 1].valor;
}
