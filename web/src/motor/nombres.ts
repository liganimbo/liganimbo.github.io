// Nombres, orígenes e historias para generar jugadoras y jugadores ficticios.

export const NOMBRES = {
  local: {
    f: [
      "Ainhoa", "Alba", "Amaia", "Ana", "Andrea", "Aroa", "Blanca", "Carla", "Carmen", "Celia",
      "Claudia", "Elena", "Emma", "Irene", "Inés", "Jimena", "Julia", "Laia", "Lara", "Leire",
      "Lola", "Lucía", "Maite", "Marina", "Marta", "Nerea", "Noa", "Nuria", "Olivia", "Paula",
      "Rocío", "Sara", "Valeria", "Vera", "Ximena", "Zoe", "Candela", "Triana", "Maialen", "Itziar",
    ],
    m: [
      "Adrián", "Álvaro", "Bruno", "Carlos", "César", "Dani", "Darío", "Diego", "Eloy", "Emilio",
      "Enzo", "Fabián", "Gael", "Gonzalo", "Hugo", "Iker", "Ismael", "Iván", "Jaime", "Joel",
      "Jorge", "Julián", "Leo", "Lucas", "Mario", "Martín", "Mateo", "Nico", "Óscar", "Pablo",
      "Rodrigo", "Rubén", "Samuel", "Santi", "Teo", "Tomás", "Unai", "Víctor", "Yago", "Ciro",
    ],
  },
  extranjero: {
    f: [
      "Amara", "Astrid", "Chiamaka", "Dalia", "Freya", "Ingrid", "Ivana", "Kalinda", "Kenna", "Lena",
      "Mila", "Nadia", "Nia", "Oona", "Saoirse", "Sigrid", "Tamsin", "Yara", "Zuri", "Anouk",
    ],
    m: [
      "Aleks", "Amadou", "Anders", "Andrei", "Bastian", "Dmitri", "Elias", "Emeka", "Finn", "Goran",
      "Idris", "Jonas", "Kai", "Kofi", "Luka", "Malik", "Milos", "Oskar", "Rasmus", "Sekou",
    ],
  },
};

export const APELLIDOS = {
  local: [
    "Albarrán", "Alcaide", "Arrieta", "Barrios", "Belmonte", "Bermejo", "Cabrera", "Calvo", "Campos", "Carmona",
    "Castaño", "Cebrián", "Cuesta", "Delgado", "Domínguez", "Echeverría", "Escobar", "Ferrer", "Figueroa", "Fuentes",
    "Galindo", "Gallardo", "Garrido", "Herrero", "Ibarra", "Iglesias", "Lago", "Lozano", "Luna", "Maldonado",
    "Márquez", "Medina", "Miranda", "Molina", "Montero", "Navarro", "Nieto", "Ochoa", "Olmedo", "Ortega",
    "Pacheco", "Palacios", "Pastor", "Peña", "Quintana", "Reyes", "Robles", "Roldán", "Salcedo", "Salinas",
    "Serrano", "Soler", "Tejada", "Toledo", "Urrutia", "Valverde", "Vargas", "Vega", "Vidal", "Zamora",
  ],
  extranjero: [
    "Abara", "Andersen", "Babić", "Brennan", "Diallo", "Dvorak", "Eriksen", "Falk", "Halvorsen", "Ivanov",
    "Jansen", "Kamara", "Kovač", "Lindqvist", "Mbeki", "Novak", "Okafor", "Petrov", "Radić", "Sorensen",
    "Thorne", "Udeh", "Wolde", "Yilmaz", "Ashworth", "Bergström", "Coulibaly", "Fontaine", "Keita", "Mertens",
  ],
};

export const ORIGENES_EXTRANJEROS = [
  "Islas Varne", "Kostavia", "Norhelm", "Port Ashby", "Ndara", "Valmont", "Ilvessa", "Cabo Seren",
];

// Frases sin marcas de género, válidas para cualquier persona.
export const HISTORIAS = [
  "Creció jugando en las pistas de su barrio en {origen}.",
  "Llegó desde {origen} con una maleta y un balón.",
  "Empezó a jugar tarde, a los dieciséis años, en {origen}.",
  "En {origen} todavía se habla de su primer mate.",
  "Trabajó en una {negocio} de {origen} antes de dedicarse al baloncesto.",
  "Su familia regenta una {negocio} en {origen} y no se pierde un partido.",
  "Pasó tres temporadas en ligas menores de {origen} antes de su oportunidad.",
  "Dejó el fútbol a los catorce años en {origen} y no ha mirado atrás.",
  "Entrena cada verano en la misma cancha al aire libre de {origen}.",
  "Debe su tiro a una entrenadora de instituto de {origen} a la que sigue llamando cada semana.",
  "Jugaba al 3x3 en las plazas de {origen} antes de que nadie lo tomara en serio.",
];

export const NEGOCIOS = ["panadería", "ferretería", "taberna", "librería", "frutería", "barbería", "lonja"];
