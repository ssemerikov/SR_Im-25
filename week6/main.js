import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {MindARThree} from 'mindar-image-three';

let isStarted = false;
let mindarThree = null;
let renderer = null;

const loadVideo = (path) => {
    return new Promise((resolve, reject) => {
        const video = document.createElement("video");
        video.addEventListener("loadeddata", () => {
            video.setAttribute("playsinline", "");
            video.setAttribute("muted", "true");
            video.setAttribute("loop", "");
            resolve(video);
        });
        video.src = path;
    });
}

document.addEventListener("DOMContentLoaded", () => {

    const container = document.querySelector("#win2");

    const start = async() => {
        
        mindarThree = new MindARThree({
            container: container,
            imageTargetSrc: "../assets/capiodomarine.mind",
            maxTrack: 2,
            uiScanning: "yes",
            uiLoading: "yes",
        });

        const {scene, camera, renderer} = mindarThree;

        var light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
        scene.add(light);

        // --- First anchor (cup marker, target index 0) ---
        const anchor1 = mindarThree.addAnchor(0);

        const video = await loadVideo("../assets/Nathan Evans - Wellerman (Sea Shanty).mp4");
        console.log("Video loaded", video);

        const texture = new THREE.VideoTexture(video);
        // 856:313 - співвідношення сторін відео, тому 856/856:313/856 
        //const geometry = new THREE.PlaneGeometry(1, video.height/video.width);
        const geometry = new THREE.PlaneGeometry(1, 312/856);
        const material = new THREE.MeshBasicMaterial({map: texture});
        //const material = new THREE.MeshBasicMaterial();
        const plane = new THREE.Mesh(geometry, material);
        //plane.rotation.x = -Math.PI / 2; // Rotate to lie flat on the marker
        anchor1.group.add(plane);

        anchor1.onTargetFound = () => {
            video.play();
        }
        anchor1.onTargetLost = () => {
            video.pause();
        }

        /*
        video.addEventListener("play", () => {
            video.currentTime = 0;
        });
        */

        // --- Second anchor (iodomarine marker, target index 1) ---
        const anchor2 = mindarThree.addAnchor(1);

        const gltfLoader = new GLTFLoader();

        let model = null;
                
        gltfLoader.load("../assets/sea_ship.glb", (gltf) => {
            model = gltf.scene;
            model.scale.set(0.1, 0.1, 0.1);
            model.position.set(0, 0, 0);
            model.rotation.set(0, -Math.PI / 2, 0); // Rotate model to stand upright
            anchor2.group.add(model);
            console.log("Model loaded and added to anchor 2", gltf);
        });

        document.body.addEventListener("click", (e) => {
            const mouseX = ( e.clientX / window.innerWidth ) * 2 - 1;
            const mouseY = - ( e.clientY / window.innerHeight ) * 2 + 1;
            //console.log("Mouse click at", mouseX, mouseY);
            const mouse = new THREE.Vector2(mouseX, mouseY);
            const raycaster = new THREE.Raycaster();
            raycaster.setFromCamera(mouse, camera);
            const intersects = raycaster.intersectObjects(scene.children, true);
            console.log("Intersects:", intersects);
            if(intersects.length>0) {
                /*
                let o = intersects[0].object;
                while(o.parent)
                    o = o.parent;
                if(o === model) {
                */
                    model.rotation.z += (Math.random() * 45 + 45) * Math.PI / 180;
                    console.log("Model clicked, new z rotation:", model.rotation.z);
            }
        });

        await mindarThree.start();

        renderer.setAnimationLoop(( time ) => {
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
