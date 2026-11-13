// Escenas del Reel del amistoso: el partido entero en segundos y su jugada decisiva.
// Los datos salen de src/datos/amistoso.json (web/scripts/amistoso.ts).
import { Easing, Interactive, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import datos from "./datos/amistoso.json";
import { Carta, Dado, Escudo, Logo } from "./elementos";
import { Cuenta, entra, etiqueta, fijo, suave, titular } from "./escenas";
import { COLOR, texto } from "./marca";

const [LOCAL, VISITANTE] = datos.equipos;
const D = datos.decisiva;
const nombre = (n: string) => n.split(" ")[0];
/** Marcador al acabar los 8 ataques de cada equipo (antes de la muerte súbita). */
const REGULAR = datos.marcadores.slice(0, 16);

/** Marcador grande: escudo y puntos de cada equipo. */
const Marcador = ({ puntos, resalta, style }: { puntos: number[]; resalta?: 0 | 1; style?: React.CSSProperties }) => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 40, ...style }}>
    {[LOCAL, VISITANTE].map((e, lado) => (
      <div key={e.id} style={{ display: "flex", flexDirection: lado ? "row-reverse" : "row", alignItems: "center", gap: 30 }}>
        <Escudo name={e.nombre} id={e.id} c1={e.c1} c2={e.c2} tam={170} />
        <span
          style={{
            ...titular,
            fontSize: 230,
            minWidth: 150,
            textAlign: "center",
            color: resalta === lado ? COLOR.oro : COLOR.texto,
          }}
        >
          {puntos[lado]}
        </span>
      </div>
    ))}
  </div>
);

// 1. Gancho
const GanchoInner = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <>
      <div style={{ ...etiqueta, position: "absolute", top: 320, left: 80, ...entra(frame, 0) }}>Amistoso de pretemporada</div>
      <div style={{ position: "absolute", top: 520, left: 0, right: 0, display: "flex", justifyContent: "center", alignItems: "center", gap: 60 }}>
        {[LOCAL, VISITANTE].map((e, i) => (
          <div key={e.id} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 24, ...entra(frame, (0.2 + i * 0.3) * fps) }}>
            <Escudo name={e.nombre} id={e.id} c1={e.c1} c2={e.c2} tam={300} />
            <div style={{ ...titular, fontSize: 92 }}>{e.nombre}</div>
            <div style={{ fontFamily: texto, fontSize: 34, color: COLOR.apagado }}>{e.ciudad}</div>
          </div>
        ))}
      </div>
      <div style={{ ...titular, position: "absolute", top: 1450, left: 0, right: 0, textAlign: "center", fontSize: 90, color: COLOR.lila, ...entra(frame, 0.9 * fps) }}>
        Hoy no cuenta. O sí.
      </div>
    </>
  );
};
export const AmistosoGancho = Interactive.create({ Component: GanchoInner, layout: "absolute-fill" });

// 2. El partido, en segundos
const PartidoInner = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const paso = Math.floor(interpolate(frame, [0.3 * fps, 2.8 * fps], [0, REGULAR.length - 1], fijo));
  return (
    <>
      <div style={{ ...etiqueta, position: "absolute", top: 320, left: 80, color: COLOR.apagado }}>
        Ataque {Math.min(REGULAR.length, paso + 1)} de {REGULAR.length}
      </div>
      <Marcador puntos={REGULAR[paso]} style={{ position: "absolute", top: 620, left: 0, right: 0 }} />
      <div
        style={{
          position: "absolute",
          top: 1100,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          opacity: interpolate(frame, [3 * fps, 3.1 * fps], [0, 1], fijo),
          scale: interpolate(frame, [3 * fps, 3.4 * fps], [1.5, 1], { ...fijo, easing: Easing.out(Easing.back(2)) }),
        }}
      >
        <span style={{ ...titular, fontSize: 110, color: COLOR.noche, background: COLOR.oro, padding: "16px 40px", borderRadius: 24 }}>Muerte súbita</span>
      </div>
    </>
  );
};
export const AmistosoPartido = Interactive.create({ Component: PartidoInner, layout: "absolute-fill" });

// 3. Los Lobos se adelantan
const LobosInner = () => {
  const frame = useCurrentFrame();
  return (
    <>
      <div style={{ ...etiqueta, position: "absolute", top: 320, left: 80, ...entra(frame, 0) }}>
        Muerte súbita · ataque de los {VISITANTE.nombre}
      </div>
      <Marcador puntos={D.antes} resalta={1} style={{ position: "absolute", top: 620, left: 0, right: 0 }} />
      <div style={{ ...titular, position: "absolute", top: 1120, left: 80, right: 80, textAlign: "center", fontSize: 96, ...entra(frame, 6) }}>
        Canasta de 2.
        <br />
        <span style={{ color: COLOR.lila }}>Les toca a los {LOCAL.nombre}.</span>
      </div>
    </>
  );
};
export const AmistosoLobos = Interactive.create({ Component: LobosInner, layout: "absolute-fill" });

// 4. La jugada
const JugadaInner = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sello = (texto: string, color: string, desde: number): React.CSSProperties => ({
    ...titular,
    fontSize: 64,
    color: COLOR.noche,
    background: color,
    padding: "10px 28px",
    borderRadius: 18,
    opacity: interpolate(frame, [desde, desde + 4], [0, 1], fijo),
    scale: interpolate(frame, [desde, desde + 10], [1.6, 1], { ...fijo, easing: Easing.out(Easing.back(2)) }),
  });
  return (
    <>
      <div style={{ ...titular, position: "absolute", top: 300, left: 80, right: 80, fontSize: 110, ...entra(frame, 0) }}>
        Último ataque
      </div>
      <Carta
        name="Tira"
        carta={D.tirador}
        style={{
          position: "absolute",
          top: 520,
          left: 60,
          rotate: "-5deg",
          translate: interpolate(frame, [0.2 * fps, 0.8 * fps], ["-700px 0px", "0px 0px"], { ...fijo, easing: suave }),
        }}
      />
      <Carta
        name="Defiende"
        carta={D.defensor}
        style={{
          position: "absolute",
          top: 860,
          right: 60,
          rotate: "5deg",
          translate: interpolate(frame, [0.5 * fps, 1.1 * fps], ["700px 0px", "0px 0px"], { ...fijo, easing: suave }),
        }}
      />
      <div style={{ position: "absolute", top: 1400, left: 80, right: 80, display: "flex", gap: 24, flexWrap: "wrap" }}>
        <span style={sello(`${nombre(D.tirador.nombre)} tira ${D.tipo}`, COLOR.oro, 2.4 * fps)}>
          {nombre(D.tirador.nombre)} tira {D.tipo}
        </span>
        <span style={sello(`${nombre(D.defensor.nombre)} cierra ${D.cierra}`, COLOR.lila, 3.2 * fps)}>
          {nombre(D.defensor.nombre)} cierra {D.cierra}
        </span>
      </div>
    </>
  );
};
export const AmistosoJugada = Interactive.create({ Component: JugadaInner, layout: "absolute-fill" });

// 5. Los dados
const DadosInner = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const cae = 1.1 * fps;
  const rodando = frame < cae;
  const cara = (semilla: number, final: number) => (rodando ? ((Math.floor(frame / 3) * 7 + semilla) % 6) + 1 : final);
  const caida = (desde: string) => interpolate(frame, [0, cae], [desde, "0px 0px"], { ...fijo, easing: Easing.out(Easing.cubic) });
  const vuelta = (sentido: number) => `${interpolate(frame, [0, cae], [sentido * 540, 0], { ...fijo, easing: Easing.out(Easing.cubic) })}deg`;
  const suma = D.dados[0] + D.dados[1];
  return (
    <>
      <div style={{ ...titular, position: "absolute", top: 300, left: 80, fontSize: 104 }}>Para ganar, de tres</div>
      <div style={{ position: "absolute", top: 500, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 80 }}>
        <Dado name="Dado 1" lado={230} cara={cara(2, D.dados[0])} style={{ rotate: vuelta(-1), translate: caida("-400px -300px") }} />
        <Dado name="Dado 2" lado={230} cara={cara(5, D.dados[1])} style={{ rotate: vuelta(1), translate: caida("400px -360px") }} />
      </div>
      <div style={{ position: "absolute", top: 880, left: 80, right: 80, display: "flex", flexDirection: "column", gap: 90 }}>
        <Cuenta
          nombre={`Ataque de ${nombre(D.tirador.nombre)}`}
          sumandos={[[String(suma), "dados"], [`+${D.ataque}`, "ataque"]]}
          total={suma + D.ataque}
          desde={1.4 * fps}
          color={COLOR.oro}
        />
        <Cuenta
          nombre={`Defensa de ${nombre(D.defensor.nombre)}`}
          sumandos={[["5", "base"], [`+${D.defensor.defensa}`, "defensa"], ["+2", "por ser triple"]]}
          total={D.defensa + 2}
          desde={2.6 * fps}
          color={COLOR.lila}
        />
      </div>
    </>
  );
};
export const AmistosoDados = Interactive.create({ Component: DadosInner, layout: "absolute-fill" });

// 6. ¡Entra!
const FinalInner = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const ganador = datos.equipos[datos.ganador];
  return (
    <>
      <div
        style={{
          ...titular,
          position: "absolute",
          top: 330,
          left: 80,
          right: 80,
          fontSize: 260,
          color: COLOR.oro,
          opacity: interpolate(frame, [0, 4], [0, 1], fijo),
          scale: interpolate(frame, [0, 0.5 * fps], [1.6, 1], { ...fijo, easing: Easing.out(Easing.back(2)) }),
          transformOrigin: "left center",
        }}
      >
        ¡Entra!
      </div>
      <Marcador puntos={datos.final} resalta={datos.ganador as 0 | 1} style={{ position: "absolute", top: 700, left: 0, right: 0, ...entra(frame, 0.4 * fps) }} />
      <div style={{ ...titular, position: "absolute", top: 1100, left: 80, right: 80, fontSize: 110, ...entra(frame, 0.7 * fps) }}>
        Ganan los {ganador.nombre}
      </div>
      <div style={{ position: "absolute", top: 1330, left: 80, right: 80, fontFamily: texto, fontSize: 38, color: COLOR.apagado, ...entra(frame, 1.2 * fps) }}>
        Mejor del partido: <span style={{ color: COLOR.texto, fontWeight: 700 }}>{datos.mejor.nombre}</span> · {datos.mejor.pts} pts y {datos.mejor.paradas} paradas
      </div>
    </>
  );
};
export const AmistosoFinal = Interactive.create({ Component: FinalInner, layout: "absolute-fill" });

// 7. Cierre
const CierreInner = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <>
      <div style={{ ...titular, position: "absolute", top: 320, left: 80, right: 80, fontSize: 110, ...entra(frame, 0) }}>
        La Temporada 1
        <br />
        empieza el 12 de enero.
        <br />
        <span style={{ color: COLOR.lila }}>¿Con quién vas?</span>
      </div>
      <Logo name="Logo" tam={2.6} style={{ position: "absolute", top: 960, left: 80, ...entra(frame, 0.6 * fps) }} />
      <div style={{ position: "absolute", top: 1330, left: 80, right: 80, fontFamily: texto, fontWeight: 700, fontSize: 40, ...entra(frame, 1 * fps) }}>
        @liganimbo
      </div>
    </>
  );
};
export const AmistosoCierre = Interactive.create({ Component: CierreInner, layout: "absolute-fill" });
