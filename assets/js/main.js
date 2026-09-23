import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { FBXLoader } from "three/addons/loaders/FBXLoader.js";

/* ===============================
   ESCENA
================================ */

const scene = new THREE.Scene();
const loader = new GLTFLoader();
const fbxLoader = new FBXLoader();
const clock = new THREE.Clock();
let r0Mixer = null;
let r0 = null;
let currentR0Action = null;
let isR0Attacking = false;
const r0Actions = {};
const r0Keys = {
    w: false,
    a: false,
    s: false,
    d: false,
    shift: false,
    f: false
};
const r0MoveDirection = new THREE.Vector3();
const r0WalkSpeed = 3;
const r0RunSpeed = 6;

scene.background = new THREE.Color(0x101820);


/* ===============================
   CÁMARA
================================ */

const camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);

camera.position.set(8, 6, 10);


/* ===============================
   RENDERER
================================ */

const renderer = new THREE.WebGLRenderer({
    antialias: true
});

renderer.setSize(
    window.innerWidth,
    window.innerHeight
);

renderer.setPixelRatio(
    Math.min(window.devicePixelRatio, 2)
);

renderer.shadowMap.enabled = true;

document
    .getElementById("game-container")
    .appendChild(renderer.domElement);


/* ===============================
   ILUMINACIÓN
================================ */

const ambientLight = new THREE.AmbientLight(
    0xffffff,
    1.5
);

scene.add(ambientLight);


const directionalLight =
    new THREE.DirectionalLight(
        0xffffff,
        3
    );

directionalLight.position.set(
    5,
    10,
    5
);

directionalLight.castShadow = true;

scene.add(directionalLight);


/* ===============================
   PISO TEMPORAL
================================ */

const floorGeometry =
    new THREE.PlaneGeometry(
        30,
        30
    );

const floorMaterial =
    new THREE.MeshStandardMaterial({
        color: 0x303840,
        roughness: 0.8
    });

const floor =
    new THREE.Mesh(
        floorGeometry,
        floorMaterial
    );

floor.rotation.x = -Math.PI / 2;

floor.receiveShadow = true;

scene.add(floor);

/* ===============================
   PRUEBA MODELO GLTF
================================ */

/* ===============================
   PISO MODULAR - NIVEL 1
================================ */

loader.load(
    "./assets/models/environment/level1/platforms/Platform_Metal.gltf",

    function (gltf) {

        const platformOriginal = gltf.scene;

        platformOriginal.traverse((child) => {

            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }

        });

        // Crear una cuadrícula de plataformas
        const floorGroup = new THREE.Group();

        for (let x = -3; x <= 3; x++) {

            for (let z = -2; z <= 2; z++) {

                const platform =
                    platformOriginal.clone(true);

                platform.position.set(
                    x * 4,
                    0.05,
                    z * 4
                );

                floorGroup.add(platform);
            }
        }

        scene.add(floorGroup);

        console.log(
            "Piso modular del Nivel 1 cargado correctamente"
        );
    },

    undefined,

    function (error) {

        console.error(
            "Error cargando el piso modular:",
            error
        );

    }
);
/* ===============================
   PARED DEL FONDO - NIVEL 1
================================ */

loader.load(
    "./assets/models/environment/level1/walls/WallAstra_Straight.gltf",

    function (gltf) {

        const wallOriginal = gltf.scene;

        wallOriginal.traverse((child) => {

            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }

        });

        // ===============================
        // PARED DEL FONDO
        // ===============================
        for (let x = -3; x <= 3; x++) {

            const wall = wallOriginal.clone(true);

            // Girar 90 grados para que el ancho
            // de la pared quede sobre el eje X
            wall.rotation.y = Math.PI / 2;

            wall.position.set(
                x * 4,
                0,
                -12
            );

            scene.add(wall);
        }
        // ===============================
        // PARED LATERAL IZQUIERDA
        // ===============================

        for (let z = -2; z <= 2; z++) {

            const wall = wallOriginal.clone(true);

            // Aquí NO se gira.
            // El modelo original ya mide 4 unidades sobre Z.
            wall.rotation.y = 0;

            wall.position.set(
                -12,
                0,
                z * 4
            );

            scene.add(wall);
        }
        // ===============================
        // PARED LATERAL DERECHA
        // ===============================

        for (let z = -2; z <= 2; z++) {

            const wall = wallOriginal.clone(true);

            // El modelo original se extiende sobre Z
            wall.rotation.y = 0;

            wall.position.set(
                16,
                0,
                z * 4
            );

            scene.add(wall);
        }

        // ===============================
        // PARED FRONTAL
        // ===============================

        const frontWallPositions = [-12, -8, -4, 8, 12];

        const frontWallGroup = new THREE.Group();

        frontWallPositions.forEach((x) => {

            const wall = wallOriginal.clone(true);

            wall.rotation.y = Math.PI / 2;

            wall.position.set(
                x,
                0,
                8
            );

            frontWallGroup.add(wall);
        });

        scene.add(frontWallGroup);

        console.log(
            "Pared del fondo cargada correctamente"
        );
    },

    undefined,

    function (error) {

        console.error(
            "Error cargando la pared del fondo:",
            error
        );

    }
);

/* ===============================
   ENTRADA PRINCIPAL - NIVEL 1
================================ */

loader.load(
    "./assets/models/environment/level1/platforms/Door_Frame_SquareTall.gltf",

    function (gltf) {

        const doorFrame = gltf.scene;

        doorFrame.traverse((child) => {

            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }

        });

        // Posición temporal para poder observarlo
        doorFrame.position.set(
            2,
            0,
            9.74
        );

        scene.add(doorFrame);

        console.log(
            "Marco de puerta cargado correctamente"
        );
    },

    undefined,

    function (error) {

        console.error(
            "Error cargando marco de puerta:",
            error
        );

    }
);




loader.load(
    "./assets/models/environment/level1/platforms/Door_DarkMetal.gltf",

    function (gltf) {

        const door = gltf.scene;

        door.traverse((child) => {

            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }

        });

        door.position.set(
            2,
            0,
            9.74
        );

        scene.add(door);

        console.log(
            "Puerta cargada correctamente"
        );
    },

    undefined,

    function (error) {

        console.error(
            "Error cargando puerta:",
            error
        );

    }
);


/* ===============================
   PERSONAJE R-0 - PRUEBA
================================ */

fbxLoader.load(
    "./assets/models/character/XBot.fbx",

    function (xbot) {

        r0 = xbot;

        xbot.traverse((child) => {

            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }

        });
        xbot.scale.set(0.012, 0.012, 0.012);
        xbot.position.set(
            2,
            0.05,
            4
        );

        scene.add(xbot);

        r0Mixer = new THREE.AnimationMixer(xbot);

        r0Mixer.addEventListener(
            "finished",
            (event) => {

                if (event.action === r0Actions.attack) {

                    isR0Attacking = false;

                    if (
                        r0Keys.w ||
                        r0Keys.a ||
                        r0Keys.s ||
                        r0Keys.d
                    ) {
                        playR0Action(
                            r0Keys.shift
                                ? "run"
                                : "walk"
                        );
                    } else {
                        playR0Action("idle");
                    }
                }

            }
        );

        console.log(
            "R-0 cargado correctamente"
        );

        fbxLoader.load(
            "./assets/models/character/Idle.fbx",

            function (idle) {

                if (idle.animations.length > 0) {

                    r0Actions.idle =
                        r0Mixer.clipAction(
                            idle.animations[0]
                        );

                    r0Actions.idle.play();
                    currentR0Action = r0Actions.idle;

                    console.log(
                        "Animación Idle cargada correctamente"
                    );
                }

                fbxLoader.load(
                    "./assets/models/character/Walk.fbx",

                    function (walk) {

                        if (walk.animations.length > 0) {

                            r0Actions.walk =
                                r0Mixer.clipAction(
                                    walk.animations[0]
                                );

                            r0Actions.walk.stop();

                            console.log(
                                "Animación Walk cargada correctamente"
                            );
                        }

                        fbxLoader.load(
                            "./assets/models/character/Run.fbx",

                            function (run) {

                                if (run.animations.length > 0) {

                                    r0Actions.run =
                                        r0Mixer.clipAction(
                                            run.animations[0]
                                        );

                                    r0Actions.run.stop();

                                    console.log(
                                        "Animación Run cargada correctamente"
                                    );
                                }

                                fbxLoader.load(
                                    "./assets/models/character/Attack.fbx",

                                    function (attack) {

                                        if (attack.animations.length > 0) {

                                            r0Actions.attack =
                                                r0Mixer.clipAction(
                                                    attack.animations[0]
                                                );

                                            r0Actions.attack.setLoop(
                                                THREE.LoopOnce
                                            );

                                            r0Actions.attack.clampWhenFinished = true;
                                            r0Actions.attack.stop();

                                            console.log(
                                                "Animación Attack cargada correctamente"
                                            );
                                        }

                                    },

                                    undefined,

                                    function (error) {

                                        console.error(
                                            "Error cargando animación Attack:",
                                            error
                                        );

                                    }
                                );

                            },

                            undefined,

                            function (error) {

                                console.error(
                                    "Error cargando animación Run:",
                                    error
                                );

                            }
                        );

                    },

                    undefined,

                    function (error) {

                        console.error(
                            "Error cargando animación Walk:",
                            error
                        );

                    }
                );

            },

            undefined,

            function (error) {

                console.error(
                    "Error cargando animación Idle:",
                    error
                );

            }
        );

    },

    undefined,

    function (error) {

        console.error(
            "Error cargando R-0:",
            error
        );

    }
);


/* ===============================
   GRID
================================ */

const grid =
    new THREE.GridHelper(
        30,
        30
    );

scene.add(grid);


/* ===============================
   CONTROLES DE CÁMARA
================================ */

const controls =
    new OrbitControls(
        camera,
        renderer.domElement
    );

controls.enableDamping = true;

controls.target.set(
    0,
    1,
    0
);


/* ===============================
   BOTÓN INICIAR
================================ */

const startButton =
    document.getElementById(
        "start-button"
    );

startButton.addEventListener(
    "click",
    () => {

        document
            .getElementById(
                "start-screen"
            )
            .classList
            .add("hidden");

        document
            .getElementById(
                "hud"
            )
            .classList
            .remove("hidden");

    }
);


window.addEventListener(
    "keydown",
    (event) => {

        const key = event.key.toLowerCase();

        if (key === "f" && !r0Keys.f) {
            playR0Attack();
            r0Keys.f = true;
        }

        if (key in r0Keys) {
            r0Keys[key] = true;
        }

        if (event.key === "Shift") {
            r0Keys.shift = true;
        }

    }
);

window.addEventListener(
    "keyup",
    (event) => {

        const key = event.key.toLowerCase();

        if (key in r0Keys) {
            r0Keys[key] = false;
        }

        if (key === "f") {
            r0Keys.f = false;
        }

        if (event.key === "Shift") {
            r0Keys.shift = false;
        }

    }
);


function playR0Action(name) {

    const nextAction = r0Actions[name];

    if (!nextAction || currentR0Action === nextAction) {
        return;
    }

    if (currentR0Action) {
        currentR0Action.fadeOut(0.2);
    }

    nextAction
        .reset()
        .fadeIn(0.2)
        .play();

    currentR0Action = nextAction;
}


function playR0Attack() {

    const attackAction = r0Actions.attack;

    if (!attackAction || isR0Attacking) {
        return;
    }

    isR0Attacking = true;

    if (currentR0Action) {
        currentR0Action.fadeOut(0.2);
    }

    attackAction
        .reset()
        .fadeIn(0.2)
        .play();

    currentR0Action = attackAction;
}


/* ===============================
   RESPONSIVE
================================ */

window.addEventListener(
    "resize",
    () => {

        camera.aspect =
            window.innerWidth /
            window.innerHeight;

        camera.updateProjectionMatrix();

        renderer.setSize(
            window.innerWidth,
            window.innerHeight
        );

    }
);


/* ===============================
   GAME LOOP
================================ */

function animate() {

    requestAnimationFrame(animate);

    const delta = clock.getDelta();

    if (r0Mixer) {
        r0Mixer.update(delta);
    }

    if (r0) {

        r0MoveDirection.set(0, 0, 0);

        if (r0Keys.w) {
            r0MoveDirection.z -= 1;
        }

        if (r0Keys.s) {
            r0MoveDirection.z += 1;
        }

        if (r0Keys.a) {
            r0MoveDirection.x -= 1;
        }

        if (r0Keys.d) {
            r0MoveDirection.x += 1;
        }

        if (isR0Attacking) {
            r0MoveDirection.set(0, 0, 0);
        } else if (r0MoveDirection.lengthSq() > 0) {

            r0MoveDirection.normalize();

            const speed =
                r0Keys.shift
                    ? r0RunSpeed
                    : r0WalkSpeed;

            r0.position.x +=
                r0MoveDirection.x *
                speed *
                delta;

            r0.position.z +=
                r0MoveDirection.z *
                speed *
                delta;

            r0.rotation.y =
                Math.atan2(
                    r0MoveDirection.x,
                    r0MoveDirection.z
                );

            playR0Action(
                r0Keys.shift
                    ? "run"
                    : "walk"
            );

        } else {

            playR0Action("idle");

        }
    }

    controls.update();

    renderer.render(
        scene,
        camera
    );

}

animate();
