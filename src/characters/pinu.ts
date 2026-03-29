import type {
  BrowDrawParams,
  CharacterDefinition,
  DrawContext,
  EyeDrawParams,
  MouthDrawParams,
  NoseDrawParams,
} from "../character.js";
import { clamp, drawPixelGlyph, ease, roundedRect, wave } from "../drawUtils.js";
import { STYLE_PRESETS } from "../styles.js";
import type { EyeShapeName, FacePose, MouthShapeName, NoseShapeName } from "../types.js";

const PUPIL_FILL = "#000000";
const PUPIL_FILL_ANGRY = "#565d66";

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

function eyeShapeSupportsPupil(shape: string): boolean {
  return shape === "rounded" || shape === "capsule" || shape === "pixel";
}

function drawEyeShell(
  ctx: CanvasRenderingContext2D,
  shape: string,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
): void {
  if (shape === "pixel") {
    ctx.beginPath();
    ctx.rect(x, y, width, height);
    ctx.closePath();
    return;
  }

  if (shape === "capsule") {
    roundedRect(ctx, x, y, width, height, height * 0.5);
    return;
  }

  roundedRect(ctx, x, y, width, height, radius);
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
    const apexY = -height * (0.3 + squint * 0.08);
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

function drawNoseShape(
  ctx: CanvasRenderingContext2D,
  shape: string,
  width: number,
  height: number,
): void {
  if (shape === "triangle") {
    ctx.beginPath();
    ctx.moveTo(0, -height * 0.42);
    ctx.lineTo(width * 0.36, height * 0.42);
    ctx.lineTo(-width * 0.36, height * 0.42);
    ctx.closePath();
    ctx.stroke();
    return;
  }

  if (shape === "bar") {
    roundedRect(ctx, -width * 0.12, -height * 0.42, width * 0.24, height * 0.84, width * 0.08);
    ctx.fill();
    return;
  }

  if (shape === "dot") {
    roundedRect(ctx, -width * 0.16, -height * 0.16, width * 0.32, height * 0.32, width * 0.12);
    ctx.fill();
    return;
  }

  ctx.beginPath();
  ctx.moveTo(0, -height * 0.4);
  ctx.lineTo(width * 0.36, 0);
  ctx.lineTo(0, height * 0.48);
  ctx.lineTo(-width * 0.36, 0);
  ctx.closePath();
  ctx.stroke();
}

function drawMouthShape(
  ctx: CanvasRenderingContext2D,
  shape: string,
  mouthWidth: number,
  height: number,
  lift: number,
  openDepth: number,
): void {
  if (shape === "visor") {
    const thickness = Math.max(height * 0.18, openDepth * 0.88 + height * 0.16);
    const leftX = -mouthWidth * 0.5;
    const rightX = mouthWidth * 0.5;
    const endDip = lift * 0.18;
    const centerDip = lift * 0.72;
    const skew = Math.max(-height * 0.28, Math.min(height * 0.28, lift * 0.24));
    const topY = -thickness * 0.5;
    const bottomY = thickness * 0.5;

    ctx.beginPath();
    ctx.moveTo(leftX, topY + endDip - skew);
    ctx.quadraticCurveTo(0, topY + centerDip, rightX, topY + endDip + skew);
    ctx.lineTo(rightX, bottomY + endDip + skew);
    ctx.quadraticCurveTo(0, bottomY + centerDip + openDepth * 0.12, leftX, bottomY + endDip - skew);
    ctx.closePath();
    ctx.stroke();
    return;
  }

  if (shape === "pixel") {
    const barHeight = Math.max(height * 0.12, openDepth * 0.8 + height * 0.08);
    ctx.beginPath();
    ctx.moveTo(-mouthWidth * 0.5, -barHeight * 0.35 + lift * 0.18);
    ctx.lineTo(mouthWidth * 0.5, -barHeight * 0.35 + lift * 0.18);
    ctx.lineTo(mouthWidth * 0.5, barHeight * 0.65 + lift * 0.34);
    ctx.lineTo(-mouthWidth * 0.5, barHeight * 0.65 + lift * 0.02);
    ctx.closePath();
    ctx.stroke();
    return;
  }

  ctx.beginPath();
  ctx.moveTo(-mouthWidth * 0.5, 0);
  ctx.quadraticCurveTo(0, lift, mouthWidth * 0.5, 0);
  ctx.stroke();

  if (openDepth > 1.5) {
    ctx.globalAlpha *= 0.86;
    ctx.beginPath();
    ctx.moveTo(-mouthWidth * 0.44, openDepth * 0.18);
    ctx.quadraticCurveTo(0, openDepth - lift * 0.16, mouthWidth * 0.44, openDepth * 0.18);
    ctx.stroke();
  }
}

function resolveLoveTransitionProgress(dc: DrawContext): number {
  if (dc.emotionName !== "love") {
    return -1;
  }

  const elapsed = dc.elapsed - dc.emotionFromTime;
  if (elapsed < 0) {
    return -1;
  }

  const durationMs = 1180;
  if (elapsed > durationMs) {
    return -1;
  }

  return clamp(elapsed / durationMs, 0, 1);
}

export const pinuCharacter: CharacterDefinition = {
  name: "pinu",

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
    noseShape: "bar",
    mouthShape: "arc",
    browShape: "line",
    scanlineThickness: "1.5",
    scanlineSpacing: "5",
  },

  defaultStyle: STYLE_PRESETS.classic,

  drawEye(dc: DrawContext, params: EyeDrawParams): void {
    const { ctx, theme, emotionName } = dc;
    const { pose, side, style, features, parts } = params;
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
    const radius = eyeHeight * style.eyeCorner;
    const eyeWidth = baseWidth * (0.82 + openness * 0.14);
    const pupilSize = Math.max(4, Math.min(eyeWidth, eyeHeight) * style.pupilScale);
    const lidCut = eyeHeight * squint * 0.24;
    const brightness = clamp(pose.brightness, 0.1, 1.8);
    const strokeWidth = Math.max(2, eyeHeight * 0.08);
    const eyeShape = parts.eyeShape ?? "rounded";
    const glyphEye = eyeShape === "chevron" || eyeShape === "crescent" || eyeShape === "tear";

    ctx.save();
    ctx.translate(params.centerX, params.centerY);
    ctx.rotate(pose.tilt * 0.46);

    if (eyeHeight < params.height * 0.16) {
      ctx.lineWidth = strokeWidth;
      ctx.beginPath();
      ctx.moveTo(-eyeWidth * 0.5, 0);
      ctx.lineTo(eyeWidth * 0.5, 0);
      ctx.strokeStyle = theme.foreground;
      ctx.globalAlpha *= brightness;
      ctx.stroke();
      ctx.restore();
      return;
    }

    const faceAlpha = ctx.globalAlpha;
    ctx.globalAlpha *= brightness;
    if (glyphEye) {
      drawGlyphEye(ctx, eyeShape, eyeWidth, eyeHeight, side, openness, squint);
      ctx.restore();
      return;
    }

    drawEyeShell(ctx, eyeShape, -eyeWidth * 0.5, -eyeHeight * 0.5, eyeWidth, eyeHeight, radius);
    ctx.fill();

    const innerEyeWidth = eyeWidth - strokeWidth * 2;
    const innerEyeHeight = eyeHeight - strokeWidth * 2;
    if (innerEyeWidth > 0 && innerEyeHeight > 0) {
      ctx.globalAlpha *= 0.35;
      drawEyeShell(
        ctx,
        eyeShape,
        -eyeWidth * 0.5 + strokeWidth,
        -eyeHeight * 0.5 + strokeWidth,
        innerEyeWidth,
        innerEyeHeight,
        Math.max(2, radius - strokeWidth),
      );
      ctx.fillStyle = theme.accent;
      ctx.fill();
    }

    if (features.pupils && eyeShapeSupportsPupil(eyeShape)) {
      ctx.save();
      ctx.globalAlpha = faceAlpha;
      ctx.fillStyle = emotionName === "angry" ? PUPIL_FILL_ANGRY : PUPIL_FILL;
      ctx.shadowBlur = 0;
      ctx.shadowColor = "transparent";
      const pupilX = clamp(pose.pupilX, -1, 1) * eyeWidth * 0.46;
      const pupilY = clamp(pose.pupilY, -1, 1) * eyeHeight * 0.42;
      roundedRect(
        ctx,
        pupilX - pupilSize * 0.5,
        pupilY - pupilSize * 0.5,
        pupilSize,
        pupilSize * (0.85 + (1 - openness) * 0.3),
        pupilSize * 0.28,
      );
      ctx.fill();
      ctx.restore();
    }

    if (lidCut > 0.01) {
      ctx.fillStyle = theme.panel;
      ctx.globalAlpha = 0.2 + squint * 0.4;
      ctx.beginPath();
      ctx.moveTo(-eyeWidth * 0.54, -eyeHeight * 0.5);
      ctx.lineTo(eyeWidth * 0.54, -eyeHeight * 0.5 + side * lidCut * 0.4);
      ctx.lineTo(eyeWidth * 0.54, -eyeHeight * 0.5 + lidCut);
      ctx.lineTo(-eyeWidth * 0.54, -eyeHeight * 0.5 + lidCut * 1.1);
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();
  },

  drawBrow(dc: DrawContext, params: BrowDrawParams): void {
    const { ctx, theme, emotionName } = dc;
    const { pose, side, parts } = params;
    const shape = parts.browShape ?? "line";
    const baseAngle = pose.tilt * 0.52 + pose.squint * 0.18 * -side;
    const angle = emotionName === "confused" ? (side === -1 ? -0.2 : -0.08) : baseAngle;
    const lift = (1 - pose.openness) * params.height * 0.4;
    const brightness = clamp(pose.brightness, 0.1, 1.6);

    ctx.save();
    ctx.translate(params.centerX, params.centerY - lift);
    ctx.rotate(angle);
    ctx.fillStyle = theme.foreground;
    ctx.strokeStyle = theme.foreground;
    ctx.globalAlpha *= brightness * 0.9;
    ctx.lineWidth = Math.max(2, params.height * 0.7);

    if (shape === "line") {
      ctx.beginPath();
      ctx.moveTo(-params.width * 0.5, 0);
      ctx.lineTo(params.width * 0.5, 0);
      ctx.stroke();
      ctx.restore();
      return;
    }

    if (shape === "block") {
      roundedRect(
        ctx,
        -params.width * 0.5,
        -params.height * 0.5,
        params.width,
        params.height,
        params.height * 0.3,
      );
      ctx.fill();
      ctx.restore();
      return;
    }

    ctx.beginPath();
    ctx.moveTo(-params.width * 0.48, params.height * 0.35);
    ctx.lineTo(-params.width * 0.18, -params.height * 0.45);
    ctx.lineTo(params.width * 0.5, -params.height * 0.12);
    ctx.lineTo(params.width * 0.2, params.height * 0.45);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  },

  drawNose(dc: DrawContext, params: NoseDrawParams): void {
    const { ctx, theme } = dc;
    const { pose, parts } = params;
    const scale = clamp(pose.scale, 0.1, 1.5);
    const brightness = clamp(pose.brightness, 0.1, 1.6);
    const w = params.width * scale;
    const h = params.height * scale;

    ctx.save();
    ctx.translate(params.centerX, params.centerY);
    ctx.rotate(pose.tilt * 0.5);
    ctx.lineWidth = Math.max(2, w * 0.08);
    ctx.strokeStyle = theme.foreground;
    ctx.fillStyle = theme.foreground;
    ctx.globalAlpha *= brightness * 0.92;
    drawNoseShape(ctx, parts.noseShape ?? "diamond", w, h);
    ctx.restore();
  },

  drawMouth(dc: DrawContext, params: MouthDrawParams): void {
    const { ctx, theme } = dc;
    const { pose, parts } = params;
    const curvature = clamp(pose.curvature, -1, 1);
    const mouthWidth = params.width * clamp(pose.width, 0.2, 1.2);
    const openness = clamp(pose.openness, 0, 1);
    const brightness = clamp(pose.brightness, 0.1, 1.8);
    const lift = curvature * params.height * 0.6;
    const openDepth = openness * params.height * 0.8;

    ctx.save();
    ctx.translate(params.centerX, params.centerY);
    ctx.rotate(pose.tilt * 0.26);
    const closedMouth = openDepth <= 1.5;
    ctx.lineWidth = closedMouth
      ? Math.max(3, params.height * 0.12)
      : Math.max(2, params.height * 0.08);
    ctx.strokeStyle = theme.foreground;
    ctx.fillStyle = theme.foreground;
    ctx.globalAlpha *= brightness * (closedMouth ? 1.08 : 1);
    if (closedMouth) {
      ctx.shadowBlur *= 1.2;
    }
    drawMouthShape(ctx, parts.mouthShape ?? "arc", mouthWidth, params.height, lift, openDepth);

    ctx.restore();
  },

  drawOverlay(dc: DrawContext, width: number, height: number, pose: FacePose): void {
    const progress = resolveLoveTransitionProgress(dc);
    if (progress < 0 || dc.mode !== "face") {
      return;
    }

    const { ctx, theme } = dc;
    let heartAlpha = 0;
    let swell = 0;

    if (progress >= 0.08 && progress < 0.28) {
      const t = ease("smooth", (progress - 0.08) / 0.2);
      heartAlpha = t;
      swell = t;
    } else if (progress >= 0.28 && progress < 0.76) {
      const holdPulse = 0.92 + 0.08 * (0.5 + 0.5 * wave(dc.elapsed / 1000, 3.2));
      heartAlpha = 1;
      swell = holdPulse;
    } else if (progress >= 0.76 && progress < 0.92) {
      const t = 1 - ease("smooth", (progress - 0.76) / 0.16);
      heartAlpha = t;
      swell = 0.92 + t * 0.18;
    }

    if (heartAlpha <= 0.001) {
      return;
    }

    const heartSize = Math.min(width, height) * (0.12 + 0.2 * swell);
    const washAlpha = heartAlpha * 0.12;
    const centerY = -height * 0.05 + pose.global.bob * height * 0.05;

    ctx.save();
    ctx.globalAlpha *= washAlpha;
    ctx.fillStyle = theme.panel;
    roundedRect(
      ctx,
      -width * 0.24,
      -height * 0.26 + pose.global.bob * height * 0.06,
      width * 0.48,
      height * 0.38,
      Math.min(width, height) * 0.06,
    );
    ctx.fill();

    ctx.shadowColor = "#ff7b98";
    ctx.shadowBlur = heartSize * 0.4;
    ctx.globalAlpha = heartAlpha;
    ctx.fillStyle = "#ff305f";
    drawPixelGlyph(ctx, HEART_PATTERN, 0, centerY, heartSize);

    ctx.shadowBlur = 0;
    ctx.globalAlpha = heartAlpha * 0.3;
    ctx.fillStyle = "#ff9ab3";
    drawPixelGlyph(ctx, HEART_PATTERN, 0, centerY - heartSize * 0.04, heartSize * 0.62);
    ctx.restore();
  },

  getFaceVisibility(dc: DrawContext): number {
    const progress = resolveLoveTransitionProgress(dc);
    if (progress < 0) {
      return 1;
    }

    if (progress < 0.14) {
      return 1 - ease("smooth", progress / 0.14);
    }

    if (progress < 0.82) {
      return 0;
    }

    return ease("smooth", (progress - 0.82) / 0.18);
  },

  getScrambleStrength(emotionName, baseDistortion): number {
    const angryStrength = emotionName === "angry" ? 0.16 : 0;
    return Math.max(angryStrength, baseDistortion * 0.7);
  },
};
