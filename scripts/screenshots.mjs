/**
 * Captures the screenshots used in README.md.
 *
 * Uses playwright-core against a Chrome that is already installed, so it
 * does not download a browser. Point BASE_URL at a running dev server:
 *
 *   npm run dev
 *   node scripts/screenshots.mjs
 *
 * Re-run it after any visual change — screenshots that drift from the app
 * are worse than none, because they misrepresent it to the one audience
 * that will never run the code.
 */

import { chromium } from "playwright-core";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, "..", "docs", "screenshots");
const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";
const PASSWORD = "OnlyChamps2026!";

const CHROME_CANDIDATES = [
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "/usr/bin/google-chrome",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
];

const { existsSync } = await import("node:fs");
const executablePath = CHROME_CANDIDATES.find((p) => existsSync(p));
if (!executablePath) {
  console.error("No Chrome or Edge found. Set one of:", CHROME_CANDIDATES);
  process.exit(1);
}

/** Next.js injects a dev-tools badge into the corner of every page. It is
 * not part of the product and must not appear in a screenshot.
 *
 * animation-DELAY matters as much as duration here. The .stagger utility
 * cascades children by delay, so zeroing only the duration left the last
 * tile in a row still waiting at opacity 0 when the shot was taken — the
 * dashboard came out with three stat tiles instead of four. */
const HIDE_DEV_UI = `
  nextjs-portal, [data-nextjs-toast], #__next-build-watcher { display: none !important; }
  *, *::before, *::after {
    animation-duration: 0s !important;
    animation-delay: 0s !important;
    transition-duration: 0s !important;
    transition-delay: 0s !important;
  }
`;

/**
 * Recharts draws its series with a JS animation (react-smooth, not CSS), so
 * the blanket animation-duration override above cannot touch it. Waiting a
 * fixed number of milliseconds is a guess, and a wrong guess captures a
 * half-drawn curve that looks like a data bug — the revenue chart came out
 * ending at May with three months missing.
 *
 * Poll the rendered path instead and shoot once it stops changing.
 */
async function waitForCharts(page, timeout = 12000) {
  if ((await page.locator(".recharts-surface").count()) === 0) return;

  const readPaths = () =>
    page.evaluate(() =>
      [
        ...document.querySelectorAll(
          ".recharts-area-area, .recharts-area-curve, .recharts-line-curve, .recharts-bar-rectangle path",
        ),
      ]
        .map((el) => el.getAttribute("d") ?? "")
        .join("|"),
    );

  const start = Date.now();
  let previous = null;
  let stableReads = 0;

  while (Date.now() - start < timeout) {
    const current = await readPaths();
    if (current && current === previous) {
      if (++stableReads >= 3) return;
    } else {
      stableReads = 0;
    }
    previous = current;
    await page.waitForTimeout(200);
  }
}

/** networkidle fires when requests stop, which is not the same as every
 * <img> having decoded. Post cards came out as black rectangles with a
 * play button because the shot landed between the two. */
async function waitForImages(page, timeout = 10000) {
  await page
    .waitForFunction(
      () => [...document.images].every((img) => img.complete && img.naturalWidth > 0),
      null,
      { timeout },
    )
    .catch(() => {});
}

async function shoot(page, name, { wait = 1500 } = {}) {
  // Inject BEFORE settling, not after. Adding a stylesheet reflows the
  // page, and Recharts' ResponsiveContainer restarts its 1.5s draw
  // animation on resize — injecting last and shooting immediately caught
  // the revenue chart a few percent into its animation, so it rendered as
  // a stub line with no curve.
  await page.addStyleTag({ content: HIDE_DEV_UI });
  await page.waitForTimeout(wait);
  await waitForImages(page);
  await waitForCharts(page);
  await page.screenshot({ path: path.join(OUT, `${name}.png`) });
  console.log("  ✓", name);
}

async function signIn(page, email) {
  await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle" });
  await page.fill("#email", email);
  await page.fill("#password", PASSWORD);
  await Promise.all([
    page.waitForURL((u) => !u.pathname.includes("/login"), { timeout: 20000 }),
    page.click('button[type="submit"]'),
  ]);
  await page.waitForLoadState("networkidle");
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch({ executablePath, headless: true });

  // ---------------------------------------------------------------- public
  const desktop = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    colorScheme: "dark",
  });
  let page = await desktop.newPage();

  console.log("Public pages...");
  await page.goto(BASE_URL, { waitUntil: "networkidle" });
  await shoot(page, "landing");

  await page.goto(`${BASE_URL}/discover`, { waitUntil: "networkidle" });
  await shoot(page, "discover");

  await page.goto(`${BASE_URL}/c/marcus`, { waitUntil: "networkidle" });
  await shoot(page, "storefront");

  await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle" });
  await shoot(page, "login");
  await page.close();

  // ----------------------------------------------------------------- coach
  console.log("Coach...");
  const coach = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    colorScheme: "dark",
  });
  page = await coach.newPage();
  await signIn(page, "marcus.chen@onlychamps.demo");
  await shoot(page, "coach-dashboard", { wait: 3000 });

  for (const [route, name] of [
    ["/clients", "coach-clients"],
    ["/content", "coach-content"],
    ["/programs", "coach-programs"],
    ["/settings", "coach-settings"],
    ["/messages", "coach-messages"],
  ]) {
    await page.goto(`${BASE_URL}${route}`, { waitUntil: "networkidle" });
    await shoot(page, name);
  }
  await page.close();

  // ---------------------------------------------------------------- client
  console.log("Client...");
  const client = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    colorScheme: "dark",
  });
  page = await client.newPage();
  await signIn(page, "sofia.martins@onlychamps.demo");
  await shoot(page, "client-feed", { wait: 2000 });

  for (const [route, name] of [
    ["/today", "client-today"],
    ["/progress", "client-progress"],
    ["/chat", "client-chat"],
    ["/profile", "client-profile"],
  ]) {
    await page.goto(`${BASE_URL}${route}`, { waitUntil: "networkidle" });
    await shoot(page, name);
  }

  // The client shell is responsive, so capture the phone layout too — it is
  // a different layout, not the same one squeezed.
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${BASE_URL}/feed`, { waitUntil: "networkidle" });
  await shoot(page, "client-feed-mobile");
  await page.close();

  await browser.close();
  console.log(`\nSaved to ${OUT}`);
}

main().catch((err) => {
  console.error("\nScreenshots failed:", err.message);
  process.exit(1);
});
