import { expect, test } from "@playwright/test";

const cases = [
  {
    name: "neutral-companion",
    query: "?emotion=neutral&faceTheme=companion",
    maxDiffPixels: 5,
  },
  {
    name: "angry-sentinel",
    query: "?emotion=angry&faceTheme=sentinel",
    maxDiffPixelRatio: 0.02,
  },
  {
    name: "confused-soft",
    query: "?emotion=confused&theme=cyan&style=soft",
    maxDiffPixelRatio: 0.02,
  },
  {
    name: "heart-symbol",
    query: "?mode=symbol&symbol=heart&theme=sunset&style=soft",
  },
  {
    name: "pinu-thinking",
    query: "?character=pinu&emotion=neutral&action=thinking&actionPersistent=true&settleMs=620",
    maxDiffPixelRatio: 0.02,
  },
  {
    name: "pinu-listening",
    query: "?character=pinu&emotion=neutral&action=listening&actionPersistent=true&settleMs=620",
    maxDiffPixelRatio: 0.02,
  },
  {
    name: "pinu-offline",
    query: "?character=pinu&emotion=happy&action=offline&actionDurationMs=1800&settleMs=960",
  },
  {
    name: "bubo-neutral-crt",
    query: "?character=bubo&emotion=neutral&theme=green-crt&settleMs=420",
    maxDiffPixelRatio: 0.02,
  },
  {
    name: "bubo-speaking-crt",
    query:
      "?character=bubo&emotion=neutral&theme=green-crt&speakDurationMs=1800&speakIntensity=0.7&settleMs=420",
    maxDiffPixelRatio: 0.03,
  },
  {
    name: "kiba-angry-thinking",
    query: "?character=kiba&emotion=angry&action=thinking&actionPersistent=true&settleMs=620",
    maxDiffPixelRatio: 0.02,
  },
  {
    name: "kiba-angry-listening",
    query: "?character=kiba&emotion=angry&action=listening&actionPersistent=true&settleMs=620",
    maxDiffPixelRatio: 0.02,
  },
  {
    name: "kiba-angry-speaking",
    query: "?character=kiba&emotion=angry&speakDurationMs=1800&speakIntensity=0.65&settleMs=420",
    maxDiffPixelRatio: 0.04,
  },
  {
    name: "kiba-listening-bootup",
    query:
      "?character=kiba&emotion=happy&action=listening&actionPersistent=true&overlay=bootUp&overlayDurationMs=1400&settleMs=520",
    maxDiffPixelRatio: 0.02,
  },
  {
    name: "construction-owl-mask",
    query: "?construction=owl-mask",
  },
  {
    name: "construction-pinu-neutral",
    query: "?construction=pinu-neutral",
  },
];

const pinuConstructionEmotions = [
  "neutral",
  "happy",
  "love",
  "sad",
  "angry",
  "surprised",
  "confused",
  "excited",
] as const;

for (const entry of cases) {
  test(`visual regression: ${entry.name}`, async ({ page }) => {
    await page.goto(`http://127.0.0.1:53001/test/visual.html${entry.query}`);
    await page.waitForFunction(() =>
      Boolean((window as Window & { __PINU_READY__?: boolean }).__PINU_READY__),
    );
    if (entry.maxDiffPixels === undefined && entry.maxDiffPixelRatio === undefined) {
      await expect(page).toHaveScreenshot(`${entry.name}.png`);
    } else {
      const screenshotOptions: {
        maxDiffPixels?: number;
        maxDiffPixelRatio?: number;
      } = {};
      if (entry.maxDiffPixels !== undefined) {
        screenshotOptions.maxDiffPixels = entry.maxDiffPixels;
      }
      if (entry.maxDiffPixelRatio !== undefined) {
        screenshotOptions.maxDiffPixelRatio = entry.maxDiffPixelRatio;
      }
      await expect(page).toHaveScreenshot(`${entry.name}.png`, screenshotOptions);
    }
  });
}

for (const emotionName of pinuConstructionEmotions) {
  test(`construction fidelity: pinu-${emotionName}`, async ({ page }) => {
    await page.goto(
      `http://127.0.0.1:53001/test/visual.html?compareConstruction=pinu-${emotionName}`,
    );
    await page.waitForFunction(() =>
      Boolean((window as Window & { __PINU_READY__?: boolean }).__PINU_READY__),
    );
    const diff = await page.evaluate(
      () =>
        (
          window as Window & {
            __PINU_CONSTRUCTION_DIFF__?: {
              diffPixels: number;
              diffRatio: number;
              referencePixels: number;
              constructionPixels: number;
              overlapPixels: number;
              unionPixels: number;
              iou: number;
            };
          }
        ).__PINU_CONSTRUCTION_DIFF__,
    );

    expect(diff).toBeTruthy();
    expect(diff?.iou).toBeGreaterThan(0.75);
    expect(diff?.diffRatio).toBeLessThan(0.05);
  });
}
