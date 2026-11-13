// Reel: cómo se juega un ataque de la Liga Nimbo, en unos 23 segundos.
import { Track, useVideoConfig } from "remotion";
import { Canasta, Cartas, Cierre, Dados, Gancho, Secreto } from "./escenas";
import { fondo, NICO } from "./marca";

export const ComoSeJuega = () => {
  const { fps } = useVideoConfig();
  return (
    <Track name="Escenas">
      <Gancho name="Gancho" durationInFrames={2.5 * fps} style={{ background: fondo() }} />
      <Cartas name="Cartas" from={2.5 * fps} durationInFrames={4.5 * fps} style={{ background: fondo() }} />
      <Secreto name="Secreto" from={7 * fps} durationInFrames={4.5 * fps} style={{ background: fondo() }} />
      <Dados name="Dados" from={11.5 * fps} durationInFrames={5 * fps} style={{ background: fondo() }} />
      <Canasta name="Canasta" from={16.5 * fps} durationInFrames={3 * fps} style={{ background: fondo(NICO.c1) }} />
      <Cierre name="Cierre" from={19.5 * fps} durationInFrames={3.5 * fps} style={{ background: fondo() }} />
    </Track>
  );
};
