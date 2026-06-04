/**
 * src/lane.js
 * Bowling Alley Lane Builder Module
 * Creates the lane, approach, markings, gutters, bumpers, ball return, and seating area.
 * Designed to use the global THREE object.
 */

/**
 * Helper to create a procedural wood texture using HTML Canvas.
 * Generates individual wood planks (39 boards, standard for bowling lanes),
 * along with wood grain patterns, plank boundaries, and natural growth ring markings.
 * 
 * @param {string} type - The type of texture ('lane', 'approach', or 'pindeck')
 * @returns {THREE.CanvasTexture} - The generated Three.js texture
 */
function createProceduralWoodTexture(type) {
  const canvas = document.createElement('canvas');
  let width, height, baseColorHex;

  if (type === 'lane') {
    width = 512;
    height = 2048;
    baseColorHex = '#f5d6a8'; // Light maple wood color
  } else if (type === 'approach') {
    width = 512;
    height = 1024;
    baseColorHex = '#eac295'; // Slightly warmer/different wood shade for approach
  } else if (type === 'pindeck') {
    width = 512;
    height = 512;
    baseColorHex = '#dfa66e'; // Rich golden oak shade for the pin deck
  } else {
    width = 256;
    height = 256;
    baseColorHex = '#d2b48c';
  }

  const ctx = canvas.getContext('2d');
  
  // Fill background with base color
  ctx.fillStyle = baseColorHex;
  ctx.fillRect(0, 0, width, height);
  
  // 39 boards for a standard bowling lane
  const numBoards = 39;
  const boardWidth = width / numBoards;
  
  // Convert hex to RGB for shading calculations
  const hex = baseColorHex.replace('#', '');
  const rBase = parseInt(hex.substring(0, 2), 16);
  const gBase = parseInt(hex.substring(2, 4), 16);
  const bBase = parseInt(hex.substring(4, 6), 16);
  
  for (let i = 0; i < numBoards; i++) {
    // Deterministic pseudo-random number based on board index to create variation between planks
    const rand = Math.sin(i * 12.9898 + (type === 'lane' ? 1.0 : type === 'approach' ? 2.0 : 3.0)) * 43758.5453;
    const factor = (rand - Math.floor(rand)) * 0.12 - 0.06; // -6% to +6% shading variation
    
    const r = Math.max(0, Math.min(255, Math.floor(rBase * (1 + factor))));
    const g = Math.max(0, Math.min(255, Math.floor(gBase * (1 + factor))));
    const b = Math.max(0, Math.min(255, Math.floor(bBase * (1 + factor))));
    
    ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
    ctx.fillRect(i * boardWidth, 0, boardWidth, height);
    
    // Draw thin board separator line (simulates plank seams)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
    ctx.fillRect((i + 1) * boardWidth - 1, 0, 1, height);
    
    // Draw fine wood grain lines along the length of each board
    ctx.strokeStyle = `rgba(${Math.max(0, r - 50)}, ${Math.max(0, g - 50)}, ${Math.max(0, b - 50)}, 0.15)`;
    ctx.lineWidth = 1;
    
    const grainCount = 3;
    for (let gIdx = 0; gIdx < grainCount; gIdx++) {
      const gRand = Math.sin(i * 7.13 + gIdx * 3.45) * 43758.5453;
      const gOffset = (gRand - Math.floor(gRand)) * boardWidth;
      
      ctx.beginPath();
      let lastX = i * boardWidth + gOffset;
      ctx.moveTo(lastX, 0);
      
      const step = height / 20;
      for (let y = 0; y <= height; y += step) {
        const noiseRand = Math.sin(i * 3.21 + gIdx * 1.54 + y * 0.02) * 43758.5453;
        const drift = (noiseRand - Math.floor(noiseRand)) * (boardWidth * 0.3) - (boardWidth * 0.15);
        ctx.lineTo(i * boardWidth + gOffset + drift, y);
      }
      ctx.stroke();
    }
    
    // Periodically draw growth ring arches
    const ringRand = Math.sin(i * 15.43 + 9.87) * 43758.5453;
    const hasRing = (ringRand - Math.floor(ringRand)) > 0.5;
    if (hasRing) {
      const numRings = Math.floor((ringRand - Math.floor(ringRand)) * 3) + 2;
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.06)';
      ctx.lineWidth = 1.2;
      
      const boardCenterX = (i + 0.5) * boardWidth;
      const ringSpacing = height / 8 + (ringRand - Math.floor(ringRand)) * (height / 8);
      
      for (let rIdx = 0; rIdx < numRings; rIdx++) {
        for (let y = height / 16; y < height; y += ringSpacing) {
          ctx.beginPath();
          ctx.arc(boardCenterX, y, boardWidth * (rIdx + 1) * 0.8, 0, Math.PI, true);
          ctx.stroke();
        }
      }
    }
  }
  
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

/**
 * Creates the main bowling lane, including the pin deck.
 * Lane dimensions: 3.5 units wide, 60 units long (Z = 0 to Z = -60), 0.2 units thick.
 * Split into lane main (Z = 0 to Z = -55) and pin deck (Z = -55 to Z = -60).
 * 
 * @param {THREE.Scene} scene - The main WebGL scene
 * @returns {THREE.Group} - The lane group containing the lane and pin deck meshes
 */
export function createLane(scene) {
  const laneGroup = new THREE.Group();

  // 1. Lane Main (Z = 0 to Z = -55)
  const laneLength = 55;
  const laneGeom = new THREE.BoxGeometry(3.5, 0.2, laneLength);
  const laneTexture = createProceduralWoodTexture('lane');
  
  // Side and bottom faces use a standard wood color
  const sideMaterial = new THREE.MeshPhongMaterial({ color: 0x8b5a2b, shininess: 30 });
  // Top face uses the detailed procedural wood texture with high gloss
  const topMaterial = new THREE.MeshPhongMaterial({ 
    map: laneTexture, 
    shininess: 90, 
    specular: 0x222222 
  });
  
  const laneMaterials = [
    sideMaterial, // +X (right)
    sideMaterial, // -X (left)
    topMaterial,  // +Y (top surface)
    sideMaterial, // -Y (bottom)
    sideMaterial, // +Z (front)
    sideMaterial  // -Z (back)
  ];

  const laneMain = new THREE.Mesh(laneGeom, laneMaterials);
  laneMain.position.set(0, 0, -laneLength / 2); // Z center is at -27.5
  laneMain.castShadow = true;
  laneMain.receiveShadow = true;
  laneGroup.add(laneMain);

  // 2. Pin Deck (Z = -55 to Z = -60)
  const pinDeckLength = 5;
  const pinDeckGeom = new THREE.BoxGeometry(3.5, 0.2, pinDeckLength);
  const pinDeckTexture = createProceduralWoodTexture('pindeck');
  
  const pinDeckSideMaterial = new THREE.MeshPhongMaterial({ color: 0x5c3a21, shininess: 30 });
  const pinDeckTopMaterial = new THREE.MeshPhongMaterial({ 
    map: pinDeckTexture, 
    shininess: 70, 
    specular: 0x111111 
  });
  
  const pinDeckMaterials = [
    pinDeckSideMaterial, // +X
    pinDeckSideMaterial, // -X
    pinDeckTopMaterial,  // +Y (top surface)
    pinDeckSideMaterial, // -Y
    pinDeckSideMaterial, // +Z
    pinDeckSideMaterial  // -Z
  ];

  const pinDeck = new THREE.Mesh(pinDeckGeom, pinDeckMaterials);
  pinDeck.position.set(0, 0, -55 - (pinDeckLength / 2)); // Z center is at -57.5
  pinDeck.castShadow = true;
  pinDeck.receiveShadow = true;
  laneGroup.add(pinDeck);

  scene.add(laneGroup);
  return laneGroup;
}

/**
 * Creates the approach area (Z = 0 to Z = 15).
 * Dimensions: 3.5 units wide, 15 units long, 0.2 units thick.
 * 
 * @param {THREE.Scene} scene - The main WebGL scene
 * @returns {THREE.Mesh} - The approach area mesh
 */
export function createApproach(scene) {
  const approachLength = 15;
  const approachGeom = new THREE.BoxGeometry(3.5, 0.2, approachLength);
  const approachTexture = createProceduralWoodTexture('approach');
  
  const sideMaterial = new THREE.MeshPhongMaterial({ color: 0x8b5a2b, shininess: 30 });
  const topMaterial = new THREE.MeshPhongMaterial({ 
    map: approachTexture, 
    shininess: 50, // Approach is less glossy than the lane for safety
    specular: 0x111111 
  });
  
  const approachMaterials = [
    sideMaterial,
    sideMaterial,
    topMaterial,
    sideMaterial,
    sideMaterial,
    sideMaterial
  ];

  const approach = new THREE.Mesh(approachGeom, approachMaterials);
  approach.position.set(0, 0, approachLength / 2); // Z center is at 7.5
  approach.castShadow = true;
  approach.receiveShadow = true;

  scene.add(approach);
  return approach;
}

/**
 * Creates lane markings:
 * - Foul line (thin red line at Z = 0)
 * - Targeting arrows (symmetric V-shape pointing to pins, around Z = -15)
 * - Approach dots (two rows of dots at Z = 5 and Z = 10)
 * - Pin spots on the pin deck (10 spots where pins stand)
 * 
 * @param {THREE.Scene} scene - The main WebGL scene
 * @returns {THREE.Group} - The markings group containing all markers
 */
export function createMarkings(scene) {
  const markingsGroup = new THREE.Group();

  // 1. Foul Line (Z = 0)
  const foulLineGeom = new THREE.BoxGeometry(3.5, 0.002, 0.08);
  const foulLineMat = new THREE.MeshBasicMaterial({ color: 0xff3333 }); // Bright red
  const foulLine = new THREE.Mesh(foulLineGeom, foulLineMat);
  foulLine.position.set(0, 0.101, 0); // Slightly elevated to prevent Z-fighting
  foulLine.receiveShadow = true;
  markingsGroup.add(foulLine);

  // 2. Approach Dots (Rows at Z = 5 and Z = 10)
  const dotGeom = new THREE.CylinderGeometry(0.035, 0.035, 0.002, 16);
  const dotMat = new THREE.MeshBasicMaterial({ color: 0x221100 }); // Dark wood brown/black
  
  const xPositions = [-1.2, -0.6, 0.0, 0.6, 1.2];
  const zPositions = [5.0, 10.0];
  
  zPositions.forEach(z => {
    xPositions.forEach(x => {
      const dot = new THREE.Mesh(dotGeom, dotMat);
      dot.position.set(x, 0.101, z);
      dot.receiveShadow = true;
      markingsGroup.add(dot);
    });
  });

  // 3. Targeting Arrows (around Z = -15)
  // Create shape geometry for the chevron arrow pointing towards pins (-Z direction)
  const arrowShape = new THREE.Shape();
  arrowShape.moveTo(0, 0.2); // Tip
  arrowShape.lineTo(0.06, 0.05);
  arrowShape.lineTo(0.02, 0.05);
  arrowShape.lineTo(0.02, -0.1);
  arrowShape.lineTo(-0.02, -0.1);
  arrowShape.lineTo(-0.02, 0.05);
  arrowShape.lineTo(-0.06, 0.05);
  arrowShape.closePath();

  const arrowGeom = new THREE.ShapeGeometry(arrowShape);
  arrowGeom.rotateX(-Math.PI / 2); // Lay flat on XZ plane
  
  const arrowMat = new THREE.MeshBasicMaterial({ color: 0x1d1107, side: THREE.DoubleSide });

  // 7 Arrows in a symmetric V-shape pointing to pins
  const arrowConfigs = [
    { x: 0.0, z: -15.5 },
    { x: -0.4, z: -14.7 },
    { x: 0.4, z: -14.7 },
    { x: -0.8, z: -13.9 },
    { x: 0.8, z: -13.9 },
    { x: -1.2, z: -13.1 },
    { x: 1.2, z: -13.1 }
  ];

  arrowConfigs.forEach(cfg => {
    const arrow = new THREE.Mesh(arrowGeom, arrowMat);
    arrow.position.set(cfg.x, 0.101, cfg.z);
    arrow.receiveShadow = true;
    markingsGroup.add(arrow);
  });

  // 4. Pin Spots on Pin Deck (Z = -57 to Z = -60)
  const pinSpotGeom = new THREE.CylinderGeometry(0.05, 0.05, 0.002, 16);
  const pinSpotMat = new THREE.MeshBasicMaterial({ color: 0x1a1a1a }); // Dark gray/black spot
  
  const pinPositions = [
    { x: 0.0, z: -57.0 },    // Pin 1
    { x: -0.5, z: -57.866 }, // Pin 2
    { x: 0.5, z: -57.866 },  // Pin 3
    { x: -1.0, z: -58.732 }, // Pin 4
    { x: 0.0, z: -58.732 },  // Pin 5
    { x: 1.0, z: -58.732 },  // Pin 6
    { x: -1.5, z: -59.598 }, // Pin 7
    { x: -0.5, z: -59.598 }, // Pin 8
    { x: 0.5, z: -59.598 },  // Pin 9
    { x: 1.5, z: -59.598 }   // Pin 10
  ];

  pinPositions.forEach(pos => {
    const spot = new THREE.Mesh(pinSpotGeom, pinSpotMat);
    spot.position.set(pos.x, 0.101, pos.z);
    spot.receiveShadow = true;
    markingsGroup.add(spot);
  });

  scene.add(markingsGroup);
  return markingsGroup;
}

/**
 * Creates gutters and lane bumpers.
 * Gutters run on both sides of the lane from Z = 0 to Z = -60, sunken to Y = 0.0.
 * Left gutter center: X = -2.0, Right gutter center: X = 2.0.
 * Bumpers are cylindrical tubes inside the gutters that can be deployed (raised) or retracted (lowered).
 * 
 * @param {THREE.Scene} scene - The main WebGL scene
 * @returns {THREE.Group} - The gutters and bumpers group
 */
export function createGuttersAndBumpers(scene) {
  const group = new THREE.Group();

  // 1. Gutters (left and right)
  const gutterGeom = new THREE.CylinderGeometry(0.25, 0.25, 60, 16, 1, true, 0, Math.PI);
  // Rotate to lie along Z-axis, open upwards
  gutterGeom.rotateZ(Math.PI);
  gutterGeom.rotateX(Math.PI / 2);

  const gutterMat = new THREE.MeshStandardMaterial({ 
    color: 0x1a1a1a, 
    roughness: 0.8, 
    metalness: 0.1 
  });

  const leftGutter = new THREE.Mesh(gutterGeom, gutterMat);
  leftGutter.position.set(-2.0, 0.0, -30);
  leftGutter.receiveShadow = true;
  group.add(leftGutter);

  const rightGutter = new THREE.Mesh(gutterGeom, gutterMat);
  rightGutter.position.set(2.0, 0.0, -30);
  rightGutter.receiveShadow = true;
  group.add(rightGutter);

  // 2. Bumpers
  const bumpersGroup = new THREE.Group();
  const leftBumperGroup = new THREE.Group();
  const rightBumperGroup = new THREE.Group();

  // Long bumper tubes
  const bumperTubeGeom = new THREE.CylinderGeometry(0.05, 0.05, 60, 16);
  bumperTubeGeom.rotateX(Math.PI / 2);

  const bumperMat = new THREE.MeshStandardMaterial({ 
    color: 0xdcdcdc, 
    metalness: 0.8, 
    roughness: 0.2 
  });

  const leftTube = new THREE.Mesh(bumperTubeGeom, bumperMat);
  leftTube.position.set(-1.75, 0.0, -30); // local Y = 0
  leftTube.castShadow = true;
  leftTube.receiveShadow = true;
  leftBumperGroup.add(leftTube);

  const rightTube = new THREE.Mesh(bumperTubeGeom, bumperMat);
  rightTube.position.set(1.75, 0.0, -30); // local Y = 0
  rightTube.castShadow = true;
  rightTube.receiveShadow = true;
  rightBumperGroup.add(rightTube);

  // Support Arms (6 on each side, spacing along length)
  const armGeom = new THREE.CylinderGeometry(0.015, 0.015, 0.5, 8);
  armGeom.rotateZ(Math.PI / 2); // Orient horizontally along X axis
  
  const armMat = new THREE.MeshStandardMaterial({ 
    color: 0x888888, 
    metalness: 0.7, 
    roughness: 0.3 
  });

  const armZPositions = [-5, -15, -25, -35, -45, -55];
  
  armZPositions.forEach(z => {
    // Left support arm (goes from bumper at X = -1.75 to outer gutter wall at X = -2.25)
    const leftArm = new THREE.Mesh(armGeom, armMat);
    leftArm.position.set(-2.0, 0.0, z);
    leftArm.castShadow = true;
    leftArm.receiveShadow = true;
    leftBumperGroup.add(leftArm);

    // Right support arm (goes from bumper at X = 1.75 to outer gutter wall at X = 2.25)
    const rightArm = new THREE.Mesh(armGeom, armMat);
    rightArm.position.set(2.0, 0.0, z);
    rightArm.castShadow = true;
    rightArm.receiveShadow = true;
    rightBumperGroup.add(rightArm);
  });

  bumpersGroup.add(leftBumperGroup);
  bumpersGroup.add(rightBumperGroup);

  // Control logic for bumpers inside userData
  bumpersGroup.userData = {
    deployed: false,
    deploy: function() {
      leftBumperGroup.position.y = 0.15; // Raised slightly above lane surface (Y = 0.1)
      rightBumperGroup.position.y = 0.15;
      this.deployed = true;
    },
    retract: function() {
      leftBumperGroup.position.y = -0.06; // Sunken into the bottom of gutters
      rightBumperGroup.position.y = -0.06;
      this.deployed = false;
    },
    toggle: function() {
      if (this.deployed) {
        this.retract();
      } else {
        this.deploy();
      }
    }
  };

  // Start with bumpers retracted
  bumpersGroup.userData.retract();
  group.add(bumpersGroup);

  scene.add(group);
  return group;
}

/**
 * Creates the ball return machine and track.
 * Positioned on the left side of the lane (around X = -2.5).
 * Consists of metal rails, support posts, and a curved hood with returned balls.
 * 
 * @param {THREE.Scene} scene - The main WebGL scene
 * @returns {THREE.Group} - The ball return group
 */
export function createBallReturn(scene) {
  const ballReturnGroup = new THREE.Group();

  // 1. Support Posts
  const postGeom = new THREE.CylinderGeometry(0.03, 0.03, 0.6, 12);
  const postMat = new THREE.MeshStandardMaterial({ 
    color: 0x222222, 
    roughness: 0.6, 
    metalness: 0.2 
  });
  
  const postZPositions = [-50, -40, -30, -20, -10, 0, 9];
  postZPositions.forEach(z => {
    const post = new THREE.Mesh(postGeom, postMat);
    post.position.set(-2.5, 0.2, z); // Floor is at Y = -0.1, so this goes from Y = -0.1 to Y = 0.5
    post.castShadow = true;
    post.receiveShadow = true;
    ballReturnGroup.add(post);
  });

  // 2. Return Rails (two parallel rails from Z = -55 to Z = 10)
  const railGeom = new THREE.CylinderGeometry(0.018, 0.018, 65, 8);
  railGeom.rotateX(Math.PI / 2); // Lie flat along Z

  const railMat = new THREE.MeshStandardMaterial({ 
    color: 0x999999, 
    metalness: 0.9, 
    roughness: 0.15 
  });

  const leftRail = new THREE.Mesh(railGeom, railMat);
  leftRail.position.set(-2.6, 0.5, -22.5); // centered along Z
  leftRail.castShadow = true;
  leftRail.receiveShadow = true;
  ballReturnGroup.add(leftRail);

  const rightRail = new THREE.Mesh(railGeom, railMat);
  rightRail.position.set(-2.4, 0.5, -22.5);
  rightRail.castShadow = true;
  rightRail.receiveShadow = true;
  ballReturnGroup.add(rightRail);

  // 3. Bowler End Return Hood (at Z = 11 to 14.5)
  const hoodGroup = new THREE.Group();

  // Hood base
  const baseGeom = new THREE.BoxGeometry(0.58, 0.6, 2.0);
  const baseMat = new THREE.MeshStandardMaterial({ 
    color: 0x151515, 
    roughness: 0.7 
  });
  const hoodBase = new THREE.Mesh(baseGeom, baseMat);
  hoodBase.position.set(-2.5, 0.2, 13.0); // bottom Y = -0.1, top Y = 0.5
  hoodBase.castShadow = true;
  hoodBase.receiveShadow = true;
  hoodGroup.add(hoodBase);

  // Hood cover (aerodynamic casing)
  const coverGeom = new THREE.CylinderGeometry(0.29, 0.29, 2.0, 16, 1, false, 0, Math.PI);
  coverGeom.rotateZ(Math.PI); // Open downwards
  coverGeom.rotateX(Math.PI / 2); // Lie along Z
  
  const coverMat = new THREE.MeshStandardMaterial({ 
    color: 0x9a1010, // Crimson red cover
    roughness: 0.2, 
    metalness: 0.1 
  });
  const hoodCover = new THREE.Mesh(coverGeom, coverMat);
  hoodCover.position.set(-2.5, 0.5, 13.0); // starts at Y = 0.5, rises to Y = 0.79
  hoodCover.castShadow = true;
  hoodCover.receiveShadow = true;
  hoodGroup.add(hoodCover);

  // Hood nose (rounded front sphere)
  const noseGeom = new THREE.SphereGeometry(0.29, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);
  noseGeom.rotateX(-Math.PI / 2); // Point forward (-Z)
  const hoodNose = new THREE.Mesh(noseGeom, coverMat);
  hoodNose.position.set(-2.5, 0.5, 12.0); // positioned at the front of the cover
  hoodNose.castShadow = true;
  hoodNose.receiveShadow = true;
  hoodGroup.add(hoodNose);

  // 4. Decorative returned balls sitting on the rack
  // Balls rest at X = -2.5, Y = 0.5 (rail height) + sqrt(0.43^2 - 0.1^2) = 0.5 + 0.418 ≈ 0.92
  const ball1Geom = new THREE.SphereGeometry(0.43, 24, 24);
  const ball1Mat = new THREE.MeshPhongMaterial({ 
    color: 0x3b0066, // Deep indigo
    shininess: 90, 
    specular: 0x222222 
  });
  const ball1 = new THREE.Mesh(ball1Geom, ball1Mat);
  ball1.position.set(-2.5, 0.92, 12.9);
  ball1.castShadow = true;
  ball1.receiveShadow = true;
  hoodGroup.add(ball1);

  const ball2Mat = new THREE.MeshPhongMaterial({ 
    color: 0x005555, // Dark teal
    shininess: 90, 
    specular: 0x222222 
  });
  const ball2 = new THREE.Mesh(ball1Geom, ball2Mat);
  ball2.position.set(-2.5, 0.92, 13.95);
  ball2.castShadow = true;
  ball2.receiveShadow = true;
  hoodGroup.add(ball2);

  ballReturnGroup.add(hoodGroup);

  scene.add(ballReturnGroup);
  return ballReturnGroup;
}

/**
 * Creates the seating area behind the approach area (at Z = 18).
 * Consists of two wood-and-metal benches and a central circular table.
 * 
 * @param {THREE.Scene} scene - The main WebGL scene
 * @returns {THREE.Group} - The seating area group
 */
export function createSeatingArea(scene) {
  const seatingGroup = new THREE.Group();

  // Bench seats and backrests material (walnut wood)
  const woodMat = new THREE.MeshPhongMaterial({ 
    color: 0x663d24, 
    shininess: 40,
    specular: 0x111111
  });
  
  // Metallic chrome legs
  const chromeMat = new THREE.MeshStandardMaterial({ 
    color: 0xe0e0e0, 
    metalness: 0.9, 
    roughness: 0.1 
  });

  // Bench builder helper
  function createBench(xOffset) {
    const bench = new THREE.Group();

    // 1. Seat (1.6 wide, 0.08 thick, 0.5 deep)
    const seatGeom = new THREE.BoxGeometry(1.6, 0.08, 0.5);
    const seat = new THREE.Mesh(seatGeom, woodMat);
    seat.position.set(0, 0.45, 0); // Elevated to Y = 0.45
    seat.castShadow = true;
    seat.receiveShadow = true;
    bench.add(seat);

    // 2. Backrest (1.6 wide, 0.4 height, 0.08 thick)
    const backrestGeom = new THREE.BoxGeometry(1.6, 0.4, 0.08);
    const backrest = new THREE.Mesh(backrestGeom, woodMat);
    backrest.position.set(0, 0.75, 0.21); // Offset to the back
    backrest.castShadow = true;
    backrest.receiveShadow = true;
    bench.add(backrest);

    // 3. Legs
    const legGeom = new THREE.CylinderGeometry(0.025, 0.025, 0.45, 12);
    const legPositions = [
      { x: -0.7, z: -0.2 },
      { x: -0.7, z: 0.2 },
      { x: 0.7, z: -0.2 },
      { x: 0.7, z: 0.2 }
    ];

    legPositions.forEach(pos => {
      const leg = new THREE.Mesh(legGeom, chromeMat);
      leg.position.set(pos.x, 0.225, pos.z); // spans Y = 0 to 0.45
      leg.castShadow = true;
      leg.receiveShadow = true;
      bench.add(leg);
    });

    bench.position.set(xOffset, 0, 18.0);
    return bench;
  }

  // Left and Right benches
  const leftBench = createBench(-1.8);
  seatingGroup.add(leftBench);

  const rightBench = createBench(1.8);
  seatingGroup.add(rightBench);

  // 4. Center Table (at X = 0, Z = 18.0)
  const tableGroup = new THREE.Group();

  // Table top (circular laminate)
  const topGeom = new THREE.CylinderGeometry(0.35, 0.35, 0.04, 24);
  const topMat = new THREE.MeshStandardMaterial({ 
    color: 0xf5f5f5, 
    roughness: 0.4 
  });
  const tableTop = new THREE.Mesh(topGeom, topMat);
  tableTop.position.set(0, 0.6, 0); // table height Y = 0.6
  tableTop.castShadow = true;
  tableTop.receiveShadow = true;
  tableGroup.add(tableTop);

  // Table support post (chrome cylinder)
  const postGeom = new THREE.CylinderGeometry(0.04, 0.04, 0.6, 12);
  const tablePost = new THREE.Mesh(postGeom, chromeMat);
  tablePost.position.set(0, 0.3, 0); // center of Y = 0 to 0.6
  tablePost.castShadow = true;
  tablePost.receiveShadow = true;
  tableGroup.add(tablePost);

  // Table base (chrome disc)
  const baseGeom = new THREE.CylinderGeometry(0.22, 0.22, 0.02, 24);
  const tableBase = new THREE.Mesh(baseGeom, chromeMat);
  tableBase.position.set(0, 0.01, 0);
  tableBase.castShadow = true;
  tableBase.receiveShadow = true;
  tableGroup.add(tableBase);

  tableGroup.position.set(0, 0, 18.0);
  seatingGroup.add(tableGroup);

  scene.add(seatingGroup);
  return seatingGroup;
}
