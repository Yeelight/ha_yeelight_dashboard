import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { chromium } from "playwright";

import { ensureAuthenticated, waitForHassStates } from "./ha-auth.mjs";

const liveUrl = process.env.HA_LIVE_URL;
const storageState = process.env.HA_LIVE_STORAGE_STATE;
const username = process.env.HA_LIVE_USERNAME;
const password = process.env.HA_LIVE_PASSWORD;
const resourcePath = process.env.HA_LIVE_RESOURCE_PATH ?? "/local/ha_yeelight_dashboard.js";
const dashboardPath = process.env.HA_LIVE_DASHBOARD_PATH ?? "/lovelace";
const bundlePath = process.env.HA_LIVE_DASHBOARD_BUNDLE ?? resolve(import.meta.dirname, "../dist/ha_yeelight_dashboard.js");
const minimumStates = Number(process.env.HA_LIVE_MIN_STATES ?? "1");
const timeoutMs = Number(process.env.HA_LIVE_TIMEOUT_MS ?? "90000");
const resourceTimeoutMs = Number(process.env.HA_LIVE_RESOURCE_TIMEOUT_MS ?? "15000");

if (!liveUrl || (!storageState && !(username && password))) {
  console.log(
    JSON.stringify({
      ok: true,
      skipped: true,
      reason: "Set HA_LIVE_URL plus HA_LIVE_STORAGE_STATE or HA_LIVE_USERNAME/HA_LIVE_PASSWORD to verify the installed HA frontend resource."
    })
  );
  process.exit(0);
}

const expectedHash = sha256(await readFile(bundlePath));
let browser;

try {
  const resourceUrl = new URL(resourcePath, liveUrl).toString();
  const response = await fetchWithTimeout(resourceUrl, resourceTimeoutMs);
  if (!response.ok) {
    throw new Error(`Installed resource is not reachable: ${response.status} ${response.statusText}`);
  }
  const resourceHash = sha256(Buffer.from(await response.arrayBuffer()));
  if (resourceHash !== expectedHash) {
    throw new Error(`Installed resource hash mismatch: expected=${expectedHash} actual=${resourceHash}`);
  }

  browser = await chromium.launch({ headless: process.env.HA_LIVE_HEADLESS !== "0" });
  const context = await browser.newContext({
    locale: process.env.HA_LIVE_LOCALE ?? "zh-CN",
    ...(storageState ? { storageState } : {}),
    viewport: { width: 1280, height: 900 }
  });
  const page = await context.newPage();
  page.setDefaultTimeout(timeoutMs);
  page.setDefaultNavigationTimeout(timeoutMs);
  const dashboardUrl = new URL(dashboardPath, liveUrl).toString();
  await page.goto(dashboardUrl, { waitUntil: "domcontentloaded", timeout: timeoutMs });
  await ensureAuthenticated(page, { username, password });
  await waitForHassStates(page, minimumStates, timeoutMs);
  const result = await page.evaluate(async () => {
    await waitForStrategy();
    const strategy = customElements.get("ll-strategy-dashboard-yeelight-dashboard");
    const hass = document.querySelector("home-assistant")?.hass;
    const generated = await strategy.generate({ profile: "standard" }, hass);
    const overview = generated.views?.find((view) => view.path === "overview");
    return {
      strategyRegistered: Boolean(strategy),
      communityRegistered: window.customStrategies?.some((item) => item.type === "yeelight-dashboard"),
      viewCount: generated.views?.length ?? 0,
      overviewSections: overview?.sections?.length ?? 0,
      overviewCards: overview?.sections?.reduce((count, section) => count + (section.cards?.length ?? 0), 0) ?? 0,
      registryEntities: Object.keys(hass?.states || {}).length
    };

    async function waitForStrategy() {
      const timeoutAt = Date.now() + 30000;
      while (Date.now() < timeoutAt) {
        if (customElements.get("ll-strategy-dashboard-yeelight-dashboard")) return;
        await new Promise((resolveReady) => setTimeout(resolveReady, 100));
      }
      throw new Error("Installed dashboard strategy resource was not registered by Home Assistant.");
    }
  });
  if (!result.strategyRegistered || !result.communityRegistered || !result.viewCount || !result.overviewCards) {
    throw new Error(`HA resource smoke failed: ${JSON.stringify(result)}`);
  }
  console.log(JSON.stringify({ ok: true, skipped: false, resourcePath, resourceHash, dashboardPath, ...result }, null, 2));
} finally {
  await browser?.close();
}

async function fetchWithTimeout(url, timeout) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  try {
    return await fetch(url, { signal: controller.signal });
  } catch (error) {
    if (controller.signal.aborted) {
      throw new Error(`Installed resource fetch timed out after ${timeout}ms: ${url}`);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}
