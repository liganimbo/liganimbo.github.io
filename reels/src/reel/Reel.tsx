// Un Reel a partir de su guion (src/datos/diciembre.json). Sin voz y en bucle: la primera escena ya está completa
// en el primer fotograma, y el Reel acaba con esa misma escena entrando, así que el último fotograma es el primero.
import { AbsoluteFill, Sequence, Track } from "remotion";
import { fondo } from "../marca";
import { Cartas, Cierres, Dados, entradaTitular, EscenaMarcador, Lista, Pregunta, Resultado, Revela, Tabla, Tira, Titular, UnaCarta } from "./escenas";
import { type Escena, type Guion, REELS } from "./tipos";

export const FPS = 30;

const Pinta = ({ e }: { e: Escena }) => {
  switch (e.tipo) {
    case "titular":
      return <Titular e={e} />;
    case "cartas":
      return <Cartas e={e} />;
    case "marcador":
      return <EscenaMarcador e={e} />;
    case "tabla":
      return <Tabla e={e} />;
    case "pregunta":
      return <Pregunta e={e} />;
    case "revela":
      return <Revela e={e} />;
    case "dados":
      return <Dados e={e} />;
    case "tira":
      return <Tira e={e} />;
    case "cierres":
      return <Cierres e={e} />;
    case "resultado":
      return <Resultado e={e} />;
    case "lista":
      return <Lista e={e} />;
    case "carta":
      return <UnaCarta e={e} />;
  }
};

/** Cuándo empieza y cuánto dura cada escena, y lo que dura la vuelta al principio. */
export function tiempos(g: Guion) {
  let desde = 0;
  const escenas = g.escenas.map((e) => {
    const t = { e, desde, duracion: Math.round(e.segundos * FPS) };
    desde += t.duracion;
    return t;
  });
  const primera = g.escenas[0];
  if (primera.tipo !== "titular") throw new Error(`El Reel ${g.id} tiene que empezar con un titular para poder cerrar el bucle.`);
  const vuelta = { e: primera, desde, duracion: entradaTitular(primera, FPS) + 1 };
  return { escenas, vuelta, total: desde + vuelta.duracion };
}

export const Reel = ({ id }: { id: string }) => {
  const g = REELS.find((r) => r.id === id)!;
  const { escenas, vuelta } = tiempos(g);
  return (
    <Track name="Escenas">
      {escenas.map(({ e, desde, duracion }, n) => (
        <Sequence key={n} name={`${n + 1} · ${e.tipo}`} from={desde} durationInFrames={duracion}>
          <AbsoluteFill style={{ background: fondo(e.acento) }}>{n === 0 && e.tipo === "titular" ? <Titular e={e} montada /> : <Pinta e={e} />}</AbsoluteFill>
        </Sequence>
      ))}
      <Sequence name="Vuelta al principio" from={vuelta.desde} durationInFrames={vuelta.duracion}>
        <AbsoluteFill style={{ background: fondo(vuelta.e.acento) }}>
          <Pinta e={vuelta.e} />
        </AbsoluteFill>
      </Sequence>
    </Track>
  );
};
