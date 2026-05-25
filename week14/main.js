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

        const reticleGeometry = new THREE.RingGeometry(0.15, 0.2, 32);
        reticleGeometry.rotateX(- Math.PI / 2);
        const reticleMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const reticle = new THREE.Mesh(reticleGeometry, reticleMaterial);
        reticle.matrixAutoUpdate = false;
        reticle.visible = false;
        scene.add(reticle);

        const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
        scene.add(light);

        document.body.appendChild(renderer.domElement);

        // Додати кнопку UARButton з українською локалізацією
        document.body.appendChild(UARButton.createButton(renderer, {
            requiredFeatures: ["hit-test"],
            optionalFeatures: ["dom-overlay"],
            domOverlay: { root: document.body }
        }));

        const controller = renderer.xr.getController(0);
        scene.add(controller);

        controller.addEventListener("select", () => {
            const geometry = new THREE.BoxGeometry(0.06, 0.06, 0.06);
            const material = new THREE.MeshBasicMaterial({
            color: 0xffffff * Math.random()
            });
            const mesh = new THREE.Mesh(geometry, material);
            mesh.position.setFromMatrixPosition(reticle.matrix);
            mesh.scale.y = Math.random() * 2 + 1;
            scene.add(mesh);
        });

        // Слухачі подій для створення/видалення кубика
        let hitTestSource = null;

        renderer.xr.addEventListener("sessionstart", async (e) => {
            console.log("Сесію WebXR розпочато");

            const session = renderer.xr.getSession();
            const referenceSpace = await session.requestReferenceSpace('local');
            renderer.xr.setReferenceSpace(referenceSpace);
            const viewerReferenceSpace = await session.requestReferenceSpace("viewer");

            hitTestSource = await session.requestHitTestSource({ space: viewerReferenceSpace });

            // Анімаційний цикл — працює і для XR, і для не-XR режиму
            renderer.setAnimationLoop((timestamp, frame) => {
                if (!frame) return;

                const hitTestResults = frame.getHitTestResults(hitTestSource);

                if (hitTestResults.length > 0) {
                    const hit = hitTestResults[0];
                    const hitPose = hit.getPose(referenceSpace);
                    if (hitPose) {
                        reticle.visible = true;
                        reticle.matrix.fromArray(hitPose.transform.matrix);
                    } else {
                        reticle.visible = false;
                    }
                } else {
                    reticle.visible = false;
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
    }

    initialize();
});
