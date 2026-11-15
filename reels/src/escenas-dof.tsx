// Escenas de los Reels «¿Dentro o fuera?»: el último ataque de un amistoso apretado. Tú defiendes:
// con el marcador, las dos cartas y lo que necesita en cada caso, decides qué cierras; luego se ve qué pasó.
// Los datos salen de src/datos/dof-N.json (web/scripts/dentro-o-fuera.ts).
import { Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { Carta, Dado, Logo } from "./elementos";
import { Eleccion, entra, etiqueta, fijo, Marcador, suave, titular } from "./escenas";
import type { DatosDof } from "./guion";
import { COLOR, texto } from "./marca";

type Props = { d: DatosDof };
const nombre = (n: string) => n.split(" ")[0];
const TIPOS = ["dentro", "fuera"] as const;
const FORMAS_DE_SUMAR = [0, 0, 1, 2, 3, 4, 5, 6, 5, 4, 3, 2, 1];
/** Probabilidad de que dos dados sumen `n` o más. */
const probabilidad = (n: number) => (n <= 2 ? 1 : n > 12 ? 0 : FORMAS_DE_SUMAR.slice(n).reduce((s, x) => s + x, 0) / 36);
const ICONO: Record<string, string> = {
  Tiro: "Tiro: +1 al tirar de fuera",
  Aro: "Aro: +2 al tirar de dentro",
  Muro: "Muro: +2 contra tiros de dentro",
};

// 1. Gancho
export const DofGancho = ({ d }: Props) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <>
      <div style={{ ...etiqueta, position: "absolute", top: 320, left: 80, ...entra(frame, 0) }}>
        Amistoso · {d.equipos[0].nombre} – {d.equipos[1].nombre}
      </div>
      <div style={{ position: "absolute", top: 560, left: 80, right: 80 }}>
        <div style={{ ...titular, fontSize: 200, ...entra(frame, 0.2 * fps) }}>¿Dentro</div>
        <div style={{ ...titular, fontSize: 200, ...entra(frame, 0.45 * fps) }}>o fuera?</div>
        <div style={{ ...titular, fontSize: 110, color: COLOR.lila, marginTop: 40, ...entra(frame, 1.2 * fps) }}>Defiendes tú</div>
      </div>
    </>
  );
};

// 2. Contexto: el marcador y qué vale cada canasta
export const DofContexto = ({ d }: Props) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const ataca = d.equipos[d.ataca];
  const situacion =
    d.pierde === 1
      ? ["Pierden de 1.", "Cualquier canasta les da la victoria."]
      : ["Pierden de 2.", "De dentro empatan. De fuera, ganan."];
  return (
    <>
      <div style={{ ...etiqueta, position: "absolute", top: 320, left: 80, ...entra(frame, 0) }}>
        {d.muerteSubita ? "Muerte súbita · " : ""}Último ataque
      </div>
      <Marcador equipos={d.equipos} puntos={d.antes} resalta={1 - d.ataca} style={{ position: "absolute", top: 520, left: 0, right: 0, ...entra(frame, 0.2 * fps) }} />
      <div style={{ ...titular, position: "absolute", top: 1000, left: 80, right: 80, fontSize: 96, ...entra(frame, 1 * fps) }}>
        Atacan los {ataca.nombre}
      </div>
      <div style={{ position: "absolute", top: 1180, left: 80, right: 80, ...entra(frame, 1.8 * fps) }}>
        <div style={{ ...titular, fontSize: 80, color: COLOR.lila }}>{situacion[0]}</div>
        <div style={{ ...titular, fontSize: 80, color: COLOR.oro, marginTop: 12 }}>{situacion[1]}</div>
      </div>
    </>
  );
};

// 3. El duelo: quién tira y quién le marca
export const DofDuelo = ({ d }: Props) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pie = (lado: "tira" | "marca") => {
    const c = lado === "tira" ? d.tirador : d.defensor;
    return c.icono ? ICONO[c.icono] : lado === "tira" ? "Sin icono" : "Sin Muro";
  };
  return (
    <>
      <div style={{ ...titular, position: "absolute", top: 280, left: 80, right: 80, fontSize: 96, ...entra(frame, 0) }}>
        Tira {nombre(d.tirador.nombre)}
        <br />
        <span style={{ color: COLOR.lila }}>Le marca {nombre(d.defensor.nombre)}</span>
      </div>
      <Carta
        name="Tira"
        carta={d.tirador}
        resalta={frame > 1.4 * fps ? "ataque" : undefined}
        style={{
          position: "absolute",
          top: 560,
          left: 60,
          rotate: "-5deg",
          translate: interpolate(frame, [0.2 * fps, 0.8 * fps], ["-700px 0px", "0px 0px"], { ...fijo, easing: suave }),
        }}
      />
      <Carta
        name="Marca"
        carta={d.defensor}
        resalta={frame > 1.4 * fps ? "defensa" : undefined}
        style={{
          position: "absolute",
          top: 900,
          right: 60,
          rotate: "5deg",
          translate: interpolate(frame, [0.5 * fps, 1.1 * fps], ["700px 0px", "0px 0px"], { ...fijo, easing: suave }),
        }}
      />
      <div style={{ position: "absolute", top: 1560, left: 80, right: 80, fontFamily: texto, fontWeight: 700, fontSize: 40, lineHeight: 1.4, ...entra(frame, 2 * fps) }}>
        <div style={{ color: COLOR.oro }}>
          {nombre(d.tirador.nombre)} · {pie("tira")}
        </div>
        <div style={{ color: COLOR.lila }}>
          {nombre(d.defensor.nombre)} · {pie("marca")}
        </div>
      </div>
    </>
  );
};

// 4. La tabla: lo que necesita con los dados en cada caso
export const DofTabla = ({ d }: Props) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const celda = (tipo: (typeof TIPOS)[number], cierra: (typeof TIPOS)[number], orden: number) => {
    const n = d.tabla[tipo][cierra];
    const p = probabilidad(n);
    return (
      <div
        key={`${tipo}-${cierra}`}
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: 250,
          borderRadius: 30,
          background: `color-mix(in srgb, ${COLOR.oro} ${Math.round(12 + p * 70)}%, ${COLOR.noche})`,
          ...entra(frame, (1.2 + orden * 0.5) * fps),
        }}
      >
        <span style={{ ...titular, fontSize: 130, color: p > 0.45 ? COLOR.noche : COLOR.texto }}>{n > 12 ? "—" : `${n}+`}</span>
        <span style={{ fontFamily: texto, fontWeight: 700, fontSize: 34, color: p > 0.45 ? COLOR.noche : COLOR.apagado }}>{Math.round(p * 100)}%</span>
      </div>
    );
  };
  const cabecera = (t: string, color: string, desde: number): React.CSSProperties => ({ ...etiqueta, fontSize: 30, letterSpacing: 3, color, textAlign: "center", ...entra(frame, desde) });
  return (
    <>
      <div style={{ ...titular, position: "absolute", top: 280, left: 80, right: 80, fontSize: 92, ...entra(frame, 0) }}>
        Lo que necesita {nombre(d.tirador.nombre)}
        <br />
        <span style={{ color: COLOR.lila }}>con los dos dados</span>
      </div>
      <div
        style={{
          position: "absolute",
          top: 640,
          left: 60,
          right: 60,
          display: "grid",
          gridTemplateColumns: "200px 1fr 1fr",
          gap: 24,
          alignItems: "center",
        }}
      >
        <div />
        <div style={cabecera("", COLOR.lila, 0.6 * fps)}>Cierras dentro</div>
        <div style={cabecera("", COLOR.lila, 0.6 * fps)}>Cierras fuera</div>
        {TIPOS.map((tipo, fila) => [
          <div key={tipo} style={{ ...titular, fontSize: 70, color: COLOR.oro, ...entra(frame, (1 + fila) * fps) }}>
            Tira
            <br />
            {tipo}
          </div>,
          celda(tipo, "dentro", fila * 2),
          celda(tipo, "fuera", fila * 2 + 1),
        ])}
      </div>
      <div style={{ position: "absolute", top: 1370, left: 80, right: 80, fontFamily: texto, fontWeight: 500, fontSize: 40, lineHeight: 1.35, color: COLOR.apagado, ...entra(frame, 3.6 * fps) }}>
        Si cierras lo que tira, su defensa suma <span style={{ color: COLOR.texto, fontWeight: 700 }}>+2</span>. De fuera hay que superarla{" "}
        <span style={{ color: COLOR.texto, fontWeight: 700 }}>por 2</span>.
      </div>
    </>
  );
};

// 5. La pregunta, con cuenta atrás
export const DofPregunta = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const segundo = Math.floor(frame / fps);
  const dentroDelSegundo = (frame % fps) / fps;
  const cuenta = 3 - segundo;
  return (
    <>
      <div style={{ ...titular, position: "absolute", top: 320, left: 80, right: 80, fontSize: 150, ...entra(frame, 0) }}>
        ¿Qué
        <br />
        cierras?
      </div>
      {cuenta > 0 && (
        <div
          style={{
            ...titular,
            position: "absolute",
            top: 700,
            left: 0,
            right: 0,
            textAlign: "center",
            fontSize: 460,
            color: COLOR.oro,
            opacity: interpolate(dentroDelSegundo, [0, 0.1, 0.8, 1], [0, 1, 1, 0]),
            scale: interpolate(dentroDelSegundo, [0, 0.25], [1.4, 1], { ...fijo, easing: Easing.out(Easing.back(2)) }),
          }}
        >
          {cuenta}
        </div>
      )}
      <div style={{ ...titular, position: "absolute", top: 1360, left: 80, right: 80, fontSize: 84, color: COLOR.lila, ...entra(frame, 0.4 * fps) }}>
        Comenta <span style={{ color: COLOR.texto }}>DENTRO</span> o <span style={{ color: COLOR.texto }}>FUERA</span>
      </div>
    </>
  );
};

// 6. La revelación: qué tiró y qué cerraron
export const DofRevela = ({ d }: Props) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const defiende = d.equipos[1 - d.ataca];
  const palabra = (t: string) => (t === "fuera" ? "Fuera" : "Dentro");
  const acierta = d.tipo === d.cierra;
  return (
    <>
      <div style={{ ...titular, position: "absolute", top: 300, left: 80, right: 80, fontSize: 104, ...entra(frame, 0) }}>Y pasó esto</div>
      <div style={{ position: "absolute", top: 560, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 60 }}>
        <Eleccion quien={`${nombre(d.tirador.nombre)} tira`} revela={palabra(d.tipo)} gira={0.8 * fps} color={COLOR.oro} />
        <Eleccion quien={`${defiende.nombre} cierran`} revela={palabra(d.cierra)} gira={2.2 * fps} color={COLOR.lila} />
      </div>
      <div style={{ ...titular, position: "absolute", top: 1260, left: 80, right: 80, textAlign: "center", fontSize: 92, color: acierta ? COLOR.lila : COLOR.oro, ...entra(frame, 2.8 * fps) }}>
        {acierta ? "La defensa acierta: +2" : "La defensa falla"}
      </div>
    </>
  );
};

// 7. Los dados
export const DofDados = ({ d }: Props) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const lanza = 0.5 * fps;
  const cae = lanza + 1 * fps;
  const rodando = frame < cae;
  const cara = (semilla: number, final: number) => (rodando ? ((Math.floor(frame / 3) * 7 + semilla) % 6) + 1 : final);
  const caida = (desde: string) => interpolate(frame, [lanza, cae], [desde, "0px 0px"], { ...fijo, easing: Easing.out(Easing.cubic) });
  const vuelta = (sentido: number) => `${interpolate(frame, [lanza, cae], [sentido * 540, 0], { ...fijo, easing: Easing.out(Easing.cubic) })}deg`;
  const suma = d.dados[0] + d.dados[1];
  return (
    <>
      <div style={{ position: "absolute", top: 300, left: 0, right: 0, display: "flex", justifyContent: "center", ...entra(frame, 0) }}>
        <span style={{ ...titular, fontSize: 110, color: COLOR.noche, background: COLOR.oro, padding: "16px 40px", borderRadius: 24 }}>
          Necesita {d.necesita} o más
        </span>
      </div>
      <div style={{ position: "absolute", top: 640, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 80, opacity: frame >= lanza ? 1 : 0 }}>
        <Dado name="Dado 1" lado={260} cara={cara(2, d.dados[0])} style={{ rotate: vuelta(-1), translate: caida("-400px -300px") }} />
        <Dado name="Dado 2" lado={260} cara={cara(5, d.dados[1])} style={{ rotate: vuelta(1), translate: caida("400px -360px") }} />
      </div>
      <div
        style={{
          ...titular,
          position: "absolute",
          top: 1080,
          left: 0,
          right: 0,
          textAlign: "center",
          fontSize: 300,
          color: suma >= d.necesita ? COLOR.oro : COLOR.apagado,
          opacity: interpolate(frame, [cae + 0.3 * fps, cae + 0.3 * fps + 4], [0, 1], fijo),
          scale: interpolate(frame, [cae + 0.3 * fps, cae + 0.8 * fps], [1.6, 1], { ...fijo, easing: Easing.out(Easing.back(2)) }),
        }}
      >
        = {suma}
      </div>
    </>
  );
};

// 8. El final
export const DofFinal = ({ d }: Props) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const ganador = d.despues[0] === d.despues[1] ? null : d.despues[0] > d.despues[1] ? 0 : 1;
  return (
    <>
      <div
        style={{
          ...titular,
          position: "absolute",
          top: 330,
          left: 80,
          right: 80,
          fontSize: 210,
          color: d.anota ? COLOR.oro : COLOR.lila,
          opacity: interpolate(frame, [0, 4], [0, 1], fijo),
          scale: interpolate(frame, [0, 0.5 * fps], [1.6, 1], { ...fijo, easing: Easing.out(Easing.back(2)) }),
          transformOrigin: "left center",
        }}
      >
        {d.anota ? "¡Canasta!" : "¡No entra!"}
      </div>
      <Marcador equipos={d.equipos} puntos={d.despues} resalta={ganador ?? undefined} style={{ position: "absolute", top: 700, left: 0, right: 0, ...entra(frame, 0.4 * fps) }} />
      <div style={{ ...titular, position: "absolute", top: 1100, left: 80, right: 80, fontSize: 110, ...entra(frame, 0.8 * fps) }}>
        {ganador === null ? "Empate: muerte súbita" : `Ganan los ${d.equipos[ganador].nombre}`}
      </div>
    </>
  );
};

// 9. Cierre
export const DofCierre = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <>
      <div style={{ ...titular, position: "absolute", top: 320, left: 80, right: 80, fontSize: 130, ...entra(frame, 0) }}>
        ¿Acertaste?
        <br />
        <span style={{ color: COLOR.lila }}>Cuéntalo abajo</span>
      </div>
      <Logo name="Logo" tam={2.6} style={{ position: "absolute", top: 900, left: 80, ...entra(frame, 0.6 * fps) }} />
      <div style={{ position: "absolute", top: 1270, left: 80, right: 80, fontFamily: texto, fontWeight: 500, fontSize: 40, color: COLOR.apagado, ...entra(frame, 1 * fps) }}>
        La Temporada 1 empieza el 12 de enero.
        <div style={{ fontWeight: 700, color: COLOR.texto }}>@liganimbo</div>
      </div>
    </>
  );
};
