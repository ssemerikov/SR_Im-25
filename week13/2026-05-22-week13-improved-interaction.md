# Improved WebXR Cube Interaction Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace immediate cube teleportation with a smooth raycasting-based interaction in WebXR.

**Architecture:** Use `THREE.Raycaster` for target detection, a `THREE.Line` for visual aiming, and a state machine (`isHolding`) combined with `Vector3.lerp` for smooth animation.

**Tech Stack:** Three.js (v0.184.0), WebXR API.

---

### Task 1: Setup Raycaster and Visual Ray

**Files:**
- Modify: `week13/main.js`

- [ ] **Step 1: Define Raycaster and Visual Line**
Add variables for raycaster and a line to represent the visual ray.

```javascript
// ... inside initialize function
const raycaster = new THREE.Raycaster();
const rayGeometry = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0, 0, -1)
]);
const rayMaterial = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5 });
const rayLine = new THREE.Line(rayGeometry, rayMaterial);
rayLine.name = "visualRay";
rayLine.visible = false; // Hidden by default, show in XR
```

- [ ] **Step 2: Add visual ray to controller**
Modify the `sessionstart` listener to add `rayLine` to the controller.

```javascript
renderer.xr.addEventListener("sessionstart", async (e) => {
    // ...
    const controller = renderer.xr.getController(0);
    controller.add(rayLine);
    rayLine.visible = true;
    scene.add(controller);
    // ...
});
```

- [ ] **Step 3: Commit**
```bash
git add week13/main.js
git commit -m "feat: add visual ray to controller"
```

---

### Task 2: Implement Interaction State and Raycasting Logic

**Files:**
- Modify: `week13/main.js`

- [ ] **Step 1: Add state variables**
Define variables to track if an object is being held.

```javascript
// ... outside initialize or at the top of it
let isHolding = false;
let targetObject = null;
const grabbingDistance = 0.3; // 30cm
```

- [ ] **Step 2: Update selectstart listener**
Change the logic to use raycasting instead of direct teleportation.

```javascript
controller.addEventListener('selectstart', () => {
    console.log("Контролер натиснуто - шукаємо ціль");

    // Оновити матрицю контролера перед рейкастингом
    controller.updateMatrixWorld();
    
    // Налаштувати промінь від контролера
    const tempMatrix = new THREE.Matrix4();
    tempMatrix.identity().extractRotation(controller.matrixWorld);
    
    raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld);
    raycaster.ray.direction.set(0, 0, -1).applyMatrix4(tempMatrix);

    const intersects = raycaster.intersectObjects([cube]);

    if (intersects.length > 0) {
        console.log("Ціль захоплено!");
        isHolding = true;
        targetObject = intersects[0].object;
    }
});
```

- [ ] **Step 3: Add selectend listener**
Handle releasing the object.

```javascript
controller.addEventListener('selectend', () => {
    console.log("Контролер відпущено");
    isHolding = false;
    targetObject = null;
});
```

- [ ] **Step 4: Commit**
```bash
git add week13/main.js
git commit -m "feat: implement raycasting and interaction state"
```

---

### Task 3: Implement Smooth Movement (Lerp)

**Files:**
- Modify: `week13/main.js`

- [ ] **Step 1: Update Animation Loop**
Modify the `setAnimationLoop` to update the cube's position and rotation smoothly if it's being held.

```javascript
renderer.setAnimationLoop((timestamp, frame) => {
    if (isHolding && targetObject) {
        const controller = renderer.xr.getController(0);
        
        // Розрахувати цільову позицію (на відстані grabbingDistance перед контролером)
        const targetPos = new THREE.Vector3(0, 0, -grabbingDistance);
        targetPos.applyMatrix4(controller.matrixWorld);
        
        // Плавне переміщення
        targetObject.position.lerp(targetPos, 0.1);
        
        // Плавний поворот (опціонально, можна використовувати slerp для ще більшої плавності)
        const targetQuat = new THREE.Quaternion();
        targetQuat.setFromRotationMatrix(controller.matrixWorld);
        targetObject.quaternion.slerp(targetQuat, 0.1);
    }
    renderer.render(scene, camera);
});
```

- [ ] **Step 2: Commit**
```bash
git add week13/main.js
git commit -m "feat: add smooth movement using lerp and slerp"
```

---

### Task 4: Final Polish and Verification

**Files:**
- Modify: `week13/main.js`

- [ ] **Step 1: Ensure initial position is visible**
The cube is currently at (0, 0, -0.3). Ensure it's not hidden by the visual ray or controller.

- [ ] **Step 2: Verification**
1. Start the server: `python3 -m http.server 8000`
2. Open `http://localhost:8000/week13/` in a WebXR-compatible browser (or emulator).
3. Verify the white ray is visible on the controller.
4. Point at the cube and press 'select'. The cube should smoothly move towards the controller but stop at 30cm away.
5. Move the controller around; the cube should follow smoothly.
6. Release 'select'. The cube should stay in its current position.

- [ ] **Step 3: Commit**
```bash
git add week13/main.js
git commit -m "docs: complete week13 interaction improvement"
```
