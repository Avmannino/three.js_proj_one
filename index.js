import * as THREE from 'three';
import { GLTFLoader } from './libs/GLTFLoader.js';
import { PointerLockControls } from './libs/PointerLockControls.js';
import { GPUStatsPanel } from './libs/GPUStatsPanel.js';
import Stats from './libs/stats.module.js'; // Import stats.js if not already in GPUStatsPanel
import { Sky } from './libs/Sky.js';
// import { GUI } from './libs/lil-gui.module.min.js';

let camera, scene, renderer;
let sky, sun;



function init() {
    // Camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 9000000); // Adjusted near plane from 0.01 to 1
    camera.position.set(-15, 1.6, 70);  // Position the camera at the height of an average person

    // Scene
    scene = new THREE.Scene();

    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.sortObjects = false; // Added this line to prevent z-fighting
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
    let moveUp = false;
    let moveDown = false;
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
            case 'KeyQ':
                moveUp = false;
                break;
            case 'KeyE':
                moveDown = false;
                break;
        }
    };

    const onMouseDown = function (event) {
        switch (event.button) {
            case 0: // Left button
                moveUp = true;
                break;
            case 2: // Right button
                moveDown = true;
                break;
        }
    };

    const onMouseUp = function (event) {
        switch (event.button) {
            case 0: // Left button
                moveUp = false;
                break;
            case 2: // Right button
                moveDown = false;
                break;
        }
    };

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('mouseup', onMouseUp);

    // Add lights
    const ambientLight = new THREE.AmbientLight(0x603B06, 2.7);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xCB8013, 15);
    directionalLight.position.set(-9000, 0, 0);  // Position the light to the right, above, and in front of the scene
    directionalLight.target.position.set(0, 0, 5000);  // Target the light at the center of the scene
    scene.add(directionalLight);
    scene.add(directionalLight.target);

    // Load multiple GLTF Models
    const gltfLoader = new GLTFLoader();

    // First Model
    gltfLoader.load('assets/coast_sand_rocks_02_4k.gltf', function (gltf) {
        const model = gltf.scene;
        model.position.x = -50000;
        model.position.y = 350000; // Adjust this value to move the model higher in the sky
        model.position.z = -800500;
        model.scale.set(1300, 1300, 1300); // Scale the model by a factor of 35
        scene.add(model);
    }, undefined, function (error) {
        console.error('An error occurred while loading the GLTF file:', error);
    });

    // Second Model
    gltfLoader.load('assets/planet_two.gltf', function (gltf) {
        const model = gltf.scene;
        model.position.x = -285000;  // Adjust position for the second model
        model.position.y = 205000; // Adjust height for the second model
        model.position.z = 5000; // Adjust depth for the second model
        model.scale.set(4050, 4050, 4050); // Scale the second model
        scene.add(model);
    }, undefined, function (error) {
        console.error('An error occurred while loading the GLTF file:', error);
    });

    // Third Model
    gltfLoader.load('assets/planet_three.gltf', function (gltf) {
        const model = gltf.scene;
        model.position.x = -185000;  // Adjust position for the second model
        model.position.y = 155000; // Adjust height for the second model
        model.position.z = 5000; // Adjust depth for the second model
        model.scale.set(4050, 4050, 4050); // Scale the second model
        scene.add(model);
    }, undefined, function (error) {
        console.error('An error occurred while loading the GLTF file:', error);
    });

    // Start animation
    animate();

    // Initialize sky
    initSky();

    // Initialize floor
    initFloor();

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
    direction.y = Number(moveDown) - Number(moveUp);
    direction.normalize(); // this ensures consistent movements in all directions

    if (moveForward || moveBackward) velocity.z -= direction.z * 500000.0 * delta;
    if (moveLeft || moveRight) velocity.x -= direction.x * 50000.0 * delta;
    if (moveUp || moveDown) velocity.y -= direction.y * 5000.0 * delta;

    controls.moveRight(-velocity.x * delta);
    controls.moveForward(-velocity.z * delta);
    controls.getObject().position.y += (velocity.y * delta); // Handle up/down movement

    if (controls.getObject().position.y < 1.6) {
        velocity.y = 0;
        controls.getObject().position.y = 1.6;
        canJump = true;
    }

    // Update stats
    stats.update();

    // Render scene
    renderer.render(scene, camera);

    prevTime = time;
}
}

function initSky() {
    // Add Sky
    sky = new Sky();
    sky.scale.setScalar(3000000); // Increase the scale to make the sky dome larger
    sky.position.y = 5000; // Raise the sky dome higher up
    scene.add(sky);

    sun = new THREE.Vector3();

    // GUI
    const effectController = {
        turbidity: 0.3,
        rayleigh: 0.313,
        mieCoefficient: 0.012,
        mieDirectionalG: 0.9994,
        elevation: 0.1,
        azimuth: -120.9,
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


function initFloor() {
    const textureLoader = new THREE.TextureLoader();
    const texture = textureLoader.load('assets/textures/floor_texture.jpg');
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(100, 100);

    const floorGeometry = new THREE.PlaneGeometry(9000000, 9000000);
    const floorMaterial = new THREE.MeshStandardMaterial({ map: texture, polygonOffset: true, polygonOffsetFactor: -5, polygonOffsetUnits: -5 });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -300;
    scene.add(floor);
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

// Initialize the scene
init();
