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
        obj.material.format = THREE.RGBAFormat;
        obj.material.opacity = opacity;
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

        const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
        scene.add(light);

        const renderer = new THREE.WebGLRenderer({antialias: true, alpha: true});
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.xr.enabled = true;

        // UARButton з z-index: 1001 (над canvas, під overlay-елементами)
        const arButton = UARButton.createButton(renderer, {
            requiredFeatures: ["hit-test"],
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
            scene.add(item);
        }

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
        document.querySelector("#place").addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            const spawnItem = deepClone(selectedItem);
            setOpacity(spawnItem, 1.0);
            scene.add(spawnItem);
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

        // Відстеження натискання для обертання
        controller.addEventListener("selectstart", () => {
            touchDown = true;
        });
        controller.addEventListener("selectend", () => {
            touchDown = false;
            prevTouchPosition = null;
        });

        let hitTestSource = null;

        renderer.xr.addEventListener("sessionstart", async () => {
            console.log("Сесію WebXR розпочато");
            itemButtons.style.display = "flex";

            const session = renderer.xr.getSession();
            const referenceSpace = await session.requestReferenceSpace("local");
            renderer.xr.setReferenceSpace(referenceSpace);
            const viewerReferenceSpace = await session.requestReferenceSpace("viewer");

            hitTestSource = await session.requestHitTestSource({ space: viewerReferenceSpace });

            renderer.setAnimationLoop((timestamp, frame) => {
                if (!frame) return;

                // Обертання пальцем/контролером під час утримання
                if (touchDown && selectedItem) {
                    const viewerPose = frame.getViewerPose(referenceSpace);
                    if (viewerPose) {
                        const viewerMatrix = new THREE.Matrix4().fromArray(viewerPose.transform.inverse.matrix);
                        const newPosition = controller.position.clone();
                        newPosition.applyMatrix4(viewerMatrix);
                        if (prevTouchPosition) {
                            const deltaX = newPosition.x - prevTouchPosition.x;
                            const deltaZ = newPosition.y - prevTouchPosition.y;
                            selectedItem.rotation.y += deltaX * 30;
                        }
                        prevTouchPosition = newPosition;
                    }
                }

                // Оновлення позиції вибраного об'єкта через hit-test
                if (selectedItem) {
                    const hitTestResults = frame.getHitTestResults(hitTestSource);
                    if (hitTestResults.length > 0) {
                        const hit = hitTestResults[0];
                        const hitPose = hit.getPose(referenceSpace);
                        if (hitPose) {
                            selectedItem.visible = true;
                            selectedItem.position.setFromMatrixPosition(
                                new THREE.Matrix4().fromArray(hitPose.transform.matrix)
                            );
                        }
                    } else {
                        selectedItem.visible = false;
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
        });
    };

    initialize();
});
