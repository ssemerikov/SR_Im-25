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

function getVideoId(url) {
    const urltypes = [
        /https?:\/\/youtu\.be\/(.+)/,
        /https?:\/\/.*youtube.*v=(.+)/
    ];
    for (const type of urltypes) {
        const match = url.match(type);
        if (match) return match[1];
    }
    return url;
}

const createYoutube = (url) => {
    return new Promise((resolve, reject) => {
        var tag = document.createElement("script");
        tag.src = "https://www.youtube.com/iframe_api";
        var firstScriptTag = document.getElementsByTagName("script")[0];
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

        window.onYouTubeIframeAPIReady = () => {
            const player = new YT.Player("player", {
                videoId: getVideoId(url),
                events: {
                    onReady: () => {
                        resolve(player);
                    }
                }
            });
        };
    });
};

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
        const anchor2 = mindarThree.addCSSAnchor(1);

        const obj2 = new CSS3DObject(document.querySelector("#ar-div2"));
        anchor2.group.add(obj2);

        const player2 = await createYoutube("https://www.youtube.com/watch?v=qP-7GNoDJ5c");

        anchor2.onTargetFound = () => {
            player2.playVideo();
        };
        anchor2.onTargetLost = () => {
            player2.pauseVideo();
        };

        await mindarThree.start();

        renderer.setAnimationLoop(( time ) => {
            renderer.render(scene, camera);
            cssRenderer.render(cssScene, camera);
        });
    }

    const startButton = document.createElement("button");
    startButton.textContent = "Будь-ласка, дозвольте скористатись камерою";
    startButton.addEventListener("click", () => {
        start();
        startButton.style.display = "none";
    });
    document.body.appendChild(startButton);
});
