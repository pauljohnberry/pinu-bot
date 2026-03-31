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
    maxDiffPixels: 100,
  },
  {
    name: "heart-symbol",
    query: "?mode=symbol&symbol=heart&theme=sunset&style=soft",
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
