// Reel: cómo se juega un ataque de la Liga Nimbo. Las escenas se alargan si la voz lo necesita (tiempos.ts).
import { Audio } from "@remotion/media";
import { staticFile, Track } from "remotion";
import { Canasta, Cartas, Cierre, Dados, Gancho, Secreto } from "./escenas";
import { fondo, NICO } from "./marca";
import { GUIONES } from "./guion";
import { FPS, RETRASO_VOZ, tiempos } from "./tiempos";

export const COMO_SE_JUEGA = tiempos("como-se-juega");
const T = COMO_SE_JUEGA.T;

export const ComoSeJuega = () => {
  return (
    <>
      <Track name="Escenas">
        <Gancho name="Gancho" from={T.gancho.desde} durationInFrames={T.gancho.duracion} style={{ background: fondo() }} />
        <Cartas name="Cartas" from={T.cartas.desde} durationInFrames={T.cartas.duracion} style={{ background: fondo() }} />
        <Secreto name="Secreto" from={T.secreto.desde} durationInFrames={T.secreto.duracion} style={{ background: fondo() }} />
        <Dados name="Dados" from={T.dados.desde} durationInFrames={T.dados.duracion} style={{ background: fondo() }} />
        <Canasta name="Canasta" from={T.canasta.desde} durationInFrames={T.canasta.duracion} style={{ background: fondo(NICO.c1) }} />
        <Cierre name="Cierre" from={T.cierre.desde} durationInFrames={T.cierre.duracion} style={{ background: fondo() }} />
      </Track>
      <Track name="Voz">
        {GUIONES["como-se-juega"].filter(({ id }) => T[id].voz).map(({ id }) => (
          <Audio key={id} name={id} src={staticFile(`voz/como-se-juega/${id}.mp3`)} from={T[id].desde + Math.round(RETRASO_VOZ * FPS)} />
        ))}
      </Track>
    </>
  );
};
