# Computer Graphics - Exercise 5: WebGL Bowling Alley

This repository contains the implementation of a 3D Bowling Alley scene built with WebGL and Three.js. It features a detailed regulation lane, custom 3D models of pins and a bowling ball, camera presets, and a premium glassmorphic UI overlay.

## Group Members
* **Shalev Ohayon (שלו אוחיון)**

## Getting Started

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed.

### Installation & Run Instructions
1. Extract the project archive to your local machine.
2. Open a terminal and navigate to the root directory of this project (where `package.json` is located).
3. Install the required dependencies:
   ```bash
   npm install
   ```
4. Start the local development web server:
   ```bash
   node index.js
   ```
5. Open your web browser and navigate to `http://localhost:8000` to view the scene.

---

## Features Implemented

### 1. Mandatory Features
* **Detailed Bowling Lane & Markings**:
  * Regulation dimensions (~60 units long by 3.5 units wide).
  * Smooth maple wood finish on the lane surface.
  * Clear foul line (thin red line across the lane width).
  * Approach area with a subtly darker shade.
  * Gutters running alongside the entire length of the lane, slightly lowered.
  * Approach dots and lane targeting arrows aligned to standard regulation specifications.
* **Ten Pins in Triangular Formation**:
  * Scaled and shaped according to regulation specifications (wide body, narrow neck, rounded head).
  * Classic glossy white material with a dual red stripe neck band.
  * Placed in the standard 1-2-3-4 triangular pin deck layout (head pin centered at Z = -57.0).
* **Static Bowling Ball**:
  * Realistic size relative to lane and pins (radius of 0.45 units).
  * Highly reflective, shiny metallic material.
  * Detailed with three distinct finger holes (embedded cylinders) facing the camera.
  * Positioned statically on the approach area.
* **Camera & Lighting Infrastructure**:
  * Toggleable Orbit controls (via the **'O'** key) to freely explore the scene.
  * Multi-source lighting including Ambient Light for soft illumination and Directional Light representing overhead alley lights, with soft shadows enabled.
* **Responsive UI Overlay**:
  * Modern dark-themed glassmorphism panels overlaying the screen without obstructing the bowling action.
  * Scoring table detailing rolls and cumulative scores for a complete game in progress.

### 2. Bonus Features (Extra 10 Points)
* **Lane Bumpers**: Optional raised safety guards inside the gutters, designed to prevent the ball from falling off the lane.
* **Ball Return System**: Realistic return hood and track geometry positioned alongside the lane.
* **Seating Area**: Interactive-looking bowler seating (benches/stools) constructed behind the approach area.
* **Overhead Monitor**: A suspended scoring monitor displaying match details hung above the pin deck.
* **Textured Surfaces**: Procedurally generated wood-grain canvas textures for the lane boards and fine carpet texturing on the approach area.
* **Multiple Camera Presets**: Keyboard shortcuts to switch perspectives instantly:
  * `1` - **Bowler Camera**: Positioned behind the foul line looking down the lane.
  * `2` - **Pin Close-up**: Focused directly on the pin triangle.
  * `3` - **Overhead View**: Top-down bird's-eye perspective of the entire lane.
  * `4` - **Side View**: Side profile showing the depth of the lane.
  * `O` - **Orbit Camera Toggle**: Enables free rotation, panning, and zoom.
* **Premium Glassmorphic HUD Overlay**:
  * Styled with Google Fonts (`Inter` and `Orbitron` for scoreboard numbers).
  * Built using clean CSS `backdrop-filter: blur(12px)` and subtle glowing indicators.
  * Interactive key highlights: Pressing camera hotkeys (`1`-`4`, `O`) dynamically highlights the active view badge in the UI controls menu and updates the current state panel.

---

## Technical Details & Architecture
* **Libraries**: Vanilla Three.js (`three.min.js`), Node/Express server.
* **UI**: Fully responsive CSS Grid HUD overlay, independent of WebGL canvas size changes. Uses standard modern variables and flexboxes for cross-browser styling.
* **Input Controller**: Listens to document keypress events to toggle active states and update HUD badges smoothly.

## Known Issues & Limitations
* **Static Scene**: Physical ball rolling, pin collisions, dynamic score updates, and pin sweeping animations are not yet implemented. These mechanics are saved for the next exercise (HW06).

## References & Credits
* **Three.js Documentation**: [https://threejs.org/docs/](https://threejs.org/docs/)
* **CSS Glassmorphism Design**: Inspired by modern glassmorphic web design trends.
* **Textures**: Procedural wood grain canvas generation based on standard Three.js canvas texturing examples.
