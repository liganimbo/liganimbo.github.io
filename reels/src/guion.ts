// Guiones de los Reels: qué dice la voz en cada escena y cuánto dura como mínimo (en segundos).
// Si la voz es más larga, la escena se alarga para que quepa (ver tiempos.ts).
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
    { id: "gancho", minimo: 2.5, texto: "Amistoso de pretemporada: Gigantes contra Lobos." },
    { id: "partido", minimo: 4.5, texto: "Siete a siete tras los ocho ataques. Muerte súbita." },
    { id: "lobos", minimo: 3, texto: "Los Lobos anotan. Siete a nueve." },
    { id: "jugada", minimo: 5, texto: "Último ataque. Carla Echeverría, nacida en Sierra Gris, se la juega… de tres." },
    { id: "dados", minimo: 5.5, texto: "Tres y seis…" },
    { id: "final", minimo: 3, texto: "¡Entra! Los Gigantes ganan diez a nueve." },
    { id: "cierre", minimo: 3.5, texto: "La Temporada 1 empieza el doce de enero. ¿Con quién vas?" },
  ],
} as const;

export type Reel = keyof typeof GUIONES;
