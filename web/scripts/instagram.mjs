// Exporta a PNG las publicaciones del plan de Instagram (la lista de /instagram).
// Uso: npm run instagram            (con la web en marcha: npm run dev)
//      WEB=http://localhost:4321 npm run instagram
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const WEB = process.env.WEB ?? "http://localhost:4321";
const SALIDA = path.resolve(import.meta.dirname, "../../instagram");

function buscarNavegador() {
  const cache = path.join(os.homedir(), ".cache/ms-playwright");
  if (fs.existsSync(cache)) {
    for (const dir of fs.readdirSync(cache).filter((d) => d.startsWith("chromium_headless_shell")).sort().reverse()) {
      const exe = path.join(cache, dir, "chrome-headless-shell-linux64/chrome-headless-shell");
      if (fs.existsSync(exe)) return exe;
    }
  }
  for (const nombre of ["chromium", "chromium-browser", "google-chrome", "google-chrome-stable"]) {
    try {
      return execFileSync("which", [nombre]).toString().trim();
    } catch {}
  }
  throw new Error("No encuentro Chromium ni Chrome para hacer las capturas.");
}

let html;
try {
  html = await (await fetch(`${WEB}/instagram`)).text();
} catch {
  console.error(`No puedo abrir ${WEB}/instagram. ¿Está la web en marcha? (npm run dev)`);
  process.exit(1);
}
const plan = html.slice(html.indexOf('class="plan"'));
const rutas = [...plan.matchAll(/href="([^"]*\/ig\/[^"]+)"/g)].map((m) => m[1]);
const navegador = buscarNavegador();

// Solo se borran las imágenes numeradas de una exportación anterior: los Reels y lo demás se quedan.
fs.mkdirSync(SALIDA, { recursive: true });
for (const archivo of fs.readdirSync(SALIDA)) if (/^\d+-.*\.png$/.test(archivo)) fs.rmSync(path.join(SALIDA, archivo));
rutas.forEach((ruta, i) => {
  const nombre = `${String(i + 1).padStart(2, "0")}-${ruta.replace(/^.*\/ig\//, "").replaceAll("/", "-")}.png`;
  execFileSync(navegador, [
    "--headless",
    "--disable-gpu",
    "--hide-scrollbars",
    "--force-device-scale-factor=1",
    `--window-size=1080,${ruta.includes("/ig/apertura/") ? 1440 : 1350}`,
    "--virtual-time-budget=5000",
    `--screenshot=${path.join(SALIDA, nombre)}`,
    new URL(ruta, WEB).href,
  ], { stdio: "ignore" });
  console.log(`✓ ${nombre}`);
});
// Foto de perfil, cuadrada: el escudo y la alternativa con texto.
for (const [pagina, archivo] of [["avatar", "00-avatar.png"], ["avatar-texto", "00-avatar-texto.png"]]) {
  execFileSync(navegador, [
    "--headless",
    "--disable-gpu",
    "--hide-scrollbars",
    "--force-device-scale-factor=1",
    "--window-size=1080,1080",
    "--virtual-time-budget=5000",
    `--screenshot=${path.join(SALIDA, archivo)}`,
    new URL(`/ig/${pagina}`, WEB).href,
  ], { stdio: "ignore" });
  console.log(`✓ ${archivo} (foto de perfil)`);
}

console.log(`\n${rutas.length + 2} imágenes en ${SALIDA}`);
