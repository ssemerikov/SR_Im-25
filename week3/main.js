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
    const avatarTexture = textureLoader.load("../assets/valery.jpg");
    
    const geometry1 = new THREE.BoxGeometry(1, 1, 1);
    const material1 = new THREE.MeshBasicMaterial({map: avatarTexture, 
        color: "#ff0000"});
    const cube = new THREE.Mesh(geometry1, material1);

    cube.position.set(0, 0, -2);
    cube.rotation.set(0, Math.PI/4, 0);

    const pictureTexture = textureLoader.load("https://camo.githubusercontent.com/b771466255f5b0fd36cb1424049292a8b41e96f1ebeee50b56bf61f42bd93372/68747470733a2f2f75706c6f61642e77696b696d656469612e6f72672f77696b6970656469612f636f6d6d6f6e732f352f35622f4d696368656c616e67656c6f5f2d5f4372656174696f6e5f6f665f4164616d5f25323863726f707065642532392e6a7067");

    const geometry2 = new THREE.CapsuleGeometry( 0.2, 1, 10, 20, 1 );
    const material2 = new THREE.MeshBasicMaterial({map: pictureTexture});
    const capsule = new THREE.Mesh(geometry2, material2);
    capsule.position.set(-1, 0, 0);

    const geometry3= new THREE.CircleGeometry( 1, 32, 0, Math.PI);
    const material3 = new THREE.MeshBasicMaterial({color: "#00ff00"});
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