import type {
  BrowDrawParams,
  DrawContext,
  EyeDrawParams,
  MouthDrawParams,
  NoseDrawParams,
} from "./character.js";
import {
  createCapsule,
  createPlate,
  traceConstructionCapsule,
  traceConstructionCurve,
  traceConstructionDiamond,
  traceConstructionPlate,
  traceConstructionQuad,
  traceConstructionTriangle,
} from "./construction.js";
import { clamp } from "./drawUtils.js";
import type {
  StandardEyeMetricsOptions,
  StandardGlyphEyeOptions,
  StandardMouthMetricsOptions,
} from "./standardFace.js";
import {
  drawStandardGlyphEye,
  eyeShapeSupportsPupil,
  resolveStandardEyeMetrics,
  resolveStandardMouthMetrics,
  resolveStandardNoseMetrics,
} from "./standardFace.js";

export interface StandardEyeRendererOptions {
  defaultShape?: string;
  glyphShapes?: string[];
  resolveMetrics?: (
    dc: DrawContext,
    params: EyeDrawParams,
  ) => {
    widthBase?: number;
    widthOpenFactor?: number;
    opennessBase?: number;
    opennessFactor?: number;
    squintFactor?: number;
    minHeightFactor?: number;
    pupilScale?: number;
  };
  resolveRotation?: (dc: DrawContext, params: EyeDrawParams) => number;
  resolveBrightness?: (dc: DrawContext, params: EyeDrawParams) => number;
  resolvePupilFill?: (dc: DrawContext, params: EyeDrawParams) => string;
  resolvePupilOffset?: (
    dc: DrawContext,
    params: EyeDrawParams,
    eyeWidth: number,
    eyeHeight: number,
  ) => { x: number; y: number };
  resolveLidCut?: (
    dc: DrawContext,
    params: EyeDrawParams,
    eyeWidth: number,
    eyeHeight: number,
    squint: number,
  ) => number;
  glyphOptions?: {
    lineWidthFloor?: number;
    sharpLineScale?: number;
    sleepyLineScale?: number;
  };
  innerFillAlpha?: number;
  blinkThresholdFactor?: number;
  blinkStrokeMin?: number;
  blinkStrokeScale?: number;
  shellCornerScale?: number;
}

export interface StandardBrowRendererOptions {
  defaultShape?: string;
  resolveAngle?: (dc: DrawContext, params: BrowDrawParams) => number;
  resolveLift?: (dc: DrawContext, params: BrowDrawParams) => number;
  resolveBrightness?: (dc: DrawContext, params: BrowDrawParams) => number;
  renderSoft?: (ctx: CanvasRenderingContext2D, params: BrowDrawParams) => void;
  renderBold?: (ctx: CanvasRenderingContext2D, params: BrowDrawParams) => void;
  renderAngled?: (ctx: CanvasRenderingContext2D, params: BrowDrawParams) => void;
}

export interface StandardNoseRendererOptions {
  defaultShape?: string;
  resolveBrightness?: (dc: DrawContext, params: NoseDrawParams) => number;
  resolveRotation?: (dc: DrawContext, params: NoseDrawParams) => number;
  resolveOffset?: (dc: DrawContext, params: NoseDrawParams) => { x: number; y: number };
  resolveMetrics?: (
    dc: DrawContext,
    params: NoseDrawParams,
  ) => {
    scale?: number;
  };
  configureContext?: (
    ctx: CanvasRenderingContext2D,
    dc: DrawContext,
    params: NoseDrawParams,
    width: number,
    height: number,
  ) => void;
  renderShape?: (
    ctx: CanvasRenderingContext2D,
    shape: string,
    width: number,
    height: number,
  ) => void;
}

export interface StandardMouthRendererOptions {
  defaultShape?: string;
  resolveBrightness?: (dc: DrawContext, params: MouthDrawParams) => number;
  resolveRotation?: (dc: DrawContext, params: MouthDrawParams) => number;
  resolveMetrics?: (
    dc: DrawContext,
    params: MouthDrawParams,
  ) => {
    widthScale?: number;
    widthClampMin?: number;
    widthClampMax?: number;
    liftScale?: number;
    openDepthScale?: number;
  };
  renderShape?: (
    ctx: CanvasRenderingContext2D,
    shape: string,
    width: number,
    height: number,
    lift: number,
    openDepth: number,
  ) => void;
  closedOpenDepthThreshold?: number;
  closedLineWidthMin?: number;
  closedLineWidthScale?: number;
  openLineWidthMin?: number;
  openLineWidthScale?: number;
  closedBrightnessScale?: number;
  closedShadowScale?: number;
}

export function drawStandardEyeShell(
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

export function drawStandardNoseShape(
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

export function drawStandardMouthShape(
  ctx: CanvasRenderingContext2D,
  shape: string,
  width: number,
  height: number,
  lift: number,
  openDepth: number,
): void {
  if (shape === "band") {
    const thickness = Math.max(height * 0.18, openDepth * 0.88 + height * 0.16);
    const leftX = -width * 0.5;
    const rightX = width * 0.5;
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
      [-width * 0.5, -barHeight * 0.35 + lift * 0.18],
      [width * 0.5, -barHeight * 0.35 + lift * 0.18],
      [width * 0.5, barHeight * 0.65 + lift * 0.34],
      [-width * 0.5, barHeight * 0.65 + lift * 0.02],
    ]);
    ctx.stroke();
    return;
  }

  traceConstructionCurve(ctx, -width * 0.5, 0, 0, lift, width * 0.5, 0);
  ctx.stroke();

  if (openDepth > 1.5) {
    ctx.globalAlpha *= 0.86;
    traceConstructionCurve(
      ctx,
      -width * 0.44,
      openDepth * 0.18,
      0,
      openDepth - lift * 0.16,
      width * 0.44,
      openDepth * 0.18,
    );
    ctx.stroke();
  }
}

export function createStandardEyeRenderer(
  options: StandardEyeRendererOptions = {},
): (dc: DrawContext, params: EyeDrawParams) => void {
  const glyphShapes = new Set(options.glyphShapes ?? ["sharp", "sleepy", "droplet"]);

  return (dc: DrawContext, params: EyeDrawParams): void => {
    const { ctx, theme } = dc;
    const { pose, side, style, features, parts } = params;
    const metricOptions = options.resolveMetrics?.(dc, params) ?? {};
    const resolvedEyeMetricOptions: StandardEyeMetricsOptions = {
      width: params.width,
      height: params.height,
      openness: pose.openness,
      squint: pose.squint,
      eyeWidthScale: parts.eyeWidthScale,
      eyeHeightScale: parts.eyeHeightScale,
    };
    if (metricOptions.widthBase !== undefined) {
      resolvedEyeMetricOptions.widthBase = metricOptions.widthBase;
    }
    if (metricOptions.widthOpenFactor !== undefined) {
      resolvedEyeMetricOptions.widthOpenFactor = metricOptions.widthOpenFactor;
    }
    if (metricOptions.opennessBase !== undefined) {
      resolvedEyeMetricOptions.opennessBase = metricOptions.opennessBase;
    }
    if (metricOptions.opennessFactor !== undefined) {
      resolvedEyeMetricOptions.opennessFactor = metricOptions.opennessFactor;
    }
    if (metricOptions.squintFactor !== undefined) {
      resolvedEyeMetricOptions.squintFactor = metricOptions.squintFactor;
    }
    if (metricOptions.minHeightFactor !== undefined) {
      resolvedEyeMetricOptions.minHeightFactor = metricOptions.minHeightFactor;
    }
    if (metricOptions.pupilScale !== undefined) {
      resolvedEyeMetricOptions.pupilScale = metricOptions.pupilScale;
    }
    const eyeMetrics = resolveStandardEyeMetrics(resolvedEyeMetricOptions);
    const { openness, squint } = eyeMetrics;
    const eyeHeight = eyeMetrics.height;
    const eyeWidth = eyeMetrics.width;
    const pupilSize = eyeMetrics.pupilSize;
    const radius = eyeHeight * (options.shellCornerScale ?? style.eyeCorner);
    const brightness = options.resolveBrightness?.(dc, params) ?? clamp(pose.brightness, 0.1, 1.8);
    const strokeWidth = Math.max(
      options.blinkStrokeMin ?? 2,
      eyeHeight * (options.blinkStrokeScale ?? 0.08),
    );
    const eyeShape = parts.eyeShape ?? options.defaultShape ?? "soft";
    const glyphEye = glyphShapes.has(eyeShape);

    ctx.save();
    ctx.translate(params.centerX, params.centerY);
    ctx.rotate(options.resolveRotation?.(dc, params) ?? pose.tilt * 0.46);

    if (eyeHeight < params.height * (options.blinkThresholdFactor ?? 0.16)) {
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
      const glyphOptions: StandardGlyphEyeOptions = {};
      if (options.glyphOptions?.lineWidthFloor !== undefined) {
        glyphOptions.lineWidthFloor = options.glyphOptions.lineWidthFloor;
      }
      if (options.glyphOptions?.sharpLineScale !== undefined) {
        glyphOptions.sharpLineScale = options.glyphOptions.sharpLineScale;
      }
      if (options.glyphOptions?.sleepyLineScale !== undefined) {
        glyphOptions.sleepyLineScale = options.glyphOptions.sleepyLineScale;
      }
      drawStandardGlyphEye(
        ctx,
        eyeShape,
        eyeWidth,
        eyeHeight,
        side,
        openness,
        squint,
        glyphOptions,
      );
      ctx.restore();
      return;
    }

    drawStandardEyeShell(ctx, eyeShape, eyeWidth, eyeHeight, radius);
    ctx.fill();

    const innerEyeWidth = eyeWidth - strokeWidth * 2;
    const innerEyeHeight = eyeHeight - strokeWidth * 2;
    if (innerEyeWidth > 0 && innerEyeHeight > 0) {
      ctx.globalAlpha *= options.innerFillAlpha ?? 0.35;
      drawStandardEyeShell(
        ctx,
        eyeShape,
        innerEyeWidth,
        innerEyeHeight,
        Math.max(2, radius - strokeWidth),
      );
      ctx.fillStyle = theme.accent;
      ctx.fill();
    }

    if (features.pupils && eyeShapeSupportsPupil(eyeShape)) {
      const pupilOffset = options.resolvePupilOffset?.(dc, params, eyeWidth, eyeHeight) ?? {
        x: clamp(pose.pupilX, -1, 1) * eyeWidth * 0.46,
        y: clamp(pose.pupilY, -1, 1) * eyeHeight * 0.42,
      };
      ctx.save();
      ctx.globalAlpha = faceAlpha;
      ctx.fillStyle = options.resolvePupilFill?.(dc, params) ?? "#000000";
      ctx.shadowBlur = 0;
      ctx.shadowColor = "transparent";
      traceConstructionCapsule(
        ctx,
        createCapsule({
          width: pupilSize,
          height: pupilSize * (0.85 + (1 - openness) * 0.3),
          y: 0,
          radius: 0.28,
        }),
        pupilOffset.x,
        pupilOffset.y,
      );
      ctx.fill();
      ctx.restore();
    }

    const lidCut = options.resolveLidCut?.(dc, params, eyeWidth, eyeHeight, squint);
    if ((lidCut ?? 0) > 0.01) {
      ctx.fillStyle = theme.panel;
      ctx.globalAlpha = 0.2 + squint * 0.4;
      ctx.beginPath();
      ctx.moveTo(-eyeWidth * 0.54, -eyeHeight * 0.5);
      ctx.lineTo(eyeWidth * 0.54, -eyeHeight * 0.5 + side * (lidCut ?? 0) * 0.4);
      ctx.lineTo(eyeWidth * 0.54, -eyeHeight * 0.5 + (lidCut ?? 0));
      ctx.lineTo(-eyeWidth * 0.54, -eyeHeight * 0.5 + (lidCut ?? 0) * 1.1);
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();
  };
}

function defaultSoftBrow(ctx: CanvasRenderingContext2D, params: BrowDrawParams): void {
  traceConstructionCurve(ctx, -params.width * 0.5, 0, 0, 0, params.width * 0.5, 0);
  ctx.stroke();
}

function defaultBoldBrow(ctx: CanvasRenderingContext2D, params: BrowDrawParams): void {
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
}

function defaultAngledBrow(ctx: CanvasRenderingContext2D, params: BrowDrawParams): void {
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
}

export function createStandardBrowRenderer(
  options: StandardBrowRendererOptions = {},
): (dc: DrawContext, params: BrowDrawParams) => void {
  return (dc: DrawContext, params: BrowDrawParams): void => {
    const { ctx, theme } = dc;
    const shape = params.parts.browShape ?? options.defaultShape ?? "soft";
    const angle = options.resolveAngle?.(dc, params) ?? params.pose.tilt * 0.52;
    const lift =
      options.resolveLift?.(dc, params) ?? (1 - params.pose.openness) * params.height * 0.4;
    const brightness =
      options.resolveBrightness?.(dc, params) ?? clamp(params.pose.brightness, 0.1, 1.6) * 0.9;

    ctx.save();
    ctx.translate(params.centerX, params.centerY - lift);
    ctx.rotate(angle);
    ctx.fillStyle = theme.foreground;
    ctx.strokeStyle = theme.foreground;
    ctx.globalAlpha *= brightness;
    ctx.lineWidth = Math.max(2, params.height * 0.7);

    if (shape === "soft") {
      (options.renderSoft ?? defaultSoftBrow)(ctx, params);
      ctx.restore();
      return;
    }

    if (shape === "bold") {
      (options.renderBold ?? defaultBoldBrow)(ctx, params);
      ctx.restore();
      return;
    }

    (options.renderAngled ?? defaultAngledBrow)(ctx, params);
    ctx.restore();
  };
}

export function createStandardNoseRenderer(
  options: StandardNoseRendererOptions = {},
): (dc: DrawContext, params: NoseDrawParams) => void {
  return (dc: DrawContext, params: NoseDrawParams): void => {
    const { ctx, theme } = dc;
    const metrics = options.resolveMetrics?.(dc, params) ?? {};
    const noseMetrics = resolveStandardNoseMetrics({
      width: params.width,
      height: params.height,
      scale: metrics.scale ?? params.pose.scale,
    });
    const width = noseMetrics.width;
    const height = noseMetrics.height;
    const brightness =
      options.resolveBrightness?.(dc, params) ?? clamp(params.pose.brightness, 0.1, 1.6) * 0.92;
    const rotation = options.resolveRotation?.(dc, params) ?? params.pose.tilt * 0.5;
    const offset = options.resolveOffset?.(dc, params) ?? { x: 0, y: 0 };

    ctx.save();
    ctx.translate(params.centerX + offset.x, params.centerY + offset.y);
    ctx.rotate(rotation);
    ctx.lineWidth = Math.max(2, width * 0.08);
    ctx.strokeStyle = theme.foreground;
    ctx.fillStyle = theme.foreground;
    ctx.globalAlpha *= brightness;
    options.configureContext?.(ctx, dc, params, width, height);
    (options.renderShape ?? drawStandardNoseShape)(
      ctx,
      params.parts.noseShape ?? options.defaultShape ?? "gem",
      width,
      height,
    );
    ctx.restore();
  };
}

export function createStandardMouthRenderer(
  options: StandardMouthRendererOptions = {},
): (dc: DrawContext, params: MouthDrawParams) => void {
  return (dc: DrawContext, params: MouthDrawParams): void => {
    const { ctx, theme } = dc;
    const metricOptions = options.resolveMetrics?.(dc, params) ?? {};
    const resolvedMouthMetricOptions: StandardMouthMetricsOptions = {
      width: params.width,
      height: params.height,
      openness: params.pose.openness,
      curvature: params.pose.curvature,
      widthScale: metricOptions.widthScale ?? params.pose.width,
    };
    if (metricOptions.widthClampMin !== undefined) {
      resolvedMouthMetricOptions.widthClampMin = metricOptions.widthClampMin;
    }
    if (metricOptions.widthClampMax !== undefined) {
      resolvedMouthMetricOptions.widthClampMax = metricOptions.widthClampMax;
    }
    if (metricOptions.liftScale !== undefined) {
      resolvedMouthMetricOptions.liftScale = metricOptions.liftScale;
    }
    if (metricOptions.openDepthScale !== undefined) {
      resolvedMouthMetricOptions.openDepthScale = metricOptions.openDepthScale;
    }
    const mouthMetrics = resolveStandardMouthMetrics(resolvedMouthMetricOptions);
    const brightness =
      options.resolveBrightness?.(dc, params) ?? clamp(params.pose.brightness, 0.1, 1.8);
    const rotation = options.resolveRotation?.(dc, params) ?? params.pose.tilt * 0.26;
    const closedMouth = mouthMetrics.openDepth <= (options.closedOpenDepthThreshold ?? 1.5);

    ctx.save();
    ctx.translate(params.centerX, params.centerY);
    ctx.rotate(rotation);
    ctx.lineWidth = closedMouth
      ? Math.max(
          options.closedLineWidthMin ?? 3,
          params.height * (options.closedLineWidthScale ?? 0.12),
        )
      : Math.max(
          options.openLineWidthMin ?? 2,
          params.height * (options.openLineWidthScale ?? 0.08),
        );
    ctx.strokeStyle = theme.foreground;
    ctx.fillStyle = theme.foreground;
    ctx.globalAlpha *= brightness * (closedMouth ? (options.closedBrightnessScale ?? 1.08) : 1);
    if (closedMouth) {
      ctx.shadowBlur *= options.closedShadowScale ?? 1.2;
    }
    (options.renderShape ?? drawStandardMouthShape)(
      ctx,
      params.parts.mouthShape ?? options.defaultShape ?? "soft",
      mouthMetrics.width,
      params.height,
      mouthMetrics.lift,
      mouthMetrics.openDepth,
    );
    ctx.restore();
  };
}
