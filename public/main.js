import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.138.0/build/three.module.js';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.138.0/examples/jsm/controls/OrbitControls.js';

// Подключение к WebSocket-серверу по IP-адресу WSL
const socket = io('http://172.18.219.234:3000');  // Укажите IP WSL

// Переменные для отслеживания игроков
const players = {};  // Список всех игроков
const playerMeshes = {};  // Меши для отображения игроков

// Создаем сцену
const scene = new THREE.Scene();

// Создаем камеру (перспективная)
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 10;

// Добавляем свет
const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
directionalLight.position.set(10, 20, 10);
directionalLight.castShadow = true;
scene.add(directionalLight);

const ambientLight = new THREE.AmbientLight(0x404040, 1.5);
scene.add(ambientLight);

// Создаем рендерер
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

// Создаем куб игрока
const geometry = new THREE.BoxGeometry();
const material = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
const player = new THREE.Mesh(geometry, material);
player.castShadow = true;
scene.add(player);

// Управление камерой
const controls = new OrbitControls(camera, renderer.domElement);

// Перемещение игрока с помощью клавиатуры
const playerSpeed = 0.1;
const keys = {};

document.addEventListener('keydown', (event) => {
  keys[event.code] = true;
});

document.addEventListener('keyup', (event) => {
  keys[event.code] = false;
});

// Обработка движения
function movePlayer() {
  if (keys['ArrowUp'] || keys['KeyW']) player.position.z -= playerSpeed;
  if (keys['ArrowDown'] || keys['KeyS']) player.position.z += playerSpeed;
  if (keys['ArrowLeft'] || keys['KeyA']) player.position.x -= playerSpeed;
  if (keys['ArrowRight'] || keys['KeyD']) player.position.x += playerSpeed;

  // Отправляем позицию и вращение игрока на сервер
  socket.emit('playerMove', {
    position: player.position,
    rotation: player.rotation
  });
}

// Подключение к WebSocket-серверу
socket.on('connect', () => {
  console.log('WebSocket подключен');
});

// Получение данных других игроков
socket.on('currentPlayers', (playersData) => {
  Object.keys(playersData).forEach((id) => {
    if (id !== socket.id) {
      addOtherPlayer(id, playersData[id]);
    }
  });
});

// Добавление нового игрока
socket.on('newPlayer', ({ id, playerData }) => {
  addOtherPlayer(id, playerData);
});

// Удаление игрока
socket.on('removePlayer', (id) => {
  if (playerMeshes[id]) {
    scene.remove(playerMeshes[id]);
    delete playerMeshes[id];
  }
});

// Обновление позиций других игроков
socket.on('playerMoved', ({ id, playerData }) => {
  if (playerMeshes[id]) {
    playerMeshes[id].position.copy(playerData.position);
    playerMeshes[id].rotation.copy(playerData.rotation);
  }
});

// Добавление другого игрока
function addOtherPlayer(id, playerData) {
  const otherPlayerMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 });
  const otherPlayer = new THREE.Mesh(geometry, otherPlayerMaterial);
  otherPlayer.position.copy(playerData.position);
  otherPlayer.rotation.copy(playerData.rotation);
  otherPlayer.castShadow = true;
  scene.add(otherPlayer);

  playerMeshes[id] = otherPlayer;
}

// Анимация
function animate() {
  requestAnimationFrame(animate);
  movePlayer();
  controls.update();
  renderer.render(scene, camera);
}

// Запуск анимации
animate();
