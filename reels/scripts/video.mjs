// Exporta los Reels a ../instagram/reels: reel-<mes-día>-<id>.mp4, su portada (el primer fotograma, que es el gancho) y el texto.
// Uso: npm run video            (todos)
//      npm run video -- T DF1   (solo esos)
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const SALIDA = path.resolve(import.meta.dirname, "../../instagram/reels");
const reels = JSON.parse(fs.readFileSync(path.resolve(import.meta.dirname, "../src/datos/diciembre.json"), "utf8"));
const pedidos = process.argv.slice(2);
const ids = pedidos.length ? pedidos : reels.map((r) => r.id);
fs.mkdirSync(SALIDA, { recursive: true });
for (const id of ids) {
  const r = reels.find((x) => x.id === id);
  if (!r) throw new Error(`No hay ningún Reel ${id} en src/datos/diciembre.json`);
  const base = path.join(SALIDA, `reel-${r.fecha.slice(5)}-${id}`);
  execFileSync("npx", ["remotion", "render", id, `${base}.mp4`, "--log=error"], { stdio: "inherit" });
  execFileSync("npx", ["remotion", "still", id, `${base}-portada.png`, "--frame=0", "--log=error"], { stdio: "inherit" });
  fs.writeFileSync(`${base}.txt`, r.texto + "\n");
  console.log(`✓ ${path.basename(base)} · ${r.titulo}`);
}
