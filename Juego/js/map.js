import { GAME_CONFIG } from "./config.js";

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

// Cada habitación ocupa un rectángulo de casillas de suelo.
const ROOMS = [
  { tile: "1", x: 1, y: 1, width: 9, height: 7 },
  { tile: "T", x: 11, y: 1, width: 9, height: 7 },
  { tile: "K", x: 21, y: 1, width: 9, height: 3 },
  { tile: "B", x: 21, y: 5, width: 9, height: 3 },
  { tile: "R", x: 1, y: 13, width: 12, height: 9 },
  { tile: "2", x: 18, y: 13, width: 12, height: 9 },
  { tile: "S", x: 1, y: 24, width: 29, height: 8 },
];

// Los pasillos conectan las habitaciones; las puertas ocupan casillas de unión.
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

const EXIT_TILE = { x: 15, y: 31 };

// Los muebles se definen en casillas para facilitar cambios al diseño.
const FURNITURE = [
  { x: 2, y: 2, width: 3, height: 2, color: "#493a38", detail: "#67504a" },
  { x: 6, y: 2, width: 2, height: 2, color: "#403634" },
  { x: 12, y: 2, width: 4, height: 1, color: "#403a32" },
  { x: 17, y: 2, width: 2, height: 4, color: "#38332d" },
  { x: 22, y: 2, width: 3, height: 1, color: "#433b30" },
  { x: 27, y: 2, width: 2, height: 1, color: "#423a30" },
  { x: 22, y: 6, width: 2, height: 1, color: "#373c3c" },
  { x: 27, y: 6, width: 2, height: 1, color: "#363a3c" },
  {
    x: 2,
    y: 15,
    width: 4,
    height: 2,
    color: "#3b3030",
    detail: "#554141",
    type: "bed",
  },
  { x: 7, y: 14, width: 3, height: 2, color: "#403a32" },
  { x: 2, y: 19, width: 2, height: 1, color: "#3b3030" },
  {
    x: 20,
    y: 14,
    width: 4,
    height: 2,
    color: "#3b3030",
    detail: "#554141",
    type: "bed",
  },
  { x: 25, y: 14, width: 3, height: 1, color: "#443a34" },
  { x: 20, y: 19, width: 2, height: 1, color: "#393337" },
  { x: 4, y: 26, width: 4, height: 2, color: "#3e372e" },
  { x: 23, y: 27, width: 4, height: 1, color: "#3b3630" },
];

const HIDING_SPOTS = [
  {
    type: "armario",
    x: 7.5 * TILE_SIZE,
    y: 6.5 * TILE_SIZE,
    hideX: 8.5 * TILE_SIZE,
    hideY: 6.5 * TILE_SIZE,
    propX: 8 * TILE_SIZE + 5,
    propY: 5 * TILE_SIZE + 3,
    propWidth: 30,
    propHeight: 72,
  },
  {
    type: "cama",
    x: 4.5 * TILE_SIZE,
    y: 17.5 * TILE_SIZE,
    hideX: 4.5 * TILE_SIZE,
    hideY: 16 * TILE_SIZE,
  },
  {
    type: "cama",
    x: 22.5 * TILE_SIZE,
    y: 16.5 * TILE_SIZE,
    hideX: 22 * TILE_SIZE,
    hideY: 15 * TILE_SIZE,
  },
  {
    type: "cortina",
    x: 9.5 * TILE_SIZE,
    y: 18.5 * TILE_SIZE,
    hideX: 10.5 * TILE_SIZE,
    hideY: 18.5 * TILE_SIZE,
    propX: 10 * TILE_SIZE + 6,
    propY: 17 * TILE_SIZE + 3,
    propWidth: 27,
    propHeight: 76,
  },
  {
    type: "armario",
    x: 27.5 * TILE_SIZE,
    y: 17.5 * TILE_SIZE,
    hideX: 28.5 * TILE_SIZE,
    hideY: 17.5 * TILE_SIZE,
    propX: 28 * TILE_SIZE + 5,
    propY: 16 * TILE_SIZE + 3,
    propWidth: 30,
    propHeight: 72,
  },
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

const MISSION_ITEMS = [
  {
    id: "basementKey",
    name: "Llave del sótano",
    room: "Sótano",
    x: 15.5 * TILE_SIZE,
    y: 29.5 * TILE_SIZE,
    color: "#d8bd6b",
    hint: "La llave del sótano pesa en tu mano. La salida necesita más que esto.",
  },
  {
    id: "fuse",
    name: "Fusible",
    room: "Baño",
    x: 25.5 * TILE_SIZE,
    y: 7.5 * TILE_SIZE,
    color: "#b8c3a0",
    hint: "El fusible está intacto. Quizá alimenta el mecanismo de la puerta.",
  },
  {
    id: "mainKey",
    name: "Llave principal",
    room: "Dormitorio",
    x: 8.5 * TILE_SIZE,
    y: 20.5 * TILE_SIZE,
    color: "#c88a54",
    hint: "Encontraste la llave principal. Reúne las tres piezas para escapar.",
  },
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
  matrix[EXIT_TILE.y][EXIT_TILE.x] = "E";

  return matrix;
}

const HOUSE_MATRIX = createHouseMatrix();
const PATH_DIRECTIONS = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
];

// Mantiene ordenada la frontera de A* sin buscar el mínimo en todo el arreglo.
function pushPathNode(heap, node, scores) {
  let index = heap.length;
  heap.push(node);

  while (index > 0) {
    const parentIndex = Math.floor((index - 1) / 2);
    const parent = heap[parentIndex];
    if (scores[parent] <= scores[node]) break;
    heap[index] = parent;
    index = parentIndex;
  }
  heap[index] = node;
}

function popPathNode(heap, scores) {
  const first = heap[0];
  const last = heap.pop();
  if (heap.length === 0) return first;

  let index = 0;
  while (true) {
    const left = index * 2 + 1;
    const right = left + 1;
    if (left >= heap.length) break;
    const child =
      right < heap.length && scores[heap[right]] < scores[heap[left]]
        ? right
        : left;
    if (scores[last] <= scores[heap[child]]) break;
    heap[index] = heap[child];
    index = child;
  }
  heap[index] = last;
  return first;
}

export class GameMap {
  constructor() {
    this.batteries = BATTERY_TILES.map(({ x, y }) => ({
      x: (x + 0.5) * TILE_SIZE,
      y: (y + 0.5) * TILE_SIZE,
      collected: false,
    }));
    this.doors = DOORS.map(({ x, y }) => ({
      x: (x + 0.5) * TILE_SIZE,
      y: (y + 0.5) * TILE_SIZE,
      tileX: x,
      tileY: y,
      open: false,
    }));
    this.doorGrid = Array.from({ length: MAP_ROWS }, () =>
      Array(MAP_COLUMNS).fill(null),
    );
    for (const door of this.doors) {
      this.doorGrid[door.tileY][door.tileX] = door;
    }
    this.staticCollisionRects = [
      ...FURNITURE.map((item) => ({
        x: item.x * TILE_SIZE,
        y: item.y * TILE_SIZE,
        width: item.width * TILE_SIZE,
        height: item.height * TILE_SIZE,
      })),
      ...HIDING_SPOTS.filter((spot) => spot.propX !== undefined).map((spot) => ({
        x: spot.propX,
        y: spot.propY,
        width: spot.propWidth,
        height: spot.propHeight,
      })),
    ];
    this.thrownObjects = [];
    this.missionItems = MISSION_ITEMS.map((item) => ({
      ...item,
      collected: false,
    }));
    this.exitOpen = false;
    this.hidingSpots = HIDING_SPOTS.map((spot) => ({ ...spot }));
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

        const door = tile === "D" ? this.getDoorAtTile(x, y) : null;
        const isExitClosed = tile === "E" && !this.exitOpen;
        context.fillStyle =
          isExitClosed || (door && !door.open)
            ? DOOR_COLOR
            : FLOOR_COLORS[tile] ?? DOOR_COLOR;
        context.fillRect(worldX, worldY, TILE_SIZE, TILE_SIZE);
        context.fillStyle = "rgba(0, 0, 0, 0.12)";
        context.fillRect(worldX, worldY, TILE_SIZE, 1);
        context.fillRect(worldX, worldY, 1, TILE_SIZE);

        if (door && !door.open) {
          context.fillStyle = "#33271f";
          context.fillRect(worldX + 8, worldY + 3, TILE_SIZE - 16, TILE_SIZE - 6);
          context.fillStyle = "#594633";
          context.fillRect(worldX + 11, worldY + 5, TILE_SIZE - 22, TILE_SIZE - 10);
          context.fillStyle = "#b39a64";
          context.fillRect(worldX + 27, worldY + 19, 3, 3);
        }

        if (tile === "E") {
          context.fillStyle = isExitClosed ? "#211c17" : "#171b14";
          context.fillRect(worldX + 8, worldY + 5, TILE_SIZE - 16, TILE_SIZE - 5);
          context.fillStyle = isExitClosed ? "#57452f" : "#68724c";
          context.fillRect(worldX + 11, worldY + 8, TILE_SIZE - 22, TILE_SIZE - 8);
          context.fillStyle = "#c0a56a";
          context.fillRect(worldX + 27, worldY + 23, 3, 3);
          if (isExitClosed) {
            context.fillStyle = "#b69b61";
            context.fillRect(worldX + 17, worldY + 16, 7, 9);
            context.fillRect(worldX + 15, worldY + 13, 11, 3);
            context.fillStyle = "#30261b";
            context.fillRect(worldX + 19, worldY + 19, 3, 4);
          }
        }
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

      if (furniture.type === "bed") {
        context.fillStyle = "#6a5550";
        context.fillRect(x + 7, y + 7, furnitureWidth - 14, furnitureHeight - 14);
        context.fillStyle = "#786762";
        context.fillRect(x + 10, y + 9, furnitureWidth - 20, 13);
        context.fillStyle = "#493c3d";
        context.fillRect(
          x + 8,
          y + furnitureHeight * 0.58,
          furnitureWidth - 16,
          furnitureHeight * 0.3,
        );
      }

      context.strokeStyle = "#171615";
      context.lineWidth = 2;
      context.strokeRect(x + 1, y + 1, furnitureWidth - 2, furnitureHeight - 2);
    }

    for (const spot of this.hidingSpots) {
      if (spot.type === "cama") {
        continue;
      }

      if (
        spot.propX + spot.propWidth < cameraX ||
        spot.propX > cameraX + width ||
        spot.propY + spot.propHeight < cameraY ||
        spot.propY > cameraY + height
      ) {
        continue;
      }

      if (spot.type === "armario") {
        context.fillStyle = "#090909";
        context.fillRect(
          spot.propX - 3,
          spot.propY + 3,
          spot.propWidth + 6,
          spot.propHeight,
        );
        context.fillStyle = "#40362d";
        context.fillRect(
          spot.propX,
          spot.propY,
          spot.propWidth,
          spot.propHeight,
        );
        context.fillStyle = "#59493a";
        context.fillRect(
          spot.propX + 4,
          spot.propY + 5,
          spot.propWidth - 8,
          spot.propHeight - 10,
        );
        context.fillStyle = "#211d19";
        context.fillRect(
          spot.propX + spot.propWidth / 2 - 1,
          spot.propY + 5,
          2,
          spot.propHeight - 10,
        );
        context.fillStyle = "#a08a61";
        context.fillRect(
          spot.propX + spot.propWidth / 2 - 4,
          spot.propY + spot.propHeight / 2,
          3,
          3,
        );
        context.fillRect(
          spot.propX + spot.propWidth / 2 + 1,
          spot.propY + spot.propHeight / 2,
          3,
          3,
        );
      } else {
        context.fillStyle = "#090909";
        context.fillRect(
          spot.propX - 2,
          spot.propY + 4,
          spot.propWidth + 4,
          spot.propHeight,
        );
        context.fillStyle = "#4b2729";
        context.fillRect(
          spot.propX,
          spot.propY,
          spot.propWidth,
          spot.propHeight,
        );
        context.fillStyle = "#713b3b";
        for (let fold = 0; fold < 3; fold += 1) {
          context.fillRect(
            spot.propX + 4 + fold * 8,
            spot.propY + 3,
            3,
            spot.propHeight - 6,
          );
        }
      }
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

    for (const item of this.missionItems) {
      if (
        item.collected ||
        item.x < cameraX ||
        item.x > cameraX + width ||
        item.y < cameraY ||
        item.y > cameraY + height
      ) {
        continue;
      }

      context.fillStyle = "rgba(0, 0, 0, 0.8)";
      context.fillRect(item.x - 12, item.y - 12, 24, 24);
      context.fillStyle = item.color;
      if (item.id === "fuse") {
        context.fillRect(item.x - 3, item.y - 10, 6, 20);
        context.fillRect(item.x - 7, item.y - 8, 14, 3);
        context.fillRect(item.x - 7, item.y + 5, 14, 3);
      } else {
        context.fillRect(item.x - 8, item.y - 3, 16, 6);
        context.fillRect(item.x + 3, item.y - 3, 4, 11);
        context.fillRect(item.x + 3, item.y + 5, 9, 3);
        context.fillRect(item.x + 8, item.y + 3, 3, 5);
      }
      context.fillStyle = "#f1e2b1";
      context.fillRect(item.x - 2, item.y - 2, 4, 4);
    }

    for (const object of this.thrownObjects) {
      if (object.remaining <= 0) continue;
      context.fillStyle = "#11110f";
      context.fillRect(object.x - 5, object.y - 3, 10, 7);
      context.fillStyle = "#6c6250";
      context.fillRect(object.x - 3, object.y - 2, 6, 4);
    }
  }

  getDoorAtTile(tileX, tileY) {
    return this.doorGrid[tileY]?.[tileX] ?? null;
  }

  findNearbyDoor(x, y, radius) {
    return (
      this.doors.find(
        (door) => Math.hypot(door.x - x, door.y - y) <= radius,
      ) ?? null
    );
  }

  toggleDoor(door, actor = null) {
    if (!door || !this.doors.includes(door)) return false;

    if (
      door.open &&
      actor &&
      actor.x < door.x + TILE_SIZE / 2 &&
      actor.x + actor.size > door.x - TILE_SIZE / 2 &&
      actor.y < door.y + TILE_SIZE / 2 &&
      actor.y + actor.size > door.y - TILE_SIZE / 2
    ) {
      return null;
    }

    door.open = !door.open;
    return door.open;
  }

  openDoorNear(x, y, radius) {
    const door = this.doors.find(
      (item) => !item.open && Math.hypot(item.x - x, item.y - y) <= radius,
    );
    if (!door) return false;

    door.open = true;
    return true;
  }

  addThrownObject(x, y) {
    this.thrownObjects.push({ x, y, remaining: 12 });
  }

  getRandomRoomPointAwayFrom(x, y, minimumDistance = 300, within = null) {
    const candidates = [];

    for (const room of ROOMS) {
      for (let row = room.y; row < room.y + room.height; row += 1) {
        for (let column = room.x; column < room.x + room.width; column += 1) {
          const pointX = (column + 0.5) * TILE_SIZE;
          const pointY = (row + 0.5) * TILE_SIZE;
          if (
            Math.hypot(pointX - x, pointY - y) >= minimumDistance &&
            (!within ||
              Math.hypot(pointX - within.x, pointY - within.y) <=
                within.maxDistance) &&
            !this.collidesAt(pointX - 4, pointY - 4, 8, 8)
          ) {
            candidates.push({ x: pointX, y: pointY });
          }
        }
      }
    }

    if (candidates.length === 0) return null;
    return candidates[Math.floor(Math.random() * candidates.length)];
  }

  updateThrownObjects(deltaTime) {
    this.thrownObjects = this.thrownObjects.filter((object) => {
      object.remaining -= deltaTime;
      return object.remaining > 0;
    });
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
        HOUSE_MATRIX[row][column] === "#" ||
        (HOUSE_MATRIX[row][column] === "E" && !this.exitOpen) ||
        (HOUSE_MATRIX[row][column] === "D" &&
          !this.getDoorAtTile(column, row)?.open)
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
    const range =
      (hasBattery
        ? GAME_CONFIG.battery.flashlightRange
        : GAME_CONFIG.battery.emptyFlashlightRange) * flicker;
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

    const ambientRadius = hasBattery
      ? GAME_CONFIG.battery.ambientRange
      : GAME_CONFIG.battery.emptyAmbientRange;
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

  findNearbyHidingSpot(x, y, radius) {
    return (
      this.hidingSpots.find(
        (spot) => Math.hypot(spot.x - x, spot.y - y) <= radius,
      ) ?? null
    );
  }

  getExitPosition() {
    return {
      x: (EXIT_TILE.x + 0.5) * TILE_SIZE,
      y: (EXIT_TILE.y + 0.5) * TILE_SIZE,
    };
  }

  findNearbyExit(x, y, radius = 64) {
    const exit = this.getExitPosition();
    return Math.hypot(exit.x - x, exit.y - y) <= radius;
  }

  openExit(hasAllItems) {
    if (!hasAllItems) return false;

    this.exitOpen = true;
    return true;
  }

  collectMissionItemAt(x, y, radius = 28) {
    const item = this.missionItems.find(
      (missionItem) =>
        !missionItem.collected &&
        Math.hypot(missionItem.x - x, missionItem.y - y) <= radius,
    );
    if (!item) return null;

    item.collected = true;
    return item;
  }

  hasReachedExit(x, y, radius = 18) {
    const exit = this.getExitPosition();
    return Math.hypot(exit.x - x, exit.y - y) <= radius;
  }

  hasLineOfSight(x1, y1, x2, y2) {
    const directionX = x2 - x1;
    const directionY = y2 - y1;
    const distance = Math.hypot(directionX, directionY);
    if (distance === 0) return true;

    return (
      this.castRay(
        x1,
        y1,
        directionX / distance,
        directionY / distance,
        distance,
      ) >= distance
    );
  }

  getPatrolWaypoints() {
    return [
      { x: 4.5 * TILE_SIZE, y: 6.5 * TILE_SIZE },
      { x: 13.5 * TILE_SIZE, y: 6.5 * TILE_SIZE },
      { x: 23.5 * TILE_SIZE, y: 3.5 * TILE_SIZE },
      { x: 26.5 * TILE_SIZE, y: 7.5 * TILE_SIZE },
      { x: 25.5 * TILE_SIZE, y: 10.5 * TILE_SIZE },
      { x: 10.5 * TILE_SIZE, y: 10.5 * TILE_SIZE },
      { x: 9.5 * TILE_SIZE, y: 19.5 * TILE_SIZE },
      { x: 15.5 * TILE_SIZE, y: 27.5 * TILE_SIZE },
      { x: 26.5 * TILE_SIZE, y: 28.5 * TILE_SIZE },
      { x: 22.5 * TILE_SIZE, y: 16.5 * TILE_SIZE },
      { x: 5.5 * TILE_SIZE, y: 19.5 * TILE_SIZE },
    ];
  }

  findPath(startX, startY, targetX, targetY, actorSize = 20) {
    const startColumn = Math.floor(startX / TILE_SIZE);
    const startRow = Math.floor(startY / TILE_SIZE);
    const targetColumn = Math.floor(targetX / TILE_SIZE);
    const targetRow = Math.floor(targetY / TILE_SIZE);
    const startIndex = startRow * MAP_COLUMNS + startColumn;
    const targetIndex = targetRow * MAP_COLUMNS + targetColumn;

    const isInsideMap = (column, row) =>
      column >= 0 &&
      column < MAP_COLUMNS &&
      row >= 0 &&
      row < MAP_ROWS;

    if (
      !isInsideMap(startColumn, startRow) ||
      !isInsideMap(targetColumn, targetRow)
    ) {
      return [];
    }

    const nodeCount = MAP_COLUMNS * MAP_ROWS;
    const previous = new Int32Array(nodeCount).fill(-1);
    const costs = new Float64Array(nodeCount).fill(Infinity);
    const scores = new Float64Array(nodeCount).fill(Infinity);
    const openSet = [];
    const closedSet = new Uint8Array(nodeCount);
    costs[startIndex] = 0;
    const heuristic = (column, row) =>
      Math.abs(targetColumn - column) + Math.abs(targetRow - row);
    scores[startIndex] = heuristic(startColumn, startRow);
    pushPathNode(openSet, startIndex, scores);

    while (openSet.length > 0) {
      const index = popPathNode(openSet, scores);
      if (closedSet[index]) continue;
      if (index === targetIndex) break;
      closedSet[index] = 1;
      const column = index % MAP_COLUMNS;
      const row = Math.floor(index / MAP_COLUMNS);
      for (const [directionX, directionY] of PATH_DIRECTIONS) {
        const nextColumn = column + directionX;
        const nextRow = row + directionY;
        const nextIndex = nextRow * MAP_COLUMNS + nextColumn;
        if (!isInsideMap(nextColumn, nextRow) || closedSet[nextIndex]) {
          continue;
        }

        if (
          this.collidesAt(
            (nextColumn + 0.5) * TILE_SIZE - actorSize / 2,
            (nextRow + 0.5) * TILE_SIZE - actorSize / 2,
            actorSize,
            actorSize,
            true,
          )
        ) {
          continue;
        }

        const newCost = costs[index] + 1;
        if (newCost >= costs[nextIndex]) continue;

        previous[nextIndex] = index;
        costs[nextIndex] = newCost;
        scores[nextIndex] = newCost + heuristic(nextColumn, nextRow);
        pushPathNode(openSet, nextIndex, scores);
      }
    }

    if (startIndex !== targetIndex && previous[targetIndex] === -1) return [];

    const path = [];
    for (
      let index = targetIndex;
      index !== startIndex;
      index = previous[index]
    ) {
      path.push({
        x: (index % MAP_COLUMNS + 0.5) * TILE_SIZE,
        y: (Math.floor(index / MAP_COLUMNS) + 0.5) * TILE_SIZE,
      });
    }

    path.reverse();
    if (path.length > 0) {
      path[path.length - 1] = { x: targetX, y: targetY };
    }
    return path;
  }

  collidesAt(x, y, width, height, ignoreClosedDoors = false) {
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

        if (
          HOUSE_MATRIX[row][column] === "E" &&
          !this.exitOpen
        ) {
          return true;
        }

        if (
          !ignoreClosedDoors &&
          HOUSE_MATRIX[row][column] === "D" &&
          !this.getDoorAtTile(column, row)?.open
        ) {
          return true;
        }
      }
    }

    return this.staticCollisionRects.some((rectangle) => {
      return (
        x < rectangle.x + rectangle.width &&
        x + width > rectangle.x &&
        y < rectangle.y + rectangle.height &&
        y + height > rectangle.y
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
