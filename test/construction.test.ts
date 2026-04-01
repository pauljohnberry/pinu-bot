import { describe, expect, test } from "bun:test";
import {
  BUILTIN_STYLES,
  type CharacterConstruction,
  createCapsule,
  createConstructionFrame,
  createConstructionLayout,
  createNotch,
  createPlate,
  createStyleConstructionLayout,
  createWedge,
  resolveConstructionAnchors,
  resolveEyeAnchor,
} from "../src/index";

describe("construction helpers", () => {
  test("creates normalized construction frame and layout defaults", () => {
    const frame = createConstructionFrame(320, 200);
    const layout = createConstructionLayout();

    expect(frame).toEqual({
      width: 320,
      height: 200,
      centerX: 0,
      centerY: 0,
    });
    expect(layout).toEqual({
      eyeGap: 0.22,
      eyeLineY: -0.02,
      centerlineBias: 0,
    });
  });

  test("resolves eye anchors from frame and layout", () => {
    const frame = createConstructionFrame(400, 240, {
      centerX: 10,
      centerY: -8,
    });
    const layout = createConstructionLayout({
      eyeGap: 0.3,
      eyeLineY: 0.12,
      centerlineBias: -0.04,
    });
    const anchors = resolveConstructionAnchors(frame, layout);

    expect(anchors.centerX).toEqual(-6);
    expect(anchors.centerY).toEqual(-8);
    expect(anchors.leftEyeX).toEqual(-66);
    expect(anchors.rightEyeX).toEqual(54);
    expect(anchors.eyeLineY).toBeCloseTo(20.8);

    const leftEye = resolveEyeAnchor(anchors, "left");
    const rightEye = resolveEyeAnchor(anchors, "right");
    expect(leftEye.x).toEqual(-66);
    expect(rightEye.x).toEqual(54);
    expect(leftEye.y).toBeCloseTo(20.8);
    expect(rightEye.y).toBeCloseTo(20.8);
  });

  test("creates semantic construction shapes with stable defaults", () => {
    expect(
      createPlate({
        width: 0.7,
        height: 0.22,
        y: -0.08,
      }),
    ).toEqual({
      kind: "plate",
      width: 0.7,
      height: 0.22,
      y: -0.08,
      inset: 0,
      taper: 0,
      tilt: 0,
    });

    expect(
      createCapsule({
        width: 0.2,
        height: 0.1,
        y: 0.04,
      }),
    ).toEqual({
      kind: "capsule",
      width: 0.2,
      height: 0.1,
      y: 0.04,
      radius: 0.5,
    });

    expect(
      createNotch({
        width: 0.08,
        height: 0.14,
        y: 0.02,
      }),
    ).toEqual({
      kind: "notch",
      width: 0.08,
      height: 0.14,
      y: 0.02,
    });

    expect(
      createWedge({
        width: 0.08,
        height: 0.15,
        y: 0.03,
      }),
    ).toEqual({
      kind: "wedge",
      width: 0.08,
      height: 0.15,
      y: 0.03,
      spread: 0.28,
    });
  });

  test("supports a composition-first face recipe with shared anchors", () => {
    const frame = createConstructionFrame(1, 1);
    const layout = createConstructionLayout({
      eyeGap: 0.26,
      eyeLineY: 0.04,
    });
    const anchors = resolveConstructionAnchors(frame, layout);

    const construction: CharacterConstruction = {
      layout,
      mask: {
        upper: createPlate({
          width: 0.74,
          height: 0.24,
          y: -0.04,
          taper: 0.14,
        }),
      },
      eyes: {
        socket: createPlate({
          width: 0.22,
          height: 0.14,
          y: anchors.eyeLineY,
          inset: 0.08,
          taper: 0.06,
        }),
        shell: createCapsule({
          width: 0.18,
          height: 0.1,
          y: anchors.eyeLineY,
        }),
        pupil: createNotch({
          width: 0.04,
          height: 0.06,
          y: anchors.eyeLineY,
        }),
      },
      nose: createWedge({
        width: 0.08,
        height: 0.14,
        y: 0.05,
      }),
      mouth: {
        anchorY: 0.18,
        width: 0.16,
      },
    };

    expect(construction.mask?.upper).toMatchObject({
      kind: "plate",
      width: 0.74,
      y: -0.04,
    });
    expect(construction.eyes.socket).toMatchObject({
      kind: "plate",
      y: anchors.eyeLineY,
    });
    expect(construction.eyes.shell).toMatchObject({
      kind: "capsule",
      y: anchors.eyeLineY,
    });
    expect(construction.nose).toMatchObject({
      kind: "wedge",
      y: 0.05,
    });
    expect(anchors.leftEyeX).toBeLessThan(anchors.centerX);
    expect(anchors.rightEyeX).toBeGreaterThan(anchors.centerX);
    expect(anchors.leftEyeX + anchors.rightEyeX).toBeCloseTo(anchors.centerX * 2, 6);
  });

  test("derives classic style anchors without changing renderer positions", () => {
    const frame = createConstructionFrame(720, 480);
    const layout = createStyleConstructionLayout(BUILTIN_STYLES.classic);
    const anchors = resolveConstructionAnchors(frame, layout);

    expect(anchors.leftEyeX).toBeCloseTo(-720 * BUILTIN_STYLES.classic.eyeGap, 6);
    expect(anchors.rightEyeX).toBeCloseTo(720 * BUILTIN_STYLES.classic.eyeGap, 6);
    expect(anchors.eyeLineY).toBeCloseTo(480 * BUILTIN_STYLES.classic.eyeY, 6);
    expect(anchors.centerX).toBe(0);
  });
});
