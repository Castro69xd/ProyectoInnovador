import { GAME_CONFIG } from "./config.js";

// Velocidad, sigilo y resistencia se ajustan desde la configuración global.
const PLAYER_SIZE = 24;
const MAX_STAMINA = 100;
const MOVEMENT_KEY_ALIASES = {
  arrowup: "w",
  arrowleft: "a",
  arrowdown: "s",
  arrowright: "d",
};

export class Player {
  constructor() {
    this.size = PLAYER_SIZE;
    this.x = 15 * 40 + 8;
    this.y = 10 * 40 + 8;
    this.keys = new Set();
    this.hidingSpot = null;
    this.interactPressed = false;
    this.wasDiscovered = false;
    this.stamina = MAX_STAMINA;
    this.isMoving = false;
    this.isRunning = false;
    this.isCrouching = false;
    this.facingX = 1;
    this.facingY = 0;
    this.walkTime = 0;
    this.throwPressed = false;

    window.addEventListener("keydown", (event) => {
      const key = event.key.toLowerCase();
      if (key === "e" && !event.repeat) {
        event.preventDefault();
        this.interactPressed = true;
        return;
      }

      if (key === "f" && !event.repeat) {
        event.preventDefault();
        this.throwPressed = true;
        return;
      }

      const movementKey = MOVEMENT_KEY_ALIASES[key] ?? key;
      if (["w", "a", "s", "d", "shift", "control"].includes(movementKey)) {
        event.preventDefault();
        this.keys.add(movementKey);
      }
    });

    window.addEventListener("keyup", (event) => {
      const key = event.key.toLowerCase();
      this.keys.delete(MOVEMENT_KEY_ALIASES[key] ?? key);
    });

    window.addEventListener("blur", () => {
      this.keys.clear();
    });
  }

  update(deltaTime, gameMap) {
    if (this.isHidden) {
      this.isMoving = false;
      this.isRunning = false;
      this.isCrouching = false;
      this.stamina = Math.min(
        MAX_STAMINA,
        this.stamina + GAME_CONFIG.player.staminaRecovery * deltaTime,
      );
      return;
    }

    let directionX = 0;
    let directionY = 0;

    if (this.keys.has("a")) directionX -= 1;
    if (this.keys.has("d")) directionX += 1;
    if (this.keys.has("w")) directionY -= 1;
    if (this.keys.has("s")) directionY += 1;

    if (directionX !== 0 && directionY !== 0) {
      const diagonalScale = Math.SQRT1_2;
      directionX *= diagonalScale;
      directionY *= diagonalScale;
    }

    this.isMoving = directionX !== 0 || directionY !== 0;
    this.isCrouching = this.keys.has("shift") && this.isMoving;
    this.isRunning =
      this.keys.has("control") &&
      !this.isCrouching &&
      this.isMoving &&
      this.stamina > 0;
    if (this.isMoving) {
      const gaitSpeed = this.isRunning ? 15 : this.isCrouching ? 5 : 10;
      this.walkTime += deltaTime * gaitSpeed;
    }
    if (this.isRunning) {
      this.stamina = Math.max(
        0,
        this.stamina - GAME_CONFIG.player.staminaDrain * deltaTime,
      );
    } else {
      this.stamina = Math.min(
        MAX_STAMINA,
        this.stamina + GAME_CONFIG.player.staminaRecovery * deltaTime,
      );
    }

    if (this.isMoving) {
      this.facingX = directionX;
      this.facingY = directionY;
    }

    const speed = this.isCrouching
      ? GAME_CONFIG.player.crouchSpeed
      : this.isRunning
        ? GAME_CONFIG.player.sprintSpeed
        : GAME_CONFIG.player.walkSpeed;
    const movementX = directionX * speed * deltaTime;
    const movementY = directionY * speed * deltaTime;

    if (!gameMap.collidesAt(this.x + movementX, this.y, this.size, this.size)) {
      this.x += movementX;
    } else {
      const alignment = gameMap.alignActorWithOpenDoor(
        this.x,
        this.y,
        this.size,
        this.size,
        "horizontal",
        movementX,
      );
      if (alignment) this.y = alignment.y;
    }

    if (!gameMap.collidesAt(this.x, this.y + movementY, this.size, this.size)) {
      this.y += movementY;
    } else {
      const alignment = gameMap.alignActorWithOpenDoor(
        this.x,
        this.y,
        this.size,
        this.size,
        "vertical",
        movementY,
      );
      if (alignment) this.x = alignment.x;
    }
  }

  get isHidden() {
    return this.hidingSpot !== null;
  }

  consumeInteractPressed() {
    const wasPressed = this.interactPressed;
    this.interactPressed = false;
    return wasPressed;
  }

  consumeThrowPressed() {
    const wasPressed = this.throwPressed;
    this.throwPressed = false;
    return wasPressed;
  }

  hideIn(spot) {
    this.hidingSpot = spot;
    this.wasDiscovered = false;
    this.keys.clear();
  }

  leaveHiding(discovered = false) {
    if (!this.isHidden) return;

    this.hidingSpot = null;
    this.wasDiscovered = discovered;
  }

  draw(context) {
    if (this.isHidden) return;

    context.save();
    const centerX = this.x + PLAYER_SIZE / 2;
    const centerY = this.y + PLAYER_SIZE / 2;
    const sideX = -this.facingY;
    const sideY = this.facingX;
    const step = this.isMoving ? Math.sin(this.walkTime) * 1.5 : 0;
    const stride = this.isMoving
      ? Math.cos(this.walkTime) * (this.isRunning ? 4.5 : 3)
      : 0;
    const crouchOffset = this.isCrouching ? 2 : 0;

    const point = (side, forward) => ({
      x: centerX + sideX * side + this.facingX * forward,
      y: centerY + sideY * side + this.facingY * forward,
    });
    const drawLimb = (start, end, color, width) => {
      context.strokeStyle = color;
      context.lineWidth = width;
      context.lineCap = "round";
      context.beginPath();
      context.moveTo(start.x, start.y);
      context.lineTo(end.x, end.y);
      context.stroke();
    };

    context.fillStyle = "rgba(0, 0, 0, 0.55)";
    context.beginPath();
    context.ellipse(centerX + 2, centerY + 5, 9, 12, 0, 0, Math.PI * 2);
    context.fill();

    // Las piernas alternan el paso según la velocidad y la dirección del jugador.
    for (const side of [-1, 1]) {
      const hip = point(side * 3, -1 + crouchOffset);
      const foot = point(side * 4 + step, -4 + side * stride + crouchOffset);
      drawLimb(hip, foot, "#201a19", 4.5);
      drawLimb(
        foot,
        point(side * 4 + step, -5 + side * stride + crouchOffset),
        "#76604b",
        2.5,
      );
    }

    // Brazos y torso forman una silueta humana visible también con poca luz.
    for (const side of [-1, 1]) {
      drawLimb(
        point(side * 4, 4 + crouchOffset),
        point(side * 7 + step, -1 - side * stride * 0.45 + crouchOffset),
        "#9a795d",
        3.5,
      );
    }

    const torso = point(0, 1 + crouchOffset);
    context.fillStyle = "#5b4033";
    context.beginPath();
    context.ellipse(
      torso.x,
      torso.y,
      5.5,
      8,
      Math.atan2(this.facingY, this.facingX) + Math.PI / 2,
      0,
      Math.PI * 2,
    );
    context.fill();
    context.fillStyle = "#87694e";
    context.beginPath();
    context.ellipse(
      torso.x - sideX,
      torso.y - sideY,
      2,
      5,
      Math.atan2(this.facingY, this.facingX) + Math.PI / 2,
      0,
      Math.PI * 2,
    );
    context.fill();

    const head = point(0, 8 + crouchOffset);
    context.fillStyle = "#c49a73";
    context.beginPath();
    context.arc(head.x, head.y, 3.5, 0, Math.PI * 2);
    context.fill();

    const hair = point(0, 9.2 + crouchOffset);
    context.fillStyle = "#30251f";
    context.beginPath();
    context.arc(hair.x, hair.y, 3.1, Math.PI, Math.PI * 2);
    context.fill();
    context.restore();
  }
}
