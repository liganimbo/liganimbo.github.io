// Escenas del Reel del amistoso: solo la jugada decisiva, contada despacio y con lo que necesita en pantalla.
// Los datos salen de src/datos/amistoso.json (web/scripts/amistoso.ts).
import { Easing, Interactive, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import datos from "./datos/amistoso.json";
import { Carta, Dado, Logo } from "./elementos";
import { Cuenta, Eleccion, entra, etiqueta, fijo, Marcador as MarcadorBase, suave, titular } from "./escenas";
import { COLOR, texto } from "./marca";

const [LOCAL, VISITANTE] = datos.equipos;
const D = datos.decisiva;
const nombre = (n: string) => n.split(" ")[0];
/** Lo que pondría el marcador con una canasta de 2 en vez del triple. */
const EMPATE = D.antes.map((p, i) => (i === D.equipo ? p + 2 : p));

const Marcador = (props: Omit<React.ComponentProps<typeof MarcadorBase>, "equipos">) => <MarcadorBase equipos={[LOCAL, VISITANTE]} {...props} />;

/** Sello de color que aparece de golpe. */
const sello = (frame: number, desde: number, color: string): React.CSSProperties => ({
  ...titular,
  fontSize: 100,
  color: COLOR.noche,
  background: color,
  padding: "16px 40px",
  borderRadius: 24,
  opacity: interpolate(frame, [desde, desde + 4], [0, 1], fijo),
  scale: interpolate(frame, [desde, desde + 10], [1.5, 1], { ...fijo, easing: Easing.out(Easing.back(2)) }),
});

// 1. Gancho: muerte súbita y los Lobos por delante
const GanchoInner = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <>
      <div style={{ ...etiqueta, position: "absolute", top: 320, left: 80, ...entra(frame, 0) }}>
        Amistoso · {LOCAL.nombre} – {VISITANTE.nombre}
      </div>
      <div style={{ position: "absolute", top: 460, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
        <span style={sello(frame, 0.5 * fps, COLOR.oro)}>Muerte súbita</span>
      </div>
      <Marcador puntos={D.antes} resalta={(1 - D.equipo) as 0 | 1} style={{ position: "absolute", top: 760, left: 0, right: 0, ...entra(frame, 1.2 * fps) }} />
      <div style={{ ...titular, position: "absolute", top: 1250, left: 80, right: 80, textAlign: "center", fontSize: 96, color: COLOR.lila, ...entra(frame, 2 * fps) }}>
        Los {VISITANTE.nombre} ganan de 2
      </div>
    </>
  );
};
export const AmistosoGancho = Interactive.create({ Component: GanchoInner, layout: "absolute-fill" });

// 2. El reto: de dos empatan, de tres ganan
const Opcion = ({ tiro, puntos, resultado, color, desde }: { tiro: string; puntos: number[]; resultado: string; color: string; desde: number }) => {
  const frame = useCurrentFrame();
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 40,
        padding: "36px 44px",
        borderRadius: 34,
        background: "rgb(255 255 255 / 6%)",
        border: `4px solid ${color}`,
        ...entra(frame, desde),
      }}
    >
      <div style={{ flex: 1 }}>
        <div style={{ ...etiqueta, color }}>{tiro}</div>
        <div style={{ ...titular, fontSize: 110, marginTop: 10 }}>{resultado}</div>
      </div>
      <div style={{ ...titular, fontSize: 120, color }}>
        {puntos[0]}–{puntos[1]}
      </div>
    </div>
  );
};
const RetoInner = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <>
      <div style={{ ...titular, position: "absolute", top: 300, left: 80, right: 80, fontSize: 110, ...entra(frame, 0) }}>
        Último ataque
        <br />
        <span style={{ color: COLOR.lila }}>de los {LOCAL.nombre}</span>
      </div>
      <div style={{ position: "absolute", top: 720, left: 80, right: 80, display: "flex", flexDirection: "column", gap: 50 }}>
        <Opcion tiro="Canasta de 2" puntos={EMPATE} resultado="Empate" color={COLOR.apagado} desde={1.4 * fps} />
        <Opcion tiro="Triple" puntos={D.despues} resultado="¡Ganan!" color={COLOR.oro} desde={3.2 * fps} />
      </div>
    </>
  );
};
export const AmistosoReto = Interactive.create({ Component: RetoInner, layout: "absolute-fill" });

// 3. Quién tira
const TiradoraInner = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <>
      <div style={{ ...titular, position: "absolute", top: 300, left: 80, right: 80, fontSize: 110, ...entra(frame, 0) }}>
        Tira {nombre(D.tirador.nombre)}
      </div>
      <Carta
        name="Tira"
        carta={D.tirador}
        resalta={frame > 1.6 * fps ? "ataque" : undefined}
        style={{
          position: "absolute",
          top: 520,
          left: 0,
          right: 0,
          marginInline: "auto",
          rotate: "-3deg",
          scale: 1.35,
          transformOrigin: "top center",
          translate: interpolate(frame, [0.2 * fps, 0.8 * fps], ["0px 900px", "0px 0px"], { ...fijo, easing: suave }),
        }}
      />
      <div style={{ ...titular, position: "absolute", top: 1420, left: 80, right: 80, fontSize: 80, color: COLOR.apagado, ...entra(frame, 2.2 * fps) }}>
        Ataque <span style={{ color: COLOR.oro }}>{D.tirador.ataque}</span> de 6.
        <br />
        No es una tiradora.
      </div>
    </>
  );
};
export const AmistosoTiradora = Interactive.create({ Component: TiradoraInner, layout: "absolute-fill" });

// 4. El farol: los Lobos cierran dentro, Carla tira de fuera
const FarolInner = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const palabra = (lado: string) => (lado === "fuera" ? "Fuera" : "Dentro");
  return (
    <>
      <div style={{ position: "absolute", top: 300, left: 80, right: 80 }}>
        <div style={{ ...titular, fontSize: 104, ...entra(frame, 0) }}>Los dos eligen en secreto</div>
        <div style={{ ...titular, fontSize: 60, color: COLOR.apagado, marginTop: 24, ...entra(frame, 0.4 * fps) }}>
          ¿Irá a lo seguro?
        </div>
      </div>
      <div style={{ position: "absolute", top: 720, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 60, ...entra(frame, 0.4 * fps) }}>
        <Eleccion quien={`${VISITANTE.nombre} cierran`} revela={palabra(D.cierra)} gira={1.8 * fps} color={COLOR.lila} />
        <Eleccion quien={`${nombre(D.tirador.nombre)} tira`} revela={palabra(D.tipo)} gira={3.4 * fps} color={COLOR.oro} />
      </div>
      <div style={{ ...titular, position: "absolute", top: 1400, left: 80, right: 80, textAlign: "center", fontSize: 100, color: COLOR.oro, ...entra(frame, 3.8 * fps) }}>
        ¡Va a por el triple!
      </div>
    </>
  );
};
export const AmistosoFarol = Interactive.create({ Component: FarolInner, layout: "absolute-fill" });

// 5. Lo que necesita en los dados: la cuenta paso a paso, al ritmo de la voz
const NecesitaInner = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const triple = D.defensa + 2;
  return (
    <>
      <div style={{ ...titular, position: "absolute", top: 300, left: 80, right: 80, fontSize: 104, ...entra(frame, 0) }}>
        ¿Qué necesita?
      </div>
      <div style={{ position: "absolute", top: 520, left: 80, right: 80, display: "flex", flexDirection: "column", gap: 70 }}>
        <Cuenta
          nombre={`Defensa de ${nombre(D.defensor.nombre)}`}
          sumandos={[["5", "base"], [`+${D.defensa - 5}`, "su defensa"]]}
          total={D.defensa}
          desde={0.3 * fps}
          color={COLOR.lila}
        />
        <Cuenta
          nombre="Un triple tiene que superarla por 2"
          sumandos={[[String(D.defensa), "defensa"], ["+2", "por ser triple"]]}
          total={triple}
          desde={2.6 * fps}
          color={COLOR.texto}
        />
        <Cuenta
          nombre={`${nombre(D.tirador.nombre)} pone su ataque`}
          sumandos={[[String(triple), "para el triple"], [`−${D.ataque}`, "su ataque"]]}
          total={D.necesita}
          desde={6.5 * fps}
          color={COLOR.oro}
        />
      </div>
      <div
        style={{
          ...titular,
          position: "absolute",
          top: 1420,
          left: 80,
          right: 80,
          fontSize: 120,
          color: COLOR.noche,
          background: COLOR.oro,
          padding: "20px 36px",
          borderRadius: 28,
          textAlign: "center",
          opacity: interpolate(frame, [8.4 * fps, 8.4 * fps + 4], [0, 1], fijo),
          scale: interpolate(frame, [8.4 * fps, 8.9 * fps], [1.4, 1], { ...fijo, easing: Easing.out(Easing.back(2)) }),
        }}
      >
        Dados: {D.necesita} o más
      </div>
    </>
  );
};
export const AmistosoNecesita = Interactive.create({ Component: NecesitaInner, layout: "absolute-fill" });

// 6. Los dados
const DadosInner = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const cae = 1.2 * fps;
  const rodando = frame < cae;
  const cara = (semilla: number, final: number) => (rodando ? ((Math.floor(frame / 3) * 7 + semilla) % 6) + 1 : final);
  const caida = (desde: string) => interpolate(frame, [0, cae], [desde, "0px 0px"], { ...fijo, easing: Easing.out(Easing.cubic) });
  const vuelta = (sentido: number) => `${interpolate(frame, [0, cae], [sentido * 540, 0], { ...fijo, easing: Easing.out(Easing.cubic) })}deg`;
  const suma = D.dados[0] + D.dados[1];
  return (
    <>
      <div style={{ ...etiqueta, position: "absolute", top: 320, left: 80 }}>Necesita {D.necesita} o más</div>
      <div style={{ position: "absolute", top: 520, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 80 }}>
        <Dado name="Dado 1" lado={260} cara={cara(2, D.dados[0])} style={{ rotate: vuelta(-1), translate: caida("-400px -300px") }} />
        <Dado name="Dado 2" lado={260} cara={cara(5, D.dados[1])} style={{ rotate: vuelta(1), translate: caida("400px -360px") }} />
      </div>
      <div
        style={{
          ...titular,
          position: "absolute",
          top: 1000,
          left: 0,
          right: 0,
          textAlign: "center",
          fontSize: 300,
          color: COLOR.oro,
          opacity: interpolate(frame, [2.2 * fps, 2.2 * fps + 4], [0, 1], fijo),
          scale: interpolate(frame, [2.2 * fps, 2.7 * fps], [1.6, 1], { ...fijo, easing: Easing.out(Easing.back(2)) }),
        }}
      >
        = {suma}
      </div>
    </>
  );
};
export const AmistosoDados = Interactive.create({ Component: DadosInner, layout: "absolute-fill" });

// 7. ¡Triple!
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
          fontSize: 240,
          color: COLOR.oro,
          opacity: interpolate(frame, [0, 4], [0, 1], fijo),
          scale: interpolate(frame, [0, 0.5 * fps], [1.6, 1], { ...fijo, easing: Easing.out(Easing.back(2)) }),
          transformOrigin: "left center",
        }}
      >
        ¡Triple!
      </div>
      <Marcador puntos={datos.final} resalta={datos.ganador as 0 | 1} style={{ position: "absolute", top: 700, left: 0, right: 0, ...entra(frame, 0.4 * fps) }} />
      <div style={{ ...titular, position: "absolute", top: 1100, left: 80, right: 80, fontSize: 110, ...entra(frame, 0.8 * fps) }}>
        Ganan los {ganador.nombre}
      </div>
    </>
  );
};
export const AmistosoFinal = Interactive.create({ Component: FinalInner, layout: "absolute-fill" });

// 8. Cierre
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
