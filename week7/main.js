/**
 * Використовуючи матеріал тижня, створіть два власні маркери та прив'яжіть до першого довільне відео 
 * з YouTube про океан, а до другого - довільне відео з Vimeo.  
 * 
 * YouTube: https://www.youtube.com/watch?v=qP-7GNoDJ5c
 * Vimeo: https://vimeo.com/498962326
  **/

import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {MindARThree} from 'mindar-image-three';
import {CSS3DObject} from 'three/addons/renderers/CSS3DRenderer.js';

const loadVideo = (path) => {
    return new Promise((resolve, reject) => {
        const video = document.createElement("video");
        video.addEventListener("loadeddata", () => {
            video.setAttribute("playsinline", "");
            video.setAttribute("muted", "true");
            video.setAttribute("loop", "");
            video.muted = true;
            resolve(video);
        });
        video.src = path;
    });
}

document.addEventListener("DOMContentLoaded", () => {

    const start = async() => {
        
        // document.createElement("button"); - hide using CSS until user clicks it, then start AR experience and remove the button

        const mindarThree = new MindARThree({
            container: document.body,
            imageTargetSrc: "../assets/capiodomarine.mind",
            maxTrack: 2,
            uiScanning: "yes",
            uiLoading: "yes",
        });

        const {scene, cssScene, camera, renderer, cssRenderer} = mindarThree;

        var light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
        scene.add(light);

        const obj = new CSS3DObject(document.querySelector("#ar-div"));
        const anchor1 = mindarThree.addCSSAnchor(0);
        anchor1.group.add(obj);

        var iframe = document.querySelector('iframe');
        var player = new Vimeo.Player(iframe);

        player.on('play', function() {
            console.log('Played the video');
        });

        //player.setVolume(0);

        anchor1.onTargetFound = () => {
            player.play();
        }
        anchor1.onTargetLost = () => {
            player.pause();
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
            if (!model) return;
            const mouseX = ( e.clientX / window.innerWidth ) * 2 - 1;
            const mouseY = - ( e.clientY / window.innerHeight ) * 2 + 1;
            const mouse = new THREE.Vector2(mouseX, mouseY);
            const raycaster = new THREE.Raycaster();
            raycaster.setFromCamera(mouse, camera);
            const intersects = raycaster.intersectObjects([model], true);
            if (intersects.length > 0) {
                model.rotation.z += (Math.random() * 45 + 45) * Math.PI / 180;
                console.log("Model clicked, new z rotation:", model.rotation.z);
            }
        });


        await mindarThree.start();

        renderer.setAnimationLoop(( time ) => {
            renderer.render(scene, camera);
            cssRenderer.render(cssScene, camera);
        });
    }

    start();
    const startButton = document.createElement("button");
    startButton.textContent = "Будь-ласка, дозвольте скористатись камерою";
    startButton.addEventListener("click", () => {
        start();
        startButton.style.display = "none";
    });
    document.body.appendChild(startButton);
});
