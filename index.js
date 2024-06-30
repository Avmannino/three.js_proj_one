import * as THREE from 'three';
import { GLTFLoader } from './libs/GLTFLoader.js';
import { PointerLockControls } from './libs/PointerLockControls.js';
import { Sky } from './libs/Sky.js';
// import { Water } from './libs/Water2.js';

let camera, scene, renderer;
let sky, sun, water;
let controls;
let velocity, direction, moveForward, moveBackward, moveLeft, moveRight, moveUp, moveDown, canJump, prevTime;
let waterRocksModels = []; // Array to store multiple instances of the loaded model
let mountainsideModels = []; // Array to store multiple instances of the new loaded model

function loadModel(url, position, scale, scene, rotation) {
    const gltfLoader = new GLTFLoader();

    gltfLoader.load(url, function (gltf) {
        const model = gltf.scene;
        model.position.copy(position);
        model.scale.set(scale, scale, scale);

        if (rotation) {
            model.rotation.copy(rotation);
        }

        scene.add(model);
    }, undefined, function (error) {
        console.error(`An error occurred while loading the model from the GLTF file:`, error);
    });
}

function animate() {
    requestAnimationFrame(animate);

    const time = performance.now();
    const delta = (time - prevTime) / 1000;

    velocity.x -= velocity.x * 10.0 * delta;
    velocity.z -= velocity.z * 10.0 * delta;
    velocity.y -= 9.8 * 100.0 * delta;

    direction.z = Number(moveForward) - Number(moveBackward);
    direction.x = Number(moveRight) - Number(moveLeft);
    direction.y = Number(moveDown) - Number(moveUp);
    direction.normalize();

    if (moveForward || moveBackward) velocity.z -= direction.z * 3500000.0 * delta;
    if (moveLeft || moveRight) velocity.x -= direction.x * 150000.0 * delta;
    if (moveUp || moveDown) velocity.y -= direction.y * 10000.0 * delta;

    controls.moveRight(-velocity.x * delta);
    controls.moveForward(-velocity.z * delta);
    controls.getObject().position.y += velocity.y * delta;

    if (controls.getObject().position.y < 1.6) {
        velocity.y = 0;
        controls.getObject().position.y = 1.6;
        canJump = true;
    }


    // Update water if available
    if (water && water.material && water.material.uniforms && water.material.uniforms['time']) {
        water.material.uniforms['time'].value += delta;

        const mirrorCamera = water.material.uniforms['mirrorCamera'].value;
        mirrorCamera.position.copy(camera.position);
        mirrorCamera.position.y = -camera.position.y + 2 * water.position.y;
        mirrorCamera.updateMatrixWorld();
        mirrorCamera.lookAt(0, water.position.y, 0);
    }

    // Animate all waterRocksModels in the array
    waterRocksModels.forEach((model) => {
        model.rotation.y += 0.00; // Example of animation
    });

    // Animate all newAssetModels in the array
    mountainsideModels.forEach((model) => {
        model.rotation.y += 0.00; // Example of animation
    });

    renderer.render(scene, camera);

    prevTime = time;
}

function init() {
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 10000000);
    camera.position.set(-15, 10.6, 70);

    scene = new THREE.Scene();

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.sortObjects = false;
    document.body.appendChild(renderer.domElement);

    controls = new PointerLockControls(camera, document.body);
    document.body.addEventListener('click', () => {
        controls.lock();
    });

    velocity = new THREE.Vector3();
    direction = new THREE.Vector3();
    moveForward = false;
    moveBackward = false;
    moveLeft = false;
    moveRight = false;
    moveUp = false;
    moveDown = false;
    canJump = false;
    prevTime = performance.now();

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('mouseup', onMouseUp);

    const ambientLight = new THREE.AmbientLight(0xf1a6e5, 3);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xCB8013, 15);
    directionalLight.position.set(-9000, 0, 0);
    directionalLight.target.position.set(0, 0, 5000);
    scene.add(directionalLight);
    scene.add(directionalLight.target);

    const gltfLoader = new GLTFLoader();

    gltfLoader.load('assets/coast_sand_rocks_02_4k.gltf', function (gltf) {
        const model = gltf.scene;
        model.position.set(250000, 2500000, -800500);
        model.scale.set(2300, 2300, 2300);
        scene.add(model);
    }, undefined, function (error) {
        console.error('An error occurred while loading the GLTF file:', error);
    });

    gltfLoader.load('assets/planet_two.gltf', function (gltf) {
        const model = gltf.scene;
        model.position.set(-685000, 255000, 5000);
        model.scale.set(4050, 4050, 4050);
        scene.add(model);
    }, undefined, function (error) {
        console.error('An error occurred while loading the GLTF file:', error);
    });

    gltfLoader.load('assets/planet_three.gltf', function (gltf) {
        const model = gltf.scene;
        model.position.set(-185000, 200000, 5000);
        model.scale.set(4050, 4050, 4050);
        scene.add(model);
    }, undefined, function (error) {
        console.error('An error occurred while loading the GLTF file:', error);
    });

    // Load multiple instances using the loadModel function
    // const rotation1 = new THREE.Euler(0, Math.PI / 2, 0);  // Rotate 90 degrees around y-axis
    // loadModel('assets/water_rocks.gltf', new THREE.Vector3(-80000, -120, -50000), 2050, scene, rotation1);

    // loadModel('assets/water_rocks.gltf', new THREE.Vector3(-100000, -120, -36000), 2050, scene);
    // loadModel('assets/water_rocks.gltf', new THREE.Vector3(-100000, -120, -18000), 2050, scene);
    // loadModel('assets/water_rocks.gltf', new THREE.Vector3(-100000, -120, 5000), 2050, scene);
    // loadModel('assets/water_rocks.gltf', new THREE.Vector3(-100000, -120, 25000), 2050, scene);

    // Load multiple instances of the new asset
    loadModel('assets/mountainside.gltf', new THREE.Vector3(-3500000, 100, -3500000), 10000, scene); // 1
    loadModel('assets/mountainside.gltf', new THREE.Vector3(-2200000, 100, -3500000), 10000, scene); // 2
    loadModel('assets/mountainside.gltf', new THREE.Vector3(-900000, 100, -3500000), 10000, scene); // 3
    loadModel('assets/mountainside.gltf', new THREE.Vector3(400000, 100, -3500000), 10000, scene); // 4
    loadModel('assets/mountainside.gltf', new THREE.Vector3(1900000, 100, -3500000), 10000, scene); // 5

    loadModel('assets/mountainside.gltf', new THREE.Vector3(3500000, 100, -3500000), 10000, scene); // 6

    loadModel('assets/mountainside.gltf', new THREE.Vector3(3800000, 100, -2200000), 10000, scene); // 1
    loadModel('assets/mountainside.gltf', new THREE.Vector3(3800000, 100, -600000), 10000, scene); // 2
    loadModel('assets/mountainside.gltf', new THREE.Vector3(3800000, 100, 950000), 10000, scene); // 3
    loadModel('assets/mountainside.gltf', new THREE.Vector3(3800000, 100, 2200000), 10000, scene); // 4
    loadModel('assets/mountainside.gltf', new THREE.Vector3(3800000, 100, 3700000), 10000, scene); // 5

    animate();
    initSky();
    initFloor();
    // initWater();
    window.addEventListener('resize', onWindowResize);
    document.addEventListener('wheel', onDocumentMouseWheel, false);
}

function initSky() {
    sky = new Sky();
    sky.scale.setScalar(8200000);
    sky.position.y = 5000;
    scene.add(sky);

    sun = new THREE.Vector3();

    function guiChanged() {
        const uniforms = sky.material.uniforms;
        uniforms['turbidity'].value = 10;
        uniforms['rayleigh'].value = 2;
        uniforms['mieCoefficient'].value = 0.005;
        uniforms['mieDirectionalG'].value = 0.8;

        const phi = THREE.MathUtils.degToRad(90 - 0.2);
        const theta = THREE.MathUtils.degToRad(-30);

        sun.setFromSphericalCoords(1, phi, theta);

        uniforms['sunPosition'].value.copy(sun);

        renderer.render(scene, camera);
    }

    guiChanged();
}

function initFloor() {
    const textureLoader = new THREE.TextureLoader();
    const texture = textureLoader.load('assets/floor_texture_1.jpg');

    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(5, 5);

    const floorGeometry = new THREE.PlaneGeometry(8000000, 8000000);
    const floorMaterial = new THREE.MeshStandardMaterial({
        map: texture,
        polygonOffset: true,
        polygonOffsetFactor: -2,
        polygonOffsetUnits: -2
    });

    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -1000;
    scene.add(floor);
}

// function initWater() {
//     const waterGeometry = new THREE.PlaneGeometry(200000, 100000);

//     water = new Water(
//         waterGeometry,
//         {
//             textureWidth: 512,
//             textureHeight: 512,
//             waterNormals: new THREE.TextureLoader().load('assets/textures/waternormals.jpg', function (texture) {
//                 texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
//             }),
//             sunDirection: new THREE.Vector3(),
//             sunColor: 0xFFB200,
//             waterColor: 0x0097FF,
//             distortionScale: 6,
//             fog: scene.fog !== false,
//         }
//     );

//     water.rotation.x = -Math.PI / 2;
//     water.material.uniforms.time = { value: 0 };

//     water.position.set(0, 175, 250);
//     scene.add(water);

//     const mirrorCamera = new THREE.PerspectiveCamera();
//     water.material.uniforms.mirrorCamera = { value: mirrorCamera };

//     const rotationMatrix = new THREE.Matrix4().makeRotationX(water.rotation.x);
//     const normal = new THREE.Vector3(0, 1, 0);

//     mirrorCamera.up.set(0, 1, 0).applyMatrix4(rotationMatrix).reflect(normal);
// }

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    render();
}

function render() {
    renderer.render(scene, camera);
}

function onKeyDown(event) {
    switch (event.code) {
        case 'ArrowUp':
        case 'KeyW':
            moveForward = true;
            break;
        case 'ArrowLeft':
        case 'KeyA':
            moveLeft = true;
            break;
        case 'ArrowDown':
        case 'KeyS':
            moveBackward = true;
            break;
        case 'ArrowRight':
        case 'KeyD':
            moveRight = true;
            break;
        case 'KeyQ':
            moveUp = true;
            break;
        case 'KeyE':
            moveDown = true;
            break;
        case 'Space':
            if (canJump === true) velocity.y += 1000;
            canJump = false;
            break;
    }
}

function onKeyUp(event) {
    switch (event.code) {
        case 'ArrowUp':
        case 'KeyW':
            moveForward = false;
            break;
        case 'ArrowLeft':
        case 'KeyA':
            moveLeft = false;
            break;
        case 'ArrowDown':
        case 'KeyS':
            moveBackward = false;
            break;
        case 'ArrowRight':
        case 'KeyD':
            moveRight = false;
            break;
        case 'KeyQ':
            moveUp = false;
            break;
        case 'KeyE':
            moveDown = false;
            break;
    }
}

function onMouseDown(event) {
    switch (event.button) {
        case 0:
            moveUp = true;
            break;
        case 2:
            moveDown = true;
            break;
    }
}

function onMouseUp(event) {
    switch (event.button) {
        case 0:
            moveUp = false;
            break;
        case 2:
            moveDown = false;
            break;
    }
}

function onDocumentMouseWheel(event) {
    camera.fov += event.deltaY * 0.05;
    camera.fov = THREE.MathUtils.clamp(camera.fov, 20, 150);
    camera.updateProjectionMatrix();
}

init();
