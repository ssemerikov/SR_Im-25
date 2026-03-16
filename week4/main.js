import * as THREE from 'three';
import {MindARThree} from 'mindar-image-three';

let isStarted = false;
let mindarThree = null;
let renderer = null;

document.addEventListener("DOMContentLoaded", () => {

    const container = document.querySelector("#win2");

    const start = async() => {
        mindarThree = new MindARThree({
            container: container,
            imageTargetSrc: "../assets/capiodomarine.mind",
            maxTrack: 2,
            uiScanning: "no",
            uiLoading: "no",
        });

        ({renderer} = mindarThree);
        const {scene, camera} = mindarThree;

        const anchor1 = mindarThree.addAnchor(0);

        const textureLoader = new THREE.TextureLoader();

        // Create textures for each face of the cube
        const geometry1 = new THREE.BoxGeometry(1, 1, 1);
        // Create materials array for each face
        const materials = [
            new THREE.MeshBasicMaterial({map: textureLoader.load("../assets/unicorn.png"), transparent: true, opacity: 0.7}),   // right face
            new THREE.MeshBasicMaterial({map: textureLoader.load("../assets/micky.jpg")}),    // left face
            new THREE.MeshBasicMaterial({map: textureLoader.load("../assets/iodomarine.png")}),     // top face
            new THREE.MeshBasicMaterial({map: textureLoader.load("../assets/chashka.png")}),  // bottom face
            new THREE.MeshBasicMaterial({map: textureLoader.load("../assets/valery.jpg"), color: 0xff0000}),   // front face
            new THREE.MeshBasicMaterial({map: textureLoader.load("../assets/morda.png")})     // back face
        ];
        const cube = new THREE.Mesh(geometry1, materials);

        cube.position.set(0, 0, -2);
        cube.rotation.set(0, Math.PI/4, 0);

        const pictureTexture = textureLoader.load("https://raw.githubusercontent.com/ssemerikov/SR_Im-25/refs/heads/main/assets/micky.jpg");

        const geometry2 = new THREE.CapsuleGeometry( 0.2, 1, 10, 20, 1 );
        const material2 = new THREE.MeshBasicMaterial({map: pictureTexture});
        const capsule = new THREE.Mesh(geometry2, material2);
        capsule.position.set(-1, 0, 0);

        const pictureTexture2 = textureLoader.load("../assets/unicorn.png");

        const geometry3= new THREE.CircleGeometry( 1, 32, 0, Math.PI);
        const material3 = new THREE.MeshBasicMaterial({map: pictureTexture2});
        const circle = new THREE.Mesh(geometry3, material3);

        circle.position.set(1, 0, 0);

        anchor1.group.add(cube);
        anchor1.group.add(capsule);
        anchor1.group.add(circle);

        // --- Second anchor (iodomarine marker, target index 1) ---
        const anchor2 = mindarThree.addAnchor(1);

        // TODO: Add your 3D models for the second marker here.
        // Example geometries to consider: TorusGeometry, ConeGeometry, SphereGeometry, TorusKnotGeometry
        // Add meshes to anchor2.group.add(mesh) so they appear on the iodomarine marker.

        // Custom scanning overlay centered in #win2
        const scanOverlay = document.createElement("div");
        scanOverlay.id = "scanOverlay";
        scanOverlay.style.cssText = "position:absolute;top:0;left:0;width:100%;height:100%;display:flex;justify-content:center;align-items:center;gap:20px;z-index:10;pointer-events:none;";

        const createMarkerImg = (src) => {
            const img = document.createElement("img");
            img.src = src;
            img.style.cssText = "width:40%;max-width:200px;opacity:0.5;animation:markerFlip 3s ease-in-out infinite;";
            return img;
        };

        scanOverlay.appendChild(createMarkerImg("../assets/chashka.png"));
        scanOverlay.appendChild(createMarkerImg("../assets/iodomarine.png"));
        container.appendChild(scanOverlay);

        // Hide overlay when any target is found
        const removeScanOverlay = () => {
            if (scanOverlay.parentNode) scanOverlay.parentNode.removeChild(scanOverlay);
        };
        anchor1.onTargetFound = removeScanOverlay;
        anchor2.onTargetFound = removeScanOverlay;

        await mindarThree.start();
        renderer.setAnimationLoop(( time ) => {

            cube.rotation.x = time / 2000;
            cube.rotation.y = time / 1000;

            capsule.scale.setScalar(0.5*Math.sin(time/1000) + 0.5,
                        0.5*Math.sin(time/1000) + 0.5,
                        0.5*Math.sin(time/1000) + 0.5);

            circle.position.z = -(2*Math.sin(time/1000)+2);

            renderer.render(scene, camera);
        });
    }

    const stop = () => {
        renderer.setAnimationLoop(null);
        mindarThree.stop();
        renderer.dispose();

        // Stop camera video tracks
        const video = container.querySelector("video");
        if (video && video.srcObject) {
            video.srcObject.getTracks().forEach(track => track.stop());
        }

        // Remove all MindAR-injected elements from container
        while (container.firstChild) {
            container.removeChild(container.firstChild);
        }

        // Remove MindAR overlays appended to body
        document.querySelectorAll(".mindar-ui-overlay").forEach(el => el.remove());

        mindarThree = null;
        renderer = null;
    }

    const button = document.querySelector("#startButton");
    button.addEventListener("click", () => {
        if(!isStarted) {
            start();
            isStarted = true;
            button.textContent = "Зупинити WebAR";
        }
        else {
            stop();
            isStarted = false;
            button.textContent = "Запустити WebAR";
        }
    });
});
