// Estilos y piezas que comparten las escenas de los Reels.
import type React from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import { Escudo } from "../elementos";
import { COLOR, texto, TIRO, titulo } from "../marca";
import type { Color, Equipo, Tipo } from "./tipos";

export const fijo = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
export const suave = Easing.bezier(0.16, 1, 0.3, 1);

export const titular: React.CSSProperties = {
  fontFamily: titulo,
  fontWeight: 800,
  lineHeight: 0.95,
  textTransform: "uppercase",
  color: COLOR.texto,
  margin: 0,
};
export const etiqueta: React.CSSProperties = {
  fontFamily: texto,
  fontWeight: 700,
  fontSize: 34,
  letterSpacing: 6,
  textTransform: "uppercase",
  color: COLOR.oro,
};
export const pie: React.CSSProperties = {
  fontFamily: texto,
  fontWeight: 500,
  fontSize: 44,
  lineHeight: 1.35,
  color: COLOR.apagado,
  // Un salto de línea en el texto es una línea aparte (en vez de unir frases con «·», que se cortan mal).
  whiteSpace: "pre-line",
};
export const color = (c: Color = "texto") => COLOR[c];

/** Tamaño de un titular según su línea más larga, para que quepa en el ancho del vídeo. */
export const tamTitular = (lineas: string[]) => {
  const larga = Math.max(...lineas.map((l) => l.length));
  return larga <= 10 ? 180 : larga <= 14 ? 150 : larga <= 20 ? 120 : larga <= 28 ? 96 : 76;
};

/** Entrada desde abajo con fundido, empezando en el fotograma `desde`. */
export const entra = (frame: number, desde: number): React.CSSProperties => ({
  opacity: interpolate(frame, [desde, desde + 8], [0, 1], fijo),
  translate: interpolate(frame, [desde, desde + 14], ["0px 60px", "0px 0px"], { ...fijo, easing: suave }),
});
/** Fotogramas que tarda en acabar una entrada que empieza en `desde`. */
export const finEntrada = (desde: number) => desde + 14;

/**
 * Zona que no tapa Instagram (ni el título de arriba ni el texto y los botones de abajo).
 * El contenido va centrado en vertical dentro de ella.
 */
export const Zona = ({ children, gap = 40 }: { children: React.ReactNode; gap?: number }) => (
  <div style={{ position: "absolute", top: 250, bottom: 420, left: 80, right: 80, display: "flex", flexDirection: "column", justifyContent: "center", gap }}>{children}</div>
);

/** Marcador grande: escudo y puntos de cada equipo. */
export const Marcador = ({ equipos, puntos, resalta, tam = 1, style }: { equipos: Equipo[]; puntos: number[]; resalta?: number; tam?: number; style?: React.CSSProperties }) => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 40 * tam, ...style }}>
    {equipos.map((e, lado) => (
      <div key={e.id} style={{ display: "flex", flexDirection: lado ? "row-reverse" : "row", alignItems: "center", gap: 30 * tam }}>
        <Escudo name={e.nombre} id={e.id} c1={e.c1} c2={e.c2} tam={170 * tam} />
        <span style={{ ...titular, fontSize: 230 * tam, minWidth: 150 * tam, textAlign: "center", color: resalta === lado ? COLOR.oro : COLOR.texto }}>{puntos[lado]}</span>
      </div>
    ))}
  </div>
);

/** Carta boca abajo que se da la vuelta en el fotograma `gira`. */
export const Eleccion = ({ quien, tipo, gira }: { quien: string; tipo: Tipo; gira: number }) => {
  const frame = useCurrentFrame();
  const giro = interpolate(frame, [gira, gira + 12], [0, 1], fijo);
  const delante = giro > 0.5;
  const { c1, c2 } = TIRO[tipo];
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 28 }}>
      <div style={{ ...etiqueta, color: COLOR.apagado }}>{quien}</div>
      <div
        style={{
          width: 400,
          height: 520,
          borderRadius: 34,
          display: "grid",
          placeItems: "center",
          textAlign: "center",
          scale: `${Math.abs(Math.cos(giro * Math.PI))} 1`,
          background: delante ? `radial-gradient(circle at 100% 0%, color-mix(in srgb, ${c1} 80%, #fff 20%), ${c1} 30%, ${c2} 95%)` : "#22256a",
          border: `6px solid ${delante ? c1 : COLOR.lila}`,
          boxShadow: "0 30px 80px rgb(0 0 0 / 45%)",
        }}
      >
        <span style={{ ...titular, fontSize: delante ? 92 : 220, color: delante ? COLOR.texto : COLOR.lila }}>{delante ? (tipo === "fuera" ? "Fuera" : "Dentro") : "?"}</span>
      </div>
    </div>
  );
};
