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

        // Додати кнопку UARButton з українською локалізацією
        document.body.appendChild(UARButton.createButton(renderer, {
            optionalFeatures: ["dom-overlay"],
            domOverlay: { root: document.body }
        }));

        const raycaster = new THREE.Raycaster();
        const rayGeometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(0, 0, -1)
        ]);
        const rayMaterial = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5 });
        const rayLine = new THREE.Line(rayGeometry, rayMaterial);
        rayLine.name = "visualRay";
        rayLine.visible = false;

        // Анімаційний цикл — працює і для XR, і для не-XR режиму
        renderer.setAnimationLoop((timestamp, frame) => {
            renderer.render(scene, camera);
        });

        //cubes = [];
        const geometry = new THREE.BoxGeometry(0.05, 0.05, 0.05);
        const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
        const cube = new THREE.Mesh(geometry, material);
        cube.position.set(0, 0, -0.3);
        scene.add(cube);


        renderer.xr.addEventListener("sessionstart", async (e) => {
            console.log("Сесію WebXR розпочато");

            const session = renderer.xr.getSession();
            const referenceSpace = await session.requestReferenceSpace('local');
            renderer.xr.setReferenceSpace(referenceSpace);

            const controller = renderer.xr.getController(0);
            controller.add(rayLine);
            rayLine.visible = true;

            scene.add(controller);

            controller.addEventListener('selectstart', () => {
                console.log("Контролер обрано");

                // Створити просту геометрію (наприклад, куб) при виборі
                //cubes.push(cube);

                cube.position.applyMatrix4(controller.matrixWorld);
                cube.quaternion.setFromRotationMatrix(controller.matrixWorld);
            });

        });

        renderer.xr.addEventListener("sessionend", () => {
            console.log("Сесію WebXR завершено");
        });
    }

    initialize();
});
