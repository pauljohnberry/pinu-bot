import type { EmotionDefinition } from "./emotions.js";
import type {
  DisplayMode,
  EmotionName,
  EyePose,
  FaceFeatures,
  FacePose,
  MouthPose,
  NosePose,
  PartStyleConfig,
  StyleDefinition,
  ThemeDefinition,
} from "./types.js";

export interface DrawContext {
  ctx: CanvasRenderingContext2D;
  theme: ThemeDefinition;
  emotionName: EmotionName;
  elapsed: number;
  emotionFromTime: number;
  mode: DisplayMode;
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

export type CharacterPartOptions = {
  [K in CharacterShapeOptionKey]: NonNullable<Required<PartStyleConfig>[K]>[];
};

export interface CharacterDefinition {
  name: string;

  partOptions: CharacterPartOptions;

  defaultParts: Required<PartStyleConfig>;
  defaultStyle: StyleDefinition;
  defaultFeatures?: Partial<FaceFeatures>;

  emotions?: Partial<Record<EmotionName, EmotionDefinition>>;

  drawEye(dc: DrawContext, params: EyeDrawParams): void;
  drawBrow(dc: DrawContext, params: BrowDrawParams): void;
  drawNose(dc: DrawContext, params: NoseDrawParams): void;
  drawMouth(dc: DrawContext, params: MouthDrawParams): void;

  drawOverlay?(dc: DrawContext, width: number, height: number, pose: FacePose): void;
  drawBackground?(dc: DrawContext, width: number, height: number, pose: FacePose): void;
  getFaceVisibility?(dc: DrawContext): number;
  getScrambleStrength?(emotionName: EmotionName, baseDistortion: number): number;
}

const registry = new Map<string, CharacterDefinition>();

export function registerCharacter(character: CharacterDefinition): void {
  registry.set(character.name, character);
}

export function getCharacter(name: string): CharacterDefinition | undefined {
  return registry.get(name);
}
