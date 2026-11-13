// Reel: un amistoso de pretemporada contado por su jugada decisiva. Las escenas se ajustan a la voz (tiempos.ts).
import { Audio } from "@remotion/media";
import { staticFile, Track } from "remotion";
import { AmistosoCierre, AmistosoDados, AmistosoFinal, AmistosoGancho, AmistosoJugada, AmistosoLobos, AmistosoPartido } from "./escenas-amistoso";
import datos from "./datos/amistoso.json";
import { fondo } from "./marca";
import { GUIONES } from "./guion";
import { FPS, RETRASO_VOZ, tiempos } from "./tiempos";

export const AMISTOSO = tiempos("amistoso");
const T = AMISTOSO.T;
const [LOCAL, VISITANTE] = datos.equipos;

export const Amistoso = () => {
  return (
    <>
      <Track name="Escenas">
        <AmistosoGancho name="Gancho" from={T.gancho.desde} durationInFrames={T.gancho.duracion} style={{ background: fondo() }} />
        <AmistosoPartido name="Partido" from={T.partido.desde} durationInFrames={T.partido.duracion} style={{ background: fondo() }} />
        <AmistosoLobos name="Lobos" from={T.lobos.desde} durationInFrames={T.lobos.duracion} style={{ background: fondo(VISITANTE.c2) }} />
        <AmistosoJugada name="Jugada" from={T.jugada.desde} durationInFrames={T.jugada.duracion} style={{ background: fondo(LOCAL.c2) }} />
        <AmistosoDados name="Dados" from={T.dados.desde} durationInFrames={T.dados.duracion} style={{ background: fondo() }} />
        <AmistosoFinal name="Final" from={T.final.desde} durationInFrames={T.final.duracion} style={{ background: fondo(LOCAL.c2) }} />
        <AmistosoCierre name="Cierre" from={T.cierre.desde} durationInFrames={T.cierre.duracion} style={{ background: fondo() }} />
      </Track>
      <Track name="Voz">
        {GUIONES.amistoso.filter(({ id }) => T[id].voz).map(({ id }) => (
          <Audio key={id} name={id} src={staticFile(`voz/amistoso/${id}.mp3`)} from={T[id].desde + Math.round(RETRASO_VOZ * FPS)} />
        ))}
      </Track>
    </>
  );
};
