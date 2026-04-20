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

        const geometry = new THREE.SphereGeometry(0.01, 32, 16);
        const material = new THREE.MeshBasicMaterial({color: 0x0000ff,
        transparent: true, opacity: 0.5});
        
        const spheres = [];
        
        for(let i = 0; i < 468; i++) {
            spheres.push(new THREE.Mesh(geometry, material));
        }
        
        const anchors = [];

        for(let i = 0; i < 468; i++) {
            anchors.push(mindarThree.addAnchor(i));
        }
        
        for(let i = 0; i < 468; i++) {
            anchors[i].group.add(spheres[i]);
        }
        
        await mindarThree.start();

        renderer.setAnimationLoop(( time ) => {
            renderer.render(scene, camera);
        });
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
