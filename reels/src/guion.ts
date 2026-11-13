// Guion del Reel "Cómo se juega": qué dice la voz en cada escena y cuánto dura como mínimo (en segundos).
// Si la voz es más larga, la escena se alarga para que quepa (ver tiempos.ts).
export const GUION = [
  { id: "gancho", minimo: 2.5, texto: "¿Baloncesto… con cartas y dos dados?" },
  { id: "cartas", minimo: 4.5, texto: "Cada carta tiene ataque y defensa. Nico ataca; Zoe le defiende." },
  { id: "secreto", minimo: 4.5, texto: "Los dos eligen en secreto: dentro vale dos, fuera vale tres… y Zoe ha acertado." },
  { id: "dados", minimo: 5, texto: "Seis y cinco. Dieciocho de ataque, contra catorce de defensa…" },
  { id: "canasta", minimo: 3, texto: "¡Canasta!" },
  { id: "cierre", minimo: 3.5, texto: "Liga Nimbo. Reglas y cartas para imprimir, en el enlace de la bio." },
] as const;

export type Escena = (typeof GUION)[number]["id"];
