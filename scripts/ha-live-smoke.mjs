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
const dashboardPath = process.env.HA_LIVE_DASHBOARD_PATH ?? "/lovelace";

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
  await page.goto(new URL(dashboardPath, liveUrl).toString(), { waitUntil: "domcontentloaded", timeout: timeoutMs });
  await ensureAuthenticated(page, { username, password });
  await waitForHassStates(page, minimumStates, timeoutMs);
  const snapshot = await captureHassSnapshot(page);
  await page.goto(new URL("/local/ha_yeelight_dashboard.js?live_smoke_preview=1", liveUrl).toString(), { waitUntil: "domcontentloaded", timeout: timeoutMs });
  await page.evaluate((currentSnapshot) => {
    window.__yeelightDashboardHassSnapshot = currentSnapshot;
    if (!customElements.get("ha-form")) {
      customElements.define("ha-form", class extends HTMLElement {});
    }
  }, snapshot);
  await injectBundle(page, bundle);
  const result = await page.evaluate(async () => {
    const hass = createSnapshotHass(window.__yeelightDashboardHassSnapshot);
    const strategy = customElements.get("ll-strategy-dashboard-yeelight-dashboard");
    if (!strategy) return { ok: false, reason: "strategy custom element missing" };

    const standard = await strategy.generate({ profile: "standard" }, hass);
    const canvas = await strategy.generate({ layout_mode: "canvas" }, hass);
    const overview = standard.views?.find((view) => view.path === "overview");
    const canvasOverview = canvas.views?.find((view) => view.path === "overview");
    const focusedViews = validateFocusedViews(standard);
    const editorSmoke = await validateCardEditor(hass);
    const strategyEditorSmoke = await validateStrategyEditor(hass);
    window.__renderYeelightDashboardPreview(standard, hass);
    const aggregateNavigationSmoke = await validateAggregateNavigation();
    const entityInteractionSmoke = await validateEntityInteraction();
    const nativeTapActionSmoke = validateNativeTapActions(standard);

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
      registryEntities: Object.keys(hass.states || {}).length,
      focusedViews,
      editorSmoke,
      strategyEditorSmoke,
      aggregateNavigationSmoke,
      entityInteractionSmoke,
      nativeTapActionSmoke
    };

    function validateFocusedViews(dashboard) {
      const cardsFor = (path) => dashboard.views?.find((view) => view.path === path)?.sections?.flatMap((section) => section.cards || []) || [];
      const lighting = cardsFor("lighting");
      const scenes = cardsFor("scenes");
      const environment = cardsFor("environment");
      const keys = (cards) => cards.map((card) => card.view_layout?.key || "").filter(Boolean);
      return {
        ok:
          keys(lighting).includes("lighting.overview") &&
          keys(lighting).includes("lighting.status") &&
          keys(lighting).includes("lighting.rooms") &&
          !keys(lighting).includes("lighting.devices") &&
          !keys(lighting).some((key) => key.startsWith("entity.light")) &&
          !scenes.some((card) => card.type === "button") &&
          scenes.some((card) => card.type === "custom:yeelight-dashboard-panel-actions-card") &&
          !scenes.some((card) => card.type === "custom:yeelight-dashboard-routines-card") &&
          !environment.some((card) => card.type === "tile"),
        lightingTypes: lighting.map((card) => card.type),
        lightingKeys: keys(lighting).slice(0, 16),
        sceneTypes: scenes.map((card) => card.type),
        environmentTypes: environment.map((card) => card.type)
      };
    }

    async function validateCardEditor(currentHass) {
      const lightEditor = createCardEditor("yeelight-dashboard-light-card");
      if (!lightEditor) return { ok: false, reason: "card editor metadata missing" };
      lightEditor.hass = currentHass;
      lightEditor.setConfig?.({
        type: "custom:yeelight-dashboard-light-card",
        title: "灯光概览",
        entities: Object.keys(currentHass.states || {}).slice(0, 24)
      });
      document.body.append(lightEditor);
      await lightEditor.updateComplete;
      const forms = [...(lightEditor.shadowRoot?.querySelectorAll("ha-form") || [])];
      const names = forms.flatMap((form) => flatten(form.schema || []).map((item) => item.name));
      const visibleSelectedRows = lightEditor.shadowRoot?.querySelectorAll(".entity-row").length ?? 0;
      const entityPicker = lightEditor.shadowRoot?.querySelector("#entity-picker");
      const modeGuide = lightEditor.shadowRoot?.querySelector(".mode-guide");
      const modeGuideText = modeGuide?.textContent || "";
      const modeGuideButtons = [...(modeGuide?.querySelectorAll("button") || [])].map((button) => button.textContent?.trim() || "");
      const modeGuideEntityAction = modeGuideButtons.some((text) =>
        text.includes("推荐实体") || text.includes("显示上限") || text.includes("暂无推荐")
      );
      const displayPresetPanel = lightEditor.shadowRoot?.querySelector(".display-presets");
      const displayPresetText = displayPresetPanel?.textContent || "";
      const displayPresetCount = lightEditor.shadowRoot?.querySelectorAll("[data-display-preset]").length ?? 0;
      lightEditor.remove();
      const recommendation = await validateRecommendedEntityBundle(currentHass);
      const phaseD = await validatePhaseDEditors(currentHass);
      return {
        ok: Boolean(
          forms.length === 3 &&
            ["type", "title", "subtitle", "item_limit", "grid_columns", "grid_rows", "density", "variant", "show_metrics", "show_actions", "show_area_summaries"].every((name) =>
              names.includes(name)
            ) &&
            !names.includes("entities") &&
            entityPicker &&
            modeGuide &&
            modeGuideText.includes("模式配置") &&
            modeGuideText.includes("覆盖能力") &&
            displayPresetText.includes("显示预设") &&
            displayPresetText.includes("不用写 YAML") &&
            displayPresetCount === 5 &&
            modeGuideEntityAction &&
            visibleSelectedRows <= 5 &&
            recommendation.ok &&
            phaseD.ok
        ),
        formCount: forms.length,
        names,
        hasEntityPicker: Boolean(entityPicker),
        hasModeGuide: Boolean(modeGuide),
        hasDisplayPresetPanel: Boolean(displayPresetPanel),
        displayPresetCount,
        modeGuideText,
        visibleSelectedRows,
        recommendation,
        phaseD
      };

      async function validateRecommendedEntityBundle(currentHass) {
        const editor = createCardEditor("yeelight-dashboard-presence-card");
        const motion = Object.values(currentHass.states || {}).find((state) => {
          const entityId = state?.entity_id || "";
          return entityId.startsWith("binary_sensor.") && state?.attributes?.device_class === "motion";
        });
        if (!editor || !motion) return { ok: true, skipped: true, reason: "no motion binary sensor in live HA snapshot" };
        editor.hass = currentHass;
        editor.setConfig?.({ type: "custom:yeelight-dashboard-presence-card", subtype: "motion", entities: [] });
        document.body.append(editor);
        await editor.updateComplete;
        const text = editor.shadowRoot?.querySelector(".mode-guide")?.textContent || "";
        const rows = editor.shadowRoot?.querySelectorAll(".mode-guide-entity").length ?? 0;
        editor.remove();
        return {
          ok: text.includes("推荐实体包") && rows > 0,
          skipped: false,
          rows
        };
      }

      async function validatePhaseDEditors(currentHass) {
        const image = createCardEditor("yeelight-dashboard-image-card");
        const note = createCardEditor("yeelight-dashboard-note-card");
        const actions = createCardEditor("yeelight-dashboard-panel-actions-card");
        if (!image || !note || !actions) return { ok: false, reason: "Phase D editor metadata missing" };
        image.hass = note.hass = actions.hass = currentHass;
        image.setConfig?.({ type: "custom:yeelight-dashboard-image-card", image_url: "/local/cover.jpg", image_urls: ["/local/second.jpg"] });
        note.setConfig?.({ type: "custom:yeelight-dashboard-note-card", content: "家庭便签\n[ ] 检查门窗\n[x] 关闭客厅灯" });
        actions.setConfig?.({ type: "custom:yeelight-dashboard-panel-actions-card", content: "常用快捷\n入户动作\n睡前动作", entities: Object.keys(currentHass.states || {}).slice(0, 8) });
        document.body.append(image, note, actions);
        await Promise.all([image.updateComplete, note.updateComplete, actions.updateComplete]);
        const imageNames = schemaNames(image);
        const noteNames = schemaNames(note);
        const actionNames = schemaNames(actions);
        const imageSourceRows = image.shadowRoot?.querySelectorAll(".image-source-row").length ?? 0;
        const imageSourceAdd = Boolean(image.shadowRoot?.querySelector("[data-image-source-url]"));
        const noteContentRows = note.shadowRoot?.querySelectorAll(".note-content-row").length ?? 0;
        const noteContentAdd = Boolean(note.shadowRoot?.querySelector("[data-note-text]"));
        const actionContentRows = actions.shadowRoot?.querySelectorAll(".panel-action-content-row").length ?? 0;
        const actionContentAdd = Boolean(actions.shadowRoot?.querySelector("[data-panel-action-new-detail]"));
        image.remove();
        note.remove();
        actions.remove();
        return {
          ok:
            imageNames.includes("image_url") &&
            imageNames.includes("image_urls_text") &&
            imageNames.includes("url") &&
            imageSourceRows === 2 &&
            imageSourceAdd &&
            noteNames.includes("content") &&
            noteContentRows === 2 &&
            noteContentAdd &&
            actionNames.includes("subtype") &&
            actionContentRows === 2 &&
            actionContentAdd,
          imageNames,
          imageSourceRows,
          imageSourceAdd,
          noteNames,
          noteContentRows,
          noteContentAdd,
          actionNames,
          actionContentRows,
          actionContentAdd
        };
      }

      function createCardEditor(type) {
        return window.customCards?.find((item) => item.type === type)?.getConfigElement?.();
      }

      function schemaNames(editor) {
        const forms = [...(editor.shadowRoot?.querySelectorAll("ha-form") || [])];
        return forms.flatMap((form) => flatten(form.schema || []).map((item) => item.name));
      }
    }

    async function validateStrategyEditor(currentHass) {
      const editor = strategy.getConfigElement?.();
      if (!editor) return { ok: false, reason: "strategy editor missing" };
      editor.hass = currentHass;
      editor.setConfig?.({ layout_mode: "canvas" });
      document.body.append(editor);
      await editor.updateComplete;
      const text = editor.shadowRoot?.textContent || "";
      const footprint = Boolean(editor.shadowRoot?.querySelector(".layout-footprint-track"));
      const profilePresets = editor.shadowRoot?.querySelectorAll(".profile-preset").length ?? 0;
      const changedConfig = await changeStrategyProfile(editor);
      editor.remove();
      return {
        ok:
          text.includes("仪表盘模式预设") &&
          text.includes("中控屏") &&
          profilePresets === 4 &&
          text.includes("快速位置") &&
          text.includes("占位预览") &&
          footprint &&
          changedConfig?.type === "custom:yeelight-dashboard",
        footprint,
        profilePresets,
        changedConfigType: changedConfig?.type,
        changedConfigProfile: changedConfig?.profile
      };
    }

    async function changeStrategyProfile(editor) {
      const select = editor.shadowRoot?.querySelector("select");
      if (!select) return undefined;
      const eventPromise = new Promise((resolve) => editor.addEventListener("config-changed", (event) => resolve(event.detail?.config), { once: true }));
      select.value = "lighting";
      select.dispatchEvent(new Event("change"));
      return eventPromise;
    }

    async function validateAggregateNavigation() {
      await Promise.resolve();
      const controls = collectAggregateControls();
      const samples = [
        pickControl(controls, "metric", "areas"),
        pickControl(controls, "area-card", "areas"),
        pickControl(controls, "area-pill", "areas"),
        pickControl(controls, "routine-chip", "scenes"),
        pickControl(controls, "environment-zone", "environment")
      ].filter(Boolean);
      const clicks = [];
      for (const control of samples) {
        const result = await clickAggregateControl(control);
        clicks.push(result);
      }
      const summary = controls.map(({ element: _element, ...item }) => item);
      const viewPaths = [...new Set(summary.map((item) => item.viewPath).filter(Boolean))];
      const entityMetricCount = summary.filter((item) => item.kind === "metric" && item.entityId).length;
      return {
        ok:
          samples.length >= 3 &&
          clicks.every((item) => item.locationChanged && item.nativePath && item.afterUrl === item.nativePath && !item.moreInfo) &&
          entityMetricCount === 0,
        clicks,
        controlCount: controls.length,
        metricCount: summary.filter((item) => item.kind === "metric").length,
        entityMetricCount,
        viewPaths,
        sample: summary.slice(0, 18)
      };
    }

    async function clickAggregateControl(control) {
      let moreInfo = null;
      let locationChanged = false;
      const onMoreInfo = (event) => {
        moreInfo = event.detail?.entityId || "__unknown__";
      };
      const onLocationChanged = () => {
        locationChanged = true;
      };
      window.addEventListener("hass-more-info", onMoreInfo, { once: true });
      window.addEventListener("location-changed", onLocationChanged, { once: true });
      try {
        history.replaceState(null, "", "/yeelight-dashboard-live-smoke/overview?edit=1");
        control.element.click();
        await new Promise((resolve) => setTimeout(resolve, 50));
      } finally {
        window.removeEventListener("hass-more-info", onMoreInfo);
        window.removeEventListener("location-changed", onLocationChanged);
      }
      return {
        kind: control.kind,
        text: control.text,
        viewPath: control.viewPath,
        nativePath: control.nativePath,
        afterPath: location.pathname,
        afterUrl: `${location.pathname}${location.search}${location.hash}`,
        moreInfo,
        locationChanged
      };
    }

    function pickControl(controls, kind, viewPath) {
      return controls.find((item) => item.kind === kind && item.viewPath === viewPath);
    }

    function collectAggregateControls() {
      const host = document.querySelector("#yeelight-dashboard-preview");
      const buttons = [];
      const walk = (root) => {
        root.querySelectorAll?.("*").forEach((element) => {
          const kind = aggregateControlKind(element);
          if (kind) {
            buttons.push({
              element,
              kind,
              text: (element.textContent || "").replace(/\s+/g, " ").trim(),
              viewPath: element.getAttribute("data-view-path"),
              nativePath: element.getAttribute("data-native-path"),
              entityId: element.getAttribute("data-entity-id"),
              tag: element.getRootNode()?.host?.tagName?.toLowerCase() || element.tagName.toLowerCase()
            });
          }
          if (element.shadowRoot) walk(element.shadowRoot);
        });
      };
      if (host) walk(host);
      return buttons;
    }

    function aggregateControlKind(element) {
      if (!element.matches?.("[data-view-path]")) return "";
      if (element.matches(".metric-link")) return "metric";
      if (element.matches(".status-group-link")) return "status-group";
      if (element.matches(".area-card-link")) return "area-card";
      if (element.matches(".area-pill-link")) return "area-pill";
      if (element.matches(".routine-chip-link")) return "routine-chip";
      if (element.matches(".environment-zone-link")) return "environment-zone";
      return "";
    }

    async function validateEntityInteraction() {
      const host = document.querySelector("#yeelight-dashboard-preview");
      const buttons = collectElements(host, ".entity-tile-main, .entity-row-main, .action-tile-main");
      const samples = buttons.slice(0, 3);
      const clicks = [];
      for (const button of samples) {
        clicks.push(await clickMoreInfoButton(button));
      }
      return {
        ok: samples.length > 0 && clicks.every((item) => item.moreInfo && !item.locationChanged),
        targetCount: buttons.length,
        clicks
      };
    }

    async function clickMoreInfoButton(button) {
      let moreInfo = null;
      let locationChanged = false;
      const beforeUrl = `${location.pathname}${location.search}${location.hash}`;
      const onMoreInfo = (event) => {
        moreInfo = event.detail?.entityId || "__unknown__";
      };
      const onLocationChanged = () => {
        locationChanged = true;
      };
      window.addEventListener("hass-more-info", onMoreInfo, { once: true });
      window.addEventListener("location-changed", onLocationChanged, { once: true });
      try {
        button.click();
        await new Promise((resolve) => setTimeout(resolve, 50));
      } finally {
        window.removeEventListener("hass-more-info", onMoreInfo);
        window.removeEventListener("location-changed", onLocationChanged);
      }
      return {
        text: (button.textContent || "").replace(/\s+/g, " ").trim(),
        className: button.className,
        moreInfo,
        locationChanged,
        beforeUrl,
        afterUrl: `${location.pathname}${location.search}${location.hash}`
      };
    }

    function validateNativeTapActions(dashboard) {
      const nativeCards = collectGeneratedCards(dashboard).filter((card) => !String(card.type || "").startsWith("custom:"));
      const entityCards = nativeCards.filter((card) => card.entity || Array.isArray(card.entities));
      const areaCards = nativeCards.filter((card) => card.type === "area");
      const entityActionOk = entityCards.every((card) => card.tap_action?.action === "more-info");
      const areaActionOk = areaCards.every((card) => card.navigation_path && card.tap_action?.action === "navigate" && card.tap_action?.navigation_path === card.navigation_path);
      return {
        ok: nativeCards.length > 0 && entityCards.length > 0 && entityActionOk && areaActionOk,
        nativeCount: nativeCards.length,
        entityCardCount: entityCards.length,
        areaCardCount: areaCards.length,
        missingEntityTapActions: entityCards
          .filter((card) => card.tap_action?.action !== "more-info")
          .map((card) => ({ type: card.type, entity: card.entity, entities: Array.isArray(card.entities) ? card.entities.length : 0 })),
        missingAreaNavigation: areaCards
          .filter((card) => !card.navigation_path || card.tap_action?.action !== "navigate" || card.tap_action?.navigation_path !== card.navigation_path)
          .map((card) => ({ area: card.area, navigation_path: card.navigation_path, tap_action: card.tap_action }))
      };
    }

    function collectGeneratedCards(dashboard) {
      return (dashboard.views || []).flatMap((view) => (view.sections || []).flatMap((section) => section.cards || []));
    }

    function collectElements(root, selector) {
      if (!root) return [];
      const matches = [];
      const walk = (node) => {
        node.querySelectorAll?.(selector).forEach((element) => matches.push(element));
        node.querySelectorAll?.("*").forEach((element) => {
          if (element.shadowRoot) walk(element.shadowRoot);
        });
      };
      walk(root);
      return matches;
    }

    function flatten(schema) {
      return schema.flatMap((item) => (Array.isArray(item.schema) ? flatten(item.schema) : [item]));
    }

    function createSnapshotHass(snapshot) {
      return {
        states: snapshot.states || {},
        areas: snapshot.areas || [],
        connected: snapshot.connected !== false,
        locale: snapshot.locale || { language: "zh-Hans" },
        themes: snapshot.themes || {},
        callService: async () => undefined,
        callWS: async (message) => snapshot.registries?.[message.type] || []
      };
    }
  });
  if (
    !result.ok ||
    !result.communityRegistered ||
    !result.focusedViews?.ok ||
    !result.editorSmoke?.ok ||
    !result.strategyEditorSmoke?.ok ||
    !result.aggregateNavigationSmoke?.ok ||
    !result.entityInteractionSmoke?.ok ||
    !result.nativeTapActionSmoke?.ok ||
    result.overviewType !== "sections" ||
    result.canvasType !== "custom:yeelight-dashboard-canvas-view"
  ) {
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

async function captureHassSnapshot(page) {
  return page.evaluate(async () => {
    const hass = document.querySelector("home-assistant")?.hass;
    if (!hass) throw new Error("Home Assistant hass object missing");
    const callWS = async (type) => {
      try {
        return await hass.callWS?.({ type });
      } catch {
        return [];
      }
    };
    return {
      states: hass.states || {},
      areas: hass.areas || [],
      connected: hass.connected,
      locale: hass.locale,
      themes: hass.themes,
      registries: {
        "config/area_registry/list": await callWS("config/area_registry/list"),
        "config/device_registry/list": await callWS("config/device_registry/list"),
        "config/entity_registry/list": await callWS("config/entity_registry/list"),
        "config/floor_registry/list": await callWS("config/floor_registry/list"),
        "config/label_registry/list": await callWS("config/label_registry/list")
      }
    };
  });
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
          yeelight-dashboard-hero-card,
          yeelight-dashboard-status-card,
          yeelight-dashboard-notice-card,
          yeelight-dashboard-light-card,
          yeelight-dashboard-rooms-card,
          yeelight-dashboard-room-card,
          yeelight-dashboard-devices-card,
          yeelight-dashboard-routines-card,
          yeelight-dashboard-environment-card,
          yeelight-dashboard-climate-card,
          yeelight-dashboard-air-card,
          yeelight-dashboard-water-card,
          yeelight-dashboard-power-card,
          yeelight-dashboard-energy-card,
          yeelight-dashboard-infrastructure-card,
          yeelight-dashboard-media-card,
          yeelight-dashboard-camera-card,
          yeelight-dashboard-camera-wall-card,
          yeelight-dashboard-security-card,
          yeelight-dashboard-presence-card,
          yeelight-dashboard-panel-actions-card,
          yeelight-dashboard-image-card,
          yeelight-dashboard-note-card,
          yeelight-dashboard-ecosystem-card,
          yeelight-dashboard-health-card { display: block; min-width: 0; }
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
