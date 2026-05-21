import * as THREE from 'three';


document.addEventListener("DOMContentLoaded", () => {
    const initialize = async() => {
        // код функцiї initialize
        const arButton = document.querySelector("#ar-button");
        const supported = navigator.xr &&
            await navigator.xr.isSessionSupported("immersive-ar");

        if (!supported) {
            arButton.textContent = "WebXR не пiдтримується";
            arButton.disabled = true;
            return;
        }
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera();
        
        const renderer = new THREE.WebGLRenderer({antialias: true, alpha: true});
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(window.devicePixelRatio);

        document.body.appendChild(renderer.domElement);
        
        const geometry = new THREE.BoxGeometry(0.06, 0.06, 0.06);
        const material = new THREE.MeshBasicMaterial({color: 0x00ff00});
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(0, 0, -0.3);
        scene.add(mesh);

        const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
        scene.add(light);

        renderer.xr.addEventListener("sessionstart", (e) => {
            console.log("Сесiю WebXR розпочато");
        });

        renderer.xr.addEventListener("sessionend", () => {
            console.log("Сесiю WebXR завершено");
        });

        //...
        let currentSession = null;
        const start = async() => {
            currentSession = await navigator.xr.requestSession(
                "immersive-ar", {
                    optionalFeatures: ["dom-overlay"],
                domOverlay: {root: document.body}
                }
            );

            renderer.xr.enabled = true;
            renderer.xr.setReferenceSpaceType("local");

            await renderer.xr.setSession(currentSession);
            
            arButton.textContent = "Завершити сесiю WebXR";
            renderer.setAnimationLoop(() => {
                if (!currentSession) return;
                renderer.render(scene, camera);
            });

        }

        const end = async() => {
            await currentSession.end();
            renderer.setAnimationLoop(null);
            renderer.clear();
            currentSession = null;
            renderer.xr.enabled = false;
            arButton.textContent = "Увiйти до WebXR";
        }

        arButton.addEventListener("click", () => {
            if (currentSession) {
                end();
            } else {
                start();
            }
        });

    }

    initialize();
});
