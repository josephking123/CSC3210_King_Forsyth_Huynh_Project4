import * as THREE from 'three';
import Colors from './colors.js';
import { Perlin } from './perlin.js';
import { FirstPersonControls } from 'three/addons/controls/FirstPersonControls.js';

var width = window.innerWidth;
var height = window.innerHeight;

// Set up the scene, camera, and renderer
var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera(45, width / height, 1, 5000);
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
controls.lookSpeed = 0.1;

var stats = new Stats();
stats.showPanel(0);
document.body.appendChild(stats.dom);

var light = new THREE.DirectionalLight(Colors.LightColor, 1.3);
light.position.set(camera.position.x, camera.position.y + 500, camera.position.z + 500).normalize();
scene.add(light);

// create flashlight and attach it to camera
const flashlight = new THREE.SpotLight(Colors.LightColor, 5);
flashlight.angle = Math.PI / 6;
flashlight.distance = 500;
flashlight.intensity = 5;

const spotLightHelper = new THREE.SpotLightHelper(flashlight);
scene.add(spotLightHelper);


flashlight.target.position.set(1, 1, 2);
flashlight.position.set(0, 0, 0);
// attach light to camera
camera.add(flashlight);
camera.add(flashlight.target);
scene.add(camera); // re-add camera to scene with flashlight



// boolean to track flashlight toggle
let flashlightOn = false;

// toggle flashlight on and off
function toggleFlashlight() {
    console.log("Toggling flashlight: " + flashlightOn);
    flashlightOn = !flashlightOn;
    flashlight.intensity = flashlightOn ? 1 : 0;
}

function updateFlashlightPosition() {
    flashlight.position.copy(camera.position);
}
// update the flashlight target to always point in the camera's direction
function updateFlashlightTarget() {
    flashlight.target.position.set(
        camera.position.x + 100 * Math.sin(camera.rotation.y),
        camera.position.y + 100 * Math.sin(camera.rotation.x),
        camera.position.z + 100 * Math.cos(camera.rotation.y)
    );
}



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
var peak = 20;
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
const pointer = new THREE.Vector3();
let highlightedObject = null;  // Keep track of the currently highlighted object
// Highlight material
const highlightMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00, opacity: 0.5, transparent: true });  

// Clock used to get the delta time
var clock = new THREE.Clock();
var movementSpeed = 600;
var delta = clock.getDelta();
var collision = false;

// variables to store mouse movement
let mouseMoving = false;
let lastMouseX = 0;
let lastMouseY = 0;

// setup pointer lock
const canvas = renderer.domElement;

canvas.requestPointerLock = canvas.requestPointerLock || canvas.mozRequestPointerLock || canvas.webkitRequestPointerLock;
document.exitPointerLock = document.exitPointerLock || document.mozExitPointerLock || document.webkitExitPointerLock;

// automatically request pointer lock when the canvas is clicked
canvas.addEventListener('click', () => {
    canvas.requestPointerLock();
});    

// listen for pointer lock changes
document.addEventListener('pointerlockchange', lockChangeAlert, false);
document.addEventListener('mozpointerlockchange', lockChangeAlert, false);
document.addEventListener('webkitpointerlockchange', lockChangeAlert, false);

function lockChangeAlert(){ 
    if (document.pointerLockElement === canvas || 
        document.mozPointerLockElement === canvas ||
        document.webkitPointerLockELement === canvas) {
            console.log('pointer locked');
            document.addEventListener('mousemove', onMouseMove, false);
    } else {
        console.log('pointer unlocked');
        document.removeEventListener('mousemove', onMouseMove, false);
    }
}

function onMouseMove(event) {
    mouseMoving = true;
    lastMouseX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
    lastMouseY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;
}

// custom update for the camera movement
function updateCamera() {
    if (mouseMoving) {
        // update camera rotation based on mouse movement
        const lookSpeed = 0.001;

        camera.rotation.y -= lastMouseX * lookSpeed;
        camera.rotation.x -= lastMouseY * lookSpeed;

        // clamp the x rotation to prevent camera flipping
        camera.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, camera.rotation.x));

        // reset movement flag
        mouseMoving = false;
    }
}

renderer.domElement.addEventListener('click', onClick, false);

// Raycasting and click handler
function onClick(event) {

    // calculate pointer position
    pointer.x = (event.clientX / width) * 2 - 1;
    pointer.y = -(event.clientY / height) * 2 + 1;

    // get the first object that intersects with the ray
    const intersects = raycaster.intersectObjects(scene.children, true);

    if (intersects.length > 0) {
        const clickedObject = intersects[0].object;

        // Handle removing objects on click (only branches and leaves)
        if (clickedObject.name.match("leaf") || clickedObject.name.match("branch")) {
            scene.remove(clickedObject);  // Remove the clicked object from the scene
        }
        
        // If there is a highlighted object and it's not the same as the clicked object, reset its highlight
        if (highlightedObject && highlightedObject !== clickedObject) {
            resetHighlight(highlightedObject);
        }

        // If we clicked on a highlighted object, reset its highlight (optional)
        if (highlightedObject === clickedObject) {
            resetHighlight(clickedObject);
            highlightedObject = null;  // Reset highlighted object
        }
    }
}

// Function to update the raycaster direction
function updateRaycaster() {
    // Use the camera's direction to shoot the ray
    const direction = new THREE.Vector3();
    camera.getWorldDirection(direction);

    // Set the ray's origin to the camera's position
    raycaster.ray.origin.copy(camera.position);

    // Set the ray's direction to the camera's view direction
    raycaster.ray.direction.copy(direction);
}

function update() {
    delta = clock.getDelta();
    refreshVertices();
    daylightCycle(delta);

    // Update head bobbing
    headBob();

    // custom camera update for mouse movement
    updateCamera();
    updateFlashlightPosition(); //update flashlight position
    updateFlashlightTarget(); //update flashlight direction

    // Update the raycaster direction
    updateRaycaster();

    // Raycasting
    const intersects = raycaster.intersectObjects(scene.children, true);
    let intersectedObject = null;

    // Check each tree for collision with the player
    for (let i = 0; i < intersects.length; i++) {
        // Get the intersected object
        intersectedObject = intersects[i].object;
        if (intersects[i].distance > 0 && intersects[i].distance < 10) {
            // Prevent the person from going further into the colliding object
            if (intersectedObject.name.match("branch") || intersectedObject.name.match("leaf")) {
                collision = true;
            }
            break;
            
        } else if (intersects.length > 0 && intersects[i].distance < 600) {
            collision = false;
            // Highlight the object
            if (intersectedObject.name.match("sun") || intersectedObject.name.match("moon")) {
                intersectedObject = null;
                break; // do not highlight the sun or the moon
            }
            if (intersectedObject.name.match("branch") || intersectedObject.name.match("leaf")) {
                // Apply highlight to the intersected object
                if (highlightedObject !== intersectedObject) {
                    // Remove highlight from the previous object
                    if (highlightedObject) {
                        resetHighlight(highlightedObject);
                    }
                    // Apply new highlight
                    applyHighlight(intersectedObject);
                    highlightedObject = intersectedObject;  // Update the tracked highlighted object
                }
            }
            break;  // Stop processing further intersections after highlighting
        } else {
            collision = false;
        }
    }
}

// Apply highlight effect to the object
function applyHighlight(object) {
    if (!object.userData.originalMaterial) {
        // Save the original material to revert back later
        object.userData.originalMaterial = object.material;
    }
    // Change the material to the highlight material
    object.material = highlightMaterial;
}

// Reset the highlight effect
function resetHighlight(object) {
    if (object.userData.originalMaterial) {
        // Revert back to the original material
        object.material = object.userData.originalMaterial;
        delete object.userData.originalMaterial;
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

// Head bobbing variables
let headBobAmplitude = 5; // Maximum height change
let headBobFrequency = 3; // Speed of the bobbing
let headBobOffset = 0;
var isMoving = false; // Check if the player is moving
/**
 * Head bobbing code to move the camera look at up and down (bonus)
 */
function headBob() {
    if (isMoving) {
        // Calculate head bobbing offset using sine wave
        headBobOffset = Math.sin(clock.getElapsedTime() * headBobFrequency) * headBobAmplitude;
        camera.position.y = 70 + headBobOffset;
    } else {
        // Reset to base height when not moving
        camera.position.y = 70;
    }
}

// Set up the keyboard controls:
function keyHandler(e) {
    clock.getDelta();
    // Get the camera's forward direction
    const cameraDirection = new THREE.Vector3();
    camera.getWorldDirection(cameraDirection);

    // Get the camera's right direction (to strafe left/right)
    const cameraRight = new THREE.Vector3();
    camera.getWorldDirection(cameraRight);
    cameraRight.cross(new THREE.Vector3(0, 1, 0));  // Get the right direction by crossing with up vector

    const moveDistance = movementSpeed * delta;
    isMoving = false;
    switch (e.keyCode) {
        case 87: // W
            // Move forward along camera direction
            if (!collision) {
                camera.position.add(cameraDirection.multiplyScalar(moveDistance));
            }
            isMoving = true;
            break;
        case 65: // A
            camera.position.add(cameraRight.multiplyScalar(-moveDistance));
            isMoving = true;
            break;
        case 83: // S
            // Move the player backward (opposite of camera direction)
            camera.position.add(cameraDirection.multiplyScalar(-moveDistance));
            isMoving = true;
            break;
        case 68: // D
            camera.position.add(cameraRight.multiplyScalar(moveDistance));
            isMoving = true;
            break;
        case 70: // F
            console.log("attempting to toggle flashlight");
            toggleFlashlight();
            break;
    }
}
document.addEventListener('keydown', keyHandler);

document.addEventListener('keydown', (event) => {
    if(event.key === 'Escape') {
        document.exitPointerLock();
    }
});
document.addEventListener('keyup', (event) => {
    isMoving = false;
});


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

        branch.castShadow = true; 
        branch.receiveShadow = false;

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
        branch.name = "branch";
        scene.add(branch);

        return newPosition;
    }

    createLeaf(scene, position) {
        const leafGeometry = new THREE.SphereGeometry(6, 8, 8);
        const leafMaterial = new THREE.MeshLambertMaterial({ color: 0x228B22 });
        const leaf = new THREE.Mesh(leafGeometry, leafMaterial);

        leaf.castShadow = true;  
        leaf.receiveShadow = false;

        leaf.position.set(position.x, position.y, position.z);
        leaf.castShadow = true;
        leaf.name = "leaf";
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

const rules2 = {
    "X": "F[+[>F[X]F+]<F",
    "F": "FF"
}

const rules3 = {
    "X": "F<[+[>F[X]>]+<X",
    "F": "FF"
}

const tree1 = new Tree(axiom, rules1, 4, 6, Math.PI / 6, 50);
const tree2 = new Tree(axiom, rules2, 4, 6, Math.PI / 6, 50);
const tree3 = new Tree(axiom, rules3, 4, 6, Math.PI / 6, 50);

function generateTrees(scene, numTrees, tree) {
    for (let i = 0; i < numTrees; i++) {
        const xPos = Math.random() * 1000 - 500;
        const zPos = Math.random() * 1000 - 500;
        const yPos = 0;

        tree.generateTree(scene, new THREE.Vector3(xPos, yPos, zPos));
    }
}

generateTrees(scene, 15, tree1);
generateTrees(scene, 15, tree2);
generateTrees(scene, 15, tree3);