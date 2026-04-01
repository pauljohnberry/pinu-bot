import { describe, expect, test } from "bun:test";
import {
  drawStandardGlyphEye,
  eyeShapeSupportsPupil,
  resolveStandardEyeMetrics,
  resolveStandardMouthMetrics,
  resolveStandardNoseMetrics,
} from "../src/index";

class FakeContext2D {
  operations: string[] = [];
  lineWidth = 1;

  beginPath(): void {
    this.operations.push("beginPath");
  }

  moveTo(): void {
    this.operations.push("moveTo");
  }

  lineTo(): void {
    this.operations.push("lineTo");
  }

  quadraticCurveTo(): void {
    this.operations.push("quadraticCurveTo");
  }

  bezierCurveTo(): void {
    this.operations.push("bezierCurveTo");
  }

  closePath(): void {
    this.operations.push("closePath");
  }

  fill(): void {
    this.operations.push("fill");
  }

  stroke(): void {
    this.operations.push("stroke");
  }
}

describe("standard face helpers", () => {
  test("identifies which built-in eye shapes support pupils", () => {
    expect(eyeShapeSupportsPupil("soft")).toBe(true);
    expect(eyeShapeSupportsPupil("wide")).toBe(true);
    expect(eyeShapeSupportsPupil("block")).toBe(true);
    expect(eyeShapeSupportsPupil("sharp")).toBe(false);
    expect(eyeShapeSupportsPupil("sleepy")).toBe(false);
    expect(eyeShapeSupportsPupil("droplet")).toBe(false);
  });

  test("resolves reusable standard eye metrics", () => {
    const metrics = resolveStandardEyeMetrics({
      width: 120,
      height: 80,
      openness: 0.84,
      squint: 0.08,
      eyeWidthScale: 1.1,
      eyeHeightScale: 0.9,
      widthBase: 0.82,
      widthOpenFactor: 0.14,
      pupilScale: 0.24,
    });

    expect(metrics.openness).toBeCloseTo(0.84, 6);
    expect(metrics.squint).toBeCloseTo(0.08, 6);
    expect(metrics.baseWidth).toBeCloseTo(132, 6);
    expect(metrics.baseHeight).toBeCloseTo(72, 6);
    expect(metrics.width).toBeGreaterThan(0);
    expect(metrics.height).toBeGreaterThan(0);
    expect(metrics.pupilSize).toBeGreaterThan(4);
  });

  test("resolves reusable standard nose and mouth metrics", () => {
    const noseMetrics = resolveStandardNoseMetrics({
      width: 60,
      height: 90,
      scale: 0.96,
    });
    const mouthMetrics = resolveStandardMouthMetrics({
      width: 180,
      height: 70,
      openness: 0.34,
      curvature: 0.18,
      widthScale: 0.92,
    });

    expect(noseMetrics.width).toBeCloseTo(57.6, 6);
    expect(noseMetrics.height).toBeCloseTo(86.4, 6);
    expect(mouthMetrics.width).toBeCloseTo(165.6, 6);
    expect(mouthMetrics.lift).toBeCloseTo(7.56, 6);
    expect(mouthMetrics.openDepth).toBeCloseTo(19.04, 6);
  });

  test("draws shared glyph-eye families with configurable line scales", () => {
    const ctx = new FakeContext2D() as unknown as CanvasRenderingContext2D;

    drawStandardGlyphEye(ctx, "sharp", 100, 60, -1, 0.8, 0.2, {
      lineWidthFloor: 1.5,
      sharpLineScale: 0.11,
    });
    drawStandardGlyphEye(ctx, "sleepy", 100, 60, 1, 0.4, 0.1, {
      lineWidthFloor: 1.5,
      sleepyLineScale: 0.13,
    });
    drawStandardGlyphEye(ctx, "droplet", 100, 60, 1, 0.6, 0.1);

    expect(ctx.operations.includes("stroke")).toBe(true);
    expect(ctx.operations.includes("fill")).toBe(true);
    expect(ctx.operations.includes("bezierCurveTo")).toBe(true);
  });
});
