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

Week 1 uses CDN Three.js (v0.183.1) with no MindAR. Weeks 2–8 and 10 use local vendored libraries. Weeks 13–14 use CDN Three.js v0.184.0:
- `three` → `lib/three/three_151.module.js` (Three.js v0.151)
- `mindar-image-three` → `lib/mindar/mindar-image-three.prod.js` (weeks 2–7)
- `mindar-face-three` → `lib/mindar/mindar-face-three.prod.js` (weeks 8–10)
- `three/addons/` → CDN (e.g., `three/addons/loaders/GLTFLoader.js`)
- `webxr/UARButton` → `lib/webxr/UARButton.js` (week 12+, custom component)

Import maps are defined per-page in `test.html` or `index.html` — there is no shared config.

## Custom Components

### UARButton (week 12+)
Власний компонент AR кнопки з українською локалізацією та градієнтним стилем. Базується на Three.js `ARButton`:

```js
import { UARButton } from 'webxr/UARButton';

// Мінімальний виклик
document.body.appendChild(UARButton.createButton(renderer, {
    optionalFeatures: ["dom-overlay"],
    domOverlay: { root: document.body }
}));

// Розширений виклик з callbacks
document.body.appendChild(UARButton.createButton(renderer, {
    optionalFeatures: ["dom-overlay"],
    domOverlay: { root: document.body },
    onSessionStart: (session) => {
        // Створити XR об'єкти тільки після старту сесії
        session.requestReferenceSpace('local').then((refSpace) => {
            renderer.xr.setReferenceSpace(refSpace);
            // Додати 3D об'єкти до сцени
        });
    },
    onSessionEnd: () => {
        // Очистити XR об'єкти
    }
}));
```

**Переваги над оригінальним ARButton:**
- Українська локалізація: "УВІЙТИ ДО AR", "ВИЙТИ", "AR НЕ ПІДТРИМУЄТЬСЯ"
- Градієнтний стиль: `linear-gradient(135deg, #667eea 0%, #764ba2 100%)`
- Hover ефект: `scale(1.05)` + opacity transition
- SVG кнопка закриття (хрестик) у верхньому правому куті
- Автоматичне керування session lifecycle через `xr.offerSession`

## Running Locally

Serve from project root with any static HTTP server (ES modules require HTTP, not `file://`):
```bash
python3 -m http.server 8000
# or
npx serve .
```
Then open `http://localhost:8000/weekN/test.html` for each assignment.

## Development Workflow

### Commands
- **Start development server**: Use any static file server. Example:
  ```bash
  python3 -m http.server 8000
  ```
  Then visit `http://localhost:8000/index.html` or specific week pages.

- **Running tests**: The project uses Playwright for end-to-end testing. Test specs live in `tests/`. To run all tests:
  ```bash
  npx playwright test
  ```
  To run a single test file:
  ```bash
  npx playwright test tests/test-hat.spec.js
  ```
  The Playwright config (`playwright.config.js`) auto-starts a dev server on port 3000, so you don't need to start one separately.

- **Building**: There is no build step; the code runs directly in the browser via ES modules. Simply ensure the server is serving the correct MIME types for `.js` files.

### Testing Patterns
- Playwright tests are used to verify UI interactions (e.g., button clickability, AR session start/stop).
- Example test structure can be found in existing test scripts (if any) or follow the Playwright API:
  ```js
  const { test, expect } = require('@playwright/test');
  test('AR button is clickable', async ({ page }) => {
    await page.goto('http://localhost:8000/week8/test.html');
    await expect(page.locator('button')).toBeEnabled();
    await page.click('button');
    // ... additional assertions
  });
  ```

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
| 9 | Face tracking with occlusion | Head occluder, hat model, face mask toggle, photo capture |
| 10 | Custom face mesh texture | `addFaceMesh()` with texture map, VR/AR toggle |
| 11 | Native WebXR | `navigator.xr.requestSession()`, no MindAR |
| 12 | UARButton component | Custom AR button with Ukrainian localization |
| 13 | Controller interaction + model placement | Raycaster grab, lerp/slerp smooth movement, GLB preloading |
| 14 | Hit-test + reticle placement | WebXR hit-test API, reticle for surface detection, tap-to-place |
| 15 | World-tracking model placement | GLB preloading, item selection UI, touch rotation, confirm/cancel |
| 16 | Persistent model storage | Node.js server, models.json persistence, 30s polling for new models |
| 17 | Lighting estimation + anchors | `XRLightProbe`, `XRAnchor`, `primaryLightDirection`, persistent placement |

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

### Face Occluder (week 9)
A head occluder hides parts of models that should be behind the face. It uses `colorWrite: false` and is rendered first via `renderOrder`:
```js
const occluderMaterial = new THREE.MeshBasicMaterial({ color: 0x0000ff, colorWrite: false });
occluder.scene.traverse((o) => {
    if (o.isMesh) o.material = occluderMaterial;
});
occluder.scene.renderOrder = 0;
```

### Native WebXR (week 11)
Week 11 does not use MindAR. It requests an immersive AR session directly:
```js
const session = await navigator.xr.requestSession("immersive-ar", {
    optionalFeatures: ["dom-overlay"],
    domOverlay: { root: document.body }
});
renderer.xr.enabled = true;
await renderer.xr.setSession(session);
```

### Controller Raycasting + Grabbing (week 13)
Raycaster-based object picking with the XR controller, using lerp/slerp for smooth movement:
```js
const controller = renderer.xr.getController(0);
controller.add(rayLine);  // visual ray indicator

controller.addEventListener('selectstart', () => {
    const tempMatrix = new THREE.Matrix4();
    tempMatrix.identity().extractRotation(controller.matrixWorld);
    raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld);
    raycaster.ray.direction.set(0, 0, -1).applyMatrix4(tempMatrix);
    const intersects = raycaster.intersectObjects([targetMesh]);
    if (intersects.length > 0) {
        isHolding = true;
        targetObject = intersects[0].object;
    }
});

controller.addEventListener('selectend', () => {
    isHolding = false;
    targetObject = null;
});

// In animation loop — smooth follow with lerp/slerp:
if (isHolding && targetObject) {
    const targetPos = new THREE.Vector3(0, 0, -grabbingDistance);
    targetPos.applyMatrix4(controller.matrixWorld);
    targetObject.position.lerp(targetPos, 0.1);
    const targetQuat = new THREE.Quaternion();
    targetQuat.setFromRotationMatrix(controller.matrixWorld);
    targetObject.quaternion.slerp(targetQuat, 0.1);
}
```

### GLB Model Preloading + Cloning (week 13)
Preload multiple GLB models at startup, then clone on demand for instant placement:
```js
const modelSpecs = [
    { name: "teacup", glbPath: "../assets/teacup.glb", scale: { x: 0.5, y: 0.5, z: 0.5 } },
];
const preloadedModels = await Promise.all(modelSpecs.map(spec => {
    return new Promise((resolve) => {
        loader.load(spec.glbPath, (gltf) => resolve({ scene: gltf.scene, scale: spec.scale }));
    });
}));

function getRandomModelClone() {
    const { scene, scale } = preloadedModels[Math.floor(Math.random() * preloadedModels.length)];
    const clone = scene.clone(true);
    clone.scale.set(scale.x, scale.y, scale.z);
    return clone;
}
```

### Hit-Test + Reticle Placement (week 14)
Uses WebXR hit-test API to detect real-world surfaces and place a reticle:
```js
const session = renderer.xr.getSession();
const viewerReferenceSpace = await session.requestReferenceSpace("viewer");
const hitTestSource = await session.requestHitTestSource({ space: viewerReferenceSpace });

renderer.setAnimationLoop((timestamp, frame) => {
    const hitTestResults = frame.getHitTestResults(hitTestSource);
    if (hitTestResults.length > 0) {
        const hit = hitTestResults[0];
        const hitPose = hit.getPose(referenceSpace);
        reticle.visible = true;
        reticle.matrix.fromArray(hitPose.transform.matrix);
    } else {
        reticle.visible = false;
    }
});

// On controller select, place object at reticle position:
controller.addEventListener("select", () => {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.setFromMatrixPosition(reticle.matrix);
    scene.add(mesh);
});
```
Requires `requiredFeatures: ["hit-test"]` in the UARButton session config.

## Language

UI text is in Ukrainian. Variable names and code comments are in English.