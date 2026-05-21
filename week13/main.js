import * as THREE from 'three';
import { UARButton } from 'webxr/UARButton';

document.addEventListener("DOMContentLoaded", () => {
    const initialize = async() => {
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera();

        const renderer = new THREE.WebGLRenderer({antialias: true, alpha: true});
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.xr.enabled = true;

        document.body.appendChild(renderer.domElement);

        let currentMesh = null;

        // Додати кнопку UARButton з українською локалізацією
        document.body.appendChild(UARButton.createButton(renderer, {
            optionalFeatures: ["dom-overlay"],
            domOverlay: { root: document.body }
        }));

        // Анімаційний цикл — працює і для XR, і для не-XR режиму
        renderer.setAnimationLoop((timestamp, frame) => {
            // Обертання кубика у XR сесії
            if (currentMesh) {
                currentMesh.rotation.x += 0.01;
                currentMesh.rotation.y += 0.02;
            }
            renderer.render(scene, camera);
        });

        // Слухачі подій для створення/видалення кубика
        renderer.xr.addEventListener("sessionstart", async (e) => {
            console.log("Сесію WebXR розпочато");

            const session = renderer.xr.getSession();
            const referenceSpace = await session.requestReferenceSpace('local');
            renderer.xr.setReferenceSpace(referenceSpace);

            // Створити кубик тільки для XR сесії
            const geometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
            const material = new THREE.MeshBasicMaterial({color: 0x00ff00});
            currentMesh = new THREE.Mesh(geometry, material);
            currentMesh.position.set(0, 0, -0.5);
            scene.add(currentMesh);
        });

        renderer.xr.addEventListener("sessionend", () => {
            console.log("Сесію WebXR завершено");

            // Видалити кубик зі сцени
            if (currentMesh) {
                scene.remove(currentMesh);
                currentMesh = null;
            }
        });
    }

    initialize();
});
