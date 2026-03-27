import { EMOTIONS, type EmotionDefinition } from "./emotions.js";
import { FACE_THEMES } from "./faceThemes.js";
import { FACE_FEATURE_DEFAULTS, PART_STYLE_DEFAULTS, STYLE_PRESETS } from "./styles.js";
import { THEMES } from "./themes.js";
import type {
  BackgroundFxConfig,
  BackgroundFxMode,
  BrowShapeName,
  DisplayMode,
  EmoteOptions,
  EyeControlApi,
  EyeShapeName,
  EyePose,
  FaceFeatures,
  FacePose,
  FaceThemeDefinition,
  FaceThemeName,
  GlobalPose,
  MouthControlApi,
  MouthExpressionOptions,
  MouthShapeName,
  MouthPose,
  NoseControlApi,
  NoseShapeName,
  NosePose,
  PartStyleConfig,
  PartialFacePose,
  PerformanceName,
  RobotFace,
  RobotFaceConfig,
  RobotFaceOptions,
  SpeakOptions,
  StyleDefinition,
  StylePresetName,
  SymbolName,
  ThemeDefinition,
  ThemeName,
  WinkSide
} from "./types.js";

type EasingName = EmotionDefinition["ease"];
type PerformanceState = "idle" | PerformanceName;
type ResolvedBackgroundFx = Required<BackgroundFxConfig>;

const TAU = Math.PI * 2;
const UNSET = Number.NaN;
const PUPIL_FILL = "#000000";
const PUPIL_FILL_ANGRY = "#565d66";

const clamp = (value: number, min: number, max: number): number =>
  value < min ? min : value > max ? max : value;

const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

const ease = (name: EasingName, t: number): number => {
  if (name === "snap") {
    return 1 - Math.pow(1 - t, 3);
  }

  if (name === "gentle") {
    return t * t * (3 - 2 * t);
  }

  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
};

const damp = (current: number, target: number, dt: number, speed: number): number =>
  lerp(current, target, 1 - Math.exp(-speed * dt));

const wave = (time: number, frequency: number): number => Math.sin(time * TAU * frequency);

const roundedRect = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
): void => {
  const r = Math.min(radius, width * 0.5, height * 0.5);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
};

const createPose = (): FacePose => ({
  leftEye: { openness: 0, squint: 0, tilt: 0, pupilX: 0, pupilY: 0, brightness: 1 },
  rightEye: { openness: 0, squint: 0, tilt: 0, pupilX: 0, pupilY: 0, brightness: 1 },
  nose: { scale: 1, tilt: 0, brightness: 1 },
  mouth: { openness: 0, curvature: 0, width: 1, tilt: 0, brightness: 1 },
  global: { glow: 1, bob: 0, jitter: 0, distortion: 0, flicker: 0, scanline: 0 }
});

const createUnsetPose = (): FacePose => ({
  leftEye: { openness: UNSET, squint: UNSET, tilt: UNSET, pupilX: UNSET, pupilY: UNSET, brightness: UNSET },
  rightEye: { openness: UNSET, squint: UNSET, tilt: UNSET, pupilX: UNSET, pupilY: UNSET, brightness: UNSET },
  nose: { scale: UNSET, tilt: UNSET, brightness: UNSET },
  mouth: { openness: UNSET, curvature: UNSET, width: UNSET, tilt: UNSET, brightness: UNSET },
  global: { glow: UNSET, bob: UNSET, jitter: UNSET, distortion: UNSET, flicker: UNSET, scanline: UNSET }
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
  target.leftEye.brightness = overrideValue(target.leftEye.brightness, overrides.leftEye.brightness);
  target.rightEye.openness = overrideValue(target.rightEye.openness, overrides.rightEye.openness);
  target.rightEye.squint = overrideValue(target.rightEye.squint, overrides.rightEye.squint);
  target.rightEye.tilt = overrideValue(target.rightEye.tilt, overrides.rightEye.tilt);
  target.rightEye.pupilX = overrideValue(target.rightEye.pupilX, overrides.rightEye.pupilX);
  target.rightEye.pupilY = overrideValue(target.rightEye.pupilY, overrides.rightEye.pupilY);
  target.rightEye.brightness = overrideValue(target.rightEye.brightness, overrides.rightEye.brightness);
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

const mergeFeatures = (
  base: FaceFeatures,
  update: Partial<FaceFeatures> | undefined
): FaceFeatures => ({
  ...base,
  ...update
});

const mergeParts = (
  base: Required<PartStyleConfig>,
  update: PartStyleConfig | undefined
): Required<PartStyleConfig> => ({
  ...base,
  ...update
});

const resolveFaceTheme = (
  faceTheme: FaceThemeName | FaceThemeDefinition
): FaceThemeDefinition => (typeof faceTheme === "string" ? FACE_THEMES[faceTheme] : faceTheme);

const DEFAULT_BACKGROUND_FX: ResolvedBackgroundFx = {
  mode: "off",
  color: "#ffb36b",
  intensity: 0.22,
  pulseHz: 0.9
};

const EMOTION_BACKGROUND_FX: Partial<Record<keyof typeof EMOTIONS, Omit<ResolvedBackgroundFx, "mode">>> = {
  happy: { color: "#ffcf76", intensity: 0.18, pulseHz: 1.1 },
  love: { color: "#ff7ea8", intensity: 0.22, pulseHz: 1.2 },
  sad: { color: "#5e89d6", intensity: 0.16, pulseHz: 0.45 },
  angry: { color: "#ff1408", intensity: 0.36, pulseHz: 2.35 },
  surprised: { color: "#fff2b1", intensity: 0.2, pulseHz: 1.6 },
  confused: { color: "#8bcbff", intensity: 0.17, pulseHz: 0.8 },
  thinking: { color: "#9ab0ff", intensity: 0.16, pulseHz: 0.55 },
  sleepy: { color: "#6787b0", intensity: 0.12, pulseHz: 0.3 },
  excited: { color: "#ffd86d", intensity: 0.24, pulseHz: 2.3 },
  listening: { color: "#7de8ff", intensity: 0.14, pulseHz: 0.8 },
  speaking: { color: "#86f0ff", intensity: 0.17, pulseHz: 1.5 },
  offline: { color: "#34404f", intensity: 0.12, pulseHz: 0.2 },
  booting: { color: "#a8d7ff", intensity: 0.2, pulseHz: 2.1 },
  glitch: { color: "#ff789a", intensity: 0.26, pulseHz: 7 }
};

const EMOTION_SYMBOLS: Partial<Record<keyof typeof EMOTIONS, SymbolName>> = {
  love: "heart",
  confused: "question",
  thinking: "ellipsis",
  offline: "offline",
  booting: "loading",
  glitch: "warning",
  surprised: "exclamation"
};

const resolveBackgroundFx = (
  config: BackgroundFxMode | BackgroundFxConfig | undefined
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
    mode: config.mode ?? DEFAULT_BACKGROUND_FX.mode
  };
};

const neutralMouth = EMOTIONS.neutral.pose.mouth;

const mouthPreset = (
  kind: "smile" | "frown" | "pout",
  amount: number,
  options: MouthExpressionOptions = {}
): Partial<MouthPose> => {
  const t = clamp(amount, 0, 1);
  const open = options.open ?? false;

  if (kind === "smile") {
    return {
      openness: lerp(neutralMouth.openness, open ? 0.08 : 0.01, t),
      curvature: lerp(neutralMouth.curvature, 0.56, t),
      width: lerp(neutralMouth.width, 0.96, t),
      tilt: lerp(neutralMouth.tilt, 0, t),
      brightness: lerp(neutralMouth.brightness, 1.04, t)
    };
  }

  if (kind === "frown") {
    return {
      openness: lerp(neutralMouth.openness, open ? 0.08 : 0.01, t),
      curvature: lerp(neutralMouth.curvature, -0.56, t),
      width: lerp(neutralMouth.width, 0.94, t),
      tilt: lerp(neutralMouth.tilt, 0, t),
      brightness: lerp(neutralMouth.brightness, 1.02, t)
    };
  }

  return {
    openness: lerp(neutralMouth.openness, open ? 0.08 : 0.03, t),
    curvature: lerp(neutralMouth.curvature, -0.02, t),
    width: lerp(neutralMouth.width, 0.44, t),
    tilt: lerp(neutralMouth.tilt, 0, t),
    brightness: lerp(neutralMouth.brightness, 1.04, t)
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
    private readonly doneValue: TDone
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
  constructor(private readonly pose: FacePose, private readonly doneValue: TDone) {}

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
  constructor(private readonly pose: FacePose, private readonly doneValue: TDone) {}

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
  private readonly ctx: CanvasRenderingContext2D;
  private readonly currentPose = createPose();
  private readonly basePose = createPose();
  private readonly composedPose = createPose();
  private readonly targetEmotionPose = createPose();
  private readonly fromEmotionPose = createPose();
  private readonly manualPose = createUnsetPose();

  private readonly bothEyesControl = new EyeControl(this.manualPose, (pose) => [pose.leftEye, pose.rightEye], this);
  private readonly leftEyeControl = new EyeControl(this.manualPose, (pose) => [pose.leftEye], this);
  private readonly rightEyeControl = new EyeControl(this.manualPose, (pose) => [pose.rightEye], this);
  private readonly mouthControl = new MouthControl(this.manualPose, this);
  private readonly noseControl = new NoseControl(this.manualPose, this);

  private theme: ThemeDefinition;
  private style: StyleDefinition;
  private features: FaceFeatures;
  private parts: Required<PartStyleConfig>;
  private mode: DisplayMode;
  private symbolName: SymbolName | null;
  private backgroundFx: ResolvedBackgroundFx;
  private running = false;
  private rafId = 0;
  private lastTime = 0;
  private elapsed = 0;
  private dpr = 1;
  private logicalWidth = 0;
  private logicalHeight = 0;

  private currentEmotionName: keyof typeof EMOTIONS = "neutral";
  private emotionTargetName: keyof typeof EMOTIONS = "neutral";
  private emotionIntensity = 1;
  private emotionFromTime = 0;
  private emotionDurationMs = EMOTIONS.neutral.durationMs;
  private emotionEase: EasingName = EMOTIONS.neutral.ease;
  private emotionPendingPostPerformance: keyof typeof EMOTIONS | null = null;

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

  private performance: PerformanceState = "idle";
  private performanceStartedAt = 0;
  private performanceDurationMs = 0;

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

  constructor(private readonly canvas: HTMLCanvasElement, options: RobotFaceOptions = {}) {
    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("Canvas 2D context is required.");
    }

    this.ctx = context;
    this.theme = resolveTheme("cyan");
    this.style = resolveStyle("classic");
    this.features = { ...FACE_FEATURE_DEFAULTS };
    this.parts = { ...PART_STYLE_DEFAULTS };
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
    this.dpr = options.pixelRatio ?? (typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1);
    this.autoBlinkInMs = this.randomBlinkDelay(EMOTIONS.neutral);

    copyPose(this.currentPose, EMOTIONS.neutral.pose);
    copyPose(this.basePose, EMOTIONS.neutral.pose);
    copyPose(this.targetEmotionPose, EMOTIONS.neutral.pose);
    copyPose(this.fromEmotionPose, EMOTIONS.neutral.pose);

    if (options.autoStart !== false) {
      this.start();
    }
  }

  emote(name: keyof typeof EMOTIONS, options: EmoteOptions = {}): RobotFace {
    const definition = EMOTIONS[name];
    this.clearManualOverrides();
    this.currentEmotionName = this.emotionTargetName;
    copyPose(this.fromEmotionPose, this.basePose);
    this.emotionTargetName = name;
    this.emotionIntensity = clamp(options.intensity ?? 1, 0, 1);
    blendPoseFromNeutral(definition.pose, this.emotionIntensity, this.targetEmotionPose);
    this.emotionFromTime = this.elapsed;
    this.emotionDurationMs = definition.durationMs;
    this.emotionEase = definition.ease;
    this.blinkDurationMs = definition.blinkDurationMs;
    this.autoBlinkInMs = this.randomBlinkDelay(definition);
    if (name !== "speaking") {
      this.speakingEnabled = false;
      this.speakingUntil = 0;
      this.speakingTarget = 0;
    }
    return this;
  }

  perform(name: PerformanceName): RobotFace {
    this.clearManualOverrides();
    this.performance = name;
    this.performanceStartedAt = this.elapsed;
    this.performanceDurationMs = name === "bootUp" ? 1450 : 900;
    if (name === "bootUp") {
      this.emotionPendingPostPerformance = "neutral";
      this.emote("booting", { intensity: 1 });
    }
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
    if (config.pixelRatio) {
      this.dpr = Math.max(1, config.pixelRatio);
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

  private applyFaceThemeDefinition(faceTheme: FaceThemeDefinition, resetProfile = false): void {
    if (resetProfile) {
      this.features = { ...FACE_FEATURE_DEFAULTS };
      this.parts = { ...PART_STYLE_DEFAULTS };
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
    const emotionDefinition = EMOTIONS[this.emotionTargetName];
    const emotionProgress = clamp((this.elapsed - this.emotionFromTime) / this.emotionDurationMs, 0, 1);
    lerpPose(this.basePose, this.fromEmotionPose, this.targetEmotionPose, ease(this.emotionEase, emotionProgress));

    if (emotionProgress >= 1) {
      this.currentEmotionName = this.emotionTargetName;
    }

    this.lookX = damp(this.lookX, this.lookTargetX, dt, 9);
    this.lookY = damp(this.lookY, this.lookTargetY, dt, 9);

    if (this.blinkActive) {
      this.blinkProgress += dtMs / this.blinkDurationMs;
      if (this.blinkProgress >= 1) {
        this.blinkActive = false;
        this.blinkProgress = 0;
        this.autoBlinkInMs = this.randomBlinkDelay(emotionDefinition);
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
      this.speakingEnabled = false;
      this.speakingTarget = 0;
      this.speakingUntil = 0;
    }

    if (this.emotionTargetName === "speaking" && this.speakingTarget < 0.2) {
      this.speakingEnabled = true;
      this.speakingTarget = 0.3;
    }

    this.speakingAmount = damp(this.speakingAmount, this.speakingTarget, dt, 8);
    this.speakingPhase += dt * this.speakingCadence;

    if (this.performance !== "idle") {
      const performanceProgress = clamp(
        (this.elapsed - this.performanceStartedAt) / this.performanceDurationMs,
        0,
        1
      );
      if (performanceProgress >= 1) {
        const completed = this.performance;
        this.performance = "idle";
        if (completed === "bootUp" && this.emotionPendingPostPerformance) {
          const next = this.emotionPendingPostPerformance;
          this.emotionPendingPostPerformance = null;
          this.emote(next, { intensity: 1 });
        }
      }
    }

    this.composePose(dt);
  }

  private composePose(dt: number): void {
    const definition = EMOTIONS[this.emotionTargetName];
    copyPose(this.composedPose, this.basePose);
    applyOverrides(this.composedPose, this.manualPose);

    const intensity = this.emotionIntensity;
    const bobWave = wave(this.elapsed / 1000, definition.microBobHz);
    const swayWave = wave((this.elapsed + 270) / 1000, definition.microBobHz * 0.5);
    this.composedPose.global.bob += definition.microBob * bobWave * intensity;
    this.composedPose.leftEye.tilt += definition.microSway * 0.18 * swayWave * intensity;
    this.composedPose.rightEye.tilt -= definition.microSway * 0.18 * swayWave * intensity;

    if (this.emotionTargetName === "confused") {
      const delay = 0.5 + 0.5 * wave(this.elapsed / 1000, 1.1);
      const mouthWobble = wave((this.elapsed + 140) / 1000, 2.2);
      const mouthDrift = wave((this.elapsed + 20) / 1000, 0.8);
      this.composedPose.rightEye.openness -= 0.08 * delay;
      this.composedPose.mouth.tilt += 0.08 * delay + mouthWobble * 0.04;
      this.composedPose.mouth.curvature += mouthWobble * 0.035;
      this.composedPose.mouth.width += mouthDrift * 0.02;
    }

    const blinkAmount = this.blinkActive ? Math.sin(Math.PI * this.blinkProgress) : 0;
    if (blinkAmount > 0) {
      this.composedPose.leftEye.openness *= 1 - 0.98 * blinkAmount;
      this.composedPose.rightEye.openness *= 1 - 0.98 * blinkAmount;
      this.composedPose.leftEye.squint = clamp(this.composedPose.leftEye.squint + blinkAmount * 0.5, 0, 1);
      this.composedPose.rightEye.squint = clamp(this.composedPose.rightEye.squint + blinkAmount * 0.5, 0, 1);
    }

    const winkAmount = this.winkActive ? Math.sin(Math.PI * this.winkProgress) : 0;
    if (winkAmount > 0) {
      const winkEye = this.winkSide === "left" ? this.composedPose.leftEye : this.composedPose.rightEye;
      winkEye.openness *= 1 - 0.985 * winkAmount;
      winkEye.squint = clamp(winkEye.squint + winkAmount * 0.55, 0, 1);
    }

    const lookStrength = 0.62;
    this.composedPose.leftEye.pupilX = clamp(this.composedPose.leftEye.pupilX + this.lookX * lookStrength, -1, 1);
    this.composedPose.rightEye.pupilX = clamp(this.composedPose.rightEye.pupilX + this.lookX * lookStrength, -1, 1);
    this.composedPose.leftEye.pupilY = clamp(this.composedPose.leftEye.pupilY + this.lookY * lookStrength, -1, 1);
    this.composedPose.rightEye.pupilY = clamp(this.composedPose.rightEye.pupilY + this.lookY * lookStrength, -1, 1);
    this.composedPose.leftEye.tilt += this.lookX * 0.04;
    this.composedPose.rightEye.tilt += this.lookX * 0.04;

    const talkOverlay =
      this.speakingAmount > 0.001
        ? (0.25 + 0.75 * Math.pow(Math.abs(Math.sin(this.speakingPhase * Math.PI)), 0.8)) * this.speakingAmount
        : 0;
    if (talkOverlay > 0) {
      this.composedPose.mouth.openness = clamp(this.composedPose.mouth.openness + talkOverlay * 1.08, 0, 1);
      this.composedPose.mouth.width = clamp(this.composedPose.mouth.width + talkOverlay * 0.15, 0.2, 1.2);
      this.composedPose.mouth.curvature = damp(this.composedPose.mouth.curvature, 0.05, dt, 10);
      this.composedPose.mouth.brightness += talkOverlay * 0.3;
      this.composedPose.global.glow += talkOverlay * 0.08;
      this.composedPose.global.flicker += talkOverlay * 0.05;
      this.composedPose.leftEye.openness = clamp(this.composedPose.leftEye.openness - talkOverlay * 0.05, 0, 1);
      this.composedPose.rightEye.openness = clamp(this.composedPose.rightEye.openness - talkOverlay * 0.05, 0, 1);
    }

    if (this.performance !== "idle") {
      const performanceProgress = clamp(
        (this.elapsed - this.performanceStartedAt) / this.performanceDurationMs,
        0,
        1
      );

      if (this.performance === "glitch") {
        const burst = Math.sin(performanceProgress * Math.PI);
        this.composedPose.global.jitter += 0.018 * burst;
        this.composedPose.global.distortion += 0.5 * burst;
        this.composedPose.global.flicker += 0.4 * burst;
        this.composedPose.leftEye.openness = clamp(
          this.composedPose.leftEye.openness - 0.12 * burst,
          0,
          1
        );
        this.composedPose.rightEye.openness = clamp(
          this.composedPose.rightEye.openness + 0.08 * burst,
          0,
          1
        );
        this.composedPose.mouth.tilt += 0.2 * burst * wave(this.elapsed / 1000, 12);
      }

      if (this.performance === "bootUp") {
        const open = ease("smooth", clamp((performanceProgress - 0.12) / 0.72, 0, 1));
        const brightness = ease("smooth", clamp((performanceProgress - 0.08) / 0.84, 0, 1));
        this.composedPose.leftEye.openness = Math.min(this.composedPose.leftEye.openness, 0.04 + open * 0.96);
        this.composedPose.rightEye.openness = Math.min(this.composedPose.rightEye.openness, 0.04 + open * 0.96);
        this.composedPose.mouth.openness *= brightness;
        this.composedPose.mouth.brightness *= brightness;
        this.composedPose.nose.brightness *= brightness;
        this.composedPose.global.glow *= 0.35 + brightness * 0.9;
        this.composedPose.global.scanline = Math.max(this.composedPose.global.scanline, 0.26);
        this.composedPose.global.flicker += (1 - brightness) * 0.24;
      }
    }

    const current = this.currentPose;
    current.leftEye.openness = damp(current.leftEye.openness, this.composedPose.leftEye.openness, dt, 16);
    current.leftEye.squint = damp(current.leftEye.squint, this.composedPose.leftEye.squint, dt, 14);
    current.leftEye.tilt = damp(current.leftEye.tilt, this.composedPose.leftEye.tilt, dt, 14);
    current.leftEye.pupilX = damp(current.leftEye.pupilX, this.composedPose.leftEye.pupilX, dt, 18);
    current.leftEye.pupilY = damp(current.leftEye.pupilY, this.composedPose.leftEye.pupilY, dt, 18);
    current.leftEye.brightness = damp(current.leftEye.brightness, this.composedPose.leftEye.brightness, dt, 12);
    current.rightEye.openness = damp(current.rightEye.openness, this.composedPose.rightEye.openness, dt, 16);
    current.rightEye.squint = damp(current.rightEye.squint, this.composedPose.rightEye.squint, dt, 14);
    current.rightEye.tilt = damp(current.rightEye.tilt, this.composedPose.rightEye.tilt, dt, 14);
    current.rightEye.pupilX = damp(current.rightEye.pupilX, this.composedPose.rightEye.pupilX, dt, 18);
    current.rightEye.pupilY = damp(current.rightEye.pupilY, this.composedPose.rightEye.pupilY, dt, 18);
    current.rightEye.brightness = damp(current.rightEye.brightness, this.composedPose.rightEye.brightness, dt, 12);
    current.nose.scale = damp(current.nose.scale, this.composedPose.nose.scale, dt, 10);
    current.nose.tilt = damp(current.nose.tilt, this.composedPose.nose.tilt, dt, 10);
    current.nose.brightness = damp(current.nose.brightness, this.composedPose.nose.brightness, dt, 10);
    current.mouth.openness = damp(current.mouth.openness, this.composedPose.mouth.openness, dt, 12);
    current.mouth.curvature = damp(current.mouth.curvature, this.composedPose.mouth.curvature, dt, 12);
    current.mouth.width = damp(current.mouth.width, this.composedPose.mouth.width, dt, 10);
    current.mouth.tilt = damp(current.mouth.tilt, this.composedPose.mouth.tilt, dt, 10);
    current.mouth.brightness = damp(current.mouth.brightness, this.composedPose.mouth.brightness, dt, 10);
    current.global.glow = damp(current.global.glow, this.composedPose.global.glow, dt, 10);
    current.global.bob = damp(current.global.bob, this.composedPose.global.bob, dt, 8);
    current.global.jitter = damp(current.global.jitter, this.composedPose.global.jitter, dt, 18);
    current.global.distortion = damp(current.global.distortion, this.composedPose.global.distortion, dt, 18);
    current.global.flicker = damp(current.global.flicker, this.composedPose.global.flicker, dt, 18);
    current.global.scanline = damp(current.global.scanline, this.composedPose.global.scanline, dt, 12);
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
    ctx.fillStyle = this.theme.background;
    ctx.fillRect(0, 0, width, height);

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
      pose.global.glow
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
        Math.max(4, panelRadius - innerPadding)
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
    this.drawLoveTransitionOverlay(width, height, pose);
    this.drawScrambleSlices(width, height, pose, flicker);
    ctx.restore();

    if (this.features.scanlines) {
      this.drawScanlines(panelX, panelY, panelWidth, panelHeight, pose.global.scanline);
    }
  }

  private drawFacePass(offsetX: number, offsetY: number, alpha: number, flicker: number): void {
    const ctx = this.ctx;
    const width = this.logicalWidth;
    const height = this.logicalHeight;
    const pose = this.currentPose;

    ctx.save();
    ctx.translate(offsetX, offsetY);
    ctx.globalAlpha = alpha;

    const style = this.style;
    const glow = Math.max(8, Math.min(width, height) * style.glowScale * pose.global.glow);
    const eyeHeightScale = clamp(this.parts.eyeHeightScale, 0.5, 1.8);
    const scaledEyeHeight = height * style.eyeHeight * eyeHeightScale;
    const defaultEyeTopY = height * (style.eyeY - style.eyeHeight * 0.5);
    const defaultBrowY = height * style.browY;
    const browOffsetFromEyeTop = defaultBrowY - defaultEyeTopY;
    const browExtraLift = Math.max(0, eyeHeightScale - 1) * scaledEyeHeight * 0.18;
    const dynamicBrowY = height * style.eyeY - scaledEyeHeight * 0.5 + browOffsetFromEyeTop - browExtraLift;
    const confusedBrowRaise = this.emotionTargetName === "confused" ? height * 0.024 : 0;
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
      ctx.globalAlpha *= this.resolveLoveFaceVisibility();
    }

    if (this.mode === "symbol") {
      this.drawSymbol(this.resolveSymbol(), width, height, pose);
      ctx.restore();
      return;
    }

    const eyeBaseY = height * style.eyeY;
    if (this.features.brows) {
      if (this.features.leftEye) {
        this.drawBrow(
          -width * style.eyeGap,
          leftBrowY,
          width * style.browWidth,
          height * style.browHeight,
          pose.leftEye,
          -1
        );
      }
      if (this.features.rightEye) {
        this.drawBrow(
          width * style.eyeGap,
          rightBrowY,
          width * style.browWidth,
          height * style.browHeight,
          pose.rightEye,
          1
        );
      }
    }
    if (this.features.leftEye) {
      this.drawEye(-width * style.eyeGap, eyeBaseY, width * style.eyeWidth, height * style.eyeHeight, pose.leftEye, -1);
    }
    if (this.features.rightEye) {
      this.drawEye(width * style.eyeGap, eyeBaseY, width * style.eyeWidth, height * style.eyeHeight, pose.rightEye, 1);
    }
    if (this.features.nose) {
      this.drawNose(0, height * style.noseY, width * style.noseWidth, height * style.noseHeight, pose.nose);
    }
    if (this.features.mouth) {
      this.drawMouth(0, height * style.mouthY, width * style.mouthWidth, height * style.mouthHeight, pose.mouth);
    }
    ctx.restore();
  }

  private drawScrambleSlices(width: number, height: number, pose: FacePose, flicker: number): void {
    const angryStrength = this.emotionTargetName === "angry" ? 0.16 : 0;
    const scramble = Math.max(angryStrength, pose.global.distortion * 0.7);

    if (scramble < 0.08 || this.mode === "symbol") {
      return;
    }

    const ctx = this.ctx;
    const isAngry = this.emotionTargetName === "angry";
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
        wave((this.elapsed + index * 140) / 1000, isAngry ? 8.8 - index * 0.35 : 8.5 - index * 0.45) *
        width *
        scramble *
        (isAngry ? 0.16 + index * 0.024 : 0.18 + index * 0.03);
      const offsetY =
        wave((this.elapsed + index * 110) / 1000, isAngry ? 8.6 : 10.5) *
        height *
        scramble *
        (isAngry ? 0.008 : 0.012);
      const alpha = isAngry
        ? (0.08 + scramble * 0.16) * angryPulse
        : 0.1 + scramble * 0.22;

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

  private drawEye(
    centerX: number,
    centerY: number,
    width: number,
    height: number,
    pose: EyePose,
    side: number
  ): void {
    const ctx = this.ctx;
    const openness = clamp(pose.openness, 0.01, 1);
    const squint = clamp(pose.squint, 0, 1);
    const baseHeight = height * clamp(this.parts.eyeHeightScale, 0.5, 1.8);
    const baseWidth = width * clamp(this.parts.eyeWidthScale, 0.5, 1.8);
    const eyeHeight = Math.max(
      baseHeight * 0.1,
      baseHeight * (0.18 + openness * 0.74) * (1 - squint * 0.52)
    );
    const radius = eyeHeight * this.style.eyeCorner;
    const eyeWidth = baseWidth * (0.82 + openness * 0.14);
    const pupilSize = Math.max(4, Math.min(eyeWidth, eyeHeight) * this.style.pupilScale);
    const lidCut = eyeHeight * squint * 0.24;
    const brightness = clamp(pose.brightness, 0.1, 1.8);
    const strokeWidth = Math.max(2, eyeHeight * 0.08);
    const eyeShape = this.parts.eyeShape;
    const glyphEye = eyeShape === "chevron" || eyeShape === "crescent" || eyeShape === "tear";

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(pose.tilt * 0.46);

    if (eyeHeight < height * 0.16) {
      ctx.lineWidth = strokeWidth;
      ctx.beginPath();
      ctx.moveTo(-eyeWidth * 0.5, 0);
      ctx.lineTo(eyeWidth * 0.5, 0);
      ctx.strokeStyle = this.theme.foreground;
      ctx.globalAlpha *= brightness;
      ctx.stroke();
      ctx.restore();
      return;
    }

    const faceAlpha = ctx.globalAlpha;
    ctx.globalAlpha *= brightness;
    if (glyphEye) {
      this.drawGlyphEye(eyeShape, eyeWidth, eyeHeight, side, openness, squint);
      ctx.restore();
      return;
    }

    this.drawEyeShell(eyeShape, -eyeWidth * 0.5, -eyeHeight * 0.5, eyeWidth, eyeHeight, radius);
    ctx.fill();

    ctx.globalAlpha *= 0.35;
    this.drawEyeShell(
      eyeShape,
      -eyeWidth * 0.5 + strokeWidth,
      -eyeHeight * 0.5 + strokeWidth,
      eyeWidth - strokeWidth * 2,
      eyeHeight - strokeWidth * 2,
      Math.max(2, radius - strokeWidth)
    );
    ctx.fillStyle = this.theme.accent;
    ctx.fill();

    if (this.features.pupils && this.eyeShapeSupportsPupil(eyeShape)) {
      ctx.save();
      ctx.globalAlpha = faceAlpha;
      ctx.fillStyle = this.emotionTargetName === "angry" ? PUPIL_FILL_ANGRY : PUPIL_FILL;
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
        pupilSize * 0.28
      );
      ctx.fill();
      ctx.restore();
    }

    if (lidCut > 0.01) {
      ctx.fillStyle = this.theme.panel;
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
  }

  private drawEyeShell(
    shape: EyeShapeName,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number
  ): void {
    const ctx = this.ctx;
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

  private eyeShapeSupportsPupil(shape: EyeShapeName): boolean {
    return shape === "rounded" || shape === "capsule" || shape === "pixel";
  }

  private drawGlyphEye(
    shape: EyeShapeName,
    width: number,
    height: number,
    side: number,
    openness: number,
    squint: number
  ): void {
    const ctx = this.ctx;

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

  private drawBrow(
    centerX: number,
    centerY: number,
    width: number,
    height: number,
    pose: EyePose,
    side: number
  ): void {
    const ctx = this.ctx;
    const shape = this.parts.browShape;
    const baseAngle = pose.tilt * 0.52 + pose.squint * 0.18 * -side;
    const angle =
      this.emotionTargetName === "confused"
        ? side === -1
          ? -0.2
          : -0.08
        : baseAngle;
    const lift = (1 - pose.openness) * height * 0.4;
    const brightness = clamp(pose.brightness, 0.1, 1.6);

    ctx.save();
    ctx.translate(centerX, centerY - lift);
    ctx.rotate(angle);
    ctx.fillStyle = this.theme.foreground;
    ctx.strokeStyle = this.theme.foreground;
    ctx.globalAlpha *= brightness * 0.9;
    ctx.lineWidth = Math.max(2, height * 0.7);

    if (shape === "line") {
      ctx.beginPath();
      ctx.moveTo(-width * 0.5, 0);
      ctx.lineTo(width * 0.5, 0);
      ctx.stroke();
      ctx.restore();
      return;
    }

    if (shape === "block") {
      roundedRect(ctx, -width * 0.5, -height * 0.5, width, height, height * 0.3);
      ctx.fill();
      ctx.restore();
      return;
    }

    ctx.beginPath();
    ctx.moveTo(-width * 0.48, height * 0.35);
    ctx.lineTo(-width * 0.18, -height * 0.45);
    ctx.lineTo(width * 0.5, -height * 0.12);
    ctx.lineTo(width * 0.2, height * 0.45);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  private drawNose(centerX: number, centerY: number, width: number, height: number, pose: NosePose): void {
    const ctx = this.ctx;
    const scale = clamp(pose.scale, 0.1, 1.5);
    const brightness = clamp(pose.brightness, 0.1, 1.6);
    const w = width * scale;
    const h = height * scale;

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(pose.tilt * 0.5);
    ctx.lineWidth = Math.max(2, w * 0.08);
    ctx.strokeStyle = this.theme.foreground;
    ctx.fillStyle = this.theme.foreground;
    ctx.globalAlpha *= brightness * 0.92;
    this.drawNoseShape(this.parts.noseShape, w, h);
    ctx.restore();
  }

  private drawNoseShape(shape: NoseShapeName, width: number, height: number): void {
    const ctx = this.ctx;
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

  private drawMouth(centerX: number, centerY: number, width: number, height: number, pose: MouthPose): void {
    const ctx = this.ctx;
    const curvature = clamp(pose.curvature, -1, 1);
    const mouthWidth = width * clamp(pose.width, 0.2, 1.2);
    const openness = clamp(pose.openness, 0, 1);
    const brightness = clamp(pose.brightness, 0.1, 1.8);
    const lift = curvature * height * 0.6;
    const openDepth = openness * height * 0.8;

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(pose.tilt * 0.26);
    const closedMouth = openDepth <= 1.5;
    ctx.lineWidth = closedMouth ? Math.max(3, height * 0.12) : Math.max(2, height * 0.08);
    ctx.strokeStyle = this.theme.foreground;
    ctx.fillStyle = this.theme.foreground;
    ctx.globalAlpha *= brightness * (closedMouth ? 1.08 : 1);
    if (closedMouth) {
      ctx.shadowBlur *= 1.2;
    }
    this.drawMouthShape(this.parts.mouthShape, mouthWidth, height, lift, openDepth);

    ctx.restore();
  }

  private drawMouthShape(shape: MouthShapeName, mouthWidth: number, height: number, lift: number, openDepth: number): void {
    const ctx = this.ctx;

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

  private drawBackgroundFx(
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number,
    glow: number
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

    const emotionFx = EMOTION_BACKGROUND_FX[this.emotionTargetName];
    if (!emotionFx) {
      return null;
    }

    return {
      ...DEFAULT_BACKGROUND_FX,
      ...emotionFx,
      mode: "emotion"
    };
  }

  private resolveSymbol(): SymbolName {
    return this.symbolName ?? EMOTION_SYMBOLS[this.emotionTargetName] ?? "ellipsis";
  }

  private resolveLoveTransitionProgress(): number {
    if (this.emotionTargetName !== "love") {
      return -1;
    }

    const elapsed = this.elapsed - this.emotionFromTime;
    if (elapsed < 0) {
      return -1;
    }

    const durationMs = 1180;
    if (elapsed > durationMs) {
      return -1;
    }

    return clamp(elapsed / durationMs, 0, 1);
  }

  private resolveLoveFaceVisibility(): number {
    const progress = this.resolveLoveTransitionProgress();
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
  }

  private drawHeartGlyph(centerX: number, centerY: number, size: number): void {
    const ctx = this.ctx;
    const pattern = [
      "01100110",
      "11111111",
      "11111111",
      "11111111",
      "01111110",
      "00111100",
      "00011000",
      "00000000"
    ];
    const firstRow = pattern[0]!;
    const cell = size / firstRow.length;
    const originX = centerX - (firstRow.length * cell) * 0.5;
    const originY = centerY - (pattern.length * cell) * 0.5;

    for (let row = 0; row < pattern.length; row += 1) {
      const line = pattern[row]!;
      for (let col = 0; col < line.length; col += 1) {
        if (line[col] !== "1") {
          continue;
        }

        ctx.fillRect(originX + col * cell, originY + row * cell, cell, cell);
      }
    }
  }

  private drawLoveTransitionOverlay(width: number, height: number, pose: FacePose): void {
    const progress = this.resolveLoveTransitionProgress();
    if (progress < 0 || this.mode !== "face") {
      return;
    }

    const ctx = this.ctx;
    let heartAlpha = 0;
    let swell = 0;

    if (progress >= 0.08 && progress < 0.28) {
      const t = ease("smooth", (progress - 0.08) / 0.2);
      heartAlpha = t;
      swell = t;
    } else if (progress >= 0.28 && progress < 0.76) {
      const holdPulse = 0.92 + 0.08 * (0.5 + 0.5 * wave(this.elapsed / 1000, 3.2));
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
    ctx.fillStyle = this.theme.panel;
    roundedRect(
      ctx,
      -width * 0.24,
      -height * 0.26 + pose.global.bob * height * 0.06,
      width * 0.48,
      height * 0.38,
      Math.min(width, height) * 0.06
    );
    ctx.fill();

    ctx.shadowColor = "#ff7b98";
    ctx.shadowBlur = heartSize * 0.4;
    ctx.globalAlpha = heartAlpha;
    ctx.fillStyle = "#ff305f";
    this.drawHeartGlyph(0, centerY, heartSize);

    ctx.shadowBlur = 0;
    ctx.globalAlpha = heartAlpha * 0.3;
    ctx.fillStyle = "#ff9ab3";
    this.drawHeartGlyph(0, centerY - heartSize * 0.04, heartSize * 0.62);
    ctx.restore();
  }

  private drawSymbol(symbol: SymbolName, width: number, height: number, pose: FacePose): void {
    const ctx = this.ctx;
    const scale = Math.min(width, height);
    const y = -height * 0.02 + pose.global.bob * height * 0.12;
    const brightness = clamp(pose.global.glow, 0.6, 1.6);

    ctx.globalAlpha *= brightness;
    ctx.lineWidth = Math.max(3, scale * 0.018);

    if (symbol === "question") {
      ctx.beginPath();
      ctx.moveTo(-scale * 0.1, y - scale * 0.16);
      ctx.quadraticCurveTo(scale * 0.12, y - scale * 0.3, scale * 0.16, y - scale * 0.08);
      ctx.quadraticCurveTo(scale * 0.18, y + scale * 0.04, scale * 0.02, y + scale * 0.1);
      ctx.lineTo(scale * 0.02, y + scale * 0.18);
      ctx.stroke();
      roundedRect(ctx, -scale * 0.03, y + scale * 0.28, scale * 0.06, scale * 0.06, scale * 0.02);
      ctx.fill();
      return;
    }

    if (symbol === "exclamation") {
      roundedRect(ctx, -scale * 0.035, y - scale * 0.24, scale * 0.07, scale * 0.32, scale * 0.025);
      ctx.fill();
      roundedRect(ctx, -scale * 0.03, y + scale * 0.18, scale * 0.06, scale * 0.06, scale * 0.02);
      ctx.fill();
      return;
    }

    if (symbol === "ellipsis") {
      for (let i = -1; i <= 1; i += 1) {
        roundedRect(ctx, i * scale * 0.12 - scale * 0.03, y + scale * 0.08, scale * 0.06, scale * 0.06, scale * 0.02);
        ctx.fill();
      }
      return;
    }

    if (symbol === "heart") {
      this.drawHeartGlyph(0, y, scale * 0.3);
      return;
    }

    if (symbol === "dead") {
      const eyeOffsetX = scale * 0.16;
      const eyeY = y - scale * 0.1;
      const eyeSize = scale * 0.07;
      ctx.beginPath();
      ctx.moveTo(-eyeOffsetX - eyeSize, eyeY - eyeSize);
      ctx.lineTo(-eyeOffsetX + eyeSize, eyeY + eyeSize);
      ctx.moveTo(-eyeOffsetX + eyeSize, eyeY - eyeSize);
      ctx.lineTo(-eyeOffsetX - eyeSize, eyeY + eyeSize);
      ctx.moveTo(eyeOffsetX - eyeSize, eyeY - eyeSize);
      ctx.lineTo(eyeOffsetX + eyeSize, eyeY + eyeSize);
      ctx.moveTo(eyeOffsetX + eyeSize, eyeY - eyeSize);
      ctx.lineTo(eyeOffsetX - eyeSize, eyeY + eyeSize);
      ctx.moveTo(-scale * 0.16, y + scale * 0.22);
      ctx.lineTo(scale * 0.16, y + scale * 0.22);
      ctx.stroke();
      return;
    }

    if (symbol === "offline") {
      roundedRect(ctx, -scale * 0.2, y - scale * 0.03, scale * 0.4, scale * 0.06, scale * 0.02);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-scale * 0.24, y - scale * 0.18);
      ctx.lineTo(scale * 0.24, y + scale * 0.18);
      ctx.stroke();
      return;
    }

    if (symbol === "loading") {
      const active = Math.floor((this.elapsed / 180) % 3);
      for (let i = 0; i < 3; i += 1) {
        ctx.save();
        ctx.globalAlpha *= i === active ? 1 : 0.35;
        roundedRect(ctx, (i - 1) * scale * 0.12 - scale * 0.03, y + scale * 0.06, scale * 0.06, scale * 0.16, scale * 0.02);
        ctx.fill();
        ctx.restore();
      }
      return;
    }

    ctx.beginPath();
    ctx.moveTo(0, y - scale * 0.22);
    ctx.lineTo(scale * 0.22, y + scale * 0.18);
    ctx.lineTo(-scale * 0.22, y + scale * 0.18);
    ctx.closePath();
    ctx.stroke();
    roundedRect(ctx, -scale * 0.025, y - scale * 0.02, scale * 0.05, scale * 0.12, scale * 0.015);
    ctx.fill();
    roundedRect(ctx, -scale * 0.025, y + scale * 0.13, scale * 0.05, scale * 0.05, scale * 0.015);
    ctx.fill();
  }

  private drawScanlines(x: number, y: number, width: number, height: number, strength: number): void {
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

  private randomBlinkDelay(definition: EmotionDefinition): number {
    const range = definition.blinkMaxMs - definition.blinkMinMs;
    return definition.blinkMinMs + range * (0.5 + 0.5 * Math.sin(this.elapsed * 0.0017 + 1.234));
  }
}

export const createRobotFace = (
  canvas: HTMLCanvasElement,
  options?: RobotFaceOptions
): RobotFace => new RobotFaceRenderer(canvas, options);
