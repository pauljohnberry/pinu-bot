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
