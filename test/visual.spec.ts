import { expect, test } from "@playwright/test";

const cases = [
  {
    name: "neutral-companion",
    query: "?emotion=neutral&faceTheme=companion",
  },
  {
    name: "angry-sentinel",
    query: "?emotion=angry&faceTheme=sentinel",
    maxDiffPixels: 8000,
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
];

for (const entry of cases) {
  test(`visual regression: ${entry.name}`, async ({ page }) => {
    await page.goto(`http://127.0.0.1:53001/test/visual.html${entry.query}`);
    await page.waitForFunction(() =>
      Boolean((window as Window & { __PINU_READY__?: boolean }).__PINU_READY__),
    );
    if (entry.maxDiffPixels === undefined) {
      await expect(page).toHaveScreenshot(`${entry.name}.png`);
    } else {
      await expect(page).toHaveScreenshot(`${entry.name}.png`, {
        maxDiffPixels: entry.maxDiffPixels,
      });
    }
  });
}
