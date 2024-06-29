import * as THREE from 'three';
import { GLTFLoader } from './libs/GLTFLoader.js';
import { PointerLockControls } from './libs/PointerLockControls.js';
import { GPUStatsPanel } from './libs/GPUStatsPanel.js';
import Stats from './libs/stats.module.js'; // Import stats.js if not already in GPUStatsPanel
import { Sky } from './libs/Sky.js';
// import { GUI } from './libs/lil-gui.module.min.js';

let camera, scene, renderer;
let sky, sun;

// Initialize the scene
init();
animate();

function init() {
    // Camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.01, 1200);
    camera.position.set(-15, 1.6, 70);  // Position the camera at the height of an average person

    // Scene
    scene = new THREE.Scene();

    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.outputEncoding = THREE.sRGBEncoding;
    document.body.appendChild(renderer.domElement);

    // Add PointerLockControls
    const controls = new PointerLockControls(camera, document.body);
    document.body.addEventListener('click', () => {
        controls.lock();
    });

    // Add stats
    const stats = new Stats();
    stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
    const gpuPanel = new GPUStatsPanel(renderer.getContext());
    stats.addPanel(gpuPanel);
    stats.showPanel(0); // Show the GPU panel
    document.body.appendChild(stats.dom);

    // Movement variables
    const velocity = new THREE.Vector3();
    const direction = new THREE.Vector3();
    let moveForward = false;
    let moveBackward = false;
    let moveLeft = false;
    let moveRight = false;
    let canJump = false;
    let prevTime = performance.now();

    const onKeyDown = function (event) {
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
            case 'Space':
                if (canJump === true) velocity.y += 350;
                canJump = false;
                break;
        }
    };

    const onKeyUp = function (event) {
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
        }
    };

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);

    // Add lights
    const ambientLight = new THREE.AmbientLight(0xFF9C3A, 8);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0x10D4FF, 2.0);
    directionalLight.position.set(0.5, 2, 3.5);
    scene.add(directionalLight);

    // Load GLTF Model
    const gltfLoader = new GLTFLoader();
    gltfLoader.load('assets/coast_sand_rocks_02_4k.gltf', function (gltf) {
        const model = gltf.scene;
        scene.add(model);
    }, undefined, function (error) {
        console.error('An error occurred while loading the GLTF file:', error);
    });

    // Initialize sky
    initSky();

    // Resize handler
    window.addEventListener('resize', onWindowResize);

    // Add mouse wheel event for zoom functionality
    document.addEventListener('wheel', onDocumentMouseWheel, false);

    function onDocumentMouseWheel(event) {
        camera.fov += event.deltaY * 0.05;
        camera.fov = THREE.MathUtils.clamp(camera.fov, 20, 150); // Limit the zoom level
        camera.updateProjectionMatrix();
    }

    // Animation loop
    function animate() {
        requestAnimationFrame(animate);

        const time = performance.now();
        const delta = (time - prevTime) / 1000;

        velocity.x -= velocity.x * 10.0 * delta;
        velocity.z -= velocity.z * 10.0 * delta;
        velocity.y -= 9.8 * 100.0 * delta; // 100.0 = mass

        direction.z = Number(moveForward) - Number(moveBackward);
        direction.x = Number(moveRight) - Number(moveLeft);
        direction.normalize(); // this ensures consistent movements in all directions

        if (moveForward || moveBackward) velocity.z -= direction.z * 400.0 * delta;
        if (moveLeft || moveRight) velocity.x -= direction.x * 400.0 * delta;

        controls.moveRight(-velocity.x * delta);
        controls.moveForward(-velocity.z * delta);

        if (controls.getObject().position.y < 1.6) {
            velocity.y = 0;
            controls.getObject().position.y = 1.6;
            canJump = true;
        }

        controls.getObject().position.y += (velocity.y * delta); // new behavior

        // Update stats
        stats.update();

        // Render scene
        renderer.render(scene, camera);

        prevTime = time;
    }

    // Start animation
    animate();
}

function initSky() {
    // Add Sky
    sky = new Sky();
    sky.scale.setScalar(100000);
    scene.add(sky);

    sun = new THREE.Vector3();

    // GUI
    const effectController = {
        turbidity: 1.3,
        rayleigh: 2.033,
        mieCoefficient: 0.041,
        mieDirectionalG: 0.999,
        elevation: 0,
        azimuth: -112,
        exposure: renderer.toneMappingExposure
    };

    function guiChanged() {
        const uniforms = sky.material.uniforms;
        uniforms['turbidity'].value = effectController.turbidity;
        uniforms['rayleigh'].value = effectController.rayleigh;
        uniforms['mieCoefficient'].value = effectController.mieCoefficient;
        uniforms['mieDirectionalG'].value = effectController.mieDirectionalG;

        const phi = THREE.MathUtils.degToRad(90 - effectController.elevation);
        const theta = THREE.MathUtils.degToRad(effectController.azimuth);

        sun.setFromSphericalCoords(1, phi, theta);

        uniforms['sunPosition'].value.copy(sun);

        renderer.toneMappingExposure = effectController.exposure;
        renderer.render(scene, camera);
    }

    // Sky Control Panel

    // const gui = new GUI();
    // gui.add(effectController, 'turbidity', 0.0, 20.0, 0.1).onChange(guiChanged);
    // gui.add(effectController, 'rayleigh', 0.0, 4, 0.001).onChange(guiChanged);
    // gui.add(effectController, 'mieCoefficient', 0.0, 0.1, 0.001).onChange(guiChanged);
    // gui.add(effectController, 'mieDirectionalG', 0.0, 1, 0.001).onChange(guiChanged);
    // gui.add(effectController, 'elevation', 0, 90, 0.1).onChange(guiChanged);
    // gui.add(effectController, 'azimuth', -180, 180, 0.1).onChange(guiChanged);
    // gui.add(effectController, 'exposure', 0, 1, 0.0001).onChange(guiChanged);

    guiChanged();
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);

    render();
}

function render() {
    renderer.render(scene, camera);
}
