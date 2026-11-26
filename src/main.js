import './style.css';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const scene = new THREE.Scene();
const skyColor = 0xcadce5;
scene.background = new THREE.Color(skyColor);
scene.fog = new THREE.Fog(skyColor, 35, 150);

const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  300,
);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.body.appendChild(renderer.domElement);

const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x5d7045, 2);
scene.add(hemisphereLight);

const sun = new THREE.DirectionalLight(0xfff1cf, 2.5);
sun.position.set(25, 40, 15);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -40;
sun.shadow.camera.right = 40;
sun.shadow.camera.top = 40;
sun.shadow.camera.bottom = -40;
scene.add(sun);

const ground = new THREE.Mesh(
  new THREE.CircleGeometry(145, 64),
  new THREE.MeshStandardMaterial({ color: 0x5e964c, roughness: 1 }),
);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

const road = new THREE.Mesh(
  new THREE.RingGeometry(25, 34, 64),
  new THREE.MeshStandardMaterial({ color: 0x65706f, roughness: 0.95 }),
);
road.rotation.x = -Math.PI / 2;
road.position.y = 0.012;
road.receiveShadow = true;
scene.add(road);

const vehicle = new THREE.Group();
vehicle.position.set(0, 0, 0);
scene.add(vehicle);

function makeFallbackTruck() {
  const truck = new THREE.Group();
  const red = new THREE.MeshStandardMaterial({ color: 0xc9362b, roughness: 0.55 });
  const white = new THREE.MeshStandardMaterial({ color: 0xf1efe6, roughness: 0.7 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x24282b, roughness: 0.65 });

  const body = new THREE.Mesh(new THREE.BoxGeometry(3.4, 1.2, 5.4), red);
  body.position.y = 1.25;
  truck.add(body);

  const cabin = new THREE.Mesh(new THREE.BoxGeometry(3.2, 1.5, 2.1), white);
  cabin.position.set(0, 2.05, 2.2);
  truck.add(cabin);

  for (const x of [-1.7, 1.7]) {
    for (const z of [-1.8, 1.8]) {
      const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.35, 18), dark);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(x, 0.65, z);
      truck.add(wheel);
    }
  }

  truck.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });
  return truck;
}

const fallbackTruck = makeFallbackTruck();
vehicle.add(fallbackTruck);

const status = document.createElement('div');
status.className = 'status';
status.textContent = 'Brandweerwagen laden...';
document.body.appendChild(status);

const loader = new GLTFLoader();
const textureLoader = new THREE.TextureLoader();
const colormap = textureLoader.load('/Textures/colormap.png');
colormap.colorSpace = THREE.SRGBColorSpace;
colormap.anisotropy = renderer.capabilities.getMaxAnisotropy();

loader.load(
  '/firetruck.glb',
  (gltf) => {
    const model = gltf.scene;
    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const maxDimension = Math.max(size.x, size.y, size.z);
    const scale = maxDimension > 0 ? 5.2 / maxDimension : 1;

    model.scale.setScalar(scale);
    model.position.set(
      -center.x * scale,
      -box.min.y * scale,
      -center.z * scale,
    );
    model.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        const materials = Array.isArray(child.material)
          ? child.material
          : [child.material];
        for (const material of materials) {
          if (material) {
            material.map = colormap;
            material.color.set(0xffffff);
            material.needsUpdate = true;
          }
        }
      }
    });

    vehicle.remove(fallbackTruck);
    vehicle.add(model);
    status.textContent = 'WASD / pijltjestoetsen om te rijden';
  },
  undefined,
  (error) => {
    console.error('Kon firetruck.glb niet laden:', error);
    status.textContent = 'Fallback-wagen actief - GLB kon niet laden';
  },
);

const keys = new Set();
window.addEventListener('keydown', (event) => {
  if (
    event.key === 'ArrowUp'
    || event.key === 'ArrowDown'
    || event.key === 'ArrowLeft'
    || event.key === 'ArrowRight'
  ) {
    event.preventDefault();
  }
  keys.add(event.key.toLowerCase());
});
window.addEventListener('keyup', (event) => {
  keys.delete(event.key.toLowerCase());
});

let speed = 0;
const clock = new THREE.Clock();

function animate() {
  const delta = Math.min(clock.getDelta(), 0.05);
  const forward = keys.has('w') || keys.has('arrowup');
  const backward = keys.has('s') || keys.has('arrowdown');
  const left = keys.has('a') || keys.has('arrowleft');
  const right = keys.has('d') || keys.has('arrowright');

  if (forward) speed += 12 * delta;
  if (backward) speed -= 8 * delta;

  if (!forward && !backward) {
    speed *= Math.pow(0.08, delta);
  }
  speed = THREE.MathUtils.clamp(speed, -5, 10);

  if (left) vehicle.rotation.y += 1.5 * delta * Math.sign(speed || 1);
  if (right) vehicle.rotation.y -= 1.5 * delta * Math.sign(speed || 1);

  const forwardVector = new THREE.Vector3(0, 0, 1).applyQuaternion(vehicle.quaternion);
  vehicle.position.addScaledVector(forwardVector, speed * delta);

  const limit = 130;
  if (Math.abs(vehicle.position.x) > limit) {
    vehicle.position.x = THREE.MathUtils.clamp(vehicle.position.x, -limit, limit);
    speed *= -0.15;
  }
  if (Math.abs(vehicle.position.z) > limit) {
    vehicle.position.z = THREE.MathUtils.clamp(vehicle.position.z, -limit, limit);
    speed *= -0.15;
  }

  const behind = new THREE.Vector3(0, 5.5, -9).applyQuaternion(vehicle.quaternion);
  const desiredCameraPosition = vehicle.position.clone().add(behind);
  camera.position.lerp(desiredCameraPosition, 1 - Math.pow(0.002, delta));
  const lookTarget = vehicle.position.clone().add(
    new THREE.Vector3(0, 1.5, 4).applyQuaternion(vehicle.quaternion),
  );
  camera.lookAt(lookTarget);

  renderer.render(scene, camera);
}

camera.position.set(0, 6, -9);
camera.lookAt(0, 1, 4);
renderer.setAnimationLoop(animate);

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
