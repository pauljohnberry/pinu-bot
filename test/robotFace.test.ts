import { describe, expect, test } from "bun:test";
import {
  BUILTIN_EMOTIONS,
  BUILTIN_FACE_THEMES,
  BUILTIN_STYLES,
  type CharacterDefinition,
  createRobotFace,
} from "../src/index";

type RafCallback = (time: number) => void;

type FillRectCall = {
  x: number;
  y: number;
  width: number;
  height: number;
  fillStyle: string;
  globalAlpha: number;
};

class FakeContext2D {
  fillStyle = "";
  strokeStyle = "";
  shadowColor = "";
  lineCap: CanvasLineCap = "butt";
  lineJoin: CanvasLineJoin = "miter";
  lineWidth = 1;
  shadowBlur = 0;
  globalAlpha = 1;
  operations: string[] = [];
  fillRectCalls: FillRectCall[] = [];

  beginPath(): void {
    this.operations.push("beginPath");
  }

  moveTo(): void {
    this.operations.push("moveTo");
  }

  lineTo(): void {
    this.operations.push("lineTo");
  }

  arcTo(): void {
    this.operations.push("arcTo");
  }

  closePath(): void {
    this.operations.push("closePath");
  }

  rect(): void {
    this.operations.push("rect");
  }

  quadraticCurveTo(): void {
    this.operations.push("quadraticCurveTo");
  }

  fillRect(x: number, y: number, width: number, height: number): void {
    this.operations.push("fillRect");
    this.fillRectCalls.push({
      x,
      y,
      width,
      height,
      fillStyle: this.fillStyle,
      globalAlpha: this.globalAlpha,
    });
  }

  clearRect(): void {
    this.operations.push("clearRect");
  }

  fill(): void {
    this.operations.push("fill");
  }

  stroke(): void {
    this.operations.push("stroke");
  }

  clip(): void {
    this.operations.push("clip");
  }

  translate(): void {
    this.operations.push("translate");
  }

  rotate(): void {
    this.operations.push("rotate");
  }

  save(): void {
    this.operations.push("save");
  }

  restore(): void {
    this.operations.push("restore");
  }

  setTransform(): void {
    this.operations.push("setTransform");
  }

  reset(): void {
    this.operations = [];
    this.fillRectCalls = [];
  }
}

class FakeCanvas {
  width = 320;
  height = 200;
  clientWidth = 320;
  clientHeight = 200;
  readonly context = new FakeContext2D();

  getContext(type: string): CanvasRenderingContext2D | null {
    return type === "2d" ? (this.context as unknown as CanvasRenderingContext2D) : null;
  }
}

const installRaf = () => {
  let nextId = 1;
  const queue = new Map<number, RafCallback>();

  const request = ((callback: RafCallback) => {
    const id = nextId++;
    queue.set(id, callback);
    return id;
  }) as typeof requestAnimationFrame;

  const cancel = ((id: number) => {
    queue.delete(id);
  }) as typeof cancelAnimationFrame;

  Object.assign(globalThis, {
    requestAnimationFrame: request,
    cancelAnimationFrame: cancel,
  });

  return {
    step(time: number): void {
      const callbacks = [...queue.entries()];
      queue.clear();
      for (const [, callback] of callbacks) {
        callback(time);
      }
    },
    queued(): number {
      return queue.size;
    },
  };
};

describe("createRobotFace", () => {
  test("renders and resizes for pixel ratio", () => {
    const canvas = new FakeCanvas();
    const face = createRobotFace(canvas as unknown as HTMLCanvasElement, {
      autoStart: false,
      pixelRatio: 2,
    });

    face.render();

    expect(canvas.width).toBe(640);
    expect(canvas.height).toBe(400);
    expect(canvas.context.operations.includes("fillRect")).toBe(true);
    expect(canvas.context.operations.includes("stroke")).toBe(true);
  });

  test("supports chained controls and overlay methods without throwing", () => {
    const canvas = new FakeCanvas();
    const face = createRobotFace(canvas as unknown as HTMLCanvasElement, {
      autoStart: false,
    });

    face
      .emote("sad", { intensity: 0.8 })
      .lookAt(0.2, -0.15)
      .lookLeft(0.6)
      .lookUp(0.4)
      .smile(0.8, { open: false })
      .frown(0.45, { open: false })
      .pout(0.5, { open: false })
      .speak({ intensity: 0.4, durationMs: 400 })
      .blink()
      .wink("left")
      .eyes()
      .open(0.9)
      .squint(0.2)
      .done()
      .mouth()
      .smile(0.3)
      .done()
      .nose()
      .scale(1.1)
      .done()
      .setStyle(BUILTIN_STYLES.soft)
      .setFaceTheme(BUILTIN_FACE_THEMES.sentinel)
      .setParts({
        eyeShape: "block",
        eyeWidthScale: 0.7,
        eyeHeightScale: 1.35,
        browShape: "bold",
        noseShape: "button",
        mouthShape: "band",
        scanlineThickness: 2,
        scanlineSpacing: 6,
      })
      .setBackgroundFx({
        mode: "custom",
        color: "#ff9966",
        intensity: 0.18,
        pulseHz: 1.2,
      })
      .configure({
        mode: "symbol",
        symbol: "question",
        features: {
          brows: true,
          nose: false,
          panel: false,
        },
      })
      .setTheme({
        background: "#000",
        panel: "#111",
        panelEdge: "#222",
        foreground: "#0ff",
        glow: "rgba(0,255,255,0.5)",
        accent: "#fff",
        ghost: "rgba(255,255,255,0.1)",
      })
      .showFace()
      .showSymbol("warning")
      .render();

    expect(canvas.context.operations.length).toBeGreaterThan(0);
    expect(canvas.context.operations.includes("rect")).toBe(true);
  });

  test("supports transparentBackground and configure toggling", () => {
    const canvas = new FakeCanvas();
    const face = createRobotFace(canvas as unknown as HTMLCanvasElement, {
      autoStart: false,
      transparentBackground: true,
      backgroundFx: "off",
      features: {
        panel: false,
        scanlines: false,
      },
    });

    face.render();
    expect(
      canvas.context.fillRectCalls.some(
        (call) =>
          call.x === 0 &&
          call.y === 0 &&
          call.width === canvas.width &&
          call.height === canvas.height,
      ),
    ).toBe(false);

    canvas.context.reset();
    face.configure({ transparentBackground: false, backgroundFx: "off" });
    face.render();
    expect(
      canvas.context.fillRectCalls.some(
        (call) =>
          call.x === 0 &&
          call.y === 0 &&
          call.width === canvas.width &&
          call.height === canvas.height,
      ),
    ).toBe(true);

    canvas.context.reset();
    face.configure({ transparentBackground: true, backgroundFx: "off" });
    face.render();
    expect(
      canvas.context.fillRectCalls.some(
        (call) =>
          call.x === 0 &&
          call.y === 0 &&
          call.width === canvas.width &&
          call.height === canvas.height,
      ),
    ).toBe(false);
  });

  test("applies character defaults, background layers, and emotion overrides", () => {
    const raf = installRaf();
    const canvas = new FakeCanvas();
    let backgroundCalls = 0;
    let browCalls = 0;
    let lastEyeCenterX = 0;
    let lastNoseShape = "";
    let lastMouthOpenness = 0;

    const customCharacter: CharacterDefinition = {
      name: "spec-character",
      partOptions: {
        eyeShape: ["soft"],
        noseShape: ["pointed"],
        mouthShape: ["soft"],
        browShape: ["soft"],
      },
      defaultParts: {
        eyeShape: "soft",
        eyeWidthScale: "1",
        eyeHeightScale: "1",
        noseShape: "pointed",
        mouthShape: "soft",
        browShape: "soft",
        scanlineThickness: "1.5",
        scanlineSpacing: "5",
      },
      defaultStyle: {
        ...BUILTIN_STYLES.soft,
        eyeGap: 0.24,
      },
      defaultFeatures: {
        brows: false,
      },
      emotions: {
        happy: {
          ...BUILTIN_EMOTIONS.happy,
          pose: {
            ...BUILTIN_EMOTIONS.happy.pose,
            mouth: {
              ...BUILTIN_EMOTIONS.happy.pose.mouth,
              openness: 0.95,
            },
          },
        },
      },
      drawBackground() {
        backgroundCalls += 1;
      },
      drawEye(_dc, params) {
        lastEyeCenterX = params.centerX;
      },
      drawBrow() {
        browCalls += 1;
      },
      drawNose(_dc, params) {
        lastNoseShape = params.parts.noseShape;
      },
      drawMouth(_dc, params) {
        lastMouthOpenness = params.pose.openness;
      },
    };

    const face = createRobotFace(canvas as unknown as HTMLCanvasElement, {
      autoStart: true,
      character: customCharacter,
    });

    raf.step(0);

    expect(backgroundCalls).toBeGreaterThan(0);
    expect(browCalls).toBe(0);
    expect(lastEyeCenterX).toBeCloseTo(canvas.clientWidth * 0.24, 4);
    expect(lastNoseShape).toBe("pointed");
    face.emote("happy");
    raf.step(400);
    raf.step(800);

    expect(lastMouthOpenness).toBeGreaterThan(0.45);
    face.destroy();
  });

  test("starts, advances animation frames, and stops cleanly", () => {
    const raf = installRaf();
    const canvas = new FakeCanvas();
    const face = createRobotFace(canvas as unknown as HTMLCanvasElement, {
      autoStart: false,
    });

    face.start();
    expect(raf.queued()).toBe(1);

    raf.step(16);
    expect(canvas.context.operations.includes("clearRect")).toBe(true);

    face.perform("glitch");
    raf.step(32);
    raf.step(48);

    face.stop();
    expect(raf.queued()).toBe(0);
  });

  test("destroy stops the raf loop", () => {
    const raf = installRaf();
    const canvas = new FakeCanvas();
    const face = createRobotFace(canvas as unknown as HTMLCanvasElement, {
      autoStart: true,
    });

    expect(raf.queued()).toBe(1);
    face.destroy();
    expect(raf.queued()).toBe(0);
  });
});
