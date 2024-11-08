import * as THREE from 'three';

// Set up the scene, camera, and renderer
var scene = new THREE.Scene();

var camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, .1, 3000);
camera.position.set(0, -350, 200);
camera.lookAt(new THREE.Vector3(0.0, 0.0, 0.0));
scene.add(camera);

var renderer = new THREE.WebGLRenderer({ canvas: myCanvas, antialias: true, depth: true });
renderer.shadowMap.enabled = true;
renderer.setClearColor(0x06402b);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}
animate();

// Set up the keyboard controls:
function keyHandler(e) {
    switch (e.keyCode) {
        case 87: // The 'W' key

        case 65: // The 'A' key

        case 83: // The 'S' key

        case 68: // The 'D' key
            
        case 70: // The 'F' key
            // Toggle the flashlight
            break;
    }
}