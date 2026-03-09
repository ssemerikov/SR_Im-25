import * as THREE from 'three';
import {MindARThree} from 'mindar-image-three';



document.addEventListener("DOMContentLoaded", () => {

    const mindarThree = new MindARThree({
	    container: document.body,
	    imageTargetSrc: "../assets/iodomarine.mind",
      });

    const {renderer, scene, camera} = mindarThree;

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

    const pictureTexture2 = textureLoader.load("https://i.imgur.com/fU8O0Wl.png");

    const geometry3= new THREE.CircleGeometry( 1, 32, 0, Math.PI);
    const material3 = new THREE.MeshBasicMaterial({map: pictureTexture2});
    const circle = new THREE.Mesh(geometry3, material3);

    circle.position.set(1, 0, 0);


    anchor1.group.add(cube);
    anchor1.group.add(capsule);
    anchor1.group.add(circle);

    const start = async() => {
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