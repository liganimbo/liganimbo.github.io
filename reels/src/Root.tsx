import { Composition, Folder } from "remotion";
import { AMISTOSO, Amistoso } from "./Amistoso";
import { DentroOFuera, tiemposDof } from "./DentroOFuera";
import { COMO_SE_JUEGA, ComoSeJuega } from "./ComoSeJuega";
import { CRONICA_T, Cronica } from "./Cronica";
import { Canasta, Cartas, Cierre, Dados, Gancho, Secreto } from "./escenas";
import { fondo, NICO } from "./marca";

// Reels de Instagram: 1080×1920 (9:16), 30 fps.
export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition id="ComoSeJuega" component={ComoSeJuega} durationInFrames={COMO_SE_JUEGA.total} fps={30} width={1080} height={1920} />
      <Composition id="Amistoso" component={Amistoso} durationInFrames={AMISTOSO.total} fps={30} width={1080} height={1920} />
      <Composition id="DentroOFuera1" component={DentroOFuera} durationInFrames={tiemposDof("dentro-o-fuera-1").total} fps={30} width={1080} height={1920} defaultProps={{ reel: "dentro-o-fuera-1" as const }} />
      <Composition id="Cronica" component={Cronica} durationInFrames={CRONICA_T.total} fps={30} width={1080} height={1920} />
      <Composition id="DentroOFuera2" component={DentroOFuera} durationInFrames={tiemposDof("dentro-o-fuera-2").total} fps={30} width={1080} height={1920} defaultProps={{ reel: "dentro-o-fuera-2" as const }} />
      <Folder name="Escenas">
        <Composition id="Gancho" component={Gancho} durationInFrames={75} fps={30} width={1080} height={1920} defaultProps={{ style: { background: fondo() } }} />
        <Composition id="Cartas" component={Cartas} durationInFrames={135} fps={30} width={1080} height={1920} defaultProps={{ style: { background: fondo() } }} />
        <Composition id="Secreto" component={Secreto} durationInFrames={135} fps={30} width={1080} height={1920} defaultProps={{ style: { background: fondo() } }} />
        <Composition id="Dados" component={Dados} durationInFrames={150} fps={30} width={1080} height={1920} defaultProps={{ style: { background: fondo() } }} />
        <Composition id="Canasta" component={Canasta} durationInFrames={90} fps={30} width={1080} height={1920} defaultProps={{ style: { background: fondo(NICO.c1) } }} />
        <Composition id="Cierre" component={Cierre} durationInFrames={105} fps={30} width={1080} height={1920} defaultProps={{ style: { background: fondo() } }} />
      </Folder>
    </>
  );
};
