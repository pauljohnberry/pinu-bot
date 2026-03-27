# Framework Examples

## Vanilla TypeScript

```ts
import { createRobotFace } from "pinu-bot";

const canvas = document.querySelector("canvas")!;
const face = createRobotFace(canvas, {
  faceTheme: "companion",
  backgroundFx: "emotion"
});

face.emote("happy");
window.addEventListener("beforeunload", () => face.destroy());
```

## React

```tsx
import { useEffect, useRef } from "react";
import { createRobotFace } from "pinu-bot";

export function RobotFace() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const face = createRobotFace(canvasRef.current, {
      faceTheme: "companion",
      backgroundFx: "emotion"
    });

    face.emote("listening");

    return () => face.destroy();
  }, []);

  return <canvas ref={canvasRef} style={{ width: 320, height: 200, display: "block" }} />;
}
```

## Vue

```vue
<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref } from "vue";
import { createRobotFace, type RobotFace } from "pinu-bot";

const canvasRef = ref<HTMLCanvasElement | null>(null);
let face: RobotFace | null = null;

onMounted(() => {
  if (!canvasRef.value) return;
  face = createRobotFace(canvasRef.value, {
    faceTheme: "companion",
    backgroundFx: "emotion"
  });
  face.emote("happy");
});

onBeforeUnmount(() => {
  face?.destroy();
  face = null;
});
</script>

<template>
  <canvas ref="canvasRef" style="width: 320px; height: 200px; display: block;" />
</template>
```

## Angular

```ts
import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild } from "@angular/core";
import { createRobotFace, type RobotFace } from "pinu-bot";

@Component({
  selector: "app-robot-face",
  standalone: true,
  template: `<canvas #canvas style="width: 320px; height: 200px; display: block;"></canvas>`
})
export class RobotFaceComponent implements AfterViewInit, OnDestroy {
  @ViewChild("canvas", { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;
  private face: RobotFace | null = null;

  ngAfterViewInit(): void {
    this.face = createRobotFace(this.canvasRef.nativeElement, {
      faceTheme: "companion",
      backgroundFx: "emotion"
    });
    this.face.emote("thinking");
  }

  ngOnDestroy(): void {
    this.face?.destroy();
    this.face = null;
  }
}
```
