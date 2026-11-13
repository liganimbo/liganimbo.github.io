// Escenas del Reel "Cómo se juega". El ejemplo es el del reglamento (§7) con dos cartas reales:
// Nico Serrano (Ataque 5, Pintura) tira dentro; Zoe Barrios (Defensa 5, Muro) cierra dentro; dados 6 y 5.
import type React from "react";
import { Easing, Interactive, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { Carta, Dado, Logo } from "./elementos";
import { COLOR, NICO, texto, titulo, ZOE } from "./marca";

const fijo = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const suave = Easing.bezier(0.16, 1, 0.3, 1);

const titular: React.CSSProperties = {
  fontFamily: titulo,
  fontWeight: 800,
  lineHeight: 0.95,
  textTransform: "uppercase",
  color: COLOR.texto,
  margin: 0,
};
const etiqueta: React.CSSProperties = {
  fontFamily: texto,
  fontWeight: 700,
  fontSize: 34,
  letterSpacing: 6,
  textTransform: "uppercase",
  color: COLOR.oro,
};

/** Entrada desde abajo con fundido, empezando en el fotograma `desde`. */
const entra = (frame: number, desde: number): React.CSSProperties => ({
  opacity: interpolate(frame, [desde, desde + 8], [0, 1], fijo),
  translate: interpolate(frame, [desde, desde + 14], ["0px 60px", "0px 0px"], { ...fijo, easing: suave }),
});

// 1. El gancho
const GanchoInner = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <>
      <Logo name="Logo" style={{ position: "absolute", top: 300, left: 80, ...entra(frame, 0) }} />
      <div style={{ position: "absolute", top: 680, left: 80, right: 80 }}>
        <div style={{ ...titular, fontSize: 160, ...entra(frame, 0.2 * fps) }}>¿Baloncesto</div>
        <div style={{ ...titular, fontSize: 160, ...entra(frame, 0.5 * fps) }}>con cartas</div>
        <div style={{ ...titular, fontSize: 160, color: COLOR.lila, ...entra(frame, 0.8 * fps) }}>y dos dados?</div>
        <div style={{ ...etiqueta, marginTop: 50, ...entra(frame, 1.3 * fps) }}>Así se juega un ataque</div>
      </div>
    </>
  );
};
export const Gancho = Interactive.create({ Component: GanchoInner, layout: "absolute-fill" });

// 2. Las cartas
const CartasInner = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <>
      <div style={{ ...titular, fontSize: 96, position: "absolute", top: 300, left: 80, right: 80, ...entra(frame, 0) }}>
        Cada carta: <span style={{ color: COLOR.oro }}>Ataque</span> y <span style={{ color: COLOR.lila }}>Defensa</span>
      </div>
      <Carta
        name="Ataca"
        carta={NICO}
        resalta={frame > 2.2 * fps ? "ataque" : undefined}
        style={{
          position: "absolute",
          top: 560,
          left: 60,
          rotate: "-5deg",
          translate: interpolate(frame, [0.3 * fps, 0.9 * fps], ["-700px 0px", "0px 0px"], { ...fijo, easing: suave }),
        }}
      />
      <Carta
        name="Defiende"
        carta={ZOE}
        resalta={frame > 2.2 * fps ? "defensa" : undefined}
        style={{
          position: "absolute",
          top: 900,
          right: 60,
          rotate: "5deg",
          translate: interpolate(frame, [0.6 * fps, 1.2 * fps], ["700px 0px", "0px 0px"], { ...fijo, easing: suave }),
        }}
      />
      <div style={{ position: "absolute", top: 1440, left: 80, right: 80, fontFamily: texto, fontWeight: 500, fontSize: 40, lineHeight: 1.3, color: COLOR.apagado, ...entra(frame, 2.2 * fps) }}>
        Los iconos suman <span style={{ color: COLOR.texto, fontWeight: 700 }}>+2</span>: Pintura al tirar dentro, Muro al defenderlo.
      </div>
    </>
  );
};
export const Cartas = Interactive.create({ Component: CartasInner, layout: "absolute-fill" });

/** Carta boca abajo que se da la vuelta en el fotograma `gira`. */
const Eleccion = ({ quien, revela, gira, color }: { quien: string; revela: string; gira: number; color: string }) => {
  const frame = useCurrentFrame();
  const giro = interpolate(frame, [gira, gira + 12], [0, 1], fijo);
  const delante = giro > 0.5;
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
          background: delante ? color : "#22256a",
          border: `6px solid ${delante ? color : COLOR.lila}`,
          boxShadow: "0 30px 80px rgb(0 0 0 / 45%)",
        }}
      >
        <span style={{ ...titular, fontSize: delante ? 92 : 220, color: delante ? COLOR.noche : COLOR.lila }}>{delante ? revela : "?"}</span>
      </div>
    </div>
  );
};

// 3. La elección secreta
const SecretoInner = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <>
      <div style={{ position: "absolute", top: 300, left: 80, right: 80 }}>
        <div style={{ ...titular, fontSize: 104, ...entra(frame, 0) }}>Los dos eligen en secreto</div>
        <div style={{ ...titular, fontSize: 60, color: COLOR.apagado, marginTop: 24, ...entra(frame, 0.4 * fps) }}>
          Dentro vale <span style={{ color: COLOR.texto }}>2</span>. Fuera vale <span style={{ color: COLOR.texto }}>3</span>.
        </div>
      </div>
      <div style={{ position: "absolute", top: 720, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 60, ...entra(frame, 0.6 * fps) }}>
        <Eleccion quien="Nico tira" revela={"Dentro"} gira={2.4 * fps} color={COLOR.oro} />
        <Eleccion quien="Zoe cierra" revela={"Dentro"} gira={2.8 * fps} color={COLOR.lila} />
      </div>
      <div style={{ position: "absolute", top: 1400, left: 80, right: 80, fontFamily: texto, fontWeight: 500, fontSize: 40, lineHeight: 1.3, color: COLOR.apagado, ...entra(frame, 3.2 * fps) }}>
        Zoe ha acertado: <span style={{ color: COLOR.texto, fontWeight: 700 }}>+2 a su defensa</span>.
      </div>
    </>
  );
};
export const Secreto = Interactive.create({ Component: SecretoInner, layout: "absolute-fill" });

/** Fila de la cuenta: cada sumando aparece por turnos y al final el total. */
const Cuenta = ({ nombre, sumandos, total, desde, color }: { nombre: string; sumandos: [string, string][]; total: number; desde: number; color: string }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const paso = 0.35 * fps;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ ...etiqueta, color, opacity: interpolate(frame, [desde - 6, desde], [0, 1], fijo) }}>{nombre}</div>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 18 }}>
        {sumandos.map(([valor, que], i) => (
          <div key={que} style={{ display: "flex", flexDirection: "column", alignItems: "center", ...entra(frame, desde + i * paso) }}>
            <span style={{ ...titular, fontSize: 104 }}>{valor}</span>
            <span style={{ fontFamily: texto, fontWeight: 500, fontSize: 30, color: COLOR.apagado }}>{que}</span>
          </div>
        ))}
        <div style={{ ...titular, fontSize: 104, color, marginLeft: "auto", ...entra(frame, desde + sumandos.length * paso) }}>= {total}</div>
      </div>
    </div>
  );
};

// 4. Los dados y la cuenta
const DadosInner = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const cae = 1.1 * fps;
  const rodando = frame < cae;
  // Mientras ruedan, caras que cambian cada 3 fotogramas.
  const cara = (semilla: number, final: number) => (rodando ? ((Math.floor(frame / 3) * 7 + semilla) % 6) + 1 : final);
  const vuelta = (sentido: number) =>
    `${interpolate(frame, [0, cae], [sentido * 540, 0], { ...fijo, easing: Easing.out(Easing.cubic) })}deg`;
  return (
    <>
      <div style={{ ...titular, fontSize: 104, position: "absolute", top: 300, left: 80, ...entra(frame, 0) }}>Dos dados</div>
      <div style={{ position: "absolute", top: 500, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 80 }}>
        <Dado
          name="Dado 1"
          lado={230}
          cara={cara(2, 6)}
          style={{
            rotate: vuelta(-1),
            translate: interpolate(frame, [0, cae], ["-400px -300px", "0px 0px"], { ...fijo, easing: Easing.out(Easing.cubic) }),
          }}
        />
        <Dado
          name="Dado 2"
          lado={230}
          cara={cara(5, 5)}
          style={{
            rotate: vuelta(1),
            translate: interpolate(frame, [0, cae], ["400px -360px", "0px 0px"], { ...fijo, easing: Easing.out(Easing.cubic) }),
          }}
        />
      </div>
      <div style={{ position: "absolute", top: 880, left: 80, right: 80, display: "flex", flexDirection: "column", gap: 90 }}>
        <Cuenta
          nombre="Ataque de Nico"
          sumandos={[["11", "dados"], ["+5", "ataque"], ["+2", "pintura"]]}
          total={18}
          desde={1.4 * fps}
          color={COLOR.oro}
        />
        <Cuenta
          nombre="Defensa de Zoe"
          sumandos={[["5", "base"], ["+5", "defensa"], ["+2", "muro"], ["+2", "cierra"]]}
          total={14}
          desde={3 * fps}
          color={COLOR.lila}
        />
      </div>
    </>
  );
};
export const Dados = Interactive.create({ Component: DadosInner, layout: "absolute-fill" });

// 5. ¡Canasta!
const CanastaInner = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <>
      <div style={{ position: "absolute", top: 600, left: 80, right: 80 }}>
        <div style={{ ...etiqueta, ...entra(frame, 0) }}>18 iguala o supera a 14</div>
        <div
          style={{
            ...titular,
            fontSize: 230,
            marginTop: 20,
            color: COLOR.oro,
            scale: interpolate(frame, [0, 0.5 * fps], [1.6, 1], { ...fijo, easing: Easing.out(Easing.back(2)) }),
            opacity: interpolate(frame, [0, 4], [0, 1], fijo),
            transformOrigin: "left center",
          }}
        >
          ¡Canasta!
        </div>
        <div style={{ ...titular, fontSize: 120, ...entra(frame, 0.4 * fps) }}>+2 para Nico</div>
      </div>
      <div style={{ position: "absolute", top: 1260, left: 80, right: 80, ...entra(frame, 1.2 * fps) }}>
        <div style={{ ...titular, fontSize: 64, color: COLOR.apagado }}>
          ¿Y de fuera? Vale <span style={{ color: COLOR.texto }}>3</span>, pero hay que superar la defensa <span style={{ color: COLOR.texto }}>por 2</span>.
        </div>
      </div>
    </>
  );
};
export const Canasta = Interactive.create({ Component: CanastaInner, layout: "absolute-fill" });

// 6. Cierre
const CierreInner = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <>
      <div style={{ position: "absolute", top: 300, left: 80, right: 80, display: "flex", flexDirection: "column", gap: 34 }}>
        <div style={{ ...titular, fontSize: 92, ...entra(frame, 0) }}>
          3 en pista, 1 suplente.
          <br />2 tiros por carta.
          <br />
          <span style={{ color: COLOR.lila }}>Gana quien más anote.</span>
        </div>
        <div style={{ ...etiqueta, ...entra(frame, 0.6 * fps) }}>Un juego de mesa para jugar en casa</div>
      </div>
      <Logo name="Logo" tam={2.6} style={{ position: "absolute", top: 960, left: 80, ...entra(frame, 1 * fps) }} />
      <div style={{ position: "absolute", top: 1330, left: 80, right: 80, fontFamily: texto, fontWeight: 500, fontSize: 40, color: COLOR.apagado, ...entra(frame, 1.4 * fps) }}>
        Reglas y cartas para imprimir en
        <div style={{ fontWeight: 700, color: COLOR.texto }}>liganimbo.github.io</div>
      </div>
    </>
  );
};
export const Cierre = Interactive.create({ Component: CierreInner, layout: "absolute-fill" });
