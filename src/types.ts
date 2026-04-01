import type { CharacterDefinition } from "./character.js";

export type EmotionName =
  | "neutral"
  | "happy"
  | "love"
  | "sad"
  | "angry"
  | "surprised"
  | "confused"
  | "excited";

export type ReplaceActionName = "thinking" | "listening" | "sleeping" | "offline";
export type OverlayActionName = "bootUp" | "glitch";
export type ActionName = ReplaceActionName | OverlayActionName;

export type DisplayName = EmotionName | ReplaceActionName;

export type ThemeName =
  | "amber"
  | "cyan"
  | "green-crt"
  | "white"
  | "red-alert"
  | "ice-blue"
  | "sunset"
  | "violet";

export type StylePresetName = "classic" | "soft" | "minimal" | "visor" | "industrial";
export type FaceThemeName =
  | "default"
  | "companion"
  | "service"
  | "sentinel"
  | "soft-smile"
  | "status-strip"
  | "caret-cheer"
  | "crescent-muse"
  | "teardrop-dream";
export type EyeShapeName = "soft" | "wide" | "block" | "sharp" | "sleepy" | "droplet";
export type NoseShapeName = "gem" | "pointed" | "bridge" | "button";
export type MouthShapeName = "soft" | "band" | "block";
export type BrowShapeName = "soft" | "bold" | "angled";
export type DisplayMode = "face" | "symbol";
export type WinkSide = "left" | "right";
export type SymbolName =
  | "question"
  | "exclamation"
  | "ellipsis"
  | "heart"
  | "offline"
  | "loading"
  | "warning";
export type BackgroundFxMode = "off" | "emotion" | "custom";

export interface ThemeDefinition {
  background: string;
  panel: string;
  panelEdge: string;
  foreground: string;
  glow: string;
  accent: string;
  ghost: string;
}

export interface StyleDefinition {
  panelInsetX: number;
  panelInsetY: number;
  panelRadius: number;
  panelInnerPadding: number;
  eyeWidth: number;
  eyeHeight: number;
  eyeY: number;
  eyeGap: number;
  eyeCorner: number;
  pupilScale: number;
  browWidth: number;
  browHeight: number;
  browY: number;
  noseWidth: number;
  noseHeight: number;
  noseY: number;
  mouthWidth: number;
  mouthHeight: number;
  mouthY: number;
  glowScale: number;
}

export interface FaceFeatures {
  leftEye: boolean;
  rightEye: boolean;
  brows: boolean;
  pupils: boolean;
  nose: boolean;
  mouth: boolean;
  panel: boolean;
  scanlines: boolean;
}

export interface PartStyleConfig {
  eyeShape?: EyeShapeName;
  eyeWidthScale?: number;
  eyeHeightScale?: number;
  noseShape?: NoseShapeName;
  mouthShape?: MouthShapeName;
  browShape?: BrowShapeName;
  scanlineThickness?: number;
  scanlineSpacing?: number;
}

export interface BackgroundFxConfig {
  mode?: BackgroundFxMode;
  color?: string;
  intensity?: number;
  pulseHz?: number;
}

export interface FaceThemeDefinition {
  theme?: ThemeName | ThemeDefinition;
  style?: StylePresetName | StyleDefinition;
  features?: Partial<FaceFeatures>;
  parts?: PartStyleConfig;
  mode?: DisplayMode;
  symbol?: SymbolName;
  backgroundFx?: BackgroundFxMode | BackgroundFxConfig;
}

export interface EyePose {
  openness: number;
  squint: number;
  tilt: number;
  pupilX: number;
  pupilY: number;
  brightness: number;
}

export interface NosePose {
  scale: number;
  tilt: number;
  brightness: number;
}

export interface MouthPose {
  openness: number;
  curvature: number;
  width: number;
  tilt: number;
  brightness: number;
}

export interface GlobalPose {
  glow: number;
  bob: number;
  jitter: number;
  distortion: number;
  flicker: number;
  scanline: number;
}

export interface FacePose {
  leftEye: EyePose;
  rightEye: EyePose;
  nose: NosePose;
  mouth: MouthPose;
  global: GlobalPose;
}

export type PartialFacePose = {
  leftEye?: Partial<EyePose>;
  rightEye?: Partial<EyePose>;
  nose?: Partial<NosePose>;
  mouth?: Partial<MouthPose>;
  global?: Partial<GlobalPose>;
};

export interface EmoteOptions {
  intensity?: number;
}

export interface ActionOptions {
  durationMs?: number;
  persistent?: boolean;
}

export interface TimedActionOptions {
  durationMs?: number;
}

export interface SpeakOptions {
  intensity?: number;
  cadence?: number;
  durationMs?: number;
  enabled?: boolean;
}

export interface MouthExpressionOptions {
  open?: boolean;
}

export interface RobotFaceConfig {
  character?: CharacterDefinition | string;
  faceTheme?: FaceThemeName | FaceThemeDefinition;
  theme?: ThemeName | ThemeDefinition;
  style?: StylePresetName | StyleDefinition;
  features?: Partial<FaceFeatures>;
  parts?: PartStyleConfig;
  mode?: DisplayMode;
  symbol?: SymbolName;
  backgroundFx?: BackgroundFxMode | BackgroundFxConfig;
  transparentBackground?: boolean;
  pixelRatio?: number;
}

export interface RobotFaceOptions {
  character?: CharacterDefinition | string;
  faceTheme?: FaceThemeName | FaceThemeDefinition;
  theme?: ThemeName | ThemeDefinition;
  style?: StylePresetName | StyleDefinition;
  features?: Partial<FaceFeatures>;
  parts?: PartStyleConfig;
  mode?: DisplayMode;
  symbol?: SymbolName;
  backgroundFx?: BackgroundFxMode | BackgroundFxConfig;
  transparentBackground?: boolean;
  autoStart?: boolean;
  pixelRatio?: number;
}

export interface EyeControlApi<TDone> {
  open(value: number): EyeControlApi<TDone>;
  squint(value: number): EyeControlApi<TDone>;
  tilt(value: number): EyeControlApi<TDone>;
  pupil(x: number, y: number): EyeControlApi<TDone>;
  brightness(value: number): EyeControlApi<TDone>;
  done(): TDone;
}

export interface MouthControlApi<TDone> {
  open(value: number): MouthControlApi<TDone>;
  smile(value: number): MouthControlApi<TDone>;
  width(value: number): MouthControlApi<TDone>;
  tilt(value: number): MouthControlApi<TDone>;
  brightness(value: number): MouthControlApi<TDone>;
  done(): TDone;
}

export interface NoseControlApi<TDone> {
  scale(value: number): NoseControlApi<TDone>;
  tilt(value: number): NoseControlApi<TDone>;
  brightness(value: number): NoseControlApi<TDone>;
  done(): TDone;
}

export interface RobotFace {
  setCharacter(character: CharacterDefinition | string): RobotFace;
  emote(name: EmotionName, options?: EmoteOptions): RobotFace;
  think(options?: ActionOptions): RobotFace;
  listen(options?: ActionOptions): RobotFace;
  sleep(options?: ActionOptions): RobotFace;
  goOffline(options?: ActionOptions): RobotFace;
  bootUp(options?: TimedActionOptions): RobotFace;
  glitch(options?: TimedActionOptions): RobotFace;
  reset(): RobotFace;
  transitionTo(state: PartialFacePose): RobotFace;
  lookAt(x: number, y: number): RobotFace;
  lookLeft(amount?: number): RobotFace;
  lookRight(amount?: number): RobotFace;
  lookUp(amount?: number): RobotFace;
  lookDown(amount?: number): RobotFace;
  smile(amount?: number, options?: MouthExpressionOptions): RobotFace;
  frown(amount?: number, options?: MouthExpressionOptions): RobotFace;
  pout(amount?: number, options?: MouthExpressionOptions): RobotFace;
  blink(): RobotFace;
  wink(side?: WinkSide): RobotFace;
  speak(options?: SpeakOptions): RobotFace;
  setTheme(theme: ThemeName | ThemeDefinition): RobotFace;
  setFaceTheme(faceTheme: FaceThemeName | FaceThemeDefinition): RobotFace;
  setStyle(style: StylePresetName | StyleDefinition): RobotFace;
  setParts(parts: PartStyleConfig): RobotFace;
  setMode(mode: DisplayMode): RobotFace;
  showSymbol(symbol: SymbolName): RobotFace;
  showFace(): RobotFace;
  setBackgroundFx(config: BackgroundFxMode | BackgroundFxConfig): RobotFace;
  configure(config: RobotFaceConfig): RobotFace;
  start(): RobotFace;
  stop(): RobotFace;
  destroy(): void;
  render(): RobotFace;
  eyes(): EyeControlApi<RobotFace>;
  leftEye(): EyeControlApi<RobotFace>;
  rightEye(): EyeControlApi<RobotFace>;
  mouth(): MouthControlApi<RobotFace>;
  nose(): NoseControlApi<RobotFace>;
}
