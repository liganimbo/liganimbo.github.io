// Una escena por tipo (ver tipos.ts). Todas se colocan en la zona que no tapa Instagram.
import type React from "react";
import { Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { Carta, Dado, Escudo } from "../elementos";
import { COLOR, texto, TIRO } from "../marca";
import { color, Eleccion, entra, etiqueta, finEntrada, fijo, Marcador, pie, tamTitular, titular, Zona } from "./comun";
import type { Escena, Tipo } from "./tipos";

type De<T extends Escena["tipo"]> = { e: Extract<Escena, { tipo: T }> };

// --- Titular ---------------------------------------------------------------------------------

/** Cuándo entra cada parte de un titular (en segundos). */
const tiemposTitular = (e: Extract<Escena, { tipo: "titular" }>) => {
  const lineas = e.lineas.map((_, n) => 0.3 + 0.4 * n);
  return { lineas, pie: lineas[lineas.length - 1] + 0.6 };
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
        Si cierras lo que tira, su defensa suma <span style={{ color: COLOR.texto, fontWeight: 700 }}>+2</span>. De fuera, la tirada tiene{" "}
        <span style={{ color: COLOR.texto, fontWeight: 700 }}>-2</span>.
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

// --- Revela: qué tiró y qué cerraron, y la defensa total -----------------------------------------

/** Una línea de la cuenta: qué es, de dónde sale y cuánto da. */
const LineaCuenta = ({ que, suma, da, colorDa, desde }: { que: string; suma: string; da: string; colorDa: string; desde: number }) => {
  const frame = useCurrentFrame();
  return (
    <div style={{ display: "grid", gridTemplateColumns: "250px 1fr auto", alignItems: "center", gap: 24, ...entra(frame, desde) }}>
      <span style={{ ...etiqueta, fontSize: 30, letterSpacing: 4, color: COLOR.apagado }}>{que}</span>
      <span style={{ fontFamily: texto, fontWeight: 500, fontSize: 38, lineHeight: 1.25, color: COLOR.texto }}>{suma}</span>
      <span style={{ ...titular, fontSize: 96, color: colorDa }}>{da}</span>
    </div>
  );
};

export const Revela = ({ e }: De<"revela">) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const acierta = e.tira.tipo === e.cierra.tipo;
  const c = e.cuenta;
  const defensa = [`${c.base}`, `${c.defensa} de ${c.defensor}`, c.muro ? `${c.muro} de Muro` : "", c.cierre ? `${c.cierre} por acertar` : ""].filter(Boolean).join(" + ");
  return (
    <Zona gap={36}>
      <div style={{ ...titular, fontSize: 96, ...entra(frame, 0) }}>{e.titulo}</div>
      <div style={{ display: "flex", justifyContent: "center", gap: 40, height: 400 }}>
        <div style={{ scale: 0.68, transformOrigin: "top center" }}>
          <Eleccion quien={e.tira.quien} tipo={e.tira.tipo} gira={0.8 * fps} />
        </div>
        <div style={{ scale: 0.68, transformOrigin: "top center" }}>
          <Eleccion quien={e.cierra.quien} tipo={e.cierra.tipo} gira={2 * fps} />
        </div>
      </div>
      <div style={{ ...titular, textAlign: "center", fontSize: 80, color: acierta ? COLOR.lila : COLOR.oro, ...entra(frame, 2.7 * fps) }}>{e.pie}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 22, marginTop: 10 }}>
        <LineaCuenta que="Defensa" suma={defensa} da={`${c.total}`} colorDa={COLOR.lila} desde={4 * fps} />
      </div>
    </Zona>
  );
};

// --- Dados: la defensa arriba; ruedan, se para uno, luego el otro, y el ataque total -----------------

export const Dados = ({ e }: De<"dados">) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = e.tirada;
  const lanza = 0.6 * fps;
  const para = [2.4 * fps, 3.2 * fps];
  const cara = (n: number, semilla: number) => (frame < para[n] ? ((Math.floor(frame / 3) * 7 + semilla) % 6) + 1 : e.dados[n]);
  const caida = (n: number, desde: string) => interpolate(frame, [lanza, para[n]], [desde, "0px 0px"], { ...fijo, easing: Easing.out(Easing.cubic) });
  const vuelta = (n: number, sentido: number) => `${interpolate(frame, [lanza, para[n]], [sentido * 900, 0], { ...fijo, easing: Easing.out(Easing.cubic) })}deg`;
  const golpe = (n: number) => interpolate(frame, [para[n], para[n] + 4, para[n] + 10], [1, 1.12, 1], fijo);
  const muestra = para[1] + 0.5 * fps;
  const suma = [`${e.dados[0]} + ${e.dados[1]}`, `${t.ataque} de ${t.tirador}`, t.bonus ? `${t.bonus} de ${t.icono}` : ""].filter(Boolean).join(" + ") + (t.castigo ? ` - ${t.castigo} de fuera` : "");
  const caja = (que: string, valor: string, fondo: string, tinta: string, estilo: React.CSSProperties = {}) => (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 36px", borderRadius: 28, background: fondo, ...estilo }}>
      <span style={{ ...etiqueta, fontSize: 34, color: tinta }}>{que}</span>
      <span style={{ ...titular, fontSize: 130, color: tinta }}>{valor}</span>
    </div>
  );
  return (
    <Zona gap={50}>
      <div style={entra(frame, 0)}>
        {t.defensa !== undefined && caja("Defensa", `${t.defensa}`, COLOR.lila, COLOR.noche)}
      </div>
      <div style={{ display: "flex", justifyContent: "center", gap: 80, opacity: frame >= lanza ? 1 : 0 }}>
        <Dado name="Dado 1" lado={240} cara={cara(0, 2)} style={{ rotate: vuelta(0, -1), translate: caida(0, "-400px -300px"), scale: golpe(0) }} />
        <Dado name="Dado 2" lado={240} cara={cara(1, 5)} style={{ rotate: vuelta(1, 1), translate: caida(1, "400px -360px"), scale: golpe(1) }} />
      </div>
      <div
        style={{
          opacity: interpolate(frame, [muestra, muestra + 4], [0, 1], fijo),
          scale: interpolate(frame, [muestra, muestra + 0.5 * fps], [1.25, 1], { ...fijo, easing: Easing.out(Easing.back(2)) }),
        }}
      >
        {caja("Ataque", `${t.total}`, t.anota !== false ? COLOR.oro : "#2a2d48", t.anota !== false ? COLOR.noche : COLOR.texto)}
        <div style={{ ...pie, fontSize: 38, color: COLOR.texto, marginTop: 14 }}>{suma}</div>
      </div>
      {t.defensa !== undefined && (
        <div style={{ ...titular, textAlign: "center", fontSize: 92, color: t.anota ? COLOR.oro : COLOR.lila, ...entra(frame, muestra + 0.8 * fps) }}>
          {t.total} contra {t.defensa}: {t.anota ? "¡llega!" : "no llega"}
        </div>
      )}
      {e.pie && <div style={{ ...pie, fontSize: 38, textAlign: "center", ...entra(frame, muestra + 1.3 * fps) }}>{e.pie}</div>}
    </Zona>
  );
};

// --- Tira: solo se gira la carta de quien ataca --------------------------------------------------

export const Tira = ({ e }: De<"tira">) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <Zona gap={50}>
      <div style={{ ...titular, fontSize: 110, ...entra(frame, 0) }}>{e.titulo}</div>
      <div style={{ display: "flex", justifyContent: "center" }}>
        <Eleccion quien={e.quien} tipo={e.tiro} gira={0.8 * fps} />
      </div>
      <div style={{ ...titular, textAlign: "center", fontSize: 72, color: COLOR.texto, ...entra(frame, 1.4 * fps) }}>{e.pie}</div>
    </Zona>
  );
};

// --- Cierres: con los mismos dados, qué pasaba cerrando dentro y cerrando fuera -------------------

export const Cierres = ({ e }: De<"cierres">) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <Zona gap={44}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", ...entra(frame, 0) }}>
        <span style={{ ...titular, fontSize: 110 }}>{e.titulo}</span>
        <span style={{ ...etiqueta, color: COLOR.oro }}>
          Ataque <span style={{ ...titular, fontSize: 96, letterSpacing: 0 }}>{e.ataque}</span>
        </span>
      </div>
      {e.filas.map((f, n) => {
        const desde = (0.6 + 3.2 * n) * fps;
        const { c1, c2 } = TIRO[f.cierra];
        return (
          <div
            key={f.cierra}
            style={{ borderRadius: 34, padding: "30px 36px", display: "flex", flexDirection: "column", gap: 14, background: "rgb(255 255 255 / 6%)", border: `5px solid ${c1}`, ...entra(frame, desde) }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ ...etiqueta, color: COLOR.texto }}>
                Si cierras{" "}
                <span style={{ padding: "4px 18px", borderRadius: 14, background: `linear-gradient(135deg, ${c1}, ${c2})` }}>{f.cierra}</span>
              </span>
              <span style={{ ...titular, fontSize: 80, color: COLOR.lila }}>{f.defensa}</span>
            </div>
            <div style={{ ...pie, fontSize: 36, color: COLOR.apagado }}>Defensa: {f.suma}</div>
            <div style={{ ...titular, fontSize: 64, color: f.anota ? COLOR.oro : COLOR.lila, ...entra(frame, desde + 1.2 * fps) }}>
              {e.ataque} contra {f.defensa}. {f.pie}
            </div>
          </div>
        );
      })}
    </Zona>
  );
};

// --- Tiros: el partido ataque a ataque, con el marcador arriba ----------------------------------------

/** Cuántas líneas se ven a la vez: la nueva entra abajo y la más vieja se va por arriba. */
const LINEAS = 5;
const ALTO_LINEA = 128;

export const Tiros = ({ e }: De<"tiros">) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const paso = e.porTiro * fps;
  // Cuántos tiros han salido ya (el primero, nada más empezar) y cuánto lleva el último en pantalla.
  const salidos = Math.min(e.tiros.length, Math.floor(frame / paso) + 1);
  const dentro = frame - (salidos - 1) * paso;
  const ultimo = e.tiros[salidos - 1];
  // El marcador cambia cuando se paran los dados.
  const resuelto = dentro >= 0.6 * fps;
  const puntos = resuelto ? ultimo.marcador : salidos > 1 ? e.tiros[salidos - 2].marcador : e.inicio;
  const desde = Math.max(0, salidos - LINEAS);
  const subida = interpolate(dentro, [0, 10], [ALTO_LINEA, 0], { ...fijo, easing: Easing.out(Easing.cubic) });
  return (
    <Zona gap={40}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
        <span style={{ ...titular, fontSize: 84 }}>{e.titulo}</span>
        <span style={{ ...etiqueta, color: COLOR.apagado }}>
          Ataque {Math.ceil(salidos / 2)}
        </span>
      </div>
      <Marcador equipos={e.equipos} puntos={puntos} tam={0.62} />
      <div style={{ position: "relative", height: LINEAS * ALTO_LINEA, overflow: "hidden" }}>
        <div style={{ position: "absolute", left: 0, right: 0, ...(salidos > LINEAS ? { bottom: 0 } : { top: 0 }), translate: `0px ${salidos > LINEAS ? subida : 0}px` }}>
          {e.tiros.slice(salidos > LINEAS ? desde - 1 : desde, salidos).map((t, n, lista) => {
            const nuevo = n === lista.length - 1;
            const edad = lista.length - 1 - n;
            const eq = e.equipos[t.equipo];
            const { c1, c2 } = TIRO[t.tipo];
            const ve = !nuevo || resuelto;
            return (
              <div
                key={`${desde}-${n}-${t.tirador}`}
                style={{
                  height: ALTO_LINEA,
                  display: "grid",
                  gridTemplateColumns: "64px 1fr 190px 150px 150px",
                  alignItems: "center",
                  gap: 18,
                  opacity: nuevo ? interpolate(dentro, [0, 6], [0, 1], fijo) : Math.max(0.35, 1 - edad * 0.16),
                }}
              >
                <Escudo name={`Escudo ${n}`} id={eq.id} c1={eq.c1} c2={eq.c2} tam={60} />
                <span style={{ ...titular, fontSize: 58, textTransform: "none", whiteSpace: "nowrap", overflow: "hidden" }}>{t.tirador}</span>
                <span style={{ ...etiqueta, fontSize: 30, letterSpacing: 3, color: COLOR.texto, textAlign: "center", padding: "10px 0", borderRadius: 14, background: `linear-gradient(135deg, ${c1}, ${c2})` }}>
                  {t.tipo}
                </span>
                <span style={{ display: "flex", gap: 12 }}>
                  {t.dados.map((d, k) => (
                    <Dado key={k} name={`Dado ${n}-${k}`} lado={62} cara={nuevo && !resuelto ? ((Math.floor(frame / 3) + k * 2) % 6) + 1 : d} />
                  ))}
                </span>
                <span style={{ ...titular, fontSize: t.anota ? 72 : 48, textAlign: "right", color: t.anota ? COLOR.oro : COLOR.apagado, opacity: ve ? 1 : 0 }}>
                  {t.anota ? `+${t.puntos}` : "Falla"}
                  {(t.mate || t.tapon || t.tiempoMuerto) && (
                    <div style={{ ...etiqueta, fontSize: 22, letterSpacing: 2, color: t.mate ? COLOR.oro : COLOR.lila }}>{t.mate ? "Mate" : t.tapon ? "Tapón" : "Tras t. muerto"}</div>
                  )}
                </span>
              </div>
            );
          })}
        </div>
      </div>
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
