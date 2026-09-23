import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

/* ===============================
   ESCENA
================================ */

const scene = new THREE.Scene();

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
   OBJETOS TEMPORALES
================================ */

const boxGeometry =
    new THREE.BoxGeometry(
        1,
        1,
        1
    );

const boxMaterial =
    new THREE.MeshStandardMaterial({
        color: 0xff9800
    });


for (let i = 0; i < 8; i++) {

    const box =
        new THREE.Mesh(
            boxGeometry,
            boxMaterial
        );

    box.position.set(
        Math.random() * 12 - 6,
        0.5,
        Math.random() * 12 - 6
    );

    box.castShadow = true;
    box.receiveShadow = true;

    scene.add(box);
}


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

    controls.update();

    renderer.render(
        scene,
        camera
    );

}

animate();