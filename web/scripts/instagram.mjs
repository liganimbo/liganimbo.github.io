// Exporta a PNG las publicaciones del plan de Instagram (la lista de /instagram), cada tipo en su carpeta de instagram/:
// publicaciones/ (numeradas en orden), stories/ y perfil/. Los Reels van a reels/ (los exporta reels/scripts/video.mjs).
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

// Se rehacen las imágenes de publicaciones, stories y perfil de una exportación anterior; los Reels y lo demás se quedan.
const CARPETA = { publicaciones: path.join(SALIDA, "publicaciones"), stories: path.join(SALIDA, "stories"), perfil: path.join(SALIDA, "perfil") };
for (const dir of Object.values(CARPETA)) {
  fs.mkdirSync(dir, { recursive: true });
  for (const archivo of fs.readdirSync(dir)) if (archivo.endsWith(".png")) fs.rmSync(path.join(dir, archivo));
}
const alto = (ruta) => (ruta.includes("/ig/historia/") ? 1920 : ruta.includes("/ig/apertura/") ? 1440 : 1350);
let numero = 0;
rutas.forEach((ruta) => {
  // Las publicaciones van numeradas en orden; las stories, con su nombre (historia-...).
  const base = ruta.replace(/^.*\/ig\//, "").replaceAll("/", "-");
  const historia = ruta.includes("/ig/historia/");
  const nombre = historia ? `${base}.png` : `${String(++numero).padStart(2, "0")}-${base}.png`;
  execFileSync(navegador, [
    "--headless",
    "--disable-gpu",
    "--hide-scrollbars",
    "--force-device-scale-factor=1",
    `--window-size=1080,${alto(ruta)}`,
    "--virtual-time-budget=5000",
    `--screenshot=${path.join(historia ? CARPETA.stories : CARPETA.publicaciones, nombre)}`,
    new URL(ruta, WEB).href,
  ], { stdio: "ignore" });
  console.log(`✓ ${nombre}`);
});
// Foto de perfil y portadas de las destacadas, cuadradas.
const cuadradas = [
  ["avatar", "avatar.png"],
  ["avatar-texto", "avatar-texto.png"],
  ...["juega", "reglas", "franquicias", "amistosos"].map((id) => [`destacada/${id}`, `destacada-${id}.png`]),
];
for (const [pagina, archivo] of cuadradas) {
  execFileSync(navegador, [
    "--headless",
    "--disable-gpu",
    "--hide-scrollbars",
    "--force-device-scale-factor=1",
    "--window-size=1080,1080",
    "--virtual-time-budget=5000",
    `--screenshot=${path.join(CARPETA.perfil, archivo)}`,
    new URL(`/ig/${pagina}`, WEB).href,
  ], { stdio: "ignore" });
  console.log(`✓ perfil/${archivo}`);
}

console.log(`\n${rutas.length + cuadradas.length} imágenes en ${SALIDA}`);
