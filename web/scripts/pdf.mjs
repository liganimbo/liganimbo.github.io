// Exporta a PDF los documentos para imprimir (reglamento, reglamento para el móvil y cartas) y los deja en public/descargas, que se publica con la web.
// Uso: npm run pdf            (con la web en marcha: npm run dev)
//      WEB=http://localhost:4321 npm run pdf
// Hay que repetirlo cuando cambien las reglas o las cartas (cada verano).
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const WEB = process.env.WEB ?? "http://localhost:4321";
const SALIDA = path.resolve(import.meta.dirname, "../public/descargas");
const DOCUMENTOS = [
  ["imprimir/reglamento", "liga-nimbo-reglamento.pdf"],
  ["imprimir/reglamento-movil", "liga-nimbo-reglamento-movil.pdf"],
  ["imprimir/cartas", "liga-nimbo-cartas.pdf"],
];

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
  throw new Error("No encuentro Chromium ni Chrome para hacer los PDF.");
}

try {
  await fetch(WEB);
} catch {
  console.error(`No puedo abrir ${WEB}. ¿Está la web en marcha? (npm run dev)`);
  process.exit(1);
}
const navegador = buscarNavegador();
fs.mkdirSync(SALIDA, { recursive: true });
for (const [ruta, archivo] of DOCUMENTOS) {
  execFileSync(navegador, [
    "--headless",
    "--disable-gpu",
    "--no-pdf-header-footer",
    "--virtual-time-budget=8000",
    `--print-to-pdf=${path.join(SALIDA, archivo)}`,
    new URL(ruta, WEB).href,
  ], { stdio: "ignore" });
  console.log(`✓ ${archivo}`);
}
