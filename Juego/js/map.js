const TILE_SIZE = 40;
const MAP_COLUMNS = 31;
const MAP_ROWS = 33;

const FLOOR_COLORS = {
  R: "#292321",
  K: "#292821",
  B: "#222629",
  "1": "#292326",
  "2": "#25242a",
  S: "#29251f",
  T: "#23262a",
  H: "#272626",
};

const WALL_COLOR = "#111313";
const DOOR_COLOR = "#493a2c";

// Each room is a rectangle of walkable floor, in tile coordinates.
const ROOMS = [
  { tile: "1", x: 1, y: 1, width: 9, height: 7 },
  { tile: "T", x: 11, y: 1, width: 9, height: 7 },
  { tile: "K", x: 21, y: 1, width: 9, height: 3 },
  { tile: "B", x: 21, y: 5, width: 9, height: 3 },
  { tile: "R", x: 1, y: 13, width: 12, height: 9 },
  { tile: "2", x: 18, y: 13, width: 12, height: 9 },
  { tile: "S", x: 1, y: 24, width: 29, height: 8 },
];

// Corridors join all rooms; doors replace wall tiles at their entrances.
const CORRIDORS = [
  { x: 1, y: 9, width: 29, height: 3 },
  { x: 14, y: 12, width: 3, height: 11 },
];

const DOORS = [
  { x: 5, y: 8 },
  { x: 15, y: 8 },
  { x: 25, y: 8 },
  { x: 25, y: 4 },
  { x: 6, y: 12 },
  { x: 15, y: 12 },
  { x: 24, y: 12 },
  { x: 15, y: 23 },
];

// Furniture coordinates and sizes are also expressed in tiles.
const FURNITURE = [
  { x: 2, y: 2, width: 3, height: 2, color: "#493a38", detail: "#67504a" },
  { x: 6, y: 2, width: 2, height: 2, color: "#403634" },
  { x: 12, y: 2, width: 4, height: 1, color: "#403a32" },
  { x: 17, y: 2, width: 2, height: 4, color: "#38332d" },
  { x: 22, y: 2, width: 3, height: 1, color: "#433b30" },
  { x: 27, y: 2, width: 2, height: 1, color: "#423a30" },
  { x: 22, y: 6, width: 2, height: 1, color: "#373c3c" },
  { x: 27, y: 6, width: 2, height: 1, color: "#363a3c" },
  { x: 2, y: 15, width: 4, height: 2, color: "#3b3030", detail: "#554141" },
  { x: 7, y: 14, width: 3, height: 2, color: "#403a32" },
  { x: 2, y: 19, width: 2, height: 1, color: "#3b3030" },
  { x: 20, y: 14, width: 4, height: 2, color: "#3b3030", detail: "#554141" },
  { x: 25, y: 14, width: 3, height: 1, color: "#443a34" },
  { x: 20, y: 19, width: 2, height: 1, color: "#393337" },
  { x: 4, y: 26, width: 4, height: 2, color: "#3e372e" },
  { x: 23, y: 27, width: 4, height: 1, color: "#3b3630" },
];

const BATTERY_TILES = [
  { x: 9, y: 5 },
  { x: 13, y: 6 },
  { x: 28, y: 5 },
  { x: 11, y: 19 },
  { x: 28, y: 20 },
  { x: 12, y: 29 },
  { x: 20, y: 30 },
];

function createHouseMatrix() {
  const matrix = Array.from({ length: MAP_ROWS }, () =>
    Array(MAP_COLUMNS).fill("#"),
  );

  function fillTiles(rectangle, tile) {
    for (let y = rectangle.y; y < rectangle.y + rectangle.height; y += 1) {
      for (let x = rectangle.x; x < rectangle.x + rectangle.width; x += 1) {
        matrix[y][x] = tile;
      }
    }
  }

  for (const room of ROOMS) fillTiles(room, room.tile);
  for (const corridor of CORRIDORS) fillTiles(corridor, "H");
  for (const door of DOORS) matrix[door.y][door.x] = "D";

  return matrix;
}

const HOUSE_MATRIX = createHouseMatrix();

export class GameMap {
  constructor() {
    this.batteries = BATTERY_TILES.map(({ x, y }) => ({
      x: (x + 0.5) * TILE_SIZE,
      y: (y + 0.5) * TILE_SIZE,
      collected: false,
    }));
    this.darknessCanvas = document.createElement("canvas");
  }

  get width() {
    return MAP_COLUMNS * TILE_SIZE;
  }

  get height() {
    return MAP_ROWS * TILE_SIZE;
  }

  draw(context, width, height, cameraX = 0, cameraY = 0) {
    context.fillStyle = "#000";
    context.fillRect(cameraX, cameraY, width, height);

    const firstColumn = Math.max(0, Math.floor(cameraX / TILE_SIZE));
    const lastColumn = Math.min(
      MAP_COLUMNS - 1,
      Math.ceil((cameraX + width) / TILE_SIZE),
    );
    const firstRow = Math.max(0, Math.floor(cameraY / TILE_SIZE));
    const lastRow = Math.min(
      MAP_ROWS - 1,
      Math.ceil((cameraY + height) / TILE_SIZE),
    );

    for (let y = firstRow; y <= lastRow; y += 1) {
      for (let x = firstColumn; x <= lastColumn; x += 1) {
        const tile = HOUSE_MATRIX[y][x];
        const worldX = x * TILE_SIZE;
        const worldY = y * TILE_SIZE;

        if (tile === "#") {
          context.fillStyle = WALL_COLOR;
          context.fillRect(worldX, worldY, TILE_SIZE, TILE_SIZE);
          context.fillStyle = "#1b1d1c";
          context.fillRect(
            worldX + 2,
            worldY + 2,
            TILE_SIZE - 4,
            TILE_SIZE - 4,
          );
          continue;
        }

        context.fillStyle = tile === "D" ? DOOR_COLOR : FLOOR_COLORS[tile];
        context.fillRect(worldX, worldY, TILE_SIZE, TILE_SIZE);
        context.fillStyle = "rgba(0, 0, 0, 0.12)";
        context.fillRect(worldX, worldY, TILE_SIZE, 1);
        context.fillRect(worldX, worldY, 1, TILE_SIZE);
      }
    }

    for (const furniture of FURNITURE) {
      const x = furniture.x * TILE_SIZE;
      const y = furniture.y * TILE_SIZE;
      const furnitureWidth = furniture.width * TILE_SIZE;
      const furnitureHeight = furniture.height * TILE_SIZE;

      if (
        x + furnitureWidth < cameraX ||
        x > cameraX + width ||
        y + furnitureHeight < cameraY ||
        y > cameraY + height
      ) {
        continue;
      }

      context.fillStyle = "#090a0a";
      context.fillRect(x + 4, y + 5, furnitureWidth, furnitureHeight);
      context.fillStyle = furniture.color;
      context.fillRect(x, y, furnitureWidth, furnitureHeight);

      if (furniture.detail) {
        context.fillStyle = furniture.detail;
        context.fillRect(
          x + 5,
          y + 5,
          furnitureWidth - 10,
          furnitureHeight - 10,
        );
      }

      context.strokeStyle = "#171615";
      context.lineWidth = 2;
      context.strokeRect(x + 1, y + 1, furnitureWidth - 2, furnitureHeight - 2);
    }

    for (const battery of this.batteries) {
      if (
        battery.collected ||
        battery.x < cameraX ||
        battery.x > cameraX + width ||
        battery.y < cameraY ||
        battery.y > cameraY + height
      ) {
        continue;
      }

      context.fillStyle = "#16140e";
      context.fillRect(battery.x - 9, battery.y - 7, 18, 16);
      context.fillStyle = "#a58b42";
      context.fillRect(battery.x - 7, battery.y - 6, 14, 13);
      context.fillStyle = "#e0c66c";
      context.fillRect(battery.x - 3, battery.y - 10, 6, 4);
      context.fillStyle = "#554725";
      context.fillRect(battery.x - 2, battery.y - 3, 4, 7);
    }
  }

  castRay(originX, originY, directionX, directionY, maxDistance) {
    let column = Math.floor(originX / TILE_SIZE);
    let row = Math.floor(originY / TILE_SIZE);
    const stepX = Math.sign(directionX);
    const stepY = Math.sign(directionY);
    const deltaX = directionX === 0 ? Infinity : Math.abs(TILE_SIZE / directionX);
    const deltaY = directionY === 0 ? Infinity : Math.abs(TILE_SIZE / directionY);
    let distanceX =
      directionX < 0
        ? ((originX - column * TILE_SIZE) / -directionX)
        : directionX > 0
          ? ((column + 1) * TILE_SIZE - originX) / directionX
          : Infinity;
    let distanceY =
      directionY < 0
        ? ((originY - row * TILE_SIZE) / -directionY)
        : directionY > 0
          ? ((row + 1) * TILE_SIZE - originY) / directionY
          : Infinity;

    while (true) {
      let distance;

      if (distanceX < distanceY) {
        distance = distanceX;
        distanceX += deltaX;
        column += stepX;
      } else {
        distance = distanceY;
        distanceY += deltaY;
        row += stepY;
      }

      if (distance >= maxDistance) return maxDistance;

      if (
        row < 0 ||
        row >= MAP_ROWS ||
        column < 0 ||
        column >= MAP_COLUMNS ||
        HOUSE_MATRIX[row][column] === "#"
      ) {
        return distance;
      }
    }
  }

  drawDarkness(
    context,
    width,
    height,
    pixelRatio,
    playerX,
    playerY,
    cameraX,
    cameraY,
    aimX,
    aimY,
    batteryLevel,
    flicker,
  ) {
    const overlay = this.darknessCanvas;
    const overlayWidth = Math.ceil(width * pixelRatio);
    const overlayHeight = Math.ceil(height * pixelRatio);

    if (overlay.width !== overlayWidth || overlay.height !== overlayHeight) {
      overlay.width = overlayWidth;
      overlay.height = overlayHeight;
    }

    const lightContext = overlay.getContext("2d");
    if (!lightContext) {
      throw new Error("No se pudo inicializar el canvas de iluminación.");
    }

    lightContext.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    lightContext.globalCompositeOperation = "source-over";
    lightContext.fillStyle = "#000";
    lightContext.fillRect(0, 0, width, height);
    lightContext.globalCompositeOperation = "destination-out";

    const screenX = playerX - cameraX;
    const screenY = playerY - cameraY;
    const hasBattery = batteryLevel > 0;
    const range = (hasBattery ? 390 : 0) * flicker;
    const coneWidth = Math.PI / 3;
    const angle = Math.atan2(aimY - screenY, aimX - screenX);
    const rayCount = 100;

    if (range > 0) {
      const gradient = lightContext.createRadialGradient(
        screenX,
        screenY,
        0,
        screenX,
        screenY,
        range,
      );
      gradient.addColorStop(0, "rgba(0, 0, 0, 0.98)");
      gradient.addColorStop(0.78, "rgba(0, 0, 0, 0.92)");
      gradient.addColorStop(1, "rgba(0, 0, 0, 0)");

      lightContext.beginPath();
      lightContext.moveTo(screenX, screenY);

      for (let index = 0; index <= rayCount; index += 1) {
        const rayAngle = angle - coneWidth / 2 + (coneWidth * index) / rayCount;
        const directionX = Math.cos(rayAngle);
        const directionY = Math.sin(rayAngle);
        const distance = this.castRay(
          playerX,
          playerY,
          directionX,
          directionY,
          range,
        );
        lightContext.lineTo(
          screenX + directionX * distance,
          screenY + directionY * distance,
        );
      }

      lightContext.closePath();
      lightContext.fillStyle = gradient;
      lightContext.fill();
    }

    const ambientRadius = hasBattery ? 78 : 38;
    const ambientGradient = lightContext.createRadialGradient(
      screenX,
      screenY,
      0,
      screenX,
      screenY,
      ambientRadius,
    );
    ambientGradient.addColorStop(0, "rgba(0, 0, 0, 0.94)");
    ambientGradient.addColorStop(0.65, "rgba(0, 0, 0, 0.72)");
    ambientGradient.addColorStop(1, "rgba(0, 0, 0, 0)");
    lightContext.fillStyle = ambientGradient;
    lightContext.beginPath();
    lightContext.arc(screenX, screenY, ambientRadius, 0, Math.PI * 2);
    lightContext.fill();

    lightContext.globalCompositeOperation = "source-over";
    context.drawImage(overlay, 0, 0, width, height);
  }

  collectBatteryAt(x, y, radius) {
    const battery = this.batteries.find(
      (item) =>
        !item.collected && Math.hypot(item.x - x, item.y - y) <= radius,
    );

    if (!battery) return false;

    battery.collected = true;
    return true;
  }

  collidesAt(x, y, width, height) {
    const firstColumn = Math.floor(x / TILE_SIZE);
    const lastColumn = Math.floor((x + width - 1) / TILE_SIZE);
    const firstRow = Math.floor(y / TILE_SIZE);
    const lastRow = Math.floor((y + height - 1) / TILE_SIZE);

    for (let row = firstRow; row <= lastRow; row += 1) {
      for (let column = firstColumn; column <= lastColumn; column += 1) {
        if (
          row < 0 ||
          row >= MAP_ROWS ||
          column < 0 ||
          column >= MAP_COLUMNS ||
          HOUSE_MATRIX[row][column] === "#"
        ) {
          return true;
        }
      }
    }

    return FURNITURE.some((item) => {
      const furnitureX = item.x * TILE_SIZE;
      const furnitureY = item.y * TILE_SIZE;
      const furnitureWidth = item.width * TILE_SIZE;
      const furnitureHeight = item.height * TILE_SIZE;

      return (
        x < furnitureX + furnitureWidth &&
        x + width > furnitureX &&
        y < furnitureY + furnitureHeight &&
        y + height > furnitureY
      );
    });
  }

  getCameraPosition(targetX, targetY, viewportWidth, viewportHeight) {
    return {
      x: Math.max(
        0,
        Math.min(targetX - viewportWidth / 2, this.width - viewportWidth),
      ),
      y: Math.max(
        0,
        Math.min(targetY - viewportHeight / 2, this.height - viewportHeight),
      ),
    };
  }
}
