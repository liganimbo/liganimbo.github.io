// Reels «¿Dentro o fuera?»: uno por cada jugada guardada en src/datos/dof-N.json. Las escenas se ajustan a la voz (tiempos.ts).
import { Audio } from "@remotion/media";
import { AbsoluteFill, Sequence, staticFile, Track } from "remotion";
import { DofCierre, DofContexto, DofDados, DofDuelo, DofFinal, DofGancho, DofPregunta, DofRevela, DofTabla } from "./escenas-dof";
import { DOF, GUIONES } from "./guion";
import { fondo } from "./marca";
import { FPS, RETRASO_VOZ, tiempos } from "./tiempos";

export type ReelDof = "dentro-o-fuera-1" | "dentro-o-fuera-2";
export const tiemposDof = (reel: ReelDof) => tiempos(reel);

export const DentroOFuera = ({ reel }: { reel: ReelDof }) => {
  const d = DOF[reel];
  const { T } = tiempos(reel);
  const ataca = d.equipos[d.ataca];
  const defiende = d.equipos[1 - d.ataca];
  const escenas = [
    ["gancho", <DofGancho d={d} />, fondo()],
    ["contexto", <DofContexto d={d} />, fondo(ataca.c2)],
    ["duelo", <DofDuelo d={d} />, fondo()],
    ["tabla", <DofTabla d={d} />, fondo()],
    ["pregunta", <DofPregunta />, fondo(defiende.c2)],
    ["revela", <DofRevela d={d} />, fondo()],
    ["dados", <DofDados d={d} />, fondo()],
    ["final", <DofFinal d={d} />, fondo(d.anota ? ataca.c2 : defiende.c2)],
    ["cierre", <DofCierre />, fondo()],
  ] as const;
  return (
    <>
      <Track name="Escenas">
        {escenas.map(([id, escena, fondoEscena]) => (
          <Sequence key={id} name={id} from={T[id].desde} durationInFrames={T[id].duracion}>
            <AbsoluteFill style={{ background: fondoEscena }}>{escena}</AbsoluteFill>
          </Sequence>
        ))}
      </Track>
      <Track name="Voz">
        {GUIONES[reel].filter(({ id }) => T[id].voz).map(({ id }) => (
          <Audio key={id} name={id} src={staticFile(`voz/${reel}/${id}.mp3`)} from={T[id].desde + Math.round(RETRASO_VOZ * FPS)} />
        ))}
      </Track>
    </>
  );
};
