# Project Overview: WebAR Educational Project (SR_Im-25)

Цей проект є навчальним курсом з розробки доповненої реальності для веб-браузерів (WebAR). Він базується на використанні бібліотеки **Three.js** для 3D-рендерингу та **MindAR** для відстеження зображень-маркерів та обличчя.

Проект побудований за принципом прогресивного навчання: кожна папка `weekN` містить окреме завершене завдання, яке додає новий функціонал до попередніх напрацювань.

## Architecture & Technology Stack

- **Core Libraries:** 
  - **Three.js (v0.151)**: Основний двигун для 3D графіки.
  - **MindAR**: Бібліотека для AR-трекінгу (image tracking та face tracking).
- **No Build System**: Проект використовує чисті браузерні ES-модулі. Всі залежності підключаються через `<script type="importmap">` у файлах `test.html`.
- **Vendored Dependencies**: Бібліотеки зберігаються локально в директорії `lib/` (`lib/three/`, `lib/mindar/`), що дозволяє працювати без підключення до мережі (крім аддонів Three.js, що завантажуються з CDN).
- **Assets Storage**: Всі медіафайли (моделі `.glb`, текстури, аудіо, відео та файли маркерів `.mind`) знаходяться в папці `assets/`.

## Project Structure

- `index.html`: Головна сторінка-портфоліо з посиланнями на всі тижневі завдання.
- `week1/` - `week12/`: Директорії з практичними завданнями. Кожна містить `test.html` (вхідна точка) та `main.js` (логіка).
- `lib/`: Локальні копії Three.js та MindAR.
- `assets/`: 3D-моделі, звуки, зображення та трекінг-дані.
- `materials/`: Допоміжні навчальні матеріали (PDF).

## Running and Development

Оскільки проект використовує ES-модулі, його **неможливо** відкрити просто подвійним кліком по файлу (протокол `file://`). Необхідно використовувати локальний HTTP-сервер.

### Commands for Running:
```bash
# Варіант 1: Python (якщо встановлено)
python3 -m http.server 8000

# Варіант 2: Node.js (npx)
npx serve .
```
Після запуску відкрийте `http://localhost:8000` у браузері.

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
| 9-10 | Advanced tracking | Continued exploration of face/image tracking features |
| 11-12 | Planned | Final project and advanced integrations |

## Technical Patterns & Conventions

### Module Resolution
Import maps are defined per-page in `test.html`.
- `three` → `lib/three/three_151.module.js`
- `mindar-image-three` → `lib/mindar/mindar-image-three.prod.js`
- `mindar-face-three` → `lib/mindar/mindar-face-three.prod.js`

### MindAR Lifecycle
Important for weeks 4+:
- `mindarThree.stop()`
- `renderer.setAnimationLoop(null)`
- Clean up audio listeners and animation arrays.

### User Interaction
Audio and camera require user interaction (click/touchstart) due to browser security policies.

### Coordinate Systems
MindAR uses a metric system where 1 unit ≈ marker size in the real world.

### Key Code Snippets

#### MindAR Initialization (Image)
```js
const mindarThree = new MindARThree({
    container: document.body,
    imageTargetSrc: "../assets/foo.mind",
    maxTrack: 2,
    uiScanning: "yes",
    uiLoading: "yes",
});
const {renderer, scene, camera} = mindarThree;
```

#### Anchors and Events
```js
const anchor = mindarThree.addAnchor(index);
anchor.group.add(mesh);
anchor.onTargetFound = () => { /* logic */ };
anchor.onTargetLost = () => { /* logic */ };
```

#### Face Tracking
```js
const mindarThree = new MindARThree({
    container: document.body,
    uiScanning: "yes",
    uiLoading: "yes",
});
const anchor = mindarThree.addAnchor(i); // i: 0-467
```

---
*Примітка: Файли `week4-*.png` є скріншотами виконання відповідного етапу завдання для звітності.*
