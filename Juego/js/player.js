import { GAME_CONFIG } from "./config.js";

// Velocidad, sigilo y resistencia se ajustan desde la configuración global.
const PLAYER_SIZE = 24;
const MAX_STAMINA = 100;

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

      if (["w", "a", "s", "d", "shift", "control"].includes(key)) {
        event.preventDefault();
        this.keys.add(key);
      }
    });

    window.addEventListener("keyup", (event) => {
      this.keys.delete(event.key.toLowerCase());
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
    }

    if (!gameMap.collidesAt(this.x, this.y + movementY, this.size, this.size)) {
      this.y += movementY;
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

    context.fillStyle = "#fff";
    context.fillRect(this.x, this.y, PLAYER_SIZE, PLAYER_SIZE);
  }
}
