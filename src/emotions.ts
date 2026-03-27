import type { EmotionName, FacePose } from "./types.js";

export interface EmotionDefinition {
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

const eye = (
  openness: number,
  squint: number,
  tilt: number,
  pupilX: number,
  pupilY: number,
  brightness: number
) => ({
  openness,
  squint,
  tilt,
  pupilX,
  pupilY,
  brightness
});

const pose = (
  leftEye: FacePose["leftEye"],
  rightEye: FacePose["rightEye"],
  nose: FacePose["nose"],
  mouth: FacePose["mouth"],
  global: FacePose["global"]
): FacePose => ({
  leftEye,
  rightEye,
  nose,
  mouth,
  global
});

export const EMOTIONS: Record<EmotionName, EmotionDefinition> = {
  neutral: {
    pose: pose(
      eye(0.84, 0.08, -0.02, 0, 0, 1),
      eye(0.84, 0.08, 0.02, 0, 0, 1),
      { scale: 0.96, tilt: 0, brightness: 0.95 },
      { openness: 0.03, curvature: 0.02, width: 0.86, tilt: 0, brightness: 0.95 },
      { glow: 0.95, bob: 0.01, jitter: 0, distortion: 0, flicker: 0.01, scanline: 0.12 }
    ),
    durationMs: 280,
    ease: "smooth",
    microBob: 0.008,
    microBobHz: 0.7,
    microSway: 0.02,
    blinkMinMs: 3200,
    blinkMaxMs: 6200,
    blinkDurationMs: 170
  },
  happy: {
    pose: pose(
      eye(0.88, 0.16, 0.02, 0, -0.06, 1.16),
      eye(0.88, 0.16, -0.02, 0, -0.06, 1.16),
      { scale: 1.02, tilt: 0, brightness: 1.08 },
      { openness: 0.05, curvature: 0.78, width: 0.94, tilt: 0, brightness: 1.18 },
      { glow: 1.2, bob: 0.02, jitter: 0, distortion: 0, flicker: 0.02, scanline: 0.1 }
    ),
    durationMs: 260,
    ease: "smooth",
    microBob: 0.016,
    microBobHz: 1.8,
    microSway: 0.05,
    blinkMinMs: 3600,
    blinkMaxMs: 7200,
    blinkDurationMs: 160
  },
  love: {
    pose: pose(
      eye(0.7, 0.24, 0.05, 0, -0.1, 1.14),
      eye(0.7, 0.24, -0.05, 0, -0.1, 1.14),
      { scale: 1, tilt: 0, brightness: 1.04 },
      { openness: 0.04, curvature: 0.64, width: 0.74, tilt: 0, brightness: 1.08 },
      { glow: 1.24, bob: 0.018, jitter: 0, distortion: 0, flicker: 0.018, scanline: 0.09 }
    ),
    durationMs: 240,
    ease: "smooth",
    microBob: 0.018,
    microBobHz: 1.4,
    microSway: 0.05,
    blinkMinMs: 4600,
    blinkMaxMs: 8400,
    blinkDurationMs: 170
  },
  sad: {
    pose: pose(
      eye(0.5, 0.04, -0.05, 0, 0.16, 0.75),
      eye(0.5, 0.04, 0.05, 0, 0.16, 0.75),
      { scale: 0.88, tilt: 0, brightness: 0.72 },
      { openness: 0.01, curvature: -0.48, width: 0.74, tilt: 0, brightness: 0.74 },
      { glow: 0.72, bob: 0.006, jitter: 0, distortion: 0, flicker: 0.005, scanline: 0.18 }
    ),
    durationMs: 460,
    ease: "gentle",
    microBob: 0.006,
    microBobHz: 0.45,
    microSway: 0.015,
    blinkMinMs: 2400,
    blinkMaxMs: 4200,
    blinkDurationMs: 260
  },
  angry: {
    pose: pose(
      eye(0.46, 0.56, 0.28, 0, -0.04, 1.15),
      eye(0.46, 0.56, -0.28, 0, -0.04, 1.15),
      { scale: 1, tilt: 0.08, brightness: 1.05 },
      { openness: 0.05, curvature: -0.18, width: 0.92, tilt: 0, brightness: 1.14 },
      { glow: 1.14, bob: 0.01, jitter: 0.004, distortion: 0.18, flicker: 0.08, scanline: 0.16 }
    ),
    durationMs: 180,
    ease: "snap",
    microBob: 0.01,
    microBobHz: 2.1,
    microSway: 0.04,
    blinkMinMs: 5200,
    blinkMaxMs: 8200,
    blinkDurationMs: 120
  },
  surprised: {
    pose: pose(
      eye(1, 0, -0.02, 0, 0.02, 1.22),
      eye(1, 0, 0.02, 0, 0.02, 1.22),
      { scale: 1.08, tilt: 0, brightness: 1.12 },
      { openness: 0.62, curvature: 0.06, width: 0.62, tilt: 0, brightness: 1.2 },
      { glow: 1.22, bob: 0.014, jitter: 0, distortion: 0, flicker: 0.02, scanline: 0.08 }
    ),
    durationMs: 150,
    ease: "snap",
    microBob: 0.014,
    microBobHz: 1.4,
    microSway: 0.02,
    blinkMinMs: 9000,
    blinkMaxMs: 16000,
    blinkDurationMs: 130
  },
  confused: {
    pose: pose(
      eye(0.8, 0.08, 0.18, -0.02, 0.02, 0.98),
      eye(0.56, 0.18, -0.26, 0.08, 0.05, 0.92),
      { scale: 0.98, tilt: 0.12, brightness: 0.92 },
      { openness: 0.04, curvature: -0.06, width: 0.74, tilt: 0.14, brightness: 0.92 },
      { glow: 0.94, bob: 0.012, jitter: 0, distortion: 0, flicker: 0.018, scanline: 0.16 }
    ),
    durationMs: 320,
    ease: "smooth",
    microBob: 0.009,
    microBobHz: 0.9,
    microSway: 0.08,
    blinkMinMs: 3200,
    blinkMaxMs: 5200,
    blinkDurationMs: 200
  },
  thinking: {
    pose: pose(
      eye(0.7, 0.16, 0.1, 0.06, -0.1, 0.95),
      eye(0.62, 0.2, -0.16, 0.12, -0.14, 0.88),
      { scale: 0.94, tilt: -0.08, brightness: 0.9 },
      { openness: 0.03, curvature: -0.08, width: 0.68, tilt: 0.12, brightness: 0.88 },
      { glow: 0.9, bob: 0.008, jitter: 0, distortion: 0, flicker: 0.01, scanline: 0.14 }
    ),
    durationMs: 340,
    ease: "gentle",
    microBob: 0.007,
    microBobHz: 0.6,
    microSway: 0.07,
    blinkMinMs: 2600,
    blinkMaxMs: 5200,
    blinkDurationMs: 200
  },
  sleepy: {
    pose: pose(
      eye(0.28, 0.28, 0.06, 0, 0.08, 0.56),
      eye(0.28, 0.28, -0.06, 0, 0.08, 0.56),
      { scale: 0.82, tilt: 0, brightness: 0.5 },
      { openness: 0.01, curvature: -0.12, width: 0.7, tilt: 0, brightness: 0.54 },
      { glow: 0.52, bob: 0.004, jitter: 0, distortion: 0, flicker: 0.002, scanline: 0.22 }
    ),
    durationMs: 520,
    ease: "gentle",
    microBob: 0.005,
    microBobHz: 0.35,
    microSway: 0.015,
    blinkMinMs: 1800,
    blinkMaxMs: 3400,
    blinkDurationMs: 340
  },
  excited: {
    pose: pose(
      eye(0.98, 0.06, -0.06, 0, -0.06, 1.28),
      eye(0.98, 0.06, 0.06, 0, -0.06, 1.28),
      { scale: 1.04, tilt: 0, brightness: 1.16 },
      { openness: 0.16, curvature: 0.82, width: 1, tilt: 0, brightness: 1.28 },
      { glow: 1.38, bob: 0.024, jitter: 0.001, distortion: 0, flicker: 0.03, scanline: 0.08 }
    ),
    durationMs: 160,
    ease: "snap",
    microBob: 0.02,
    microBobHz: 2.6,
    microSway: 0.06,
    blinkMinMs: 4200,
    blinkMaxMs: 7600,
    blinkDurationMs: 150
  },
  listening: {
    pose: pose(
      eye(0.8, 0.06, -0.02, 0, 0, 1.02),
      eye(0.8, 0.06, 0.02, 0, 0, 1.02),
      { scale: 0.96, tilt: 0, brightness: 0.98 },
      { openness: 0.03, curvature: 0.12, width: 0.78, tilt: 0, brightness: 0.94 },
      { glow: 0.98, bob: 0.01, jitter: 0, distortion: 0, flicker: 0.012, scanline: 0.11 }
    ),
    durationMs: 260,
    ease: "smooth",
    microBob: 0.008,
    microBobHz: 0.85,
    microSway: 0.03,
    blinkMinMs: 3400,
    blinkMaxMs: 6200,
    blinkDurationMs: 170
  },
  speaking: {
    pose: pose(
      eye(0.8, 0.1, -0.02, 0, 0, 1.06),
      eye(0.8, 0.1, 0.02, 0, 0, 1.06),
      { scale: 0.98, tilt: 0, brightness: 1 },
      { openness: 0.34, curvature: 0.18, width: 0.92, tilt: 0, brightness: 1.1 },
      { glow: 1.08, bob: 0.014, jitter: 0, distortion: 0, flicker: 0.018, scanline: 0.11 }
    ),
    durationMs: 180,
    ease: "smooth",
    microBob: 0.012,
    microBobHz: 1.2,
    microSway: 0.035,
    blinkMinMs: 3600,
    blinkMaxMs: 7000,
    blinkDurationMs: 160
  },
  offline: {
    pose: pose(
      eye(0.02, 0.3, 0, 0, 0, 0.18),
      eye(0.02, 0.3, 0, 0, 0, 0.18),
      { scale: 0.55, tilt: 0, brightness: 0.15 },
      { openness: 0, curvature: 0, width: 0.5, tilt: 0, brightness: 0.16 },
      { glow: 0.16, bob: 0, jitter: 0, distortion: 0, flicker: 0, scanline: 0.28 }
    ),
    durationMs: 400,
    ease: "gentle",
    microBob: 0,
    microBobHz: 0.1,
    microSway: 0,
    blinkMinMs: 20000,
    blinkMaxMs: 30000,
    blinkDurationMs: 300
  },
  booting: {
    pose: pose(
      eye(0.14, 0.16, 0, 0, 0, 0.74),
      eye(0.14, 0.16, 0, 0, 0, 0.74),
      { scale: 0.74, tilt: 0, brightness: 0.56 },
      { openness: 0.01, curvature: 0, width: 0.6, tilt: 0, brightness: 0.52 },
      { glow: 0.64, bob: 0, jitter: 0, distortion: 0.04, flicker: 0.12, scanline: 0.24 }
    ),
    durationMs: 220,
    ease: "snap",
    microBob: 0,
    microBobHz: 0.2,
    microSway: 0,
    blinkMinMs: 12000,
    blinkMaxMs: 18000,
    blinkDurationMs: 200
  },
  glitch: {
    pose: pose(
      eye(0.76, 0.22, 0.18, -0.06, 0.04, 1.08),
      eye(0.58, 0.32, -0.24, 0.14, -0.02, 0.96),
      { scale: 0.92, tilt: 0.18, brightness: 0.94 },
      { openness: 0.08, curvature: -0.1, width: 0.84, tilt: -0.16, brightness: 0.98 },
      { glow: 1.04, bob: 0.006, jitter: 0.01, distortion: 0.34, flicker: 0.24, scanline: 0.24 }
    ),
    durationMs: 120,
    ease: "snap",
    microBob: 0.008,
    microBobHz: 5,
    microSway: 0.12,
    blinkMinMs: 4200,
    blinkMaxMs: 8200,
    blinkDurationMs: 90
  }
};
