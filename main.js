import * as THREE from 'three';
import Colors from './colors.js';
import { Perlin } from './perlin.js';
import { FirstPersonControls } from 'three/addons/controls/FirstPersonControls.js';
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

const centerDot = document.createElement('div');
centerDot.id = 'centerDot';
document.body.appendChild(centerDot);

// remove the default cursor
document.body.style.cursor = 'none';


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
            // object.material.color.set(Math.random() * 0xffffff);
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

class Tree {
    constructor(axiom, rules, iterations, branchLength, angleIncrement, leafIterationThreshold) {
        this.lSystem = new LSystem(axiom, rules, iterations);
        this.branchLength = branchLength;
        this.angleIncrement = angleIncrement;
        this.leafIterationThreshold = leafIterationThreshold; 

        // Generate the L-system string
        this.lSystem.generate();
    }

    createBranch(scene, position, anglePitch, angleYaw, length) {
        const branchGeometry = new THREE.CylinderGeometry(1, 1, length, 8);
        const branchMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        const branch = new THREE.Mesh(branchGeometry, branchMaterial);

        const branchDirection = new THREE.Vector3();
        branchDirection.x = Math.sin(angleYaw) * Math.cos(anglePitch);
        branchDirection.y = Math.sin(anglePitch);
        branchDirection.z = Math.cos(angleYaw) * Math.cos(anglePitch);

        const newPosition = position.clone().add(branchDirection.multiplyScalar(length));

        branch.position.set(newPosition.x, newPosition.y + length / 2, newPosition.z);

        const direction = new THREE.Vector3(Math.sin(angleYaw) * Math.cos(anglePitch), Math.sin(anglePitch), Math.cos(angleYaw) * Math.cos(anglePitch));
        const up = new THREE.Vector3(0, 1, 0);  
        const axis = new THREE.Vector3().crossVectors(up, direction).normalize();
        const angleToRotate = Math.acos(up.dot(direction));  

        branch.rotation.setFromRotationMatrix(new THREE.Matrix4().makeRotationAxis(axis, angleToRotate));

        branch.castShadow = true;
        scene.add(branch);

        return newPosition; 
    }

    createLeaf(scene, position) {
        const leafGeometry = new THREE.SphereGeometry(6, 8, 8);  
        const leafMaterial = new THREE.MeshLambertMaterial({ color: 0x228B22 }); 
        const leaf = new THREE.Mesh(leafGeometry, leafMaterial);

        leaf.position.set(position.x, position.y, position.z);
        leaf.castShadow = true;
        scene.add(leaf);
    }

    generateTree(scene, position) {
        const stack = [];  
    
        let anglePitch = Math.PI / 2;  
        let angleYaw = 0;  
        let iterationCount = 0;  

        for (let char of this.lSystem.result) {
            if (char === 'F') {
                position = this.createBranch(scene, position, anglePitch, angleYaw, this.branchLength);

                if (iterationCount >= this.leafIterationThreshold) {
                    this.createLeaf(scene, position);
                }
            } else if (char === '+') {
                angleYaw -= this.angleIncrement;
            } else if (char === '-') {
                angleYaw += this.angleIncrement;
            } else if (char === '<') {
                anglePitch -= this.angleIncrement;
            } else if (char === '>') {
                anglePitch += this.angleIncrement;
            } else if (char === '[') {
                stack.push({ position: position.clone(), anglePitch: anglePitch, angleYaw: angleYaw });
            } else if (char === ']') {
                const state = stack.pop();
                position = state.position;
                anglePitch = state.anglePitch;
                angleYaw = state.angleYaw;
            }

            iterationCount++;
        }
    }    
}

const axiom = "X";
const rules1 = {
    "X": "F<[-[+X>]>-F>]+[<X+]>X",
    "F": "FF",
};

const tree1 = new Tree(axiom, rules1, 4, 6, Math.PI / 6, 50);  

function generateRandomTrees(scene, numTrees) {
    for (let i = 0; i < numTrees; i++) {
        const xPos = Math.random() * 1000 - 500;  
        const zPos = Math.random() * 1000 - 500;  
        const yPos = 50;  

        tree1.generateTree(scene, new THREE.Vector3(xPos, yPos, zPos));  
    }
}

generateRandomTrees(scene, 10);