# Nimbo · Reglamento v0.6

> El juego con el que se deciden los partidos de la Liga Nimbo: baloncesto 3x3 con cartas y dos dados.
> Se puede jugar en la web, con papel o dejar que el motor lo juegue con el plan de cada equipo.
> Versión de prueba: los números están para ajustarse jugando.

---

## 1. Lo esencial

- Cada equipo tiene **4 cartas**: 3 en pista y 1 suplente.
- Cada carta tiene **Ataque** y **Defensa**, del 1 al 6, y a veces un **icono**.
- Cada carta tiene **2 tiros**. Cada equipo ataca **8 veces**, por turnos.
- En cada ataque:
  - Quien ataca elige **quién tira** y, en secreto, si tira **dentro** (2 puntos) o **fuera** (3 puntos, con -2 a la tirada).
  - Quien defiende elige, en secreto, qué **cierra**: dentro o fuera.
  - Se revela, se tiran **dos dados** y se mira si entra.
- A mitad de partido, **el suplente entra obligatoriamente**.
- **Gana quien más puntos tenga tras los 8 ataques.**

Un partido son unas 16 tiradas: entre 5 y 10 minutos.

---

## 2. Las cartas

```
┌──────────────────────────┐
│ INÉS SALINAS        FER  │
│ 29 años · Ciudad Ferro   │
│                          │
│   ATAQUE 5   DEFENSA 3   │
│                          │
│   ◆ Aro            ●●    │
└──────────────────────────┘
```

**Iconos** (como mucho uno por carta):

| Icono | Efecto |
|---|---|
| **Tiro** | +1 al tirar de fuera. |
| **Aro** | +2 al tirar de dentro. |
| **Muro** | +2 al defender tiros de dentro. Contra los de fuera no suma. |

Los tres valen más o menos lo mismo que un punto de Ataque o de Defensa (medido con simulaciones). El Tiro suma menos porque el triple ya vale más.

**Fichas de tiro (●●):** cada carta empieza el partido con 2. Cada vez que tira, gasta una. Sin fichas ya no puede tirar, pero sigue defendiendo mientras esté en pista.

Edad, origen, historia y rasgos de personalidad son lore y sirven para la gestión del club (ver §7). En la pista solo cuentan Ataque, Defensa, icono y fichas.

La liga es mixta. Las cartas son solo números y el género nunca interviene en ellos.

---

## 3. Preparación

1. Cada equipo pone 3 cartas en pista y deja 1 de suplente.
2. **Duelos:** el equipo **local** empareja a sus 3 jugadores en pista con los 3 del visitante. Cada uno marca a su pareja, y su pareja le marca a su vez. Si no hay local, se sortea.
3. **El visitante ataca primero.**

Jugar en casa pesa, como en el baloncesto de verdad: con las cartas de la liga, el local gana un 59 % de los partidos. Casi toda la ventaja está en el descanso, cuando el local ya sabe a quién le quedan tiros (si solo eligiera al principio, ganaría un 51 %). Atacar primero o segundo no cambia nada (simulado en la v0.6).

---

## 4. Cada ataque

1. **Quien ataca** elige quién tira entre sus jugadores en pista que **tengan fichas**, y gasta una.
2. Los dos equipos eligen en secreto, por ejemplo con una carta boca abajo o una moneda en la mano:
   - Quien ataca: **dentro** o **fuera**.
   - Quien defiende: **cierra dentro** o **cierra fuera**.
3. Se revelan las dos elecciones y se calcula:

```
ATAQUE  = dos dados + Ataque de quien tira (+ su icono, si encaja) (-2 si tira de fuera)
DEFENSA = 5 + Defensa de quien le marca (+2 si es Muro y el tiro es de dentro) (+2 si ha cerrado lo que era)
```

4. Resultado: si ATAQUE iguala o supera a DEFENSA, entra. **Dentro vale 2** y **fuera vale 3**, pero de fuera la tirada tiene **-2**.
5. Ataca el otro equipo.

**Mates y tapones.** No cambian nada en el marcador: se cantan, se apuntan y salen en los vídeos.
- **Mate:** canasta de dentro que supera a la defensa por **6 o más**.
- **Tapón:** tiro de dentro que se queda corto por **4 o más**. Lo pone quien marcaba.

Salen unos 3 mates y unos 3 tapones por jornada. Los mates son cosa sobre todo de las cartas con Aro, y de las defensas que cierran lo que no era.

---

## 5. Descanso, tiempo muerto y final

- **Descanso:** cuando los dos equipos han hecho **4 ataques**.
  - **El suplente entra obligatoriamente**, con sus 2 fichas.
  - Sale quien tú elijas, pero **solo puede salir alguien que ya haya gastado sus 2 fichas**. Siempre habrá al menos uno: con 4 tiros entre 3 jugadores, alguien ha tenido que tirar dos veces.
  - Después, el local vuelve a decidir los duelos.
- **Tiempo muerto:** una vez por partido, cada equipo puede repetir una tirada de ataque propia que haya fallado.
- **Final:** gana quien más puntos tenga cuando los dos equipos han hecho sus **8 ataques**.
- **Muerte súbita:** si hay empate, cada equipo hace un ataque más, siguiendo el turno (empieza quien empezó el partido). Puede tirar cualquiera de pista, tenga fichas o no.
  - Si uno anota más que el otro, gana.
  - Si anotan lo mismo, gana quien haya superado a su defensa **por más**. Si fallan los dos, gana quien se haya quedado **más cerca**. Quien gana así suma **1 punto** de desempate.
  - Solo si también empatan en eso, otra ronda. Casi siempre se decide en la primera (el 94 %) y nunca pasó de 3 rondas en 5.280 partidos simulados (v0.6).
- **Mejor del partido:** más puntos anotados, más 1 por cada ataque rival que no entre estando marcado por esa persona.

---

## 6. Las decisiones que importan

- **Cuándo gastar a tu estrella.** ¿Sus dos tiros al principio, para coger ventaja, o los guardas para el final, cuando más pesan?
- **Quién sale en el descanso.** Solo sale quien ya no tiene tiros. Si tu mejor atacante defiende mal, gasta pronto sus fichas y sácalo; si defiende bien, quizá prefieras que siga en pista marcando.
- **Los duelos, si juegas en casa.** Tu mejor defensor contra su mejor tirador… pero cada duelo va en los dos sentidos: quien le para también tiene que anotarle.
- **El farol.** Cada ataque es un pulso: ¿voy a lo seguro dentro o les leo la mente y tiro de fuera?

---

## 7. Ejemplo

Los Forjadores atacan. Les marcan así: Sekou (Defensa 5, Muro) a Inés, Lucía (Defensa 4) a Finn y Gerard (Defensa 2) a Rhys.

1. Forjadores elige a **Inés** (Ataque 5, Aro, ●●), aunque la marca Sekou. Gasta una ficha (●○).
2. Forjadores elige en secreto **dentro**. Búhos, que espera que Inés vaya dentro, **cierra dentro**.
3. Salen un 6 y un 5:
   - ATAQUE: 11 + 5 + 2 (Aro, tira dentro) = **18**
   - DEFENSA: 5 + 5 + 2 (Muro) + 2 (ha cerrado dentro) = **14**
   - 18 ≥ 14: **canasta de 2** para Inés. Por 4: le faltaron 2 para que fuera mate.

Si Búhos hubiera cerrado fuera, la defensa habría sido 12. Y si Forjadores hubiera tirado de fuera, Inés perdía el +2 de Aro y tenía el -2 de fuera (11 + 5 - 2 = 14), pero la defensa bajaba mucho más: el Muro de Sekou no cuenta contra los triples y Búhos había cerrado dentro, así que la defensa era 10. 14 ≥ 10: **triple.**

---

## 8. Fuera de la pista: el verano Nimbo

Al acabar las Finales llega el verano. Se hace en este orden y todo se puede resolver con un dado.

### 8.1 Presupuesto
Cada club ingresa **11**, +1 si su mercado es mediano o +2 si es grande, y **+1 por cada ronda de playoffs que gane**. A eso se suma lo que ahorró el verano anterior.

### 8.2 Evolución
Cada carta tira **un dado**:

| Edad | Resultado |
|---|---|
| **Joven (23 o menos)** | 5-6: **+1**. 7 o más (con bonus): **+2** |
| **Plenitud (24-29)** | 1-2: **−1**. 6 o más: **+1** |
| **Veterana (30 o más)** | 1-3: **−1** (desde los 33, 1-4) |

- Bonus al dado: *Esfuerzo* +1. Las jóvenes suman además +1 por cada nivel de **entrenamiento** de su club y +1 si en su equipo hay una carta con *Veteranía*.
- El club reparte los puntos entre Ataque y Defensa (ninguno pasa de 6 ni baja de 2).
- **Techo:** cada carta tiene un **techo**, a la vista de todos: lo máximo que pueden llegar a sumar su Ataque y su Defensa. Ninguna carta pasa de **10**. Las jóvenes suelen tener margen para crecer; las demás casi siempre están ya en su techo.
- Después, todas cumplen un año.

### 8.3 Retiradas
Desde los **34 años**, una carta se retira si saca **1 o 2**. Las cartas libres de 31 o más que nadie ha fichado también dejan el baloncesto.

### 8.4 Contratos
- Cada carta tiene contrato de 1 a 3 temporadas. Su **sueldo (de 1 a 5)** depende de su valor (Ataque + Defensa + 1 si tiene icono): hasta 6, 1; 7, 2; 8, 3; 9, 4; 10 o más, 5. **El sueldo no cambia mientras dura el contrato.**
- Al acabar el contrato, el club **renueva** (con el sueldo que corresponda a su valor de ahora) o **la deja libre**.
- *Corazón del club* renueva cobrando 1 menos. *A sueldo* se marcha si su equipo no ha jugado playoffs.

### 8.5 Draft
- **12 promesas** de 19 a 21 años. Se ve todo: Ataque, Defensa y techo.
- Elige primero el **último** de la liga regular, y así hasta el primero.
- La promesa elegida entra siempre en la plantilla.

### 8.6 Ojeo
- Los **ojeadores** encuentran promesas que no han pasado por el draft: **una por cada nivel** (nivel 1, una; nivel 3, tres).
- El club puede fichar **una** de ellas con **sueldo 1**, sea cual sea su valor, y contrato de 3 temporadas. Es la forma barata de conseguir talento joven.
- La que ficha compite por una plaza como las demás; las que no, se quedan fuera de la liga.

### 8.7 Plantilla y agencia libre
- Cada club se queda con **4 cartas** cuyos sueldos quepan en su presupuesto. Las que no entran, a la **agencia libre**.
- En orden inverso a la clasificación, cada club puede fichar una carta libre si le cabe en el presupuesto, o cambiarla por su peor carta.
- Si a un club le falta alguien, sube una carta de su **cantera** (valor 5, sueldo 1).

### 8.8 Instalaciones
Lo que sobra del presupuesto se invierte (**3 por nivel**, hasta nivel 3) o se ahorra (**como mucho 3**):
- **Ojeadores:** cada nivel descubre una promesa más en el ojeo (§8.6).
- **Centro de entrenamiento:** +1 al dado de evolución de las cartas jóvenes por nivel.

El dilema de cada verano: estrellas hoy o estructura para mañana.

### 8.9 Quién decide
Mientras no haya dirección deportiva elegida por la afición, las decisiones las toma la Oficina de la Liga según la filosofía de cada franquicia. Las aficiones que desbloqueen su dirección deportiva podrán decidir renovaciones, draft y fichajes.

---

## 9. Partidos oficiales de la liga

Antes de cada Noche Nimbo, la dirección deportiva de cada franquicia entrega un **plan de partido** corto:
- Quiénes empiezan y quién sale en el descanso.
- Los duelos, si juega en casa.
- La preferencia de tiro: cuánto ir dentro o fuera y en qué orden gastar los tiros.
- Qué suele cerrar en defensa.

Cada franquicia tiene además sus **manías**, que salen de su carácter y se ven en su ficha:
- **Estilo:** la parte de sus tiros que van de fuera (Vendaval, un 70 %; Búhos, un 35 %), o ninguno, y entonces tira lo que pidan las cartas.
- **Firma:** lo que hace siempre en el **final apretado** (sus dos últimos ataques con el marcador a 3 puntos o menos, y la muerte súbita). Por ejemplo: Vendaval tira siempre de 3; Lobos cierra siempre dentro; en Coronas, el último tiro es para la estrella.

Los rivales no las aprenden: están para que se vean y se cuenten. Ninguna cambia más de 3 puntos el porcentaje de victorias de su equipo (simulado en la v0.6), y cada equipo hace de media 1,3 ataques por partido en final apretado, así que casi siempre se ven.

El motor juega el partido con el plan y estas reglas, con una semilla pública para que cualquiera pueda comprobarlo. El **partido estelar** de la semana se puede jugar en directo entre las dos direcciones deportivas, con las tiradas en stories.

---

## 10. Equipos de prueba

Para jugar en papel con dos dados y algo para marcar las fichas.

### Forjadores de Ciudad Ferro

| Jugador | Edad | Ataque | Defensa | Icono |
|---|---|---|---|---|
| Inés Salinas | 29 | 5 | 3 | Aro |
| Finn Ivanov | 29 | 4 | 3 | Tiro |
| Rhys Ashworth | 32 | 2 | 5 | Muro |
| Leo Lozano *(suplente)* | 21 | 3 | 3 | — |

### Búhos de Valdelaluna

| Jugador | Edad | Ataque | Defensa | Icono |
|---|---|---|---|---|
| Gerard Ibarra | 30 | 5 | 2 | Tiro |
| Lucía Domínguez | 26 | 4 | 4 | — |
| Sekou Ortega | 24 | 2 | 5 | Muro |
| Maite Pacheco *(suplente)* | 34 | 3 | 3 | Aro |

---

## 11. Lo que dice la simulación y lo que falta comprobar

Miles de partidos simulados con las cartas de la liga y la IA del motor:
- Unas **16 tiradas por partido**, con un margen medio de unos 4 puntos.
- **La mitad de los partidos se deciden por 3 puntos o menos**. Marcadores típicos: 11-10, 14-12, 10-8.
- Las 4 cartas de cada equipo juegan siempre, y cada equipo hace un cambio por partido.

Lo que hay que comprobar jugando de verdad:
- Que el farol de dentro o fuera sea divertido y no puro azar.
- Que la gestión de las fichas haga pensar sin agobiar.
- Que los iconos estén equilibrados entre sí. En la v0.3 valían +2 y pesaban demasiado (un Tiro valía como 2,5 puntos de Ataque); en la v0.3.1 se han rebajado y entre los dos equipos de prueba el reparto ha pasado del 63-74% al 51%.
- Que la duración se quede en 5-10 minutos.
