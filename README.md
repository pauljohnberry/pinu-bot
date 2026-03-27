# pinu-bot

[GitHub](https://github.com/pauljohnberry/pinu-bot) · [Docs](https://www.pinubot.com) · [Issues](https://github.com/pauljohnberry/pinu-bot/issues)

`pinu-bot` is a framework-agnostic TypeScript library for expressive robot display faces on HTML5 canvas. It focuses on orchestrating animated emotions, overlays, and display-state transitions instead of drawing static avatars.

![Neutral Pinubot face with bar nose](https://raw.githubusercontent.com/pauljohnberry/pinu-bot/HEAD/.github/assets/neutral-demo.png)

## Highlights

- Canvas 2D only
- Parametric geometry only, no sprite sheets
- Layered runtime: base emotion + blink + lookAt + speaking + screen FX
- Optional mood lighting and symbol mode
- Built-in face-theme presets, visual themes, and style presets
- Direct part control for eyes, mouth, and nose
- Device-pixel-ratio aware render loop
- Works with React, Vue, Angular, Svelte, and vanilla apps because the runtime only needs a canvas element

## Install

```bash
npm install pinu-bot
pnpm add pinu-bot
bun add pinu-bot
```

## Demo And Docs

Local interactive demo/docs:

```bash
bun run dev
```

Release and deploy docs:

- [PUBLISHING.md](./PUBLISHING.md)

## Quick Start

```ts
import { createRobotFace } from "pinu-bot";

const canvas = document.querySelector("canvas")!;
const face = createRobotFace(canvas, {
  faceTheme: "companion",
  backgroundFx: "emotion"
});

face.emote("happy");
face.lookAt(0.2, -0.1);
face.speak({ intensity: 0.35 });
```

Recommended canvas CSS:

```css
canvas {
  width: 320px;
  height: 200px;
  display: block;
}
```

Destroy the instance when your component or page unmounts:

```ts
face.destroy();
```

## Usage

```ts
import { BUILTIN_FACE_THEMES, BUILTIN_STYLES, createRobotFace } from "pinu-bot";

const canvas = document.querySelector("canvas")!;
const face = createRobotFace(canvas, {
  faceTheme: "companion",
  theme: "cyan",
  style: "soft",
  backgroundFx: "emotion",
  features: {
    nose: false
  },
  parts: {
    eyeShape: "capsule",
    eyeWidthScale: 0.82,
    eyeHeightScale: 1.25,
    browShape: "line",
    mouthShape: "arc"
  }
});

face.emote("happy");
face.emote("sad", { intensity: 0.8 });
face.emote("love");
face.emote("angry");

face.perform("bootUp");
face.perform("glitch");

face.lookAt(0.2, -0.1);
face.lookLeft(0.7);
face.lookUp(0.4);
face.smile(1, { open: false });
face.frown(0.6, { open: false });
face.pout(0.5, { open: false });
face.blink();
face.wink("right");

face
  .eyes().open(0.9).done()
  .mouth().smile(0.3).done();

face.speak({ intensity: 0.4 });

face.setStyle("visor");
face.setFaceTheme(BUILTIN_FACE_THEMES.sentinel);
face.setParts({
  eyeShape: "pixel",
  eyeWidthScale: 0.7,
  eyeHeightScale: 1.4,
  noseShape: "bar",
  mouthShape: "visor",
  browShape: "block",
  scanlineThickness: 2,
  scanlineSpacing: 5
});
face.setBackgroundFx("emotion");
face.showSymbol("question");
face.showFace();
face.configure({
  mode: "symbol",
  symbol: "loading",
  theme: "ice-blue",
  style: BUILTIN_STYLES.industrial,
  features: {
    brows: true,
    mouth: false,
    panel: true
  }
});
```

## Public API

- `createRobotFace(canvas, options?)`
- `face.emote(name, options?)`
- `face.perform(name)`
- `face.transitionTo(state)`
- `face.lookAt(x, y)`
- `face.lookLeft(amount?)`
- `face.lookRight(amount?)`
- `face.lookUp(amount?)`
- `face.lookDown(amount?)`
- `face.smile(amount?, { open? })`
- `face.frown(amount?, { open? })`
- `face.pout(amount?, { open? })`
- `face.blink()`
- `face.wink(side?)`
- `face.speak(options)`
- `face.setTheme(nameOrDefinition)`
- `face.setFaceTheme(nameOrDefinition)`
- `face.setStyle(nameOrDefinition)`
- `face.setParts({ eyeShape, eyeWidthScale, eyeHeightScale, noseShape, mouthShape, browShape, scanlineThickness, scanlineSpacing })`
- `face.setMode("face" | "symbol")`
- `face.showSymbol(name)`
- `face.showFace()`
- `face.setBackgroundFx("off" | "emotion" | { mode: "custom", color, intensity, pulseHz })`
- `face.configure({ theme, style, features, parts, mode, symbol, backgroundFx, pixelRatio })`
- `face.start()`
- `face.stop()`
- `face.render()`
- `face.destroy()`
- `face.eyes()`
- `face.leftEye()`
- `face.rightEye()`
- `face.mouth()`
- `face.nose()`

## Built-In Presets

Emotions:
`neutral`, `happy`, `love`, `sad`, `angry`, `surprised`, `confused`, `thinking`, `sleepy`, `excited`, `listening`, `speaking`, `offline`, `booting`, `glitch`

Themes:
`amber`, `cyan`, `green-crt`, `white`, `red-alert`, `ice-blue`, `sunset`, `violet`

Styles:
`classic`, `soft`, `minimal`, `visor`, `industrial`

Face themes:
`companion`, `service`, `sentinel`, `soft-smile`, `status-strip`, `caret-cheer`, `crescent-muse`, `teardrop-dream`

## Features And Shapes

Consumer-facing feature toggles:
- `leftEye`
- `rightEye`
- `brows`
- `pupils`
- `nose`
- `mouth`
- `panel`
- `scanlines`

Part shape options:
- `eyeShape`: `rounded`, `capsule`, `pixel`, `chevron`, `crescent`, `tear`
- `eyeWidthScale` / `eyeHeightScale`
- `noseShape`: `diamond`, `triangle`, `bar`, `dot`
- `mouthShape`: `arc`, `visor`, `pixel`
- `browShape`: `line`, `block`, `visor`
- `scanlineThickness` / `scanlineSpacing`

## Symbol Mode

Symbols:
- `question`
- `exclamation`
- `ellipsis`
- `heart`
- `dead`
- `offline`
- `loading`
- `warning`

Symbols still participate in glow, bob, flicker, scanlines, and distortion.

## Background FX

- `off`: no extra lighting
- `emotion`: derive tint and pulse from the current emotion
- `custom`: provide your own `color`, `intensity`, and `pulseHz`

## Framework Consumption

The library is imperative and only depends on a canvas, so it works with any framework that can hand you an `HTMLCanvasElement`.

See [examples/frameworks.md](./examples/frameworks.md) for:
- React
- Vue
- Angular
- Vanilla TypeScript

## Extending The Library

The current architecture is intentionally open to extension:

- add new emotions in [`src/emotions.ts`](./src/emotions.ts)
- add new bundled face themes in [`src/faceThemes.ts`](./src/faceThemes.ts)
- add new visual themes in [`src/themes.ts`](./src/themes.ts)
- add new shape families in [`src/robotFace.ts`](./src/robotFace.ts)

## Performance Notes

- The renderer uses a single `requestAnimationFrame` loop.
- It reuses pose objects instead of allocating new state every frame.
- Geometry is parametric and drawn directly on Canvas 2D.
- It is designed to be fast enough for interactive UI use, but multi-face production benchmarks are still a recommended next step.

## Development

```bash
bun install
bun run check
bun run dev
```

## Demo

Run the local demo:

```bash
bun run dev
```

Then open the local URL printed by the Bun dev server.
