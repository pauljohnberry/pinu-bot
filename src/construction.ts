import { roundedRect } from "./drawUtils.js";
import type { StyleDefinition } from "./types.js";

export type ConstructionSide = "left" | "right";

export interface ConstructionFrame {
  width: number;
  height: number;
  centerX: number;
  centerY: number;
}

export interface ConstructionLayout {
  eyeGap: number;
  eyeLineY: number;
  centerlineBias: number;
}

export interface ConstructionAnchors {
  centerX: number;
  centerY: number;
  eyeLineY: number;
  leftEyeX: number;
  rightEyeX: number;
}

export interface ConstructionPlate {
  kind: "plate";
  width: number;
  height: number;
  y: number;
  inset: number;
  taper: number;
  tilt: number;
  radius: number;
}

export interface ConstructionCapsule {
  kind: "capsule";
  width: number;
  height: number;
  y: number;
  tilt: number;
  radius: number;
}

export interface ConstructionNotch {
  kind: "notch";
  width: number;
  height: number;
  y: number;
}

export interface ConstructionWedge {
  kind: "wedge";
  width: number;
  height: number;
  y: number;
  spread: number;
}

export type ConstructionShape =
  | ConstructionPlate
  | ConstructionCapsule
  | ConstructionNotch
  | ConstructionWedge;

export interface CharacterConstruction {
  layout: ConstructionLayout;
  mask?: {
    upper?: ConstructionShape;
    lower?: ConstructionShape;
  };
  eyes: {
    socket?: ConstructionShape;
    shell: ConstructionShape;
    pupil?: ConstructionShape;
  };
  nose?: ConstructionShape;
  mouth?: {
    anchorY: number;
    width: number;
    opennessBias?: number;
  };
}

const DEFAULT_LAYOUT: ConstructionLayout = {
  eyeGap: 0.22,
  eyeLineY: -0.02,
  centerlineBias: 0,
};

export function createConstructionFrame(
  width: number,
  height: number,
  options: Partial<Pick<ConstructionFrame, "centerX" | "centerY">> = {},
): ConstructionFrame {
  return {
    width,
    height,
    centerX: options.centerX ?? 0,
    centerY: options.centerY ?? 0,
  };
}

export function createConstructionLayout(
  overrides: Partial<ConstructionLayout> = {},
): ConstructionLayout {
  return {
    eyeGap: overrides.eyeGap ?? DEFAULT_LAYOUT.eyeGap,
    eyeLineY: overrides.eyeLineY ?? DEFAULT_LAYOUT.eyeLineY,
    centerlineBias: overrides.centerlineBias ?? DEFAULT_LAYOUT.centerlineBias,
  };
}

export function createStyleConstructionLayout(
  style: Pick<StyleDefinition, "eyeGap" | "eyeY">,
  overrides: Partial<Pick<ConstructionLayout, "centerlineBias">> = {},
): ConstructionLayout {
  const layoutOverrides: Partial<ConstructionLayout> = {
    // style.eyeGap is center-to-eye; layout.eyeGap is the full eye-to-eye span
    eyeGap: style.eyeGap * 2,
    eyeLineY: style.eyeY,
  };

  if (overrides.centerlineBias !== undefined) {
    layoutOverrides.centerlineBias = overrides.centerlineBias;
  }

  return createConstructionLayout(layoutOverrides);
}

export function resolveConstructionAnchors(
  frame: ConstructionFrame,
  layout: ConstructionLayout,
): ConstructionAnchors {
  const centerX = frame.centerX + frame.width * layout.centerlineBias;
  const eyeOffset = frame.width * layout.eyeGap * 0.5;

  return {
    centerX,
    centerY: frame.centerY,
    eyeLineY: frame.centerY + frame.height * layout.eyeLineY,
    leftEyeX: centerX - eyeOffset,
    rightEyeX: centerX + eyeOffset,
  };
}

export function resolveEyeAnchor(
  anchors: ConstructionAnchors,
  side: ConstructionSide,
): { x: number; y: number } {
  return {
    x: side === "left" ? anchors.leftEyeX : anchors.rightEyeX,
    y: anchors.eyeLineY,
  };
}

export function createPlate(
  config: Omit<ConstructionPlate, "kind" | "inset" | "taper" | "tilt" | "radius"> &
    Partial<Pick<ConstructionPlate, "inset" | "taper" | "tilt" | "radius">>,
): ConstructionPlate {
  return {
    kind: "plate",
    width: config.width,
    height: config.height,
    y: config.y,
    inset: config.inset ?? 0,
    taper: config.taper ?? 0,
    tilt: config.tilt ?? 0,
    radius: config.radius ?? 0.18,
  };
}

export function createCapsule(
  config: Omit<ConstructionCapsule, "kind" | "tilt" | "radius"> &
    Partial<Pick<ConstructionCapsule, "tilt" | "radius">>,
): ConstructionCapsule {
  return {
    kind: "capsule",
    width: config.width,
    height: config.height,
    y: config.y,
    tilt: config.tilt ?? 0,
    radius: config.radius ?? 0.5,
  };
}

export function createNotch(config: Omit<ConstructionNotch, "kind">): ConstructionNotch {
  return {
    kind: "notch",
    width: config.width,
    height: config.height,
    y: config.y,
  };
}

export function createWedge(
  config: Omit<ConstructionWedge, "kind" | "spread"> & Partial<Pick<ConstructionWedge, "spread">>,
): ConstructionWedge {
  return {
    kind: "wedge",
    width: config.width,
    height: config.height,
    y: config.y,
    spread: config.spread ?? 0.28,
  };
}

/**
 * Traces a capsule (rounded rectangle) path. Unlike {@link traceConstructionPlate},
 * this applies offsets arithmetically rather than via canvas transforms,
 * so it does not call save/restore.
 */
export function traceConstructionCapsule(
  ctx: CanvasRenderingContext2D,
  shape: ConstructionCapsule,
  centerX = 0,
  centerY = 0,
): void {
  roundedRect(
    ctx,
    centerX - shape.width * 0.5,
    centerY + shape.y - shape.height * 0.5,
    shape.width,
    shape.height,
    shape.height * shape.radius,
  );
}

/**
 * Traces a plate (tapered quadrilateral) path. Uses save/restore because the
 * plate's tilt requires a canvas rotation transform.
 */
export function traceConstructionPlate(
  ctx: CanvasRenderingContext2D,
  shape: ConstructionPlate,
  centerX = 0,
  centerY = 0,
): void {
  const halfWidth = shape.width * 0.5;
  const halfHeight = shape.height * 0.5;
  const taperOffset = shape.width * shape.taper * 0.5;
  const insetOffset = shape.width * shape.inset * 0.5;

  ctx.save();
  ctx.translate(centerX, centerY + shape.y);
  ctx.rotate(shape.tilt);
  ctx.beginPath();
  ctx.moveTo(-halfWidth + insetOffset, -halfHeight);
  ctx.lineTo(halfWidth - insetOffset, -halfHeight);
  ctx.lineTo(halfWidth - taperOffset, halfHeight);
  ctx.lineTo(-halfWidth + taperOffset, halfHeight);
  ctx.closePath();
  ctx.restore();
}

export function traceConstructionCurve(
  ctx: CanvasRenderingContext2D,
  startX: number,
  startY: number,
  controlX: number,
  controlY: number,
  endX: number,
  endY: number,
): void {
  ctx.beginPath();
  ctx.moveTo(startX, startY);
  ctx.quadraticCurveTo(controlX, controlY, endX, endY);
}

export function traceConstructionChevron(
  ctx: CanvasRenderingContext2D,
  leftX: number,
  leftY: number,
  apexX: number,
  apexY: number,
  rightX: number,
  rightY: number,
): void {
  ctx.beginPath();
  ctx.moveTo(leftX, leftY);
  ctx.lineTo(apexX, apexY);
  ctx.lineTo(rightX, rightY);
}

export function traceConstructionDroplet(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  shoulderXRatio = 0.28,
): void {
  const topY = -height * 0.48;
  const bottomY = height * 0.48;
  const shoulderX = width * shoulderXRatio;

  ctx.beginPath();
  ctx.moveTo(0, topY);
  ctx.bezierCurveTo(shoulderX, -height * 0.28, shoulderX, height * 0.16, 0, bottomY);
  ctx.bezierCurveTo(-shoulderX, height * 0.16, -shoulderX, -height * 0.28, 0, topY);
  ctx.closePath();
}

export function traceConstructionDiamond(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
): void {
  ctx.beginPath();
  ctx.moveTo(0, -height * 0.4);
  ctx.lineTo(width * 0.36, 0);
  ctx.lineTo(0, height * 0.48);
  ctx.lineTo(-width * 0.36, 0);
  ctx.closePath();
}

export function traceConstructionTriangle(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  shoulderRatio = 0.36,
): void {
  ctx.beginPath();
  ctx.moveTo(0, -height * 0.42);
  ctx.lineTo(width * shoulderRatio, height * 0.42);
  ctx.lineTo(-width * shoulderRatio, height * 0.42);
  ctx.closePath();
}

export function traceConstructionQuad(
  ctx: CanvasRenderingContext2D,
  points: ReadonlyArray<readonly [number, number]>,
): void {
  const [firstPoint, ...restPoints] = points;
  if (!firstPoint) {
    return;
  }

  ctx.beginPath();
  ctx.moveTo(firstPoint[0], firstPoint[1]);
  for (const [x, y] of restPoints) {
    ctx.lineTo(x, y);
  }
  ctx.closePath();
}
