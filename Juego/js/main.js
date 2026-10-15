import { GameMap } from "./map.js";
import { Player } from "./player.js";

const canvas = document.querySelector("#game");
const context = canvas.getContext("2d");

if (!context) {
  throw new Error("No se pudo inicializar el contexto 2D del canvas.");
}

const gameMap = new GameMap();
const player = new Player();
let lastFrameTime = 0;
let batteryLevel = 100;
let mouseX = window.innerWidth;
let mouseY = window.innerHeight / 2;
let flicker = 1;
let flickerCooldown = 0;

canvas.addEventListener("mousemove", (event) => {
  const bounds = canvas.getBoundingClientRect();
  mouseX = event.clientX - bounds.left;
  mouseY = event.clientY - bounds.top;
});

function resizeCanvas() {
  const pixelRatio = window.devicePixelRatio || 1;
  const width = window.innerWidth;
  const height = window.innerHeight;

  canvas.width = Math.round(width * pixelRatio);
  canvas.height = Math.round(height * pixelRatio);
  context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
}

function frame(timestamp) {
  const deltaTime = lastFrameTime === 0 ? 0 : (timestamp - lastFrameTime) / 1000;
  lastFrameTime = timestamp;

  const frameDelta = Math.min(deltaTime, 0.05);
  player.update(frameDelta, gameMap);
  batteryLevel = Math.max(0, batteryLevel - frameDelta * 2.5);

  if (
    batteryLevel < 100 &&
    gameMap.collectBatteryAt(
      player.x + player.size / 2,
      player.y + player.size / 2,
      28,
    )
  ) {
    batteryLevel = Math.min(100, batteryLevel + 35);
  }

  flickerCooldown -= frameDelta;
  if (flickerCooldown <= 0) {
    flickerCooldown = 0.06 + Math.random() * 0.16;
    flicker = Math.random() < 0.08 ? 0.84 : 0.96 + Math.random() * 0.04;
  }

  const width = window.innerWidth;
  const height = window.innerHeight;
  const camera = gameMap.getCameraPosition(
    player.x + player.size / 2,
    player.y + player.size / 2,
    width,
    height,
  );

  context.save();
  context.translate(-camera.x, -camera.y);
  gameMap.draw(context, width, height, camera.x, camera.y);
  player.draw(context);
  context.restore();

  gameMap.drawDarkness(
    context,
    width,
    height,
    window.devicePixelRatio || 1,
    player.x + player.size / 2,
    player.y + player.size / 2,
    camera.x,
    camera.y,
    mouseX,
    mouseY,
    batteryLevel,
    flicker,
  );

  context.fillStyle = "rgba(8, 9, 9, 0.82)";
  context.fillRect(16, 16, 184, 50);
  context.fillStyle = "#c5c0a9";
  context.font = "12px sans-serif";
  context.fillText("BATERÍA", 28, 36);
  context.fillStyle = "#292929";
  context.fillRect(28, 44, 156, 10);
  context.fillStyle =
    batteryLevel > 25 ? "#b9a65e" : batteryLevel > 0 ? "#b46b45" : "#4c3935";
  context.fillRect(28, 44, 156 * (batteryLevel / 100), 10);

  window.requestAnimationFrame(frame);
}

window.addEventListener("resize", resizeCanvas);
resizeCanvas();
window.requestAnimationFrame(frame);
