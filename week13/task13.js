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

        // Add basic lighting
        const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
        scene.add(light);

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

        // Preload models from weeks 4-6
        const preloadModels = async () => {
            const { GLTFLoader } = await import('three/addons/loaders/GLTFLoader.js');
            const loader = new GLTFLoader();
            const modelSpecs = [
                { name: "teacup", glbPath: "../assets/teacup.glb", scale: { x: 0.5, y: 0.5, z: 0.5 } },
                { name: "phoenix bird", glbPath: "../assets/phoenix_bird.glb", scale: { x: 0.005, y: 0.005, z: 0.005 } },
                { name: "terrarium", glbPath: "../assets/smol_ame_in_an_upcycled_terrarium_hololiveen.glb", scale: { x: 0.5, y: 0.5, z: 0.5 } },
                { name: "sea ship", glbPath: "../assets/sea_ship.glb", scale: { x: 0.1, y: 0.1, z: 0.1 } }
            ];

            const promises = modelSpecs.map(spec => {
                return new Promise((resolve, reject) => {
                    loader.load(spec.glbPath, (gltf) => {
                        resolve({
                            scene: gltf.scene,
                            scale: spec.scale,
                            name: spec.name
                        });
                    }, undefined, (error) => {
                        reject(error);
                    });
                });
            });

            return Promise.all(promises);
        };

        const preloadedModels = await preloadModels();

        // Function to get a random cloned model
        function getRandomModelClone() {
            const randomIndex = Math.floor(Math.random() * preloadedModels.length);
            const { scene: modelScene, scale, name } = preloadedModels[randomIndex];
            const clone = modelScene.clone(true);
            clone.scale.set(scale.x, scale.y, scale.z);
            console.log(`Cloned model: ${name}`);
            return clone;
        }

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
                console.log("Контролер натиснуто - розміщуємо модель");

                // Get a random cloned model
                const model = getRandomModelClone();

                // Compute position in front of the controller (0.5 meters ahead)
                const position = new THREE.Vector3(0, 0, -0.5);
                position.applyMatrix4(controller.matrixWorld);
                model.position.copy(position);

                // Add model to scene
                scene.add(model);
            });

        });

        renderer.xr.addEventListener("sessionend", () => {
            console.log("Сесію WebXR завершено");
        });
    }

    initialize();
});
