import * as THREE from 'three';
import {MindARThree} from 'mindar-face-three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';

document.addEventListener("DOMContentLoaded", () => {
    const start = async() => {
        const mindarThree = new MindARThree({
            container: document.body,
            uiScanning: "yes",
            uiLoading: "yes",
        });

        const {scene, camera, renderer} = mindarThree;

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        scene.add(ambientLight);

        const directLight = new THREE.DirectionalLight(0xffffff, 1);
        directLight.position.set(0, 0, 1);
        scene.add(directLight);

        const loader = new GLTFLoader();

        // Load Occluder
        loader.load('../assets/headOccluder.glb', (gltf) => {
            const occluderModel = gltf.scene;
            occluderModel.traverse((node) => {
                if (node.isMesh) {
                    node.material.colorWrite = false;
                }
            });
            occluderModel.renderOrder = 0; // Render first

            const anchor = mindarThree.addAnchor(168); // Bridge of nose
            anchor.group.add(occluderModel);
            occluderModel.position.set(0, -0.3, 0.15);
            occluderModel.scale.set(0.065, 0.065, 0.065);
        });

        // Load Hat
        loader.load('../assets/hat.gltf', (gltf) => {
            console.log("Hat loaded", gltf);
            const hatModel = gltf.scene;
            hatModel.renderOrder = 1;

            const anchor = mindarThree.addAnchor(10); // Forehead
            anchor.group.add(hatModel);
            
            // Realistic scale and position for the cowboy hat model
            hatModel.position.set(0, -0.2, -0.5); 
            hatModel.scale.set(0.008, 0.008, 0.008); 
            hatModel.rotation.set(0, Math.PI, 0); // Rotate 180 degrees if needed
        });

        await mindarThree.start();

        renderer.setAnimationLoop(() => {
            renderer.render(scene, camera);
        });
    }

    window.flipflop = () => {
        const video = document.querySelector("video");
        const button = document.querySelector("#flipflop");

        if (video.style.visibility === "hidden") {
            video.style.visibility = "visible";
            button.innerHTML = "Перейти до віртуальної реальності";
        } else {
            video.style.visibility = "hidden";
            button.innerHTML = "Перейти до доповненої реальності";
        }
    }

    start();
});
