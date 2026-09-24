import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { FBXLoader } from "three/addons/loaders/FBXLoader.js";
import RAPIER from "https://cdn.skypack.dev/@dimforge/rapier3d-compat";

/* ===============================
   ESCENA
================================ */

const scene = new THREE.Scene();
const loadingManager = new THREE.LoadingManager();
const loader = new GLTFLoader(loadingManager);
const fbxLoader = new FBXLoader(loadingManager);


const clock = new THREE.Clock();
let playerBody = null;
let playerCollider = null;
let characterController = null;
let r0Mixer = null;
let r0 = null;
let doorFrameModel = null;
let wallAstraOriginalModel = null;
let frontLeftWallGroupModel = null;
let frontRightWallGroupModel = null;
let frontDoorFillersGroup = null;
let frontEntranceBarrierCreated = false;
let currentR0Action = null;
let isR0Attacking = false;
const generators = [];
let activatedGenerators = 0;
let levelCompleted = false;
const energyPulses = [];
let energyAnomaly = null;
let energyAnomalyHealth = 3;
let r0Energy = 100;
let lastAnomalyDamageTime = 0;
let gameOver = false;
const LEVEL_TIME_LIMIT = 120;
let timerAccumulator = 0;
let levelTimeRemaining = LEVEL_TIME_LIMIT;
const interactionPrompt =
    document.getElementById(
        "interaction-prompt"
    );
const systemNotification =
    document.getElementById(
        "system-notification"
    );

const notificationMessage =
    document.getElementById(
        "notification-message"
    );
// Posiciones de los 3 generadores del Nivel 1
const generatorPositions = [
    { x: -8, y: 0.70, z: -5 },
    { x: 8, y: 0.73, z: -5 },
    { x: 0, y: 0.73, z: 5 }
];
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
const cameraFollowOffset =
    new THREE.Vector3(0, 4, 7);
const cameraFollowPosition =
    new THREE.Vector3();
const cameraLookTarget =
    new THREE.Vector3();
// Detección de obstáculos entre R-0 y la cámara
const cameraRaycaster = new THREE.Raycaster();

const cameraRayDirection =
    new THREE.Vector3();

const cameraObstacles = [];

await RAPIER.init();

const gravity = {
    x: 0.0,
    y: -9.81,
    z: 0.0
};

const physicsWorld = new RAPIER.World(gravity);

console.log(
    "Rapier inicializado correctamente"
);

const floorBodyDesc =
    RAPIER.RigidBodyDesc
        .fixed()
        .setTranslation(
            0,
            -0.05,
            0
        );

const floorBody =
    physicsWorld.createRigidBody(
        floorBodyDesc
    );

const floorColliderDesc =
    RAPIER.ColliderDesc.cuboid(
        14,
        0.1,
        10
    );

physicsWorld.createCollider(
    floorColliderDesc,
    floorBody
);

console.log(
    "Collider del piso creado correctamente"
);

const backWallBodyDesc =
    RAPIER.RigidBodyDesc
        .fixed()
        .setTranslation(
            0,
            1.5,
            -10
        );

const backWallBody =
    physicsWorld.createRigidBody(
        backWallBodyDesc
    );

const backWallColliderDesc =
    RAPIER.ColliderDesc.cuboid(
        14,
        1.5,
        0.6
    );

physicsWorld.createCollider(
    backWallColliderDesc,
    backWallBody
);

console.log(
    "Collider pared trasera creado correctamente"
);

// Ambiente exterior industrial
const environmentColor = 0x26343d;

scene.background = new THREE.Color(
    environmentColor
);

// Niebla atmosférica
scene.fog = new THREE.FogExp2(
    environmentColor,
    0.030
);
/* ===============================
   TEXTURA DEL FONDO INDUSTRIAL
================================ */

const backgroundTextureLoader =
    new THREE.TextureLoader();

const industrialBackgroundTexture =
    backgroundTextureLoader.load(
        "./assets/textures/industrial_background.png",
        () => {
            console.log(
                "Textura industrial cargada correctamente"
            );
        },
        undefined,
        (error) => {
            console.error(
                "Error cargando textura industrial:",
                error
            );
        }
    );

industrialBackgroundTexture.colorSpace =
    THREE.SRGBColorSpace;



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
   FONDO INDUSTRIAL
================================ */

const industrialBackground = new THREE.Group();

scene.add(industrialBackground);

const backgroundMaterial =
    new THREE.MeshStandardMaterial({
        color: 0x18232b,
        roughness: 0.9,
        metalness: 0.3
    });

const towerMaterial =
    new THREE.MeshStandardMaterial({
        color: 0x24343d,
        roughness: 0.85,
        metalness: 0.4
    });
const warningLightMaterial =
    new THREE.MeshBasicMaterial({
        color: 0xff3b30
    });
function createBackgroundBuilding(
    x,
    y,
    z,
    width,
    height,
    depth
) {

    const geometry =
        new THREE.BoxGeometry(
            width,
            height,
            depth
        );

    const building =
        new THREE.Mesh(
            geometry,
            backgroundMaterial
        );

    building.position.set(
        x,
        y + height / 2,
        z
    );

    industrialBackground.add(building);

}
createBackgroundBuilding(
    -20, 0, -35,
    8, 18, 8
);

createBackgroundBuilding(
    -8, 0, -42,
    10, 28, 10
);

createBackgroundBuilding(
    8, 0, -38,
    12, 22, 10
);

createBackgroundBuilding(
    22, 0, -45,
    9, 32, 9
);

createBackgroundBuilding(
    35, 0, -40,
    14, 20, 12
);
createBackgroundBuilding(
    -22, 0, 35,
    10, 22, 10
);

createBackgroundBuilding(
    -8, 0, 42,
    12, 30, 12
);

createBackgroundBuilding(
    10, 0, 38,
    9, 20, 9
);

createBackgroundBuilding(
    25, 0, 44,
    12, 27, 12
);
createBackgroundBuilding(
    -38, 0, -20,
    10, 24, 10
);

createBackgroundBuilding(
    -42, 0, -5,
    12, 32, 12
);

createBackgroundBuilding(
    -38, 0, 12,
    9, 19, 9
);

createBackgroundBuilding(
    -45, 0, 27,
    14, 28, 12
);
createBackgroundBuilding(
    38, 0, -22,
    10, 26, 10
);

createBackgroundBuilding(
    43, 0, -7,
    12, 20, 12
);

createBackgroundBuilding(
    39, 0, 10,
    10, 31, 10
);

createBackgroundBuilding(
    44, 0, 27,
    14, 23, 12
);
createIndustrialTower(
    -15,
    -40,
    22
);

createIndustrialTower(
    16,
    -44,
    30
);

createIndustrialTower(
    -38,
    8,
    26
);

createIndustrialTower(
    40,
    -5,
    32
);

createIndustrialTower(
    -15,
    40,
    28
);

createIndustrialTower(
    18,
    42,
    24
);
// Zona trasera
createIndustrialBridge(
    0,
    14,
    -40,
    26,
    0
);

// Zona frontal exterior
createIndustrialBridge(
    2,
    17,
    40,
    28,
    0
);

// Lateral izquierdo
createIndustrialBridge(
    -40,
    15,
    0,
    25,
    Math.PI / 2
);

// Lateral derecho
createIndustrialBridge(
    40,
    18,
    2,
    28,
    Math.PI / 2
);

function createIndustrialTower(x, z, height) {

    const towerGroup = new THREE.Group();

    // Cuerpo principal
    const bodyGeometry =
        new THREE.CylinderGeometry(
            2.2,
            2.8,
            height,
            8
        );

    const body =
        new THREE.Mesh(
            bodyGeometry,
            towerMaterial
        );

    body.position.y = height / 2;

    towerGroup.add(body);

    // Parte superior
    const topGeometry =
        new THREE.CylinderGeometry(
            1.5,
            2.2,
            3,
            8
        );

    const top =
        new THREE.Mesh(
            topGeometry,
            towerMaterial
        );

    top.position.y =
        height + 1.5;

    towerGroup.add(top);

    // Chimenea
    const chimneyGeometry =
        new THREE.CylinderGeometry(
            0.45,
            0.65,
            7,
            8
        );

    const chimney =
        new THREE.Mesh(
            chimneyGeometry,
            towerMaterial
        );

    chimney.position.y =
        height + 6;

    towerGroup.add(chimney);
    // Luz de advertencia superior
    const warningGeometry =
        new THREE.SphereGeometry(
            0.35,
            8,
            8
        );

    const warningLight =
        new THREE.Mesh(
            warningGeometry,
            warningLightMaterial
        );

    warningLight.position.y =
        height + 9.7;

    towerGroup.add(
        warningLight
    );
    // Resplandor ambiental de la torre
    const warningGlow =
        new THREE.PointLight(
            0xff3b30,
            12,
            40,
            1.5
        );

    warningGlow.position.y =
        height + 4;

    towerGroup.add(
        warningGlow
    );

    towerGroup.position.set(
        x,
        0,
        z
    );

    industrialBackground.add(
        towerGroup
    );
    // Halo industrial ambiental
    const glowGeometry =
        new THREE.SphereGeometry(
            8,
            16,
            16
        );

    const glowMaterial =
        new THREE.ShaderMaterial({

            transparent: true,
            depthWrite: false,

            blending:
                THREE.AdditiveBlending,

            uniforms: {
                glowColor: {
                    value:
                        new THREE.Color(
                            0xff4d2e
                        )
                }
            },

            vertexShader: `
            varying vec3 vNormal;

            void main() {

                vNormal =
                    normalize(
                        normalMatrix * normal
                    );

                gl_Position =
                    projectionMatrix *
                    modelViewMatrix *
                    vec4(position, 1.0);
            }
        `,

            fragmentShader: `
            varying vec3 vNormal;

            uniform vec3 glowColor;

            void main() {

                float intensity =
                    pow(
                        1.0 -
                        abs(vNormal.z),
                        2.5
                    );

                gl_FragColor =
                    vec4(
                        glowColor,
                        intensity * 0.05
                    );
            }
        `
        });


    const industrialGlow =
        new THREE.Mesh(
            glowGeometry,
            glowMaterial
        );

    industrialGlow.position.set(
        0,
        height * 0.45,
        0
    );

    towerGroup.add(
        industrialGlow
    );
}
function createIndustrialBridge(
    x,
    y,
    z,
    width,
    rotationY = 0
) {
    const geometry =
        new THREE.BoxGeometry(
            width,
            1.2,
            1.4
        );

    const material =
        new THREE.MeshStandardMaterial({
            color: 0x2d3d46,
            roughness: 0.8,
            metalness: 0.45
        });

    const bridge =
        new THREE.Mesh(
            geometry,
            material
        );

    bridge.position.set(
        x,
        y,
        z
    );

    bridge.rotation.y =
        rotationY;

    industrialBackground.add(
        bridge
    );
}

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
        wallAstraOriginalModel = wallOriginal;

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
            cameraObstacles.push(wall);
        }
        // ===============================
        // PARED LATERAL IZQUIERDA
        // ===============================

        const leftWallGroup = new THREE.Group();

        for (let z = -2; z <= 2; z++) {

            const wall = wallOriginal.clone(true);

            // Aquí NO se gira.
            // El modelo original ya mide 4 unidades sobre Z.
            wall.rotation.y = Math.PI;

            wall.position.set(
                -16,
                0,
                z * 4
            );

            leftWallGroup.add(wall);
        }

        scene.add(leftWallGroup);
        cameraObstacles.push(leftWallGroup);
        // ===============================
        // PARED LATERAL DERECHA
        // ===============================

        const rightWallGroup = new THREE.Group();

        for (let z = -2; z <= 2; z++) {

            const wall = wallOriginal.clone(true);

            // El modelo original se extiende sobre Z
            wall.rotation.y = 0;

            wall.position.set(
                16,
                0,
                z * 4
            );

            rightWallGroup.add(wall);
        }

        scene.add(rightWallGroup);
        cameraObstacles.push(rightWallGroup);

        // ===============================
        // PARED FRONTAL
        // ===============================

        const frontWallPositions = [-12, -8, -4, 8, 12];

        const frontLeftWallGroup = new THREE.Group();
        const frontRightWallGroup = new THREE.Group();
        frontLeftWallGroupModel = frontLeftWallGroup;
        frontRightWallGroupModel = frontRightWallGroup;

        frontWallPositions.forEach((x) => {

            const wall = wallOriginal.clone(true);

            wall.rotation.y = - Math.PI / 2;

            wall.position.set(
                x,
                0,
                12
            );

            if (x < 0) {
                frontLeftWallGroup.add(wall);
            } else {
                frontRightWallGroup.add(wall);
            }
        });

        scene.add(frontLeftWallGroup);
        scene.add(frontRightWallGroup);

        const leftWallBox =
            new THREE.Box3().setFromObject(leftWallGroup);
        const leftWallCenter =
            new THREE.Vector3();
        const leftWallSize =
            new THREE.Vector3();

        leftWallBox.getCenter(leftWallCenter);
        leftWallBox.getSize(leftWallSize);

        const leftWallBody =
            physicsWorld.createRigidBody(
                RAPIER.RigidBodyDesc
                    .fixed()
                    .setTranslation(
                        leftWallCenter.x,
                        leftWallCenter.y,
                        leftWallCenter.z
                    )
            );

        physicsWorld.createCollider(
            RAPIER.ColliderDesc.cuboid(
                leftWallSize.x / 2,
                leftWallSize.y / 2,
                leftWallSize.z / 2
            ),
            leftWallBody
        );

        const rightWallBox =
            new THREE.Box3().setFromObject(rightWallGroup);
        const rightWallCenter =
            new THREE.Vector3();
        const rightWallSize =
            new THREE.Vector3();

        rightWallBox.getCenter(rightWallCenter);
        rightWallBox.getSize(rightWallSize);


        console.log("DIAGNÓSTICO PARED DERECHA", {
            center: {
                x: rightWallCenter.x,
                y: rightWallCenter.y,
                z: rightWallCenter.z
            },
            size: {
                x: rightWallSize.x,
                y: rightWallSize.y,
                z: rightWallSize.z
            },
            box: {
                minX: rightWallBox.min.x,
                maxX: rightWallBox.max.x,
                minZ: rightWallBox.min.z,
                maxZ: rightWallBox.max.z
            }
        });

        const rightWallBody =
            physicsWorld.createRigidBody(
                RAPIER.RigidBodyDesc
                    .fixed()
                    .setTranslation(
                        rightWallCenter.x,
                        rightWallCenter.y,
                        rightWallCenter.z
                    )
            );

        physicsWorld.createCollider(
            RAPIER.ColliderDesc.cuboid(
                rightWallSize.x / 2,
                rightWallSize.y / 2,
                rightWallSize.z / 2
            ),
            rightWallBody
        );

        const frontLeftWallBox =
            new THREE.Box3().setFromObject(frontLeftWallGroup);
        const frontLeftWallCenter =
            new THREE.Vector3();
        const frontLeftWallSize =
            new THREE.Vector3();

        frontLeftWallBox.getCenter(frontLeftWallCenter);
        frontLeftWallBox.getSize(frontLeftWallSize);

        const frontLeftWallBody =
            physicsWorld.createRigidBody(
                RAPIER.RigidBodyDesc
                    .fixed()
                    .setTranslation(
                        frontLeftWallCenter.x,
                        frontLeftWallCenter.y,
                        frontLeftWallCenter.z
                    )
            );

        physicsWorld.createCollider(
            RAPIER.ColliderDesc.cuboid(
                frontLeftWallSize.x / 2,
                frontLeftWallSize.y / 2,
                frontLeftWallSize.z / 2
            ),
            frontLeftWallBody
        );

        const frontRightWallBox =
            new THREE.Box3().setFromObject(frontRightWallGroup);
        const frontRightWallCenter =
            new THREE.Vector3();
        const frontRightWallSize =
            new THREE.Vector3();

        frontRightWallBox.getCenter(frontRightWallCenter);
        frontRightWallBox.getSize(frontRightWallSize);

        const frontRightWallBody =
            physicsWorld.createRigidBody(
                RAPIER.RigidBodyDesc
                    .fixed()
                    .setTranslation(
                        frontRightWallCenter.x,
                        frontRightWallCenter.y,
                        frontRightWallCenter.z
                    )
            );

        physicsWorld.createCollider(
            RAPIER.ColliderDesc.cuboid(
                frontRightWallSize.x / 2,
                frontRightWallSize.y / 2,
                frontRightWallSize.z / 2
            ),
            frontRightWallBody
        );

        console.log(
            "Colliders exteriores del Nivel 1 creados correctamente"
        );

        rebuildFrontFacade();

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

function rebuildFrontFacade() {

    if (
        !wallAstraOriginalModel ||
        !doorFrameModel
    ) {
        return;
    }

    if (frontLeftWallGroupModel) {
        scene.remove(frontLeftWallGroupModel);
    }

    if (frontRightWallGroupModel) {
        scene.remove(frontRightWallGroupModel);
    }

    frontLeftWallGroupModel = new THREE.Group();
    frontRightWallGroupModel = new THREE.Group();

    const doorBox =
        new THREE.Box3().setFromObject(doorFrameModel);
    const baseWall =
        wallAstraOriginalModel.clone(true);

    baseWall.rotation.y = -Math.PI / 2;

    const baseWallBox =
        new THREE.Box3().setFromObject(baseWall);
    const baseWallSize =
        new THREE.Vector3();

    baseWallBox.getSize(baseWallSize);

    const segmentWidth = baseWallSize.x;
    const halfSegmentWidth = segmentWidth / 2;
    const facadeMinX = -14;
    const facadeMaxX = 14;
    const facadeZ = 12;
    const separation = 0.05;
    const leftLimit = doorBox.min.x - separation;
    const rightLimit = doorBox.max.x + separation;

    function addFrontWallSegment(x) {

        const wall =
            wallAstraOriginalModel.clone(true);

        wall.rotation.y = -Math.PI / 2;

        wall.position.set(
            x,
            0,
            facadeZ
        );

        if (x < doorBox.min.x) {
            frontLeftWallGroupModel.add(wall);
        } else {
            frontRightWallGroupModel.add(wall);
        }
    }

    for (
        let x = facadeMinX + halfSegmentWidth;
        x + halfSegmentWidth <= leftLimit;
        x += segmentWidth
    ) {
        addFrontWallSegment(x);
    }

    for (
        let x = facadeMaxX - halfSegmentWidth;
        x - halfSegmentWidth >= rightLimit;
        x -= segmentWidth
    ) {
        addFrontWallSegment(x);
    }

    scene.add(frontLeftWallGroupModel);
    scene.add(frontRightWallGroupModel);
    cameraObstacles.push(
        frontLeftWallGroupModel,
        frontRightWallGroupModel
    );
    // Collider actualizado para la pared frontal derecha reconstruida
    frontRightWallGroupModel.updateMatrixWorld(true);

    const rebuiltFrontRightBox =
        new THREE.Box3().setFromObject(frontRightWallGroupModel);

    const rebuiltFrontRightCenter =
        new THREE.Vector3();

    const rebuiltFrontRightSize =
        new THREE.Vector3();

    rebuiltFrontRightBox.getCenter(rebuiltFrontRightCenter);
    rebuiltFrontRightBox.getSize(rebuiltFrontRightSize);

    const rebuiltFrontRightBody =
        physicsWorld.createRigidBody(
            RAPIER.RigidBodyDesc
                .fixed()
                .setTranslation(
                    rebuiltFrontRightCenter.x,
                    rebuiltFrontRightCenter.y,
                    rebuiltFrontRightCenter.z
                )
        );

    physicsWorld.createCollider(
        RAPIER.ColliderDesc.cuboid(
            rebuiltFrontRightSize.x / 2,
            rebuiltFrontRightSize.y / 2,
            rebuiltFrontRightSize.z / 2
        ),
        rebuiltFrontRightBody
    );

    if (frontDoorFillersGroup) {
        scene.remove(frontDoorFillersGroup);
    }

    frontDoorFillersGroup = new THREE.Group();

    const updatedLeftBox =
        new THREE.Box3().setFromObject(frontLeftWallGroupModel);
    const updatedRightBox =
        new THREE.Box3().setFromObject(frontRightWallGroupModel);
    const fillerBase =
        wallAstraOriginalModel.clone(true);

    fillerBase.rotation.y = -Math.PI / 2;
    fillerBase.updateMatrixWorld(true);

    const fillerBaseBox =
        new THREE.Box3().setFromObject(fillerBase);
    const fillerBaseSize =
        new THREE.Vector3();
    const fillerScaledBox =
        new THREE.Box3();
    const fillerScaledSize =
        new THREE.Vector3();

    fillerBaseBox.getSize(fillerBaseSize);

    const xAxisTest =
        wallAstraOriginalModel.clone(true);

    xAxisTest.rotation.y = -Math.PI / 2;
    xAxisTest.scale.x = 2;
    xAxisTest.updateMatrixWorld(true);
    fillerScaledBox.setFromObject(xAxisTest);
    fillerScaledBox.getSize(fillerScaledSize);

    const horizontalScaleAxis =
        Math.abs(
            fillerScaledSize.x -
            fillerBaseSize.x
        ) > 0.01
            ? "x"
            : "z";

    function addDoorFiller(minX, maxX) {

        const availableWidth =
            maxX - minX;

        if (availableWidth <= 0) {
            return;
        }

        const filler =
            wallAstraOriginalModel.clone(true);

        filler.rotation.y = -Math.PI / 2;
        filler.scale[horizontalScaleAxis] =
            availableWidth / fillerBaseSize.x;

        filler.position.set(
            (minX + maxX) / 2,
            0,
            facadeZ
        );

        frontDoorFillersGroup.add(filler);
    }

    addDoorFiller(
        updatedLeftBox.max.x,
        doorBox.min.x - 0.03
    );

    addDoorFiller(
        doorBox.max.x + 0.03,
        updatedRightBox.min.x
    );

    scene.add(frontDoorFillersGroup);
    // Collider para los fillers junto al marco de la puerta
    frontDoorFillersGroup.updateMatrixWorld(true);

    frontDoorFillersGroup.children.forEach((filler) => {

        const fillerBox =
            new THREE.Box3().setFromObject(filler);

        const fillerCenter =
            new THREE.Vector3();

        const fillerSize =
            new THREE.Vector3();

        fillerBox.getCenter(fillerCenter);
        fillerBox.getSize(fillerSize);

        const fillerBody =
            physicsWorld.createRigidBody(
                RAPIER.RigidBodyDesc
                    .fixed()
                    .setTranslation(
                        fillerCenter.x,
                        fillerCenter.y,
                        fillerCenter.z
                    )
            );

        physicsWorld.createCollider(
            RAPIER.ColliderDesc.cuboid(
                fillerSize.x / 2,
                fillerSize.y / 2,
                fillerSize.z / 2
            ),
            fillerBody
        );
    });

    createFrontEntranceBarrier();
}

function createFrontEntranceBarrier() {

    if (
        frontEntranceBarrierCreated ||
        !doorFrameModel
    ) {
        return;
    }

    const doorBox =
        new THREE.Box3().setFromObject(doorFrameModel);
    const doorSize =
        new THREE.Vector3();
    const doorCenter =
        new THREE.Vector3();

    doorBox.getCenter(doorCenter);
    doorBox.getSize(doorSize);

    const frontEntranceBarrierBody =
        physicsWorld.createRigidBody(
            RAPIER.RigidBodyDesc
                .fixed()
                .setTranslation(
                    doorCenter.x,
                    doorCenter.y,
                    doorCenter.z
                )
        );

    physicsWorld.createCollider(
        RAPIER.ColliderDesc.cuboid(
            doorSize.x / 2,
            doorSize.y / 2,
            doorSize.z / 2
        ),
        frontEntranceBarrierBody
    );

    frontEntranceBarrierCreated = true;
}

/* ===============================
   ENTRADA PRINCIPAL - NIVEL 1
================================ */

loader.load(
    "./assets/models/environment/level1/platforms/Door_Frame_SquareTall.gltf",

    function (gltf) {

        const doorFrame = gltf.scene;
        doorFrameModel = doorFrame;

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

        rebuildFrontFacade();
        createFrontEntranceBarrier();

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
   GENERADORES - NIVEL 1
================================ */

loader.load(
    "./assets/models/props/generators/Prop_AccessPoint.gltf",

    function (gltf) {

        const generatorOriginal = gltf.scene;

        generatorOriginal.traverse((child) => {

            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }

        });



        generatorPositions.forEach((position, index) => {

            const generator = generatorOriginal.clone(true);
            generator.traverse((child) => {

                if (child.isMesh && child.material) {
                    child.material = child.material.clone();
                }

            });

            generator.rotation.x = -Math.PI / 2;

            generator.position.set(
                position.x,
                position.y,
                position.z
            );

            generator.name = `Generator_${index + 1}`;
            generator.userData.activated = false;
            generator.userData.blocked =
                index === 2;
            generators.push(generator);

            scene.add(generator);
            // ===============================
            // COLLIDER DEL GENERADOR
            // ===============================

            generator.updateMatrixWorld(true);

            const generatorBox =
                new THREE.Box3().setFromObject(generator);

            const generatorCenter =
                new THREE.Vector3();

            const generatorSize =
                new THREE.Vector3();

            generatorBox.getCenter(
                generatorCenter
            );

            generatorBox.getSize(
                generatorSize
            );

            const generatorBody =
                physicsWorld.createRigidBody(
                    RAPIER.RigidBodyDesc
                        .fixed()
                        .setTranslation(
                            generatorCenter.x,
                            generatorCenter.y,
                            generatorCenter.z
                        )
                );

            physicsWorld.createCollider(
                RAPIER.ColliderDesc.cuboid(
                    generatorSize.x / 2,
                    generatorSize.y / 2,
                    generatorSize.z / 2
                ),
                generatorBody
            );
        });

        console.log(
            "3 generadores del Nivel 1 cargados correctamente"
        );
    },

    undefined,

    function (error) {

        console.error(
            "Error cargando generadores del Nivel 1:",
            error
        );

    }
);

/* ===============================
   CAJAS DINÁMICAS DEL NIVEL 1
================================ */

const dynamicCrates = [];
const usedCratePositions = [];

loader.load(
    "./assets/models/props/crates/Prop_Crate4.gltf",

    function (gltf) {

        const crateOriginal = gltf.scene;

        crateOriginal.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });

        // ===============================
        // CAJAS DISTRIBUIDAS ALEATORIAMENTE
        // ===============================

        const numberOfRandomCrates = 15;


        for (
            let i = 0;
            i < numberOfRandomCrates;
            i++
        ) {

            let x;
            let z;

            // Evitamos la zona central donde inicia R-0
            let invalidPosition;

            do {

                x = THREE.MathUtils.randFloat(
                    -11,
                    11
                );

                z = THREE.MathUtils.randFloat(
                    -7,
                    7
                );

                // Evitar zona donde inicia R-0
                const nearPlayerStart =
                    Math.abs(x) < 3 &&
                    Math.abs(z) < 3;

                // Evitar los generadores
                const nearGenerator =
                    generatorPositions.some(
                        (generator) => {

                            const dx =
                                x - generator.x;

                            const dz =
                                z - generator.z;

                            const distance =
                                Math.sqrt(
                                    dx * dx +
                                    dz * dz
                                );

                            return distance < 2.5;
                        }
                    );
                // Evitar cajas demasiado juntas
                const nearAnotherCrate =
                    usedCratePositions.some(
                        (cratePosition) => {

                            const dx =
                                x - cratePosition.x;

                            const dz =
                                z - cratePosition.z;

                            const distance =
                                Math.sqrt(
                                    dx * dx +
                                    dz * dz
                                );

                            return distance < 2.2;
                        }
                    );

                invalidPosition =
                    nearPlayerStart ||
                    nearGenerator ||
                    nearAnotherCrate;

            } while (invalidPosition);

            usedCratePositions.push({
                x: x,
                z: z
            });

            createDynamicCrate(
                crateOriginal,
                x,
                1.2,
                z
            );
        }


        // ===============================
        // PILA DE CAJAS
        // ===============================

        createDynamicCrate(
            crateOriginal,
            -10,
            1.2,
            5
        );

        createDynamicCrate(
            crateOriginal,
            -10,
            3.2,
            5
        );

        createDynamicCrate(
            crateOriginal,
            -10,
            5.2,
            5
        );
        // ===============================
        // BLOQUEO FÍSICO - GENERADOR 02
        // ===============================

        createDynamicCrate(
            crateOriginal,
            6.5,
            1.2,
            -3.2
        );

        createDynamicCrate(
            crateOriginal,
            8.3,
            1.2,
            -2.8
        );

        createDynamicCrate(
            crateOriginal,
            9.8,
            1.2,
            -3.6
        );
        createDynamicCrate(
            crateOriginal,
            6.9,
            1.2,
            -5.9
        );

        createDynamicCrate(
            crateOriginal,
            9.2,
            1.2,
            -6.3
        );

        createDynamicCrate(
            crateOriginal,
            10.6,
            1.2,
            -5.1
        );

        console.log(
            "Cajas dinámicas cargadas correctamente"
        );
    },

    undefined,

    function (error) {

        console.error(
            "Error cargando Prop_Crate4:",
            error
        );
    }
);




/* ===============================
   CREAR CAJA DINÁMICA
================================ */

function createDynamicCrate(
    crateOriginal,
    x,
    y,
    z
) {

    const crate =
        crateOriginal.clone(true);

    crate.position.set(
        x,
        y,
        z
    );

    scene.add(crate);

    crate.updateMatrixWorld(true);

    const crateBox =
        new THREE.Box3().setFromObject(crate);

    const crateSize =
        new THREE.Vector3();

    const crateCenter =
        new THREE.Vector3();

    crateBox.getSize(crateSize);
    crateBox.getCenter(crateCenter);

    // Cuerpo dinámico
    const bodyDesc =
        RAPIER.RigidBodyDesc
            .dynamic()
            .setTranslation(
                crateCenter.x,
                crateCenter.y,
                crateCenter.z
            );

    const body =
        physicsWorld.createRigidBody(
            bodyDesc
        );

    // Collider
    const colliderDesc =
        RAPIER.ColliderDesc.cuboid(
            crateSize.x / 2,
            crateSize.y / 2,
            crateSize.z / 2
        );

    colliderDesc.setDensity(15);
    colliderDesc.setFriction(0.8);
    colliderDesc.setRestitution(0.1);

    physicsWorld.createCollider(
        colliderDesc,
        body
    );

    // Guardamos juntos modelo + cuerpo físico
    dynamicCrates.push({
        model: crate,
        body: body
    });
}
/* ===============================
   BARRILES DINÁMICOS DEL NIVEL 1
================================ */

const dynamicBarrels = [];

loader.load(
    "./assets/models/props/barrels/Prop_Barrel_Large.gltf",

    function (gltf) {

        const barrelOriginal = gltf.scene;

        barrelOriginal.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });

        // ===============================
        // GENERAR BARRILES ALEATORIOS
        // ===============================

        const usedBarrelPositions = [];
        const numberOfBarrels = 6;

        for (let i = 0; i < numberOfBarrels; i++) {

            let x;
            let z;
            let invalidPosition;

            do {

                x = THREE.MathUtils.randFloat(
                    -11,
                    11
                );

                z = THREE.MathUtils.randFloat(
                    -7,
                    7
                );

                // Evitar zona inicial de R-0
                const nearPlayerStart =
                    Math.abs(x) < 3 &&
                    Math.abs(z) < 3;

                // Evitar generadores
                const nearGenerator =
                    generatorPositions.some(
                        (generator) => {

                            const dx =
                                x - generator.x;

                            const dz =
                                z - generator.z;

                            const distance =
                                Math.sqrt(
                                    dx * dx +
                                    dz * dz
                                );

                            return distance < 2.5;
                        }
                    );

                // Evitar otros barriles
                const nearAnotherBarrel =
                    usedBarrelPositions.some(
                        (position) => {

                            const dx =
                                x - position.x;

                            const dz =
                                z - position.z;

                            const distance =
                                Math.sqrt(
                                    dx * dx +
                                    dz * dz
                                );

                            return distance < 2.5;
                        }
                    );
                // Evitar cajas
                const nearCrate =
                    usedCratePositions.some(
                        (position) => {

                            const dx =
                                x - position.x;

                            const dz =
                                z - position.z;

                            const distance =
                                Math.sqrt(
                                    dx * dx +
                                    dz * dz
                                );

                            return distance < 2.5;
                        }
                    );

                invalidPosition =
                    nearPlayerStart ||
                    nearGenerator ||
                    nearAnotherBarrel ||
                    nearCrate;

            } while (invalidPosition);

            usedBarrelPositions.push({
                x: x,
                z: z
            });

            createDynamicBarrel(
                barrelOriginal,
                x,
                0.15,
                z
            );
        }

        console.log(
            "Barriles dinámicos cargados correctamente"
        );
    },

    undefined,

    function (error) {

        console.error(
            "Error cargando Prop_Barrel_Large:",
            error
        );
    }
);


/* ===============================
   CREAR BARRIL DINÁMICO
================================ */

function createDynamicBarrel(
    barrelOriginal,
    x,
    y,
    z
) {

    const barrel =
        barrelOriginal.clone(true);

    barrel.scale.set(
        1.5,
        1.5,
        1.5
    );

    barrel.position.set(
        x,
        y,
        z
    );

    scene.add(barrel);

    barrel.updateMatrixWorld(true);

    const barrelBox =
        new THREE.Box3().setFromObject(barrel);

    const barrelSize =
        new THREE.Vector3();

    const barrelCenter =
        new THREE.Vector3();

    barrelBox.getSize(barrelSize);
    barrelBox.getCenter(barrelCenter);

    // Offset individual del modelo
    const modelOffset =
        new THREE.Vector3();

    modelOffset.copy(
        barrel.position
    ).sub(
        barrelCenter
    );

    // Cuerpo dinámico
    const bodyDesc =
        RAPIER.RigidBodyDesc
            .dynamic()
            .setTranslation(
                barrelCenter.x,
                barrelCenter.y,
                barrelCenter.z
            );

    const body =
        physicsWorld.createRigidBody(
            bodyDesc
        );

    // Collider cilíndrico
    const barrelRadius =
        Math.max(
            barrelSize.x,
            barrelSize.z
        ) / 2;

    const barrelHalfHeight =
        barrelSize.y / 2;

    const colliderDesc =
        RAPIER.ColliderDesc.cylinder(
            barrelHalfHeight,
            barrelRadius
        );

    colliderDesc.setDensity(10);
    colliderDesc.setFriction(0.7);
    colliderDesc.setRestitution(0.15);

    physicsWorld.createCollider(
        colliderDesc,
        body
    );

    dynamicBarrels.push({
        model: barrel,
        body: body,
        offset: modelOffset
    });
}
/* ===============================
   DECORACIÓN DEL NIVEL 1
   Cable industrial de prueba
================================ */

loader.load(
    "./assets/models/decoration/Prop_Cable_3.gltf",

    function (gltf) {

        const cable = gltf.scene;

        cable.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });

        // Posición temporal para revisar el modelo
        cable.position.set(
            -8,
            0.08,
            -4.8
        );

        cable.rotation.y = Math.PI / 2;

        scene.add(cable);

        console.log(
            "Prop_Cable_3 cargado correctamente"
        );
    },

    undefined,

    function (error) {
        console.error(
            "Error cargando Prop_Cable_3:",
            error
        );
    }
);

/* ===============================
   DECORACIÓN DEL NIVEL 1
   Terminal de computadora de prueba
================================ */

loader.load(
    "./assets/models/decoration/Prop_Computer.gltf",

    function (gltf) {

        const computer = gltf.scene;

        computer.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });

        // Posición temporal para revisar tamaño y orientación
        computer.position.set(
            13.5,
            0.1,
            -5
        );

        computer.rotation.y = -Math.PI / 2;

        scene.add(computer);
        const computer2 = computer.clone(true);

        computer2.position.set(
            -13.5,
            0.1,
            4
        );

        computer2.rotation.y = Math.PI / 2;

        scene.add(computer2);

        console.log(
            "Prop_Computer cargado correctamente"
        );
    },

    undefined,

    function (error) {
        console.error(
            "Error cargando Prop_Computer:",
            error
        );
    }
);

/* ===============================
   DECORACIÓN DEL NIVEL 1
   Rejilla de ventilación industrial
================================ */

loader.load(
    "./assets/models/decoration/Prop_Vent_Big.gltf",

    function (gltf) {

        const vent = gltf.scene;

        vent.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });

        const ventPositions = [
            { x: 10.5, z: -8 },
            { x: -10.5, z: -8 },
            { x: 10.5, z: 7 }
        ];

        ventPositions.forEach((position) => {

            const ventClone = vent.clone(true);

            ventClone.position.set(
                position.x,
                0.08,
                position.z
            );

            scene.add(ventClone);
        });

        console.log(
            "Prop_Vent_Big cargado correctamente"
        );
    },

    undefined,

    function (error) {
        console.error(
            "Error cargando Prop_Vent_Big:",
            error
        );
    }
);

/* ===============================
   ANOMALÍA DE ENERGÍA - NIVEL 1
================================ */

loader.load(
    "./assets/models/anomaly/scene.gltf",

    (gltf) => {

        energyAnomaly = gltf.scene;

        energyAnomaly.position.set(
            0,
            1.2,
            3.2
        );

        scene.add(energyAnomaly);

        console.log(
            "MODELO DE ANOMALÍA CARGADO"
        );
    },

    undefined,

    (error) => {
        console.error(
            "Error cargando anomalía:",
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
            0,
            0.05,
            0
        );

        scene.add(xbot);

        if (physicsWorld) {

            const playerBodyDesc =
                RAPIER.RigidBodyDesc
                    .kinematicPositionBased()
                    .setTranslation(
                        xbot.position.x,
                        xbot.position.y,
                        xbot.position.z
                    );

            playerBody =
                physicsWorld.createRigidBody(
                    playerBodyDesc
                );

            const playerColliderDesc =
                RAPIER.ColliderDesc.capsule(
                    0.7,
                    0.45
                );

            playerCollider =
                physicsWorld.createCollider(
                    playerColliderDesc,
                    playerBody
                );

            characterController =
                physicsWorld.createCharacterController(
                    0.01
                );
            characterController.setApplyImpulsesToDynamicBodies(true);

            console.log(
                "Collider de R-0 creado correctamente"
            );
        }

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
   CONTROLES DE CÁMARA
================================ */

const controls = new OrbitControls(
    camera,
    renderer.domElement
);

// Permitir control con mouse
controls.enabled = true;

// Movimiento suave
controls.enableDamping = true;
controls.dampingFactor = 0.08;

// No permitir desplazar el punto de enfoque
controls.enablePan = false;

// Permitir zoom controlado
controls.enableZoom = true;

controls.minDistance = 3;
controls.maxDistance = 9;

// Evitar que la cámara pase por debajo del suelo
controls.minPolarAngle = Math.PI * 0.15;

// Evitar vista completamente vertical
controls.maxPolarAngle = Math.PI * 0.48;

controls.target.set(
    0,
    1.5,
    0
);
/* ===============================
   BOTÓN INICIAR
================================ */

const startButton =
    document.getElementById(
        "start-button"
    );

const terminalReady =
    document.querySelector(
        ".terminal-ready"
    );

// Bloquear inicio mientras cargan los recursos
startButton.disabled = true;

startButton.innerHTML =
    "<span>⌛</span> CARGANDO SISTEMAS...";

terminalReady.innerHTML =
    "<span></span> INICIALIZANDO REACTOR ZERO";

// Habilitar inicio cuando todos los recursos estén listos
loadingManager.onLoad = () => {

    console.log(
        "Todos los recursos del juego han terminado de cargar"
    );

    startButton.disabled = false;

    startButton.innerHTML =
        "<span>▶</span> INICIAR PROTOCOLO";

    terminalReady.innerHTML =
        "<span></span> SISTEMA LISTO // ESPERANDO OPERADOR";
};

startButton.addEventListener(
    "click",
    () => {

        document
            .getElementById(
                "start-screen"
            )
            .classList
            .add("hidden");
        const levelIntro =
            document.getElementById("level-intro");

        levelIntro.classList.remove("hidden");

        setTimeout(() => {
            levelIntro.classList.add("hidden");
        }, 1000);

        document
            .getElementById(
                "hud"
            )
            .classList
            .remove("hidden");

    }
);
const energyDisplay =
    document.getElementById("energy");
const energyFill =
    document.querySelector(".energy-fill");
const timerDisplay =
    document.getElementById("timer");

energyDisplay.textContent = r0Energy;
energyFill.style.width =
    `${r0Energy}%`;
const minutes =
    Math.floor(levelTimeRemaining / 60);

const seconds =
    levelTimeRemaining % 60;

timerDisplay.textContent =
    `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

const gameOverScreen =
    document.getElementById("game-over");

const gameOverTitle =
    document.getElementById("game-over-title");

const gameOverMessage =
    document.getElementById("game-over-message");
const restartButton =
    document.getElementById("restart-button");
restartButton.addEventListener(
    "click",
    () => {
        window.location.reload();
    }
);


const nextLevelButton =
    document.getElementById("next-level-button");

nextLevelButton.addEventListener(
    "click",
    () => {

        console.log(
            "Preparando Nivel 2 - Laboratorio"
        );

    }
);

window.addEventListener(
    "keydown",
    (event) => {

        const key = event.key.toLowerCase();

        if (key === "f" &&
            !r0Keys.f &&
            !levelCompleted && !gameOver) {
            playR0Attack();
            setTimeout(() => {

                createEnergyPulse();

            }, 2000);
            r0Keys.f = true;
        }


        if (key === "e" && r0) {

            generators.forEach((generator) => {

                const distance =
                    r0.position.distanceTo(generator.position);

                if (
                    distance < 2 &&
                    !generator.userData.activated &&
                    !generator.userData.blocked &&
                    generator.name ===
                    `Generator_${activatedGenerators + 1}`
                ) {

                    generator.userData.activated = true;

                    // Indicador luminoso de generador activado

                    generator.updateMatrixWorld(true);

                    const generatorBox =
                        new THREE.Box3().setFromObject(generator);

                    const generatorCenter =
                        new THREE.Vector3();

                    generatorBox.getCenter(generatorCenter);

                    const indicatorGeometry =
                        new THREE.BoxGeometry(
                            0.22,
                            0.06,
                            0.03
                        );

                    const indicatorMaterial =
                        new THREE.MeshBasicMaterial({
                            color: 0x00ff88,
                            toneMapped: false
                        });
                    indicatorMaterial.color.multiplyScalar(2);

                    const indicatorLight =
                        new THREE.Mesh(
                            indicatorGeometry,
                            indicatorMaterial
                        );

                    indicatorLight.position.set(
                        0,
                        1.2,
                        0.6
                    );

                    generator.add(indicatorLight);

                    activatedGenerators++;
                    // Mostrar confirmación de activación
                    notificationMessage.textContent =
                        `GENERATOR ${String(activatedGenerators).padStart(2, "0")} // ONLINE`;

                    systemNotification
                        .classList
                        .remove("hidden");

                    setTimeout(() => {

                        systemNotification
                            .classList
                            .add("hidden");

                    }, 2500);

                    document.getElementById("objectives").textContent =
                        `${activatedGenerators} / 3`;
                    if (activatedGenerators === 3) {
                        levelCompleted = true;

                        console.log(
                            "NIVEL 1 COMPLETADO - ENERGÍA RESTAURADA"
                        );
                        document
                            .getElementById("level-complete")
                            .classList.remove("hidden");

                    }

                    console.log(
                        `${generator.name} ACTIVADO`
                    );

                }

            });

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
function createEnergyPulse() {

    if (!r0) {
        return;
    }

    const pulseGeometry =
        new THREE.SphereGeometry(
            0.18,
            16,
            16
        );

    const pulseMaterial =
        new THREE.MeshBasicMaterial({
            color: 0x00d9ff,
            transparent: true,
            opacity: 0.85,
            toneMapped: false
        });

    pulseMaterial.color.multiplyScalar(2);

    const pulse =
        new THREE.Mesh(
            pulseGeometry,
            pulseMaterial
        );
    // Halo exterior del pulso
    const glowGeometry =
        new THREE.SphereGeometry(
            0.34,
            16,
            16
        );

    const glowMaterial =
        new THREE.MeshBasicMaterial({
            color: 0x008cff,
            transparent: true,
            opacity: 0.08,
            toneMapped: false,
            depthWrite: false
        });

    const glow =
        new THREE.Mesh(
            glowGeometry,
            glowMaterial
        );

    pulse.add(glow);

    // Posición inicial del pulso
    pulse.position.copy(
        r0.position
    );

    pulse.position.y += 0.9;

    // Dirección hacia donde está mirando R-0
    const direction =
        new THREE.Vector3(
            Math.sin(r0.rotation.y),
            0,
            Math.cos(r0.rotation.y)
        );
    const rightDirection =
        new THREE.Vector3(
            Math.cos(r0.rotation.y),
            0,
            -Math.sin(r0.rotation.y)
        );

    // Colocarlo ligeramente delante de R-0
    pulse.position.addScaledVector(
        direction,
        1.4
    );
    pulse.position.addScaledVector(
        rightDirection,
        -0.20
    );

    scene.add(pulse);

    energyPulses.push({
        mesh: pulse,
        direction: direction,
        speed: 12,
        distanceTraveled: 0,
        radius: 0.25,
        hasHit: false
    });
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
    if (
        !levelCompleted &&
        !gameOver
    ) {
        timerAccumulator += delta;

        if (timerAccumulator >= 1) {
            timerAccumulator -= 1;

            levelTimeRemaining--;
            if (levelTimeRemaining <= 0) {
                levelTimeRemaining = 0;
                gameOver = true;

                gameOverTitle.textContent =
                    "TIEMPO AGOTADO";

                gameOverMessage.textContent =
                    "El protocolo de recuperación no se completó a tiempo.";

                gameOverScreen
                    .classList
                    .remove("hidden");

                console.log(
                    "DERROTA - TIEMPO AGOTADO"
                );
            }

            const minutes =
                Math.floor(levelTimeRemaining / 60);

            const seconds =
                levelTimeRemaining % 60;

            timerDisplay.textContent =
                `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
        }
    }
    if (energyAnomaly) {
        energyAnomaly.rotation.y += 0.6 * delta;
    }
    if (energyAnomaly && r0) {

        const distanceToAnomaly =
            r0.position.distanceTo(
                energyAnomaly.position
            );

        if (distanceToAnomaly < 2.5) {

            const currentTime =
                performance.now();

            if (
                currentTime -
                lastAnomalyDamageTime >= 1000
            ) {
                r0Energy -= 10;

                if (r0Energy < 0) {
                    r0Energy = 0;
                }
                if (
                    r0Energy === 0 &&
                    !gameOver
                ) {
                    gameOver = true;
                    gameOverScreen.classList.remove("hidden");

                    console.log(
                        "DERROTA - ENERGÍA DE R-0 AGOTADA"
                    );
                }

                energyDisplay.textContent =
                    r0Energy;

                energyFill.style.width =
                    `${r0Energy}%`;

                lastAnomalyDamageTime =
                    currentTime;

                console.log(
                    "DAÑO DE ANOMALÍA:",
                    r0Energy
                );
            }
        }
    }

    if (r0Mixer) {
        r0Mixer.update(delta);
    }

    if (r0 && !levelCompleted &&
        !gameOver) {

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
        } else if (
            r0MoveDirection.lengthSq() > 0 &&
            playerBody &&
            playerCollider &&
            characterController
        ) {

            r0MoveDirection.normalize();

            const speed =
                r0Keys.shift
                    ? r0RunSpeed
                    : r0WalkSpeed;

            const playerPosition =
                playerBody.translation();

            const desiredMovement = {
                x:
                    r0MoveDirection.x *
                    speed *
                    delta,
                y: 0,
                z:
                    r0MoveDirection.z *
                    speed *
                    delta
            };

            characterController.computeColliderMovement(
                playerCollider,
                desiredMovement
            );

            const correctedMovement =
                characterController.computedMovement();

            playerBody.setNextKinematicTranslation({
                x:
                    playerPosition.x +
                    correctedMovement.x,
                y: playerPosition.y,
                z:
                    playerPosition.z +
                    correctedMovement.z
            });

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

    if (physicsWorld) {
        physicsWorld.step();
    }

    // ===============================
    // MOVIMIENTO DE PULSOS DE ENERGÍA
    // ===============================

    for (let i = energyPulses.length - 1; i >= 0; i--) {

        const pulse = energyPulses[i];

        const movement =
            pulse.speed * delta;

        // Detectar impacto del pulso con cajas
        const crateRaycaster =
            new THREE.Raycaster(
                pulse.mesh.position,
                pulse.direction,
                0,
                movement + pulse.radius
            );

        // Detectar impacto con la anomalía
        if (
            energyAnomaly &&
            energyAnomalyHealth > 0 &&
            !pulse.hasHit
        ) {
            const anomalyIntersections =
                crateRaycaster.intersectObject(
                    energyAnomaly,
                    true
                );

            if (anomalyIntersections.length > 0) {
                pulse.hasHit = true;
                energyAnomalyHealth--;

                console.log(
                    "VIDA ANOMALÍA:",
                    energyAnomalyHealth
                );

                if (energyAnomalyHealth <= 0) {

                    const anomalyToDestroy = energyAnomaly;

                    setTimeout(() => {

                        scene.remove(anomalyToDestroy);

                        if (energyAnomaly === anomalyToDestroy) {
                            energyAnomaly = null;
                            const generator3 =
                                generators.find(
                                    generator =>
                                        generator.name === "Generator_3"
                                );

                            if (generator3) {
                                generator3.userData.blocked = false;
                            }
                        }

                        console.log(
                            "ANOMALÍA DESTRUIDA"
                        );

                    }, 150);
                }

                console.log(
                    "PULSO IMPACTÓ LA ANOMALÍA"
                );
            }
        }

        dynamicCrates.forEach((crate) => {

            const intersections =
                crateRaycaster.intersectObject(
                    crate.model,
                    true
                );

            if (
                intersections.length > 0 &&
                !pulse.hasHit
            ) {

                pulse.hasHit = true;
                crate.body.applyImpulse(
                    {
                        x: pulse.direction.x * 18,
                        y: 6,
                        z: pulse.direction.z * 18
                    },
                    true
                );
                crate.body.applyTorqueImpulse(
                    {
                        x: pulse.direction.z * 8,
                        y: 0,
                        z: -pulse.direction.x * 8
                    },
                    true
                );

                console.log(
                    "PULSO IMPACTÓ UNA CAJA"
                );

            }

        });






        pulse.mesh.position.addScaledVector(
            pulse.direction,
            movement
        );


        pulse.distanceTraveled += movement;
        // Detectar impacto con cajas dinámicas
        const pulseRaycaster =
            new THREE.Raycaster(
                pulse.mesh.position,
                pulse.direction,
                0,
                movement + pulse.radius
            );



        // Eliminar el pulso después de recorrer 15 unidades
        if (pulse.distanceTraveled >= 15) {

            scene.remove(
                pulse.mesh
            );

            pulse.mesh.geometry.dispose();
            pulse.mesh.material.dispose();

            energyPulses.splice(
                i,
                1
            );
        }
    }
    // ===============================
    // SINCRONIZAR CAJAS CON RAPIER
    // ===============================

    dynamicCrates.forEach((crate) => {

        const position =
            crate.body.translation();

        const rotation =
            crate.body.rotation();

        crate.model.position.set(
            position.x,
            position.y,
            position.z
        );

        crate.model.quaternion.set(
            rotation.x,
            rotation.y,
            rotation.z,
            rotation.w
        );
    });
    // ===============================
    // SINCRONIZAR BARRIL CON RAPIER
    // ===============================


    dynamicBarrels.forEach((barrel) => {

        const position =
            barrel.body.translation();

        const rotation =
            barrel.body.rotation();

        barrel.model.quaternion.set(
            rotation.x,
            rotation.y,
            rotation.z,
            rotation.w
        );

        const rotatedOffset =
            barrel.offset
                .clone()
                .applyQuaternion(
                    barrel.model.quaternion
                );

        barrel.model.position.set(
            position.x + rotatedOffset.x,
            position.y + rotatedOffset.y,
            position.z + rotatedOffset.z
        );
    });

    if (r0 && playerBody) {

        const playerPosition =
            playerBody.translation();

        r0.position.set(
            playerPosition.x,
            playerPosition.y,
            playerPosition.z
        );
        // ===============================
        // INDICADOR DE INTERACCIÓN
        // ===============================

        let generatorNearby = false;

        generators.forEach((generator) => {

            const distance =
                r0.position.distanceTo(
                    generator.position
                );

            if (
                distance < 2 &&
                !generator.userData.activated &&
                !generator.userData.blocked &&
                generator.name ===
                `Generator_${activatedGenerators + 1}`
            ) {
                generatorNearby = true;
            }

        });

        if (generatorNearby) {

            interactionPrompt
                .classList
                .remove("hidden");

        } else {

            interactionPrompt
                .classList
                .add("hidden");

        }



        // La cámara mantiene su posición relativa
        // mientras sigue a R-0
        cameraLookTarget.set(
            r0.position.x,
            r0.position.y + 1.5,
            r0.position.z
        );

        controls.target.lerp(
            cameraLookTarget,
            0.12
        );
        // ===============================
        // COLISIÓN DE CÁMARA
        // ===============================

        // Dirección desde R-0 hacia la cámara
        cameraRayDirection
            .copy(camera.position)
            .sub(cameraLookTarget);

        const cameraDistance =
            cameraRayDirection.length();

        cameraRayDirection.normalize();

        // Lanzar rayo desde R-0 hacia la cámara
        cameraRaycaster.set(
            cameraLookTarget,
            cameraRayDirection
        );

        cameraRaycaster.far =
            cameraDistance;

        // Buscar paredes entre R-0 y la cámara
        const cameraIntersections =
            cameraRaycaster.intersectObjects(
                cameraObstacles,
                true
            );

        if (cameraIntersections.length > 0) {

            const hitDistance =
                cameraIntersections[0].distance;

            // Pequeño margen para evitar que
            // la cámara quede pegada a la pared
            const safeDistance =
                Math.max(
                    hitDistance - 0.35,
                    controls.minDistance
                );

            // Nueva posición antes de la pared
            const safeCameraPosition =
                new THREE.Vector3()
                    .copy(cameraLookTarget)
                    .addScaledVector(
                        cameraRayDirection,
                        safeDistance
                    );

            camera.position.copy(
                safeCameraPosition
            );
        }
    }

    if (controls.enabled) {
        controls.update();
    }

    renderer.render(
        scene,
        camera
    );

}

animate();
