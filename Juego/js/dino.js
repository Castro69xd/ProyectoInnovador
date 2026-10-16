import { GAME_CONFIG } from "./config.js";

// La IA consulta estos estados para alternar patrulla, investigación y caza.
const TILE_SIZE = 40;
const DINO_SIZE = 28;

function createUnitSphereFaces() {
  const rows = 5;
  const columns = 8;
  const vertices = [];

  for (let row = 0; row <= rows; row += 1) {
    const latitude = (Math.PI * row) / rows;
    for (let column = 0; column <= columns; column += 1) {
      const longitude = (2 * Math.PI * column) / columns;
      vertices.push([
        Math.sin(latitude) * Math.cos(longitude),
        Math.sin(latitude) * Math.sin(longitude),
        Math.cos(latitude),
      ]);
    }
  }

  const faces = [];
  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const first = row * (columns + 1) + column;
      const next = first + columns + 1;
      faces.push([vertices[first], vertices[next], vertices[first + 1]]);
      faces.push([
        vertices[first + 1],
        vertices[next],
        vertices[next + 1],
      ]);
    }
  }

  return faces.map((face) => {
    const [first, second, third] = face;
    const edgeA = second.map((value, index) => value - first[index]);
    const edgeB = third.map((value, index) => value - first[index]);
    const normal = [
      edgeA[1] * edgeB[2] - edgeA[2] * edgeB[1],
      edgeA[2] * edgeB[0] - edgeA[0] * edgeB[2],
      edgeA[0] * edgeB[1] - edgeA[1] * edgeB[0],
    ];
    const center = first.map(
      (value, index) => value + second[index] + third[index],
    );
    if (normal[0] * center[0] + normal[1] * center[1] + normal[2] * center[2] < 0) {
      return [first, third, second];
    }
    return face;
  });
}

const UNIT_SPHERE_FACES = createUnitSphereFaces();
const DINO_MODEL_PARTS = [
  { x: -10, y: 14, z: 8, rx: 7, ry: 11, rz: 7, color: "#536347", gait: 1 },
  { x: 10, y: 14, z: 8, rx: 7, ry: 11, rz: 7, color: "#46583c", gait: -1 },
  { x: -12, y: 24, z: 5, rx: 4.5, ry: 8, rz: 4.5, color: "#394832", gait: 1 },
  { x: 12, y: 24, z: 5, rx: 4.5, ry: 8, rz: 4.5, color: "#303f2d", gait: -1 },
  { x: -12, y: 29, z: 3, rx: 5, ry: 7, rz: 2.8, color: "#283629", gait: 1 },
  { x: 12, y: 29, z: 3, rx: 5, ry: 7, rz: 2.8, color: "#243126", gait: -1 },
  { x: 0, y: 29, z: 12, rx: 8, ry: 13, rz: 6, color: "#3d4d35" },
  { x: 0, y: 40, z: 9, rx: 5.5, ry: 13, rz: 4.2, color: "#34432f" },
  { x: 0, y: 51, z: 7, rx: 3, ry: 12, rz: 2.5, color: "#29392b" },
  { x: 0, y: 2, z: 14, rx: 14, ry: 24, rz: 13, color: "#63734b" },
  { x: 0, y: -13, z: 13, rx: 10, ry: 14, rz: 11, color: "#728152" },
  { x: -8, y: -15, z: 10, rx: 3.5, ry: 8, rz: 3.5, color: "#46563a", gait: -0.45 },
  { x: 8, y: -15, z: 10, rx: 3.5, ry: 8, rz: 3.5, color: "#3c4d35", gait: 0.45 },
  { x: 0, y: -25, z: 14, rx: 7.5, ry: 14, rz: 8, color: "#718052" },
  { x: 0, y: -37, z: 16, rx: 9, ry: 11, rz: 7.5, color: "#83905a" },
  { x: 0, y: -45, z: 12, rx: 6.5, ry: 8, rz: 4.5, color: "#66764a" },
].map((part) => ({
  ...part,
  rgb: [
    Number.parseInt(part.color.slice(1, 3), 16),
    Number.parseInt(part.color.slice(3, 5), 16),
    Number.parseInt(part.color.slice(5, 7), 16),
  ],
}));

function transformDinoPoint(x, y, z, angle, originX, originY) {
  const rotatedX = x * Math.cos(angle) - y * Math.sin(angle);
  const rotatedY = x * Math.sin(angle) + y * Math.cos(angle);
  return {
    x: originX + rotatedX,
    y: originY + rotatedY * 0.72 - z * 0.68,
    depth: rotatedY * 0.68 + z * 0.72,
  };
}

function drawDinoMeshPart(context, part, angle, originX, originY, gait, breathe) {
  const limbAngle = part.gait ? gait * part.gait : 0;
  const cosine = Math.cos(limbAngle);
  const sine = Math.sin(limbAngle);
  const transformed = UNIT_SPHERE_FACES.map((face) =>
    face.map(([unitX, unitY, unitZ]) => {
      const localX = unitX * part.rx;
      const localY = unitY * part.ry;
      const localZ = unitZ * part.rz;
      const rotatedY = localY * cosine - localZ * sine;
      const rotatedZ = localY * sine + localZ * cosine;
      return transformDinoPoint(
        part.x + localX,
        part.y + rotatedY,
        part.z + rotatedZ + breathe,
        angle,
        originX,
        originY,
      );
    }),
  );

  for (let index = 0; index < UNIT_SPHERE_FACES.length; index += 1) {
    const face = transformed[index];
    const [a, b, c] = face;
    const edgeA = [b.x - a.x, b.y - a.y, b.depth - a.depth];
    const edgeB = [c.x - a.x, c.y - a.y, c.depth - a.depth];
    const normalX = edgeA[1] * edgeB[2] - edgeA[2] * edgeB[1];
    const normalY = edgeA[2] * edgeB[0] - edgeA[0] * edgeB[2];
    const normalZ = edgeA[0] * edgeB[1] - edgeA[1] * edgeB[0];
    const normalLength = Math.hypot(normalX, normalY, normalZ) || 1;
    const towardViewer = normalZ / normalLength;
    if (towardViewer <= 0) continue;

    const light =
      (normalX * -0.34 + normalY * -0.4 + normalZ * 0.82) / normalLength;
    const shade = 0.48 + Math.max(0, light) * 0.52;
    context.fillStyle = `rgb(${Math.round(part.rgb[0] * shade)}, ${Math.round(
      part.rgb[1] * shade,
    )}, ${Math.round(part.rgb[2] * shade)})`;
    context.beginPath();
    context.moveTo(a.x, a.y);
    context.lineTo(b.x, b.y);
    context.lineTo(c.x, c.y);
    context.closePath();
    context.fill();
  }
}

export const DINO_STATES = {
  PATROL: "PATRULLA",
  INVESTIGATE: "INVESTIGA",
  CHASE: "PERSIGUE",
  SEARCH: "BUSCA",
  SNIFF: "OLFATEA",
};

export class Dino {
  constructor() {
    this.x = 26 * TILE_SIZE + TILE_SIZE / 2;
    this.y = 10 * TILE_SIZE + TILE_SIZE / 2;
    this.size = DINO_SIZE;
    this.facingX = -1;
    this.facingY = 0;
    this.state = DINO_STATES.PATROL;
    this.path = [];
    this.pathCooldown = 0;
    this.targetX = this.x;
    this.targetY = this.y;
    this.waypoints = [];
    this.waypointIndex = 0;
    this.lastKnownPlayer = null;
    this.lastSound = null;
    this.investigateWait = 0;
    this.searchTime = 0;
    this.searchPointIndex = 0;
    this.searchPoints = null;
    this.sniffTime = 0;
    this.isSniffing = false;
    this.hasCaughtPlayer = false;
    this.doorCreaked = false;
    this.walkTime = 0;
    this.blockedTime = 0;
    this.patrolInitialized = false;
  }

  setState(state) {
    if (this.state === state) return;

    this.state = state;
    this.path = [];
    this.pathCooldown = 0;

    if (state === DINO_STATES.SEARCH) {
      this.searchTime = 0;
      this.searchPointIndex = 0;
      this.searchPoints = null;
    }

    if (state !== DINO_STATES.SNIFF) {
      this.sniffTime = 0;
      this.isSniffing = false;
    }
  }

  hearNoise(x, y, loudness = 1, gameMap = null) {
    if (
      this.state === DINO_STATES.SNIFF ||
      loudness <= 0 ||
      (this.state === DINO_STATES.CHASE &&
        loudness < GAME_CONFIG.noise.chaseInterruptionThreshold)
    ) {
      return false;
    }

    const distance = Math.hypot(x - this.x, y - this.y);
    let hearingRange =
      GAME_CONFIG.dino.hearingBase +
      loudness * GAME_CONFIG.dino.hearingPerLoudness;
    if (gameMap && !gameMap.hasLineOfSight(this.x, this.y, x, y)) {
      hearingRange *= GAME_CONFIG.dino.occludedHearingMultiplier;
    }
    if (distance > hearingRange) return false;

    if (
      this.state !== DINO_STATES.INVESTIGATE ||
      distance < Math.hypot(this.lastSound.x - this.x, this.lastSound.y - this.y)
    ) {
      this.lastSound = { x, y };
      this.targetX = x;
      this.targetY = y;
      this.investigateWait = 0;
      this.setState(DINO_STATES.INVESTIGATE);
    }

    return true;
  }

  canSeePlayer(player, gameMap) {
    if (player.isHidden) return false;

    const playerX = player.x + player.size / 2;
    const playerY = player.y + player.size / 2;
    const deltaX = playerX - this.x;
    const deltaY = playerY - this.y;
    const distance = Math.hypot(deltaX, deltaY);
    if (distance > GAME_CONFIG.dino.sightDistance) return false;

    const facingLength = Math.hypot(this.facingX, this.facingY) || 1;
    const directionDot =
      (deltaX / Math.max(distance, 1)) * (this.facingX / facingLength) +
      (deltaY / Math.max(distance, 1)) * (this.facingY / facingLength);

    return (
      directionDot >= Math.cos(GAME_CONFIG.dino.sightHalfAngle) &&
      gameMap.hasLineOfSight(this.x, this.y, playerX, playerY)
    );
  }

  update(deltaTime, player, gameMap) {
    if (this.hasCaughtPlayer) return true;
    this.doorCreaked = false;

    if (!this.patrolInitialized) {
      this.waypoints = gameMap.getPatrolWaypoints();
      this.waypointIndex = this.findNearestWaypoint();
      this.patrolInitialized = true;
    }

    const playerX = player.x + player.size / 2;
    const playerY = player.y + player.size / 2;
    const distanceToPlayer = Math.hypot(playerX - this.x, playerY - this.y);
    const visible = this.canSeePlayer(player, gameMap);
    this.walkTime += deltaTime;

    if (visible) {
      this.lastKnownPlayer = { x: playerX, y: playerY };
      this.setState(DINO_STATES.CHASE);
      this.targetX = playerX;
      this.targetY = playerY;
    } else if (this.state === DINO_STATES.CHASE) {
      this.setState(DINO_STATES.SEARCH);
    }

    if (player.isHidden) {
      const hidingSpot = player.hidingSpot;
      const distanceToHidingSpot = Math.hypot(
        hidingSpot.x - this.x,
        hidingSpot.y - this.y,
      );

      if (distanceToHidingSpot <= GAME_CONFIG.dino.sniffDistance) {
        this.setState(DINO_STATES.SNIFF);
        this.isSniffing = true;
        this.targetX = this.x;
        this.targetY = this.y;
        this.sniffTime += deltaTime;

        const sniffProgress = Math.min(
          1,
          this.sniffTime / GAME_CONFIG.dino.sniffDiscoveryTime,
        );
        const discoveryChance = (0.008 + sniffProgress * 0.12) * deltaTime;
        if (
          this.sniffTime >= GAME_CONFIG.dino.sniffDiscoveryTime ||
          Math.random() < discoveryChance
        ) {
          player.leaveHiding(true);
          this.lastKnownPlayer = { x: playerX, y: playerY };
          this.setState(DINO_STATES.CHASE);
          this.targetX = playerX;
          this.targetY = playerY;
        }
      } else if (
        this.lastKnownPlayer &&
        (this.state === DINO_STATES.CHASE ||
          this.state === DINO_STATES.SEARCH ||
          this.state === DINO_STATES.SNIFF)
      ) {
        this.isSniffing = false;
        this.setState(DINO_STATES.SEARCH);
      }
    } else if (this.state === DINO_STATES.SNIFF) {
      this.isSniffing = false;
      this.setState(visible ? DINO_STATES.CHASE : DINO_STATES.SEARCH);
    }

    if (this.state === DINO_STATES.PATROL) {
      const waypoint = this.waypoints[this.waypointIndex];
      if (Math.hypot(waypoint.x - this.x, waypoint.y - this.y) < 24) {
        this.waypointIndex = (this.waypointIndex + 1) % this.waypoints.length;
        this.path = [];
      }
      const nextWaypoint = this.waypoints[this.waypointIndex];
      this.targetX = nextWaypoint.x;
      this.targetY = nextWaypoint.y;
    } else if (this.state === DINO_STATES.INVESTIGATE) {
      if (Math.hypot(this.targetX - this.x, this.targetY - this.y) < 26) {
        this.investigateWait += deltaTime;
        if (this.investigateWait >= 2.5) {
          this.lastSound = null;
          this.setState(DINO_STATES.PATROL);
        }
      }
    } else if (this.state === DINO_STATES.SEARCH) {
      this.searchTime += deltaTime;
      if (this.searchPoints === null) {
        this.searchPoints = this.getSearchPoints(gameMap);
      }
      const searchPoints = this.searchPoints;
      if (
        searchPoints.length === 0 ||
        this.searchTime >= GAME_CONFIG.dino.searchDuration
      ) {
        this.lastKnownPlayer = null;
        this.setState(DINO_STATES.PATROL);
      } else {
        const searchPoint = searchPoints[this.searchPointIndex % searchPoints.length];
        this.targetX = searchPoint.x;
        this.targetY = searchPoint.y;
        if (Math.hypot(this.targetX - this.x, this.targetY - this.y) < 24) {
          this.searchPointIndex += 1;
        }
      }
    }

    if (
      gameMap.openDoorNear(
        this.x,
        this.y,
        TILE_SIZE / 2 + this.size / 2 + 8,
      )
    ) {
      this.doorCreaked = true;
      this.path = [];
      this.pathCooldown = 0;
    }

    this.pathCooldown -= deltaTime;
    if (
      this.state !== DINO_STATES.SNIFF &&
      this.pathCooldown <= 0 &&
      Math.hypot(this.targetX - this.x, this.targetY - this.y) > 12
    ) {
      this.path = gameMap.findPath(
        this.x,
        this.y,
        this.targetX,
        this.targetY,
        this.size,
      );
      this.pathCooldown = this.state === DINO_STATES.CHASE ? 0.12 : 0.32;
    }

    if (this.state !== DINO_STATES.SNIFF) {
      this.moveAlongPath(deltaTime, gameMap);
    }

    if (
      !player.isHidden &&
      distanceToPlayer <= this.size / 2 + player.size / 2 &&
      gameMap.hasLineOfSight(this.x, this.y, playerX, playerY)
    ) {
      this.hasCaughtPlayer = true;
    }

    return this.hasCaughtPlayer;
  }

  moveAlongPath(deltaTime, gameMap) {
    const nextPoint = this.path[0];
    if (!nextPoint) return;

    const directionX = nextPoint.x - this.x;
    const directionY = nextPoint.y - this.y;
    const distance = Math.hypot(directionX, directionY);
    if (distance <= 3) {
      this.path.shift();
      return;
    }

    let speed = GAME_CONFIG.dino.patrolSpeed;
    if (this.state === DINO_STATES.INVESTIGATE) {
      speed = GAME_CONFIG.dino.investigateSpeed;
    }
    if (this.state === DINO_STATES.SEARCH) {
      speed = GAME_CONFIG.dino.searchSpeed;
    }
    if (this.state === DINO_STATES.CHASE) {
      speed = GAME_CONFIG.dino.chaseSpeed;
    }

    const step = Math.min(distance, speed * deltaTime);
    const movementX = (directionX / distance) * step;
    const movementY = (directionY / distance) * step;

    const actorX = this.x - this.size / 2;
    const actorY = this.y - this.size / 2;
    if (
      !gameMap.collidesAt(
        actorX + movementX,
        actorY,
        this.size,
        this.size,
      )
    ) {
      this.x += movementX;
    } else {
      const alignment = gameMap.alignActorWithOpenDoor(
        actorX,
        actorY,
        this.size,
        this.size,
        "horizontal",
        movementX,
      );
      if (alignment) this.y = alignment.y + this.size / 2;
    }

    if (
      !gameMap.collidesAt(
        this.x - this.size / 2,
        this.y - this.size / 2 + movementY,
        this.size,
        this.size,
      )
    ) {
      this.y += movementY;
    } else {
      const alignment = gameMap.alignActorWithOpenDoor(
        this.x - this.size / 2,
        this.y - this.size / 2,
        this.size,
        this.size,
        "vertical",
        movementY,
      );
      if (alignment) this.x = alignment.x + this.size / 2;
    }

    const movedX = this.x - (actorX + this.size / 2);
    const movedY = this.y - (actorY + this.size / 2);
    const movementLength = Math.hypot(movedX, movedY);
    if (movementLength > 0) {
      this.blockedTime = 0;
      this.facingX = movedX / movementLength;
      this.facingY = movedY / movementLength;
    } else {
      this.blockedTime += deltaTime;
      if (this.blockedTime >= 0.3) {
        this.path = [];
        this.pathCooldown = 0;
        this.blockedTime = 0;
      }
    }
  }

  findNearestWaypoint() {
    let nearestIndex = 0;
    let nearestDistance = Infinity;
    for (let index = 0; index < this.waypoints.length; index += 1) {
      const waypoint = this.waypoints[index];
      const distance = Math.hypot(waypoint.x - this.x, waypoint.y - this.y);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = index;
      }
    }
    return nearestIndex;
  }

  getSearchPoints(gameMap) {
    const center = this.lastKnownPlayer;
    if (!center) return [];

    const points = [
      { x: center.x, y: center.y },
      { x: center.x + TILE_SIZE * 2, y: center.y },
      { x: center.x, y: center.y + TILE_SIZE * 2 },
      { x: center.x - TILE_SIZE * 2, y: center.y },
      { x: center.x, y: center.y - TILE_SIZE * 2 },
    ];
    const nearbySpots = gameMap.hidingSpots
      .filter(
        (spot) => Math.hypot(spot.x - center.x, spot.y - center.y) <= 220,
      )
      .sort(
        (first, second) =>
          Math.hypot(first.x - center.x, first.y - center.y) -
          Math.hypot(second.x - center.x, second.y - center.y),
      );

    for (const spot of nearbySpots) {
      points.push({ x: spot.x, y: spot.y });
    }

    return points.filter(
      (point) =>
        !gameMap.collidesAt(
          point.x - this.size / 2,
          point.y - this.size / 2,
          this.size,
          this.size,
        ),
    );
  }

  draw(context) {
    const angle = Math.atan2(this.facingY, this.facingX) + Math.PI / 2;
    const walking =
      this.state !== DINO_STATES.SNIFF &&
      this.path.length > 0;
    const gait = walking ? Math.sin(this.walkTime * 13) * 0.3 : 0;
    const breathe = walking ? Math.sin(this.walkTime * 3) * 0.6 : 0;

    context.save();
    context.fillStyle = "rgba(0, 0, 0, 0.48)";
    context.beginPath();
    context.ellipse(this.x + 4, this.y + 10, 22, 38, angle, 0, Math.PI * 2);
    context.fill();

    for (const part of DINO_MODEL_PARTS) {
      drawDinoMeshPart(context, part, angle, this.x, this.y, gait, breathe);
    }

    for (const side of [-1, 1]) {
      const eye = transformDinoPoint(
        side * 5.5,
        -40,
        19 + breathe,
        angle,
        this.x,
        this.y,
      );
      context.fillStyle = "#11140f";
      context.beginPath();
      context.arc(eye.x, eye.y, 2.3, 0, Math.PI * 2);
      context.fill();
      context.fillStyle =
        this.state === DINO_STATES.CHASE ? "#ff382e" : "#e0a848";
      context.beginPath();
      context.arc(eye.x, eye.y, 1.35, 0, Math.PI * 2);
      context.fill();

      const nostril = transformDinoPoint(
        side * 2.7,
        -51,
        14 + breathe,
        angle,
        this.x,
        this.y,
      );
      context.fillStyle = "#20271d";
      context.beginPath();
      context.arc(nostril.x, nostril.y, 0.9, 0, Math.PI * 2);
      context.fill();
    }

    // Las crestas facetadas se proyectan como triángulos sobre el lomo.
    for (let spike = 0; spike < 4; spike += 1) {
      const y = spike * 8 - 11;
      const left = transformDinoPoint(-3, y, 25 + breathe, angle, this.x, this.y);
      const tip = transformDinoPoint(0, y - 2, 31 + breathe, angle, this.x, this.y);
      const right = transformDinoPoint(3, y, 25 + breathe, angle, this.x, this.y);
      context.fillStyle = "#a0a06b";
      context.beginPath();
      context.moveTo(left.x, left.y);
      context.lineTo(tip.x, tip.y);
      context.lineTo(right.x, right.y);
      context.closePath();
      context.fill();
    }

    context.restore();

    context.fillStyle =
      this.state === DINO_STATES.CHASE
        ? "#bb443c"
        : this.state === DINO_STATES.SNIFF
          ? "#b59655"
          : "#aaa48e";
    context.font = "10px sans-serif";
    context.textAlign = "center";
    context.fillText(this.state, this.x, this.y - 48);
    context.textAlign = "start";
  }
}
