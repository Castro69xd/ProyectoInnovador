import { GAME_CONFIG } from "./config.js";

// La IA consulta estos estados para alternar patrulla, investigación y caza.
const TILE_SIZE = 40;
const DINO_SIZE = 34;

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
    this.sniffTime = 0;
    this.isSniffing = false;
    this.hasCaughtPlayer = false;
    this.doorCreaked = false;
    this.walkTime = 0;
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
      const searchPoints = this.getSearchPoints(gameMap);
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

    if (gameMap.openDoorNear(this.x, this.y, this.size + 12)) {
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

    if (
      !gameMap.collidesAt(
        this.x - this.size / 2 + movementX,
        this.y - this.size / 2,
        this.size,
        this.size,
      )
    ) {
      this.x += movementX;
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
    }

    const movementLength = Math.hypot(movementX, movementY);
    if (movementLength > 0) {
      this.facingX = movementX / movementLength;
      this.facingY = movementY / movementLength;
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
    const stride = walking ? Math.sin(this.walkTime * 13) * 5 : 0;

    context.save();
    context.translate(this.x, this.y);
    context.rotate(angle);

    context.fillStyle = "#0a0d0b";
    context.beginPath();
    context.moveTo(-7, 18);
    context.lineTo(-5 + Math.sin(this.walkTime * 9) * 3, 51);
    context.lineTo(0, 59);
    context.lineTo(5 + Math.sin(this.walkTime * 9) * 3, 51);
    context.lineTo(7, 18);
    context.closePath();
    context.fill();

    context.fillStyle = "#20271f";
    context.fillRect(-22, 9 + stride, 13, 20);
    context.fillRect(9, 9 - stride, 13, 20);
    context.fillStyle = "#10140f";
    context.fillRect(-23, 24 + stride, 15, 8);
    context.fillRect(8, 24 - stride, 15, 8);

    context.fillStyle = "#30392d";
    context.beginPath();
    context.ellipse(0, 0, 23, 34, 0, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = "#46503a";
    context.beginPath();
    context.ellipse(-5, -1, 7, 26, 0, 0, Math.PI * 2);
    context.fill();

    context.fillStyle = "#293329";
    context.beginPath();
    context.ellipse(0, -29, 19, 20, 0, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = "#394333";
    context.fillRect(-15, -33, 28, 15);
    context.fillStyle = "#171b16";
    context.fillRect(-11, -20, 24, 5);
    context.fillStyle = "#c2b58b";
    for (let tooth = 0; tooth < 5; tooth += 1) {
      context.fillRect(-8 + tooth * 4, -20, 2, 4);
    }

    context.fillStyle = this.state === DINO_STATES.CHASE ? "#ff4537" : "#d8a14d";
    context.fillRect(8, -36, 5, 5);
    context.fillStyle = "#f2d8a1";
    context.fillRect(10, -35, 2, 2);
    context.fillStyle = "#4b5140";
    for (let spike = 0; spike < 5; spike += 1) {
      context.fillRect(-10 + spike * 5, 16, 4, 8);
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
