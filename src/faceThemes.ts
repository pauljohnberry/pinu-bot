import { STYLE_PRESETS } from "./styles.js";
import { THEMES } from "./themes.js";
import type { FaceThemeDefinition, FaceThemeName } from "./types.js";

export const FACE_THEMES: Record<FaceThemeName, FaceThemeDefinition> = {
  companion: {
    theme: THEMES.amber,
    style: STYLE_PRESETS.soft,
    parts: {
      eyeShape: "capsule",
      mouthShape: "arc",
      browShape: "line",
      scanlineThickness: 1.8,
      scanlineSpacing: 5,
    },
    backgroundFx: "emotion",
  },
  service: {
    theme: THEMES["green-crt"],
    style: STYLE_PRESETS.minimal,
    parts: {
      eyeShape: "pixel",
      mouthShape: "visor",
      browShape: "line",
      scanlineThickness: 2.2,
      scanlineSpacing: 4,
    },
    backgroundFx: "off",
  },
  sentinel: {
    theme: THEMES["red-alert"],
    style: STYLE_PRESETS.industrial,
    parts: {
      eyeShape: "capsule",
      mouthShape: "visor",
      browShape: "visor",
      noseShape: "bar",
      eyeWidthScale: 1.08,
      eyeHeightScale: 0.82,
      scanlineThickness: 2,
      scanlineSpacing: 4,
    },
    backgroundFx: "emotion",
  },
  "soft-smile": {
    theme: THEMES.sunset,
    style: STYLE_PRESETS.soft,
    features: {
      brows: false,
    },
    parts: {
      eyeShape: "capsule",
      mouthShape: "arc",
      scanlineThickness: 1.6,
      scanlineSpacing: 5,
    },
    backgroundFx: {
      mode: "custom",
      color: "#ffbe72",
      intensity: 0.14,
      pulseHz: 0.7,
    },
  },
  "status-strip": {
    theme: THEMES["green-crt"],
    style: STYLE_PRESETS.minimal,
    features: {
      nose: false,
      brows: false,
    },
    parts: {
      eyeShape: "capsule",
      eyeWidthScale: 0.72,
      eyeHeightScale: 0.82,
      mouthShape: "visor",
      scanlineThickness: 2.4,
      scanlineSpacing: 4,
    },
    backgroundFx: "off",
  },
  "caret-cheer": {
    theme: THEMES.sunset,
    style: STYLE_PRESETS.soft,
    features: {
      brows: false,
      pupils: false,
      nose: false,
    },
    parts: {
      eyeShape: "chevron",
      eyeWidthScale: 0.72,
      eyeHeightScale: 0.88,
      mouthShape: "arc",
      scanlineThickness: 1.8,
      scanlineSpacing: 5,
    },
    backgroundFx: {
      mode: "custom",
      color: "#ffb34d",
      intensity: 0.16,
      pulseHz: 1,
    },
  },
  "crescent-muse": {
    theme: THEMES.amber,
    style: STYLE_PRESETS.minimal,
    features: {
      brows: false,
      pupils: false,
      nose: false,
    },
    parts: {
      eyeShape: "crescent",
      eyeWidthScale: 0.82,
      eyeHeightScale: 1.08,
      mouthShape: "arc",
      scanlineThickness: 2,
      scanlineSpacing: 4,
    },
    backgroundFx: {
      mode: "custom",
      color: "#ffbf6a",
      intensity: 0.15,
      pulseHz: 0.7,
    },
  },
  "teardrop-dream": {
    theme: THEMES["ice-blue"],
    style: STYLE_PRESETS.soft,
    features: {
      brows: false,
      pupils: false,
    },
    parts: {
      eyeShape: "tear",
      eyeWidthScale: 0.7,
      eyeHeightScale: 1.2,
      noseShape: "dot",
      mouthShape: "arc",
      scanlineThickness: 1.9,
      scanlineSpacing: 5,
    },
    backgroundFx: {
      mode: "custom",
      color: "#72d7ff",
      intensity: 0.14,
      pulseHz: 0.55,
    },
  },
};
