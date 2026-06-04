import {OrbitControls} from './OrbitControls.js';
import {
  createLane,
  createApproach,
  createMarkings,
  createGuttersAndBumpers,
  createBallReturn,
  createSeatingArea
} from './lane.js';
import {
  createBowlingBall,
  setupPins,
  createOverheadMonitor,
  setupCameraPresets
} from './objects.js';

// Setup Three.js Scene and Camera
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

// Setup WebGL Renderer with antialiasing
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Set deep dark space background color
scene.background = new THREE.Color(0x090d16);

// 1. Ambient Light for soft fill lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.45);
scene.add(ambientLight);

// 2. Directional Light for overhead lane illumination and casting shadows
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.95);
directionalLight.position.set(5, 25, -20);
directionalLight.castShadow = true;

// Custom light target in the center of the lane (Z = -30)
const lightTarget = new THREE.Object3D();
lightTarget.position.set(0, 0, -30);
scene.add(lightTarget);
directionalLight.target = lightTarget;

// Fine-tuned shadow camera frustum parameters to cover the whole lane (Z from Z = 15 to Z = -65)
directionalLight.shadow.camera.left = -15;
directionalLight.shadow.camera.right = 15;
directionalLight.shadow.camera.top = 40;
directionalLight.shadow.camera.bottom = -40;
directionalLight.shadow.camera.near = 0.5;
directionalLight.shadow.camera.far = 120;

// High-resolution shadow maps for sharp rendering
directionalLight.shadow.mapSize.width = 2048;
directionalLight.shadow.mapSize.height = 2048;
directionalLight.shadow.bias = -0.001; // Minimizes shadow acne artifacts

scene.add(directionalLight);

// Enable shadow mapping in renderer
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Softer, realistic shadow edges

// Create and position all 3D components
createLane(scene);
createApproach(scene);
createMarkings(scene);
const guttersAndBumpers = createGuttersAndBumpers(scene);
createBallReturn(scene);
createSeatingArea(scene);
createBowlingBall(scene);
setupPins(scene);
createOverheadMonitor(scene);

// Set initial camera position (bowler perspective)
camera.position.set(0, 5, 12);

// Orbit Controls setup
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 0, -30); // Base target is the center of the lane
controls.update();

// Setup smooth camera preset transitions (Keys '1' - '4')
setupCameraPresets(camera, controls);

let isOrbitEnabled = true;

// Apply initial preset from URL hash if specified
const initialHash = window.location.hash;
if (initialHash === '#preset=1') {
  camera.position.set(0, 5, 12);
  controls.target.set(0, 0, -30);
  isOrbitEnabled = false;
  controls.update();
} else if (initialHash === '#preset=2') {
  camera.position.set(0, 2.5, -53);
  controls.target.set(0, 0.7, -58.5);
  isOrbitEnabled = false;
  controls.update();
} else if (initialHash === '#preset=3') {
  camera.position.set(0, 35, -25);
  controls.target.set(0, 0, -25);
  isOrbitEnabled = false;
  controls.update();
} else if (initialHash === '#preset=4') {
  camera.position.set(15, 3, -25);
  controls.target.set(0, 0, -25);
  isOrbitEnabled = false;
  controls.update();
} else if (initialHash === '#preset=ball') {
  camera.position.set(1.5, 1.2, 12);
  controls.target.set(0, 0.55, 10);
  isOrbitEnabled = false;
  controls.update();
}

// Keyboard input handler
function handleKeyDown(e) {
  const key = e.key.toLowerCase();
  
  if (key === "o") {
    isOrbitEnabled = !isOrbitEnabled;
  } else if (["1", "2", "3", "4"].includes(e.key)) {
    isOrbitEnabled = false; // Cameras presets lock orbit control inputs
  } else if (key === "b") {
    // Toggle the safety lane bumpers (Bonus Feature)
    if (guttersAndBumpers && guttersAndBumpers.children) {
      // Traverse to find the bumpers group
      const bumpers = guttersAndBumpers.children.find(
        child => child.userData && typeof child.userData.toggle === 'function'
      );
      if (bumpers) {
        bumpers.userData.toggle();
        console.log(`Bumpers state toggled. Deployed: ${bumpers.userData.deployed}`);
      }
    }
  }
}

document.addEventListener('keydown', handleKeyDown);

// Handle window resizing to keep scene responsive
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Render Animation loop
function animate() {
  requestAnimationFrame(animate);

  // Update controls if orbit mode is active
  controls.enabled = isOrbitEnabled;
  controls.update();

  renderer.render(scene, camera);
}

animate();
