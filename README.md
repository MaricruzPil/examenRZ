# REACTOR ZERO

## 1.6 Examen Tema 1. Introducción a las interfaces 3D y experiencia de usuario

**Tecnológico Nacional de México campus Pachuca**  
**Ingeniería en Tecnologías de la Información y Comunicaciones**  
**Desarrollo de soluciones en ambientes virtuales**

**Docente:** M.C. Víctor Manuel Pinedo Fernández  
**Alumno(a):** __________________________________________  
**Número de matrícula:** _________________________________  
**Fecha:** ______________________________________________  

---

## Tema

**Tema 1. Introducción a las interfaces 3D y experiencia de usuario**

---

## Descripción del proyecto

**Reactor Zero** es un videojuego 3D desarrollado como parte del examen del Tema 1 de la asignatura **Desarrollo de Soluciones en Ambientes Virtuales**.

El jugador controla a **R-0**, una unidad robótica enviada a una instalación tecnológica automatizada que ha sufrido una falla crítica.

La misión de R-0 consiste en recuperar los sistemas principales de la instalación y avanzar a través de sus diferentes sectores antes de que el reactor central colapse.

El proyecto integra navegación en un entorno tridimensional, animaciones de personaje, interacción con objetos, físicas, mecánicas de ataque a distancia, objetivos, condiciones de victoria y derrota, así como una interfaz de usuario que proporciona información sobre el estado de la misión.

---

## Historia

Una instalación tecnológica automatizada ha sufrido una falla crítica y sus sistemas principales han dejado de funcionar.

Como consecuencia del incidente, diferentes sectores de la instalación presentan fallas de energía y anomalías que impiden recuperar el control del complejo.

La unidad robótica **R-0** es enviada a la instalación con el objetivo de restaurar sus sistemas esenciales y llegar al reactor central.

La misión se divide en tres sectores principales:

1. **Fábrica** — Restaurar los generadores auxiliares.
2. **Laboratorio** — Localizar y destruir los núcleos de energía inestables.
3. **Reactor Zero** — Desactivar los soportes del reactor y escapar de la instalación.

---

# Nivel 1 — Fábrica

El primer nivel se desarrolla en el sector industrial de la instalación.

El objetivo principal consiste en restaurar el suministro energético mediante la activación de tres generadores.

Los generadores deben ser activados siguiendo el orden:

```text
GENERATOR 01
     ↓
GENERATOR 02
     ↓
Destruir anomalía
     ↓
GENERATOR 03
```

Durante la misión, R-0 debe desplazarse por la fábrica, interactuar con los sistemas de la instalación, evitar perder toda su energía y destruir una anomalía energética que bloquea el acceso al último generador.

Una vez restaurados los tres generadores, el suministro energético del sector se estabiliza y se habilita el acceso al laboratorio.

---

## Objetivo del Nivel 1

Restaurar los tres generadores de la fábrica antes de que termine el tiempo disponible o la energía de R-0 llegue a cero.

El tercer generador permanece bloqueado mientras la anomalía energética se encuentre activa.

Para completar el nivel se debe seguir la secuencia:

```text
Generator 01
     ↓
Generator 02
     ↓
Destruir anomalía energética
     ↓
Generator 03
     ↓
ENERGÍA RESTAURADA
```

Al completar los tres objetivos, el sistema muestra:

```text
POWER GRID RESTORED

ENERGÍA RESTAURADA

03 / 03 OBJECTIVES COMPLETE

FACILITY POWER // STABLE

ACCESO AL LABORATORIO HABILITADO
```

---

# Controles

| Control | Acción |
|---|---|
| `W` | Avanzar |
| `A` | Moverse a la izquierda |
| `S` | Retroceder |
| `D` | Moverse a la derecha |
| `Shift` | Correr |
| `Mouse` | Control de cámara |
| `E` | Interactuar / activar generadores |
| `F` | Disparar pulso de energía |

---

# Mecánicas implementadas

El Nivel 1 integra diferentes mecánicas de interacción y gameplay.

### Movimiento

R-0 puede desplazarse por el escenario utilizando las teclas `W`, `A`, `S` y `D`.

También puede correr manteniendo presionada la tecla `Shift`.

### Cámara en tercera persona

La cámara sigue al personaje y permite observar el entorno desde una perspectiva en tercera persona.

El jugador puede modificar la orientación de la cámara utilizando el mouse.

### Animaciones

R-0 cuenta con diferentes estados de animación:

- Idle
- Walk
- Run
- Attack

Las animaciones cambian dependiendo de las acciones realizadas por el jugador.

### Interacción

La tecla `E` permite interactuar con los generadores.

Cuando R-0 se encuentra suficientemente cerca de un generador disponible, aparece en pantalla el indicador:

```text
[E]

INTERACTUAR
ACTIVAR GENERADOR
```

### Orden de activación

Los generadores deben activarse siguiendo una secuencia obligatoria:

```text
01 → 02 → 03
```

Un generador no puede ser activado si el generador anterior todavía no ha sido restaurado.

### Pulso de energía

R-0 puede utilizar un ataque de energía mediante la tecla:

```text
F
```

El ataque genera un pulso que se desplaza hacia adelante.

Este pulso puede interactuar con objetos físicos del escenario y con la anomalía energética.

### Anomalía energética

El Nivel 1 contiene una anomalía energética que bloquea el acceso al Generator 03.

La anomalía debe recibir varios impactos del pulso de energía antes de ser destruida.

Al destruirla:

```text
ANOMALÍA DESTRUIDA
        ↓
GENERATOR 03 DESBLOQUEADO
```

### Daño ambiental

La anomalía genera una zona peligrosa.

Si R-0 permanece demasiado cerca de ella, pierde energía progresivamente.

### Objetos físicos

El escenario contiene objetos dinámicos como:

- Cajas.
- Barriles.

Estos objetos utilizan físicas y pueden ser desplazados por R-0 o recibir impactos del pulso de energía.

---

# Sistema de energía

R-0 comienza la misión con:

```text
100% ENERGÍA
```

La energía puede disminuir al permanecer cerca de la anomalía energética.

El HUD muestra visualmente el porcentaje restante mediante una barra de energía.

Si la energía llega a:

```text
0%
```

la misión termina y aparece:

```text
SYSTEM FAILURE

ENERGÍA AGOTADA

La unidad R-0 ha perdido toda la energía.

MISSION STATUS // FAILED
```

---

# Temporizador

El Nivel 1 cuenta con un límite de tiempo.

El jugador dispone inicialmente de:

```text
02:00
```

para completar los objetivos.

El tiempo restante aparece permanentemente en el HUD.

Si el temporizador llega a:

```text
00:00
```

antes de completar los tres generadores, la misión termina y aparece:

```text
SYSTEM FAILURE

TIEMPO AGOTADO

El protocolo de recuperación no se completó a tiempo.

MISSION STATUS // FAILED
```

---

# Parámetro configurable

El tiempo disponible para completar el nivel está definido mediante un parámetro configurable dentro del código:

```js
const LEVEL_TIME_LIMIT = 120;
```

El valor representa el tiempo disponible en segundos.

Por ejemplo:

```js
const LEVEL_TIME_LIMIT = 90;
```

establece un límite de:

```text
01:30
```

Modificar este parámetro afecta directamente la dificultad del nivel, ya que determina cuánto tiempo tiene el jugador para completar los objetivos.

---

# HUD

La interfaz de usuario muestra información relevante sobre el estado actual de la partida.

El HUD contiene los siguientes módulos:

```text
01  SECTOR / NIVEL

02  OBJETIVOS

03  NÚCLEO DE ENERGÍA

04  PUNTUACIÓN

05  TIEMPO RESTANTE
```

Durante la partida, estos elementos permiten conocer el progreso de la misión y el estado de R-0.

---

# Sistema de físicas

El proyecto utiliza un sistema de físicas para gestionar colisiones e interacción con objetos del escenario.

Las físicas permiten:

- Evitar que R-0 atraviese las paredes.
- Detectar colisiones con el escenario.
- Desplazar cajas.
- Desplazar y derribar barriles.
- Interactuar con objetos dinámicos.
- Aplicar impulsos mediante el pulso de energía.

---

# Condiciones de victoria

El Nivel 1 se completa cuando:

```text
Generator 01 = ONLINE
Generator 02 = ONLINE
Generator 03 = ONLINE
```

Al alcanzar:

```text
03 / 03
```

el suministro energético de la fábrica queda restaurado.

El sistema muestra la pantalla:

```text
POWER GRID RESTORED

ENERGÍA RESTAURADA

FACILITY POWER // STABLE

ACCESO AL LABORATORIO HABILITADO
```

---

# Condiciones de derrota

Actualmente existen dos condiciones principales de derrota.

## Energía agotada

Ocurre cuando:

```text
ENERGÍA R-0 = 0%
```

## Tiempo agotado

Ocurre cuando:

```text
TIEMPO RESTANTE = 00:00
```

En ambos casos se detiene el gameplay y aparece la pantalla:

```text
SYSTEM FAILURE
MISSION STATUS // FAILED
```

El jugador puede utilizar la opción:

```text
REINICIAR MISIÓN
```

para comenzar nuevamente el nivel.

---

# Reinicio de misión

Cuando el jugador pierde, puede reiniciar completamente la partida.

El reinicio restaura:

```text
ENERGÍA       100%
OBJETIVOS     0 / 3
TIEMPO        02:00
ANOMALÍA      ACTIVA
GENERATOR 03  BLOQUEADO
R-0           POSICIÓN INICIAL
```

Esto permite comenzar nuevamente la misión desde su estado original.

---

# Tecnologías utilizadas

El proyecto utiliza las siguientes tecnologías y herramientas:

- HTML5
- CSS3
- JavaScript
- Three.js
- Rapier
- GLTF / GLB
- FBX
- Visual Studio Code
- Git
- GitHub

---

# Estructura general del proyecto

```text
reactor-zero/
│
├── index.html
├── README.md
│
└── assets/
    │
    ├── css/
    │   └── styles.css
    │
    ├── js/
    │   ├── main.js
    │   ├── game.js
    │   ├── player.js
    │   ├── physics.js
    │   ├── levels.js
    │   └── ui.js
    │
    ├── models/
    │   ├── character/
    │   ├── environment/
    │   ├── props/
    │   ├── decoration/
    │   └── anomaly/
    │
    ├── textures/
    │
    └── sounds/
```

---

# Créditos de assets externos

Este proyecto utiliza recursos externos para algunos modelos 3D y animaciones.

Los recursos pertenecen a sus respectivos autores y se utilizan de acuerdo con sus licencias correspondientes.

---

## Sci-Fi Energy Orb

Modelo 3D utilizado como anomalía energética en el Nivel 1.

- **Modelo:** Sci-Fi Energy Orb
- **Autor:** Bim44
- **Fuente:** https://sketchfab.com/3d-models/sci-fi-energy-orb-eaaf2a000a5a4b8a9219a1de1c900e61
- **Perfil del autor:** https://sketchfab.com/Bim44
- **Licencia:** CC BY 4.0
- **Licencia oficial:** http://creativecommons.org/licenses/by/4.0/

This work is based on "Sci-Fi Energy Orb" by Bim44, licensed under CC BY 4.0.

El archivo original de licencia también se conserva dentro del proyecto en:

```text
assets/models/anomaly/license.txt
```

---

## Quaternius — Modular Sci-Fi MegaKit

Assets utilizados para la construcción y ambientación de la instalación industrial.

Entre los elementos utilizados se encuentran estructuras y objetos de ambientación de ciencia ficción.

- **Autor:** Quaternius
- **Asset:** Modular Sci-Fi MegaKit
- **Licencia:** CC0
- **Fuente:** PENDIENTE DE AGREGAR

> Antes de la entrega final se agregará aquí la URL oficial desde la que se obtuvo el paquete.

---

## Personaje R-0 y animaciones

El personaje utilizado para representar a R-0 y sus animaciones fueron preparados utilizando recursos de Mixamo.

Animaciones utilizadas:

- Idle
- Walk
- Run
- Attack

**Procedencia:** Mixamo

> Antes de la entrega final se revisarán y agregarán los datos correspondientes de procedencia y uso de estos recursos.

---

# Estado del desarrollo

## Nivel 1 — Fábrica

**Estado: FUNCIONAL**

Actualmente incluye:

- Escenario industrial 3D.
- Personaje R-0.
- Movimiento.
- Cámara en tercera persona.
- Animaciones.
- Sistema de físicas.
- Colisiones.
- Objetos dinámicos.
- Cajas físicas.
- Barriles físicos.
- Generadores interactivos.
- Secuencia obligatoria de generadores.
- Indicadores de interacción.
- Pulso de energía.
- Interacción física del pulso.
- Anomalía energética.
- Sistema de daño.
- Sistema de energía.
- HUD.
- Temporizador.
- Parámetro configurable de tiempo.
- Condición de victoria.
- Derrota por energía.
- Derrota por tiempo.
- Reinicio de misión.
- Pantalla de inicio.
- Pantalla de nivel completado.

---

## Nivel 2 — Laboratorio

**Estado: PENDIENTE DE DESARROLLO**

Objetivo planeado:

```text
LOCALIZAR Y DESTRUIR
5 NÚCLEOS DE ENERGÍA INESTABLES
```

---

## Nivel 3 — Reactor Zero

**Estado: PENDIENTE DE DESARROLLO**

Objetivo planeado:

```text
DESTRUIR LOS SOPORTES DEL REACTOR
Y ESCAPAR DE LA INSTALACIÓN
```

---

# Información académica

**Tecnológico Nacional de México campus Pachuca**

**Ingeniería en Tecnologías de la Información y Comunicaciones**

**Asignatura:** Desarrollo de soluciones en ambientes virtuales

**Docente:** M.C. Víctor Manuel Pinedo Fernández

**Actividad:** 1.6 Examen Tema 1. Introducción a las interfaces 3D y experiencia de usuario

**Tema:** Tema 1. Introducción a las interfaces 3D y experiencia de usuario

---

# Datos del alumno

**Nombre:** MARICRUZ PINEDA LARA



**Fecha:** SEPTIEMBRE 2026

---

# Proyecto académico

**Reactor Zero** fue desarrollado como proyecto académico para la asignatura **Desarrollo de Soluciones en Ambientes Virtuales**, correspondiente a la actividad:

**1.6 Examen Tema 1. Introducción a las interfaces 3D y experiencia de usuario.**

Tecnológico Nacional de México campus Pachuca.