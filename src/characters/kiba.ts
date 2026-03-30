import type {
  BrowDrawParams,
  CharacterDefinition,
  DrawContext,
  EyeDrawParams,
  MouthDrawParams,
  NoseDrawParams,
} from "../character.js";
import { clamp, drawPixelGlyph, roundedRect, wave } from "../drawUtils.js";
import type { EmotionDefinition } from "../emotions.js";
import { STYLE_PRESETS } from "../styles.js";
import type { EmotionName, FacePose, StyleDefinition } from "../types.js";

const PUPIL_FILL = "#000000";
const TONGUE_FILL = "#ff8fb3";
const TOOTH_FILL = "#f6fff7";
const PUPIL_SHINE_FILL = "#f7ffff";
const SURFACE_FILL_ALPHA = 0.26;
const SURFACE_STROKE_ALPHA = 0.76;
const DETAIL_LINE_ALPHA = 0.36;
const HEART_PATTERN = [
  "01100110",
  "11111111",
  "11111111",
  "11111111",
  "01111110",
  "00111100",
  "00011000",
  "00000000",
];

const kibaStyle: StyleDefinition = {
  ...STYLE_PRESETS.soft,
  eyeWidth: 0.118,
  eyeHeight: 0.128,
  eyeY: -0.092,
  eyeGap: 0.146,
  browWidth: 0.08,
  browHeight: 0.01,
  browY: -0.16,
  noseWidth: 0.142,
  noseHeight: 0.102,
  noseY: 0.018,
  mouthWidth: 0.318,
  mouthHeight: 0.194,
  mouthY: 0.214,
  glowScale: 0.032,
};

const eye = (
  openness: number,
  squint: number,
  tilt: number,
  pupilX: number,
  pupilY: number,
  brightness: number,
) => ({
  openness,
  squint,
  tilt,
  pupilX,
  pupilY,
  brightness,
});

const pose = (
  leftEye: FacePose["leftEye"],
  rightEye: FacePose["rightEye"],
  nose: FacePose["nose"],
  mouth: FacePose["mouth"],
  global: FacePose["global"],
): FacePose => ({
  leftEye,
  rightEye,
  nose,
  mouth,
  global,
});

const kibaEmotions: Partial<Record<EmotionName, EmotionDefinition>> = {
  neutral: {
    pose: pose(
      eye(0.86, 0.05, 0, 0, 0, 1),
      eye(0.86, 0.05, 0, 0, 0, 1),
      { scale: 1, tilt: 0, brightness: 1 },
      { openness: 0.08, curvature: 0.02, width: 0.92, tilt: 0, brightness: 0.98 },
      { glow: 0.98, bob: 0.01, jitter: 0, distortion: 0, flicker: 0.01, scanline: 0.12 },
    ),
    durationMs: 260,
    ease: "smooth",
    microBob: 0.008,
    microBobHz: 0.8,
    microSway: 0.02,
    blinkMinMs: 3200,
    blinkMaxMs: 5800,
    blinkDurationMs: 180,
  },
  happy: {
    pose: pose(
      eye(0.98, 0.02, 0, 0, -0.02, 1.08),
      eye(0.98, 0.02, 0, 0, -0.02, 1.08),
      { scale: 1.04, tilt: 0, brightness: 1.08 },
      { openness: 0.42, curvature: 0.66, width: 0.98, tilt: 0, brightness: 1.1 },
      { glow: 1.14, bob: 0.018, jitter: 0, distortion: 0, flicker: 0.02, scanline: 0.1 },
    ),
    durationMs: 220,
    ease: "smooth",
    microBob: 0.014,
    microBobHz: 1.6,
    microSway: 0.03,
    blinkMinMs: 3800,
    blinkMaxMs: 6600,
    blinkDurationMs: 160,
  },
  love: {
    pose: pose(
      eye(0.9, 0.08, 0, 0, -0.04, 1.08),
      eye(0.9, 0.08, 0, 0, -0.04, 1.08),
      { scale: 1.02, tilt: 0, brightness: 1.05 },
      { openness: 0.36, curvature: 0.62, width: 0.98, tilt: 0, brightness: 1.1 },
      { glow: 1.18, bob: 0.016, jitter: 0, distortion: 0, flicker: 0.016, scanline: 0.1 },
    ),
    durationMs: 240,
    ease: "smooth",
    microBob: 0.014,
    microBobHz: 1.3,
    microSway: 0.03,
    blinkMinMs: 4200,
    blinkMaxMs: 7400,
    blinkDurationMs: 170,
  },
  sad: {
    pose: pose(
      eye(0.54, 0.06, -0.18, 0, 0.14, 0.8),
      eye(0.54, 0.06, 0.18, 0, 0.14, 0.8),
      { scale: 0.92, tilt: 0, brightness: 0.82 },
      { openness: 0, curvature: -0.84, width: 0.8, tilt: 0, brightness: 0.76 },
      { glow: 0.8, bob: 0.006, jitter: 0, distortion: 0, flicker: 0.006, scanline: 0.16 },
    ),
    durationMs: 420,
    ease: "gentle",
    microBob: 0.006,
    microBobHz: 0.45,
    microSway: 0.02,
    blinkMinMs: 2600,
    blinkMaxMs: 4600,
    blinkDurationMs: 220,
  },
  speaking: {
    pose: pose(
      eye(0.86, 0.06, 0, 0, 0, 1.04),
      eye(0.86, 0.06, 0, 0, 0, 1.04),
      { scale: 1.02, tilt: 0, brightness: 1.02 },
      { openness: 0.56, curvature: 0.32, width: 0.94, tilt: 0, brightness: 1.06 },
      { glow: 1.08, bob: 0.014, jitter: 0, distortion: 0, flicker: 0.02, scanline: 0.11 },
    ),
    durationMs: 180,
    ease: "smooth",
    microBob: 0.012,
    microBobHz: 1.2,
    microSway: 0.03,
    blinkMinMs: 3600,
    blinkMaxMs: 7000,
    blinkDurationMs: 160,
  },
  excited: {
    pose: pose(
      eye(1, 0.02, 0, 0, -0.04, 1.14),
      eye(1, 0.02, 0, 0, -0.04, 1.14),
      { scale: 1.05, tilt: 0, brightness: 1.1 },
      { openness: 0.62, curvature: 0.76, width: 1.02, tilt: 0, brightness: 1.16 },
      { glow: 1.24, bob: 0.022, jitter: 0.001, distortion: 0, flicker: 0.024, scanline: 0.08 },
    ),
    durationMs: 160,
    ease: "snap",
    microBob: 0.02,
    microBobHz: 2.2,
    microSway: 0.04,
    blinkMinMs: 4200,
    blinkMaxMs: 7600,
    blinkDurationMs: 150,
  },
  angry: {
    pose: pose(
      eye(0.46, 0.56, 0.12, 0, -0.04, 1.15),
      eye(0.46, 0.56, -0.12, 0, -0.04, 1.15),
      { scale: 1, tilt: 0.08, brightness: 1.05 },
      { openness: 0.22, curvature: -0.26, width: 0.94, tilt: 0, brightness: 1.14 },
      { glow: 1.14, bob: 0.01, jitter: 0.004, distortion: 0.18, flicker: 0.08, scanline: 0.16 },
    ),
    durationMs: 180,
    ease: "snap",
    microBob: 0.01,
    microBobHz: 2.1,
    microSway: 0.04,
    blinkMinMs: 5200,
    blinkMaxMs: 8200,
    blinkDurationMs: 120,
  },
  confused: {
    pose: pose(
      eye(0.9, 0.08, -0.08, -0.02, 0.02, 1.04),
      eye(0.72, 0.12, 0.04, 0.04, -0.01, 0.94),
      { scale: 1, tilt: -0.1, brightness: 0.98 },
      { openness: 0.02, curvature: -0.04, width: 0.88, tilt: -0.1, brightness: 0.94 },
      { glow: 1.02, bob: 0.014, jitter: 0, distortion: 0, flicker: 0.014, scanline: 0.12 },
    ),
    durationMs: 260,
    ease: "smooth",
    microBob: 0.012,
    microBobHz: 0.8,
    microSway: 0.035,
    blinkMinMs: 3600,
    blinkMaxMs: 6200,
    blinkDurationMs: 170,
  },
};

function drawEar(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  side: -1 | 1,
  bobY: number,
  pose: {
    innerX: number;
    outerX: number;
    topY: number;
    shoulderX: number;
    shoulderY: number;
    tipX: number;
    tipY: number;
    baseX: number;
    baseY: number;
  },
): void {
  const topInnerX = side * width * pose.innerX;
  const topOuterX = side * width * pose.outerX;
  const ridgeY = height * pose.topY + bobY;
  const shoulderX = side * width * pose.shoulderX;
  const shoulderY = height * pose.shoulderY + bobY;
  const tipX = side * width * pose.tipX;
  const tipY = height * pose.tipY + bobY;
  const baseX = side * width * pose.baseX;
  const baseY = height * pose.baseY + bobY;

  ctx.beginPath();
  ctx.moveTo(topInnerX, ridgeY);
  ctx.quadraticCurveTo(
    side * width * ((pose.innerX + pose.outerX) * 0.5),
    ridgeY,
    topOuterX,
    ridgeY,
  );
  ctx.quadraticCurveTo(
    side * width * (pose.outerX + 0.03),
    height * (pose.topY + 0.04) + bobY,
    shoulderX,
    shoulderY,
  );
  ctx.quadraticCurveTo(
    side * width * (pose.tipX + 0.03),
    height * (pose.tipY - 0.03) + bobY,
    tipX,
    tipY,
  );
  ctx.quadraticCurveTo(
    side * width * (pose.baseX + 0.015),
    height * (pose.baseY + 0.006) + bobY,
    baseX,
    baseY,
  );
  ctx.stroke();
}

function resolveEarPose(emotionName: EmotionName): {
  innerX: number;
  outerX: number;
  topY: number;
  shoulderX: number;
  shoulderY: number;
  tipX: number;
  tipY: number;
  baseX: number;
  baseY: number;
} {
  if (emotionName === "excited") {
    return {
      innerX: 0.205,
      outerX: 0.32,
      topY: -0.325,
      shoulderX: 0.355,
      shoulderY: -0.22,
      tipX: 0.285,
      tipY: -0.09,
      baseX: 0.215,
      baseY: -0.235,
    };
  }

  if (emotionName === "happy") {
    return {
      innerX: 0.208,
      outerX: 0.325,
      topY: -0.305,
      shoulderX: 0.36,
      shoulderY: -0.205,
      tipX: 0.292,
      tipY: -0.075,
      baseX: 0.22,
      baseY: -0.22,
    };
  }

  if (emotionName === "love") {
    return {
      innerX: 0.212,
      outerX: 0.315,
      topY: -0.292,
      shoulderX: 0.347,
      shoulderY: -0.198,
      tipX: 0.272,
      tipY: -0.062,
      baseX: 0.214,
      baseY: -0.206,
    };
  }

  if (emotionName === "speaking") {
    return {
      innerX: 0.214,
      outerX: 0.312,
      topY: -0.284,
      shoulderX: 0.342,
      shoulderY: -0.188,
      tipX: 0.266,
      tipY: -0.048,
      baseX: 0.212,
      baseY: -0.194,
    };
  }

  if (emotionName === "sleepy") {
    return {
      innerX: 0.224,
      outerX: 0.286,
      topY: -0.244,
      shoulderX: 0.332,
      shoulderY: -0.186,
      tipX: 0.248,
      tipY: 0.012,
      baseX: 0.214,
      baseY: -0.168,
    };
  }

  if (emotionName === "sad") {
    return {
      innerX: 0.222,
      outerX: 0.298,
      topY: -0.258,
      shoulderX: 0.338,
      shoulderY: -0.196,
      tipX: 0.258,
      tipY: -0.012,
      baseX: 0.216,
      baseY: -0.176,
    };
  }

  return {
    innerX: 0.218,
    outerX: 0.31,
    topY: -0.278,
    shoulderX: 0.338,
    shoulderY: -0.182,
    tipX: 0.258,
    tipY: -0.04,
    baseX: 0.208,
    baseY: -0.19,
  };
}

function eyeShapeSupportsPupil(shape: string): boolean {
  return shape === "rounded" || shape === "capsule" || shape === "pixel";
}

function drawGlyphEye(
  ctx: CanvasRenderingContext2D,
  shape: string,
  width: number,
  height: number,
  side: number,
  openness: number,
  squint: number,
): void {
  if (shape === "chevron") {
    const lineWidth = Math.max(1.5, Math.min(width, height) * 0.11);
    const apexX = side * width * 0.04;
    const apexY = -height * (0.28 + squint * 0.08);
    const wingY = height * (0.08 + (1 - openness) * 0.12);
    ctx.lineWidth = lineWidth;
    ctx.beginPath();
    ctx.moveTo(-width * 0.42, wingY);
    ctx.lineTo(apexX, apexY);
    ctx.lineTo(width * 0.42, wingY);
    ctx.stroke();
    return;
  }

  if (shape === "crescent") {
    const lineWidth = Math.max(1.5, Math.min(width, height) * 0.13);
    const startX = -side * width * 0.08;
    const controlX = side * width * 0.42;
    const arcHeight = height * (0.42 + (1 - openness) * 0.08);
    ctx.lineWidth = lineWidth;
    ctx.beginPath();
    ctx.moveTo(startX, -arcHeight);
    ctx.quadraticCurveTo(controlX, 0, startX, arcHeight);
    ctx.stroke();
    return;
  }

  if (shape === "tear") {
    const topY = -height * 0.48;
    const bottomY = height * 0.48;
    const shoulderX = width * 0.28;
    ctx.beginPath();
    ctx.moveTo(0, topY);
    ctx.bezierCurveTo(shoulderX, -height * 0.28, shoulderX, height * 0.16, 0, bottomY);
    ctx.bezierCurveTo(-shoulderX, height * 0.16, -shoulderX, -height * 0.28, 0, topY);
    ctx.closePath();
    ctx.fill();
  }
}

function drawDogEyeShell(
  ctx: CanvasRenderingContext2D,
  shape: string,
  width: number,
  height: number,
): void {
  if (shape === "pixel") {
    roundedRect(ctx, -width * 0.5, -height * 0.5, width, height, width * 0.14);
    return;
  }

  if (shape === "capsule") {
    roundedRect(ctx, -width * 0.5, -height * 0.46, width, height * 0.92, height * 0.42);
    return;
  }

  roundedRect(ctx, -width * 0.5, -height * 0.5, width, height, Math.min(width, height) * 0.5);
}

function drawDogEyeSocket(
  ctx: CanvasRenderingContext2D,
  shape: string,
  width: number,
  height: number,
): void {
  if (shape === "capsule") {
    roundedRect(ctx, -width * 0.58, -height * 0.52, width * 1.16, height, height * 0.5);
    return;
  }

  roundedRect(
    ctx,
    -width * 0.62,
    -height * 0.56,
    width * 1.24,
    height * 1.12,
    Math.min(width, height) * 0.6,
  );
}

function drawPupilShine(
  ctx: CanvasRenderingContext2D,
  pupilX: number,
  pupilY: number,
  pupilSize: number,
): void {
  const shineSize = pupilSize * 0.28;
  roundedRect(
    ctx,
    pupilX - pupilSize * 0.18,
    pupilY - pupilSize * 0.22,
    shineSize,
    shineSize,
    shineSize * 0.5,
  );
}

function drawDogNose(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  ctx.beginPath();
  ctx.moveTo(-width * 0.18, -height * 0.18);
  ctx.quadraticCurveTo(0, -height * 0.28, width * 0.18, -height * 0.18);
  ctx.quadraticCurveTo(width * 0.4, -height * 0.14, width * 0.42, height * 0.02);
  ctx.quadraticCurveTo(width * 0.4, height * 0.2, width * 0.24, height * 0.34);
  ctx.quadraticCurveTo(width * 0.12, height * 0.44, 0, height * 0.46);
  ctx.quadraticCurveTo(-width * 0.12, height * 0.44, -width * 0.24, height * 0.34);
  ctx.quadraticCurveTo(-width * 0.4, height * 0.2, -width * 0.42, height * 0.02);
  ctx.quadraticCurveTo(-width * 0.4, -height * 0.14, -width * 0.18, -height * 0.18);
  ctx.closePath();
}

function drawDogMuzzlePad(
  ctx: CanvasRenderingContext2D,
  mouthWidth: number,
  height: number,
  curvature: number,
  openness: number,
): void {
  const smileAmount = Math.max(0, curvature);
  const frownAmount = Math.max(0, -curvature);
  const width = mouthWidth * (0.98 + smileAmount * 0.08 - frownAmount * 0.02);
  const topY = -height * (0.3 + smileAmount * 0.02);
  const upperBulgeY = -height * (0.42 + smileAmount * 0.02 - frownAmount * 0.01);
  const cheekY = height * (0.2 - smileAmount * 0.04 + frownAmount * 0.06);
  const lowerCheekY = height * (0.42 - smileAmount * 0.1 + openness * 0.08 + frownAmount * 0.08);
  const bottomY = height * (0.6 - smileAmount * 0.1 + openness * 0.18 + frownAmount * 0.1);
  const topCornerY = topY - height * (0.05 - smileAmount * 0.01);
  const upperBridgeY = -height * (0.34 + smileAmount * 0.03 - frownAmount * 0.01);

  ctx.beginPath();
  ctx.moveTo(-width * 0.58, topY + height * 0.03);
  ctx.quadraticCurveTo(-width * 0.68, topCornerY, -width * 0.42, upperBridgeY);
  ctx.quadraticCurveTo(-width * 0.24, upperBulgeY, 0, -height * 0.32);
  ctx.quadraticCurveTo(width * 0.24, upperBulgeY, width * 0.42, upperBridgeY);
  ctx.quadraticCurveTo(width * 0.68, topCornerY, width * 0.58, topY + height * 0.03);
  ctx.quadraticCurveTo(width * 0.66, cheekY, width * 0.34, lowerCheekY);
  ctx.quadraticCurveTo(width * 0.22, height * 0.58, 0, bottomY);
  ctx.quadraticCurveTo(-width * 0.22, height * 0.58, -width * 0.34, lowerCheekY);
  ctx.quadraticCurveTo(-width * 0.66, cheekY, -width * 0.58, topY + height * 0.03);
  ctx.closePath();
}

function drawDogMouth(
  ctx: CanvasRenderingContext2D,
  mouthWidth: number,
  height: number,
  curvature: number,
  openness: number,
): void {
  const { lineHalfWidth, lipY, controlY } = resolveDogMouthGeometry(
    mouthWidth,
    height,
    curvature,
    openness,
  );

  ctx.beginPath();
  ctx.moveTo(-lineHalfWidth, lipY);
  ctx.quadraticCurveTo(0, controlY, lineHalfWidth, lipY);
  ctx.stroke();
}

function resolveDogMouthGeometry(
  mouthWidth: number,
  height: number,
  curvature: number,
  openness: number,
): {
  lineHalfWidth: number;
  tongueHalfWidth: number;
  lipY: number;
  controlY: number;
  tongueBottomY: number;
} {
  const smileAmount = Math.max(0, curvature);
  const frownAmount = Math.max(0, -curvature);
  const tongueWidth = mouthWidth * (0.31 + openness * 0.07);
  const tongueHeight = height * (0.24 + openness * 0.62);
  const tongueTopY = height * (0.14 + openness * 0.04 + smileAmount * 0.015);
  const smileLift = curvature * height * 0.1;
  const tongueHalfWidth = tongueWidth * 0.42;
  const lineHalfWidth = tongueHalfWidth * 1.74;
  const lipY = tongueTopY - tongueHeight * 0.2 + smileLift;
  const controlY =
    lipY + smileAmount * height * 0.18 - frownAmount * height * (0.16 + openness * 0.03);
  const tongueBottomY = tongueTopY + tongueHeight * 0.08 + smileLift;

  return {
    lineHalfWidth,
    tongueHalfWidth,
    lipY,
    controlY,
    tongueBottomY,
  };
}

function resolveDogMouthCurveY(
  x: number,
  lineHalfWidth: number,
  lipY: number,
  controlY: number,
): number {
  if (lineHalfWidth <= 0.0001) {
    return lipY;
  }

  const t = clamp((x + lineHalfWidth) / (lineHalfWidth * 2), 0, 1);
  const invT = 1 - t;
  return invT * invT * lipY + 2 * invT * t * controlY + t * t * lipY;
}

function drawDogTongue(
  ctx: CanvasRenderingContext2D,
  mouthWidth: number,
  height: number,
  curvature: number,
  openness: number,
): void {
  const smileAmount = Math.max(0, curvature);
  const tongueHeight = height * (0.24 + openness * 0.62);
  const tongueTopY = height * (0.14 + openness * 0.04 + smileAmount * 0.015);
  const smileLift = curvature * height * 0.1;
  const { lineHalfWidth, tongueHalfWidth, lipY, controlY, tongueBottomY } = resolveDogMouthGeometry(
    mouthWidth,
    height,
    curvature,
    openness,
  );
  const leftTopY = resolveDogMouthCurveY(-tongueHalfWidth, lineHalfWidth, lipY, controlY);
  const rightTopY = resolveDogMouthCurveY(tongueHalfWidth, lineHalfWidth, lipY, controlY);
  const topSegments = 12;
  const stepX = (tongueHalfWidth * 2) / topSegments;
  const tipY = tongueTopY + tongueHeight * 0.68 + smileLift;

  ctx.beginPath();
  ctx.moveTo(-tongueHalfWidth, leftTopY);
  ctx.lineTo(-tongueHalfWidth, tongueBottomY);
  ctx.quadraticCurveTo(0, tipY, tongueHalfWidth, tongueBottomY);
  ctx.lineTo(tongueHalfWidth, rightTopY);

  for (let index = topSegments - 1; index >= 0; index -= 1) {
    const x = -tongueHalfWidth + stepX * index;
    ctx.lineTo(x, resolveDogMouthCurveY(x, lineHalfWidth, lipY, controlY));
  }
  ctx.closePath();
}

function drawDogTongueOutline(
  ctx: CanvasRenderingContext2D,
  mouthWidth: number,
  height: number,
  curvature: number,
  openness: number,
): void {
  const smileAmount = Math.max(0, curvature);
  const tongueHeight = height * (0.24 + openness * 0.62);
  const tongueTopY = height * (0.14 + openness * 0.04 + smileAmount * 0.015);
  const smileLift = curvature * height * 0.1;
  const { lineHalfWidth, tongueHalfWidth, lipY, controlY, tongueBottomY } = resolveDogMouthGeometry(
    mouthWidth,
    height,
    curvature,
    openness,
  );
  const leftTopY = resolveDogMouthCurveY(-tongueHalfWidth, lineHalfWidth, lipY, controlY);
  const rightTopY = resolveDogMouthCurveY(tongueHalfWidth, lineHalfWidth, lipY, controlY);
  const tipY = tongueTopY + tongueHeight * 0.68 + smileLift;

  ctx.beginPath();
  ctx.moveTo(-tongueHalfWidth, leftTopY);
  ctx.lineTo(-tongueHalfWidth, tongueBottomY);
  ctx.quadraticCurveTo(0, tipY, tongueHalfWidth, tongueBottomY);
  ctx.lineTo(tongueHalfWidth, rightTopY);
}

function drawDogTongueSeam(
  ctx: CanvasRenderingContext2D,
  mouthWidth: number,
  height: number,
  curvature: number,
  openness: number,
): void {
  const tongueHeight = height * (0.24 + openness * 0.62);
  const { lipY, controlY } = resolveDogMouthGeometry(mouthWidth, height, curvature, openness);
  const seamOffsetY = tongueHeight * 0.04;
  const curveMidY = (lipY + controlY) * 0.5;

  ctx.beginPath();
  ctx.moveTo(0, curveMidY + seamOffsetY);
  ctx.lineTo(0, curveMidY + tongueHeight * 0.34 + seamOffsetY);
}

function drawDogMuzzleSplit(
  ctx: CanvasRenderingContext2D,
  mouthWidth: number,
  height: number,
  curvature: number,
  openness: number,
): void {
  const { lipY } = resolveDogMouthGeometry(mouthWidth, height, curvature, openness);
  const splitTopY = -height * 0.34;
  const splitBottomY = lipY - height * 0.035;

  ctx.beginPath();
  ctx.moveTo(0, splitTopY);
  ctx.lineTo(0, splitBottomY);
}

function drawDogTeeth(
  ctx: CanvasRenderingContext2D,
  mouthWidth: number,
  height: number,
  curvature: number,
  openness: number,
): void {
  const frownAmount = Math.max(0, -curvature);
  const upperWidth = mouthWidth * (0.98 + Math.max(0, curvature) * 0.05);
  const upperDrop = height * (0.14 + Math.max(0, curvature) * 0.06 + frownAmount * 0.12);
  const tongueTopY = height * (0.12 + openness * 0.05 + Math.max(0, curvature) * 0.02);
  const smileLift = curvature * height * 0.1;
  const cornerInset = upperWidth * 0.22;
  const cornerY = tongueTopY - height * 0.02 + smileLift + frownAmount * height * 0.12;
  const teethSpan = cornerInset * 2.34;
  const toothCount = 7;
  const toothGap = teethSpan * 0.015;
  const toothWidth = (teethSpan - toothGap * (toothCount - 1)) / toothCount;
  const baseDepth = height * (0.2 + openness * 0.12 + frownAmount * 0.08);
  const leftEdge = -teethSpan * 0.5;
  const centerIndex = (toothCount - 1) * 0.5;
  const ridgeLift = upperDrop * 0.22 + frownAmount * height * 0.04;

  ctx.beginPath();
  for (let index = 0; index < toothCount; index += 1) {
    const startX = leftEdge + index * (toothWidth + toothGap);
    const endX = startX + toothWidth;
    const tipX = (startX + endX) * 0.5;
    const centerWeight = 1 - Math.abs(index - centerIndex) / centerIndex;
    const startT = clamp((startX + cornerInset) / (cornerInset * 2), 0, 1);
    const endT = clamp((endX + cornerInset) / (cornerInset * 2), 0, 1);
    const tipT = clamp((tipX + cornerInset) / (cornerInset * 2), 0, 1);
    const startY = cornerY - ridgeLift * (1 - Math.abs(startT * 2 - 1));
    const endY = cornerY - ridgeLift * (1 - Math.abs(endT * 2 - 1));
    const tipBaseY = cornerY - ridgeLift * (1 - Math.abs(tipT * 2 - 1));
    const toothDepth = baseDepth * (0.72 + centerWeight * 0.34);

    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.lineTo(tipX, tipBaseY + toothDepth);
    ctx.closePath();
  }
}

function shouldShowDogTongue(
  emotionName: EmotionName,
  openness: number,
  curvature: number,
): boolean {
  if (emotionName === "angry") {
    return false;
  }

  if (emotionName === "sad" || emotionName === "sleepy" || emotionName === "confused") {
    return openness > 0.2 && curvature > -0.2;
  }

  if (emotionName === "neutral") {
    return openness > 0.14;
  }

  if (emotionName === "happy" || emotionName === "love" || emotionName === "excited") {
    return openness > 0.22 || curvature > 0.48;
  }

  return openness > 0.18;
}

export const kibaCharacter: CharacterDefinition = {
  name: "kiba",

  partOptions: {
    eyeShape: ["rounded", "capsule", "pixel", "chevron", "crescent", "tear"],
    noseShape: ["diamond", "triangle", "bar", "dot"],
    mouthShape: ["arc", "visor", "pixel"],
    browShape: ["line", "block", "visor"],
  },

  defaultParts: {
    eyeShape: "rounded",
    eyeWidthScale: "1",
    eyeHeightScale: "1",
    noseShape: "triangle",
    mouthShape: "arc",
    browShape: "line",
    scanlineThickness: "1.5",
    scanlineSpacing: "5",
  },

  defaultStyle: kibaStyle,

  defaultFeatures: {
    brows: false,
  },

  emotions: kibaEmotions,

  drawBackground(dc: DrawContext, width: number, height: number, pose: FacePose): void {
    if (dc.mode !== "face") {
      return;
    }

    const { ctx, theme } = dc;
    const bobY = pose.global.bob * height * 0.05;
    const earPose = resolveEarPose(dc.emotionName);
    const confusedTilt = dc.emotionName === "confused";

    ctx.save();
    ctx.strokeStyle = theme.foreground;
    ctx.shadowColor = theme.glow;
    ctx.shadowBlur = Math.max(0, width * 0.024);
    ctx.lineWidth = Math.max(1.5, height * 0.0095);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    drawEar(
      ctx,
      width,
      height,
      -1,
      bobY + (confusedTilt ? height * 0.042 : 0),
      confusedTilt
        ? {
            ...earPose,
            innerX: earPose.innerX + 0.05,
            outerX: earPose.outerX - 0.055,
            shoulderX: earPose.shoulderX + 0.036,
            tipX: earPose.tipX + 0.028,
            baseX: earPose.baseX + 0.038,
            shoulderY: earPose.shoulderY + 0.016,
            tipY: earPose.tipY + 0.018,
            baseY: earPose.baseY + 0.014,
          }
        : earPose,
    );
    drawEar(ctx, width, height, 1, bobY + (confusedTilt ? -height * 0.018 : 0), earPose);
    ctx.restore();
  },

  drawEye(dc: DrawContext, params: EyeDrawParams): void {
    const { ctx, theme } = dc;
    const { pose, side, parts } = params;
    const openness = clamp(pose.openness, 0.01, 1);
    const squint = clamp(pose.squint, 0, 1);
    const eyeHeightScale = clamp(Number(parts.eyeHeightScale) || 1, 0.5, 1.8);
    const eyeWidthScale = clamp(Number(parts.eyeWidthScale) || 1, 0.5, 1.8);
    const baseHeight = params.height * eyeHeightScale;
    const baseWidth = params.width * eyeWidthScale;
    const eyeHeight = Math.max(
      baseHeight * 0.1,
      baseHeight * (0.18 + openness * 0.74) * (1 - squint * 0.52),
    );
    const eyeWidth = baseWidth * (0.86 + openness * 0.14);
    const eyeShape = parts.eyeShape ?? "rounded";
    const glyphEye = eyeShape === "chevron" || eyeShape === "crescent" || eyeShape === "tear";
    const brightness = clamp(pose.brightness, 0.1, 1.8);
    const confusedTilt = dc.emotionName === "confused";
    const confusedScale = confusedTilt ? (side === -1 ? 1.18 : 0.94) : 1;
    const confusedY = confusedTilt
      ? side === -1
        ? params.height * 0.1
        : -params.height * 0.06
      : 0;
    const confusedX = confusedTilt ? (side === -1 ? -params.width * 0.02 : params.width * 0.01) : 0;
    const resolvedEyeWidth = eyeWidth * confusedScale;
    const resolvedEyeHeight = eyeHeight * confusedScale;
    const pupilSize = Math.max(10, Math.min(resolvedEyeWidth, resolvedEyeHeight) * 0.54);
    const dogSlantBase = dc.emotionName === "sad" ? 0.26 : 0.12;
    const dogSlant = (dc.emotionName === "angry" ? -side : side) * dogSlantBase;
    const headTilt = confusedTilt ? -0.1 : 0;

    ctx.save();
    ctx.translate(params.centerX + confusedX, params.centerY + confusedY);
    ctx.rotate(dogSlant + pose.tilt * 0.24 + headTilt);
    ctx.globalAlpha *= brightness;

    if (resolvedEyeHeight < params.height * 0.16) {
      ctx.strokeStyle = theme.foreground;
      ctx.lineWidth = Math.max(2, params.height * 0.075);
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(-resolvedEyeWidth * 0.42, 0);
      ctx.quadraticCurveTo(0, resolvedEyeHeight * 0.18, resolvedEyeWidth * 0.42, 0);
      ctx.stroke();
      ctx.restore();
      return;
    }

    ctx.fillStyle = theme.foreground;
    ctx.strokeStyle = theme.foreground;
    ctx.shadowColor = theme.glow;
    ctx.shadowBlur = Math.max(0, Math.min(resolvedEyeWidth, resolvedEyeHeight) * 0.32);

    if (eyeShapeSupportsPupil(eyeShape)) {
      ctx.save();
      ctx.globalAlpha *= SURFACE_FILL_ALPHA * 0.52;
      ctx.fillStyle = theme.foreground;
      ctx.shadowBlur = 0;
      drawDogEyeSocket(ctx, eyeShape, resolvedEyeWidth, resolvedEyeHeight);
      ctx.fill();
      ctx.restore();
    }

    if (glyphEye) {
      drawGlyphEye(ctx, eyeShape, eyeWidth, eyeHeight, side, openness, squint);
      ctx.restore();
      return;
    }

    if (side === -1) {
      ctx.save();
      ctx.globalAlpha *= SURFACE_FILL_ALPHA;
      ctx.fillStyle = theme.foreground;
      ctx.shadowBlur = 0;
      ctx.translate(resolvedEyeWidth * 0.18, 0);
      ctx.beginPath();
      ctx.moveTo(-resolvedEyeWidth * 0.6, -resolvedEyeHeight * 0.92);
      ctx.quadraticCurveTo(
        resolvedEyeWidth * 0.24,
        -resolvedEyeHeight * 1.28,
        resolvedEyeWidth * 0.86,
        -resolvedEyeHeight * 0.48,
      );
      ctx.quadraticCurveTo(
        resolvedEyeWidth * 1.02,
        resolvedEyeHeight * 0.16,
        resolvedEyeWidth * 0.34,
        resolvedEyeHeight * 1.02,
      );
      ctx.quadraticCurveTo(
        -resolvedEyeWidth * 0.34,
        resolvedEyeHeight * 1.12,
        -resolvedEyeWidth * 0.72,
        resolvedEyeHeight * 0.38,
      );
      ctx.quadraticCurveTo(
        -resolvedEyeWidth * 0.92,
        -resolvedEyeHeight * 0.1,
        -resolvedEyeWidth * 0.6,
        -resolvedEyeHeight * 0.84,
      );
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    if (dc.emotionName === "love") {
      const heartPulse = 0.96 + 0.09 * (0.5 + 0.5 * wave(dc.elapsed / 1000, 1.25));
      const heartSize = Math.min(resolvedEyeWidth, resolvedEyeHeight) * 1.64 * heartPulse;
      ctx.shadowBlur = heartSize * 0.3;
      ctx.fillStyle = "#ff305f";
      drawPixelGlyph(ctx, HEART_PATTERN, 0, 0, heartSize);

      ctx.shadowBlur = 0;
      ctx.globalAlpha *= 0.3;
      ctx.fillStyle = "#ff9ab3";
      drawPixelGlyph(ctx, HEART_PATTERN, 0, -heartSize * 0.04, heartSize * 0.62);

      if (eyeShapeSupportsPupil(eyeShape)) {
        const pupilTravelX = heartSize * 0.14;
        const pupilTravelY = heartSize * 0.12;
        const pupilX = clamp(pose.pupilX, -1, 1) * pupilTravelX;
        const pupilY = clamp(pose.pupilY, -1, 1) * pupilTravelY + heartSize * 0.02;
        const lovePupilSize = Math.max(9, heartSize * 0.3);
        ctx.globalAlpha = 1;
        ctx.fillStyle = PUPIL_FILL;
        roundedRect(
          ctx,
          pupilX - lovePupilSize * 0.5,
          pupilY - lovePupilSize * 0.5,
          lovePupilSize,
          lovePupilSize,
          lovePupilSize * 0.28,
        );
        ctx.fill();
        ctx.fillStyle = PUPIL_SHINE_FILL;
        drawPupilShine(ctx, pupilX, pupilY, lovePupilSize);
        ctx.fill();
      }

      ctx.restore();
      return;
    }

    drawDogEyeShell(ctx, eyeShape, resolvedEyeWidth, resolvedEyeHeight);
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.globalAlpha *= 0.92;
    ctx.fillStyle = theme.accent;
    drawDogEyeShell(ctx, eyeShape, resolvedEyeWidth * 0.82, resolvedEyeHeight * 0.82);
    ctx.fill();

    if (eyeShapeSupportsPupil(eyeShape)) {
      const pupilX = clamp(pose.pupilX, -1, 1) * resolvedEyeWidth * 0.2;
      const pupilY = clamp(pose.pupilY, -1, 1) * resolvedEyeHeight * 0.18;
      ctx.globalAlpha = 1;
      ctx.fillStyle = PUPIL_FILL;
      roundedRect(
        ctx,
        pupilX - pupilSize * 0.5,
        pupilY - pupilSize * 0.5,
        pupilSize,
        pupilSize,
        pupilSize * 0.28,
      );
      ctx.fill();
      ctx.fillStyle = PUPIL_SHINE_FILL;
      drawPupilShine(ctx, pupilX, pupilY, pupilSize);
      ctx.fill();
    }

    ctx.restore();
  },

  drawBrow(dc: DrawContext, params: BrowDrawParams): void {
    const { ctx, theme } = dc;
    const { pose } = params;

    ctx.save();
    ctx.translate(params.centerX, params.centerY);
    ctx.rotate(pose.tilt * 0.05);
    ctx.strokeStyle = theme.foreground;
    ctx.globalAlpha *= clamp(pose.brightness, 0.2, 1.2) * 0.45;
    ctx.lineCap = "round";
    ctx.lineWidth = Math.max(1.25, params.height * 0.46);
    ctx.beginPath();
    ctx.moveTo(-params.width * 0.22, 0);
    ctx.lineTo(params.width * 0.22, 0);
    ctx.stroke();
    ctx.restore();
  },

  drawNose(dc: DrawContext, params: NoseDrawParams): void {
    const { ctx, theme } = dc;
    const { pose } = params;
    const scale = clamp(pose.scale, 0.1, 1.5);
    const brightness = clamp(pose.brightness, 0.1, 1.6);
    const width = params.width * scale;
    const height = params.height * scale;
    const confusedTilt = dc.emotionName === "confused";

    ctx.save();
    ctx.translate(
      params.centerX + (confusedTilt ? -params.width * 0.02 : 0),
      params.centerY + (confusedTilt ? params.height * 0.04 : 0),
    );
    ctx.rotate(pose.tilt * 0.3 + (confusedTilt ? -0.1 : 0));
    ctx.lineWidth = Math.max(1.5, params.height * 0.048);
    ctx.strokeStyle = theme.foreground;
    ctx.globalAlpha *= brightness;
    ctx.lineJoin = "round";
    ctx.shadowColor = theme.glow;
    ctx.shadowBlur = Math.max(0, width * 0.16);
    drawDogNose(ctx, width, height);
    ctx.stroke();
    ctx.restore();
  },

  drawMouth(dc: DrawContext, params: MouthDrawParams): void {
    const { ctx, theme } = dc;
    const { pose } = params;
    const curvature = clamp(pose.curvature, -1, 1);
    const openness = clamp(pose.openness, 0, 1);
    const width = params.width * clamp(pose.width, 0.75, 1.16);
    const brightness = clamp(pose.brightness, 0.1, 1.8);
    const showTeeth = dc.emotionName === "angry";
    const showTongue = shouldShowDogTongue(dc.emotionName, openness, curvature);
    const confusedTilt = dc.emotionName === "confused";
    const mouthStrokeAlpha = showTeeth ? 0 : 0.58;
    const mouthStrokeWidth = Math.max(1.5, params.height * 0.034);

    ctx.save();
    ctx.translate(
      params.centerX + (confusedTilt ? -params.width * 0.015 : 0),
      params.centerY + (confusedTilt ? params.height * 0.05 : 0),
    );
    ctx.rotate(pose.tilt * 0.22 + (confusedTilt ? -0.08 : 0));
    ctx.lineWidth = mouthStrokeWidth;
    ctx.strokeStyle = theme.foreground;
    ctx.globalAlpha *= brightness;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.shadowColor = theme.glow;
    ctx.shadowBlur = Math.max(0, params.height * 0.12);
    ctx.save();
    ctx.globalAlpha *= SURFACE_FILL_ALPHA;
    ctx.fillStyle = theme.foreground;
    ctx.shadowBlur = 0;
    drawDogMuzzlePad(ctx, width, params.height, curvature, openness);
    ctx.fill();
    ctx.restore();
    ctx.save();
    ctx.globalAlpha *= SURFACE_STROKE_ALPHA;
    ctx.shadowBlur = 0;
    drawDogMuzzlePad(ctx, width, params.height, curvature, openness);
    ctx.stroke();
    ctx.restore();
    ctx.save();
    ctx.globalAlpha *= DETAIL_LINE_ALPHA;
    ctx.lineWidth = Math.max(1.25, params.height * 0.028);
    ctx.shadowBlur = 0;
    drawDogMuzzleSplit(ctx, width, params.height, curvature, openness);
    ctx.stroke();
    ctx.restore();

    if (showTeeth) {
      ctx.save();
      ctx.globalAlpha *= 0.98;
      ctx.fillStyle = TOOTH_FILL;
      ctx.shadowBlur = 0;
      drawDogTeeth(ctx, width, params.height, curvature, openness);
      ctx.fill();
      ctx.restore();
    } else {
      ctx.save();
      ctx.globalAlpha *= mouthStrokeAlpha * 0.88;
      drawDogMouth(ctx, width, params.height, curvature, openness);
      ctx.restore();
      if (showTongue) {
        ctx.save();
        ctx.globalAlpha *= 0.9;
        ctx.fillStyle = TONGUE_FILL;
        ctx.shadowBlur = 0;
        drawDogTongue(ctx, width, params.height, curvature, openness);
        ctx.fill();
        ctx.restore();
        ctx.save();
        ctx.globalAlpha *= DETAIL_LINE_ALPHA;
        drawDogTongueOutline(ctx, width, params.height, curvature, openness);
        ctx.stroke();
        ctx.globalAlpha *= 0.85;
        drawDogTongueSeam(ctx, width, params.height, curvature, openness);
        ctx.stroke();
        ctx.restore();
      }
    }
    ctx.restore();
  },

  getFaceVisibility(): number {
    return 1;
  },

  getScrambleStrength(_emotionName, baseDistortion): number {
    return baseDistortion * 0.3;
  },
};
