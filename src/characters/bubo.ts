import type {
  BrowDrawParams,
  CharacterDefinition,
  DrawContext,
  EyeDrawParams,
  MouthDrawParams,
  NoseDrawParams,
} from "../character.js";
import { clamp } from "../drawUtils.js";
import { eye, type FaceStateDefinition, pose } from "../stateDefinitions.js";
import { STYLE_PRESETS } from "../styles.js";
import type { EmotionName, ReplaceActionName, StyleDefinition, ThemeDefinition } from "../types.js";

const BUBO_BEAK_FILL = "#ffc247";
const BUBO_BEAK_GLOW = "rgba(255, 194, 71, 0.56)";

type EyeGeometry = {
  sizeScale: number;
  horizontalWidthScale: number;
  horizontalHeightScale: number;
  verticalWidthScale: number;
  verticalHeightScale: number;
  radiusScale: number;
  diagonalXScale: number;
  diagonalYScale: number;
};

type BeakGeometry = {
  topWidthScale: number;
  topHeightScale: number;
  bottomWidthScale: number;
  bottomHeightScale: number;
};

type MiddleBarGeometry = {
  widthScale: number;
  heightScale: number;
};

type BuboStateConfig = {
  eyeOpenness: number;
  eyeSquint: number;
  eyeTilt: number;
  eyeBrightness: number;
  beakScale: number;
  beakBrightness: number;
  middleBarOpenness: number;
  middleBarWidth: number;
  glow: number;
  bob: number;
  flicker: number;
  scanline: number;
  durationMs: number;
  ease: FaceStateDefinition["ease"];
  microBob: number;
  microBobHz: number;
  microSway: number;
  blinkMinMs: number;
  blinkMaxMs: number;
  blinkDurationMs: number;
  jitter?: number;
  distortion?: number;
};

const buboStyle: StyleDefinition = {
  ...STYLE_PRESETS.industrial,
  eyeWidth: 0.314,
  eyeHeight: 0.314,
  eyeY: -0.086,
  eyeGap: 0.162,
  browWidth: 0.14,
  browHeight: 0.012,
  browY: -0.208,
  noseWidth: 0.172,
  noseHeight: 0.094,
  noseY: 0.148,
  mouthWidth: 0.172,
  mouthHeight: 0.052,
  mouthY: 0.184,
  glowScale: 0.052,
};

function fillCenteredRect(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  width: number,
  height: number,
): void {
  ctx.fillRect(centerX - width * 0.5, centerY - height * 0.5, width, height);
}

function lerp(from: number, to: number, t: number): number {
  return from + (to - from) * t;
}

function resolveEyeGeometry(shape: EyeDrawParams["parts"]["eyeShape"]): EyeGeometry {
  switch (shape) {
    case "wide":
      return {
        sizeScale: 1.04,
        horizontalWidthScale: 0.2,
        horizontalHeightScale: 0.09,
        verticalWidthScale: 0.08,
        verticalHeightScale: 0.2,
        radiusScale: 0.37,
        diagonalXScale: 0.29,
        diagonalYScale: 0.25,
      };
    case "sharp":
      return {
        sizeScale: 1.02,
        horizontalWidthScale: 0.18,
        horizontalHeightScale: 0.08,
        verticalWidthScale: 0.08,
        verticalHeightScale: 0.19,
        radiusScale: 0.37,
        diagonalXScale: 0.31,
        diagonalYScale: 0.24,
      };
    case "sleepy":
      return {
        sizeScale: 0.98,
        horizontalWidthScale: 0.2,
        horizontalHeightScale: 0.08,
        verticalWidthScale: 0.08,
        verticalHeightScale: 0.16,
        radiusScale: 0.34,
        diagonalXScale: 0.28,
        diagonalYScale: 0.2,
      };
    case "droplet":
      return {
        sizeScale: 1,
        horizontalWidthScale: 0.18,
        horizontalHeightScale: 0.09,
        verticalWidthScale: 0.08,
        verticalHeightScale: 0.18,
        radiusScale: 0.37,
        diagonalXScale: 0.26,
        diagonalYScale: 0.28,
      };
    case "block":
      return {
        sizeScale: 1.02,
        horizontalWidthScale: 0.19,
        horizontalHeightScale: 0.09,
        verticalWidthScale: 0.08,
        verticalHeightScale: 0.19,
        radiusScale: 0.36,
        diagonalXScale: 0.28,
        diagonalYScale: 0.26,
      };
    default:
      return {
        sizeScale: 1,
        horizontalWidthScale: 0.18,
        horizontalHeightScale: 0.08,
        verticalWidthScale: 0.08,
        verticalHeightScale: 0.18,
        radiusScale: 0.36,
        diagonalXScale: 0.27,
        diagonalYScale: 0.26,
      };
  }
}

function resolveBeakGeometry(shape: NoseDrawParams["parts"]["noseShape"]): BeakGeometry {
  switch (shape) {
    case "pointed":
      return {
        topWidthScale: 0.86,
        topHeightScale: 0.17,
        bottomWidthScale: 0.24,
        bottomHeightScale: 0.11,
      };
    case "button":
      return {
        topWidthScale: 0.82,
        topHeightScale: 0.22,
        bottomWidthScale: 0.3,
        bottomHeightScale: 0.16,
      };
    case "gem":
      return {
        topWidthScale: 0.94,
        topHeightScale: 0.18,
        bottomWidthScale: 0.26,
        bottomHeightScale: 0.13,
      };
    default:
      return {
        topWidthScale: 1,
        topHeightScale: 0.18,
        bottomWidthScale: 0.22,
        bottomHeightScale: 0.12,
      };
  }
}

function resolveMiddleBarGeometry(
  shape: MouthDrawParams["parts"]["mouthShape"],
): MiddleBarGeometry {
  switch (shape) {
    case "band":
      return {
        widthScale: 0.62,
        heightScale: 0.22,
      };
    case "block":
      return {
        widthScale: 0.5,
        heightScale: 0.32,
      };
    default:
      return {
        widthScale: 0.56,
        heightScale: 0.26,
      };
  }
}

function createBuboState(config: BuboStateConfig): FaceStateDefinition {
  return {
    pose: pose(
      eye(config.eyeOpenness, config.eyeSquint, config.eyeTilt, 0, 0, config.eyeBrightness),
      eye(config.eyeOpenness, config.eyeSquint, -config.eyeTilt, 0, 0, config.eyeBrightness),
      { scale: config.beakScale, tilt: 0, brightness: config.beakBrightness },
      {
        openness: config.middleBarOpenness,
        curvature: 0,
        width: config.middleBarWidth,
        tilt: 0,
        brightness: config.beakBrightness,
      },
      {
        glow: config.glow,
        bob: config.bob,
        jitter: config.jitter ?? 0,
        distortion: config.distortion ?? 0,
        flicker: config.flicker,
        scanline: config.scanline,
      },
    ),
    durationMs: config.durationMs,
    ease: config.ease,
    microBob: config.microBob,
    microBobHz: config.microBobHz,
    microSway: config.microSway,
    blinkMinMs: config.blinkMinMs,
    blinkMaxMs: config.blinkMaxMs,
    blinkDurationMs: config.blinkDurationMs,
  };
}

function applySegmentStyle(
  ctx: CanvasRenderingContext2D,
  fill: string,
  glow: string,
  brightness: number,
  blur: number,
): void {
  ctx.fillStyle = fill;
  ctx.shadowColor = glow;
  ctx.shadowBlur = blur;
  ctx.globalAlpha *= brightness;
}

function resolveEyeFill(theme: ThemeDefinition): string {
  return theme.foreground;
}

const buboEmotions: Partial<Record<EmotionName, FaceStateDefinition>> = {
  neutral: createBuboState({
    eyeOpenness: 0.88,
    eyeSquint: 0.06,
    eyeTilt: 0.02,
    eyeBrightness: 1.08,
    beakScale: 1,
    beakBrightness: 1,
    middleBarOpenness: 0.12,
    middleBarWidth: 0.88,
    glow: 1.08,
    bob: 0.008,
    flicker: 0.014,
    scanline: 0.16,
    durationMs: 240,
    ease: "smooth",
    microBob: 0.008,
    microBobHz: 0.72,
    microSway: 0.018,
    blinkMinMs: 3400,
    blinkMaxMs: 6200,
    blinkDurationMs: 170,
  }),
  happy: createBuboState({
    eyeOpenness: 0.78,
    eyeSquint: 0.16,
    eyeTilt: 0.04,
    eyeBrightness: 1.16,
    beakScale: 1.02,
    beakBrightness: 1.08,
    middleBarOpenness: 0.24,
    middleBarWidth: 0.96,
    glow: 1.18,
    bob: 0.016,
    flicker: 0.022,
    scanline: 0.12,
    durationMs: 220,
    ease: "smooth",
    microBob: 0.014,
    microBobHz: 1.4,
    microSway: 0.026,
    blinkMinMs: 3800,
    blinkMaxMs: 7200,
    blinkDurationMs: 160,
  }),
  love: createBuboState({
    eyeOpenness: 0.72,
    eyeSquint: 0.18,
    eyeTilt: 0,
    eyeBrightness: 1.18,
    beakScale: 1.01,
    beakBrightness: 1.06,
    middleBarOpenness: 0.2,
    middleBarWidth: 0.8,
    glow: 1.2,
    bob: 0.014,
    flicker: 0.018,
    scanline: 0.11,
    durationMs: 240,
    ease: "smooth",
    microBob: 0.014,
    microBobHz: 1.15,
    microSway: 0.022,
    blinkMinMs: 4200,
    blinkMaxMs: 7600,
    blinkDurationMs: 170,
  }),
  sad: createBuboState({
    eyeOpenness: 0.48,
    eyeSquint: 0.22,
    eyeTilt: 0.08,
    eyeBrightness: 0.72,
    beakScale: 0.94,
    beakBrightness: 0.8,
    middleBarOpenness: 0.1,
    middleBarWidth: 0.74,
    glow: 0.74,
    bob: 0.005,
    flicker: 0.008,
    scanline: 0.2,
    durationMs: 360,
    ease: "gentle",
    microBob: 0.005,
    microBobHz: 0.4,
    microSway: 0.014,
    blinkMinMs: 2400,
    blinkMaxMs: 4200,
    blinkDurationMs: 240,
  }),
  angry: createBuboState({
    eyeOpenness: 0.52,
    eyeSquint: 0.58,
    eyeTilt: 0.26,
    eyeBrightness: 1.14,
    beakScale: 1.02,
    beakBrightness: 1.1,
    middleBarOpenness: 0.06,
    middleBarWidth: 0.9,
    glow: 1.16,
    bob: 0.01,
    flicker: 0.08,
    scanline: 0.18,
    durationMs: 180,
    ease: "snap",
    microBob: 0.009,
    microBobHz: 1.9,
    microSway: 0.03,
    blinkMinMs: 5000,
    blinkMaxMs: 7600,
    blinkDurationMs: 130,
    jitter: 0.003,
    distortion: 0.16,
  }),
  surprised: createBuboState({
    eyeOpenness: 1,
    eyeSquint: 0,
    eyeTilt: 0,
    eyeBrightness: 1.22,
    beakScale: 1.08,
    beakBrightness: 1.14,
    middleBarOpenness: 0.82,
    middleBarWidth: 0.62,
    glow: 1.24,
    bob: 0.014,
    flicker: 0.024,
    scanline: 0.08,
    durationMs: 150,
    ease: "snap",
    microBob: 0.014,
    microBobHz: 1.35,
    microSway: 0.018,
    blinkMinMs: 9000,
    blinkMaxMs: 16000,
    blinkDurationMs: 130,
  }),
  confused: createBuboState({
    eyeOpenness: 0.68,
    eyeSquint: 0.22,
    eyeTilt: 0.1,
    eyeBrightness: 0.96,
    beakScale: 0.98,
    beakBrightness: 0.92,
    middleBarOpenness: 0.18,
    middleBarWidth: 0.78,
    glow: 0.98,
    bob: 0.01,
    flicker: 0.016,
    scanline: 0.16,
    durationMs: 260,
    ease: "smooth",
    microBob: 0.008,
    microBobHz: 0.9,
    microSway: 0.022,
    blinkMinMs: 3200,
    blinkMaxMs: 5400,
    blinkDurationMs: 180,
  }),
  excited: createBuboState({
    eyeOpenness: 0.98,
    eyeSquint: 0.04,
    eyeTilt: 0.02,
    eyeBrightness: 1.26,
    beakScale: 1.05,
    beakBrightness: 1.14,
    middleBarOpenness: 0.38,
    middleBarWidth: 1,
    glow: 1.3,
    bob: 0.02,
    flicker: 0.028,
    scanline: 0.1,
    durationMs: 160,
    ease: "snap",
    microBob: 0.018,
    microBobHz: 2.2,
    microSway: 0.032,
    blinkMinMs: 4200,
    blinkMaxMs: 7600,
    blinkDurationMs: 150,
    jitter: 0.001,
  }),
};

const buboActions: Partial<Record<ReplaceActionName, FaceStateDefinition>> = {
  thinking: createBuboState({
    eyeOpenness: 0.74,
    eyeSquint: 0.16,
    eyeTilt: 0.12,
    eyeBrightness: 0.96,
    beakScale: 0.96,
    beakBrightness: 0.9,
    middleBarOpenness: 0.08,
    middleBarWidth: 0.74,
    glow: 0.92,
    bob: 0.007,
    flicker: 0.012,
    scanline: 0.16,
    durationMs: 320,
    ease: "gentle",
    microBob: 0.006,
    microBobHz: 0.58,
    microSway: 0.022,
    blinkMinMs: 2600,
    blinkMaxMs: 4800,
    blinkDurationMs: 200,
  }),
  listening: createBuboState({
    eyeOpenness: 1,
    eyeSquint: 0,
    eyeTilt: 0.08,
    eyeBrightness: 1.18,
    beakScale: 1.02,
    beakBrightness: 1.04,
    middleBarOpenness: 0.1,
    middleBarWidth: 0.84,
    glow: 1.08,
    bob: 0.012,
    flicker: 0.015,
    scanline: 0.11,
    durationMs: 240,
    ease: "smooth",
    microBob: 0.009,
    microBobHz: 0.92,
    microSway: 0.022,
    blinkMinMs: 4200,
    blinkMaxMs: 6800,
    blinkDurationMs: 160,
  }),
  sleeping: createBuboState({
    eyeOpenness: 0.12,
    eyeSquint: 0.28,
    eyeTilt: 0.02,
    eyeBrightness: 0.54,
    beakScale: 0.84,
    beakBrightness: 0.58,
    middleBarOpenness: 0.04,
    middleBarWidth: 0.68,
    glow: 0.54,
    bob: 0.004,
    flicker: 0.004,
    scanline: 0.24,
    durationMs: 480,
    ease: "gentle",
    microBob: 0.004,
    microBobHz: 0.34,
    microSway: 0.012,
    blinkMinMs: 1800,
    blinkMaxMs: 3200,
    blinkDurationMs: 320,
  }),
  offline: createBuboState({
    eyeOpenness: 0.04,
    eyeSquint: 0.32,
    eyeTilt: 0,
    eyeBrightness: 0.2,
    beakScale: 0.72,
    beakBrightness: 0.28,
    middleBarOpenness: 0,
    middleBarWidth: 0.52,
    glow: 0.18,
    bob: 0,
    flicker: 0,
    scanline: 0.28,
    durationMs: 380,
    ease: "gentle",
    microBob: 0,
    microBobHz: 0.1,
    microSway: 0,
    blinkMinMs: 20000,
    blinkMaxMs: 30000,
    blinkDurationMs: 300,
  }),
};

function drawBuboEye(dc: DrawContext, params: EyeDrawParams): void {
  const { ctx, theme } = dc;
  const geometry = resolveEyeGeometry(params.parts.eyeShape);
  const sizeScale =
    (clamp(params.parts.eyeWidthScale, 0.65, 1.6) + clamp(params.parts.eyeHeightScale, 0.55, 1.6)) *
    0.5;
  const eyeDiameter = Math.min(params.width, params.height) * geometry.sizeScale * sizeScale;
  const blinkAmount = clamp(1 - params.pose.openness, 0, 1);
  const brightness = clamp(params.pose.brightness, 0.18, 1.8);
  const horizontalWidth = Math.max(8, eyeDiameter * geometry.horizontalWidthScale);
  const horizontalHeight = Math.max(5, eyeDiameter * geometry.horizontalHeightScale);
  const verticalWidth = Math.max(5, eyeDiameter * geometry.verticalWidthScale);
  const verticalHeight = Math.max(8, eyeDiameter * geometry.verticalHeightScale);
  const lineHeight = Math.max(4, horizontalHeight * 0.8);
  const radius = eyeDiameter * geometry.radiusScale;
  const diagonalX = eyeDiameter * geometry.diagonalXScale;
  const diagonalY = eyeDiameter * geometry.diagonalYScale;

  ctx.save();
  ctx.translate(params.centerX, params.centerY);
  ctx.rotate(params.pose.tilt * 0.4);
  applySegmentStyle(ctx, resolveEyeFill(theme), theme.glow, brightness, eyeDiameter * 0.3);

  if (blinkAmount >= 0.68 || params.pose.openness <= 0.24) {
    fillCenteredRect(ctx, 0, 0, eyeDiameter * 0.72, lineHeight);
    ctx.restore();
    return;
  }

  fillCenteredRect(ctx, 0, -radius, horizontalWidth * 1.05, horizontalHeight);
  fillCenteredRect(ctx, -diagonalX, -diagonalY, horizontalWidth, horizontalHeight);
  fillCenteredRect(ctx, diagonalX, -diagonalY, horizontalWidth, horizontalHeight);
  fillCenteredRect(ctx, -radius, 0, verticalWidth, verticalHeight);
  fillCenteredRect(ctx, radius, 0, verticalWidth, verticalHeight);
  fillCenteredRect(ctx, -diagonalX, diagonalY, horizontalWidth, horizontalHeight);
  fillCenteredRect(ctx, diagonalX, diagonalY, horizontalWidth, horizontalHeight);
  fillCenteredRect(ctx, 0, radius, horizontalWidth * 1.05, horizontalHeight);
  ctx.restore();
}

function drawBuboBrow(_dc: DrawContext, _params: BrowDrawParams): void {}

function drawBuboNose(dc: DrawContext, params: NoseDrawParams): void {
  const { ctx } = dc;
  const geometry = resolveBeakGeometry(params.parts.noseShape);
  const scale = clamp(params.pose.scale, 0.72, 1.28) * 0.86;
  const width = params.width * scale;
  const height = params.height * scale;
  const brightness = clamp(params.pose.brightness, 0.22, 1.5) * 0.9;
  const topWidth = width * geometry.topWidthScale;
  const topHeight = Math.max(7, height * Math.max(geometry.topHeightScale, 0.24));

  ctx.save();
  ctx.translate(params.centerX, params.centerY);
  ctx.rotate(params.pose.tilt * 0.18);
  applySegmentStyle(ctx, BUBO_BEAK_FILL, BUBO_BEAK_GLOW, brightness, width * 0.12);
  fillCenteredRect(ctx, 0, -height * 0.22, topWidth, topHeight);
  ctx.restore();
}

function drawBuboMouth(dc: DrawContext, params: MouthDrawParams): void {
  const { ctx } = dc;
  const beakGeometry = resolveBeakGeometry(params.parts.noseShape);
  const geometry = resolveMiddleBarGeometry(params.parts.mouthShape);
  const brightness = clamp(params.pose.brightness, 0.22, 1.5) * 0.92;
  const speech = clamp(Math.max(params.pose.openness, dc.speakingAmount * 0.92), 0, 1);
  const middleWidth =
    params.width * geometry.widthScale * clamp(params.pose.width, 0.84, 1.12) * 0.92;
  const middleHeight = Math.max(7, params.height * Math.max(geometry.heightScale, 0.32));
  const bottomWidth = params.width * beakGeometry.bottomWidthScale * 0.94;
  const bottomHeight = Math.max(
    7,
    params.height * Math.max(beakGeometry.bottomHeightScale * 1.15, 0.22),
  );
  const stackOffset = params.height * 0.3;
  const middleY = -stackOffset;
  const bottomBaseY = stackOffset;
  const openThreshold = 0.16;

  ctx.save();
  ctx.translate(params.centerX, params.centerY);
  applySegmentStyle(ctx, BUBO_BEAK_FILL, BUBO_BEAK_GLOW, brightness, middleWidth * 0.1);

  if (speech <= openThreshold) {
    fillCenteredRect(ctx, 0, middleY, middleWidth, middleHeight);
  } else {
    const t = clamp((speech - openThreshold) / (1 - openThreshold), 0, 1);
    const verticalWidth = Math.max(5, middleWidth * lerp(0.16, 0.12, t));
    const verticalHeight = Math.max(8, params.height * lerp(0.62, 0.9, t));
    const verticalGap = middleWidth * lerp(0.34, 0.4, t);
    const verticalY = lerp(middleY + verticalHeight * 0.12, 0, 0.18 + t * 0.14);

    fillCenteredRect(ctx, -verticalGap, verticalY, verticalWidth, verticalHeight);
    fillCenteredRect(ctx, verticalGap, verticalY, verticalWidth, verticalHeight);
  }

  const bottomTravel =
    speech <= openThreshold
      ? 0
      : params.height * lerp(0, 0.34, (speech - openThreshold) / (1 - openThreshold));
  fillCenteredRect(ctx, 0, bottomBaseY + bottomTravel, bottomWidth, bottomHeight);
  ctx.restore();
}

export const buboCharacter: CharacterDefinition = {
  name: "bubo",

  partOptions: {
    eyeShape: ["block", "soft", "wide", "sharp", "sleepy", "droplet"],
    noseShape: ["bridge", "gem", "pointed", "button"],
    mouthShape: ["soft", "band", "block"],
    browShape: ["soft"],
  },

  defaultParts: {
    eyeShape: "soft",
    eyeWidthScale: 1,
    eyeHeightScale: 1,
    noseShape: "bridge",
    mouthShape: "soft",
    browShape: "soft",
    scanlineThickness: 1.8,
    scanlineSpacing: 4,
  },

  defaultStyle: buboStyle,
  defaultFeatures: {
    brows: false,
    pupils: false,
  },

  emotions: buboEmotions,
  actions: buboActions,

  drawEye: drawBuboEye,
  drawBrow: drawBuboBrow,
  drawNose: drawBuboNose,
  drawMouth: drawBuboMouth,
};
