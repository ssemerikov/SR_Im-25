import * as THREE from 'three';
import {MindARThree} from 'mindar-image-three';



document.addEventListener("DOMContentLoaded", () => {

    const mindarThree = new MindARThree({
	    container: document.body,
	    imageTargetSrc: "../assets/cupfacecover.mind",
      });

    const {renderer, scene, camera} = mindarThree;

    const anchor1 = mindarThree.addAnchor(0);
    const anchor2 = mindarThree.addAnchor(1);
    const anchor3 = mindarThree.addAnchor(2);
  
    //const scene = new THREE.Scene();

    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshBasicMaterial({color: "#2862ea"});
    const cube = new THREE.Mesh(geometry, material);

    cube.position.set(0, 0, -2);
    cube.rotation.set(0, Math.PI/4, 0);
    //scene.add(cube);
    anchor1.group.add(cube);

    const material2 = new THREE.MeshBasicMaterial({color: "#ff0000"});
    const cube2 = new THREE.Mesh(geometry, material2);

    anchor2.group.add(cube2);

    const material3 = new THREE.MeshBasicMaterial({color: "#00ff00"});
    const cube3 = new THREE.Mesh(geometry, material2);

    anchor3.group.add(cube3);
    const start = async() => {
        await mindarThree.start();
            renderer.setAnimationLoop(( time ) => {

                cube.rotation.x = time / 2000;
                cube.rotation.y = time / 1000;

                renderer.render(scene, camera);
        });
    }
    
    start();
    //const camera = new THREE.PerspectiveCamera();
    //camera.position.set(1, 1, 5);

    //const renderer = new THREE.WebGLRenderer({alpha: true});
    //renderer.setSize(window.innerWidth, window.innerHeight);
    //renderer.render(scene, camera);

    /*
    const video = document.createElement("video");

    navigator.mediaDevices.getUserMedia({video:true})
        .then((stream) => {
            video.srcObject = stream;
            video.play();
        });

    video.style.position = "absolute";
    video.style.width = renderer.domElement.width;
    video.style.height = renderer.domElement.height;
    renderer.domElement.style.position = "absolute";

    document.body.appendChild(video);
    */

    /*
    function animate( time ) {
        cube.rotation.x = time / 2000;
        cube.rotation.y = time / 1000;
        renderer.render( scene, camera );
    }
        */
        //renderer.setAnimationLoop( animate );

    //document.body.appendChild(renderer.domElement);
});