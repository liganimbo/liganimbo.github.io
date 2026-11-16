// Una escena por tipo (ver tipos.ts). Todas se colocan en la zona que no tapa Instagram.
import { Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { Carta, Dado, Escudo } from "../elementos";
import { COLOR, texto } from "../marca";
import { color, Eleccion, entra, etiqueta, finEntrada, fijo, Marcador, pie, tamTitular, titular, Zona } from "./comun";
import type { Escena, Tipo } from "./tipos";

type De<T extends Escena["tipo"]> = { e: Extract<Escena, { tipo: T }> };
const palabra = (t: Tipo) => (t === "fuera" ? "Fuera" : "Dentro");

// --- Titular ---------------------------------------------------------------------------------

/** Cuándo entra cada parte de un titular (en segundos). */
const tiemposTitular = (e: Extract<Escena, { tipo: "titular" }>) => {
  const lineas = e.lineas.map((_, n) => 0.2 + 0.25 * n);
  return { lineas, pie: lineas[lineas.length - 1] + 0.35 };
};
/** Fotogramas hasta que el titular está completo: lo que dura la vuelta al principio en el bucle. */
export const entradaTitular = (e: Extract<Escena, { tipo: "titular" }>, fps: number) => finEntrada(tiemposTitular(e).pie * fps);

/** `montada`: ya completa desde el primer fotograma (la primera escena del Reel, para que el bucle no se note). */
export const Titular = ({ e, montada = false }: De<"titular"> & { montada?: boolean }) => {
  const frame = useCurrentFrame() + (montada ? 10_000 : 0);
  const { fps } = useVideoConfig();
  const t = tiemposTitular(e);
  const tam = tamTitular(e.lineas);
  return (
    <Zona>
      {e.etiqueta && <div style={{ ...etiqueta, ...entra(frame, 0) }}>{e.etiqueta}</div>}
      {e.escudos && (
        <div style={{ display: "flex", gap: 30, ...entra(frame, 0.1 * fps) }}>
          {e.escudos.map((x) => (
            <Escudo key={x.id} name={x.nombre} id={x.id} c1={x.c1} c2={x.c2} tam={e.lineas.length > 1 && e.escudos!.length === 1 ? 190 : 150} />
          ))}
        </div>
      )}
      <div>
        {e.lineas.map((l, n) => (
          <div key={n} style={{ ...titular, fontSize: tam, color: color(e.colores?.[n]), ...entra(frame, t.lineas[n] * fps) }}>
            {l}
          </div>
        ))}
      </div>
      {e.pie && <div style={{ ...pie, ...entra(frame, t.pie * fps) }}>{e.pie}</div>}
    </Zona>
  );
};

// --- Cartas ----------------------------------------------------------------------------------

export const Cartas = ({ e }: De<"cartas">) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <Zona gap={50}>
      <div style={{ ...titular, fontSize: tamTitular([e.titulo]) * 0.75, ...entra(frame, 0) }}>{e.titulo}</div>
      <div style={{ display: "flex", justifyContent: "center", gap: 20 }}>
        {e.cartas.map((c, n) => (
          <div key={c.nombre} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
            <div style={{ ...etiqueta, color: n ? COLOR.lila : COLOR.oro, ...entra(frame, (0.5 + 0.3 * n) * fps) }}>{e.roles[n]}</div>
            <Carta
              name={e.roles[n]}
              carta={c}
              resalta={frame > 1.5 * fps ? (n ? "defensa" : "ataque") : undefined}
              style={{
                scale: 0.95,
                rotate: n ? "3deg" : "-3deg",
                translate: interpolate(frame, [(0.2 + 0.3 * n) * fps, (0.8 + 0.3 * n) * fps], [n ? "700px 0px" : "-700px 0px", "0px 0px"], { ...fijo, easing: Easing.out(Easing.cubic) }),
              }}
            />
          </div>
        ))}
      </div>
      {e.pie && <div style={{ ...pie, ...entra(frame, 1.6 * fps) }}>{e.pie}</div>}
    </Zona>
  );
};

// --- Marcador --------------------------------------------------------------------------------

export const EscenaMarcador = ({ e }: De<"marcador">) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <Zona gap={60}>
      <div style={{ ...etiqueta, ...entra(frame, 0) }}>{e.etiqueta}</div>
      <Marcador equipos={e.equipos} puntos={e.puntos} resalta={e.resalta} style={entra(frame, 0.2 * fps)} />
      {e.titulo && <div style={{ ...titular, fontSize: tamTitular([e.titulo]) * 0.8, ...entra(frame, 0.8 * fps) }}>{e.titulo}</div>}
      {e.pie && <div style={{ ...pie, color: COLOR.texto, ...entra(frame, 1.3 * fps) }}>{e.pie}</div>}
    </Zona>
  );
};

// --- Tabla: lo que necesita con los dados en cada caso -----------------------------------------

const FORMAS_DE_SUMAR = [0, 0, 1, 2, 3, 4, 5, 6, 5, 4, 3, 2, 1];
/** Probabilidad de que dos dados sumen `n` o más. */
const probabilidad = (n: number) => (n <= 2 ? 1 : n > 12 ? 0 : FORMAS_DE_SUMAR.slice(n).reduce((s, x) => s + x, 0) / 36);
const TIPOS: Tipo[] = ["dentro", "fuera"];

export const Tabla = ({ e }: De<"tabla">) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const celda = (tipo: Tipo, cierra: Tipo, orden: number) => {
    const n = e.tabla[tipo][cierra];
    const p = probabilidad(n);
    const claro = p > 0.45;
    return (
      <div
        key={`${tipo}-${cierra}`}
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: 240,
          borderRadius: 30,
          background: `color-mix(in srgb, ${COLOR.oro} ${Math.round(12 + p * 70)}%, ${COLOR.noche})`,
          ...entra(frame, (1.2 + orden * 0.5) * fps),
        }}
      >
        <span style={{ ...titular, fontSize: 130, color: claro ? COLOR.noche : COLOR.texto }}>{n > 12 ? "—" : n <= 2 ? "✓" : `${n}+`}</span>
        <span style={{ fontFamily: texto, fontWeight: 700, fontSize: 34, color: claro ? COLOR.noche : COLOR.apagado }}>{Math.round(p * 100)}%</span>
      </div>
    );
  };
  const cabecera = { ...etiqueta, fontSize: 30, letterSpacing: 3, color: COLOR.lila, textAlign: "center" as const, ...entra(frame, 0.6 * fps) };
  return (
    <Zona gap={50}>
      <div style={{ ...titular, fontSize: 92, ...entra(frame, 0) }}>
        {e.titulo}
        <br />
        <span style={{ color: COLOR.lila }}>con los dos dados</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "180px 1fr 1fr", gap: 24, alignItems: "center", marginLeft: -20, marginRight: -20 }}>
        <div />
        <div style={cabecera}>Cierras dentro</div>
        <div style={cabecera}>Cierras fuera</div>
        {TIPOS.map((tipo, fila) => [
          <div key={tipo} style={{ ...titular, fontSize: 64, color: COLOR.oro, ...entra(frame, (1 + fila) * fps) }}>
            Tira
            <br />
            {tipo}
          </div>,
          celda(tipo, "dentro", fila * 2),
          celda(tipo, "fuera", fila * 2 + 1),
        ])}
      </div>
      <div style={{ ...pie, fontSize: 38, ...entra(frame, 3.4 * fps) }}>
        Si cierras lo que tira, su defensa suma <span style={{ color: COLOR.texto, fontWeight: 700 }}>+2</span>. De fuera hay que superarla{" "}
        <span style={{ color: COLOR.texto, fontWeight: 700 }}>por 2</span>.
      </div>
    </Zona>
  );
};

// --- Pregunta, con cuenta atrás ------------------------------------------------------------------

export const Pregunta = ({ e }: De<"pregunta">) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const segundo = Math.floor(frame / fps);
  const dentroDelSegundo = (frame % fps) / fps;
  const cuenta = 3 - segundo;
  return (
    <Zona gap={30}>
      <div style={{ ...titular, fontSize: 150, ...entra(frame, 0) }}>
        {e.lineas.map((l) => (
          <div key={l}>{l}</div>
        ))}
      </div>
      <div
        style={{
          ...titular,
          height: 460,
          textAlign: "center",
          fontSize: 460,
          color: COLOR.oro,
          opacity: cuenta > 0 ? interpolate(dentroDelSegundo, [0, 0.1, 0.8, 1], [0, 1, 1, 0]) : 0,
          scale: interpolate(dentroDelSegundo, [0, 0.25], [1.4, 1], { ...fijo, easing: Easing.out(Easing.back(2)) }),
        }}
      >
        {Math.max(cuenta, 1)}
      </div>
      <div style={{ ...titular, fontSize: 84, color: COLOR.lila, ...entra(frame, 0.4 * fps) }}>{e.pie}</div>
    </Zona>
  );
};

// --- Revela: qué tiró y qué cerraron ---------------------------------------------------------------

export const Revela = ({ e }: De<"revela">) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const acierta = e.tira.tipo === e.cierra.tipo;
  return (
    <Zona gap={60}>
      <div style={{ ...titular, fontSize: 104, ...entra(frame, 0) }}>{e.titulo}</div>
      <div style={{ display: "flex", justifyContent: "center", gap: 60 }}>
        <Eleccion quien={e.tira.quien} revela={palabra(e.tira.tipo)} gira={0.8 * fps} color={COLOR.oro} />
        <Eleccion quien={e.cierra.quien} revela={palabra(e.cierra.tipo)} gira={2 * fps} color={COLOR.lila} />
      </div>
      <div style={{ ...titular, textAlign: "center", fontSize: 92, color: acierta ? COLOR.lila : COLOR.oro, ...entra(frame, 2.6 * fps) }}>{e.pie}</div>
    </Zona>
  );
};

// --- Dados ----------------------------------------------------------------------------------------

export const Dados = ({ e }: De<"dados">) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const lanza = 0.5 * fps;
  const cae = lanza + 1 * fps;
  const rodando = frame < cae;
  const cara = (semilla: number, final: number) => (rodando ? ((Math.floor(frame / 3) * 7 + semilla) % 6) + 1 : final);
  const caida = (desde: string) => interpolate(frame, [lanza, cae], [desde, "0px 0px"], { ...fijo, easing: Easing.out(Easing.cubic) });
  const vuelta = (sentido: number) => `${interpolate(frame, [lanza, cae], [sentido * 540, 0], { ...fijo, easing: Easing.out(Easing.cubic) })}deg`;
  const suma = e.dados[0] + e.dados[1];
  const muestra = cae + 0.3 * fps;
  return (
    <Zona gap={60}>
      <div style={{ display: "flex", justifyContent: "center", ...entra(frame, 0) }}>
        <span style={{ ...titular, fontSize: 104, color: COLOR.noche, background: COLOR.oro, padding: "16px 40px", borderRadius: 24 }}>
          {e.necesita <= 2 ? "Entra seguro" : `Necesita ${e.necesita} o más`}
        </span>
      </div>
      <div style={{ display: "flex", justifyContent: "center", gap: 80, opacity: frame >= lanza ? 1 : 0 }}>
        <Dado name="Dado 1" lado={250} cara={cara(2, e.dados[0])} style={{ rotate: vuelta(-1), translate: caida("-400px -300px") }} />
        <Dado name="Dado 2" lado={250} cara={cara(5, e.dados[1])} style={{ rotate: vuelta(1), translate: caida("400px -360px") }} />
      </div>
      <div
        style={{
          ...titular,
          textAlign: "center",
          fontSize: 260,
          color: suma >= e.necesita ? COLOR.oro : COLOR.apagado,
          opacity: interpolate(frame, [muestra, muestra + 4], [0, 1], fijo),
          scale: interpolate(frame, [muestra, muestra + 0.5 * fps], [1.6, 1], { ...fijo, easing: Easing.out(Easing.back(2)) }),
        }}
      >
        = {suma}
      </div>
      {e.pie && <div style={{ ...pie, fontSize: 38, textAlign: "center", ...entra(frame, muestra + 0.4 * fps) }}>{e.pie}</div>}
    </Zona>
  );
};

// --- Resultado --------------------------------------------------------------------------------------

export const Resultado = ({ e }: De<"resultado">) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <Zona gap={70}>
      <div
        style={{
          ...titular,
          fontSize: 200,
          color: e.bien ? COLOR.oro : COLOR.lila,
          opacity: interpolate(frame, [0, 4], [0, 1], fijo),
          scale: interpolate(frame, [0, 0.5 * fps], [1.6, 1], { ...fijo, easing: Easing.out(Easing.back(2)) }),
          transformOrigin: "left center",
        }}
      >
        {e.titulo}
      </div>
      {e.equipos && e.puntos && <Marcador equipos={e.equipos} puntos={e.puntos} resalta={e.resalta} style={entra(frame, 0.4 * fps)} />}
      {e.pie && <div style={{ ...titular, fontSize: tamTitular([e.pie]) * 0.7, ...entra(frame, 0.8 * fps) }}>{e.pie}</div>}
    </Zona>
  );
};

// --- Lista: una cosa tras otra ---------------------------------------------------------------------

export const Lista = ({ e }: De<"lista">) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <Zona gap={50}>
      <div style={{ ...titular, fontSize: tamTitular([e.titulo]) * 0.75, ...entra(frame, 0) }}>{e.titulo}</div>
      {e.items.map((x, n) => (
        <div key={x.titulo} style={{ display: "flex", alignItems: "center", gap: 36, ...entra(frame, (0.6 + 1.2 * n) * fps) }}>
          {x.escudo && <Escudo name={x.escudo.nombre} id={x.escudo.id} c1={x.escudo.c1} c2={x.escudo.c2} tam={150} />}
          {x.carta && (
            <div style={{ width: 290, height: 360, flexShrink: 0 }}>
              <Carta name={x.titulo} carta={x.carta} style={{ scale: 0.63, transformOrigin: "top left" }} />
            </div>
          )}
          <div>
            <div style={{ ...titular, fontSize: 84, color: COLOR.oro }}>{x.titulo}</div>
            <div style={{ ...pie, color: COLOR.texto, fontSize: 42, marginTop: 8 }}>{x.texto}</div>
          </div>
        </div>
      ))}
    </Zona>
  );
};

// --- Una carta, revelada ------------------------------------------------------------------------------

export const UnaCarta = ({ e }: De<"carta">) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const giro = interpolate(frame, [0.3 * fps, 0.8 * fps], [90, 0], { ...fijo, easing: Easing.out(Easing.cubic) });
  return (
    <Zona gap={50}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 30, ...entra(frame, 0) }}>
        {e.rango && <span style={{ ...titular, fontSize: 200, color: COLOR.oro }}>{e.rango}</span>}
        <span style={{ ...titular, fontSize: 90 }}>{e.titulo}</span>
      </div>
      <div style={{ display: "flex", justifyContent: "center" }}>
        <Carta name="Carta" carta={e.carta} style={{ scale: 1.25, rotate: `y ${giro}deg` }} />
      </div>
      {e.pie && <div style={{ ...pie, textAlign: "center", marginTop: 80, ...entra(frame, 1 * fps) }}>{e.pie}</div>}
    </Zona>
  );
};
