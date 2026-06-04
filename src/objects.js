/**
 * src/objects.js
 * 
 * ES Module implementing the bowling alley objects:
 * 1. Bowling Ball with 3 finger holes
 * 2. Ten Bowling Pins in regulation triangular formation using LatheGeometry
 * 3. Overhead scoring monitor with a canvas-textured scoreboard and metal supports
 * 4. Camera preset transitions (keys 1-4)
 * 
 * Uses the global THREE object.
 */

/**
 * Creates a static bowling ball with 3 finger holes, positioned on the approach area.
 * 
 * @param {THREE.Scene} scene - The Three.js scene
 * @returns {THREE.Group} - The bowling ball group
 */
export function createBowlingBall(scene) {
  const ballGroup = new THREE.Group();

  // 1. Bowling ball sphere
  // Radius: 0.45 units (regulation size relative to lane and pins)
  const ballRadius = 0.45;
  const ballGeometry = new THREE.SphereGeometry(ballRadius, 64, 64);
  const ballMaterial = new THREE.MeshPhongMaterial({
    color: 0x3f0c70,      // Deep royal purple/indigo glossy finish
    shininess: 120,       // Highly glossy
    specular: 0x333333    // Reflective highlight intensity
  });
  
  const ballMesh = new THREE.Mesh(ballGeometry, ballMaterial);
  ballMesh.castShadow = true;
  ballMesh.receiveShadow = true;
  ballGroup.add(ballMesh);

  // 2. Embedded Finger Holes (two adjacent, one offset)
  // Modeled as 3 small dark cylinders embedded radially into the sphere.
  // The cylinder height is 0.08, so its center must be placed at:
  // radius - height/2 = 0.45 - 0.04 = 0.41 to make the outer face flush with the sphere.
  const holeDepth = 0.08;
  const embedDistance = ballRadius - holeDepth / 2 + 0.001; // 0.001 offset prevents z-fighting
  
  const holeMaterial = new THREE.MeshBasicMaterial({ color: 0x111111 }); // Dark grey/black inside

  // Geometries for thumb (slightly larger) and finger holes
  const thumbGeometry = new THREE.CylinderGeometry(0.045, 0.045, holeDepth, 32);
  const fingerGeometry = new THREE.CylinderGeometry(0.035, 0.035, holeDepth, 32);

  // Direction vectors pointing outward from the ball center (local space)
  // Assumes the ball's grip faces positive Z (towards the bowler/camera)
  const directions = {
    thumb: new THREE.Vector3(0.0, 0.1, 0.44).normalize(),
    middle: new THREE.Vector3(-0.08, 0.3, 0.32).normalize(),
    ring: new THREE.Vector3(0.08, 0.3, 0.32).normalize()
  };

  // Helper to create and position an embedded hole
  const createHole = (geometry, direction) => {
    const hole = new THREE.Mesh(geometry, holeMaterial);
    
    // Position at the surface, embedded radially
    hole.position.copy(direction).multiplyScalar(embedDistance);
    
    // Align cylinder Y-axis with the radial direction vector
    const defaultAxis = new THREE.Vector3(0, 1, 0);
    hole.quaternion.setFromUnitVectors(defaultAxis, direction);
    
    return hole;
  };

  ballGroup.add(createHole(thumbGeometry, directions.thumb));
  ballGroup.add(createHole(fingerGeometry, directions.middle));
  ballGroup.add(createHole(fingerGeometry, directions.ring));

  // Set position on the approach area (bottom at Y = 0.1)
  // X = 0, Y = 0.1 + radius = 0.55, Z = 10
  ballGroup.position.set(0, 0.1 + ballRadius, 10);
  
  scene.add(ballGroup);
  return ballGroup;
}

/**
 * Sets up 10 bowling pins in regulation triangular formation.
 * Each pin is 1.25 units tall, modeled with LatheGeometry, has glossy white finish,
 * and features red stripes around the neck.
 * 
 * @param {THREE.Scene} scene - The Three.js scene
 * @returns {Array<THREE.Group>} - Array containing the 10 pin groups
 */
export function setupPins(scene) {
  const pins = [];

  // 1. Define points for the bowling pin profile (LatheGeometry)
  // Height = 1.25 units. We define y from 0.0 (bottom) to 1.25 (top).
  // x is the radius of the pin at that height.
  const profilePoints = [
    new THREE.Vector2(0.0, 0.0),    // Center bottom
    new THREE.Vector2(0.12, 0.0),   // Flat base edge
    new THREE.Vector2(0.13, 0.05),  // Base curve
    new THREE.Vector2(0.16, 0.15),  // Bottom flare
    new THREE.Vector2(0.22, 0.35),  // Widest body (belly)
    new THREE.Vector2(0.18, 0.55),  // Tapering up
    new THREE.Vector2(0.11, 0.75),  // Transition to neck
    new THREE.Vector2(0.07, 0.90),  // Neck (narrowest)
    new THREE.Vector2(0.07, 0.96),  // Upper neck
    new THREE.Vector2(0.11, 1.08),  // Head (widest part of head)
    new THREE.Vector2(0.09, 1.18),  // Head tapering
    new THREE.Vector2(0.05, 1.23),  // Rounded top
    new THREE.Vector2(0.0, 1.25)    // Top center
  ];

  const pinGeometry = new THREE.LatheGeometry(profilePoints, 32);
  
  // Materials
  const pinMaterial = new THREE.MeshPhongMaterial({
    color: 0xffffff,
    shininess: 80,
    specular: 0x222222
  });

  const stripeMaterial = new THREE.MeshPhongMaterial({
    color: 0xd92323, // Vibrant red
    shininess: 80
  });

  // Pin positions (Standard triangular arrangement)
  // The bottom of the pins must sit at Y = 0.1.
  const pinPositions = [
    { x:  0.0, z: -57.000 }, // Pin 1 (Head pin)
    { x: -0.5, z: -57.866 }, // Pin 2
    { x:  0.5, z: -57.866 }, // Pin 3
    { x: -1.0, z: -58.732 }, // Pin 4
    { x:  0.0, z: -58.732 }, // Pin 5
    { x:  1.0, z: -58.732 }, // Pin 6
    { x: -1.5, z: -59.598 }, // Pin 7
    { x: -0.5, z: -59.598 }, // Pin 8
    { x:  0.5, z: -59.598 }, // Pin 9
    { x:  1.5, z: -59.598 }  // Pin 10
  ];

  pinPositions.forEach((pos, idx) => {
    const pinGroup = new THREE.Group();
    pinGroup.name = `pin_${idx + 1}`;

    // Create the lathe body
    const bodyMesh = new THREE.Mesh(pinGeometry, pinMaterial);
    bodyMesh.castShadow = true;
    bodyMesh.receiveShadow = true;
    pinGroup.add(bodyMesh);

    // Create Red Neck Stripes
    // Standard pins have two red stripes. We model these as thin cylinders
    // slightly larger than the neck radius at their respective heights to avoid z-fighting.
    
    // Top stripe (at Y = 0.95, neck radius is ~0.071, we use 0.073)
    const topStripeGeo = new THREE.CylinderGeometry(0.073, 0.073, 0.03, 32);
    const topStripe = new THREE.Mesh(topStripeGeo, stripeMaterial);
    topStripe.position.y = 0.95;
    topStripe.castShadow = true;
    topStripe.receiveShadow = true;
    pinGroup.add(topStripe);

    // Bottom stripe (at Y = 0.88, neck radius is ~0.075, we use 0.078)
    const bottomStripeGeo = new THREE.CylinderGeometry(0.078, 0.078, 0.03, 32);
    const bottomStripe = new THREE.Mesh(bottomStripeGeo, stripeMaterial);
    bottomStripe.position.y = 0.88;
    bottomStripe.castShadow = true;
    bottomStripe.receiveShadow = true;
    pinGroup.add(bottomStripe);

    // Position the pin group in the scene
    // Lathe geometry bottom starts at Y = 0. So group Y = 0.1 puts the base exactly on the lane surface.
    pinGroup.position.set(pos.x, 0.1, pos.z);
    
    scene.add(pinGroup);
    pins.push(pinGroup);
  });

  return pins;
}

/**
 * Creates an overhead score monitor hanging from the ceiling above the pins.
 * Features a high-fidelity scoreboard canvas texture and supporting metal poles.
 * 
 * @param {THREE.Scene} scene - The Three.js scene
 * @returns {THREE.Group} - The overhead monitor group
 */
export function createOverheadMonitor(scene) {
  const monitorGroup = new THREE.Group();
  monitorGroup.name = "overhead_monitor";

  // 1. Casing (Chassis) of the monitor
  const casingGeometry = new THREE.BoxGeometry(3.0, 2.0, 0.4);
  const casingMaterial = new THREE.MeshPhongMaterial({
    color: 0x1e293b,      // Slate dark-blue/grey casing
    shininess: 30
  });
  const casing = new THREE.Mesh(casingGeometry, casingMaterial);
  casing.castShadow = true;
  casing.receiveShadow = true;
  monitorGroup.add(casing);

  // 2. Screen with Dynamic Canvas Scoreboard Texture
  const screenGeometry = new THREE.PlaneGeometry(2.88, 1.88);

  // Create an off-screen canvas to draw the scoreboard
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  // Fill canvas background
  ctx.fillStyle = '#0f172a'; // Deep slate
  ctx.fillRect(0, 0, 512, 256);

  // Draw header bar
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(0, 0, 512, 55);

  // Header text
  ctx.fillStyle = '#38bdf8'; // Sky blue accent
  ctx.font = 'bold 22px Arial, sans-serif';
  ctx.fillText('LANE 4 - CHAMPIONSHIPS', 20, 36);

  // Scoreboard Grid setup
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 2;
  const gridY = 70;
  const cellWidth = 45;
  const gridX = 20;

  // Frame Numbers (1 - 10)
  ctx.fillStyle = '#94a3b8';
  ctx.font = 'bold 14px Arial, sans-serif';
  for (let i = 1; i <= 10; i++) {
    ctx.fillText(i.toString(), gridX + (i - 1) * cellWidth + 16, gridY + 22);
  }

  // Draw Grid Lines
  ctx.beginPath();
  ctx.moveTo(gridX, gridY);
  ctx.lineTo(gridX + 10 * cellWidth, gridY);
  ctx.moveTo(gridX, gridY + 30);
  ctx.lineTo(gridX + 10 * cellWidth, gridY + 30);
  ctx.moveTo(gridX, gridY + 80);
  ctx.lineTo(gridX + 10 * cellWidth, gridY + 80);

  for (let i = 0; i <= 10; i++) {
    ctx.moveTo(gridX + i * cellWidth, gridY);
    ctx.lineTo(gridX + i * cellWidth, gridY + 80);
  }
  ctx.stroke();

  // Draw Player Name
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 16px Arial, sans-serif';
  ctx.fillText('PLAYER 1', gridX, gridY + 110);

  // Mock game scores (strikes and spares!)
  ctx.fillStyle = '#f59e0b'; // Amber font
  ctx.font = 'bold 16px "Courier New", monospace';
  ctx.fillText('X', gridX + 0 * cellWidth + 28, gridY + 45); // Frame 1: Strike
  ctx.fillText('9', gridX + 1 * cellWidth + 10, gridY + 45); // Frame 2: 9 / Spare
  ctx.fillText('/', gridX + 1 * cellWidth + 28, gridY + 45);
  ctx.fillText('X', gridX + 2 * cellWidth + 28, gridY + 45); // Frame 3: Strike
  ctx.fillText('7', gridX + 3 * cellWidth + 10, gridY + 45); // Frame 4: 7 2
  ctx.fillText('2', gridX + 3 * cellWidth + 28, gridY + 45);
  ctx.fillText('X', gridX + 4 * cellWidth + 28, gridY + 45); // Frame 5: Strike

  // Frame running totals
  ctx.fillStyle = '#10b981'; // Green totals
  ctx.font = 'bold 14px Arial, sans-serif';
  ctx.fillText('20', gridX + 0 * cellWidth + 15, gridY + 70);
  ctx.fillText('40', gridX + 1 * cellWidth + 15, gridY + 70);
  ctx.fillText('59', gridX + 2 * cellWidth + 15, gridY + 70);
  ctx.fillText('68', gridX + 3 * cellWidth + 15, gridY + 70);

  // Large Total score
  ctx.fillStyle = '#f59e0b';
  ctx.font = 'bold 36px Arial, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('68', 490, 140);
  ctx.fillStyle = '#64748b';
  ctx.font = 'bold 12px Arial, sans-serif';
  ctx.fillText('TOTAL', 490, 100);

  // Bottom Banner Strike Animation text
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ef4444'; // Red banner background
  ctx.fillRect(20, 190, 472, 45);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'italic bold 24px Impact, Arial, sans-serif';
  ctx.fillText('★ STRIKE ★', 256, 222);

  // Create material with canvas texture
  const screenTexture = new THREE.CanvasTexture(canvas);
  const screenMaterial = new THREE.MeshBasicMaterial({ map: screenTexture });
  const screen = new THREE.Mesh(screenGeometry, screenMaterial);
  // Place screen slightly in front of the casing face (z = 0.2) to prevent z-fighting
  screen.position.set(0, 0, 0.201);
  monitorGroup.add(screen);

  // 3. Supporting Metal Poles (connecting the monitor to the ceiling)
  // Assuming a ceiling at Y = 10, with monitor casing centered at Y = 6.
  // The top of the casing is at Y = 7. Support poles of height 4.0 centered at Y = 3.0
  // in local space will extend exactly up to Y = 5.0 locally (which is Y = 10.0 in world space).
  const poleGeometry = new THREE.CylinderGeometry(0.04, 0.04, 4.0, 16);
  const poleMaterial = new THREE.MeshPhongMaterial({
    color: 0x94a3b8,      // Light metallic grey
    shininess: 90,
    specular: 0x444444
  });

  const leftPole = new THREE.Mesh(poleGeometry, poleMaterial);
  leftPole.position.set(-1.0, 3.0, 0.0);
  leftPole.castShadow = true;
  leftPole.receiveShadow = true;
  monitorGroup.add(leftPole);

  const rightPole = new THREE.Mesh(poleGeometry, poleMaterial);
  rightPole.position.set(1.0, 3.0, 0.0);
  rightPole.castShadow = true;
  rightPole.receiveShadow = true;
  monitorGroup.add(rightPole);

  // Position the monitor group above the pin deck
  // Center is located at Z = -55, Y = 6, X = 0
  monitorGroup.position.set(0, 6.0, -55.0);

  scene.add(monitorGroup);
  return monitorGroup;
}

/**
 * Registers keydown listeners for keys '1', '2', '3', and '4' to smoothly transition
 * the camera and orbit controls target to different viewpoints.
 * 
 * Camera Presets:
 * '1': Bowler's View (X=0, Y=5, Z=12, target: 0, 0, -30)
 * '2': Pin Close-up View (X=0, Y=2.5, Z=-53, target: 0, 0.7, -58.5)
 * '3': Top-Down View (X=0, Y=35, Z=-25, target: 0, 0, -25)
 * '4': Side View (X=15, Y=3, Z=-25, target: 0, 0, -25)
 * 
 * @param {THREE.PerspectiveCamera} camera - The application camera
 * @param {OrbitControls} controls - The interactive OrbitControls instance
 */
export function setupCameraPresets(camera, controls) {
  let transitionId = null;

  /**
   * Smoothly interpolates (tweens) camera position and controls target using a requestAnimationFrame loop.
   */
  function transitionTo(targetPos, targetLookAt) {
    // Cancel any active camera transition to prevent collision/stuttering
    if (transitionId) {
      cancelAnimationFrame(transitionId);
    }

    const startPos = camera.position.clone();
    const startLookAt = controls.target.clone();
    
    const duration = 900; // Animation duration in milliseconds
    const startTime = performance.now();

    function step(now) {
      const elapsed = now - startTime;
      const t = Math.min(elapsed / duration, 1);
      
      // Easing: Smooth Step (3t^2 - 2t^3)
      const ease = t * t * (3 - 2 * t);

      // Lerp camera position and orbit controls target
      camera.position.lerpVectors(startPos, targetPos, ease);
      controls.target.lerpVectors(startLookAt, targetLookAt, ease);
      
      // Recompute controls rotation matrix and camera projection updates
      controls.update();

      if (t < 1) {
        transitionId = requestAnimationFrame(step);
      } else {
        transitionId = null;
      }
    }
    
    transitionId = requestAnimationFrame(step);
  }

  // Bind the keydown listener
  window.addEventListener('keydown', (e) => {
    switch (e.key) {
      case '1':
        // Bowler's View: standard perspective from approach line
        transitionTo(
          new THREE.Vector3(0, 5, 12),
          new THREE.Vector3(0, 0, -30)
        );
        break;
      case '2':
        // Pin Close-up: view looking closely at pin formation
        transitionTo(
          new THREE.Vector3(0, 2.5, -53),
          new THREE.Vector3(0, 0.7, -58.5)
        );
        break;
      case '3':
        // Top-Down View: high angle looking straight down at lane mid-section
        transitionTo(
          new THREE.Vector3(0, 35, -25),
          new THREE.Vector3(0, 0, -25)
        );
        break;
      case '4':
        // Side View: side profile view from the right side of the lane
        transitionTo(
          new THREE.Vector3(15, 3, -25),
          new THREE.Vector3(0, 0, -25)
        );
        break;
    }
  });
}
