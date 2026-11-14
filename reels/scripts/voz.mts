// Genera la voz de un Reel con ElevenLabs: una pista MP3 por escena en public/voz/<reel>/ y sus duraciones en src/voz.json.
// Uso: npm run voz -- amistoso       (necesita ELEVENLABS_API_KEY y ELEVENLABS_VOICE_ID en reels/.env)
//      npm run voz -- amistoso necesita   (solo esas escenas; las demás se quedan como están)
//      npm run voz -- voces          (lista las voces disponibles en tu cuenta)
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { GUIONES, type Reel } from "../src/guion.ts";

const clave = process.env.ELEVENLABS_API_KEY;
if (!clave) throw new Error("Falta ELEVENLABS_API_KEY en reels/.env");
const api = (ruta: string, init?: RequestInit) =>
  fetch(`https://api.elevenlabs.io/v1/${ruta}`, { ...init, headers: { "xi-api-key": clave, "Content-Type": "application/json", ...init?.headers } });

if (process.argv[2] === "voces") {
  const respuesta = await (await api("voices")).json();
  if (!respuesta.voices) throw new Error(`ElevenLabs: ${JSON.stringify(respuesta.detail ?? respuesta)}`);
  const { voices } = respuesta;
  for (const v of voices) console.log(`${v.voice_id}  ${v.name}  ${JSON.stringify(v.labels ?? {})}`);
  process.exit(0);
}

const vozId = process.env.ELEVENLABS_VOICE_ID;
if (!vozId) throw new Error("Falta ELEVENLABS_VOICE_ID en reels/.env (mira las voces con: npm run voz -- voces)");

const reel = process.argv[2] as Reel;
if (!(reel in GUIONES)) throw new Error(`¿Qué Reel? Uno de: ${Object.keys(GUIONES).join(", ")}`);
mkdirSync(`public/voz/${reel}`, { recursive: true });
const todas = JSON.parse(readFileSync("src/voz.json", "utf8"));
const soloEstas = process.argv.slice(3);
const duraciones: Record<string, number> = soloEstas.length ? { ...todas[reel] } : {};
for (const { id, texto } of GUIONES[reel].filter(({ id }) => !soloEstas.length || soloEstas.includes(id))) {
  const r = await api(`text-to-speech/${vozId}`, {
    method: "POST",
    headers: { Accept: "audio/mpeg" },
    body: JSON.stringify({
      text: texto,
      model_id: "eleven_multilingual_v2",
      voice_settings: { stability: 0.45, similarity_boost: 0.8, style: 0.35 },
    }),
  });
  if (!r.ok) throw new Error(`ElevenLabs (${id}): ${r.status} ${await r.text()}`);
  const archivo = `public/voz/${reel}/${id}.mp3`;
  writeFileSync(archivo, Buffer.from(await r.arrayBuffer()));
  const segundos = Number(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", archivo]).toString());
  duraciones[id] = Math.round(segundos * 100) / 100;
  console.log(`✓ ${id}: ${duraciones[id]} s`);
}
todas[reel] = duraciones;
writeFileSync("src/voz.json", JSON.stringify(todas, null, 2) + "\n");
