// El partido de exhibición (motor/exhibicion.ts), jugado una vez al construir la web.
import { jugarExhibicion } from "../motor/exhibicion.ts";
import { mundo } from "./liga";

export { EXHIBICION } from "../motor/exhibicion.ts";
export const exhibicion = jugarExhibicion(mundo);
