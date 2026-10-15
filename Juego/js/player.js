const PLAYER_SIZE = 24;
const PLAYER_SPEED = 220;

export class Player {
  constructor() {
    this.size = PLAYER_SIZE;
    this.x = 15 * 40 + 8;
    this.y = 10 * 40 + 8;
    this.keys = new Set();

    window.addEventListener("keydown", (event) => {
      const key = event.key.toLowerCase();
      if (["w", "a", "s", "d"].includes(key)) {
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

    const movementX = directionX * PLAYER_SPEED * deltaTime;
    const movementY = directionY * PLAYER_SPEED * deltaTime;

    if (!gameMap.collidesAt(this.x + movementX, this.y, this.size, this.size)) {
      this.x += movementX;
    }

    if (!gameMap.collidesAt(this.x, this.y + movementY, this.size, this.size)) {
      this.y += movementY;
    }
  }

  draw(context) {
    context.fillStyle = "#fff";
    context.fillRect(this.x, this.y, PLAYER_SIZE, PLAYER_SIZE);
  }
}
