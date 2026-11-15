// Escenas del Reel «Crónica»: un partido entero en unos 45 segundos. Las dos partes pasan ataque a ataque con el marcador
// arriba; la jugada decisiva va despacio, con la elección secreta y los dados. Datos: src/datos/cronica.json
// (web/scripts/cronica.ts).
import { Easing, Interactive, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { Carta, Dado, Escudo, Logo } from "./elementos";
import { Eleccion, entra, etiqueta, fijo, Marcador as MarcadorBase, suave, titular } from "./escenas";
import { CRONICA as C } from "./guion";
import { COLOR, texto } from "./marca";

type JugadaC = (typeof C.jugadas)[number];
const [LOCAL, VISITANTE] = C.equipos;
const D = C.jugadas[C.decisiva.indice];
const ANTES = C.decisiva.indice > 0 ? C.jugadas[C.decisiva.indice - 1].marcador : [0, 0];
const nombre = (n: string) => n.split(" ")[0];
const plural = (n: string) => n.endsWith("s");
const conArt = (n: string) => (plural(n) ? `los ${n}` : `el ${n}`);
/** El marcador va visitante-local, como en la web. */
const Marcador = (props: Omit<React.ComponentProps<typeof MarcadorBase>, "equipos" | "puntos"> & { puntos: number[] }) => (
  <MarcadorBase {...props} equipos={[VISITANTE, LOCAL]} puntos={[props.puntos[1], props.puntos[0]]} resalta={props.resalta === undefined ? undefined : 1 - props.resalta} />
);
const resultado = (j: JugadaC) => (j.mate ? "¡Mate!" : j.tapon ? "¡Tapón!" : j.anota ? (j.tipo === "fuera" ? "Triple" : "Canasta") : "Fallo");
const colorResultado = (j: JugadaC) => (j.mate || j.tapon ? COLOR.oro : j.anota ? COLOR.verde : COLOR.apagado);

// 1. Gancho: los dos escudos y la promesa
const GanchoInner = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <>
      <div style={{ ...etiqueta, position: "absolute", top: 320, left: 80, ...entra(frame, 0) }}>La crónica · {C.contexto}</div>
      <div style={{ position: "absolute", top: 520, left: 0, right: 0, display: "flex", justifyContent: "center", alignItems: "center", gap: 70 }}>
        <Escudo name={VISITANTE.nombre} id={VISITANTE.id} c1={VISITANTE.c1} c2={VISITANTE.c2} tam={300} style={entra(frame, 0.2 * fps)} />
        <span style={{ ...titular, fontSize: 120, color: COLOR.lila, ...entra(frame, 0.5 * fps) }}>vs</span>
        <Escudo name={LOCAL.nombre} id={LOCAL.id} c1={LOCAL.c1} c2={LOCAL.c2} tam={300} style={entra(frame, 0.8 * fps)} />
      </div>
      <div style={{ position: "absolute", top: 1020, left: 80, right: 80 }}>
        <div style={{ ...titular, fontSize: 130, ...entra(frame, 1.2 * fps) }}>{C.jugadas.length} ataques</div>
        <div style={{ ...titular, fontSize: 130, color: COLOR.oro, ...entra(frame, 1.8 * fps) }}>
          {C.decisiva.indice === C.jugadas.length - 1 ? "Y se decidió en el último" : `Y se decidió en el ${C.decisiva.indice + 1}`}
        </div>
      </div>
    </>
  );
};
export const CronicaGancho = Interactive.create({ Component: GanchoInner, layout: "absolute-fill" });

// 2. Estilos: cómo juega cada uno
const Estilo = ({ eq, desde }: { eq: (typeof C.equipos)[number]; desde: number }) => {
  const frame = useCurrentFrame();
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 50, padding: "40px 48px", borderRadius: 40, background: "rgb(255 255 255 / 6%)", border: `5px solid ${eq.c2}`, ...entra(frame, desde) }}>
      <Escudo name={eq.nombre} id={eq.id} c1={eq.c1} c2={eq.c2} tam={190} />
      <div>
        <div style={{ ...titular, fontSize: 110 }}>{eq.nombre}</div>
        <div style={{ ...titular, fontSize: 80, color: COLOR.oro, marginTop: 14 }}>{eq.estilo}</div>
      </div>
    </div>
  );
};
const EstilosInner = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <>
      <div style={{ ...titular, position: "absolute", top: 300, left: 80, right: 80, fontSize: 110, ...entra(frame, 0) }}>Dos formas de jugar</div>
      <div style={{ position: "absolute", top: 640, left: 80, right: 80, display: "flex", flexDirection: "column", gap: 60 }}>
        <Estilo eq={LOCAL} desde={0.3 * fps} />
        <Estilo eq={VISITANTE} desde={1.8 * fps} />
      </div>
    </>
  );
};
export const CronicaEstilos = Interactive.create({ Component: EstilosInner, layout: "absolute-fill" });

// 3 y 4. Cada parte, ataque a ataque: una fila por ataque y el marcador que cambia arriba
const Fila = ({ j, desde }: { j: JugadaC; desde: number }) => {
  const frame = useCurrentFrame();
  const eq = C.equipos[j.equipo];
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 22,
        height: 112,
        padding: "0 26px",
        borderRadius: 24,
        background: "rgb(255 255 255 / 7%)",
        borderLeft: `12px solid ${eq.c2}`,
        ...entra(frame, desde),
      }}
    >
      <Escudo name={eq.nombre} id={eq.id} c1={eq.c1} c2={eq.c2} tam={64} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ ...titular, fontSize: 50, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{j.tirador}</div>
        <div style={{ fontFamily: texto, fontWeight: 500, fontSize: 26, color: COLOR.apagado, marginTop: 4, whiteSpace: "nowrap" }}>
          {j.tipo === "fuera" ? "Fuera" : "Dentro"} · cierran {j.cierra}
        </div>
      </div>
      <Dado name="Dado 1" cara={j.dados[0]} lado={62} style={{ boxShadow: "none" }} />
      <Dado name="Dado 2" cara={j.dados[1]} lado={62} style={{ boxShadow: "none" }} />
      <div style={{ ...titular, width: 270, textAlign: "right", fontSize: 50, whiteSpace: "nowrap", color: colorResultado(j) }}>
        {resultado(j)}
        {j.anota && <span style={{ color: COLOR.texto }}> +{j.puntos}</span>}
      </div>
    </div>
  );
};

const Parte = ({ titulo, desde, hasta }: { titulo: string; desde: number; hasta: number }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  // Como mucho 8 filas: si hay más (muerte súbita), las últimas.
  const inicio = Math.max(desde, hasta - 8);
  const jugadas = C.jugadas.slice(inicio, hasta);
  const paso = 0.8 * fps;
  const empieza = 0.6 * fps;
  const vistas = Math.max(0, Math.min(jugadas.length, Math.floor((frame - empieza) / paso) + 1));
  const marcador = vistas > 0 ? jugadas[vistas - 1].marcador : inicio > 0 ? C.jugadas[inicio - 1].marcador : [0, 0];
  return (
    <>
      <div style={{ ...etiqueta, position: "absolute", top: 300, left: 80, ...entra(frame, 0) }}>{titulo}</div>
      <Marcador puntos={marcador} tam={0.55} style={{ position: "absolute", top: 370, left: 0, right: 0, ...entra(frame, 0) }} />
      <div style={{ position: "absolute", top: 640, left: 60, right: 60, display: "flex", flexDirection: "column", gap: 16 }}>
        {jugadas.map((j, i) => (
          <Fila key={i} j={j} desde={empieza + i * paso} />
        ))}
      </div>
    </>
  );
};
const PrimeraInner = () => <Parte titulo="Primera parte" desde={0} hasta={C.descanso} />;
export const CronicaPrimera = Interactive.create({ Component: PrimeraInner, layout: "absolute-fill" });
const SegundaInner = () => <Parte titulo="Segunda parte" desde={C.descanso} hasta={C.decisiva.indice} />;
export const CronicaSegunda = Interactive.create({ Component: SegundaInner, layout: "absolute-fill" });

// 5. La jugada decisiva, despacio: quién tira, la elección secreta y los dados
const DecisivaInner = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  // Al ritmo de la voz: «Va dentro» (~1 s), «y le cierran fuera» (~2 s), los dados (~3 s).
  const cae = 3.1 * fps;
  const rueda = 2.5 * fps;
  const rodando = frame < cae;
  const cara = (semilla: number, final: number) => (rodando ? ((Math.floor(frame / 3) * 7 + semilla) % 6) + 1 : final);
  const caida = (desde: string) => interpolate(frame, [rueda, cae], [desde, "0px 0px"], { ...fijo, easing: Easing.out(Easing.cubic) });
  const vuelta = (sentido: number) => `${interpolate(frame, [rueda, cae], [sentido * 540, 0], { ...fijo, easing: Easing.out(Easing.cubic) })}deg`;
  const eqAtaca = C.equipos[D.equipo];
  const eqDefiende = C.equipos[1 - D.equipo];
  const palabra = (t: string) => (t === "fuera" ? "Fuera" : "Dentro");
  return (
    <>
      <div style={{ ...etiqueta, position: "absolute", top: 300, left: 80, ...entra(frame, 0) }}>
        {C.decisiva.indice === C.jugadas.length - 1 ? "Último ataque" : `Ataque ${C.decisiva.indice + 1}`}
      </div>
      <Marcador puntos={ANTES} tam={0.45} style={{ position: "absolute", top: 360, left: 0, right: 0, ...entra(frame, 0) }} />
      <Carta
        name="Tira"
        carta={C.decisiva.tirador}
        resalta="ataque"
        style={{
          position: "absolute",
          top: 640,
          left: 80,
          rotate: "-4deg",
          scale: 0.95,
          transformOrigin: "top left",
          translate: interpolate(frame, [0.2 * fps, 0.8 * fps], ["-900px 0px", "0px 0px"], { ...fijo, easing: suave }),
          opacity: interpolate(frame, [2.3 * fps, 2.6 * fps], [1, 0], fijo),
        }}
      />
      <div style={{ position: "absolute", top: 640, right: 60, display: "flex", flexDirection: "column", gap: 0, scale: 0.62, transformOrigin: "top right", opacity: interpolate(frame, [2.3 * fps, 2.6 * fps], [1, 0], fijo) }}>
        <Eleccion quien={`${nombre(D.tirador)} tira`} revela={palabra(D.tipo)} gira={1.1 * fps} color={COLOR.oro} />
        <div style={{ height: 40 }} />
        <Eleccion quien={`${eqDefiende.nombre} ${plural(eqDefiende.nombre) ? "cierran" : "cierra"}`} revela={palabra(D.cierra)} gira={2.0 * fps} color={COLOR.lila} />
      </div>
      <div style={{ position: "absolute", top: 760, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 80, opacity: interpolate(frame, [rueda, rueda + 4], [0, 1], fijo) }}>
        <Dado name="Dado 1" lado={260} cara={cara(2, D.dados[0])} style={{ rotate: vuelta(-1), translate: caida("-400px -300px") }} />
        <Dado name="Dado 2" lado={260} cara={cara(5, D.dados[1])} style={{ rotate: vuelta(1), translate: caida("400px -360px") }} />
      </div>
      <div
        style={{
          ...titular,
          position: "absolute",
          top: 1180,
          left: 80,
          right: 80,
          textAlign: "center",
          fontSize: 120,
          opacity: interpolate(frame, [cae + 0.4 * fps, cae + 0.4 * fps + 4], [0, 1], fijo),
        }}
      >
        Ataque <span style={{ color: COLOR.oro }}>{D.ataque}</span>
        <br />
        <span style={{ fontSize: 80, color: COLOR.apagado }}>
          contra {D.defensa} de defensa
        </span>
      </div>
      <div style={{ ...etiqueta, position: "absolute", top: 1560, left: 80, right: 80, textAlign: "center", color: COLOR.apagado, opacity: interpolate(frame, [cae + 0.8 * fps, cae + 0.8 * fps + 4], [0, 1], fijo) }}>
        {eqAtaca.nombre} · necesitaba {D.necesita} o más
      </div>
    </>
  );
};
export const CronicaDecisiva = Interactive.create({ Component: DecisivaInner, layout: "absolute-fill" });

// 6. Final: el sello, el marcador y el mejor del partido
const FinalInner = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const ganador = C.equipos[C.ganador];
  return (
    <>
      <div
        style={{
          ...titular,
          position: "absolute",
          top: 300,
          left: 80,
          right: 80,
          fontSize: 230,
          color: COLOR.oro,
          opacity: interpolate(frame, [0, 4], [0, 1], fijo),
          scale: interpolate(frame, [0, 0.5 * fps], [1.6, 1], { ...fijo, easing: Easing.out(Easing.back(2)) }),
          transformOrigin: "left center",
        }}
      >
        {D.mate ? "¡Mate!" : D.tipo === "fuera" ? "¡Triple!" : "¡Canasta!"}
      </div>
      <Marcador puntos={C.final} resalta={C.ganador} style={{ position: "absolute", top: 640, left: 0, right: 0, ...entra(frame, 0.4 * fps) }} />
      <div style={{ ...titular, position: "absolute", top: 1030, left: 80, right: 80, fontSize: 100, ...entra(frame, 0.8 * fps) }}>
        {plural(ganador.nombre) ? "Ganan" : "Gana"} {conArt(ganador.nombre)}
      </div>
      <div style={{ position: "absolute", top: 1300, left: 80, right: 80, ...entra(frame, 1.6 * fps) }}>
        <div style={etiqueta}>★ Mejor del partido</div>
        <div style={{ ...titular, fontSize: 90, marginTop: 12 }}>{C.mejor.nombre}</div>
        <div style={{ fontFamily: texto, fontWeight: 500, fontSize: 40, color: COLOR.apagado, marginTop: 10 }}>
          {C.mejor.pts} puntos · {C.mejor.paradas} {C.mejor.paradas === 1 ? "parada" : "paradas"}
        </div>
      </div>
    </>
  );
};
export const CronicaFinal = Interactive.create({ Component: FinalInner, layout: "absolute-fill" });

// 7. Cierre
const CierreInner = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <>
      <div style={{ ...titular, position: "absolute", top: 320, left: 80, right: 80, fontSize: 120, ...entra(frame, 0) }}>
        Cada partido,
        <br />
        <span style={{ color: COLOR.lila }}>jugada a jugada</span>
      </div>
      <Logo name="Logo" tam={2.6} style={{ position: "absolute", top: 860, left: 80, ...entra(frame, 0.6 * fps) }} />
      <div style={{ position: "absolute", top: 1240, left: 80, right: 80, fontFamily: texto, fontWeight: 700, fontSize: 46, ...entra(frame, 1 * fps) }}>
        liganimbo.github.io
        <div style={{ fontWeight: 500, fontSize: 38, color: COLOR.apagado, marginTop: 10 }}>Enlace en la bio · @liganimbo</div>
      </div>
    </>
  );
};
export const CronicaCierre = Interactive.create({ Component: CierreInner, layout: "absolute-fill" });
