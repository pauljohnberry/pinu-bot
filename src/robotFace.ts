import { ACTION_DEFINITIONS } from "./actions.js";
import type { CharacterDefinition, DrawContext } from "./character.js";
import { getCharacter, registerCharacter } from "./character.js";
import { kibaCharacter, pinuCharacter } from "./characters/index.js";
import {
  createConstructionFrame,
  createStyleConstructionLayout,
  resolveConstructionAnchors,
} from "./construction.js";
import { clamp, drawPixelGlyph, ease, HEART_PATTERN, roundedRect, wave } from "./drawUtils.js";
import { EMOTIONS } from "./emotions.js";
import { FACE_THEMES } from "./faceThemes.js";
import type { FaceStateDefinition } from "./stateDefinitions.js";
import { FACE_FEATURE_DEFAULTS, PART_STYLE_DEFAULTS, STYLE_PRESETS } from "./styles.js";
import { THEMES } from "./themes.js";
import type {
  ActionName,
  ActionOptions,
  BackgroundFxConfig,
  BackgroundFxMode,
  DisplayMode,
  DisplayName,
  EmoteOptions,
  EmotionName,
  EyeControlApi,
  EyePose,
  FaceFeatures,
  FacePose,
  FaceThemeDefinition,
  FaceThemeName,
  GlobalPose,
  MouthControlApi,
  MouthExpressionOptions,
  MouthPose,
  NoseControlApi,
  NosePose,
  PartialFacePose,
  PartStyleConfig,
  RobotFace,
  RobotFaceConfig,
  RobotFaceOptions,
  SpeakOptions,
  StyleDefinition,
  StylePresetName,
  SymbolName,
  ThemeDefinition,
  ThemeName,
  TimedActionOptions,
  WinkSide,
} from "./types.js";

registerCharacter(pinuCharacter);
registerCharacter(kibaCharacter);

type EasingName = FaceStateDefinition["ease"];
type ResolvedBackgroundFx = Required<BackgroundFxConfig>;
type ReplaceActionName = Extract<ActionName, "thinking" | "listening" | "sleeping" | "offline">;
type OverlayActionName = Extract<ActionName, "bootUp" | "glitch">;

const UNSET = Number.NaN;

const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

const damp = (current: number, target: number, dt: number, speed: number): number =>
  lerp(current, target, 1 - Math.exp(-speed * dt));

const createPose = (): FacePose => ({
  leftEye: { openness: 0, squint: 0, tilt: 0, pupilX: 0, pupilY: 0, brightness: 1 },
  rightEye: { openness: 0, squint: 0, tilt: 0, pupilX: 0, pupilY: 0, brightness: 1 },
  nose: { scale: 1, tilt: 0, brightness: 1 },
  mouth: { openness: 0, curvature: 0, width: 1, tilt: 0, brightness: 1 },
  global: { glow: 1, bob: 0, jitter: 0, distortion: 0, flicker: 0, scanline: 0 },
});

const createUnsetPose = (): FacePose => ({
  leftEye: {
    openness: UNSET,
    squint: UNSET,
    tilt: UNSET,
    pupilX: UNSET,
    pupilY: UNSET,
    brightness: UNSET,
  },
  rightEye: {
    openness: UNSET,
    squint: UNSET,
    tilt: UNSET,
    pupilX: UNSET,
    pupilY: UNSET,
    brightness: UNSET,
  },
  nose: { scale: UNSET, tilt: UNSET, brightness: UNSET },
  mouth: { openness: UNSET, curvature: UNSET, width: UNSET, tilt: UNSET, brightness: UNSET },
  global: {
    glow: UNSET,
    bob: UNSET,
    jitter: UNSET,
    distortion: UNSET,
    flicker: UNSET,
    scanline: UNSET,
  },
});

const copyPose = (target: FacePose, source: FacePose): void => {
  Object.assign(target.leftEye, source.leftEye);
  Object.assign(target.rightEye, source.rightEye);
  Object.assign(target.nose, source.nose);
  Object.assign(target.mouth, source.mouth);
  Object.assign(target.global, source.global);
};

const lerpPose = (target: FacePose, from: FacePose, to: FacePose, t: number): void => {
  lerpEye(target.leftEye, from.leftEye, to.leftEye, t);
  lerpEye(target.rightEye, from.rightEye, to.rightEye, t);
  lerpNose(target.nose, from.nose, to.nose, t);
  lerpMouth(target.mouth, from.mouth, to.mouth, t);
  lerpGlobal(target.global, from.global, to.global, t);
};

const lerpEye = (target: EyePose, from: EyePose, to: EyePose, t: number): void => {
  target.openness = lerp(from.openness, to.openness, t);
  target.squint = lerp(from.squint, to.squint, t);
  target.tilt = lerp(from.tilt, to.tilt, t);
  target.pupilX = lerp(from.pupilX, to.pupilX, t);
  target.pupilY = lerp(from.pupilY, to.pupilY, t);
  target.brightness = lerp(from.brightness, to.brightness, t);
};

const lerpNose = (target: NosePose, from: NosePose, to: NosePose, t: number): void => {
  target.scale = lerp(from.scale, to.scale, t);
  target.tilt = lerp(from.tilt, to.tilt, t);
  target.brightness = lerp(from.brightness, to.brightness, t);
};

const lerpMouth = (target: MouthPose, from: MouthPose, to: MouthPose, t: number): void => {
  target.openness = lerp(from.openness, to.openness, t);
  target.curvature = lerp(from.curvature, to.curvature, t);
  target.width = lerp(from.width, to.width, t);
  target.tilt = lerp(from.tilt, to.tilt, t);
  target.brightness = lerp(from.brightness, to.brightness, t);
};

const lerpGlobal = (target: GlobalPose, from: GlobalPose, to: GlobalPose, t: number): void => {
  target.glow = lerp(from.glow, to.glow, t);
  target.bob = lerp(from.bob, to.bob, t);
  target.jitter = lerp(from.jitter, to.jitter, t);
  target.distortion = lerp(from.distortion, to.distortion, t);
  target.flicker = lerp(from.flicker, to.flicker, t);
  target.scanline = lerp(from.scanline, to.scanline, t);
};

const blendPoseFromNeutral = (emotion: FacePose, intensity: number, target: FacePose): void => {
  const neutral = EMOTIONS.neutral.pose;
  lerpPose(target, neutral, emotion, clamp(intensity, 0, 1));
};

const overrideValue = (base: number, value: number): number => (Number.isNaN(value) ? base : value);

const applyOverrides = (target: FacePose, overrides: FacePose): void => {
  target.leftEye.openness = overrideValue(target.leftEye.openness, overrides.leftEye.openness);
  target.leftEye.squint = overrideValue(target.leftEye.squint, overrides.leftEye.squint);
  target.leftEye.tilt = overrideValue(target.leftEye.tilt, overrides.leftEye.tilt);
  target.leftEye.pupilX = overrideValue(target.leftEye.pupilX, overrides.leftEye.pupilX);
  target.leftEye.pupilY = overrideValue(target.leftEye.pupilY, overrides.leftEye.pupilY);
  target.leftEye.brightness = overrideValue(
    target.leftEye.brightness,
    overrides.leftEye.brightness,
  );
  target.rightEye.openness = overrideValue(target.rightEye.openness, overrides.rightEye.openness);
  target.rightEye.squint = overrideValue(target.rightEye.squint, overrides.rightEye.squint);
  target.rightEye.tilt = overrideValue(target.rightEye.tilt, overrides.rightEye.tilt);
  target.rightEye.pupilX = overrideValue(target.rightEye.pupilX, overrides.rightEye.pupilX);
  target.rightEye.pupilY = overrideValue(target.rightEye.pupilY, overrides.rightEye.pupilY);
  target.rightEye.brightness = overrideValue(
    target.rightEye.brightness,
    overrides.rightEye.brightness,
  );
  target.nose.scale = overrideValue(target.nose.scale, overrides.nose.scale);
  target.nose.tilt = overrideValue(target.nose.tilt, overrides.nose.tilt);
  target.nose.brightness = overrideValue(target.nose.brightness, overrides.nose.brightness);
  target.mouth.openness = overrideValue(target.mouth.openness, overrides.mouth.openness);
  target.mouth.curvature = overrideValue(target.mouth.curvature, overrides.mouth.curvature);
  target.mouth.width = overrideValue(target.mouth.width, overrides.mouth.width);
  target.mouth.tilt = overrideValue(target.mouth.tilt, overrides.mouth.tilt);
  target.mouth.brightness = overrideValue(target.mouth.brightness, overrides.mouth.brightness);
  target.global.glow = overrideValue(target.global.glow, overrides.global.glow);
  target.global.bob = overrideValue(target.global.bob, overrides.global.bob);
  target.global.jitter = overrideValue(target.global.jitter, overrides.global.jitter);
  target.global.distortion = overrideValue(target.global.distortion, overrides.global.distortion);
  target.global.flicker = overrideValue(target.global.flicker, overrides.global.flicker);
  target.global.scanline = overrideValue(target.global.scanline, overrides.global.scanline);
};

const clearPose = (pose: FacePose): void => {
  copyPose(pose, createUnsetPose());
};

const resolveTheme = (theme: ThemeName | ThemeDefinition): ThemeDefinition =>
  typeof theme === "string" ? THEMES[theme] : theme;

const resolveStyle = (style: StylePresetName | StyleDefinition): StyleDefinition =>
  typeof style === "string" ? STYLE_PRESETS[style] : style;

const normalizeFeatures = (features: FaceFeatures): FaceFeatures => {
  const anyEyeVisible = features.leftEye || features.rightEye;
  if (anyEyeVisible) {
    return features;
  }

  return {
    ...features,
    brows: false,
    pupils: false,
  };
};

const mergeFeatures = (
  base: FaceFeatures,
  update: Partial<FaceFeatures> | undefined,
): FaceFeatures =>
  normalizeFeatures({
    ...base,
    ...update,
  });

const mergeParts = (
  base: Required<PartStyleConfig>,
  update: PartStyleConfig | undefined,
): Required<PartStyleConfig> => ({
  ...base,
  ...update,
});

const resolveFaceTheme = (faceTheme: FaceThemeName | FaceThemeDefinition): FaceThemeDefinition =>
  typeof faceTheme === "string" ? FACE_THEMES[faceTheme] : faceTheme;

const resolveCharacter = (character: CharacterDefinition | string): CharacterDefinition => {
  if (typeof character === "string") {
    const found = getCharacter(character);
    if (!found) {
      throw new Error(`Unknown character: "${character}". Register it with registerCharacter().`);
    }
    return found;
  }
  return character;
};

const resolveCharacterParts = (character: CharacterDefinition): Required<PartStyleConfig> => {
  return mergeParts(PART_STYLE_DEFAULTS, character.defaultParts);
};

const normalizePixelRatio = (value: number | undefined): number | undefined => {
  if (value === undefined) {
    return undefined;
  }

  return Math.max(1, Number.isFinite(value) ? value : 1);
};

const DEFAULT_BACKGROUND_FX: ResolvedBackgroundFx = {
  mode: "off",
  color: "#ffb36b",
  intensity: 0.22,
  pulseHz: 0.9,
};

const EMOTION_BACKGROUND_FX: Partial<Record<EmotionName, Omit<ResolvedBackgroundFx, "mode">>> = {
  happy: { color: "#ffcf76", intensity: 0.18, pulseHz: 1.1 },
  love: { color: "#ff7ea8", intensity: 0.22, pulseHz: 1.2 },
  sad: { color: "#5e89d6", intensity: 0.16, pulseHz: 0.45 },
  angry: { color: "#ff1408", intensity: 0.36, pulseHz: 2.35 },
  surprised: { color: "#fff2b1", intensity: 0.2, pulseHz: 1.6 },
  confused: { color: "#8bcbff", intensity: 0.17, pulseHz: 0.8 },
  excited: { color: "#ffd86d", intensity: 0.24, pulseHz: 2.3 },
};

const ACTION_BACKGROUND_FX: Partial<Record<ReplaceActionName, Omit<ResolvedBackgroundFx, "mode">>> =
  {
    thinking: { color: "#9ab0ff", intensity: 0.16, pulseHz: 0.55 },
    listening: { color: "#7de8ff", intensity: 0.14, pulseHz: 0.8 },
    sleeping: { color: "#6787b0", intensity: 0.12, pulseHz: 0.3 },
    offline: { color: "#34404f", intensity: 0.12, pulseHz: 0.2 },
  };

const OVERLAY_ACTION_BACKGROUND_FX: Record<
  OverlayActionName,
  Omit<ResolvedBackgroundFx, "mode">
> = {
  bootUp: { color: "#a8d7ff", intensity: 0.2, pulseHz: 2.1 },
  glitch: { color: "#ff789a", intensity: 0.26, pulseHz: 7 },
};

const EMOTION_SYMBOLS: Partial<Record<EmotionName, SymbolName>> = {
  love: "heart",
  confused: "question",
  surprised: "exclamation",
};

const ACTION_SYMBOLS: Partial<Record<ReplaceActionName, SymbolName>> = {
  thinking: "ellipsis",
  offline: "offline",
};

const OVERLAY_ACTION_SYMBOLS: Partial<Record<OverlayActionName, SymbolName>> = {
  bootUp: "loading",
  glitch: "warning",
};

const PIXEL_SYMBOL_PATTERNS: Record<Exclude<SymbolName, "loading">, readonly string[]> = {
  question: [
    "00111100",
    "01100110",
    "00000110",
    "00001100",
    "00011000",
    "00000000",
    "00011000",
    "00000000",
  ],
  exclamation: [
    "0000001100",
    "0010001100",
    "0010001100",
    "0010001100",
    "0010001100",
    "0010001100",
    "0000000000",
    "0000000000",
    "0010001100",
    "0000000000",
  ],
  ellipsis: [
    "0000000000",
    "0000000000",
    "0000000000",
    "0000000000",
    "0000000000",
    "1100110011",
    "1100110011",
    "0000000000",
  ],
  heart: HEART_PATTERN,
  offline: [
    "0000000011111100",
    "0000000000001100",
    "0000000000011000",
    "0000000000110000",
    "0000000001100000",
    "0000000011111100",
    "0000000000000000",
    "0000011110000000",
    "0000000110000000",
    "0000001100000000",
    "0000011110000000",
    "0000000000000000",
    "0011100000000000",
    "0000100000000000",
    "0001000000000000",
    "0011100000000000",
  ],
  warning: [
    "000001100000",
    "000011110000",
    "000110011000",
    "000110011000",
    "001110011100",
    "001110011100",
    "011110011110",
    "011111111110",
    "111110011111",
    "111111111111",
    "111111111111",
  ],
};

const PIXEL_LOADING_BAR = ["111", "111", "111", "111", "000", "000"] as const;

const DEFAULT_ACTION_DURATION_MS: Record<ReplaceActionName, number> = {
  thinking: 2400,
  listening: 2200,
  sleeping: 3600,
  offline: 2600,
};

const DEFAULT_OVERLAY_ACTION_DURATION_MS: Record<OverlayActionName, number> = {
  bootUp: 1450,
  glitch: 900,
};

const ACTION_BLEND_STRENGTH: Record<ReplaceActionName, number> = {
  thinking: 0.52,
  listening: 0.78,
  sleeping: 0.84,
  offline: 1,
};

const ACTION_BLEND_SPEED: Record<ReplaceActionName, number> = {
  thinking: 10,
  listening: 11,
  sleeping: 8,
  offline: 7,
};

const resolveBackgroundFx = (
  config: BackgroundFxMode | BackgroundFxConfig | undefined,
): ResolvedBackgroundFx => {
  if (!config) {
    return { ...DEFAULT_BACKGROUND_FX };
  }

  if (typeof config === "string") {
    return { ...DEFAULT_BACKGROUND_FX, mode: config };
  }

  return {
    ...DEFAULT_BACKGROUND_FX,
    ...config,
    mode: config.mode ?? DEFAULT_BACKGROUND_FX.mode,
  };
};

const neutralMouth = EMOTIONS.neutral.pose.mouth;

const mouthPreset = (
  kind: "smile" | "frown" | "pout",
  amount: number,
  options: MouthExpressionOptions = {},
): Partial<MouthPose> => {
  const t = clamp(amount, 0, 1);
  const open = options.open ?? false;

  if (kind === "smile") {
    return {
      openness: lerp(neutralMouth.openness, open ? 0.08 : 0.01, t),
      curvature: lerp(neutralMouth.curvature, 0.56, t),
      width: lerp(neutralMouth.width, 0.96, t),
      tilt: lerp(neutralMouth.tilt, 0, t),
      brightness: lerp(neutralMouth.brightness, 1.04, t),
    };
  }

  if (kind === "frown") {
    return {
      openness: lerp(neutralMouth.openness, open ? 0.08 : 0.01, t),
      curvature: lerp(neutralMouth.curvature, -0.56, t),
      width: lerp(neutralMouth.width, 0.94, t),
      tilt: lerp(neutralMouth.tilt, 0, t),
      brightness: lerp(neutralMouth.brightness, 1.02, t),
    };
  }

  return {
    openness: lerp(neutralMouth.openness, open ? 0.08 : 0.03, t),
    curvature: lerp(neutralMouth.curvature, -0.02, t),
    width: lerp(neutralMouth.width, 0.44, t),
    tilt: lerp(neutralMouth.tilt, 0, t),
    brightness: lerp(neutralMouth.brightness, 1.04, t),
  };
};

const assignPartialPose = (target: FacePose, value: PartialFacePose): void => {
  if (value.leftEye) {
    Object.assign(target.leftEye, value.leftEye);
  }
  if (value.rightEye) {
    Object.assign(target.rightEye, value.rightEye);
  }
  if (value.nose) {
    Object.assign(target.nose, value.nose);
  }
  if (value.mouth) {
    Object.assign(target.mouth, value.mouth);
  }
  if (value.global) {
    Object.assign(target.global, value.global);
  }
};

class EyeControl<TDone> implements EyeControlApi<TDone> {
  constructor(
    private readonly pose: FacePose,
    private readonly select: (pose: FacePose) => EyePose[],
    private readonly doneValue: TDone,
  ) {}

  open(value: number): EyeControl<TDone> {
    for (const eye of this.select(this.pose)) {
      eye.openness = clamp(value, 0, 1);
    }
    return this;
  }

  squint(value: number): EyeControl<TDone> {
    for (const eye of this.select(this.pose)) {
      eye.squint = clamp(value, 0, 1);
    }
    return this;
  }

  tilt(value: number): EyeControl<TDone> {
    for (const eye of this.select(this.pose)) {
      eye.tilt = clamp(value, -1, 1);
    }
    return this;
  }

  pupil(x: number, y: number): EyeControl<TDone> {
    for (const eye of this.select(this.pose)) {
      eye.pupilX = clamp(x, -1, 1);
      eye.pupilY = clamp(y, -1, 1);
    }
    return this;
  }

  brightness(value: number): EyeControl<TDone> {
    for (const eye of this.select(this.pose)) {
      eye.brightness = clamp(value, 0, 2);
    }
    return this;
  }

  done(): TDone {
    return this.doneValue;
  }
}

class MouthControl<TDone> implements MouthControlApi<TDone> {
  constructor(
    private readonly pose: FacePose,
    private readonly doneValue: TDone,
  ) {}

  open(value: number): MouthControl<TDone> {
    this.pose.mouth.openness = clamp(value, 0, 1);
    return this;
  }

  smile(value: number): MouthControl<TDone> {
    this.pose.mouth.curvature = clamp(value, -1, 1);
    return this;
  }

  width(value: number): MouthControl<TDone> {
    this.pose.mouth.width = clamp(value, 0.2, 1.2);
    return this;
  }

  tilt(value: number): MouthControl<TDone> {
    this.pose.mouth.tilt = clamp(value, -1, 1);
    return this;
  }

  brightness(value: number): MouthControl<TDone> {
    this.pose.mouth.brightness = clamp(value, 0, 2);
    return this;
  }

  done(): TDone {
    return this.doneValue;
  }
}

class NoseControl<TDone> implements NoseControlApi<TDone> {
  constructor(
    private readonly pose: FacePose,
    private readonly doneValue: TDone,
  ) {}

  scale(value: number): NoseControl<TDone> {
    this.pose.nose.scale = clamp(value, 0.1, 1.5);
    return this;
  }

  tilt(value: number): NoseControl<TDone> {
    this.pose.nose.tilt = clamp(value, -1, 1);
    return this;
  }

  brightness(value: number): NoseControl<TDone> {
    this.pose.nose.brightness = clamp(value, 0, 2);
    return this;
  }

  done(): TDone {
    return this.doneValue;
  }
}

class RobotFaceRenderer implements RobotFace {
  private character: CharacterDefinition = pinuCharacter;
  private readonly ctx: CanvasRenderingContext2D;
  private readonly currentPose = createPose();
  private readonly basePose = createPose();
  private readonly composedPose = createPose();
  private readonly actionPose = createPose();
  private readonly targetEmotionPose = createPose();
  private readonly fromEmotionPose = createPose();
  private readonly manualPose = createUnsetPose();

  private readonly bothEyesControl = new EyeControl(
    this.manualPose,
    (pose) => [pose.leftEye, pose.rightEye],
    this,
  );
  private readonly leftEyeControl = new EyeControl(this.manualPose, (pose) => [pose.leftEye], this);
  private readonly rightEyeControl = new EyeControl(
    this.manualPose,
    (pose) => [pose.rightEye],
    this,
  );
  private readonly mouthControl = new MouthControl(this.manualPose, this);
  private readonly noseControl = new NoseControl(this.manualPose, this);

  private theme: ThemeDefinition;
  private style: StyleDefinition;
  private features: FaceFeatures;
  private parts: Required<PartStyleConfig>;
  private mode: DisplayMode;
  private symbolName: SymbolName | null;
  private backgroundFx: ResolvedBackgroundFx;
  private transparentBackground = false;
  private running = false;
  private rafId = 0;
  private lastTime = 0;
  private elapsed = 0;
  private dpr = 1;
  private logicalWidth = 0;
  private logicalHeight = 0;
  private emotionTargetName: EmotionName = "neutral";
  private activeActionName: ReplaceActionName | null = null;
  private actionVisualName: ReplaceActionName | null = null;
  private actionBlend = 0;
  private emotionIntensity = 1;
  private activeActionPersistent = false;
  private activeActionUntil = 0;
  private overlayActionName: OverlayActionName | null = null;
  private overlayActionStartedAt = 0;
  private overlayActionDurationMs = 0;
  private emotionFromTime = 0;
  private emotionDurationMs = EMOTIONS.neutral.durationMs;
  private emotionEase: EasingName = EMOTIONS.neutral.ease;
  private initialEmotionName: EmotionName = "neutral";
  private initialEmotionIntensity = 1;
  private initialMode: DisplayMode = "face";
  private initialSymbolName: SymbolName | null = null;

  private blinkProgress = 0;
  private blinkDurationMs = EMOTIONS.neutral.blinkDurationMs;
  private blinkActive = false;
  private winkProgress = 0;
  private winkDurationMs = 220;
  private winkActive = false;
  private winkSide: WinkSide = "right";
  private autoBlinkInMs = 2400;

  private lookTargetX = 0;
  private lookTargetY = 0;
  private lookX = 0;
  private lookY = 0;

  private speakingTarget = 0;
  private speakingAmount = 0;
  private speakingCadence = 4.5;
  private speakingUntil = 0;
  private speakingEnabled = false;
  private speakingPhase = 0;

  private readonly tick = (time: number): void => {
    if (!this.running) {
      return;
    }

    const dtMs = this.lastTime === 0 ? 16.67 : Math.min(48, time - this.lastTime);
    this.lastTime = time;
    this.elapsed = time;
    this.update(dtMs / 1000, dtMs);
    this.render();
    this.rafId = requestAnimationFrame(this.tick);
  };

  constructor(
    private readonly canvas: HTMLCanvasElement,
    options: RobotFaceOptions = {},
  ) {
    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("Canvas 2D context is required.");
    }

    this.ctx = context;
    this.character =
      options.character !== undefined ? resolveCharacter(options.character) : pinuCharacter;
    this.theme = resolveTheme("cyan");
    this.style = resolveStyle("classic");
    this.features = { ...FACE_FEATURE_DEFAULTS };
    this.parts = { ...PART_STYLE_DEFAULTS };
    this.applyCharacterDefaults(this.character);
    this.mode = "face";
    this.symbolName = null;
    this.backgroundFx = { ...DEFAULT_BACKGROUND_FX };
    if (options.faceTheme) {
      this.applyFaceThemeDefinition(resolveFaceTheme(options.faceTheme), true);
    }
    if (options.theme) {
      this.theme = resolveTheme(options.theme);
    }
    if (options.style) {
      this.style = resolveStyle(options.style);
    }
    if (options.features) {
      this.features = mergeFeatures(this.features, options.features);
    }
    if (options.parts) {
      this.parts = mergeParts(this.parts, options.parts);
    }
    if (options.mode) {
      this.mode = options.mode;
    }
    if (options.symbol) {
      this.symbolName = options.symbol;
      this.mode = "symbol";
    }
    if (options.backgroundFx) {
      this.backgroundFx = resolveBackgroundFx(options.backgroundFx);
    }
    this.transparentBackground = options.transparentBackground ?? false;
    this.dpr =
      normalizePixelRatio(options.pixelRatio) ??
      (typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1);
    const neutralDefinition = this.getEmotionDefinition("neutral");
    this.emotionDurationMs = neutralDefinition.durationMs;
    this.emotionEase = neutralDefinition.ease;
    this.blinkDurationMs = neutralDefinition.blinkDurationMs;
    this.autoBlinkInMs = this.randomBlinkDelay(neutralDefinition);
    this.initialEmotionName = this.emotionTargetName;
    this.initialEmotionIntensity = this.emotionIntensity;
    this.initialMode = this.mode;
    this.initialSymbolName = this.symbolName;

    copyPose(this.currentPose, neutralDefinition.pose);
    copyPose(this.basePose, neutralDefinition.pose);
    copyPose(this.targetEmotionPose, neutralDefinition.pose);
    copyPose(this.fromEmotionPose, neutralDefinition.pose);

    if (options.autoStart !== false) {
      this.start();
    }
  }

  emote(name: EmotionName, options: EmoteOptions = {}): RobotFace {
    const definition = this.getEmotionDefinition(name);
    this.clearManualOverrides();
    this.emotionTargetName = name;
    this.emotionIntensity = clamp(options.intensity ?? 1, 0, 1);
    this.activeActionName = null;
    this.activeActionPersistent = false;
    this.activeActionUntil = 0;
    this.overlayActionName = null;
    this.clearSpeaking();
    this.applyDisplayState(name, this.emotionIntensity, definition);
    return this;
  }

  private runOverlayAction(name: OverlayActionName, options: TimedActionOptions = {}): RobotFace {
    this.clearManualOverrides();
    this.clearSpeaking();
    this.overlayActionName = name;
    this.overlayActionStartedAt = this.elapsed;
    const overlayDuration = options.durationMs;
    this.overlayActionDurationMs =
      typeof overlayDuration === "number" && Number.isFinite(overlayDuration) && overlayDuration > 0
        ? overlayDuration
        : DEFAULT_OVERLAY_ACTION_DURATION_MS[name];
    return this;
  }

  think(options: ActionOptions = {}): RobotFace {
    return this.activateAction("thinking", options);
  }

  listen(options: ActionOptions = {}): RobotFace {
    return this.activateAction("listening", options);
  }

  sleep(options: ActionOptions = {}): RobotFace {
    return this.activateAction("sleeping", options);
  }

  goOffline(options: ActionOptions = {}): RobotFace {
    return this.activateAction("offline", options);
  }

  bootUp(options: TimedActionOptions = {}): RobotFace {
    return this.runOverlayAction("bootUp", options);
  }

  glitch(options: TimedActionOptions = {}): RobotFace {
    return this.runOverlayAction("glitch", options);
  }

  reset(): RobotFace {
    this.clearManualOverrides();
    this.lookTargetX = 0;
    this.lookTargetY = 0;
    this.lookX = 0;
    this.lookY = 0;
    this.blinkActive = false;
    this.blinkProgress = 0;
    this.winkActive = false;
    this.winkProgress = 0;
    this.clearSpeaking();
    this.activeActionName = null;
    this.actionVisualName = null;
    this.actionBlend = 0;
    this.activeActionPersistent = false;
    this.activeActionUntil = 0;
    this.overlayActionName = null;
    this.mode = this.initialMode;
    this.symbolName = this.initialSymbolName;
    this.emotionTargetName = this.initialEmotionName;
    this.emotionIntensity = this.initialEmotionIntensity;
    this.applyDisplayState(this.emotionTargetName, this.emotionIntensity);
    return this;
  }

  transitionTo(state: PartialFacePose): RobotFace {
    assignPartialPose(this.manualPose, state);
    return this;
  }

  lookAt(x: number, y: number): RobotFace {
    this.lookTargetX = clamp(x, -1, 1);
    this.lookTargetY = clamp(y, -1, 1);
    return this;
  }

  lookLeft(amount = 1): RobotFace {
    return this.lookAt(-clamp(amount, 0, 1), this.lookTargetY);
  }

  lookRight(amount = 1): RobotFace {
    return this.lookAt(clamp(amount, 0, 1), this.lookTargetY);
  }

  lookUp(amount = 1): RobotFace {
    return this.lookAt(this.lookTargetX, -clamp(amount, 0, 1));
  }

  lookDown(amount = 1): RobotFace {
    return this.lookAt(this.lookTargetX, clamp(amount, 0, 1));
  }

  smile(amount = 1, options: MouthExpressionOptions = {}): RobotFace {
    assignPartialPose(this.manualPose, { mouth: mouthPreset("smile", amount, options) });
    return this;
  }

  frown(amount = 1, options: MouthExpressionOptions = {}): RobotFace {
    assignPartialPose(this.manualPose, { mouth: mouthPreset("frown", amount, options) });
    return this;
  }

  pout(amount = 1, options: MouthExpressionOptions = {}): RobotFace {
    assignPartialPose(this.manualPose, { mouth: mouthPreset("pout", amount, options) });
    return this;
  }

  blink(): RobotFace {
    this.blinkActive = true;
    this.blinkProgress = 0;
    return this;
  }

  wink(side: WinkSide = "right"): RobotFace {
    this.winkSide = side;
    this.winkActive = true;
    this.winkProgress = 0;
    return this;
  }

  speak(options: SpeakOptions = {}): RobotFace {
    const enabled = options.enabled ?? true;
    const intensity = clamp(options.intensity ?? 0.35, 0, 1);
    this.speakingEnabled = enabled && intensity > 0;
    this.speakingTarget = this.speakingEnabled ? intensity : 0;
    this.speakingCadence = clamp(options.cadence ?? 4.5, 1.5, 9);
    this.speakingUntil = options.durationMs ? this.elapsed + options.durationMs : 0;
    return this;
  }

  setCharacter(character: CharacterDefinition | string): RobotFace {
    this.character = resolveCharacter(character);
    this.applyCharacterDefaults(this.character);
    this.syncCharacterEmotionState();
    return this;
  }

  setTheme(theme: ThemeName | ThemeDefinition): RobotFace {
    this.theme = resolveTheme(theme);
    return this;
  }

  setFaceTheme(faceTheme: FaceThemeName | FaceThemeDefinition): RobotFace {
    this.applyFaceThemeDefinition(resolveFaceTheme(faceTheme), true);
    return this;
  }

  setStyle(style: StylePresetName | StyleDefinition): RobotFace {
    this.style = resolveStyle(style);
    return this;
  }

  setParts(parts: PartStyleConfig): RobotFace {
    this.parts = mergeParts(this.parts, parts);
    return this;
  }

  setMode(mode: DisplayMode): RobotFace {
    this.mode = mode;
    return this;
  }

  showSymbol(symbol: SymbolName): RobotFace {
    this.mode = "symbol";
    this.symbolName = symbol;
    return this;
  }

  showFace(): RobotFace {
    this.mode = "face";
    return this;
  }

  setBackgroundFx(config: BackgroundFxMode | BackgroundFxConfig): RobotFace {
    this.backgroundFx = resolveBackgroundFx(config);
    return this;
  }

  configure(config: RobotFaceConfig): RobotFace {
    let characterChanged = false;
    if (config.character !== undefined) {
      this.character = resolveCharacter(config.character);
      this.applyCharacterDefaults(this.character);
      characterChanged = true;
    }
    if (config.faceTheme) {
      this.applyFaceThemeDefinition(resolveFaceTheme(config.faceTheme), true);
    }
    if (config.theme) {
      this.theme = resolveTheme(config.theme);
    }
    if (config.style) {
      this.style = resolveStyle(config.style);
    }
    if (config.features) {
      this.features = mergeFeatures(this.features, config.features);
    }
    if (config.parts) {
      this.parts = mergeParts(this.parts, config.parts);
    }
    if (config.mode) {
      this.mode = config.mode;
    }
    if (config.symbol) {
      this.symbolName = config.symbol;
      this.mode = "symbol";
    }
    if (config.backgroundFx) {
      this.backgroundFx = resolveBackgroundFx(config.backgroundFx);
    }
    if (config.transparentBackground !== undefined) {
      this.transparentBackground = config.transparentBackground;
    }
    const normalizedPixelRatio = normalizePixelRatio(config.pixelRatio);
    if (normalizedPixelRatio !== undefined) {
      this.dpr = normalizedPixelRatio;
    }
    if (characterChanged) {
      this.syncCharacterEmotionState();
    }
    return this;
  }

  start(): RobotFace {
    if (this.running) {
      return this;
    }

    this.running = true;
    this.lastTime = 0;
    this.rafId = requestAnimationFrame(this.tick);
    return this;
  }

  stop(): RobotFace {
    this.running = false;
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = 0;
    }
    return this;
  }

  destroy(): void {
    this.stop();
  }

  render(): RobotFace {
    this.syncCanvasSize();
    this.drawFrame();
    return this;
  }

  eyes(): EyeControlApi<RobotFace> {
    return this.bothEyesControl;
  }

  leftEye(): EyeControlApi<RobotFace> {
    return this.leftEyeControl;
  }

  rightEye(): EyeControlApi<RobotFace> {
    return this.rightEyeControl;
  }

  mouth(): MouthControlApi<RobotFace> {
    return this.mouthControl;
  }

  nose(): NoseControlApi<RobotFace> {
    return this.noseControl;
  }

  private clearManualOverrides(): void {
    clearPose(this.manualPose);
  }

  private clearSpeaking(): void {
    this.speakingEnabled = false;
    this.speakingUntil = 0;
    this.speakingTarget = 0;
    this.speakingAmount = 0;
    this.speakingPhase = 0;
  }

  private activateAction(name: ReplaceActionName, options: ActionOptions): RobotFace {
    this.clearManualOverrides();
    this.clearSpeaking();
    this.activeActionName = name;
    this.actionVisualName = name;
    this.activeActionPersistent = options.persistent ?? false;
    if (this.activeActionPersistent) {
      this.activeActionUntil = 0;
    } else {
      const actionDuration = options.durationMs;
      const durationMs =
        typeof actionDuration === "number" && Number.isFinite(actionDuration) && actionDuration > 0
          ? actionDuration
          : DEFAULT_ACTION_DURATION_MS[name];
      this.activeActionUntil = this.elapsed + durationMs;
    }
    this.overlayActionName = null;
    const definition = this.getActionDefinition(name);
    this.blinkDurationMs = definition.blinkDurationMs;
    this.autoBlinkInMs = this.randomBlinkDelay(definition);
    return this;
  }

  private applyCharacterDefaults(character: CharacterDefinition): void {
    this.style = character.defaultStyle;
    this.features = mergeFeatures({ ...FACE_FEATURE_DEFAULTS }, character.defaultFeatures);
    this.parts = resolveCharacterParts(character);
  }

  private getEmotionDefinition(name: EmotionName): FaceStateDefinition {
    return this.character.emotions?.[name] ?? EMOTIONS[name];
  }

  private getActionDefinition(name: ReplaceActionName): FaceStateDefinition {
    return this.character.actions?.[name] ?? ACTION_DEFINITIONS[name];
  }

  private applyDisplayState(
    name: EmotionName,
    intensity = 1,
    definition = this.getEmotionDefinition(name),
  ): void {
    copyPose(this.fromEmotionPose, this.basePose);
    blendPoseFromNeutral(definition.pose, clamp(intensity, 0, 1), this.targetEmotionPose);
    this.emotionFromTime = this.elapsed;
    this.emotionDurationMs = definition.durationMs;
    this.emotionEase = definition.ease;
    this.blinkDurationMs = definition.blinkDurationMs;
    this.autoBlinkInMs = this.randomBlinkDelay(definition);
  }

  private syncCharacterEmotionState(): void {
    this.actionVisualName = this.activeActionName;
    this.applyDisplayState(this.emotionTargetName, this.emotionIntensity);
  }

  private get visualActionName(): ReplaceActionName | null {
    return this.activeActionName ?? this.actionVisualName;
  }

  private get visualDisplayName(): DisplayName {
    return this.visualActionName ?? this.emotionTargetName;
  }

  // biome-ignore lint/correctness/noUnusedPrivateClassMembers: tests inspect this internal runtime state directly.
  private get displayName(): DisplayName {
    return this.activeActionName ?? this.emotionTargetName;
  }

  private applyFaceThemeDefinition(faceTheme: FaceThemeDefinition, resetProfile = false): void {
    if (resetProfile) {
      this.applyCharacterDefaults(this.character);
      this.mode = "face";
      this.symbolName = null;
      this.backgroundFx = { ...DEFAULT_BACKGROUND_FX };
    }
    if (faceTheme.theme) {
      this.theme = resolveTheme(faceTheme.theme);
    }
    if (faceTheme.style) {
      this.style = resolveStyle(faceTheme.style);
    }
    if (faceTheme.features) {
      this.features = mergeFeatures(this.features, faceTheme.features);
    }
    if (faceTheme.parts) {
      this.parts = mergeParts(this.parts, faceTheme.parts);
    }
    if (faceTheme.mode) {
      this.mode = faceTheme.mode;
    }
    if (faceTheme.symbol) {
      this.symbolName = faceTheme.symbol;
      this.mode = "symbol";
    }
    if (faceTheme.backgroundFx) {
      this.backgroundFx = resolveBackgroundFx(faceTheme.backgroundFx);
    }
  }

  private update(dt: number, dtMs: number): void {
    const animationDefinition =
      this.activeActionName === null
        ? this.getEmotionDefinition(this.emotionTargetName)
        : this.getActionDefinition(this.activeActionName);
    const emotionProgress = clamp(
      (this.elapsed - this.emotionFromTime) / this.emotionDurationMs,
      0,
      1,
    );
    lerpPose(
      this.basePose,
      this.fromEmotionPose,
      this.targetEmotionPose,
      ease(this.emotionEase, emotionProgress),
    );

    if (
      this.activeActionName &&
      !this.activeActionPersistent &&
      this.activeActionUntil > 0 &&
      this.elapsed >= this.activeActionUntil
    ) {
      this.activeActionName = null;
      this.activeActionUntil = 0;
      this.activeActionPersistent = false;
      this.applyDisplayState(this.emotionTargetName, this.emotionIntensity);
    }

    const actionTargetBlend = this.activeActionName ? 1 : 0;
    const actionBlendName = this.visualActionName;
    const actionBlendSpeed = actionBlendName
      ? actionTargetBlend === 0
        ? 14
        : ACTION_BLEND_SPEED[actionBlendName]
      : 10;
    this.actionBlend = damp(this.actionBlend, actionTargetBlend, dt, actionBlendSpeed);
    if (!this.activeActionName && this.actionVisualName && this.actionBlend <= 0.02) {
      this.actionBlend = 0;
      this.actionVisualName = null;
    }

    this.lookX = damp(this.lookX, this.lookTargetX, dt, 9);
    this.lookY = damp(this.lookY, this.lookTargetY, dt, 9);

    if (this.blinkActive) {
      this.blinkProgress += dtMs / this.blinkDurationMs;
      if (this.blinkProgress >= 1) {
        this.blinkActive = false;
        this.blinkProgress = 0;
        this.autoBlinkInMs = this.randomBlinkDelay(animationDefinition);
      }
    } else {
      this.autoBlinkInMs -= dtMs;
      if (this.autoBlinkInMs <= 0) {
        this.blink();
      }
    }

    if (this.winkActive) {
      this.winkProgress += dtMs / this.winkDurationMs;
      if (this.winkProgress >= 1) {
        this.winkActive = false;
        this.winkProgress = 0;
      }
    }

    if (this.speakingUntil && this.elapsed >= this.speakingUntil) {
      this.clearSpeaking();
    }

    this.speakingAmount = damp(this.speakingAmount, this.speakingTarget, dt, 8);
    this.speakingPhase += dt * this.speakingCadence;

    if (this.overlayActionName) {
      const performanceProgress = clamp(
        (this.elapsed - this.overlayActionStartedAt) / this.overlayActionDurationMs,
        0,
        1,
      );
      if (performanceProgress >= 1) {
        this.overlayActionName = null;
      }
    }

    this.composePose(dt);
  }

  private composePose(dt: number): void {
    const emotionDefinition = this.getEmotionDefinition(this.emotionTargetName);
    copyPose(this.composedPose, this.basePose);
    applyOverrides(this.composedPose, this.manualPose);

    const intensity = this.emotionIntensity;
    const bobWave = wave(this.elapsed / 1000, emotionDefinition.microBobHz);
    const swayWave = wave((this.elapsed + 270) / 1000, emotionDefinition.microBobHz * 0.5);
    this.composedPose.global.bob += emotionDefinition.microBob * bobWave * intensity;
    this.composedPose.leftEye.tilt += emotionDefinition.microSway * 0.18 * swayWave * intensity;
    this.composedPose.rightEye.tilt -= emotionDefinition.microSway * 0.18 * swayWave * intensity;

    if (this.emotionTargetName === "confused") {
      const delay = 0.5 + 0.5 * wave(this.elapsed / 1000, 1.1);
      const mouthWobble = wave((this.elapsed + 140) / 1000, 2.2);
      const mouthDrift = wave((this.elapsed + 20) / 1000, 0.8);
      this.composedPose.rightEye.openness -= 0.08 * delay;
      this.composedPose.mouth.tilt += 0.08 * delay + mouthWobble * 0.04;
      this.composedPose.mouth.curvature += mouthWobble * 0.035;
      this.composedPose.mouth.width += mouthDrift * 0.02;
    }

    if (this.actionVisualName && this.actionBlend > 0.001) {
      const actionDefinition = this.getActionDefinition(this.actionVisualName);
      const actionAmount = clamp(
        this.actionBlend * ACTION_BLEND_STRENGTH[this.actionVisualName],
        0,
        1,
      );
      lerpPose(this.actionPose, this.composedPose, actionDefinition.pose, actionAmount);
      copyPose(this.composedPose, this.actionPose);

      const actionBobWave = wave(this.elapsed / 1000, actionDefinition.microBobHz);
      const actionSwayWave = wave((this.elapsed + 270) / 1000, actionDefinition.microBobHz * 0.5);
      this.composedPose.global.bob += actionDefinition.microBob * actionBobWave * actionAmount;
      this.composedPose.leftEye.tilt +=
        actionDefinition.microSway * 0.18 * actionSwayWave * actionAmount;
      this.composedPose.rightEye.tilt -=
        actionDefinition.microSway * 0.18 * actionSwayWave * actionAmount;

      if (this.actionVisualName === "offline") {
        const shutdown = ease("smooth", clamp((this.actionBlend - 0.16) / 0.68, 0, 1));
        const cutoffPulse = Math.sin(Math.PI * clamp(this.actionBlend / 0.9, 0, 1));
        this.composedPose.global.flicker += cutoffPulse * 0.08;
        this.composedPose.global.distortion += cutoffPulse * 0.04;
        this.composedPose.global.glow *= 1 - shutdown * 0.18;
        this.composedPose.leftEye.openness = lerp(
          this.composedPose.leftEye.openness,
          0.02,
          shutdown * 0.55,
        );
        this.composedPose.rightEye.openness = lerp(
          this.composedPose.rightEye.openness,
          0.02,
          shutdown * 0.55,
        );
        this.composedPose.mouth.brightness *= 1 - shutdown * 0.3;
        this.composedPose.nose.brightness *= 1 - shutdown * 0.25;
      }
    }

    const blinkAmount = this.blinkActive ? Math.sin(Math.PI * this.blinkProgress) : 0;
    if (blinkAmount > 0) {
      this.composedPose.leftEye.openness *= 1 - 0.98 * blinkAmount;
      this.composedPose.rightEye.openness *= 1 - 0.98 * blinkAmount;
      this.composedPose.leftEye.squint = clamp(
        this.composedPose.leftEye.squint + blinkAmount * 0.5,
        0,
        1,
      );
      this.composedPose.rightEye.squint = clamp(
        this.composedPose.rightEye.squint + blinkAmount * 0.5,
        0,
        1,
      );
    }

    const winkAmount = this.winkActive ? Math.sin(Math.PI * this.winkProgress) : 0;
    if (winkAmount > 0) {
      const winkEye =
        this.winkSide === "left" ? this.composedPose.leftEye : this.composedPose.rightEye;
      winkEye.openness *= 1 - 0.985 * winkAmount;
      winkEye.squint = clamp(winkEye.squint + winkAmount * 0.55, 0, 1);
    }

    const lookStrength = 0.62;
    this.composedPose.leftEye.pupilX = clamp(
      this.composedPose.leftEye.pupilX + this.lookX * lookStrength,
      -1,
      1,
    );
    this.composedPose.rightEye.pupilX = clamp(
      this.composedPose.rightEye.pupilX + this.lookX * lookStrength,
      -1,
      1,
    );
    this.composedPose.leftEye.pupilY = clamp(
      this.composedPose.leftEye.pupilY + this.lookY * lookStrength,
      -1,
      1,
    );
    this.composedPose.rightEye.pupilY = clamp(
      this.composedPose.rightEye.pupilY + this.lookY * lookStrength,
      -1,
      1,
    );
    this.composedPose.leftEye.tilt += this.lookX * 0.04;
    this.composedPose.rightEye.tilt += this.lookX * 0.04;

    const talkOverlay =
      this.speakingAmount > 0.001
        ? (0.25 + 0.75 * Math.abs(Math.sin(this.speakingPhase * Math.PI)) ** 0.8) *
          this.speakingAmount
        : 0;
    if (talkOverlay > 0) {
      this.composedPose.mouth.openness = clamp(
        this.composedPose.mouth.openness + talkOverlay * 1.08,
        0,
        1,
      );
      this.composedPose.mouth.width = clamp(
        this.composedPose.mouth.width + talkOverlay * 0.15,
        0.2,
        1.2,
      );
      this.composedPose.mouth.curvature = damp(this.composedPose.mouth.curvature, 0.05, dt, 10);
      this.composedPose.mouth.brightness += talkOverlay * 0.3;
      this.composedPose.global.glow += talkOverlay * 0.08;
      this.composedPose.global.flicker += talkOverlay * 0.05;
      this.composedPose.leftEye.openness = clamp(
        this.composedPose.leftEye.openness - talkOverlay * 0.05,
        0,
        1,
      );
      this.composedPose.rightEye.openness = clamp(
        this.composedPose.rightEye.openness - talkOverlay * 0.05,
        0,
        1,
      );
    }

    if (this.overlayActionName) {
      const performanceProgress = clamp(
        (this.elapsed - this.overlayActionStartedAt) / this.overlayActionDurationMs,
        0,
        1,
      );

      if (this.overlayActionName === "glitch") {
        const burst = Math.sin(performanceProgress * Math.PI);
        this.composedPose.global.jitter += 0.018 * burst;
        this.composedPose.global.distortion += 0.5 * burst;
        this.composedPose.global.flicker += 0.4 * burst;
        this.composedPose.leftEye.openness = clamp(
          this.composedPose.leftEye.openness - 0.12 * burst,
          0,
          1,
        );
        this.composedPose.rightEye.openness = clamp(
          this.composedPose.rightEye.openness + 0.08 * burst,
          0,
          1,
        );
        this.composedPose.mouth.tilt += 0.2 * burst * wave(this.elapsed / 1000, 12);
      }

      if (this.overlayActionName === "bootUp") {
        const open = ease("smooth", clamp((performanceProgress - 0.12) / 0.72, 0, 1));
        const brightness = ease("smooth", clamp((performanceProgress - 0.08) / 0.84, 0, 1));
        this.composedPose.leftEye.openness = Math.min(
          this.composedPose.leftEye.openness,
          0.04 + open * 0.96,
        );
        this.composedPose.rightEye.openness = Math.min(
          this.composedPose.rightEye.openness,
          0.04 + open * 0.96,
        );
        this.composedPose.mouth.openness *= brightness;
        this.composedPose.mouth.brightness *= brightness;
        this.composedPose.nose.brightness *= brightness;
        this.composedPose.global.glow *= 0.35 + brightness * 0.9;
        this.composedPose.global.scanline = Math.max(this.composedPose.global.scanline, 0.26);
        this.composedPose.global.flicker += (1 - brightness) * 0.24;
      }
    }

    const current = this.currentPose;
    current.leftEye.openness = damp(
      current.leftEye.openness,
      this.composedPose.leftEye.openness,
      dt,
      16,
    );
    current.leftEye.squint = damp(current.leftEye.squint, this.composedPose.leftEye.squint, dt, 14);
    current.leftEye.tilt = damp(current.leftEye.tilt, this.composedPose.leftEye.tilt, dt, 14);
    current.leftEye.pupilX = damp(current.leftEye.pupilX, this.composedPose.leftEye.pupilX, dt, 18);
    current.leftEye.pupilY = damp(current.leftEye.pupilY, this.composedPose.leftEye.pupilY, dt, 18);
    current.leftEye.brightness = damp(
      current.leftEye.brightness,
      this.composedPose.leftEye.brightness,
      dt,
      12,
    );
    current.rightEye.openness = damp(
      current.rightEye.openness,
      this.composedPose.rightEye.openness,
      dt,
      16,
    );
    current.rightEye.squint = damp(
      current.rightEye.squint,
      this.composedPose.rightEye.squint,
      dt,
      14,
    );
    current.rightEye.tilt = damp(current.rightEye.tilt, this.composedPose.rightEye.tilt, dt, 14);
    current.rightEye.pupilX = damp(
      current.rightEye.pupilX,
      this.composedPose.rightEye.pupilX,
      dt,
      18,
    );
    current.rightEye.pupilY = damp(
      current.rightEye.pupilY,
      this.composedPose.rightEye.pupilY,
      dt,
      18,
    );
    current.rightEye.brightness = damp(
      current.rightEye.brightness,
      this.composedPose.rightEye.brightness,
      dt,
      12,
    );
    current.nose.scale = damp(current.nose.scale, this.composedPose.nose.scale, dt, 10);
    current.nose.tilt = damp(current.nose.tilt, this.composedPose.nose.tilt, dt, 10);
    current.nose.brightness = damp(
      current.nose.brightness,
      this.composedPose.nose.brightness,
      dt,
      10,
    );
    current.mouth.openness = damp(current.mouth.openness, this.composedPose.mouth.openness, dt, 12);
    current.mouth.curvature = damp(
      current.mouth.curvature,
      this.composedPose.mouth.curvature,
      dt,
      12,
    );
    current.mouth.width = damp(current.mouth.width, this.composedPose.mouth.width, dt, 10);
    current.mouth.tilt = damp(current.mouth.tilt, this.composedPose.mouth.tilt, dt, 10);
    current.mouth.brightness = damp(
      current.mouth.brightness,
      this.composedPose.mouth.brightness,
      dt,
      10,
    );
    current.global.glow = damp(current.global.glow, this.composedPose.global.glow, dt, 10);
    current.global.bob = damp(current.global.bob, this.composedPose.global.bob, dt, 8);
    current.global.jitter = damp(current.global.jitter, this.composedPose.global.jitter, dt, 18);
    current.global.distortion = damp(
      current.global.distortion,
      this.composedPose.global.distortion,
      dt,
      18,
    );
    current.global.flicker = damp(current.global.flicker, this.composedPose.global.flicker, dt, 18);
    current.global.scanline = damp(
      current.global.scanline,
      this.composedPose.global.scanline,
      dt,
      12,
    );
  }

  private syncCanvasSize(): void {
    const cssWidth = this.canvas.clientWidth || this.canvas.width || 480;
    const cssHeight = this.canvas.clientHeight || this.canvas.height || 320;
    const dpr = this.dpr;
    const displayWidth = Math.max(1, Math.round(cssWidth * dpr));
    const displayHeight = Math.max(1, Math.round(cssHeight * dpr));

    if (this.canvas.width !== displayWidth || this.canvas.height !== displayHeight) {
      this.canvas.width = displayWidth;
      this.canvas.height = displayHeight;
    }

    this.logicalWidth = cssWidth;
    this.logicalHeight = cssHeight;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  private drawFrame(): void {
    const ctx = this.ctx;
    const width = this.logicalWidth;
    const height = this.logicalHeight;
    const pose = this.currentPose;
    const jitterAmount = pose.global.jitter;
    const glitch = pose.global.distortion;
    const flicker =
      1 - pose.global.flicker * (0.35 + 0.65 * (0.5 + 0.5 * wave(this.elapsed / 1000, 18.5)));
    const faceOffsetY = pose.global.bob * height;
    const jitterX = jitterAmount * width * wave((this.elapsed + 20) / 1000, 17.3);
    const jitterY = jitterAmount * height * wave((this.elapsed + 60) / 1000, 14.1);

    const style = this.style;
    const panelX = width * style.panelInsetX;
    const panelY = height * style.panelInsetY;
    const panelWidth = width - panelX * 2;
    const panelHeight = height - panelY * 2;
    const panelRadius = Math.min(width, height) * style.panelRadius;
    const innerPadding = Math.min(width, height) * style.panelInnerPadding;

    ctx.clearRect(0, 0, width, height);
    if (!this.transparentBackground) {
      ctx.fillStyle = this.theme.background;
      ctx.fillRect(0, 0, width, height);
    }

    if (this.features.panel) {
      roundedRect(ctx, panelX, panelY, panelWidth, panelHeight, panelRadius);
      ctx.fillStyle = this.theme.panel;
      ctx.fill();
      ctx.lineWidth = Math.max(2, Math.min(width, height) * 0.01);
      ctx.strokeStyle = this.theme.panelEdge;
      ctx.stroke();
    }

    this.drawBackgroundFx(
      panelX + innerPadding,
      panelY + innerPadding,
      panelWidth - innerPadding * 2,
      panelHeight - innerPadding * 2,
      Math.max(4, panelRadius - innerPadding),
      pose.global.glow,
    );

    ctx.save();
    ctx.beginPath();
    if (this.features.panel) {
      roundedRect(
        ctx,
        panelX + innerPadding,
        panelY + innerPadding,
        panelWidth - innerPadding * 2,
        panelHeight - innerPadding * 2,
        Math.max(4, panelRadius - innerPadding),
      );
    } else {
      ctx.rect(0, 0, width, height);
    }
    ctx.clip();

    ctx.translate(width * 0.5 + jitterX, height * 0.5 + faceOffsetY + jitterY);

    if (glitch > 0.02) {
      this.drawFacePass(-glitch * width * 0.012, glitch * height * 0.004, 0.12, flicker * 0.8);
      this.drawFacePass(glitch * width * 0.008, -glitch * height * 0.003, 0.2, flicker * 0.65);
    }

    this.drawFacePass(0, 0, 1, flicker);
    this.character.drawOverlay?.(this.buildDrawContext(), width, height, pose);
    this.drawScrambleSlices(width, height, pose, flicker);
    ctx.restore();

    if (this.features.scanlines) {
      this.drawScanlines(panelX, panelY, panelWidth, panelHeight, pose.global.scanline);
    }
  }

  private buildDrawContext(): DrawContext {
    return {
      ctx: this.ctx,
      theme: this.theme,
      emotionName: this.emotionTargetName,
      actionName: this.visualActionName,
      overlayActionName: this.overlayActionName,
      displayName: this.visualDisplayName,
      elapsed: this.elapsed,
      emotionFromTime: this.emotionFromTime,
      mode: this.mode,
      speakingAmount: this.speakingAmount,
    };
  }

  private drawFacePass(offsetX: number, offsetY: number, alpha: number, flicker: number): void {
    const ctx = this.ctx;
    const width = this.logicalWidth;
    const height = this.logicalHeight;
    const pose = this.currentPose;
    const dc = this.buildDrawContext();
    const parts = this.parts;

    ctx.save();
    ctx.translate(offsetX, offsetY);
    ctx.globalAlpha = alpha;

    const style = this.style;
    const constructionFrame = createConstructionFrame(width, height);
    const constructionLayout = createStyleConstructionLayout(style);
    const constructionAnchors = resolveConstructionAnchors(constructionFrame, constructionLayout);
    const glow = Math.max(8, Math.min(width, height) * style.glowScale * pose.global.glow);
    const eyeHeightScale = clamp(this.parts.eyeHeightScale, 0.5, 1.8);
    const scaledEyeHeight = height * style.eyeHeight * eyeHeightScale;
    const defaultEyeTopY = height * (style.eyeY - style.eyeHeight * 0.5);
    const defaultBrowY = height * style.browY;
    const browOffsetFromEyeTop = defaultBrowY - defaultEyeTopY;
    const browExtraLift = Math.max(0, eyeHeightScale - 1) * scaledEyeHeight * 0.18;
    const dynamicBrowY =
      height * style.eyeY - scaledEyeHeight * 0.5 + browOffsetFromEyeTop - browExtraLift;
    const confusedBrowRaise = this.visualDisplayName === "confused" ? height * 0.024 : 0;
    const leftBrowY = dynamicBrowY - confusedBrowRaise;
    const rightBrowY = dynamicBrowY + confusedBrowRaise * 0.22;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = this.theme.foreground;
    ctx.fillStyle = this.theme.foreground;
    ctx.shadowColor = this.theme.glow;
    ctx.shadowBlur = glow;
    ctx.globalAlpha *= flicker;
    if (this.mode === "face") {
      const visibility = this.character.getFaceVisibility?.(dc) ?? 1;
      ctx.globalAlpha *= visibility;
    }

    if (this.mode === "symbol") {
      this.drawSymbol(this.resolveSymbol(), width, height, pose);
      ctx.restore();
      return;
    }

    this.character.drawBackground?.(dc, width, height, pose);

    const eyeBaseY = constructionAnchors.eyeLineY;
    if (this.features.brows) {
      if (this.features.leftEye) {
        this.character.drawBrow(dc, {
          centerX: constructionAnchors.leftEyeX,
          centerY: leftBrowY,
          width: width * style.browWidth,
          height: height * style.browHeight,
          pose: pose.leftEye,
          side: -1,
          parts,
        });
      }
      if (this.features.rightEye) {
        this.character.drawBrow(dc, {
          centerX: constructionAnchors.rightEyeX,
          centerY: rightBrowY,
          width: width * style.browWidth,
          height: height * style.browHeight,
          pose: pose.rightEye,
          side: 1,
          parts,
        });
      }
    }
    if (this.features.leftEye) {
      this.character.drawEye(dc, {
        centerX: constructionAnchors.leftEyeX,
        centerY: eyeBaseY,
        width: width * style.eyeWidth,
        height: height * style.eyeHeight,
        pose: pose.leftEye,
        side: -1,
        style,
        features: this.features,
        parts,
      });
    }
    if (this.features.rightEye) {
      this.character.drawEye(dc, {
        centerX: constructionAnchors.rightEyeX,
        centerY: eyeBaseY,
        width: width * style.eyeWidth,
        height: height * style.eyeHeight,
        pose: pose.rightEye,
        side: 1,
        style,
        features: this.features,
        parts,
      });
    }
    if (this.features.nose) {
      this.character.drawNose(dc, {
        centerX: 0,
        centerY: height * style.noseY,
        width: width * style.noseWidth,
        height: height * style.noseHeight,
        pose: pose.nose,
        parts,
      });
    }
    if (this.features.mouth) {
      this.character.drawMouth(dc, {
        centerX: 0,
        centerY: height * style.mouthY,
        width: width * style.mouthWidth,
        height: height * style.mouthHeight,
        pose: pose.mouth,
        parts,
      });
    }
    ctx.restore();
  }

  private drawScrambleSlices(width: number, height: number, pose: FacePose, flicker: number): void {
    const scramble = this.character.getScrambleStrength
      ? this.character.getScrambleStrength(this.visualDisplayName, pose.global.distortion)
      : Math.max(this.visualDisplayName === "angry" ? 0.16 : 0, pose.global.distortion * 0.7);

    if (scramble < 0.08 || this.mode === "symbol") {
      return;
    }

    const ctx = this.ctx;
    const isAngry = this.visualDisplayName === "angry";
    const slices = isAngry ? 4 : 6;
    const top = isAngry ? -height * 0.22 : -height * 0.3;
    const bandHeight = isAngry ? height * 0.04 : height * 0.055;
    const gap = isAngry ? height * 0.065 : height * 0.045;
    const angryPulse = 0.7 + 0.3 * wave(this.elapsed / 1000, 2.1);

    for (let index = 0; index < slices; index += 1) {
      const y =
        top +
        index * (bandHeight + gap) +
        wave((this.elapsed + index * 90) / 1000, isAngry ? 6.4 + index * 0.2 : 4.6 + index * 0.2) *
          height *
          (isAngry ? 0.008 : 0.01);
      const offsetX =
        wave(
          (this.elapsed + index * 140) / 1000,
          isAngry ? 8.8 - index * 0.35 : 8.5 - index * 0.45,
        ) *
        width *
        scramble *
        (isAngry ? 0.16 + index * 0.024 : 0.18 + index * 0.03);
      const offsetY =
        wave((this.elapsed + index * 110) / 1000, isAngry ? 8.6 : 10.5) *
        height *
        scramble *
        (isAngry ? 0.008 : 0.012);
      const alpha = isAngry ? (0.08 + scramble * 0.16) * angryPulse : 0.1 + scramble * 0.22;

      ctx.save();
      ctx.beginPath();
      ctx.rect(-width * 0.5, y, width, bandHeight);
      ctx.clip();
      this.drawFacePass(offsetX, offsetY, alpha, flicker * 0.88);
      ctx.restore();

      if (!isAngry && index % 2 === 0) {
        ctx.save();
        ctx.globalAlpha = 0.05 + scramble * 0.1;
        ctx.fillStyle = this.theme.panel;
        ctx.fillRect(-width * 0.5, y + bandHeight * 0.42, width, bandHeight * 0.12);
        ctx.restore();
      }
    }
  }

  private drawBackgroundFx(
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number,
    glow: number,
  ): void {
    const fx = this.resolveFrameBackgroundFx();
    if (!fx) {
      return;
    }

    const ctx = this.ctx;
    const pulse = 0.55 + 0.45 * (0.5 + 0.5 * wave(this.elapsed / 1000, fx.pulseHz));
    ctx.save();
    roundedRect(ctx, x, y, width, height, radius);
    ctx.clip();
    ctx.fillStyle = fx.color;
    ctx.globalAlpha = clamp(fx.intensity * pulse * (0.82 + glow * 0.08), 0, 0.42);
    ctx.fillRect(x, y, width, height);
    ctx.restore();
  }

  private resolveFrameBackgroundFx(): ResolvedBackgroundFx | null {
    if (this.backgroundFx.mode === "off") {
      return null;
    }

    if (this.backgroundFx.mode === "custom") {
      return this.backgroundFx;
    }

    const performanceFx = this.overlayActionName
      ? OVERLAY_ACTION_BACKGROUND_FX[this.overlayActionName]
      : undefined;
    if (performanceFx) {
      return {
        ...DEFAULT_BACKGROUND_FX,
        ...performanceFx,
        mode: "emotion",
      };
    }

    const visualDisplayName = this.visualDisplayName;
    const stateFx =
      visualDisplayName in EMOTIONS
        ? EMOTION_BACKGROUND_FX[visualDisplayName as EmotionName]
        : ACTION_BACKGROUND_FX[visualDisplayName as ReplaceActionName];
    if (!stateFx) {
      return null;
    }

    return {
      ...DEFAULT_BACKGROUND_FX,
      ...stateFx,
      mode: "emotion",
    };
  }

  private resolveSymbol(): SymbolName {
    if (this.symbolName) {
      return this.symbolName;
    }

    if (this.overlayActionName) {
      return OVERLAY_ACTION_SYMBOLS[this.overlayActionName] ?? "ellipsis";
    }

    const visualDisplayName = this.visualDisplayName;
    if (visualDisplayName in EMOTIONS) {
      return EMOTION_SYMBOLS[visualDisplayName as EmotionName] ?? "ellipsis";
    }

    return ACTION_SYMBOLS[visualDisplayName as ReplaceActionName] ?? "ellipsis";
  }

  private drawSymbol(symbol: SymbolName, width: number, height: number, pose: FacePose): void {
    const ctx = this.ctx;
    const scale = Math.min(width, height);
    const y = -height * 0.02 + pose.global.bob * height * 0.12;
    const brightness = clamp(pose.global.glow, 0.6, 1.6);

    ctx.globalAlpha *= brightness;

    if (symbol === "loading") {
      const active = Math.floor((this.elapsed / 180) % 3);
      for (let index = 0; index < 3; index += 1) {
        ctx.save();
        ctx.globalAlpha *= index === active ? 1 : 0.28;
        drawPixelGlyph(
          ctx,
          PIXEL_LOADING_BAR,
          (index - 1) * scale * 0.13,
          y + scale * 0.02,
          scale * 0.09,
        );
        ctx.restore();
      }
      return;
    }

    drawPixelGlyph(
      ctx,
      PIXEL_SYMBOL_PATTERNS[symbol] ?? PIXEL_SYMBOL_PATTERNS.warning,
      0,
      y,
      scale * 0.3,
    );
  }

  private drawScanlines(
    x: number,
    y: number,
    width: number,
    height: number,
    strength: number,
  ): void {
    if (strength <= 0.01) {
      return;
    }

    const ctx = this.ctx;
    ctx.save();
    ctx.beginPath();
    roundedRect(ctx, x + 6, y + 6, width - 12, height - 12, Math.min(width, height) * 0.06);
    ctx.clip();
    ctx.strokeStyle = this.theme.ghost;
    const thickness = clamp(this.parts.scanlineThickness, 1.25, 6);
    ctx.lineWidth = thickness;
    ctx.globalAlpha = clamp(strength * (0.9 + thickness * 0.12), 0, 0.48);
    const step = clamp(this.parts.scanlineSpacing, 3, 18);
    for (let lineY = y; lineY < y + height; lineY += step) {
      const waveOffset = Math.sin((lineY + this.elapsed * 0.08) * 0.04) * strength * 6;
      ctx.beginPath();
      ctx.moveTo(x + waveOffset, lineY);
      ctx.lineTo(x + width + waveOffset, lineY);
      ctx.stroke();
    }
    ctx.restore();
  }

  private randomBlinkDelay(definition: FaceStateDefinition): number {
    const range = definition.blinkMaxMs - definition.blinkMinMs;
    return definition.blinkMinMs + range * (0.5 + 0.5 * Math.sin(this.elapsed * 0.0017 + 1.234));
  }
}

export const createRobotFace = (canvas: HTMLCanvasElement, options?: RobotFaceOptions): RobotFace =>
  new RobotFaceRenderer(canvas, options);
