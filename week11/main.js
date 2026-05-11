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

        let isSessionActive = false;

        renderer.xr.addEventListener("sessionstart", (e) => {
            console.log("Сесiю WebXR розпочато");
            isSessionActive = true;
        });

        renderer.xr.addEventListener("sessionend", () => {
            console.log("Сесiю WebXR завершено");
            isSessionActive = false;
        });

        //...

        renderer.setAnimationLoop(() => {
            if (!isSessionActive) return;
            renderer.render(scene, camera);
        });
    }

    initialize();
});