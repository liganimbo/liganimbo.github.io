// Los Amistosos de Navidad (motor/amistosos.ts), jugados al construir la web. Solo se publican los que ya se han jugado
// (la web se reconstruye cada tarde en diciembre); en local, con npm run dev, se ven todos.
import { AMISTOSOS, idAmistoso, jugarAmistoso, semillaAmistoso } from "../motor/amistosos.ts";
import { mundo } from "./liga";

const hoy = new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Madrid" });

export const amistosos = AMISTOSOS.filter(([fecha]) => import.meta.env.DEV || fecha <= hoy).map(([fecha, local, visitante]) => ({
  id: idAmistoso(local, visitante),
  semilla: semillaAmistoso(local, visitante),
  p: jugarAmistoso(mundo, fecha, local, visitante),
}));
export const quedan = AMISTOSOS.length - amistosos.length;
