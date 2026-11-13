// Genera la voz del Reel con ElevenLabs: una pista MP3 por escena en public/voz/ y sus duraciones en src/voz.json.
// Uso: npm run voz            (necesita ELEVENLABS_API_KEY en reels/.env)
//      npm run voz -- voces   (lista las voces disponibles en tu cuenta)
import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { GUION } from "../src/guion.ts";

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

mkdirSync("public/voz", { recursive: true });
const duraciones: Record<string, number> = {};
for (const { id, texto } of GUION) {
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
  const archivo = `public/voz/${id}.mp3`;
  writeFileSync(archivo, Buffer.from(await r.arrayBuffer()));
  const segundos = Number(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", archivo]).toString());
  duraciones[id] = Math.round(segundos * 100) / 100;
  console.log(`✓ ${id}: ${duraciones[id]} s`);
}
writeFileSync("src/voz.json", JSON.stringify(duraciones, null, 2) + "\n");
