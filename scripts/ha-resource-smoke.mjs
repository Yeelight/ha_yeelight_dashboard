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
    const loadedScripts = [...document.scripts].map((script) => script.src).filter((src) => src.includes("ha_yeelight_dashboard.js"));
    const installedResource = loadedScripts.at(-1) || "";
    const installedResourceHash = installedResource ? await hashUrl(installedResource) : "";
    const savedDashboardSmoke = await validateSavedDashboard(hass);
    return {
      strategyRegistered: Boolean(strategy),
      communityRegistered: window.customStrategies?.some((item) => item.type === "yeelight-dashboard"),
      loadedScripts,
      installedResource,
      installedResourceHash,
      savedDashboardSmoke,
      viewCount: generated.views?.length ?? 0,
      overviewSections: overview?.sections?.length ?? 0,
      overviewCards: overview?.sections?.reduce((count, section) => count + (section.cards?.length ?? 0), 0) ?? 0,
      registryEntities: Object.keys(hass?.states || {}).length
    };

    async function validateSavedDashboard(currentHass) {
      const currentPath = location.pathname.split("/").filter(Boolean)[0] || "";
      if (!currentPath || currentPath === "lovelace") return { ok: true, skipped: true, reason: "default dashboard path" };
      let config;
      try {
        config = await currentHass.callWS({ type: "lovelace/config", url_path: currentPath });
      } catch (error) {
        return { ok: true, skipped: true, reason: `cannot read current dashboard: ${error?.message || error}` };
      }
      const nativeCards = collectNativeCards(config.views || []);
      const entityCards = nativeCards.filter((card) => card.entity || Array.isArray(card.entities));
      const areaCards = nativeCards.filter((card) => card.type === "area");
      const missingEntityTapActions = entityCards
        .filter((card) => card.tap_action?.action !== "more-info")
        .map((card) => ({ type: card.type, entity: card.entity, entities: Array.isArray(card.entities) ? card.entities.length : undefined }));
      const missingAreaNavigation = areaCards
        .filter((card) => !card.navigation_path || card.tap_action?.action !== "navigate" || card.tap_action?.navigation_path !== card.navigation_path)
        .map((card) => ({ area: card.area, navigation_path: card.navigation_path, tap_action: card.tap_action }));
      return {
        ok: missingEntityTapActions.length === 0 && missingAreaNavigation.length === 0,
        dashboardPath: currentPath,
        nativeCount: nativeCards.length,
        entityCardCount: entityCards.length,
        areaCardCount: areaCards.length,
        missingEntityTapActions,
        missingAreaNavigation
      };
    }

    function collectNativeCards(value) {
      const cards = [];
      const visit = (item) => {
        if (Array.isArray(item)) {
          item.forEach(visit);
          return;
        }
        if (!item || typeof item !== "object") return;
        if (typeof item.type === "string" && !item.type.startsWith("custom:")) cards.push(item);
        Object.values(item).forEach(visit);
      };
      visit(value);
      return cards;
    }

    async function hashUrl(url) {
      const response = await fetch(url, { cache: "reload" });
      const bytes = await response.arrayBuffer();
      const digest = await crypto.subtle.digest("SHA-256", bytes);
      return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
    }

    async function waitForStrategy() {
      const timeoutAt = Date.now() + 30000;
      while (Date.now() < timeoutAt) {
        if (customElements.get("ll-strategy-dashboard-yeelight-dashboard")) return;
        await new Promise((resolveReady) => setTimeout(resolveReady, 100));
      }
      throw new Error("Installed dashboard strategy resource was not registered by Home Assistant.");
    }
  });
  if (
    !result.strategyRegistered ||
    !result.communityRegistered ||
    !result.viewCount ||
    !result.overviewCards ||
    result.installedResourceHash !== expectedHash ||
    !result.savedDashboardSmoke?.ok
  ) {
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
