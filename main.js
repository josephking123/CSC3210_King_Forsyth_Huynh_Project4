import * as THREE from 'three';
import Colors from './colors.js';
import { Perlin } from './perlin.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

var width = window.innerWidth;
var height = window.innerHeight;

// Set up the scene, camera, and renderer
var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera(45, width / height, 1, 3000);
var cameraTarget = { x: 0, y: 0, z: 0 };
camera.position.y = 70;
camera.position.z = 1000;
camera.rotation.x = -15 * Math.PI / 180;
// camera.position.set(0, -350, 200);
camera.lookAt(new THREE.Vector3(0.0, 0.0, 0.0));
// scene.add(camera);

var renderer = new THREE.WebGLRenderer({ canvas: myCanvas, antialias: true, depth: true });
renderer.shadowMap.enabled = true;
renderer.setClearColor(Colors.BackgroundColor);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(width, height);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);

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
terrain.rotation.x = -Math.PI / 2;
scene.add(terrain);

var perlin = new Perlin();
var peak = 60;
var smoothing = 300;
function refreshVertices() {
    var vertices = terrain.geometry.attributes.position.array;
    for (var i = 0; i <= vertices.length; i += 3) {
        vertices[i + 2] = peak * perlin.noise(
            (terrain.position.x + vertices[i]) / smoothing,
            (terrain.position.z + vertices[i + 1]) / smoothing
        );
    }
    terrain.geometry.attributes.position.needsUpdate = true;
    terrain.geometry.computeVertexNormals();
}
// Raycasting and collision detection
const raycaster = new THREE.Raycaster();
// Create a point from the main camera looking straight
const pointer = new THREE.Vector3(0, 0, 1);

// Cast a ray from the main camera to check for intersection with the objects
raycaster.setFromCamera(pointer, camera);

const intersects = raycaster.intersectObjects(scene.children, true);
// Check each tree for collision with the player
for (let i = 0; i < intersects.length; i++) {
    if (intersects[i].distance > 0 && intersects[i].distance < 1) {
        // TODO: Prevent the person from going further into the colliding object
        break;
    }
}

// Clock used to get the delta time
var clock = new THREE.Clock();
var movementSpeed = 60;
var delta = clock.getDelta();
function update() {
    delta = clock.getDelta();
    // terrain.position.z += movementSpeed * delta;
    // camera.position.z += movementSpeed * delta;
    refreshVertices();
}

function animate() {
    stats.begin();
    update();
    renderer.render(scene, camera);
    stats.end();
    requestAnimationFrame(animate);

}
animate();

// Set up the keyboard controls:
function keyHandler(e) {
    switch (e.keyCode) {
        case 87: // The 'W' key
            delta = clock.getDelta();
            terrain.position.z += movementSpeed * delta;
            camera.position.z -= movementSpeed * delta;
            refreshVertices();
            break;
        case 65: // The 'A' key
            delta = clock.getDelta();
            terrain.position.x += movementSpeed * delta;
            camera.position.x -= movementSpeed * delta;
            refreshVertices();
            break;
        case 83: // The 'S' key
            delta = clock.getDelta();
            terrain.position.z -= movementSpeed * delta;
            camera.position.z += movementSpeed * delta;
            refreshVertices();
            break;
        case 68: // The 'D' key
            delta = clock.getDelta();
            terrain.position.x -= movementSpeed * delta;
            camera.position.x += movementSpeed * delta;
            refreshVertices();
            break;
        case 70: // The 'F' key
            // Toggle the flashlight
            break;
    }
}
document.addEventListener('keydown', keyHandler);