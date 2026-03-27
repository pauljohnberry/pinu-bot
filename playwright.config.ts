import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./test",
  testMatch: /visual\.spec\.ts/,
  retries: 0,
  use: {
    browserName: "chromium",
    viewport: {
      width: 720,
      height: 640
    }
  },
  webServer: {
    command: "npm run build && node scripts/static-server.mjs",
    port: 53001,
    reuseExistingServer: true,
    timeout: 120000
  }
});
