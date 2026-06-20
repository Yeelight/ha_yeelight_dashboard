import { mkdir, readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { chromium } from "playwright";

import { ensureAuthenticated, waitForHassStates } from "./ha-auth.mjs";

const liveUrl = process.env.HA_LIVE_URL;
const storageState = process.env.HA_LIVE_STORAGE_STATE;
const username = process.env.HA_LIVE_USERNAME;
const password = process.env.HA_LIVE_PASSWORD;
const bundlePath = process.env.HA_LIVE_DASHBOARD_BUNDLE ?? resolve(import.meta.dirname, "../dist/ha_yeelight_dashboard.js");
const screenshotPath = process.env.HA_LIVE_SCREENSHOT;
const minimumStates = Number(process.env.HA_LIVE_MIN_STATES ?? "1");
const timeoutMs = Number(process.env.HA_LIVE_TIMEOUT_MS ?? "90000");

if (!liveUrl || (!storageState && !(username && password))) {
  console.log(
    JSON.stringify({
      ok: true,
      skipped: true,
      reason: "Set HA_LIVE_URL plus HA_LIVE_STORAGE_STATE or HA_LIVE_USERNAME/HA_LIVE_PASSWORD to run authenticated live Home Assistant smoke validation."
    })
  );
  process.exit(0);
}

const bundle = await readFile(bundlePath, "utf8");
const browser = await chromium.launch({ headless: process.env.HA_LIVE_HEADLESS !== "0" });
const context = await browser.newContext({
  locale: process.env.HA_LIVE_LOCALE ?? "zh-CN",
  ...(storageState ? { storageState } : {}),
  viewport: { width: 1280, height: 900 }
});

try {
  const page = await context.newPage();
  page.setDefaultTimeout(timeoutMs);
  page.setDefaultNavigationTimeout(timeoutMs);
  await page.goto(liveUrl, { waitUntil: "domcontentloaded", timeout: timeoutMs });
  await ensureAuthenticated(page, { username, password });
  await waitForHassStates(page, minimumStates, timeoutMs);
  await injectBundle(page, bundle);
  const result = await page.evaluate(async () => {
    const strategy = customElements.get("ll-strategy-dashboard-yeelight-dashboard");
    if (!strategy) return { ok: false, reason: "strategy custom element missing" };
    const hass = document.querySelector("home-assistant")?.hass;
    if (!hass) return { ok: false, reason: "Home Assistant hass object missing" };

    const standard = await strategy.generate({ profile: "standard" }, hass);
    const canvas = await strategy.generate({ layout_mode: "canvas" }, hass);
    const overview = standard.views?.find((view) => view.path === "overview");
    const canvasOverview = canvas.views?.find((view) => view.path === "overview");
    window.__renderYeelightDashboardPreview(standard, hass);

    return {
      ok: Boolean(standard.views?.length && overview && canvasOverview),
      strategyRegistered: Boolean(strategy),
      communityRegistered: window.customStrategies?.some((item) => item.type === "yeelight-dashboard"),
      viewCount: standard.views?.length ?? 0,
      viewPaths: standard.views?.map((view) => view.path) ?? [],
      overviewType: overview?.type,
      overviewSections: overview?.sections?.length ?? 0,
      overviewCards: overview?.sections?.flatMap((section) => section.cards || []).map((card) => ({
        type: card.type,
        entities: Array.isArray(card.entities) ? card.entities.length : 0,
        areas: Array.isArray(card.area_summaries) ? card.area_summaries.length : 0
      })),
      canvasType: canvasOverview?.type,
      hasCanvasCards: Boolean(canvasOverview?.cards?.length),
      firstLayout: canvasOverview?.cards?.[0]?.view_layout,
      registryEntities: Object.keys(hass.states || {}).length
    };
  });
  if (!result.ok || !result.communityRegistered || result.overviewType !== "sections" || result.canvasType !== "custom:yeelight-dashboard-canvas-view") {
    throw new Error(`live dashboard smoke failed: ${JSON.stringify(result)}`);
  }
  if (screenshotPath) {
    await mkdir(dirname(resolve(screenshotPath)), { recursive: true });
    await page.screenshot({ path: screenshotPath, fullPage: true });
  }
  console.log(JSON.stringify({ ok: true, skipped: false, ...result }, null, 2));
} finally {
  await browser.close();
}

async function injectBundle(page, source) {
  await page.evaluate(async (bundle) => {
    const url = URL.createObjectURL(new Blob([bundle], { type: "text/javascript" }));
    try {
      await import(url);
    } finally {
      URL.revokeObjectURL(url);
    }
    window.__renderYeelightDashboardPreview = (dashboard, hass) => {
      const host = document.createElement("main");
      host.id = "yeelight-dashboard-preview";
      host.innerHTML = `
        <style>
          body { margin: 0; background: var(--primary-background-color, #f6f7f8); }
          #yeelight-dashboard-preview { font-family: var(--paper-font-body1_-_font-family, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif); color: var(--primary-text-color, #202124); padding: 28px 64px 80px; }
          .preview-top { display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: end; gap: 20px; margin-bottom: 24px; }
          .preview-top h1 { margin: 0 0 6px; font-size: 28px; line-height: 1.15; }
          .preview-top p, .entity-count, .section-title, .view-tabs { color: var(--secondary-text-color, #6f7680); font-size: 13px; }
          .entity-count { padding: 7px 10px; border: 1px solid var(--divider-color, rgba(0, 0, 0, 0.12)); border-radius: 8px; background: var(--ha-card-background, #fff); font-weight: 650; }
          .view-tabs { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 22px; }
          .view-tabs span { padding: 6px 10px; border-radius: 8px; background: var(--ha-card-background, #fff); border: 1px solid color-mix(in srgb, var(--divider-color, rgba(0, 0, 0, 0.12)) 70%, transparent); }
          .view { margin-top: 28px; }
          .view h2 { font-size: 20px; margin: 0 0 14px; }
          .sections { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 18px; align-items: start; }
          .section-title { grid-column: 1 / -1; margin: 4px 0 -4px; font-weight: 700; }
          .span-2 { grid-column: 1 / -1; }
          @media (max-width: 760px) {
            #yeelight-dashboard-preview { padding: 18px 16px 48px; }
            .preview-top, .sections { grid-template-columns: 1fr; }
            .span-2 { grid-column: auto; }
          }
          yeelight-dashboard-hero-card, yeelight-dashboard-light-card, yeelight-dashboard-rooms-card, yeelight-dashboard-room-card, yeelight-dashboard-routines-card, yeelight-dashboard-health-card { display: block; min-width: 0; }
        </style>
        <div class="preview-top">
          <div><h1>Yeelight Dashboard Preview</h1><p>Generated from real Home Assistant hass.states and registries.</p></div>
          <div class="entity-count">${Object.keys(hass.states || {}).length} entities</div>
        </div>
        <nav class="view-tabs">${dashboard.views.map((view) => `<span>${view.title}</span>`).join("")}</nav>
      `;
      document.body.replaceChildren(host);

      for (const view of dashboard.views.slice(0, 5)) {
        const viewEl = document.createElement("section");
        viewEl.className = "view";
        viewEl.innerHTML = `<h2>${view.title}</h2><div class="sections"></div>`;
        const sectionsEl = viewEl.querySelector(".sections");
        for (const section of view.sections || []) {
          const title = document.createElement("h3");
          title.className = "section-title";
          title.textContent = section.title || "";
          sectionsEl.append(title);
          for (const cardConfig of section.cards || []) {
            if (!String(cardConfig.type).startsWith("custom:yeelight-dashboard-")) continue;
            const tag = String(cardConfig.type).slice("custom:".length);
            const card = document.createElement(tag);
            card.setConfig(cardConfig);
            card.hass = hass;
            if (cardConfig.type.includes("hero")) card.classList.add("span-2");
            sectionsEl.append(card);
          }
        }
        host.append(viewEl);
      }
    };
  }, source);
}
