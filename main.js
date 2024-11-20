import * as THREE from 'three';
import Colors from './colors.js';
import { Perlin } from './perlin.js';
import { FirstPersonControls } from 'three/addons/controls/FirstPersonControls.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const width = window.innerWidth;
const height = window.innerHeight;

// Set up the scene, camera, and renderer
var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera(45, width / height, 1, 3000);
camera.position.y = 70;
camera.position.z = 1000;
camera.rotation.x = -15 * Math.PI / 180;
camera.lookAt(new THREE.Vector3(0.0, 0.0, 0.0));

var renderer = new THREE.WebGLRenderer({ canvas: myCanvas, antialias: true, depth: true });
renderer.shadowMap.enabled = true;
renderer.setClearColor(Colors.BackgroundColor);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(width, height);
document.body.appendChild(renderer.domElement);

const controls = new FirstPersonControls(camera, renderer.domElement);

var stats = new Stats();
stats.showPanel(0);
document.body.appendChild(stats.dom);

var light = new THREE.DirectionalLight(Colors.LightColor, 1.3);
light.position.set(camera.position.x, camera.position.y + 500, camera.position.z + 500).normalize();
scene.add(light);

// Setup the terrain
// Code taken from the Unit 9 Perlin Terrain Example
var geometry = new THREE.PlaneGeometry(2000, 2000, 256, 256);
const texture = new THREE.TextureLoader().load('./grass.jpg');

var material = new THREE.MeshLambertMaterial({ color: Colors.TerrainColor, map: texture });
var terrain = new THREE.Mesh(geometry, material);
terrain.name = "terrain";
terrain.rotation.x = -Math.PI / 2;
scene.add(terrain);

var perlin = new Perlin();
var peak = 30;
var smoothing = 300;
function refreshVertices() {
    let vertices = terrain.geometry.attributes.position.array;
    for (let i = 0; i <= vertices.length; i += 3) {
        vertices[i + 2] = peak * perlin.noise(
            (terrain.position.x + vertices[i]) / smoothing,
            (terrain.position.z + vertices[i + 1]) / smoothing
        );
    }
    terrain.geometry.attributes.position.needsUpdate = true;
    terrain.geometry.computeVertexNormals();
}

// adds cursor dot
document.body.style.cursor = "url('./mousedot.png'), auto";


// Lighting
// Create sunlight
var sunlight = new THREE.DirectionalLight(Colors.DayColor, 1.5);
sunlight.position.set(100, 500, 100)
sunlight.castShadow = true;
sunlight.shadow.mapSize.width = 2048;
sunlight.shadow.mapSize.height = 2048;
sunlight.shadow.camera.near = 0.5;
sunlight.shadow.camera.far = 2000;
sunlight.shadow.camera.left = -1000;
sunlight.shadow.camera.right = 1000;
sunlight.shadow.camera.top = 1000;
sunlight.shadow.camera.bottom = -1000;

scene.add(sunlight);

// Add the sun geometry
var sunGeometry = new THREE.SphereGeometry(50, 32, 32);
var sunMaterial = new THREE.MeshBasicMaterial({ color: Colors.SunColor });
var sunMesh = new THREE.Mesh(sunGeometry, sunMaterial);
sunMesh.position.set(1000, 500, 1000); // Initial position for sun
sunMesh.name = "sun";
scene.add(sunMesh);

// Add the moon light
var moonlight = new THREE.DirectionalLight(Colors.NightColor, 0.3);
moonlight.position.set(-1000, -500, -1000);
scene.add(moonlight);

// Add the moon geometry
var moonGeometry = new THREE.SphereGeometry(50, 32, 32);
var moonMaterial = new THREE.MeshBasicMaterial({ color: Colors.MoonColor });
var moonMesh = new THREE.Mesh(moonGeometry, moonMaterial);
moonMesh.position.set(-1000, -500, -1000); // Initial position for moon
moonMesh.name = "moon";
scene.add(moonMesh);

// Enable shadows for the terrain
terrain.castShadow = false;
terrain.receiveShadow = true;

// Function to update the sky color based on the sun's height
function updateSkyColor() {
    // Calculate a blend factor based on the sun’s Y position
    let sunHeight = sunMesh.position.y;
    let blendFactor;
    if (sunHeight > 0) {
        // Sun is above horizon - interpolate between day and dusk colors
        blendFactor = Math.max(0, Math.min(1, sunHeight / 500));
        scene.background = new THREE.Color(Colors.DayColor).clone().lerp(new THREE.Color(Colors.DawnDuskColor), 1 - blendFactor);
    } else {
        // Sun is below horizon - interpolate between dusk and night colors
        blendFactor = Math.max(0, Math.min(1, (sunHeight + 500) / 500));
        scene.background = new THREE.Color(Colors.DawnDuskColor).clone().lerp(new THREE.Color(Colors.NightColor), 1 - blendFactor);
    }

}
const cycleSpeed = (Math.PI / 12) / 10; // Speed of day-night cycle, 15 degrees (pi/12 radians) every 10 seconds

function daylightCycle(delta) {
    // Get the current angle based on delta time
    // let angleDelta = cycleSpeed * delta;
    let currentAngle = clock.getElapsedTime() * cycleSpeed;

    // Move the sun and moon in a circular path
    sunMesh.position.x = 1000 * Math.cos(currentAngle);
    sunMesh.position.y = 500 * Math.sin(currentAngle);
    sunMesh.position.z = 1000 * Math.sin(currentAngle);

    moonMesh.position.x = -sunMesh.position.x;
    moonMesh.position.y = -sunMesh.position.y;
    moonMesh.position.z = -sunMesh.position.z;

    // Sync sunlight with sun and moonlight with moon
    sunlight.position.copy(sunMesh.position);
    moonlight.position.copy(moonMesh.position);

    // Adjust light intensity for day and night
    let sunHeight = sunMesh.position.y;
    sunlight.intensity = Math.max(0.1, sunHeight / 500); // Sunlight fades as it approaches horizon
    moonlight.intensity = Math.max(0.3, (250 - sunHeight) / 500); // Moonlight increases as sun sets

    // Update the sky color based on the sun's position
    updateSkyColor();
}

// Raycasting and collision detection
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

function onPointerMove(event) {
    // calculate pointer position in normalized device coordinates
    // (-1 to +1) for both components

    pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
    pointer.y = - (event.clientY / window.innerHeight) * 2 + 1;

}

// Clock used to get the delta time
var clock = new THREE.Clock();
var movementSpeed = 60;
var delta = clock.getDelta();
function update() {
    delta = clock.getDelta();
    controls.update(movementSpeed * delta);
    refreshVertices();
    daylightCycle(delta);

    raycaster.setFromCamera(pointer, camera);
    const intersects = raycaster.intersectObjects(scene.children);
    // Check each tree for collision with the player
    for (let i = 0; i < intersects.length; i++) {
        if (intersects[i].distance > 0 && intersects[i].distance < 1) {
            // TODO: Prevent the person from going further into the colliding object
            if (object.name.match("tree")) {

            }
            break;
        }
        else if (intersects.length > 0) {
            // Highlight the object
            var object = intersects[0].object;
            if (object.name.match("sun") || object.name.match("moon")) {
                break; // do not highlight the sun or the moon
            }
            object.material.color.set(Math.random() * 0xffffff);
            break;
        }
    }
}

function animate() {
    stats.begin();
    update();
    renderer.render(scene, camera);
    stats.end();
    requestAnimationFrame(animate);

}
animate();
window.addEventListener('pointermove', onPointerMove);

var headPosition = 0, increase = true;
/**
 * Head bobbing code to move the camera look at up and down (bonus)
 */
function headBob() {
    if (increase) {
        if (headPosition <= 100) {
            headPosition += 20;
        } else {
            increase = false;
            headPosition += 20;
        }
    } else {
        if (headPosition >= -100) {
            headPosition -= 20;
        } else {
            increase = true;
            headPosition += 20;
        }
    }
    camera.lookAt(new THREE.Vector3(0.0, 0.0, headPosition));
}

// Set up the keyboard controls:
function keyHandler(e) {
    switch (e.keyCode) {
        case 87: // W
            // delta = clock.getDelta();
            // terrain.position.z += movementSpeed * delta;
            camera.position.z -= 6;
            headBob();
            refreshVertices();
            break;
        case 65: // A
            // delta = clock.getDelta();
            // terrain.position.x += movementSpeed * delta;
            camera.position.x -= 6;
            refreshVertices();
            break;
        case 83: // S
            // delta = clock.getDelta();
            // terrain.position.z -= movementSpeed * delta;
            camera.position.z += 6;
            refreshVertices();
            break;
        case 68: // D
            // delta = clock.getDelta();
            // terrain.position.x -= movementSpeed * delta;
            camera.position.x += 6;
            refreshVertices();
            break;
        case 70: // F
            // Toggle the flashlight
            break;
    }
}
document.addEventListener('keydown', keyHandler);