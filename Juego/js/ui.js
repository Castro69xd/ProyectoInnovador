import { DIFFICULTIES } from "./config.js";

// El menú comparte la misma geometría para dibujar botones y detectar clics.
const DIFFICULTY_KEYS = Object.keys(DIFFICULTIES);

export class UI {
  drawTitle(context, width, height, selectedDifficulty) {
    const layout = this.getTitleLayout(width, height);
    const { scale, top, centerX, buttonWidth, buttonGap, buttonTop, startTop } =
      layout;

    context.fillStyle = "rgba(0, 0, 0, 0.9)";
    context.fillRect(0, 0, width, height);
    context.textAlign = "center";
    context.fillStyle = "#c6b77d";
    context.font = `bold ${Math.round(36 * scale)}px sans-serif`;
    context.fillText("LA CASA DEL DEPREDADOR", centerX, top + 42 * scale);

    context.fillStyle = "#d0cbb8";
    context.font = `${Math.round(14 * scale)}px sans-serif`;
    context.fillText(
      "Reúne la llave del sótano, el fusible y la llave principal para escapar.",
      centerX,
      top + 69 * scale,
      width - 36,
    );

    context.fillStyle = "#c6b77d";
    context.font = `bold ${Math.round(15 * scale)}px sans-serif`;
    context.fillText("CONTROLES", centerX, top + 111 * scale);
    context.fillStyle = "#d0cbb8";
    context.font = `${Math.round(13 * scale)}px sans-serif`;
    context.fillText(
      "WASD: moverte  ·  Mouse: apuntar linterna  ·  SHIFT: caminar en silencio",
      centerX,
      top + 135 * scale,
      width - 32,
    );
    context.fillText(
      "CTRL: correr  ·  E: esconderte/usar puertas  ·  F: lanzar un objeto",
      centerX,
      top + 157 * scale,
      width - 32,
    );

    context.fillStyle = "#c6b77d";
    context.font = `bold ${Math.round(15 * scale)}px sans-serif`;
    context.fillText("ELIGE LA DIFICULTAD", centerX, top + 203 * scale);

    const totalWidth = buttonWidth * 3 + buttonGap * 2;
    const firstButtonX = centerX - totalWidth / 2;
    for (let index = 0; index < DIFFICULTY_KEYS.length; index += 1) {
      const key = DIFFICULTY_KEYS[index];
      const difficulty = DIFFICULTIES[key];
      const x = firstButtonX + index * (buttonWidth + buttonGap);
      const selected = key === selectedDifficulty;

      context.fillStyle = selected ? "#66583a" : "#242321";
      context.fillRect(x, buttonTop, buttonWidth, 34 * scale);
      context.strokeStyle = selected ? "#d5c581" : "#615c4d";
      context.lineWidth = Math.max(1, scale);
      context.strokeRect(x, buttonTop, buttonWidth, 34 * scale);
      context.fillStyle = selected ? "#fff1bd" : "#d0cbb8";
      context.font = `bold ${Math.round(14 * scale)}px sans-serif`;
      context.fillText(
        `${index + 1}. ${difficulty.label}`,
        x + buttonWidth / 2,
        buttonTop + 22 * scale,
      );
    }

    context.fillStyle = "#aaa48e";
    context.font = `${Math.round(11 * scale)}px sans-serif`;
    context.fillText(
      DIFFICULTIES[selectedDifficulty].description,
      centerX,
      buttonTop + 50 * scale,
      width - 32,
    );

    context.fillStyle = "#c6b77d";
    context.fillRect(
      centerX - 118 * scale,
      startTop,
      236 * scale,
      38 * scale,
    );
    context.fillStyle = "#15130f";
    context.font = `bold ${Math.round(15 * scale)}px sans-serif`;
    context.fillText("EMPEZAR · ENTER", centerX, startTop + 24 * scale);
    context.textAlign = "start";
  }

  getTitleAction(x, y, width, height) {
    const layout = this.getTitleLayout(width, height);
    const { centerX, buttonWidth, buttonGap, buttonTop, startTop } = layout;
    const totalWidth = buttonWidth * 3 + buttonGap * 2;
    const firstButtonX = centerX - totalWidth / 2;

    if (y >= buttonTop && y <= buttonTop + 34 * layout.scale) {
      for (let index = 0; index < DIFFICULTY_KEYS.length; index += 1) {
        const left = firstButtonX + index * (buttonWidth + buttonGap);
        if (x >= left && x <= left + buttonWidth) {
          return { type: "difficulty", difficulty: DIFFICULTY_KEYS[index] };
        }
      }
    }

    if (
      x >= centerX - 118 * layout.scale &&
      x <= centerX + 118 * layout.scale &&
      y >= startTop &&
      y <= startTop + 38 * layout.scale
    ) {
      return { type: "start" };
    }
    return null;
  }

  getTitleLayout(width, height) {
    const scale = Math.min(1, Math.max(0.5, (height - 24) / 360));
    const buttonWidth = Math.min(146 * scale, (width - 44) / 3);
    const buttonGap = Math.max(4, 10 * scale);
    return {
      scale,
      top: Math.max(12, (height - 360 * scale) / 2),
      centerX: width / 2,
      buttonWidth,
      buttonGap,
      buttonTop: Math.max(12, (height - 360 * scale) / 2) + 216 * scale,
      startTop: Math.max(12, (height - 360 * scale) / 2) + 286 * scale,
    };
  }
}
