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
    { id: "gancho", minimo: 3, texto: "Amistoso de pretemporada. Muerte súbita… y los Lobos ganan de dos." },
    { id: "reto", minimo: 5, texto: "Último ataque de los Gigantes. Una canasta de dos solo les da el empate. Para ganar, necesitan un triple." },
    { id: "tiradora", minimo: 4, texto: "Tira Carla Echeverría. Ataque: dos. No es una tiradora." },
    { id: "farol", minimo: 5, texto: "Los Lobos esperan que vaya a lo seguro, y cierran dentro. Pero Carla… tira de tres." },
    { id: "necesita", minimo: 5, texto: "Como la defensa ha fallado, le basta con sacar siete o más entre los dos dados." },
    { id: "dados", minimo: 4, texto: "Tres… y seis. ¡Nueve!" },
    { id: "final", minimo: 3.5, texto: "¡Triple! Los Gigantes ganan diez a nueve." },
    { id: "cierre", minimo: 3.5, texto: "La Temporada 1 empieza el doce de enero. ¿Con quién vas?" },
  ],
} as const;

export type Reel = keyof typeof GUIONES;
