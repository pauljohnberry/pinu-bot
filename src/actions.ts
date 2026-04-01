import { eye, type FaceStateDefinition, pose } from "./stateDefinitions.js";
import type { ActionName } from "./types.js";

type ReplaceActionName = Extract<ActionName, "thinking" | "listening" | "sleeping" | "offline">;

export const ACTION_NAMES = [
  "thinking",
  "listening",
  "sleeping",
  "offline",
  "bootUp",
  "glitch",
] as const satisfies readonly ActionName[];

export const ACTION_DEFINITIONS: Record<ReplaceActionName, FaceStateDefinition> = {
  thinking: {
    pose: pose(
      eye(0.7, 0.16, 0.1, 0.06, -0.1, 0.95),
      eye(0.62, 0.2, -0.16, 0.12, -0.14, 0.88),
      { scale: 0.94, tilt: -0.08, brightness: 0.9 },
      { openness: 0.03, curvature: -0.08, width: 0.68, tilt: 0.12, brightness: 0.88 },
      { glow: 0.9, bob: 0.008, jitter: 0, distortion: 0, flicker: 0.01, scanline: 0.14 },
    ),
    durationMs: 340,
    ease: "gentle",
    microBob: 0.007,
    microBobHz: 0.6,
    microSway: 0.07,
    blinkMinMs: 2600,
    blinkMaxMs: 5200,
    blinkDurationMs: 200,
  },
  listening: {
    pose: pose(
      eye(0.8, 0.06, -0.02, 0, 0, 1.02),
      eye(0.8, 0.06, 0.02, 0, 0, 1.02),
      { scale: 0.96, tilt: 0, brightness: 0.98 },
      { openness: 0.03, curvature: 0.12, width: 0.78, tilt: 0, brightness: 0.94 },
      { glow: 0.98, bob: 0.01, jitter: 0, distortion: 0, flicker: 0.012, scanline: 0.11 },
    ),
    durationMs: 260,
    ease: "smooth",
    microBob: 0.008,
    microBobHz: 0.85,
    microSway: 0.03,
    blinkMinMs: 3400,
    blinkMaxMs: 6200,
    blinkDurationMs: 170,
  },
  sleeping: {
    pose: pose(
      eye(0.28, 0.28, 0.06, 0, 0.08, 0.56),
      eye(0.28, 0.28, -0.06, 0, 0.08, 0.56),
      { scale: 0.82, tilt: 0, brightness: 0.5 },
      { openness: 0.01, curvature: -0.12, width: 0.7, tilt: 0, brightness: 0.54 },
      { glow: 0.52, bob: 0.004, jitter: 0, distortion: 0, flicker: 0.002, scanline: 0.22 },
    ),
    durationMs: 520,
    ease: "gentle",
    microBob: 0.005,
    microBobHz: 0.35,
    microSway: 0.015,
    blinkMinMs: 1800,
    blinkMaxMs: 3400,
    blinkDurationMs: 340,
  },
  offline: {
    pose: pose(
      eye(0.02, 0.3, 0, 0, 0, 0.18),
      eye(0.02, 0.3, 0, 0, 0, 0.18),
      { scale: 0.55, tilt: 0, brightness: 0.15 },
      { openness: 0, curvature: 0, width: 0.5, tilt: 0, brightness: 0.16 },
      { glow: 0.16, bob: 0, jitter: 0, distortion: 0, flicker: 0, scanline: 0.28 },
    ),
    durationMs: 400,
    ease: "gentle",
    microBob: 0,
    microBobHz: 0.1,
    microSway: 0,
    blinkMinMs: 20000,
    blinkMaxMs: 30000,
    blinkDurationMs: 300,
  },
};
