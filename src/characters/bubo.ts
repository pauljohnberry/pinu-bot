import type {
  BrowDrawParams,
  CharacterDefinition,
  DrawContext,
  EyeDrawParams,
  MouthDrawParams,
  NoseDrawParams,
} from "../character.js";
import { clamp, drawPixelGlyph, ease, HEART_PATTERN, roundedRect } from "../drawUtils.js";
import { eye, type FaceStateDefinition, pose } from "../stateDefinitions.js";
import { STYLE_PRESETS } from "../styles.js";
import type { EmotionName, FacePose, ReplaceActionName, StyleDefinition, ThemeDefinition } from "../types.js";

const BUBO_BEAK_FILL = "#ffc247";
const BUBO_BEAK_GLOW = "rgba(255, 194, 71, 0.56)";
const BUBO_IRIS_FILL = "#ffcf5a";
const BUBO_IRIS_GLOW = "rgba(255, 207, 90, 0.42)";
const BUBO_PUPIL_FILL = "#140f18";
const BUBO_PUPIL_SHINE = "rgba(255, 248, 224, 0.92)";

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
  mouthCurvature?: number;
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
  eyeWidth: 0.382,
  eyeHeight: 0.382,
  eyeY: -0.044,
  eyeGap: 0.126,
  browWidth: 0.18,
  browHeight: 0.016,
  browY: -0.2,
  noseWidth: 0.13,
  noseHeight: 0.094,
  noseY: 0.096,
  mouthWidth: 0.13,
  mouthHeight: 0.052,
  mouthY: 0.132,
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

function fillRoundedSegment(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  width: number,
  height: number,
  rotation = 0,
): void {
  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.rotate(rotation);
  roundedRect(ctx, -width * 0.5, -height * 0.5, width, height, Math.min(width, height) * 0.5);
  ctx.fill();
  ctx.restore();
}

function fillFeatherSegment(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  width: number,
  height: number,
  rotation = 0,
): void {
  const halfWidth = width * 0.5;
  const halfHeight = height * 0.5;

  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.rotate(rotation);
  ctx.beginPath();
  ctx.moveTo(-halfWidth, 0);
  ctx.bezierCurveTo(
    -width * 0.18,
    -halfHeight,
    width * 0.18,
    -halfHeight,
    halfWidth,
    0,
  );
  ctx.bezierCurveTo(
    width * 0.12,
    halfHeight,
    -width * 0.24,
    halfHeight,
    -halfWidth,
    0,
  );
  ctx.fill();
  ctx.restore();
}

function fillEllipse(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  radiusX: number,
  radiusY: number,
): void {
  traceEllipse(ctx, centerX, centerY, radiusX, radiusY);
  ctx.fill();
}

function traceEllipse(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  radiusX: number,
  radiusY: number,
): void {
  const kappa = 0.5522847498;
  const offsetX = radiusX * kappa;
  const offsetY = radiusY * kappa;

  ctx.beginPath();
  ctx.moveTo(centerX - radiusX, centerY);
  ctx.bezierCurveTo(
    centerX - radiusX,
    centerY - offsetY,
    centerX - offsetX,
    centerY - radiusY,
    centerX,
    centerY - radiusY,
  );
  ctx.bezierCurveTo(
    centerX + offsetX,
    centerY - radiusY,
    centerX + radiusX,
    centerY - offsetY,
    centerX + radiusX,
    centerY,
  );
  ctx.bezierCurveTo(
    centerX + radiusX,
    centerY + offsetY,
    centerX + offsetX,
    centerY + radiusY,
    centerX,
    centerY + radiusY,
  );
  ctx.bezierCurveTo(
    centerX - offsetX,
    centerY + radiusY,
    centerX - radiusX,
    centerY + offsetY,
    centerX - radiusX,
    centerY,
  );
  ctx.closePath();
}

function traceBuboEyeDisc(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  radiusX: number,
  radiusY: number,
): void {
  const outerX = radiusX * 0.94;
  const upperY = radiusY * 0.98;
  const lowerY = radiusY * 0.92;

  ctx.beginPath();
  ctx.moveTo(centerX, centerY - upperY);
  ctx.bezierCurveTo(
    centerX + radiusX * 0.54,
    centerY - radiusY,
    centerX + outerX,
    centerY - radiusY * 0.72,
    centerX + outerX,
    centerY - radiusY * 0.06,
  );
  ctx.bezierCurveTo(
    centerX + outerX,
    centerY + radiusY * 0.44,
    centerX + radiusX * 0.58,
    centerY + lowerY,
    centerX,
    centerY + radiusY * 0.9,
  );
  ctx.bezierCurveTo(
    centerX - radiusX * 0.58,
    centerY + lowerY,
    centerX - outerX,
    centerY + radiusY * 0.44,
    centerX - outerX,
    centerY - radiusY * 0.06,
  );
  ctx.bezierCurveTo(
    centerX - outerX,
    centerY - radiusY * 0.72,
    centerX - radiusX * 0.54,
    centerY - radiusY,
    centerX,
    centerY - upperY,
  );
  ctx.closePath();
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
        curvature: config.mouthCurvature ?? 0,
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
    eyeOpenness: 0.82,
    eyeSquint: 0.06,
    eyeTilt: -0.35,
    eyeBrightness: 1.3,
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
    eyeOpenness: 0.4,
    eyeSquint: 0.26,
    eyeTilt: -0.24,
    eyeBrightness: 1.04,
    beakScale: 0.94,
    beakBrightness: 1,
    middleBarOpenness: 0.1,
    middleBarWidth: 0.74,
    mouthCurvature: -0.72,
    glow: 1.02,
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
    distortion: 0.018,
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
  confused: {
    pose: pose(
      // Same size eyes, both tilted together — owl head-cock
      eye(0.72, 0.16, -0.32, -0.04, 0.02, 0.96),
      eye(0.72, 0.16, -0.32, 0.04, -0.02, 0.96),
      { scale: 0.88, tilt: -0.4, brightness: 0.82 },
      { openness: 0.06, curvature: -0.38, width: 0.62, tilt: -0.42, brightness: 0.78 },
      { glow: 0.94, bob: 0.008, jitter: 0, distortion: 0, flicker: 0.022, scanline: 0.18 },
    ),
    durationMs: 320,
    ease: "smooth",
    microBob: 0.006,
    microBobHz: 0.6,
    microSway: 0.05,
    blinkMinMs: 2800,
    blinkMaxMs: 5000,
    blinkDurationMs: 190,
  },
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
  thinking: {
    pose: pose(
      // Eyes squashed vertically via squint — left brow raised
      eye(0.62, 0.7, -0.4, -0.06, -0.1, 0.9),
      eye(0.62, 0.7, 0.1, 0.06, -0.1, 0.9),
      { scale: 0.92, tilt: 0, brightness: 0.8 },
      { openness: 0.03, curvature: -0.1, width: 0.58, tilt: 0, brightness: 0.74 },
      { glow: 0.82, bob: 0.004, jitter: 0, distortion: 0, flicker: 0.012, scanline: 0.22 },
    ),
    durationMs: 340,
    ease: "gentle",
    microBob: 0.004,
    microBobHz: 0.4,
    microSway: 0.012,
    blinkMinMs: 3000,
    blinkMaxMs: 5400,
    blinkDurationMs: 240,
  },
  listening: {
    pose: pose(
      // Wide and alert, slight head cock — attentive owl
      eye(0.96, 0.02, -0.16, 0.06, -0.02, 1.22),
      eye(0.96, 0.02, -0.16, 0.06, -0.02, 1.22),
      { scale: 1.04, tilt: -0.18, brightness: 1.1 },
      { openness: 0.06, curvature: 0, width: 0.78, tilt: -0.2, brightness: 1.04 },
      { glow: 1.16, bob: 0.014, jitter: 0, distortion: 0, flicker: 0.008, scanline: 0.08 },
    ),
    durationMs: 220,
    ease: "smooth",
    microBob: 0.01,
    microBobHz: 1.1,
    microSway: 0.035,
    blinkMinMs: 5000,
    blinkMaxMs: 8200,
    blinkDurationMs: 140,
  },
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
  const reducedDetail = dc.emotionName === "angry";
  const geometry = resolveEyeGeometry(params.parts.eyeShape);
  const sizeScale =
    (clamp(params.parts.eyeWidthScale, 0.65, 1.6) + clamp(params.parts.eyeHeightScale, 0.55, 1.6)) *
    0.5;
  const eyeDiameter = Math.min(params.width, params.height) * geometry.sizeScale * sizeScale;
  const blinkAmount = clamp(1 - params.pose.openness, 0, 1);
  const brightness = clamp(params.pose.brightness, 0.18, 1.8);
  const squint = clamp(params.pose.squint, 0, 1);
  const horizontalWidth = Math.max(8, eyeDiameter * geometry.horizontalWidthScale);
  const horizontalHeight = Math.max(5, eyeDiameter * geometry.horizontalHeightScale);
  const verticalWidth = Math.max(5, eyeDiameter * geometry.verticalWidthScale);
  const verticalHeight = Math.max(8, eyeDiameter * geometry.verticalHeightScale);
  const lineHeight = Math.max(4, horizontalHeight * 0.8);
  const radius = eyeDiameter * geometry.radiusScale;
  const segmentHeight = Math.max(4, horizontalHeight * 0.72);
  const topWidth = horizontalWidth * 1.28;
  const sideWidth = verticalHeight * 0.76;
  const sideHeight = verticalWidth * 1.46;
  const diagonalWidth = horizontalWidth * 0.72;
  const diagonalHeight = segmentHeight * 0.72;
  const featherBias = lerp(0.12, 0.24, squint * 0.55 + (dc.emotionName === "angry" ? 0.16 : 0));
  const hoodWidth = topWidth * (1.12 + featherBias * 0.2);
  const hoodHeight = segmentHeight * (1.22 + featherBias * 0.3);
  const hoodY = -radius * (0.92 + featherBias * 0.05);
  const shoulderX = radius * 0.68;
  const shoulderY = -radius * (0.44 + featherBias * 0.06);
  const shoulderWidth = diagonalWidth * (0.92 + featherBias * 0.1);
  const shoulderHeight = diagonalHeight * (0.74 + featherBias * 0.06);
  const innerHookX = -params.side * radius * 0.48;
  const innerHookY = -radius * (0.24 + featherBias * 0.12);
  const innerHookWidth = diagonalWidth * (1 + featherBias * 0.12);
  const innerHookHeight = diagonalHeight * (0.84 + featherBias * 0.08);
  const outerWingX = params.side * radius * 1.02;
  const outerWingY = -radius * (0.68 + featherBias * 0.06);
  const outerWingWidth = diagonalWidth * (0.82 + featherBias * 0.08);
  const outerWingHeight = diagonalHeight * (0.5 + featherBias * 0.04);
  const sideSweepX = radius * 0.98;
  const sideSweepY = radius * 0.04;
  const sideSweepWidth = sideWidth * (1.02 - featherBias * 0.02);
  const sideSweepHeight = sideHeight * (1.18 - featherBias * 0.02);
  const cheekX = radius * 0.74;
  const cheekY = radius * (0.72 - featherBias * 0.06);
  const cheekWidth = diagonalWidth * (1 - featherBias * 0.04);
  const cheekHeight = diagonalHeight * (0.84 - featherBias * 0.04);
  const innerCheekX = -params.side * radius * 0.42;
  const innerCheekY = radius * (0.56 - featherBias * 0.04);
  const innerCheekWidth = diagonalWidth * (0.82 - featherBias * 0.04);
  const innerCheekHeight = diagonalHeight * (0.62 - featherBias * 0.04);
  const chinWidth = topWidth * (0.7 - featherBias * 0.04);
  const chinHeight = segmentHeight * (0.48 - featherBias * 0.04);
  const chinY = radius * (0.9 - featherBias * 0.04);
  const socketRadiusX = radius * 1.02;
  const socketRadiusY = radius * lerp(1.04, 0.9, blinkAmount) * lerp(1, 0.52, squint);
  const pupilScale = clamp(0.42 + params.pose.openness * 0.58, 0, 1);
  const pupilX = clamp(params.pose.pupilX, -1, 1) * radius * 0.34;
  const pupilY = clamp(params.pose.pupilY, -1, 1) * radius * 0.24;
  // Love: pupils dilate gradually over ~600ms, settling at 1.3x
  const isLove = dc.emotionName === "love";
  const loveElapsed = isLove ? clamp((dc.elapsed - dc.emotionFromTime) / 600, 0, 1) : 0;
  const loveDilate = 1 + loveElapsed * 0.3;
  const irisRadiusX = Math.max(6, eyeDiameter * 0.19 * loveDilate) * pupilScale;
  const irisRadiusY = irisRadiusX * lerp(0.96, 0.72, blinkAmount);
  const pupilRadiusX = irisRadiusX * 0.48;
  const pupilRadiusY = irisRadiusY * 0.52;

  const squishY = lerp(1, 0.55, squint);

  ctx.save();
  ctx.translate(params.centerX, params.centerY);
  ctx.rotate(params.pose.tilt * 0.4);
  ctx.scale(1, squishY);
  applySegmentStyle(ctx, resolveEyeFill(theme), theme.glow, brightness, eyeDiameter * (reducedDetail ? 0.2 : 0.26));

  if (blinkAmount >= 0.68 || params.pose.openness <= 0.24) {
    fillRoundedSegment(ctx, 0, 0, eyeDiameter * 0.72, lineHeight);
    ctx.restore();
    return;
  }

  ctx.save();
  ctx.globalAlpha *= reducedDetail ? 0.08 : 0.1;
  ctx.shadowBlur = eyeDiameter * (reducedDetail ? 0.04 : 0.06);
  traceBuboEyeDisc(ctx, 0, 0, socketRadiusX, socketRadiusY);
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.globalAlpha *= 0.35;
  fillRoundedSegment(ctx, 0, hoodY, hoodWidth, hoodHeight);
  ctx.restore();

  ctx.save();
  ctx.globalAlpha *= 0.54;
  fillFeatherSegment(ctx, -shoulderX, shoulderY, shoulderWidth, shoulderHeight, -0.5);
  fillFeatherSegment(ctx, shoulderX, shoulderY, shoulderWidth, shoulderHeight, 0.5);
  ctx.restore();

  ctx.save();
  ctx.globalAlpha *= 0.28;
  fillFeatherSegment(ctx, innerHookX, innerHookY, innerHookWidth, innerHookHeight, params.side * 0.74);
  if (!reducedDetail) {
    fillFeatherSegment(ctx, outerWingX, outerWingY, outerWingWidth, outerWingHeight, params.side * 0.28);
  }
  ctx.restore();

  ctx.save();
  ctx.globalAlpha *= 0.18;
  fillFeatherSegment(ctx, -sideSweepX, sideSweepY, sideSweepWidth, sideSweepHeight, -0.18);
  fillFeatherSegment(ctx, sideSweepX, sideSweepY, sideSweepWidth, sideSweepHeight, 0.18);
  ctx.restore();

  ctx.save();
  ctx.globalAlpha *= 0.48;
  fillFeatherSegment(ctx, -cheekX, cheekY, cheekWidth, cheekHeight, 0.66);
  fillFeatherSegment(ctx, cheekX, cheekY, cheekWidth, cheekHeight, -0.66);
  ctx.restore();

  if (!reducedDetail) {
    ctx.save();
    ctx.globalAlpha *= 0.28;
    fillFeatherSegment(ctx, innerCheekX, innerCheekY, innerCheekWidth, innerCheekHeight, -params.side * 0.34);
    ctx.restore();

    ctx.save();
    ctx.globalAlpha *= 0.26;
    fillRoundedSegment(ctx, 0, chinY, chinWidth, chinHeight);
    ctx.restore();
  }

  if (params.features.pupils && pupilScale > 0.16) {
    ctx.save();
    ctx.shadowColor = BUBO_IRIS_GLOW;
    ctx.shadowBlur = eyeDiameter * (reducedDetail ? 0.1 : 0.16);
    ctx.fillStyle = BUBO_IRIS_FILL;
    fillEllipse(ctx, pupilX, pupilY, irisRadiusX, irisRadiusY);

    ctx.shadowBlur = 0;
    ctx.fillStyle = BUBO_PUPIL_FILL;
    fillEllipse(ctx, pupilX, pupilY, pupilRadiusX, pupilRadiusY);

    if (!reducedDetail) {
      ctx.fillStyle = BUBO_PUPIL_SHINE;
      fillEllipse(
        ctx,
        pupilX - irisRadiusX * 0.28,
        pupilY - irisRadiusY * 0.3,
        Math.max(2, irisRadiusX * 0.18),
        Math.max(2, irisRadiusY * 0.16),
      );

      // Glassy second highlight during love — larger, softer
      if (isLove && loveElapsed > 0.2) {
        ctx.globalAlpha *= clamp((loveElapsed - 0.2) / 0.4, 0, 1) * 0.5;
        ctx.fillStyle = "rgba(255, 252, 240, 0.7)";
        fillEllipse(
          ctx,
          pupilX + irisRadiusX * 0.18,
          pupilY + irisRadiusY * 0.14,
          Math.max(1.5, irisRadiusX * 0.12),
          Math.max(1.5, irisRadiusY * 0.1),
        );
      }
    }
    ctx.restore();
  }

  ctx.restore();
}

function drawBuboBrow(dc: DrawContext, params: BrowDrawParams): void {
  const { ctx, theme } = dc;
  const s = params.side; // -1 left, 1 right
  const w = params.width;
  const squint = clamp(params.pose.squint, 0, 1);
  const brightness = clamp(params.pose.brightness, 0.18, 1.4);
  const angryT = dc.emotionName === "angry" ? 1 : 0;
  const sadT = dc.emotionName === "sad" ? 1 : 0;

  ctx.save();
  ctx.translate(params.centerX, params.centerY);
  ctx.rotate(params.pose.tilt * 0.7);
  ctx.globalAlpha *= brightness * 0.92;
  ctx.strokeStyle = resolveEyeFill(theme);
  ctx.shadowColor = theme.glow;
  ctx.shadowBlur = w * 0.06;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  // Owl brows: a fan of feather-strokes radiating from an inner anchor point
  // near the nose bridge. Inner strokes angle down (forming the V), middle
  // strokes go horizontal, outer strokes sweep upward (ear-tuft feel).

  // Anchor — the hub all feathers radiate from, pulled well inward toward nose
  const anchorX = s * w * -0.4;
  const anchorY = w * (0.08 + angryT * 0.06 - sadT * 0.03);

  // Each feather: [tipX, tipY, ctrlX, ctrlY, width, opacity]
  // Defined as multipliers of w, relative to anchor
  const baseAlpha = ctx.globalAlpha;
  const feathers: [number, number, number, number, number, number][] = [
    // Feather 0 — inner V stroke: angles steeply down toward nose bridge
    [
      s * -0.44,
      0.28 + angryT * 0.1,
      s * -0.4,
      0.18 + angryT * 0.06,
      0.09 + angryT * 0.03,
      0.55,
    ],
    // Feather 1 — lower-mid: angles slightly outward and down
    [
      s * 0.18,
      0.1 + angryT * 0.08 - sadT * 0.04,
      s * -0.08,
      0.1 + angryT * 0.04,
      0.1 + angryT * 0.02,
      0.7,
    ],
    // Feather 2 — main brow: the dominant stroke, full brightness
    [
      s * 0.88,
      -0.04 - angryT * 0.02 + sadT * 0.03 - squint * 0.02,
      s * 0.52,
      0.0 + angryT * 0.02 + sadT * 0.01,
      0.13 + angryT * 0.04,
      1.0,
    ],
    // Feather 3 — upper sweep: arcs upward and outward
    [
      s * (1.02 + angryT * 0.06),
      -(0.14 + angryT * 0.06 - sadT * 0.03 + squint * 0.02),
      s * 0.64,
      -(0.06 + angryT * 0.02),
      0.08 + angryT * 0.02,
      0.6,
    ],
    // Feather 4 — ear tuft: thinnest, most ghostly
    [
      s * (1.1 + angryT * 0.08),
      -(0.24 + angryT * 0.1 - sadT * 0.04 + squint * 0.03),
      s * 0.76,
      -(0.14 + angryT * 0.04),
      0.05,
      0.38,
    ],
  ];

  for (const [tipX, tipY, ctrlX, ctrlY, lineW, opacity] of feathers) {
    ctx.globalAlpha = baseAlpha * opacity;
    ctx.lineWidth = Math.max(1.5, w * lineW);
    ctx.beginPath();
    ctx.moveTo(anchorX, anchorY);
    ctx.quadraticCurveTo(w * ctrlX, w * ctrlY, w * tipX, w * tipY);
    ctx.stroke();
  }

  ctx.restore();
}

function drawSolidCurvedBar(
  ctx: CanvasRenderingContext2D,
  centerY: number,
  totalWidth: number,
  barHeight: number,
  curveHeight: number,
): void {
  const halfWidth = totalWidth * 0.5;

  ctx.save();
  ctx.strokeStyle = typeof ctx.fillStyle === "string" ? ctx.fillStyle : BUBO_BEAK_FILL;
  ctx.lineWidth = barHeight;
  ctx.lineCap = "square";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(-halfWidth, centerY);
  ctx.quadraticCurveTo(0, centerY + curveHeight, halfWidth, centerY);
  ctx.stroke();
  ctx.restore();
}

function drawBuboNose(dc: DrawContext, params: NoseDrawParams): void {
  const { ctx } = dc;
  const geometry = resolveBeakGeometry(params.parts.noseShape);
  const scale = clamp(params.pose.scale, 0.72, 1.28) * 0.76;
  const width = params.width * scale;
  const height = params.height * scale;
  const curvature = clamp(params.mouthPose?.curvature ?? 0, -1, 1);
  const smileT = Math.max(0, curvature);
  const frownT = Math.max(0, -curvature);
  const expressionT = Math.max(smileT, frownT);
  const brightness = clamp(params.pose.brightness, 0.22, 1.5) * 0.9;
  const topWidth = width * geometry.topWidthScale * lerp(0.9, 0.86, expressionT);
  const topHeight = Math.max(7, height * Math.max(geometry.topHeightScale, 0.24));
  const topY = -height * 0.12 + height * (0.04 * smileT - 0.06 * frownT);
  const topCurve = height * 0.2 * curvature;

  ctx.save();
  ctx.translate(params.centerX, params.centerY);
  ctx.rotate(params.pose.tilt * 0.18);
  applySegmentStyle(ctx, BUBO_BEAK_FILL, BUBO_BEAK_GLOW, brightness, width * 0.12);
  drawSolidCurvedBar(ctx, topY, topWidth, topHeight, topCurve);
  ctx.restore();
}

function drawBuboMouth(dc: DrawContext, params: MouthDrawParams): void {
  const { ctx } = dc;
  const beakGeometry = resolveBeakGeometry(params.parts.noseShape);
  const geometry = resolveMiddleBarGeometry(params.parts.mouthShape);
  const speech = clamp(Math.max(params.pose.openness, dc.speakingAmount * 0.92), 0, 1);
  const curvature = clamp(params.pose.curvature, -1, 1);
  const smileT = Math.max(0, curvature);
  const frownT = Math.max(0, -curvature);
  const poutT = clamp((0.72 - params.pose.width) / 0.32, 0, 1);
  const brightness =
    clamp(params.pose.brightness, 0.22, 1.5) * 0.92 * lerp(1, 1.06, smileT) * lerp(1, 0.94, frownT);

  const middleWidth =
    params.width *
    geometry.widthScale *
    clamp(params.pose.width, 0.38, 1.12) *
    lerp(0.98, 0.82, smileT) *
    lerp(1, 0.94, frownT) *
    0.76;
  const middleHeight =
    Math.max(7, params.height * Math.max(geometry.heightScale, 0.32)) *
    lerp(1, 1.18, poutT) *
    lerp(1, 0.94, smileT);
  const bottomWidth =
    params.width *
    beakGeometry.bottomWidthScale *
    0.78 *
    lerp(1, 1.2, smileT) *
    lerp(1, 0.76, frownT) *
    lerp(1, 1.14, poutT);
  const bottomHeight =
    Math.max(7, params.height * Math.max(beakGeometry.bottomHeightScale * 1.15, 0.22)) *
    lerp(1, 1.12, poutT) *
    lerp(1, 0.92, smileT);
  const stackOffset = params.height * lerp(0.3, 0.22, poutT);
  const stackShift = params.height * (0.1 * smileT - 0.12 * frownT);
  const middleY = -stackOffset + stackShift - params.height * 0.04 * poutT;
  const bottomBaseY = stackOffset + stackShift - params.height * 0.08 * poutT;
  const smileArch = params.height * 0.11 * smileT;
  const frownArch = params.height * 0.14 * frownT;
  const middleExpressionY = middleY + smileArch * 0.5 - frownArch * 0.75;
  const bottomExpressionY = bottomBaseY - smileArch * 0.45 + frownArch * 0.65;
  const middleCurve = params.height * 0.28 * curvature;
  const bottomCurve = params.height * 0.22 * curvature;
  const openThreshold = 0.16;

  ctx.save();
  ctx.translate(params.centerX, params.centerY);
  applySegmentStyle(ctx, BUBO_BEAK_FILL, BUBO_BEAK_GLOW, brightness, middleWidth * 0.1);

  if (speech <= openThreshold) {
    drawSolidCurvedBar(ctx, middleExpressionY, middleWidth, middleHeight, middleCurve);
  } else {
    const t = clamp((speech - openThreshold) / (1 - openThreshold), 0, 1);
    const verticalWidth = Math.max(5, middleWidth * lerp(0.16, 0.12, t));
    const verticalHeight =
      Math.max(8, params.height * lerp(0.62, 0.9, t)) *
      lerp(1, 1.08, frownT) *
      lerp(1, 0.94, smileT);
    const verticalGap = middleWidth * lerp(0.34, 0.4, t);
    const verticalY = lerp(middleExpressionY + verticalHeight * 0.12, 0, 0.18 + t * 0.14);

    fillCenteredRect(ctx, -verticalGap, verticalY, verticalWidth, verticalHeight);
    fillCenteredRect(ctx, verticalGap, verticalY, verticalWidth, verticalHeight);
  }

  const bottomTravel =
    speech <= openThreshold
      ? 0
      : params.height * lerp(0, 0.34, (speech - openThreshold) / (1 - openThreshold));
  drawSolidCurvedBar(ctx, bottomExpressionY + bottomTravel, bottomWidth, bottomHeight, bottomCurve);
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
    brows: true,
    pupils: true,
  },

  emotions: buboEmotions,
  actions: buboActions,

  drawEye: drawBuboEye,
  drawBrow: drawBuboBrow,
  drawNose: drawBuboNose,
  drawMouth: drawBuboMouth,

  drawOverlay(dc: DrawContext, width: number, height: number, _pose: FacePose): void {
    if (dc.displayName !== "love" || dc.mode !== "face") {
      return;
    }

    const { ctx } = dc;
    const t = dc.elapsed / 1000;
    const unit = Math.min(width, height);

    // Rising heart embers — each one loops on its own cycle, drifting
    // upward like glowing sparks from a campfire. Seeded with fixed
    // offsets so the pattern is stable but varied.
    const embers: [number, number, number, number, number][] = [
      // [xBias, period, phase, sizeScale, peakAlpha]
      [-0.14,  2.6, 0.0,  0.55, 0.7],
      [ 0.08,  3.1, 0.4,  0.4,  0.5],
      [-0.04,  2.2, 1.1,  0.7,  0.85],
      [ 0.16,  2.8, 0.7,  0.35, 0.45],
      [ 0.0,   3.4, 1.8,  0.6,  0.65],
      [-0.1,   2.4, 2.2,  0.45, 0.55],
      [ 0.12,  2.0, 1.5,  0.5,  0.6],
    ];

    ctx.save();

    for (const [xBias, period, phase, sizeScale, peakAlpha] of embers) {
      // Each ember loops: rises from bottom to top of face, then resets
      const cycle = ((t + phase) % period) / period; // 0..1

      // Fade in at bottom, full in middle, fade out at top
      let alpha: number;
      if (cycle < 0.15) {
        alpha = ease("smooth", cycle / 0.15);
      } else if (cycle < 0.7) {
        alpha = 1;
      } else {
        alpha = 1 - ease("smooth", (cycle - 0.7) / 0.3);
      }

      // Rise from below face center to above it
      const y = height * (0.2 - cycle * 0.5);
      // Gentle horizontal sway
      const sway = Math.sin(cycle * Math.PI * 2.4 + phase) * unit * 0.03;
      const x = width * xBias + sway;
      const size = unit * 0.04 * sizeScale;

      ctx.save();
      ctx.globalAlpha *= alpha * peakAlpha;
      ctx.shadowColor = "rgba(255, 140, 170, 0.6)";
      ctx.shadowBlur = size * 0.5;
      ctx.fillStyle = "#ff7b98";
      drawPixelGlyph(ctx, HEART_PATTERN, x, y, size);
      ctx.restore();
    }

    ctx.restore();
  },
};
