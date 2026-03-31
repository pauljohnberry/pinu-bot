import type { FacePose } from "./types.js";

export interface FaceStateDefinition {
  pose: FacePose;
  durationMs: number;
  ease: "smooth" | "snap" | "gentle";
  microBob: number;
  microBobHz: number;
  microSway: number;
  blinkMinMs: number;
  blinkMaxMs: number;
  blinkDurationMs: number;
}

export const eye = (
  openness: number,
  squint: number,
  tilt: number,
  pupilX: number,
  pupilY: number,
  brightness: number,
) => ({
  openness,
  squint,
  tilt,
  pupilX,
  pupilY,
  brightness,
});

export const pose = (
  leftEye: FacePose["leftEye"],
  rightEye: FacePose["rightEye"],
  nose: FacePose["nose"],
  mouth: FacePose["mouth"],
  global: FacePose["global"],
): FacePose => ({
  leftEye,
  rightEye,
  nose,
  mouth,
  global,
});
