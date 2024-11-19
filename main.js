import * as THREE from 'three';
import Colors from './colors.js';
import { Perlin } from './perlin.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

var width = window.innerWidth;
var height = window.innerHeight;

// Set up the scene, camera, and renderer
var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera(45, width / height, 1, 5000);
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

    daylightCycle(delta);
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
        case 87: // W
            delta = clock.getDelta();
            // terrain.position.z += movementSpeed * delta;
            camera.position.z -= movementSpeed * delta;
            refreshVertices();
            break;
        case 65: // A
            delta = clock.getDelta();
            // terrain.position.x += movementSpeed * delta;
            camera.position.x -= movementSpeed * delta;
            refreshVertices();
            break;
        case 83: // S
            delta = clock.getDelta();
            // terrain.position.z -= movementSpeed * delta;
            camera.position.z += movementSpeed * delta;
            refreshVertices();
            break;
        case 68: // D
            delta = clock.getDelta();
            // terrain.position.x -= movementSpeed * delta;
            camera.position.x += movementSpeed * delta;
            refreshVertices();
            break;
        case 70: // F
            // Toggle the flashlight
            break;
    }
}
document.addEventListener('keydown', keyHandler);

class LSystem {
    constructor(axiom, rules, iterations) {
        this.axiom = axiom;
        this.rules = rules;
        this.iterations = iterations;
        this.result = axiom;
    }

    // Generate the L-system string
    generate() {
        let result = this.axiom;
        for (let i = 0; i < this.iterations; i++) {
            let nextResult = '';
            for (let char of result) {
                nextResult += this.rules[char] || char;
            }
            result = nextResult;
        }
        this.result = result;
    }
}

// Tree generation
class Tree {
    constructor(axiom, rules, iterations, scale, angleIncrement, branchLength) {
        this.lSystem = new LSystem(axiom, rules, iterations);
        this.scale = scale;
        this.angleIncrement = angleIncrement;
        this.branchLength = branchLength;

        this.lSystem.generate();
    }

    createBranch(scene, position, angle, length, depth = 0) {
        if (depth > 5 || length < 1) return;

        const branchGeometry = new THREE.CylinderGeometry(1, 1, length, 8);
        const branchMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        const branch = new THREE.Mesh(branchGeometry, branchMaterial);
        branch.position.set(position.x, position.y + length / 2, position.z);
        branch.rotation.z = angle;
        branch.castShadow = true;
        scene.add(branch);

        if (depth > 3 && length < 6) {
            const leafGeometry = new THREE.SphereGeometry(3, 8, 8);
            const leafMaterial = new THREE.MeshLambertMaterial({ color: 0x228B22 });
            const leaves = new THREE.Mesh(leafGeometry, leafMaterial);
            leaves.position.set(position.x, position.y + length, position.z);
            scene.add(leaves);
        }

        this.createBranch(scene, new THREE.Vector3(position.x, position.y + length, position.z), angle + this.angleIncrement, length * 0.7, depth + 1);
        this.createBranch(scene, new THREE.Vector3(position.x, position.y + length, position.z), angle - this.angleIncrement, length * 0.7, depth + 1);
    }

    generateTree(scene) {
        const initialPosition = new THREE.Vector3(0, 0, 0);
        this.createBranch(scene, initialPosition, 0, this.branchLength, 0);
    }
}

// Create a tree
const axiom = "X";
const rules = {
   "X": "F+[[X]-X]-F[-FX]+X",
   "F": "FF"
};

const tree = new Tree(axiom, rules, 5, 1, Math.PI / 6, 20);
tree.generateTree(scene);
