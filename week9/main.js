import * as THREE from 'three';
import { MindARThree } from 'mindar-face-three';
import { loadGLTF } from '../lib/mylib/loader.js';

document.addEventListener("DOMContentLoaded", () => {
    const start = async () => {
        const mindarThree = new MindARThree({
            container: document.querySelector("#container"),
        });

        const { renderer, scene, camera } = mindarThree;

        // Додаємо освітлення
        const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
        scene.add(light);
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
        directionalLight.position.set(-0.5, 1, 1);
        scene.add(directionalLight);

        // 1. Налаштування оклюдера голови
        const occluder = await loadGLTF('../mind-ar-js-master/examples/face-tracking/assets/sparkar/headOccluder.glb');
        occluder.scene.scale.set(0.07, 0.07, 0.07);
        occluder.scene.position.set(0, -0.2, 0.15);
        
        // Робимо оклюдер синім, але за замовчанням невидимим для ока (colorWrite: false)
        const occluderMaterial = new THREE.MeshBasicMaterial({ color: 0x0000ff, colorWrite: false });
        occluder.scene.traverse((o) => {
            if (o.isMesh) {
                o.material = occluderMaterial;
            }
        });
    
        occluder.scene.renderOrder = 0; // Рендеримо першим

        const occluderAnchor = mindarThree.addAnchor(168); // Точка між очима
        occluderAnchor.group.add(occluder.scene);

        // 2. Налаштування капелюха
        const hat = await loadGLTF('../mind-ar-js-master/examples/face-tracking/assets/hat/scene.gltf');
        hat.scene.scale.set(0.35, 0.35, 0.35);
        hat.scene.position.set(0, 1, -0.45);
        hat.scene.renderOrder = 1; // Рендеримо другим

        const hatAnchor = mindarThree.addAnchor(10); // Верхня точка голови
        hatAnchor.group.add(hat.scene);

        // 3. Налаштування маски для обличчя (з task10)
        const faceMesh = mindarThree.addFaceMesh();
        const textureLoader = new THREE.TextureLoader();
        textureLoader.load('../assets/morda.png', (texture) => {
            faceMesh.material.map = texture;
            faceMesh.material.transparent = true;
            faceMesh.material.needsUpdate = true;
        });
        
        let maskActive = false; // Стан маски: за замовчанням вимкнена
        faceMesh.visible = maskActive;
        scene.add(faceMesh);

        await mindarThree.start();

        // Кнопка перемикання відео (AR/VR)
        const toggleVideoBtn = document.querySelector("#toggle-video-btn");
        let videoVisible = true;
        toggleVideoBtn.addEventListener("click", () => {
            videoVisible = !videoVisible;
            const video = document.querySelector("#container video");
            if (video) {
                video.style.visibility = videoVisible ? "visible" : "hidden";
            }
            toggleVideoBtn.textContent = videoVisible ? "Приховати відео" : "Показати відео";
        });

        // Кнопка перемикання маски
        const toggleMaskBtn = document.querySelector("#toggle-mask-btn");
        toggleMaskBtn.addEventListener("click", () => {
            maskActive = !maskActive;
            toggleMaskBtn.textContent = maskActive ? "Приховати маску" : "Показати маску";
        });

        // Кнопка перемикання видимості оклюдера
        const toggleOccluderBtn = document.querySelector("#toggle-occluder-btn");
        let occluderDebugVisible = false;
        toggleOccluderBtn.addEventListener("click", () => {
            occluderDebugVisible = !occluderDebugVisible;
            occluder.scene.traverse((o) => {
                if (o.isMesh) {
                    o.material.colorWrite = occluderDebugVisible;
                }
            });
            toggleOccluderBtn.textContent = occluderDebugVisible ? "Приховати оклюдер" : "Показати оклюдер";
        });

        // Кнопка фотографування
        const photoBtn = document.querySelector("#photo-btn");
        photoBtn.addEventListener("click", () => {
            // Логіка фотографування
            //const video = document.querySelector("#container video");
            const video = mindarThree.video; // Отримуємо відео безпосередньо з MindAR
            const renderCanvas = renderer.domElement;
            const canvas = document.createElement('canvas');
            canvas.width = renderCanvas.width;
            canvas.height = renderCanvas.height;
            const context = canvas.getContext('2d');
            //ctx.drawImage(renderCanvas, 0, 0);
            //console.log(video);
            const sx = (video.clientWidth - renderCanvas.clientWidth) / 2 * video.videoWidth / video.clientWidth;
            const sy = (video.clientHeight - renderCanvas.clientHeight) / 2 * video.videoHeight / video.clientHeight;
            const sw = video.videoWidth - sx * 2;
            const sh = video.videoHeight - sy * 2;
            context.drawImage(video, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
            renderer.preserveDrawingBuffer = true;
            renderer.render(scene, camera);
            context.drawImage(renderCanvas, 0, 0, canvas.width, canvas.height);
            // Додати дату та час
            context.font = "20px Arial";
            context.fillStyle = "white";
            const timestamp = new Date().toLocaleString();
            context.fillText(timestamp, 10, canvas.height - 10);


            const data = canvas.toDataURL("image/png");
            const link = document.createElement('a');
            link.href = data;
            link.download = 'photo.png';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);    
            // Повертаємо preserveDrawingBuffer до початкового стану
            renderer.preserveDrawingBuffer = false; 
        });

        document.querySelector("#switch").addEventListener("click", () => {
            mindarThree.switchCamera();
        });

        renderer.setAnimationLoop(() => {
            // Примусово встановлюємо видимість маски згідно зі станом, 
            // щоб MindAR не вмикав її автоматично при відстеженні
            faceMesh.visible = maskActive;
            if (faceMesh.material) faceMesh.material.visible = maskActive;
            
            renderer.render(scene, camera);
        });
    }
    
    start();
});
