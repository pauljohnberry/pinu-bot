import type {
  BrowDrawParams,
  CharacterDefinition,
  DrawContext,
  EyeDrawParams,
  MouthDrawParams,
  NoseDrawParams,
} from "../character.js";
import {
  createCapsule,
  createPlate,
  traceConstructionCapsule,
  traceConstructionCurve,
  traceConstructionDiamond,
  traceConstructionPlate,
  traceConstructionQuad,
  traceConstructionTriangle,
} from "../construction.js";
import { clamp, drawPixelGlyph, ease, roundedRect, wave } from "../drawUtils.js";
import {
  drawStandardGlyphEye,
  eyeShapeSupportsPupil,
  resolveStandardEyeMetrics,
  resolveStandardMouthMetrics,
  resolveStandardNoseMetrics,
} from "../standardFace.js";
import { STYLE_PRESETS } from "../styles.js";
import type { FacePose } from "../types.js";

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

function drawEyeShell(
  ctx: CanvasRenderingContext2D,
  shape: string,
  width: number,
  height: number,
  radius: number,
): void {
  traceConstructionCapsule(
    ctx,
    createCapsule({
      width,
      height,
      y: 0,
      radius: shape === "block" ? 0 : shape === "wide" ? 0.5 : radius / Math.max(1, height),
    }),
  );
}

function drawNoseShape(
  ctx: CanvasRenderingContext2D,
  shape: string,
  width: number,
  height: number,
): void {
  if (shape === "pointed") {
    traceConstructionTriangle(ctx, width, height);
    ctx.stroke();
    return;
  }

  if (shape === "bridge") {
    traceConstructionCapsule(
      ctx,
      createCapsule({
        width: width * 0.24,
        height: height * 0.84,
        y: 0,
        radius: (width * 0.08) / Math.max(1, height * 0.84),
      }),
    );
    ctx.fill();
    return;
  }

  if (shape === "button") {
    traceConstructionCapsule(
      ctx,
      createCapsule({
        width: width * 0.32,
        height: height * 0.32,
        y: 0,
        radius: (width * 0.12) / Math.max(1, height * 0.32),
      }),
    );
    ctx.fill();
    return;
  }

  traceConstructionDiamond(ctx, width, height);
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
  if (shape === "band") {
    const thickness = Math.max(height * 0.18, openDepth * 0.88 + height * 0.16);
    const leftX = -mouthWidth * 0.5;
    const rightX = mouthWidth * 0.5;
    const endDip = lift * 0.18;
    const centerDip = lift * 0.72;
    const skew = Math.max(-height * 0.28, Math.min(height * 0.28, lift * 0.24));
    const topY = -thickness * 0.5;
    const bottomY = thickness * 0.5;

    traceConstructionCurve(
      ctx,
      leftX,
      topY + endDip - skew,
      0,
      topY + centerDip,
      rightX,
      topY + endDip + skew,
    );
    ctx.lineTo(rightX, bottomY + endDip + skew);
    ctx.quadraticCurveTo(0, bottomY + centerDip + openDepth * 0.12, leftX, bottomY + endDip - skew);
    ctx.closePath();
    ctx.stroke();
    return;
  }

  if (shape === "block") {
    const barHeight = Math.max(height * 0.12, openDepth * 0.8 + height * 0.08);
    traceConstructionQuad(ctx, [
      [-mouthWidth * 0.5, -barHeight * 0.35 + lift * 0.18],
      [mouthWidth * 0.5, -barHeight * 0.35 + lift * 0.18],
      [mouthWidth * 0.5, barHeight * 0.65 + lift * 0.34],
      [-mouthWidth * 0.5, barHeight * 0.65 + lift * 0.02],
    ]);
    ctx.stroke();
    return;
  }

  traceConstructionCurve(ctx, -mouthWidth * 0.5, 0, 0, lift, mouthWidth * 0.5, 0);
  ctx.stroke();

  if (openDepth > 1.5) {
    ctx.globalAlpha *= 0.86;
    traceConstructionCurve(
      ctx,
      -mouthWidth * 0.44,
      openDepth * 0.18,
      0,
      openDepth - lift * 0.16,
      mouthWidth * 0.44,
      openDepth * 0.18,
    );
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
    eyeShape: ["soft", "wide", "block", "sharp", "sleepy", "droplet"],
    noseShape: ["gem", "pointed", "bridge", "button"],
    mouthShape: ["soft", "band", "block"],
    browShape: ["soft", "bold", "angled"],
  },

  defaultParts: {
    eyeShape: "soft",
    eyeWidthScale: 1,
    eyeHeightScale: 1,
    noseShape: "bridge",
    mouthShape: "soft",
    browShape: "soft",
    scanlineThickness: 1.5,
    scanlineSpacing: 5,
  },

  defaultStyle: STYLE_PRESETS.classic,

  drawEye(dc: DrawContext, params: EyeDrawParams): void {
    const { ctx, theme, emotionName } = dc;
    const { pose, side, style, features, parts } = params;
    const eyeMetrics = resolveStandardEyeMetrics({
      width: params.width,
      height: params.height,
      openness: pose.openness,
      squint: pose.squint,
      eyeWidthScale: parts.eyeWidthScale,
      eyeHeightScale: parts.eyeHeightScale,
      widthBase: 0.82,
      widthOpenFactor: 0.14,
      pupilScale: style.pupilScale,
    });
    const { openness, squint } = eyeMetrics;
    const eyeHeight = eyeMetrics.height;
    const radius = eyeHeight * style.eyeCorner;
    const eyeWidth = eyeMetrics.width;
    const pupilSize = eyeMetrics.pupilSize;
    const lidCut = eyeHeight * squint * 0.24;
    const brightness = clamp(pose.brightness, 0.1, 1.8);
    const strokeWidth = Math.max(2, eyeHeight * 0.08);
    const eyeShape = parts.eyeShape ?? "soft";
    const glyphEye = eyeShape === "sharp" || eyeShape === "sleepy" || eyeShape === "droplet";

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
      drawStandardGlyphEye(ctx, eyeShape, eyeWidth, eyeHeight, side, openness, squint, {
        lineWidthFloor: 3,
        sharpLineScale: 0.18,
        sleepyLineScale: 0.2,
      });
      ctx.restore();
      return;
    }

    drawEyeShell(ctx, eyeShape, eyeWidth, eyeHeight, radius);
    ctx.fill();

    const innerEyeWidth = eyeWidth - strokeWidth * 2;
    const innerEyeHeight = eyeHeight - strokeWidth * 2;
    if (innerEyeWidth > 0 && innerEyeHeight > 0) {
      ctx.globalAlpha *= 0.35;
      drawEyeShell(ctx, eyeShape, innerEyeWidth, innerEyeHeight, Math.max(2, radius - strokeWidth));
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
      traceConstructionCapsule(
        ctx,
        createCapsule({
          width: pupilSize,
          height: pupilSize * (0.85 + (1 - openness) * 0.3),
          y: 0,
          radius: 0.28,
        }),
        pupilX,
        pupilY,
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
    const shape = parts.browShape ?? "soft";
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

    if (shape === "soft") {
      traceConstructionCurve(ctx, -params.width * 0.5, 0, 0, 0, params.width * 0.5, 0);
      ctx.stroke();
      ctx.restore();
      return;
    }

    if (shape === "bold") {
      traceConstructionCapsule(
        ctx,
        createCapsule({
          width: params.width,
          height: params.height,
          y: 0,
          radius: 0.3,
        }),
      );
      ctx.fill();
      ctx.restore();
      return;
    }

    traceConstructionPlate(
      ctx,
      createPlate({
        width: params.width,
        height: params.height,
        y: 0,
        inset: -0.14,
        taper: 0.3,
        tilt: 0.18,
        radius: 0,
      }),
    );
    ctx.fill();
    ctx.restore();
  },

  drawNose(dc: DrawContext, params: NoseDrawParams): void {
    const { ctx, theme } = dc;
    const { pose, parts } = params;
    const brightness = clamp(pose.brightness, 0.1, 1.6);
    const noseMetrics = resolveStandardNoseMetrics({
      width: params.width,
      height: params.height,
      scale: pose.scale,
    });
    const w = noseMetrics.width;
    const h = noseMetrics.height;

    ctx.save();
    ctx.translate(params.centerX, params.centerY);
    ctx.rotate(pose.tilt * 0.5);
    ctx.lineWidth = Math.max(2, w * 0.08);
    ctx.strokeStyle = theme.foreground;
    ctx.fillStyle = theme.foreground;
    ctx.globalAlpha *= brightness * 0.92;
    drawNoseShape(ctx, parts.noseShape ?? "gem", w, h);
    ctx.restore();
  },

  drawMouth(dc: DrawContext, params: MouthDrawParams): void {
    const { ctx, theme } = dc;
    const { pose, parts } = params;
    const mouthMetrics = resolveStandardMouthMetrics({
      width: params.width,
      height: params.height,
      openness: pose.openness,
      curvature: pose.curvature,
      widthScale: pose.width,
    });
    const brightness = clamp(pose.brightness, 0.1, 1.8);
    const mouthWidth = mouthMetrics.width;
    const lift = mouthMetrics.lift;
    const openDepth = mouthMetrics.openDepth;

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
    drawMouthShape(ctx, parts.mouthShape ?? "soft", mouthWidth, params.height, lift, openDepth);

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
