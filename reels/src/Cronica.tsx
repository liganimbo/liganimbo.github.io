// Reel: la crónica de un partido entero (por defecto, el de exhibición). Las escenas se ajustan a la voz (tiempos.ts).
// Para otro partido: node scripts/cronica.ts <id> en web/, y después npm run voz -- cronica.
import { Audio } from "@remotion/media";
import { staticFile, Track } from "remotion";
import { CronicaCierre, CronicaDecisiva, CronicaEstilos, CronicaFinal, CronicaGancho, CronicaPrimera, CronicaSegunda } from "./escenas-cronica";
import { CRONICA, GUIONES } from "./guion";
import { fondo } from "./marca";
import { FPS, RETRASO_VOZ, tiempos } from "./tiempos";

export const CRONICA_T = tiempos("cronica");
const T = CRONICA_T.T;
const [LOCAL, VISITANTE] = CRONICA.equipos;
const GANADOR = CRONICA.equipos[CRONICA.ganador];
const ATACA = CRONICA.equipos[CRONICA.jugadas[CRONICA.decisiva.indice].equipo];

export const Cronica = () => {
  return (
    <>
      <Track name="Escenas">
        <CronicaGancho name="Gancho" from={T.gancho.desde} durationInFrames={T.gancho.duracion} style={{ background: fondo() }} />
        <CronicaEstilos name="Estilos" from={T.estilos.desde} durationInFrames={T.estilos.duracion} style={{ background: fondo(LOCAL.c2) }} />
        <CronicaPrimera name="Primera parte" from={T.primera.desde} durationInFrames={T.primera.duracion} style={{ background: fondo(VISITANTE.c2) }} />
        <CronicaSegunda name="Segunda parte" from={T.segunda.desde} durationInFrames={T.segunda.duracion} style={{ background: fondo(LOCAL.c2) }} />
        <CronicaDecisiva name="Decisiva" from={T.decisiva.desde} durationInFrames={T.decisiva.duracion} style={{ background: fondo(ATACA.c2) }} />
        <CronicaFinal name="Final" from={T.final.desde} durationInFrames={T.final.duracion} style={{ background: fondo(GANADOR.c2) }} />
        <CronicaCierre name="Cierre" from={T.cierre.desde} durationInFrames={T.cierre.duracion} style={{ background: fondo() }} />
      </Track>
      <Track name="Voz">
        {GUIONES.cronica.filter(({ id }) => T[id].voz).map(({ id }) => (
          <Audio key={id} name={id} src={staticFile(`voz/cronica/${id}.mp3`)} from={T[id].desde + Math.round(RETRASO_VOZ * FPS)} />
        ))}
      </Track>
    </>
  );
};
