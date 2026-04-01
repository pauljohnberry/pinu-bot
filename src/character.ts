import type { FaceStateDefinition } from "./stateDefinitions.js";
import type {
  DisplayMode,
  DisplayName,
  EmotionName,
  EyePose,
  FaceFeatures,
  FacePose,
  MouthPose,
  NosePose,
  OverlayActionName,
  PartStyleConfig,
  ReplaceActionName,
  StyleDefinition,
  ThemeDefinition,
} from "./types.js";

export interface DrawContext {
  ctx: CanvasRenderingContext2D;
  theme: ThemeDefinition;
  emotionName: EmotionName;
  actionName: ReplaceActionName | null;
  overlayActionName: OverlayActionName | null;
  displayName: DisplayName;
  elapsed: number;
  emotionFromTime: number;
  mode: DisplayMode;
  speakingAmount: number;
}

export interface EyeDrawParams {
  centerX: number;
  centerY: number;
  width: number;
  height: number;
  pose: EyePose;
  side: -1 | 1;
  style: StyleDefinition;
  features: FaceFeatures;
  parts: Required<PartStyleConfig>;
}

export interface BrowDrawParams {
  centerX: number;
  centerY: number;
  width: number;
  height: number;
  pose: EyePose;
  side: -1 | 1;
  parts: Required<PartStyleConfig>;
}

export interface NoseDrawParams {
  centerX: number;
  centerY: number;
  width: number;
  height: number;
  pose: NosePose;
  mouthPose?: MouthPose;
  parts: Required<PartStyleConfig>;
}

export interface MouthDrawParams {
  centerX: number;
  centerY: number;
  width: number;
  height: number;
  pose: MouthPose;
  parts: Required<PartStyleConfig>;
}

type CharacterShapeOptionKey = "eyeShape" | "noseShape" | "mouthShape" | "browShape";
type CharacterActionName = ReplaceActionName;

export type CharacterPartOptions = {
  [K in CharacterShapeOptionKey]: NonNullable<Required<PartStyleConfig>[K]>[];
};

export interface CharacterDefinition {
  name: string;

  partOptions: CharacterPartOptions;

  defaultParts: Required<PartStyleConfig>;
  defaultStyle: StyleDefinition;
  defaultFeatures?: Partial<FaceFeatures>;

  emotions?: Partial<Record<EmotionName, FaceStateDefinition>>;
  actions?: Partial<Record<CharacterActionName, FaceStateDefinition>>;

  drawEye(dc: DrawContext, params: EyeDrawParams): void;
  drawBrow(dc: DrawContext, params: BrowDrawParams): void;
  drawNose(dc: DrawContext, params: NoseDrawParams): void;
  drawMouth(dc: DrawContext, params: MouthDrawParams): void;

  drawOverlay?(dc: DrawContext, width: number, height: number, pose: FacePose): void;
  drawBackground?(dc: DrawContext, width: number, height: number, pose: FacePose): void;
  getFaceVisibility?(dc: DrawContext): number;
  getScrambleStrength?(displayName: DisplayName, baseDistortion: number): number;
}

const registry = new Map<string, CharacterDefinition>();

export function registerCharacter(character: CharacterDefinition): void {
  registry.set(character.name, character);
}

export function getCharacter(name: string): CharacterDefinition | undefined {
  return registry.get(name);
}
