import type {
  BrowDrawParams,
  CharacterDefinition,
  DrawContext,
  EyeDrawParams,
  MouthDrawParams,
  NoseDrawParams,
} from "../character.js";
import { clamp, roundedRect } from "../drawUtils.js";
import type { EmotionDefinition } from "../emotions.js";
import { STYLE_PRESETS } from "../styles.js";
import type { EmotionName, FacePose, StyleDefinition } from "../types.js";

const PUPIL_FILL = "#000000";

const kibaStyle: StyleDefinition = {
  ...STYLE_PRESETS.soft,
  eyeWidth: 0.082,
  eyeHeight: 0.088,
  eyeY: -0.105,
  eyeGap: 0.158,
  browWidth: 0.08,
  browHeight: 0.01,
  browY: -0.16,
  noseWidth: 0.102,
  noseHeight: 0.075,
  noseY: 0.016,
  mouthWidth: 0.232,
  mouthHeight: 0.16,
  mouthY: 0.19,
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
      { openness: 0.16, curvature: 0.34, width: 0.96, tilt: 0, brightness: 1 },
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
      { openness: 0.5, curvature: 0.82, width: 1.02, tilt: 0, brightness: 1.14 },
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
      { openness: 0.42, curvature: 0.76, width: 1, tilt: 0, brightness: 1.12 },
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
  speaking: {
    pose: pose(
      eye(0.86, 0.06, 0, 0, 0, 1.04),
      eye(0.86, 0.06, 0, 0, 0, 1.04),
      { scale: 1.02, tilt: 0, brightness: 1.02 },
      { openness: 0.62, curvature: 0.52, width: 0.96, tilt: 0, brightness: 1.08 },
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
      { openness: 0.74, curvature: 0.88, width: 1.04, tilt: 0, brightness: 1.18 },
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
};

function drawEar(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  side: -1 | 1,
  bobY: number,
  innerFill: string,
): void {
  const topInnerX = side * width * 0.11;
  const topOuterX = side * width * 0.34;
  const ridgeY = -height * 0.29 + bobY;
  const shoulderX = side * width * 0.39;
  const shoulderY = -height * 0.08 + bobY;
  const tipX = side * width * 0.26;
  const tipY = height * 0.04 + bobY;
  const baseX = side * width * 0.08;
  const baseY = -height * 0.06 + bobY;

  ctx.beginPath();
  ctx.moveTo(topInnerX, -height * 0.25 + bobY);
  ctx.quadraticCurveTo(side * width * 0.18, ridgeY, topOuterX, ridgeY);
  ctx.quadraticCurveTo(side * width * 0.42, -height * 0.18 + bobY, shoulderX, shoulderY);
  ctx.quadraticCurveTo(side * width * 0.34, height * 0.01 + bobY, tipX, tipY);
  ctx.quadraticCurveTo(side * width * 0.14, 0.01 * height + bobY, baseX, baseY);
  ctx.quadraticCurveTo(
    side * width * 0.08,
    -height * 0.17 + bobY,
    topInnerX,
    -height * 0.25 + bobY,
  );
  ctx.closePath();
  ctx.fill();

  ctx.save();
  ctx.globalAlpha *= 0.24;
  ctx.fillStyle = innerFill;
  ctx.beginPath();
  ctx.moveTo(side * width * 0.16, -height * 0.22 + bobY);
  ctx.quadraticCurveTo(
    side * width * 0.24,
    -height * 0.24 + bobY,
    side * width * 0.3,
    -height * 0.2 + bobY,
  );
  ctx.quadraticCurveTo(
    side * width * 0.34,
    -height * 0.13 + bobY,
    side * width * 0.29,
    -height * 0.03 + bobY,
  );
  ctx.quadraticCurveTo(
    side * width * 0.22,
    0.01 * height + bobY,
    side * width * 0.16,
    -height * 0.04 + bobY,
  );
  ctx.quadraticCurveTo(
    side * width * 0.13,
    -height * 0.13 + bobY,
    side * width * 0.16,
    -height * 0.22 + bobY,
  );
  ctx.closePath();
  ctx.fill();
  ctx.restore();
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
    const lineWidth = Math.max(3, Math.min(width, height) * 0.18);
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
    const lineWidth = Math.max(3, Math.min(width, height) * 0.2);
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

  roundedRect(ctx, -width * 0.5, -height * 0.5, width, height, Math.min(width, height) * 0.34);
}

function drawDogNose(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  ctx.beginPath();
  ctx.moveTo(-width * 0.42, -height * 0.18);
  ctx.lineTo(width * 0.42, -height * 0.18);
  ctx.lineTo(width * 0.2, height * 0.36);
  ctx.quadraticCurveTo(0, height * 0.5, -width * 0.2, height * 0.36);
  ctx.closePath();
}

function drawDogMouth(
  ctx: CanvasRenderingContext2D,
  mouthWidth: number,
  height: number,
  curvature: number,
  openness: number,
): void {
  const upperWidth = mouthWidth * (1.26 + Math.max(0, curvature) * 0.08);
  const upperDrop = height * (0.2 + curvature * 0.12);
  const jawWidth = mouthWidth * (0.44 + openness * 0.08);
  const jawHeight = height * (0.28 + openness * 0.9);
  const jawTopY = height * (0.08 + openness * 0.06 + Math.max(0, curvature) * 0.03);
  const smileLift = curvature * height * 0.18;

  ctx.beginPath();
  ctx.moveTo(-upperWidth * 0.5, -height * 0.04);
  ctx.quadraticCurveTo(-upperWidth * 0.35, upperDrop, -jawWidth * 0.3, jawTopY + smileLift);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(upperWidth * 0.5, -height * 0.04);
  ctx.quadraticCurveTo(upperWidth * 0.35, upperDrop, jawWidth * 0.3, jawTopY + smileLift);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(-jawWidth * 0.36, jawTopY - jawHeight * 0.22 + smileLift);
  ctx.lineTo(-jawWidth * 0.36, jawTopY + jawHeight * 0.12 + smileLift);
  ctx.quadraticCurveTo(
    0,
    jawTopY + jawHeight * 0.56 + smileLift,
    jawWidth * 0.36,
    jawTopY + jawHeight * 0.12 + smileLift,
  );
  ctx.lineTo(jawWidth * 0.36, jawTopY - jawHeight * 0.22 + smileLift);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(0, jawTopY - jawHeight * 0.14 + smileLift);
  ctx.lineTo(0, jawTopY + jawHeight * (0.2 + openness * 0.1) + smileLift);
  ctx.stroke();
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

    ctx.save();
    ctx.fillStyle = theme.foreground;
    ctx.shadowColor = theme.glow;
    ctx.shadowBlur = Math.max(0, width * 0.024);
    drawEar(ctx, width, height, -1, bobY, theme.panel);
    drawEar(ctx, width, height, 1, bobY, theme.panel);
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
    const eyeWidth = baseWidth * (0.74 + openness * 0.14);
    const eyeShape = parts.eyeShape ?? "rounded";
    const glyphEye = eyeShape === "chevron" || eyeShape === "crescent" || eyeShape === "tear";
    const brightness = clamp(pose.brightness, 0.1, 1.8);
    const pupilSize = Math.max(4, Math.min(eyeWidth, eyeHeight) * 0.17);

    ctx.save();
    ctx.translate(params.centerX, params.centerY);
    ctx.rotate(pose.tilt * 0.34);
    ctx.globalAlpha *= brightness;

    if (eyeHeight < params.height * 0.16) {
      ctx.strokeStyle = theme.foreground;
      ctx.lineWidth = Math.max(3, params.height * 0.12);
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(-eyeWidth * 0.42, 0);
      ctx.quadraticCurveTo(0, eyeHeight * 0.18, eyeWidth * 0.42, 0);
      ctx.stroke();
      ctx.restore();
      return;
    }

    ctx.fillStyle = theme.foreground;
    ctx.strokeStyle = theme.foreground;
    ctx.shadowColor = theme.glow;
    ctx.shadowBlur = Math.max(0, Math.min(eyeWidth, eyeHeight) * 0.32);

    if (glyphEye) {
      drawGlyphEye(ctx, eyeShape, eyeWidth, eyeHeight, side, openness, squint);
      ctx.restore();
      return;
    }

    drawDogEyeShell(ctx, eyeShape, eyeWidth, eyeHeight);
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.fillStyle = theme.panel;
    drawDogEyeShell(ctx, eyeShape, eyeWidth * 0.56, eyeHeight * 0.56);
    ctx.fill();

    if (eyeShapeSupportsPupil(eyeShape)) {
      const pupilX = clamp(pose.pupilX, -1, 1) * eyeWidth * 0.18;
      const pupilY = clamp(pose.pupilY, -1, 1) * eyeHeight * 0.18;
      ctx.fillStyle = PUPIL_FILL;
      roundedRect(
        ctx,
        pupilX - pupilSize * 0.42,
        pupilY - pupilSize * 0.42,
        pupilSize * 0.84,
        pupilSize * 0.84,
        pupilSize * 0.26,
      );
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
    ctx.lineWidth = Math.max(2, params.height * 0.7);
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

    ctx.save();
    ctx.translate(params.centerX, params.centerY);
    ctx.rotate(pose.tilt * 0.3);
    ctx.lineWidth = Math.max(3, width * 0.085);
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

    ctx.save();
    ctx.translate(params.centerX, params.centerY);
    ctx.rotate(pose.tilt * 0.22);
    ctx.lineWidth = Math.max(3, params.height * 0.08);
    ctx.strokeStyle = theme.foreground;
    ctx.globalAlpha *= brightness;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.shadowColor = theme.glow;
    ctx.shadowBlur = Math.max(0, params.height * 0.12);
    drawDogMouth(ctx, width, params.height, curvature, openness);
    ctx.restore();
  },

  getFaceVisibility(): number {
    return 1;
  },

  getScrambleStrength(_emotionName, baseDistortion): number {
    return baseDistortion * 0.3;
  },
};
