import * as THREE from 'three';  
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import Stats from 'three/addons/libs/stats.module.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';

const scene = new THREE.Scene();

// Camera를 perspective와 orthographic 두 가지로 switching 해야 해서 const가 아닌 let으로 선언
let camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.x = 120;
camera.position.y = 60;
camera.position.z = 180;
camera.lookAt(scene.position);
scene.add(camera);

const renderer = new THREE.WebGLRenderer();
renderer.setClearColor(new THREE.Color(0x000000));
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// add Stats: 현재 FPS를 보여줌으로써 rendering 속도 표시
const stats = new Stats();
// attach Stats to the body of the html page
document.body.appendChild(stats.dom);

// add OrbitControls: arcball-like camera control
// Camera가 바뀔 때 orbitControls도 바뀌어야 해서 let으로 선언
let orbitControls = new OrbitControls(camera, renderer.domElement);
orbitControls.enableDamping = true; // 관성효과, 바로 멈추지 않고 부드럽게 멈춤
orbitControls.dampingFactor = 0.05; // 감속 정도, 크면 더 빨리 감속, default = 0.05

// add ambient lighting
const ambientLight = new THREE.AmbientLight("#ffffff", 2);
scene.add(ambientLight);

// GUI
const gui = new GUI();
const folder1 = gui.addFolder('Camera');
const controls = new function () {
    this.perspective = "Perspective";
    this.switchCamera = function () {
        if (camera instanceof THREE.PerspectiveCamera) {
            scene.remove(camera);
            camera = null; // 기존의 camera 제거    
            // OrthographicCamera(left, right, top, bottom, near, far)
            camera = new THREE.OrthographicCamera(window.innerWidth / -16, 
                window.innerWidth / 16, window.innerHeight / 16, window.innerHeight / -16, -200, 500);
            camera.position.x = 120;
            camera.position.y = 60;
            camera.position.z = 180;
            camera.lookAt(scene.position);
            orbitControls.dispose(); // 기존의 orbitControls 제거
            orbitControls = null;
            orbitControls = new OrbitControls(camera, renderer.domElement);
            orbitControls.enableDamping = true;
            this.perspective = "Orthographic";
        } else {
            scene.remove(camera);
            camera = null; 
            camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
            camera.position.x = 120;
            camera.position.y = 60;
            camera.position.z = 180;
            camera.lookAt(scene.position);
            orbitControls.dispose(); // 기존의 orbitControls 제거
            orbitControls = null;
            orbitControls = new OrbitControls(camera, renderer.domElement);
            orbitControls.enableDamping = true;
            this.perspective = "Perspective";
        }
    };
};
folder1.add(controls, 'switchCamera');
folder1.add(controls, 'perspective').listen();

const clock = new THREE.Clock();

// ------------------------------------------------------------------------

const textureLoader = new THREE.TextureLoader();
const mercuryTexture = textureLoader.load('Mercury.jpg');
const venusTexture = textureLoader.load('Venus.jpg');
const earthTexture = textureLoader.load('Earth.jpg');
const marsTexture = textureLoader.load('Mars.jpg');

const textures = {
    'Mercury': mercuryTexture,
    'Venus': venusTexture,
    'Earth': earthTexture,
    'Mars': marsTexture
};

// planet data
const planetData = [
    {name: 'Sun', radius: 10, distance: 0, color: 0xffff00, rotationSpeed: 0.001, orbitSpeed: 0},
    {name: 'Mercury', radius: 1.5, distance: 20, color: '#a6a6a6', rotationSpeed: 0.02, orbitSpeed: 0.02},
    {name: 'Venus', radius: 3, distance: 35, color: '#e39e1c', rotationSpeed: 0.015, orbitSpeed: 0.015},
    {name: 'Earth', radius: 3.5, distance: 50, color: '#3498db', rotationSpeed: 0.01, orbitSpeed: 0.01},
    {name: 'Mars', radius: 2.5, distance: 65, color: '#c0392b', rotationSpeed: 0.008, orbitSpeed: 0.008},
];



const planet_arr = [];

planetData.forEach(planet => {

    let planet_map = textures[planet.name];
    let planet_color;

    if (planet_map === undefined) {
        planet_color = planet.color;
    } else {
        planet_color = undefined;
    }

    const material = new THREE.MeshStandardMaterial({
        map: planet_map,
        color: planet_color,
        roughness: 0.8,
        metalness: 0.2
    });

    const geometry = new THREE.SphereGeometry(planet.radius);
    const mesh = new THREE.Mesh(geometry, material);


    const pivot = new THREE.Object3D();

    // distance = 0 : sun
    if (planet.distance !== 0) {
        mesh.position.x = planet.distance;
        pivot.add(mesh);
        scene.add(pivot);
    } else {
        scene.add(mesh);
    }

    planet_arr.push({
        name: planet.name,
        mesh: mesh,
        pivot: pivot,
        rotationSpeed: planet.rotationSpeed,
        orbitSpeed: planet.orbitSpeed,
        angle: Math.random() * Math.PI * 2
    });
});

planet_arr.forEach(planet => {
    if (planet.name === 'Sun') return;


    const folder = gui.addFolder(planet.name);
    folder.add(planet, 'rotationSpeed', 0, 0.1);
    folder.add(planet, 'orbitSpeed', 0, 0.1);
});

console.log(planet_arr);

render();

function render() {
    orbitControls.update();
    stats.update();

    const delta = clock.getDelta();

    planet_arr.forEach(planet => {
        // 자전
        planet.mesh.rotation.y += planet.rotationSpeed;

        // 공전
        if (planet.pivot) {
            planet.angle += planet.orbitSpeed * delta * 60;

            // find distance of planets
            let distance = 0;
            planetData.forEach(data => {
                if (data.name === planet.name) {
                distance = data.distance;
                }
            });

            // 공전 angle
            let x = Math.cos(planet.angle) * distance;
            let z = -Math.sin(planet.angle) * distance;
        

            planet.mesh.position.x = x;
            planet.mesh.position.z = z;
        }
    });

    
    
    // render using requestAnimationFrame
    requestAnimationFrame(render);
    renderer.render(scene, camera);
}
