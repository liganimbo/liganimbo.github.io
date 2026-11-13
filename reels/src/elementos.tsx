// Piezas reutilizables: logotipo, carta y dado.
import type React from "react";
import { Interactive, type InteractivitySchema } from "remotion";
import { COLOR, texto, titulo, type DatosCarta } from "./marca";

type ConEstilo = { readonly style?: React.CSSProperties };

/** Logotipo LIGA NIMBO, solo texto y en flat. */
const LogoInner = ({ tam = 1, style }: ConEstilo & { readonly tam?: number }) => (
  <div style={{ fontFamily: titulo, fontWeight: 800, lineHeight: 1, color: COLOR.texto, ...style }}>
    <div style={{ fontSize: 31 * tam, letterSpacing: 11 * tam, color: COLOR.oro, marginLeft: 4 * tam }}>LIGA</div>
    <div style={{ fontSize: 104 * tam, fontStyle: "italic", marginTop: -6 * tam }}>NIMBO</div>
  </div>
);

export const Logo = Interactive.create({
  Component: LogoInner,
  layout: "none",
  schema: {
    tam: { type: "number", default: 1, min: 0.3, max: 4, step: 0.1, description: "Tamaño", hiddenFromList: false },
  } as const satisfies InteractivitySchema,
});

/** Carta de jugador, como en las publicaciones (CartaGrande). */
const CartaInner = ({
  carta,
  resalta,
  style,
}: ConEstilo & { readonly carta: DatosCarta; readonly resalta?: "ataque" | "defensa" }) => {
  const numero = (valor: number, etiqueta: string, activo: boolean) => (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "14px 0 10px",
        borderRadius: 18,
        background: activo ? COLOR.oro : "#e9eaf2",
        opacity: resalta && !activo ? 0.45 : 1,
      }}
    >
      <span style={{ fontFamily: titulo, fontWeight: 800, fontSize: 110, lineHeight: 1 }}>{valor}</span>
      <span style={{ fontFamily: texto, fontWeight: 700, fontSize: 22, letterSpacing: 3, textTransform: "uppercase" }}>{etiqueta}</span>
    </div>
  );
  return (
    <div
      style={{
        width: 460,
        borderRadius: 34,
        overflow: "hidden",
        background: "#f7f7fb",
        color: "#151823",
        border: `6px solid ${carta.c1}`,
        boxShadow: "0 30px 80px rgb(0 0 0 / 45%)",
        ...style,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "16px 24px",
          background: carta.c1,
          color: carta.c2,
          fontFamily: titulo,
          fontWeight: 800,
          fontSize: 46,
          letterSpacing: 3,
        }}
      >
        <span>{carta.equipo}</span>
        <span
          style={{
            fontFamily: texto,
            fontSize: 24,
            letterSpacing: 1,
            textTransform: "uppercase",
            padding: "6px 16px",
            borderRadius: 999,
            background: carta.c2,
            color: carta.c1,
          }}
        >
          {carta.icono}
        </span>
      </div>
      <div style={{ fontFamily: titulo, fontWeight: 800, fontSize: 58, lineHeight: 1, padding: "22px 24px 0", textTransform: "uppercase" }}>
        {carta.nombre}
      </div>
      <div style={{ fontFamily: texto, fontWeight: 500, fontSize: 24, color: "#6b7084", padding: "6px 24px 0" }}>{carta.meta}</div>
      <div style={{ display: "flex", gap: 14, padding: 22 }}>
        {numero(carta.ataque, "Ataque", resalta === "ataque")}
        {numero(carta.defensa, "Defensa", resalta === "defensa")}
      </div>
    </div>
  );
};

export const Carta = Interactive.create({
  Component: CartaInner,
  layout: "none",
});

const PUNTOS: Record<number, [number, number][]> = {
  1: [[1, 1]],
  2: [[0, 0], [2, 2]],
  3: [[0, 0], [1, 1], [2, 2]],
  4: [[0, 0], [2, 0], [0, 2], [2, 2]],
  5: [[0, 0], [2, 0], [1, 1], [0, 2], [2, 2]],
  6: [[0, 0], [2, 0], [0, 1], [2, 1], [0, 2], [2, 2]],
};

/** Dado blanco con puntos oscuros. */
const DadoInner = ({ cara, lado = 190, style }: ConEstilo & { readonly cara: number; readonly lado?: number }) => (
  <div
    style={{
      position: "relative",
      width: lado,
      height: lado,
      borderRadius: lado * 0.2,
      background: "#f7f7fb",
      boxShadow: "0 24px 60px rgb(0 0 0 / 45%)",
      ...style,
    }}
  >
    {PUNTOS[cara].map(([x, y], i) => (
      <div
        key={i}
        style={{
          position: "absolute",
          width: lado * 0.18,
          height: lado * 0.18,
          borderRadius: "50%",
          background: "#151823",
          left: lado * (0.2 + x * 0.3) - lado * 0.09,
          top: lado * (0.2 + y * 0.3) - lado * 0.09,
        }}
      />
    ))}
  </div>
);

export const Dado = Interactive.create({
  Component: DadoInner,
  layout: "none",
  schema: {
    cara: { type: "number", default: 6, min: 1, max: 6, step: 1, integer: true, description: "Cara", hiddenFromList: false },
  } as const satisfies InteractivitySchema,
});
