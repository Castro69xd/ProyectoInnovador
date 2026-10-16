// Ajusta estos valores base para cambiar el balance general del juego.
const BALANCE_BASE = {
  player: {
    walkSpeed: 155,
    sprintSpeed: 260,
    crouchSpeed: 78,
    staminaDrain: 32,
    staminaRecovery: 22,
  },
  dino: {
    patrolSpeed: 82,
    investigateSpeed: 112,
    searchSpeed: 102,
    chaseSpeed: 178,
    sightDistance: 340,
    sightHalfAngle: Math.PI / 3.2,
    sniffDistance: 78,
    sniffDiscoveryTime: 12,
    searchDuration: 12,
    hearingBase: 180,
    hearingPerLoudness: 250,
    occludedHearingMultiplier: 0.55,
  },
  battery: {
    durationSeconds: 60,
    pickupAmount: 35,
    flashlightRange: 390,
    emptyFlashlightRange: 0,
    ambientRange: 78,
    emptyAmbientRange: 38,
  },
  noise: {
    walking: 0.28,
    running: 1,
    doorOpen: 0.85,
    doorClose: 0.55,
    thrownObject: 1,
    scare: 2.2,
    lockedExit: 0.7,
    chaseInterruptionThreshold: 0.75,
  },
};

// La dificultad modifica solo las variables de balance, no las reglas del juego.
export const DIFFICULTIES = {
  easy: {
    label: "Fácil",
    description: "Más tiempo y un depredador menos alerta",
    player: { walkSpeed: 165, sprintSpeed: 275 },
    dino: {
      patrolSpeed: 68,
      investigateSpeed: 92,
      searchSpeed: 82,
      chaseSpeed: 148,
      sightDistance: 280,
      sniffDiscoveryTime: 20,
      hearingBase: 150,
      hearingPerLoudness: 220,
      occludedHearingMultiplier: 0.48,
    },
    battery: { durationSeconds: 85 },
  },
  normal: {
    label: "Normal",
    description: "Una experiencia equilibrada",
    player: {},
    dino: {},
    battery: {},
  },
  hard: {
    label: "Difícil",
    description: "Te detecta antes y la batería dura menos",
    player: { sprintSpeed: 250, staminaDrain: 38 },
    dino: {
      patrolSpeed: 96,
      investigateSpeed: 132,
      searchSpeed: 122,
      chaseSpeed: 205,
      sightDistance: 430,
      sniffDiscoveryTime: 7,
      hearingBase: 215,
      hearingPerLoudness: 290,
      occludedHearingMultiplier: 0.7,
    },
    battery: { durationSeconds: 42 },
  },
};

export const GAME_CONFIG = {
  ...BALANCE_BASE,
  player: { ...BALANCE_BASE.player },
  dino: { ...BALANCE_BASE.dino },
  battery: { ...BALANCE_BASE.battery },
  noise: { ...BALANCE_BASE.noise },
};

export let currentDifficulty = "normal";

// Mantiene los objetos de configuración compartidos actualizados en cada módulo.
export function setDifficulty(difficulty) {
  const settings = DIFFICULTIES[difficulty];
  if (!settings) {
    throw new RangeError(`Dificultad desconocida: ${difficulty}`);
  }

  currentDifficulty = difficulty;
  for (const category of ["player", "dino", "battery"]) {
    Object.assign(GAME_CONFIG[category], BALANCE_BASE[category], settings[category]);
  }
  Object.assign(GAME_CONFIG.noise, BALANCE_BASE.noise);
}
