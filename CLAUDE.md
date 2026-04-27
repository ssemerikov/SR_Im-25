# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

WebAR educational project using **Three.js** (3D rendering) and **MindAR** (image-target AR tracking). Weekly assignments build progressively: basic 3D scene → AR with markers → textured geometries → UI-controlled AR with start/stop → animated GLB models with spatial audio.

## Architecture

- **No build system** — pure browser ES modules via `<script type="importmap">` in each HTML file
- **No package manager** — libraries are vendored in `lib/` or loaded from CDN
- Each `weekN/` folder is a self-contained assignment with `test.html` (entry) + `main.js` (logic)
- `index.html` — landing page linking to all weekly assignments
- `assets/` — images (PNG/JPG), `.mind` files (MindAR compiled image targets), `.glb` 3D models, `.mp3` audio, `.mp4` video. Anchor index in `addAnchor(index)` corresponds to image order in the `.mind` file.
- `materials/` — course PDFs (in Ukrainian)

## Module Resolution

Week 1 uses CDN Three.js (v0.183.1) with no MindAR. Weeks 2+ use local vendored libraries:
- `three` → `lib/three/three_151.module.js` (Three.js v0.151)
- `mindar-image-three` → `lib/mindar/mindar-image-three.prod.js` (weeks 2-7)
- `mindar-face-three` → `lib/mindar/mindar-face-three.prod.js` (week 8+)
- `three/addons/` → CDN (e.g., `three/addons/loaders/GLTFLoader.js`)

Import maps are defined per-page in `test.html` — there is no shared config.

## Running Locally

Serve from project root with any static HTTP server (ES modules require HTTP, not `file://`):
```bash
python3 -m http.server 8000
# or
npx serve .
```
Then open `http://localhost:8000/weekN/test.html` for each assignment.

## Weekly Progression

| Week | Focus | Key Feature |
|------|-------|-------------|
| 1 | Basic Three.js scene | Rotating cube + camera feed, no AR |
| 2 | First MindAR | Single/multi-anchor AR with colored cubes |
| 3 | Textured geometries | Multi-face textured cube, capsule, circle on anchor |
| 4 | UI-controlled AR + start/stop | Split-pane layout, custom scan overlay, GLB model loading, start/stop button |
| 5 | Animated models + spatial audio | GLTFLoader + AnimationMixer, PositionalAudio, target found/lost events |
| 6 | Video texture on marker | VideoTexture on anchor, raycaster click interaction |
| 7 | Embedded iframe video | CSS3DRenderer with YouTube/Vimeo via addCSSAnchor |
| 8 | Face tracking AR | MindAR Face with 468 facial landmark anchors, VR/AR toggle button |

## Key Patterns

### MindAR Initialization
```js
const mindarThree = new MindARThree({
    container: document.body,         // or a specific DOM element
    imageTargetSrc: "../assets/foo.mind",
    maxTrack: 2,                       // number of simultaneous targets (default 1)
    uiScanning: "yes",                 // or "no" for custom overlays
    uiLoading: "yes",
});
const {renderer, scene, camera} = mindarThree;
```

### Anchors and Target Events
```js
const anchor = mindarThree.addAnchor(index);  // index matches .mind file order
anchor.group.add(mesh);                        // add 3D objects to anchor
anchor.onTargetFound = () => { /* play audio, hide overlay */ };
anchor.onTargetLost = () => { /* pause audio */ };
```

### Animation Loop
```js
await mindarThree.start();
renderer.setAnimationLoop((time) => {
    // update animations, positions, materials
    renderer.render(scene, camera);
});
```

### Start/Stop Lifecycle (weeks 4+)
Weeks 4-5 use a toggle button. The `stop()` function must clean up:
- `renderer.setAnimationLoop(null)` — stop rendering
- `mindarThree.stop()` — stop AR tracking
- Stop camera video tracks and remove DOM elements
- Null out references (`mindarThree = null`, `renderer = null`)

### GLB Model Loading with AnimationMixer (week 5)
```js
const gltfLoader = new GLTFLoader();
const mixer = new THREE.AnimationMixer(gltf.scene);
const action = mixer.clipAction(gltf.animations[0]);
action.play();
// In animation loop: mixer.update(delta);
const clock = new THREE.Clock();
// delta = clock.getDelta()
```

### Spatial Audio (week 5)
```js
const listener = new THREE.AudioListener();
camera.add(listener);
const audioLoader = new THREE.AudioLoader();
audioLoader.load("sound.mp3", (buffer) => {
    const sound = new THREE.PositionalAudio(listener);
    sound.setBuffer(buffer);
    sound.setRefDistance(0.5);
    sound.setLoop(true);
    anchor.group.add(sound);  // attach to anchor for spatial positioning
});
```
Resume `AudioContext` on user interaction (browser autoplay policy):
```js
if (listener.context.state === 'suspended') listener.context.resume();
```

### Split-Pane UI (weeks 4-5)
HTML: `#win1` (left: description + button + marker images) + `#win2` (right: AR container).
Custom scan overlay with marker images that fades when a target is found.

### Video Texture (week 6)
```js
const loadVideo = (path) => {
    return new Promise((resolve) => {
        const video = document.createElement("video");
        video.addEventListener("loadeddata", () => {
            video.setAttribute("playsinline", "");
            video.setAttribute("muted", "true");
            video.setAttribute("loop", "");
            video.muted = true;
            resolve(video);
        });
        video.src = path;
    });
};
const video = await loadVideo("video.mp4");
const texture = new THREE.VideoTexture(video);
const plane = new THREE.Mesh(
    new THREE.PlaneGeometry(1, videoHeight/videoWidth),
    new THREE.MeshBasicMaterial({map: texture})
);
anchor.group.add(plane);
anchor.onTargetFound = () => video.play();
anchor.onTargetLost = () => video.pause();
```

### Raycaster Click Interaction (week 6)
```js
document.body.addEventListener("click", (e) => {
    const mouse = new THREE.Vector2(
        (e.clientX / window.innerWidth) * 2 - 1,
        -(e.clientY / window.innerHeight) * 2 + 1
    );
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects([model], true);
    if (intersects.length > 0) {
        // Handle click on model
    }
});
```

### CSS3DRenderer for Embedded Video (week 7)
MindAR exposes `cssScene` and `cssRenderer` when using CSS3D:
```js
const {scene, cssScene, camera, renderer, cssRenderer} = mindarThree;
const obj = new CSS3DObject(document.querySelector("#iframe-div"));
const anchor = mindarThree.addCSSAnchor(index);
anchor.group.add(obj);
// Animation loop renders both:
renderer.render(scene, camera);
cssRenderer.render(cssScene, camera);
```
Control Vimeo/YouTube players via their SDKs (`Vimeo.Player`, `YT.Player`) on `onTargetFound`/`onTargetLost`. Load SDKs in HTML: `<script src="https://player.vimeo.com/api/player.js"></script>` and YouTube IFrame API.

### Camera Permission Button (weeks 6-7)
For pages requiring explicit camera permission, create a button dynamically:
```js
const startButton = document.createElement("button");
startButton.textContent = "Будь-ласка, дозвольте скористатись камерою";
startButton.addEventListener("click", () => {
    start();  // async AR initialization
    startButton.style.display = "none";
});
document.body.appendChild(startButton);
```

### MindAR Face Tracking (week 8)
Face tracking uses `mindar-face-three` instead of `mindar-image-three`. No `.mind` file needed — tracks 468 facial landmarks automatically:
```js
const mindarThree = new MindARThree({
    container: document.body,
    uiScanning: "yes",
    uiLoading: "yes",
});
const {scene, camera, renderer} = mindarThree;

// Create 468 anchors (one per facial landmark)
const anchors = [];
for(let i = 0; i < 468; i++) {
    anchors.push(mindarThree.addAnchor(i));
}
```
VR/AR toggle by hiding/showing the camera video element:
```js
const video = document.querySelector("video");
video.style.visibility = "hidden";  // VR mode (no camera feed)
video.style.visibility = "visible"; // AR mode (with camera feed)
```

## Language

UI text is in Ukrainian. Variable names and code comments are in English.

## Planned Weeks

Weeks 9-12 are listed in `index.html` but not yet implemented.