import { Composition, Folder } from "remotion";
import { FPS, Reel, tiempos } from "./reel/Reel";
import { REELS } from "./reel/tipos";

// Reels de Instagram: 1080×1920 (9:16), 30 fps. Uno por guion de src/datos/diciembre.json (web/scripts/reels.ts).
export const RemotionRoot: React.FC = () => {
  return (
    <Folder name="Diciembre">
      {REELS.map((r) => (
        <Composition key={r.id} id={r.id} component={Reel} durationInFrames={tiempos(r).total} fps={FPS} width={1080} height={1920} defaultProps={{ id: r.id }} />
      ))}
    </Folder>
  );
};
