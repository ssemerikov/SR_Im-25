import * as THREE from 'three';
import { UARButton } from 'webxr/UARButton';

// Масштабувати модель до заданої висоти та відцентрувати
const normalizeModel = (obj, height) => {
    const bbox = new THREE.Box3().setFromObject(obj);
    const size = bbox.getSize(new THREE.Vector3());
    obj.scale.multiplyScalar(height / size.y);

    const bbox2 = new THREE.Box3().setFromObject(obj);
    const center = bbox2.getCenter(new THREE.Vector3());
    obj.position.set(-center.x, -center.y, -center.z);
};

// Рекурсивно встановити прозорість для всіх mesh
const setOpacity = (obj, opacity) => {
    obj.children.forEach((child) => {
        setOpacity(child, opacity);
    });
    if (obj.material) {
        const materials = Array.isArray(obj.material) ? obj.material : [obj.material];
        materials.forEach(mat => {
            mat.transparent = true;
            mat.opacity = opacity;
            mat.needsUpdate = true;
        });
    }
};

// Глибоке клонування з копіюванням матеріалів
const deepClone = (obj) => {
    const newObj = obj.clone();
    newObj.traverse((o) => {
        if (o.isMesh) {
            o.material = o.material.clone();
        }
    });
    return newObj;
};

document.addEventListener("DOMContentLoaded", () => {
    const initialize = async() => {
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 20);

        // Базове освітлення — запасний варіант, коли light-estimate недоступний
        const ambientLight = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
        scene.add(ambientLight);

        // Направлене світло для оцінки освітлення
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(0, 1, 0);
        scene.add(directionalLight);

        const renderer = new THREE.WebGLRenderer({antialias: true, alpha: true});
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.xr.enabled = true;

        // UARButton з трьома обов'язковими функціями
        const arButton = UARButton.createButton(renderer, {
            requiredFeatures: ["hit-test", "light-estimation", "anchors"],
            optionalFeatures: ["dom-overlay"],
            domOverlay: { root: document.body }
        });
        document.body.appendChild(renderer.domElement);
        document.body.appendChild(arButton);

        // Завантаження моделей
        const { GLTFLoader } = await import('three/addons/loaders/GLTFLoader.js');
        const loader = new GLTFLoader();

        const modelSpecs = [
            { name: "teacup", path: "../assets/teacup.glb", height: 0.1 },
            { name: "phoenix_bird", path: "../assets/phoenix_bird.glb", height: 0.15 },
            { name: "sea_ship", path: "../assets/sea_ship.glb", height: 0.2 },
            { name: "terrarium", path: "../assets/smol_ame_in_an_upcycled_terrarium_hololiveen.glb", height: 0.12 },
        ];

        const items = [];
        const templates = new Map();
        for (let i = 0; i < modelSpecs.length; i++) {
            const spec = modelSpecs[i];
            const gltf = await new Promise((resolve, reject) => {
                loader.load(spec.path, resolve, undefined, reject);
            });
            normalizeModel(gltf.scene, spec.height);
            const item = new THREE.Group();
            item.add(gltf.scene);
            item.visible = false;
            setOpacity(item, 0.5);
            items.push(item);
            templates.set(spec.name, item);
            scene.add(item);
        }

        // Зв'язки anchor → mesh для оновлення позиції
        const anchoredObjects = [];

        let selectedItem = null;
        let prevTouchPosition = null;
        let touchDown = false;

        const itemButtons = document.querySelector("#item-buttons");
        const confirmButtons = document.querySelector("#confirm-buttons");

        const select = (selectItem) => {
            items.forEach((item) => {
                item.visible = item === selectItem;
            });
            selectedItem = selectItem;
            itemButtons.style.display = "none";
            confirmButtons.style.display = "flex";
        };

        const cancelSelect = () => {
            itemButtons.style.display = "flex";
            confirmButtons.style.display = "none";
            if (selectedItem) {
                selectedItem.visible = false;
            }
            selectedItem = null;
        };

        document.querySelector("#place").addEventListener("beforexrselect", (e) => {
            e.preventDefault();
        });
        document.querySelector("#place").addEventListener("click", async (e) => {
            e.preventDefault();
            e.stopPropagation();
            const spawnItem = deepClone(selectedItem);
            setOpacity(spawnItem, 1.0);
            scene.add(spawnItem);

            // Зберегти для створення anchor у наступному кадрі
            spawnItem.userData.pendingAnchor = true;
            anchoredObjects.push({ mesh: spawnItem, anchor: null });
            cancelSelect();
        });

        document.querySelector("#cancel").addEventListener("beforexrselect", (e) => {
            e.preventDefault();
        });
        document.querySelector("#cancel").addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            cancelSelect();
        });

        for (let i = 0; i < items.length; i++) {
            const el = document.querySelector("#item" + i);
            el.addEventListener("beforexrselect", (e) => {
                e.preventDefault();
            });
            el.addEventListener("click", (e) => {
                e.preventDefault();
                e.stopPropagation();
                select(items[i]);
            });
        }

        const controller = renderer.xr.getController(0);
        scene.add(controller);

        controller.addEventListener("selectstart", () => {
            touchDown = true;
        });
        controller.addEventListener("selectend", () => {
            touchDown = false;
            prevTouchPosition = null;
        });

        let hitTestSource = null;
        let lightProbe = null;
        let currentHitTestResult = null;

        renderer.xr.addEventListener("sessionstart", async () => {
            console.log("Сесію WebXR розпочато");
            itemButtons.style.display = "flex";

            const session = renderer.xr.getSession();
            const referenceSpace = await session.requestReferenceSpace("local");
            renderer.xr.setReferenceSpace(referenceSpace);
            const viewerReferenceSpace = await session.requestReferenceSpace("viewer");

            hitTestSource = await session.requestHitTestSource({ space: viewerReferenceSpace });

            // Запит джерела оцінки освітлення
            try {
                lightProbe = await session.requestLightProbe();
                console.log("Light probe створено");
            } catch (err) {
                console.warn("Light estimation не підтримується:", err.message);
            }

            renderer.setAnimationLoop((timestamp, frame) => {
                if (!frame) return;

                // --- Lighting Estimation ---
                if (lightProbe) {
                    const lightEstimate = frame.getLightEstimate(lightProbe);
                    if (lightEstimate) {
                        const dir = lightEstimate.primaryLightDirection;
                        const intensity = lightEstimate.primaryLightIntensity;

                        directionalLight.position.set(dir.x, dir.y, dir.z);
                        const brightness = (intensity.x + intensity.y + intensity.z) / 3;
                        directionalLight.intensity = THREE.MathUtils.clamp(brightness * 5, 0.2, 3);

                        // Зменшуємо ambient, коли є directional estimate
                        ambientLight.intensity = 0.3;
                    } else {
                        // Немає оцінки — повертаємось до базового освітлення
                        ambientLight.intensity = 1;
                        directionalLight.intensity = 0;
                    }
                }

                // --- Обертання пальцем/контролером ---
                if (touchDown && selectedItem) {
                    const viewerPose = frame.getViewerPose(referenceSpace);
                    if (viewerPose) {
                        const viewerMatrix = new THREE.Matrix4().fromArray(viewerPose.transform.inverse.matrix);
                        const newPosition = controller.position.clone();
                        newPosition.applyMatrix4(viewerMatrix);
                        if (prevTouchPosition) {
                            const deltaX = newPosition.x - prevTouchPosition.x;
                            selectedItem.rotation.y += deltaX * 30;
                        }
                        prevTouchPosition = newPosition;
                    }
                }

                // --- Hit-Test ---
                let hitMatrix = null;
                const hitTestResults = frame.getHitTestResults(hitTestSource);
                if (hitTestResults.length > 0) {
                    const hit = hitTestResults[0];
                    currentHitTestResult = hit;
                    const hitPose = hit.getPose(referenceSpace);
                    if (hitPose) {
                        hitMatrix = new THREE.Matrix4().fromArray(hitPose.transform.matrix);
                    }
                } else {
                    currentHitTestResult = null;
                }

                // Оновлення позиції вибраного об'єкта
                if (selectedItem) {
                    if (hitMatrix) {
                        selectedItem.visible = true;
                        selectedItem.position.setFromMatrixPosition(hitMatrix);
                    } else {
                        selectedItem.visible = false;
                    }
                }

                // --- Anchors: створення для pending моделей ---
                for (const entry of anchoredObjects) {
                    if (entry.mesh.userData.pendingAnchor && currentHitTestResult) {
                        try {
                            const anchor = await currentHitTestResult.createAnchor();
                            entry.anchor = anchor;
                            entry.mesh.userData.pendingAnchor = false;
                            console.log("Anchor створено");
                        } catch (err) {
                            // Anchors не підтримуються — модель залишається на місці
                            entry.mesh.userData.pendingAnchor = false;
                            console.warn("Anchor створення не вдалося:", err.message);
                        }
                    }
                }

                // --- Anchors: оновлення позиції ---
                for (const entry of anchoredObjects) {
                    if (entry.anchor) {
                        const anchorPose = frame.getPose(entry.anchor.anchorSpace, referenceSpace);
                        if (anchorPose) {
                            entry.mesh.position.setFromMatrixPosition(
                                new THREE.Matrix4().fromArray(anchorPose.transform.matrix)
                            );
                            const rotMatrix = new THREE.Matrix4().fromArray(anchorPose.transform.matrix);
                            entry.mesh.quaternion.setFromRotationMatrix(rotMatrix);
                        }
                    }
                }

                renderer.render(scene, camera);
            });
        });

        renderer.xr.addEventListener("sessionend", () => {
            console.log("Сесію WebXR завершено");
            if (hitTestSource) {
                hitTestSource.cancel();
                hitTestSource = null;
            }
            ambientLight.intensity = 1;
            directionalLight.intensity = 0;
        });
    };

    initialize();
});
