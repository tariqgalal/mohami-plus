import { defineConfig, devices } from "@playwright/test";

const TEST_ENV = process.env.TEST_ENV ?? "production";
const LOCAL_URL = "http://localhost:3000";
const PROD_URL = "https://mohami-plus-pi.vercel.app";
const BASE_URL = TEST_ENV === "local" ? LOCAL_URL : PROD_URL;

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: BASE_URL,
    locale: "ar-SA",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
