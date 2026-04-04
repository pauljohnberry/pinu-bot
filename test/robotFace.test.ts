import { describe, expect, test } from "bun:test";
import {
  BUILTIN_EMOTIONS,
  BUILTIN_FACE_THEMES,
  BUILTIN_STYLES,
  buboCharacter,
  type CharacterDefinition,
  createRobotFace,
  getCharacter,
  kibaCharacter,
  registerCharacter,
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

type FillCall = {
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
  fillCalls: FillCall[] = [];

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

  bezierCurveTo(): void {
    this.operations.push("bezierCurveTo");
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
    this.fillCalls.push({
      fillStyle: this.fillStyle,
      globalAlpha: this.globalAlpha,
    });
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

  scale(_x: number, _y: number): void {
    this.operations.push("scale");
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
    this.fillCalls = [];
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
        eyeWidthScale: 1,
        eyeHeightScale: 1,
        noseShape: "pointed",
        mouthShape: "soft",
        browShape: "soft",
        scanlineThickness: 1.5,
        scanlineSpacing: 5,
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

  test("supports registered characters by name and setCharacter string path", () => {
    const canvas = new FakeCanvas();
    let eyeCalls = 0;
    let noseCalls = 0;

    const namedCharacter: CharacterDefinition = {
      name: "registry-spec-character",
      partOptions: {
        eyeShape: ["soft"],
        noseShape: ["pointed"],
        mouthShape: ["soft"],
        browShape: ["soft"],
      },
      defaultParts: {
        eyeShape: "soft",
        eyeWidthScale: 1,
        eyeHeightScale: 1,
        noseShape: "pointed",
        mouthShape: "soft",
        browShape: "soft",
        scanlineThickness: 1.5,
        scanlineSpacing: 5,
      },
      defaultStyle: BUILTIN_STYLES.soft,
      drawEye() {
        eyeCalls += 1;
      },
      drawBrow() {},
      drawNose() {
        noseCalls += 1;
      },
      drawMouth() {},
    };

    registerCharacter(namedCharacter);
    expect(getCharacter(namedCharacter.name)).toBe(namedCharacter);

    const face = createRobotFace(canvas as unknown as HTMLCanvasElement, {
      autoStart: false,
      character: namedCharacter.name,
    });

    face.render();
    expect(eyeCalls).toBeGreaterThan(0);

    eyeCalls = 0;
    noseCalls = 0;
    face.setCharacter(namedCharacter.name).render();

    expect(eyeCalls).toBeGreaterThan(0);
    expect(noseCalls).toBeGreaterThan(0);
  });

  test("registers and renders the built-in bubo character", () => {
    const canvas = new FakeCanvas();
    const face = createRobotFace(canvas as unknown as HTMLCanvasElement, {
      autoStart: false,
      character: "bubo",
      theme: "green-crt",
    });

    expect(getCharacter("bubo")).toBe(buboCharacter);

    face.render();

    expect(canvas.context.fillRectCalls.length).toBeGreaterThan(0);
  });

  test("sharp-cheer, sleepy-muse, and droplet-dream face themes preserve Bubo eye fills", () => {
    const canvas = new FakeCanvas();
    const face = createRobotFace(canvas as unknown as HTMLCanvasElement, {
      autoStart: false,
      character: "bubo",
    });

    for (const faceTheme of ["sharp-cheer", "sleepy-muse", "droplet-dream"] as const) {
      canvas.context.reset();
      face.setFaceTheme(faceTheme).render();

      expect(canvas.context.fillCalls.some((call) => call.fillStyle === "#ffcf5a")).toBe(true);
      expect(canvas.context.fillCalls.some((call) => call.fillStyle === "#140f18")).toBe(true);
    }
  });

  test("face theme aliases resolve to the canonical named presets", () => {
    expect(BUILTIN_FACE_THEMES.sharp).toBe(BUILTIN_FACE_THEMES["sharp-cheer"]);
    expect(BUILTIN_FACE_THEMES.sleepy).toBe(BUILTIN_FACE_THEMES["sleepy-muse"]);
    expect(BUILTIN_FACE_THEMES.droplet).toBe(BUILTIN_FACE_THEMES["droplet-dream"]);
    expect(BUILTIN_FACE_THEMES["caret-cheer"]).toBe(BUILTIN_FACE_THEMES["sharp-cheer"]);
    expect(BUILTIN_FACE_THEMES["crescent-muse"]).toBe(BUILTIN_FACE_THEMES["sleepy-muse"]);
    expect(BUILTIN_FACE_THEMES["teardrop-dream"]).toBe(BUILTIN_FACE_THEMES["droplet-dream"]);
  });

  test("bubo exposes shared brow and nose shapes and themed presets use them", () => {
    expect(buboCharacter.partOptions.browShape).toEqual(["soft", "bold", "angled"]);
    expect(buboCharacter.partOptions.noseShape).toEqual(["bridge", "gem", "pointed", "button"]);
    expect(BUILTIN_FACE_THEMES["sharp-cheer"].parts?.browShape).toBe("angled");
    expect(BUILTIN_FACE_THEMES["sleepy-muse"].parts?.browShape).toBe("soft");
    expect(BUILTIN_FACE_THEMES["droplet-dream"].parts?.browShape).toBe("bold");
  });

  test("bubo maps shared style presets to owl-specific geometry", () => {
    const canvas = new FakeCanvas();
    const face = createRobotFace(canvas as unknown as HTMLCanvasElement, {
      autoStart: false,
      character: "bubo",
    });

    face.setStyle("visor");

    const visorStyle = (
      face as unknown as {
        style: { eyeWidth: number; eyeHeight: number; eyeGap: number; panelRadius: number };
      }
    ).style;
    expect(visorStyle.eyeWidth).toBeCloseTo(0.428, 6);
    expect(visorStyle.eyeHeight).toBeCloseTo(0.336, 6);
    expect(visorStyle.eyeGap).toBeCloseTo(0.112, 6);
    expect(visorStyle.panelRadius).toBeCloseTo(0.084, 6);

    face.setStyle(BUILTIN_STYLES.minimal);

    const minimalStyle = (
      face as unknown as {
        style: { eyeWidth: number; eyeHeight: number; eyeGap: number; panelRadius: number };
      }
    ).style;
    expect(minimalStyle.eyeWidth).toBeCloseTo(0.334, 6);
    expect(minimalStyle.eyeHeight).toBeCloseTo(0.338, 6);
    expect(minimalStyle.eyeGap).toBeCloseTo(0.136, 6);
    expect(minimalStyle.panelRadius).toBeCloseTo(0.05, 6);
  });

  test("constructor style options respect locked character style presets", () => {
    const canvas = new FakeCanvas();
    const face = createRobotFace(canvas as unknown as HTMLCanvasElement, {
      autoStart: false,
      character: "bubo",
      style: "classic",
    });

    const style = (
      face as unknown as {
        style: { eyeWidth: number; eyeHeight: number; eyeGap: number; panelRadius: number };
      }
    ).style;

    expect(style.eyeWidth).toBeCloseTo(0.366, 6);
    expect(style.eyeHeight).toBeCloseTo(0.37, 6);
    expect(style.eyeGap).toBeCloseTo(0.128, 6);
    expect(style.panelRadius).toBeCloseTo(0.064, 6);
  });

  test("kiba face themes keep the nose for status-strip and preserve pupils on shared glyph themes", () => {
    const canvas = new FakeCanvas();
    const face = createRobotFace(canvas as unknown as HTMLCanvasElement, {
      autoStart: false,
      character: "kiba",
    });

    face.setFaceTheme("status-strip");

    const statusStripFeatures = (
      face as unknown as {
        features: { nose: boolean; brows: boolean };
      }
    ).features;
    expect(statusStripFeatures.nose).toBe(true);
    expect(statusStripFeatures.brows).toBe(false);

    for (const faceTheme of ["sharp-cheer", "sleepy-muse", "droplet-dream"] as const) {
      canvas.context.reset();
      face.setFaceTheme(faceTheme).render();
      expect(canvas.context.fillCalls.some((call) => call.fillStyle === "#000000")).toBe(true);
    }
  });

  test("kiba maps shared style presets to tighter dog-specific eye geometry", () => {
    const canvas = new FakeCanvas();
    const face = createRobotFace(canvas as unknown as HTMLCanvasElement, {
      autoStart: false,
      character: "kiba",
    });

    face.setStyle("visor");

    const visorStyle = (
      face as unknown as {
        style: { eyeWidth: number; eyeHeight: number; eyeGap: number; panelRadius: number };
      }
    ).style;
    expect(visorStyle.eyeWidth).toBeCloseTo(0.144, 6);
    expect(visorStyle.eyeHeight).toBeCloseTo(0.116, 6);
    expect(visorStyle.eyeGap).toBeCloseTo(0.126, 6);
    expect(visorStyle.panelRadius).toBeCloseTo(0.102, 6);

    face.setStyle(BUILTIN_STYLES.minimal);

    const minimalStyle = (
      face as unknown as {
        style: { eyeWidth: number; eyeHeight: number; eyeGap: number; panelRadius: number };
      }
    ).style;
    expect(minimalStyle.eyeWidth).toBeCloseTo(0.11, 6);
    expect(minimalStyle.eyeHeight).toBeCloseTo(0.118, 6);
    expect(minimalStyle.eyeGap).toBeCloseTo(0.134, 6);
    expect(minimalStyle.panelRadius).toBeCloseTo(0.064, 6);
  });

  test("throws for unknown character names", () => {
    const canvas = new FakeCanvas();

    expect(() =>
      createRobotFace(canvas as unknown as HTMLCanvasElement, {
        autoStart: false,
        character: "missing-character",
      }),
    ).toThrow('Unknown character: "missing-character". Register it with registerCharacter().');

    const face = createRobotFace(canvas as unknown as HTMLCanvasElement, {
      autoStart: false,
    });

    expect(() => face.setCharacter("missing-character")).toThrow(
      'Unknown character: "missing-character". Register it with registerCharacter().',
    );
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

    face.glitch();
    raf.step(32);
    raf.step(48);

    face.stop();
    expect(raf.queued()).toBe(0);
  });

  test("glitch overlays without replacing the current displayed emotion", () => {
    const raf = installRaf();
    const canvas = new FakeCanvas();
    const face = createRobotFace(canvas as unknown as HTMLCanvasElement, {
      autoStart: false,
    });

    face.emote("happy");
    face.start();
    raf.step(16);

    face.glitch();
    expect((face as unknown as { displayName: string }).displayName).toBe("happy");

    raf.step(136);

    expect((face as unknown as { displayName: string }).displayName).toBe("happy");
    expect(
      (face as unknown as { currentPose: { global: { distortion: number } } }).currentPose.global
        .distortion,
    ).toBeGreaterThan(0.02);
  });

  test("emotion changes cancel persistent non-emotional actions", () => {
    const canvas = new FakeCanvas();
    const face = createRobotFace(canvas as unknown as HTMLCanvasElement, {
      autoStart: false,
    });

    face.think({ persistent: true });
    expect((face as unknown as { displayName: string }).displayName).toBe("thinking");

    face.emote("sad");

    expect((face as unknown as { displayName: string }).displayName).toBe("sad");
    expect((face as unknown as { activeActionName: string | null }).activeActionName).toBeNull();
  });

  test("held actions still preserve the current emotion", () => {
    const raf = installRaf();

    const captureThinkCurvature = (emotion: "happy" | "sad"): number => {
      const canvas = new FakeCanvas();
      const face = createRobotFace(canvas as unknown as HTMLCanvasElement, {
        autoStart: true,
      });

      raf.step(0);
      face.emote(emotion);
      raf.step(300);
      raf.step(600);
      face.think({ persistent: true });
      raf.step(900);
      raf.step(1200);

      const curvature = (face as unknown as { currentPose: { mouth: { curvature: number } } })
        .currentPose.mouth.curvature;

      face.destroy();
      return curvature;
    };

    const happyThinkCurvature = captureThinkCurvature("happy");
    const sadThinkCurvature = captureThinkCurvature("sad");

    expect(happyThinkCurvature).toBeGreaterThan(sadThinkCurvature + 0.18);
  });

  test("characters receive both the base emotion and active action in draw context", () => {
    const canvas = new FakeCanvas();
    let capturedEmotionName = "";
    let capturedActionName: string | null = null;
    let capturedOverlayActionName: string | null = null;
    let capturedDisplayName = "";

    const spyKiba: CharacterDefinition = {
      ...kibaCharacter,
      name: "spy-kiba",
      drawBackground(dc, width, height, pose) {
        capturedEmotionName = dc.emotionName;
        capturedActionName = dc.actionName;
        capturedOverlayActionName = dc.overlayActionName;
        capturedDisplayName = dc.displayName;
        kibaCharacter.drawBackground?.(dc, width, height, pose);
      },
    };

    const face = createRobotFace(canvas as unknown as HTMLCanvasElement, {
      autoStart: false,
      character: spyKiba,
    });

    face.emote("angry").think({ persistent: true }).render();

    expect(capturedEmotionName).toBe("angry");
    expect(capturedActionName === "thinking").toBe(true);
    expect(capturedOverlayActionName).toBeNull();
    expect(capturedDisplayName).toBe("thinking");

    face.bootUp().render();

    expect(capturedEmotionName).toBe("angry");
    expect(capturedActionName === "thinking").toBe(true);
    expect(capturedOverlayActionName === "bootUp").toBe(true);
    expect(capturedDisplayName).toBe("thinking");
  });

  test("listening reads distinctly from neutral on pinu", () => {
    const raf = installRaf();
    const canvas = new FakeCanvas();
    const face = createRobotFace(canvas as unknown as HTMLCanvasElement, {
      autoStart: true,
    });

    raf.step(0);
    raf.step(300);
    const neutralPose = structuredClone(
      (
        face as unknown as {
          currentPose: {
            leftEye: { openness: number; brightness: number };
            rightEye: { openness: number; brightness: number };
            mouth: { curvature: number };
          };
        }
      ).currentPose,
    );

    face.listen({ persistent: true });
    raf.step(600);
    raf.step(900);

    const listeningPose = (
      face as unknown as {
        currentPose: {
          leftEye: { openness: number; brightness: number };
          rightEye: { openness: number; brightness: number };
          mouth: { curvature: number };
        };
      }
    ).currentPose;

    expect(listeningPose.leftEye.brightness).toBeGreaterThan(neutralPose.leftEye.brightness + 0.03);
    expect(listeningPose.rightEye.brightness).toBeGreaterThan(
      neutralPose.rightEye.brightness + 0.03,
    );
    expect(Math.abs(listeningPose.leftEye.openness - neutralPose.leftEye.openness)).toBeGreaterThan(
      0.04,
    );
    expect(Math.abs(listeningPose.mouth.curvature - neutralPose.mouth.curvature)).toBeGreaterThan(
      0.04,
    );

    face.destroy();
  });

  test("transitionTo applies partial manual overrides without disturbing unrelated pose groups", () => {
    const raf = installRaf();
    const canvas = new FakeCanvas();
    const face = createRobotFace(canvas as unknown as HTMLCanvasElement, {
      autoStart: true,
    });

    raf.step(0);
    raf.step(300);

    const baselinePose = structuredClone(
      (
        face as unknown as {
          currentPose: {
            leftEye: { openness: number; pupilX: number };
            rightEye: { openness: number };
            nose: { scale: number };
            mouth: { width: number; curvature: number };
          };
        }
      ).currentPose,
    );

    face.transitionTo({
      leftEye: { openness: 0.18, pupilX: -0.35 },
      mouth: { width: 0.42, curvature: -0.2 },
    });

    raf.step(600);
    raf.step(900);

    const currentPose = (
      face as unknown as {
        currentPose: {
          leftEye: { openness: number; pupilX: number };
          rightEye: { openness: number };
          nose: { scale: number };
          mouth: { width: number; curvature: number };
        };
      }
    ).currentPose;

    expect(currentPose.leftEye.openness).toBeLessThan(baselinePose.leftEye.openness - 0.25);
    expect(currentPose.leftEye.pupilX).toBeLessThan(baselinePose.leftEye.pupilX - 0.2);
    expect(currentPose.mouth.width).toBeLessThan(baselinePose.mouth.width - 0.2);
    expect(currentPose.mouth.curvature).toBeLessThan(baselinePose.mouth.curvature - 0.15);
    expect(Math.abs(currentPose.rightEye.openness - baselinePose.rightEye.openness)).toBeLessThan(
      0.08,
    );
    expect(Math.abs(currentPose.nose.scale - baselinePose.nose.scale)).toBeLessThan(0.05);

    face.destroy();
  });

  test("leftEye and rightEye controls clamp independently", () => {
    const canvas = new FakeCanvas();
    const face = createRobotFace(canvas as unknown as HTMLCanvasElement, {
      autoStart: false,
    });

    face.leftEye().open(1.4).pupil(-2, 2).brightness(3).done();
    face.rightEye().open(0.25).pupil(0.3, -0.4).brightness(0.45).done();

    const manualPose = (
      face as unknown as {
        manualPose: {
          leftEye: { openness: number; pupilX: number; pupilY: number; brightness: number };
          rightEye: { openness: number; pupilX: number; pupilY: number; brightness: number };
        };
      }
    ).manualPose;

    expect(manualPose.leftEye.openness).toBe(1);
    expect(manualPose.leftEye.pupilX).toBe(-1);
    expect(manualPose.leftEye.pupilY).toBe(1);
    expect(manualPose.leftEye.brightness).toBe(2);
    expect(manualPose.rightEye.openness).toBe(0.25);
    expect(manualPose.rightEye.pupilX).toBe(0.3);
    expect(manualPose.rightEye.pupilY).toBe(-0.4);
    expect(manualPose.rightEye.brightness).toBe(0.45);
  });

  test("sleep reads distinctly from neutral and keeps the action active when persistent", () => {
    const raf = installRaf();
    const canvas = new FakeCanvas();
    const face = createRobotFace(canvas as unknown as HTMLCanvasElement, {
      autoStart: true,
    });

    raf.step(0);
    raf.step(300);

    const neutralPose = structuredClone(
      (
        face as unknown as {
          currentPose: {
            leftEye: { openness: number };
            rightEye: { openness: number };
            nose: { brightness: number };
            global: { glow: number };
          };
        }
      ).currentPose,
    );

    face.sleep({ persistent: true });
    expect((face as unknown as { displayName: string }).displayName).toBe("sleeping");

    raf.step(900);
    raf.step(1200);
    raf.step(1500);

    const sleepingPose = face as unknown as {
      currentPose: {
        leftEye: { openness: number };
        rightEye: { openness: number };
        nose: { brightness: number };
        global: { glow: number };
      };
      activeActionName: string | null;
    };

    expect(sleepingPose.activeActionName).toBe("sleeping");
    expect(sleepingPose.currentPose.leftEye.openness).toBeLessThan(
      neutralPose.leftEye.openness - 0.12,
    );
    expect(sleepingPose.currentPose.rightEye.openness).toBeLessThan(
      neutralPose.rightEye.openness - 0.12,
    );
    expect(sleepingPose.currentPose.global.glow).toBeLessThan(neutralPose.global.glow - 0.12);
    expect(sleepingPose.currentPose.nose.brightness).toBeLessThan(
      neutralPose.nose.brightness - 0.1,
    );

    face.destroy();
  });

  test("non-emotional actions clear speaking overlays", () => {
    const canvas = new FakeCanvas();
    const face = createRobotFace(canvas as unknown as HTMLCanvasElement, {
      autoStart: false,
    });

    face.speak({ intensity: 0.5, durationMs: 5000 });
    face.goOffline({ persistent: true });

    expect((face as unknown as { speakingEnabled: boolean }).speakingEnabled).toBe(false);
    expect((face as unknown as { speakingTarget: number }).speakingTarget).toBe(0);

    face.speak({ intensity: 0.5, durationMs: 5000 });
    face.bootUp();

    expect((face as unknown as { speakingEnabled: boolean }).speakingEnabled).toBe(false);
    expect((face as unknown as { speakingTarget: number }).speakingTarget).toBe(0);
  });

  test("offline stages away from the current emotion and restores it after timing out", () => {
    const raf = installRaf();
    const canvas = new FakeCanvas();
    const face = createRobotFace(canvas as unknown as HTMLCanvasElement, {
      autoStart: true,
    });

    raf.step(0);
    face.emote("happy");
    raf.step(300);
    raf.step(600);

    const happyGlow = (face as unknown as { currentPose: { global: { glow: number } } }).currentPose
      .global.glow;

    face.goOffline({ durationMs: 900 });
    expect((face as unknown as { emotionTargetName: string }).emotionTargetName).toBe("happy");
    expect((face as unknown as { displayName: string }).displayName).toBe("offline");

    raf.step(1000);
    raf.step(1400);

    const offlineGlow = (face as unknown as { currentPose: { global: { glow: number } } })
      .currentPose.global.glow;
    expect(offlineGlow).toBeLessThan(happyGlow - 0.12);

    raf.step(2200);
    raf.step(3200);

    expect((face as unknown as { displayName: string }).displayName).toBe("happy");
    expect((face as unknown as { activeActionName: string | null }).activeActionName).toBeNull();

    const recoveredGlow = (face as unknown as { currentPose: { global: { glow: number } } })
      .currentPose.global.glow;
    expect(recoveredGlow).toBeGreaterThan(offlineGlow + 0.08);

    face.destroy();
  });

  test("timed action context persists while the action pose is still fading out", () => {
    const raf = installRaf();
    const canvas = new FakeCanvas();
    let capturedActionName: string | null = null;
    let capturedDisplayName = "";

    const spyKiba: CharacterDefinition = {
      ...kibaCharacter,
      name: "spy-kiba-fade",
      drawBackground(dc, width, height, pose) {
        capturedActionName = dc.actionName;
        capturedDisplayName = dc.displayName;
        kibaCharacter.drawBackground?.(dc, width, height, pose);
      },
    };

    const face = createRobotFace(canvas as unknown as HTMLCanvasElement, {
      autoStart: true,
      character: spyKiba,
    });

    raf.step(0);
    face.emote("happy");
    raf.step(300);
    face.listen({ durationMs: 120 });
    raf.step(360);
    raf.step(430);

    expect((face as unknown as { activeActionName: string | null }).activeActionName).toBeNull();
    expect((face as unknown as { actionBlend: number }).actionBlend).toBeGreaterThan(0.02);
    expect(capturedActionName === "listening").toBe(true);
    expect(capturedDisplayName).toBe("listening");
    expect((face as unknown as { displayName: string }).displayName).toBe("happy");

    face.destroy();
  });

  test("reset restores the creation-time baseline state", () => {
    const canvas = new FakeCanvas();
    const face = createRobotFace(canvas as unknown as HTMLCanvasElement, {
      autoStart: false,
      mode: "symbol",
      symbol: "warning",
    });

    face
      .showFace()
      .emote("happy")
      .think({ persistent: true })
      .lookLeft(0.7)
      .speak({ intensity: 0.5, durationMs: 1200 });

    face.reset();

    expect((face as unknown as { displayName: string }).displayName).toBe("neutral");
    expect((face as unknown as { emotionTargetName: string }).emotionTargetName).toBe("neutral");
    expect((face as unknown as { activeActionName: string | null }).activeActionName).toBeNull();
    expect((face as unknown as { mode: string }).mode).toBe("symbol");
    expect((face as unknown as { symbolName: string | null }).symbolName).toBe("warning");
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
