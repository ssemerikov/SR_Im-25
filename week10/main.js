/**
  **/

import * as THREE from 'three';
//import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {MindARThree} from 'mindar-face-three';
//import {CSS3DObject} from 'three/addons/renderers/CSS3DRenderer.js';


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

        const textureLoader = new THREE.TextureLoader();
        const texture = textureLoader.load('../assets/morda.png');
        const faceMesh = mindarThree.addFaceMesh();
        faceMesh.material.map = texture;
        faceMesh.material.transparent = true;
        faceMesh.material.needsUpdate = true;
        scene.add(faceMesh);
        
        await mindarThree.start();

        //const video = document.querySelector("video");
        //video.style.visibility = "hidden";


        renderer.setAnimationLoop(( time ) => {
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

    /*
    const startButton = document.createElement("button");
    startButton.textContent = "Будь-ласка, дозвольте скористатись камерою";
    startButton.addEventListener("click", () => {
    */
    start();
    //    startButton.style.display = "none";
    //});
    //document.body.appendChild(startButton);
});
