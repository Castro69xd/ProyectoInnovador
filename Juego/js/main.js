import { Dino } from "./dino.js";
import { GameMap } from "./map.js";
import { Player } from "./player.js";
import { AudioSystem } from "./audio.js";
import { currentDifficulty, GAME_CONFIG, setDifficulty } from "./config.js";
import { UI } from "./ui.js";

const canvas = document.querySelector("#game");
const context = canvas.getContext("2d");

if (!context) {
  throw new Error("No se pudo inicializar el contexto 2D del canvas.");
}

const gameMap = new GameMap();
const player = new Player();
const dino = new Dino();
const audio = new AudioSystem();
const ui = new UI();
const grainCanvas = document.createElement("canvas");
grainCanvas.width = 160;
grainCanvas.height = 90;
const grainContext = grainCanvas.getContext("2d");
if (!grainContext) {
  throw new Error("No se pudo inicializar la textura de grano.");
}
const grainImage = grainContext.createImageData(grainCanvas.width, grainCanvas.height);
let lastFrameTime = 0;
let batteryLevel = 100;
let renderPixelRatio = 1;
let mouseX = window.innerWidth;
let mouseY = window.innerHeight / 2;
let flicker = 1;
let flickerCooldown = 0;
let discoveryMessageTime = 0;
let gameState = "title";
let attackElapsed = 0;
let hintMessage = "";
let hintMessageTime = 0;
const inventory = new Set();
let footstepCooldown = 0;
let dinosaurFootstepCooldown = 0;
let objectThrowCooldown = 0;
let scareEventCooldown = 12;
let scareFlickerTime = 0;
let ambientMessage = "";
let ambientMessageTime = 0;
let lightFlickerFactor = 1;
let lightFlickerStepTime = 0;
let grainRefreshCooldown = 0;
const pendingObjectImpacts = [];

function activateAudio() {
  void audio.initialize().catch((error) => {
    console.error("No se pudo inicializar el audio del juego.", error);
  });
}

window.addEventListener("keydown", activateAudio, { once: true });
window.addEventListener("pointerdown", activateAudio, { once: true });

canvas.addEventListener("mousemove", (event) => {
  const bounds = canvas.getBoundingClientRect();
  mouseX = event.clientX - bounds.left;
  mouseY = event.clientY - bounds.top;
});

function startGame() {
  player.keys.clear();
  player.consumeInteractPressed();
  player.consumeThrowPressed();
  gameState = "playing";
  lastFrameTime = 0;
  activateAudio();
}

window.addEventListener("keydown", (event) => {
  if (gameState === "title" && ["1", "2", "3"].includes(event.key)) {
    const difficulty = { 1: "easy", 2: "normal", 3: "hard" }[event.key];
    setDifficulty(difficulty);
  } else if (gameState === "title" && event.key === "Enter") {
    startGame();
  } else if (
    (gameState === "gameover" || gameState === "victory") &&
    event.key.toLowerCase() === "r"
  ) {
    window.location.reload();
  }
});

canvas.addEventListener("click", (event) => {
  if (gameState === "title") {
    const bounds = canvas.getBoundingClientRect();
    const action = ui.getTitleAction(
      event.clientX - bounds.left,
      event.clientY - bounds.top,
      bounds.width,
      bounds.height,
    );
    if (action?.type === "difficulty") {
      setDifficulty(action.difficulty);
    } else {
      startGame();
    }
  } else if (gameState === "gameover" || gameState === "victory") {
    window.location.reload();
  }
});

function resizeCanvas() {
  renderPixelRatio = Math.min(window.devicePixelRatio || 1, 2);
  const width = window.innerWidth;
  const height = window.innerHeight;

  canvas.width = Math.round(width * renderPixelRatio);
  canvas.height = Math.round(height * renderPixelRatio);
  context.setTransform(renderPixelRatio, 0, 0, renderPixelRatio, 0, 0);
}

function showAmbientMessage(message, duration = 3.5) {
  ambientMessage = message;
  ambientMessageTime = duration;
}

function triggerScareEvent() {
  const playerX = player.x + player.size / 2;
  const playerY = player.y + player.size / 2;
  const eventTypes = ["flicker", "fall", "door"];
  const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];

  if (eventType === "flicker") {
    scareFlickerTime = 2.5;
    lightFlickerStepTime = 0;
    lightFlickerFactor = 1;
    showAmbientMessage("La linterna parpadea...", 3);
    return;
  }

  if (eventType === "fall") {
    const maximumHearingDistance =
      (GAME_CONFIG.dino.hearingBase +
        GAME_CONFIG.noise.scare * GAME_CONFIG.dino.hearingPerLoudness) *
      GAME_CONFIG.dino.occludedHearingMultiplier;
    const point = gameMap.getRandomRoomPointAwayFrom(playerX, playerY, 320, {
      x: dino.x,
      y: dino.y,
      maxDistance: maximumHearingDistance - 8,
    });
    if (!point) {
      scareFlickerTime = 2.5;
      showAmbientMessage("Escuchas algo moverse...", 3);
      return;
    }

    gameMap.addThrownObject(point.x, point.y);
    pendingObjectImpacts.push({ x: point.x, y: point.y, remaining: 0.12 });
    showAmbientMessage("Algo cae en otra habitación...", 3.5);
    return;
  }

  const maximumDoorHearingDistance =
    (GAME_CONFIG.dino.hearingBase +
      GAME_CONFIG.noise.scare * GAME_CONFIG.dino.hearingPerLoudness) *
    GAME_CONFIG.dino.occludedHearingMultiplier;
  const availableDoors = gameMap.doors.filter((door) => {
    const farFromPlayer = Math.hypot(door.x - playerX, door.y - playerY) > 250;
    const farFromDino = Math.hypot(door.x - dino.x, door.y - dino.y) > 90;
    const audibleToDino =
      Math.hypot(door.x - dino.x, door.y - dino.y) <=
      maximumDoorHearingDistance - 8;
    return door.open && farFromPlayer && farFromDino && audibleToDino;
  });

  if (availableDoors.length === 0) {
    scareFlickerTime = 2.5;
    showAmbientMessage("Una puerta cruje a lo lejos...", 3);
    return;
  }

  const door =
    availableDoors[Math.floor(Math.random() * availableDoors.length)];
  door.open = false;
  audio.playDoorCreak(getAudioPan(door.x));
  dino.hearNoise(door.x, door.y, GAME_CONFIG.noise.scare, gameMap);
  showAmbientMessage("Oyes una puerta cerrarse sola...", 3.5);
}

function updateScareEvents(deltaTime) {
  scareEventCooldown -= deltaTime;
  scareFlickerTime = Math.max(0, scareFlickerTime - deltaTime);
  ambientMessageTime = Math.max(0, ambientMessageTime - deltaTime);

  if (scareFlickerTime > 0) {
    lightFlickerStepTime -= deltaTime;
    if (lightFlickerStepTime <= 0) {
      lightFlickerStepTime = 0.06 + Math.random() * 0.13;
      lightFlickerFactor = Math.random() < 0.58 ? 0.18 : 0.92 + Math.random() * 0.08;
    }
  } else {
    lightFlickerFactor = 1;
  }

  if (scareEventCooldown > 0) return;

  triggerScareEvent();
  scareEventCooldown = 16 + Math.random() * 16;
}

function drawTerrorEffects(
  width,
  height,
  timestamp,
  deltaTime,
  dinoVisible,
  danger,
) {
  const vignette = context.createRadialGradient(
    width / 2,
    height / 2,
    Math.min(width, height) * 0.22,
    width / 2,
    height / 2,
    Math.hypot(width / 2, height / 2),
  );
  vignette.addColorStop(0, "rgba(0, 0, 0, 0)");
  vignette.addColorStop(0.62, "rgba(0, 0, 0, 0.12)");
  vignette.addColorStop(1, "rgba(0, 0, 0, 0.84)");
  context.fillStyle = vignette;
  context.fillRect(0, 0, width, height);

  grainRefreshCooldown -= deltaTime;
  if (grainRefreshCooldown <= 0) {
    grainRefreshCooldown = 0.1;
    const pixels = grainImage.data;
    for (let index = 0; index < pixels.length; index += 4) {
      const shade = Math.random() < 0.5 ? 0 : 255;
      pixels[index] = shade;
      pixels[index + 1] = shade;
      pixels[index + 2] = shade;
      pixels[index + 3] = 24 + Math.floor(Math.random() * 35);
    }
    grainContext.putImageData(grainImage, 0, 0);
  }
  context.globalAlpha = 0.13;
  context.drawImage(grainCanvas, 0, 0, width, height);
  context.globalAlpha = 1;

  if (dinoVisible) {
    const pulse = 0.5 + Math.sin(timestamp / 1000 * 7) * 0.5;
    const redEdge = context.createRadialGradient(
      width / 2,
      height / 2,
      Math.min(width, height) * 0.22,
      width / 2,
      height / 2,
      Math.hypot(width / 2, height / 2),
    );
    redEdge.addColorStop(0, "rgba(90, 0, 0, 0)");
    redEdge.addColorStop(0.7, `rgba(130, 0, 0, ${0.05 + pulse * 0.07})`);
    redEdge.addColorStop(1, `rgba(180, 8, 0, ${0.22 + pulse * 0.2})`);
    context.fillStyle = redEdge;
    context.fillRect(0, 0, width, height);
  }

  if (ambientMessageTime > 0 && gameState === "playing") {
    context.fillStyle = "rgba(5, 5, 5, 0.72)";
    context.fillRect(width / 2 - 175, 158, 350, 32);
    context.fillStyle = dinoVisible ? "#d18476" : "#c4bda8";
    context.font = "italic 14px sans-serif";
    context.textAlign = "center";
    context.fillText(ambientMessage, width / 2, 179);
    context.textAlign = "start";
  } else if (gameState === "playing" && danger > 0.5) {
    context.fillStyle = "rgba(8, 5, 5, 0.64)";
    context.fillRect(width / 2 - 145, 158, 290, 32);
    context.fillStyle = "#d18476";
    context.font = "italic 14px sans-serif";
    context.textAlign = "center";
    context.fillText(
      dino.state === "OLFATEA"
        ? "Escuchas algo olfatear cerca..."
        : "Algo se acerca en la oscuridad...",
      width / 2,
      179,
    );
    context.textAlign = "start";
  }
}

function frame(timestamp) {
  const deltaTime = lastFrameTime === 0 ? 0 : (timestamp - lastFrameTime) / 1000;
  lastFrameTime = timestamp;

  const frameDelta = Math.min(deltaTime, 0.05);
  if (gameState === "playing") {
    updateScareEvents(frameDelta);

    if (player.consumeInteractPressed()) {
      if (player.isHidden) {
        player.leaveHiding();
      } else {
        const nearbySpot = gameMap.findNearbyHidingSpot(
          player.x + player.size / 2,
          player.y + player.size / 2,
          58,
        );
        if (nearbySpot) {
          player.hideIn(nearbySpot);
        } else if (
          gameMap.findNearbyExit(
            player.x + player.size / 2,
            player.y + player.size / 2,
          )
        ) {
          const missingItems = gameMap.missionItems.filter(
            (item) => !inventory.has(item.id),
          );

          if (missingItems.length === 0) {
            gameMap.openExit(true);
            audio.playDoorCreak(getAudioPan(gameMap.getExitPosition().x));
            gameState = "victory";
          } else {
            hintMessage = `Faltan: ${missingItems.map((item) => item.name).join(", ")}.`;
            hintMessageTime = 4;
            audio.playDoorCreak(getAudioPan(gameMap.getExitPosition().x));
            dino.hearNoise(
              gameMap.getExitPosition().x,
              gameMap.getExitPosition().y,
              GAME_CONFIG.noise.lockedExit,
              gameMap,
            );
          }
        } else {
          const nearbyDoor = gameMap.findNearbyDoor(
            player.x + player.size / 2,
            player.y + player.size / 2,
            96,
          );
          if (nearbyDoor) {
            const doorOpened = gameMap.toggleDoor(nearbyDoor, player);
            if (doorOpened !== null) {
              audio.playDoorCreak(getAudioPan(nearbyDoor.x));
              dino.hearNoise(
                nearbyDoor.x,
                nearbyDoor.y,
                doorOpened
                  ? GAME_CONFIG.noise.doorOpen
                  : GAME_CONFIG.noise.doorClose,
                gameMap,
              );
            }
          }
        }
      }
    }

    player.update(frameDelta, gameMap);
    const missionItem = gameMap.collectMissionItemAt(
      player.x + player.size / 2,
      player.y + player.size / 2,
    );
    if (missionItem) {
      inventory.add(missionItem.id);
      hintMessage = missionItem.hint;
      hintMessageTime = 5;
      audio.playObjectImpact(getAudioPan(missionItem.x));
    }
    objectThrowCooldown = Math.max(0, objectThrowCooldown - frameDelta);
    if (
      player.consumeThrowPressed() &&
      !player.isHidden &&
      objectThrowCooldown === 0
    ) {
      const playerX = player.x + player.size / 2;
      const playerY = player.y + player.size / 2;
      let impactX = playerX;
      let impactY = playerY;

      for (let distance = 20; distance <= 220; distance += 10) {
        const nextX = playerX + player.facingX * distance;
        const nextY = playerY + player.facingY * distance;
        if (gameMap.collidesAt(nextX - 4, nextY - 4, 8, 8)) break;
        impactX = nextX;
        impactY = nextY;
      }

      gameMap.addThrownObject(impactX, impactY);
      pendingObjectImpacts.push({
        x: impactX,
        y: impactY,
        remaining: 0.22,
      });
      audio.playObjectThrow(getAudioPan(impactX));
      objectThrowCooldown = 2.5;
    }

    const previousDinoState = dino.state;
    dino.update(frameDelta, player, gameMap);
    if (
      dino.state === "PERSIGUE" &&
      previousDinoState !== "PERSIGUE"
    ) {
      const distance = Math.hypot(
        dino.x - (player.x + player.size / 2),
        dino.y - (player.y + player.size / 2),
      );
      audio.playDinosaurRoar(distance, getAudioPan(dino.x));
    }
    if (dino.doorCreaked) {
      audio.playDoorCreak(getAudioPan(dino.x));
    }

    gameMap.updateThrownObjects(frameDelta);
    for (let index = pendingObjectImpacts.length - 1; index >= 0; index -= 1) {
      const impact = pendingObjectImpacts[index];
      impact.remaining -= frameDelta;
      if (impact.remaining > 0) continue;

      audio.playObjectImpact(getAudioPan(impact.x));
      dino.hearNoise(
        impact.x,
        impact.y,
        GAME_CONFIG.noise.thrownObject,
        gameMap,
      );
      pendingObjectImpacts.splice(index, 1);
    }

    if (player.isMoving && !player.isHidden && !player.isCrouching) {
      footstepCooldown -= frameDelta;
      if (footstepCooldown <= 0) {
        const playerX = player.x + player.size / 2;
        const playerY = player.y + player.size / 2;
        audio.playPlayerFootstep(player.isRunning, getAudioPan(playerX));
        dino.hearNoise(
          playerX,
          playerY,
          player.isRunning
            ? GAME_CONFIG.noise.running
            : GAME_CONFIG.noise.walking,
          gameMap,
        );
        footstepCooldown = player.isRunning ? 0.38 : 0.68;
      }
    } else {
      footstepCooldown = 0;
    }

    if (
      dino.path.length > 0 &&
      dino.state !== "OLFATEA" &&
      !dino.hasCaughtPlayer
    ) {
      dinosaurFootstepCooldown -= frameDelta;
      if (dinosaurFootstepCooldown <= 0) {
        const distance = Math.hypot(
          dino.x - (player.x + player.size / 2),
          dino.y - (player.y + player.size / 2),
        );
        audio.playDinosaurFootstep(distance, getAudioPan(dino.x));
        dinosaurFootstepCooldown = dino.state === "PERSIGUE" ? 0.46 : 0.78;
      }
    } else {
      dinosaurFootstepCooldown = 0;
    }

    const dinoDistance = Math.hypot(
      dino.x - (player.x + player.size / 2),
      dino.y - (player.y + player.size / 2),
    );
    const danger = Math.max(
      dino.state === "PERSIGUE" ? 0.4 : 0,
      Math.max(0, 1 - dinoDistance / 520),
    );
    audio.updateHeartbeat(frameDelta, danger);
    audio.updateAmbientSpatial(getAudioPan(dino.x), 0.85 + danger * 0.3);
    dino.isVisibleToPlayer =
      !player.isHidden && dino.canSeePlayer(player, gameMap);

    if (player.wasDiscovered) {
      discoveryMessageTime = 2.2;
      player.wasDiscovered = false;
    }
    discoveryMessageTime = Math.max(0, discoveryMessageTime - frameDelta);
    hintMessageTime = Math.max(0, hintMessageTime - frameDelta);

    if (!player.isHidden) {
      batteryLevel = Math.max(
        0,
        batteryLevel -
          (100 / GAME_CONFIG.battery.durationSeconds) * frameDelta,
      );
    }

    if (
      !player.isHidden &&
      batteryLevel < 100 &&
      gameMap.collectBatteryAt(
        player.x + player.size / 2,
        player.y + player.size / 2,
        28,
      )
    ) {
      batteryLevel = Math.min(
        100,
        batteryLevel + GAME_CONFIG.battery.pickupAmount,
      );
    }

    if (gameState === "playing" && dino.hasCaughtPlayer) {
      gameState = "attack";
      attackElapsed = 0;
    }
  }

  if (gameState === "attack") {
    attackElapsed += frameDelta;
    if (attackElapsed >= 1.35) gameState = "gameover";
  }

  flickerCooldown -= frameDelta;
  if (flickerCooldown <= 0) {
    flickerCooldown = 0.06 + Math.random() * 0.16;
    flicker = Math.random() < 0.08 ? 0.84 : 0.96 + Math.random() * 0.04;
  }

  const width = window.innerWidth;
  const height = window.innerHeight;
  const dinoDistance = Math.hypot(
    dino.x - (player.x + player.size / 2),
    dino.y - (player.y + player.size / 2),
  );
  const danger = Math.max(
    dino.state === "PERSIGUE" ? 0.4 : 0,
    Math.max(0, 1 - dinoDistance / 520),
  );
  const shakeStrength =
    gameState === "playing"
      ? Math.max(
          dino.state === "PERSIGUE" ? 2.5 : 0,
          Math.max(0, 1 - dinoDistance / 260) * 5,
        )
      : gameState === "attack"
        ? 8 + Math.min(10, attackElapsed * 5)
        : 0;
  const shakeX = (Math.random() * 2 - 1) * shakeStrength;
  const shakeY = (Math.random() * 2 - 1) * shakeStrength;
  const camera = gameMap.getCameraPosition(
    player.x + player.size / 2,
    player.y + player.size / 2,
    width,
    height,
  );

  context.save();
  if (gameState === "playing") {
    context.translate(shakeX, shakeY);
    context.save();
    context.translate(-camera.x, -camera.y);
    gameMap.draw(context, width, height, camera.x, camera.y);
    dino.draw(context);
    player.draw(context);
    context.restore();

    gameMap.drawDarkness(
      context,
      width,
      height,
      renderPixelRatio,
      player.x + player.size / 2,
      player.y + player.size / 2,
      camera.x,
      camera.y,
      mouseX,
      mouseY,
      player.isHidden ? 0 : batteryLevel,
      flicker * lightFlickerFactor,
    );
  }

  if (gameState === "playing" && player.isHidden) {
    const slitX = width * 0.24;
    const slitY = height / 2 - 9;
    const slitWidth = width * 0.52;

    context.save();
    context.beginPath();
    context.rect(0, 0, width, height);
    context.rect(slitX, slitY, slitWidth, 18);
    context.clip("evenodd");
    context.fillStyle = "rgba(0, 0, 0, 0.96)";
    context.fillRect(0, 0, width, height);
    context.restore();

    context.fillStyle = "rgba(20, 16, 15, 0.88)";
    context.fillRect(slitX, slitY - 4, slitWidth, 4);
    context.fillRect(slitX, slitY + 18, slitWidth, 4);
  }

  context.fillStyle = "rgba(8, 9, 9, 0.82)";
  context.fillRect(16, 16, 184, 72);
  context.fillStyle = "#c5c0a9";
  context.font = "12px sans-serif";
  context.fillText("BATERÍA", 28, 36);
  context.fillStyle = "#292929";
  context.fillRect(28, 44, 156, 10);
  context.fillStyle =
    batteryLevel > 25 ? "#b9a65e" : batteryLevel > 0 ? "#b46b45" : "#4c3935";
  context.fillRect(28, 44, 156 * (batteryLevel / 100), 10);
  context.fillStyle = "#c5c0a9";
  context.fillText("RESISTENCIA", 28, 70);
  context.fillStyle = "#292929";
  context.fillRect(105, 62, 79, 10);
  context.fillStyle = player.stamina > 25 ? "#75845a" : "#b46b45";
  context.fillRect(105, 62, 79 * (player.stamina / 100), 10);

  context.fillStyle =
    dino.state === "PERSIGUE"
      ? "#b94a40"
      : dino.state === "OLFATEA"
        ? "#c5a65e"
        : "#c5c0a9";
  context.textAlign = "right";
  context.font = "12px sans-serif";
  context.fillText(`DINO: ${dino.state}`, width - 18, 30);
  context.textAlign = "start";

  context.fillStyle = "rgba(8, 9, 9, 0.88)";
  context.fillRect(width - 220, 42, 204, 108);
  context.fillStyle = "#c5c0a9";
  context.textAlign = "left";
  context.font = "12px sans-serif";
  context.fillText("OBJETOS", width - 206, 61);
  for (let index = 0; index < gameMap.missionItems.length; index += 1) {
    const item = gameMap.missionItems[index];
    const collected = inventory.has(item.id);
    context.fillStyle = collected ? "#a9b47c" : "#756e60";
    context.fillRect(width - 204, 72 + index * 22, 10, 10);
    context.fillStyle = collected ? "#d7d2be" : "#777366";
    context.fillText(
      `${collected ? "✓" : "·"} ${item.name}`,
      width - 188,
      81 + index * 22,
    );
  }
  context.textAlign = "start";

  if (player.isHidden) {
    const pulseSpeed = dino.isSniffing ? 12 : 4;
    const pulse = 0.5 + Math.sin(timestamp / 1000 * pulseSpeed) * 0.5;
    const breathX = width / 2;
    const breathY = height / 2 + 52;

    context.fillStyle = "rgba(8, 9, 9, 0.9)";
    context.fillRect(breathX - 91, breathY - 26, 182, 50);
    context.fillStyle = dino.isSniffing ? "#bd5548" : "#b9b39b";
    context.font = "12px sans-serif";
    context.textAlign = "center";
    context.fillText(
      dino.isSniffing ? "RESPIRACIÓN AGITADA" : "RESPIRACIÓN",
      breathX,
      breathY - 5,
    );
    context.beginPath();
    context.arc(
      breathX,
      breathY + 9,
      5 + pulse * (dino.isSniffing ? 9 : 4),
      0,
      Math.PI * 2,
    );
    context.fillStyle = dino.isSniffing
      ? `rgba(189, 85, 72, ${0.25 + pulse * 0.5})`
      : `rgba(185, 179, 155, ${0.25 + pulse * 0.4})`;
    context.fill();
    context.textAlign = "start";
    context.fillStyle = "#c5c0a9";
    context.font = "12px sans-serif";
    context.fillText("E · Salir del escondite", 16, height - 20);
  } else if (gameState === "playing") {
    const controlPanelWidth = Math.min(520, width - 32);
    context.fillStyle = "rgba(8, 9, 9, 0.72)";
    context.fillRect(16, height - 38, controlPanelWidth, 24);
    context.fillStyle = "#c5c0a9";
    context.font = `${width < 560 ? 10 : 12}px sans-serif`;
    context.fillText(
      "WASD mover · SHIFT agacharse · CTRL correr · F lanzar",
      26,
      height - 22,
    );

    const nearbySpot = gameMap.findNearbyHidingSpot(
      player.x + player.size / 2,
      player.y + player.size / 2,
      58,
    );
    if (nearbySpot) {
      context.fillStyle = "rgba(8, 9, 9, 0.86)";
      context.fillRect(width / 2 - 112, height - 46, 224, 30);
      context.fillStyle = "#c5c0a9";
      context.textAlign = "center";
      context.font = "14px sans-serif";
      context.fillText(
        `E · Esconderse (${nearbySpot.type})`,
        width / 2,
        height - 26,
      );
      context.textAlign = "start";
    } else if (
      gameMap.findNearbyExit(
        player.x + player.size / 2,
        player.y + player.size / 2,
      )
    ) {
      context.fillStyle = "rgba(8, 9, 9, 0.86)";
      context.fillRect(width / 2 - 150, height - 46, 300, 30);
      context.fillStyle = "#c5c0a9";
      context.textAlign = "center";
      context.font = "14px sans-serif";
      context.fillText("E · Abrir puerta principal", width / 2, height - 26);
      context.textAlign = "start";
    } else {
      const nearbyDoor = gameMap.findNearbyDoor(
        player.x + player.size / 2,
        player.y + player.size / 2,
        96,
      );
      if (nearbyDoor) {
        context.fillStyle = "rgba(8, 9, 9, 0.86)";
        context.fillRect(width / 2 - 120, height - 46, 240, 30);
        context.fillStyle = "#c5c0a9";
        context.textAlign = "center";
        context.font = "14px sans-serif";
        context.fillText(
          `E · ${nearbyDoor.open ? "Cerrar" : "Abrir"} puerta`,
          width / 2,
          height - 26,
        );
        context.textAlign = "start";
      }
    }
  }

  if (hintMessageTime > 0 && gameState === "playing") {
    const messageWidth = Math.min(width - 40, Math.max(280, hintMessage.length * 7));
    context.fillStyle = "rgba(10, 10, 9, 0.92)";
    context.fillRect(
      (width - messageWidth) / 2,
      98,
      messageWidth,
      34,
    );
    context.fillStyle = "#e0d5ae";
    context.textAlign = "center";
    context.font = "13px sans-serif";
    context.fillText(hintMessage, width / 2, 120, messageWidth - 20);
    context.textAlign = "start";
  }

  if (discoveryMessageTime > 0) {
    context.fillStyle = "rgba(65, 16, 14, 0.88)";
    context.fillRect(width / 2 - 150, 80, 300, 34);
    context.fillStyle = "#f0c6b8";
    context.textAlign = "center";
    context.font = "14px sans-serif";
    context.fillText("¡Te ha descubierto! Sal del escondite.", width / 2, 102);
    context.textAlign = "start";
  }

  if (gameState === "title") {
    ui.drawTitle(context, width, height, currentDifficulty);
  }

  if (gameState === "attack" || gameState === "gameover") {
    const progress = Math.min(1, attackElapsed / 1.35);
    context.fillStyle = `rgba(0, 0, 0, ${0.68 + progress * 0.2})`;
    context.fillRect(0, 0, width, height);
    if (gameState === "attack") {
      const scale = 1.4 + progress * 2.2;
      context.save();
      context.translate(width / 2, height / 2);
      context.scale(scale, scale);
      context.translate(-dino.x, -dino.y);
      dino.draw(context);
      context.restore();
      context.fillStyle = "#d7c5ad";
      context.textAlign = "center";
      context.font = "bold 26px sans-serif";
      context.fillText("¡TE HA ALCANZADO!", width / 2, height * 0.78);
      context.textAlign = "start";
    } else {
      context.textAlign = "center";
      context.fillStyle = "#a94c42";
      context.font = "bold 42px sans-serif";
      context.fillText("GAME OVER", width / 2, height / 2 - 24);
      context.fillStyle = "#d0cbb8";
      context.font = "17px sans-serif";
      context.fillText("Pulsa R o haz clic para reintentar", width / 2, height / 2 + 22);
      context.textAlign = "start";
    }
  }

  if (gameState === "victory") {
    context.fillStyle = "rgba(0, 0, 0, 0.86)";
    context.fillRect(0, 0, width, height);
    context.textAlign = "center";
    context.fillStyle = "#d5c581";
    context.font = "bold 42px sans-serif";
    context.fillText("HAS ESCAPADO", width / 2, height / 2 - 24);
    context.fillStyle = "#d0cbb8";
    context.font = "17px sans-serif";
    context.fillText("Pulsa R o haz clic para volver a jugar", width / 2, height / 2 + 22);
    context.textAlign = "start";
  }

  if (gameState !== "title") {
    drawTerrorEffects(
      width,
      height,
      timestamp,
      frameDelta,
      gameState === "playing" && dino.isVisibleToPlayer,
      danger,
    );
  }

  context.restore();
  window.requestAnimationFrame(frame);
}

window.addEventListener("resize", resizeCanvas);
resizeCanvas();
window.requestAnimationFrame(frame);

function getAudioPan(worldX) {
  const playerX = player.x + player.size / 2;
  return Math.max(-1, Math.min(1, (worldX - playerX) / 360));
}
