import { describe, expect, test } from "bun:test";
import {
  createBeak,
  createCapsule,
  createConstructionFrame,
  createConstructionLayout,
  createNotch,
  createPlate,
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

    expect(anchors).toEqual({
      centerX: -6,
      centerY: -8,
      eyeLineY: 20.799999999999997,
      leftEyeX: -66,
      rightEyeX: 54,
    });
    expect(resolveEyeAnchor(anchors, "left")).toEqual({ x: -66, y: 20.799999999999997 });
    expect(resolveEyeAnchor(anchors, "right")).toEqual({ x: 54, y: 20.799999999999997 });
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
      radius: 0.18,
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
      tilt: 0,
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
      createBeak({
        width: 0.08,
        height: 0.15,
        y: 0.03,
      }),
    ).toEqual({
      kind: "beak",
      width: 0.08,
      height: 0.15,
      y: 0.03,
      spread: 0.28,
    });
  });
});
