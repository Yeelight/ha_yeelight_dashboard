import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import { extname, join, resolve } from "node:path";
import { chromium } from "playwright";

const root = resolve(import.meta.dirname, "..");
const server = createServer((req, res) => {
  const url = new URL(req.url || "/", "http://localhost");
  const path = url.pathname === "/" ? "/harness/index.html" : url.pathname;
  const file = join(root, path);
  try {
    const body = readFileSync(file);
    res.writeHead(200, { "content-type": contentType(file) });
    res.end(body);
  } catch {
    res.writeHead(404);
    res.end("not found");
  }
});

await new Promise((resolveReady) => server.listen(0, "127.0.0.1", resolveReady));
const address = server.address();
const baseUrl = `http://127.0.0.1:${address.port}`;
const browser = await chromium.launch();
try {
  const viewports = [
    { width: 390, height: 844 },
    { width: 768, height: 1024 },
    { width: 1024, height: 768 },
    { width: 1366, height: 900 }
  ];
  const results = [];
  for (const viewport of viewports) {
    const page = await browser.newPage({ viewport });
    await page.goto(baseUrl, { waitUntil: "networkidle" });
    results.push(await page.evaluate(async () => {
      const card = document.querySelector("yeelight-dashboard-hero-card");
      const root = card?.shadowRoot;
      const canvas = document.querySelector("yeelight-dashboard-canvas-view");
      const canvasRoot = canvas?.shadowRoot;
      const canvasCard = canvasRoot?.querySelector("yeelight-dashboard-light-card");
      const dragHandle = canvasRoot?.querySelector(".drag-handle");
      const resizeHandle = canvasRoot?.querySelector(".resize-handle");
      const fixedShell = document.querySelector(".fixed-card-shell");
      const fixedHero = document.querySelector("#fixed-hero");
      const fixedHeroBody = fixedHero?.shadowRoot?.querySelector(".card");
      const fixedHeroContent = fixedHero?.shadowRoot?.querySelector(".card > .hero-board");
      const productCards = [...document.querySelectorAll("#product-cards > *")];
      const strategy = customElements.get("ll-strategy-dashboard-yeelight-dashboard");
      const strategyMetadata = window.customStrategies?.find((item) => item.type === "yeelight-dashboard");
      const createSuggestion = strategy?.getCreateSuggestions?.();
      const configElement = strategy?.getConfigElement?.();
      configElement.hass = { connected: true, locale: { language: "zh-Hans" }, states: {}, callService() {} };
      configElement?.setConfig?.({ layout_mode: "canvas" });
      const dashboardCardMeta = window.customCards?.find((item) => item.type === "yeelight-dashboard-light-card");
      const dashboardCardEditor = dashboardCardMeta?.getConfigElement?.();
      const imageCardMeta = window.customCards?.find((item) => item.type === "yeelight-dashboard-image-card");
      const imageCardEditor = imageCardMeta?.getConfigElement?.();
      const noteCardMeta = window.customCards?.find((item) => item.type === "yeelight-dashboard-note-card");
      const noteCardEditor = noteCardMeta?.getConfigElement?.();
      const panelActionsMeta = window.customCards?.find((item) => item.type === "yeelight-dashboard-panel-actions-card");
      const panelActionsEditor = panelActionsMeta?.getConfigElement?.();
      const editorStates = Object.fromEntries(
        Array.from({ length: 12 }, (_, index) => {
          const entityId = `light.test_${index + 1}`;
          return [entityId, { entity_id: entityId, state: "on", attributes: { friendly_name: `Test Light ${index + 1}` } }];
        })
      );
      editorStates["binary_sensor.hall_motion"] = {
        entity_id: "binary_sensor.hall_motion",
        state: "on",
        attributes: { friendly_name: "Hall Motion", device_class: "motion" }
      };
      dashboardCardEditor.hass = { connected: true, locale: { language: "zh-Hans" }, states: editorStates, callService() {} };
      dashboardCardEditor?.setConfig?.({ type: "custom:yeelight-dashboard-presence-card", subtype: "motion", title: "存在感应", entities: ["light.test_1"] });
      imageCardEditor.hass = dashboardCardEditor.hass;
      imageCardEditor?.setConfig?.({ type: "custom:yeelight-dashboard-image-card", image_url: "/local/cover.jpg", image_urls: ["/local/second.jpg | 第二张"] });
      noteCardEditor.hass = dashboardCardEditor.hass;
      noteCardEditor?.setConfig?.({ type: "custom:yeelight-dashboard-note-card", content: "家庭便签\n[ ] 检查门窗\n[x] 关闭客厅灯" });
      panelActionsEditor.hass = dashboardCardEditor.hass;
      panelActionsEditor?.setConfig?.({ type: "custom:yeelight-dashboard-panel-actions-card", content: "常用快捷\n入户动作\n睡前动作" });
      document.body.append(configElement, dashboardCardEditor, imageCardEditor, noteCardEditor, panelActionsEditor);
      await Promise.all([configElement?.updateComplete, dashboardCardEditor?.updateComplete, imageCardEditor?.updateComplete, noteCardEditor?.updateComplete, panelActionsEditor?.updateComplete]);
      const flatten = (schema) => schema.flatMap((item) => (Array.isArray(item.schema) ? flatten(item.schema) : [item]));
      const editorForms = [...(dashboardCardEditor?.shadowRoot?.querySelectorAll("ha-form") || [])];
      const editorSchemaNames = editorForms.flatMap((form) => flatten(form.schema || []).map((item) => item.name));
      const imageSourceEditorOk = Boolean(
        imageCardEditor?.shadowRoot?.textContent?.includes("图片来源") &&
          imageCardEditor?.shadowRoot?.querySelectorAll(".image-source-row").length === 2 &&
          imageCardEditor?.shadowRoot?.querySelector("[data-image-source-url]") &&
          imageCardEditor?.shadowRoot?.textContent?.includes("添加图片")
      );
      const noteContentEditorOk = Boolean(
        noteCardEditor?.shadowRoot?.textContent?.includes("便签清单") &&
          noteCardEditor?.shadowRoot?.querySelectorAll(".note-content-row").length === 2 &&
          noteCardEditor?.shadowRoot?.querySelector("[data-note-text]") &&
          noteCardEditor?.shadowRoot?.textContent?.includes("添加条目")
      );
      const panelActionsEditorOk = Boolean(
        panelActionsEditor?.shadowRoot?.textContent?.includes("快捷操作说明") &&
          panelActionsEditor?.shadowRoot?.querySelectorAll(".panel-action-content-row").length === 2 &&
          panelActionsEditor?.shadowRoot?.querySelector("[data-panel-action-new-detail]") &&
          panelActionsEditor?.shadowRoot?.textContent?.includes("添加说明")
      );
      const modeGuide = dashboardCardEditor?.shadowRoot?.querySelector(".mode-guide");
      const modeGuideText = modeGuide?.textContent || "";
      const modeGuideButtons = [...(modeGuide?.querySelectorAll("button") || [])].map((button) => button.textContent?.trim() || "");
      const modeGuideEntityAction = modeGuideButtons.some((text) =>
        text.includes("推荐实体") || text.includes("显示上限") || text.includes("暂无推荐")
      );
      const displayPresetPanel = dashboardCardEditor?.shadowRoot?.querySelector(".display-presets");
      const displayPresetText = displayPresetPanel?.textContent || "";
      const displayPresetOk = Boolean(
        displayPresetText.includes("显示预设") &&
          displayPresetText.includes("不用写 YAML") &&
          displayPresetText.includes("突出一个主要对象") &&
          dashboardCardEditor?.shadowRoot?.querySelectorAll("[data-display-preset]").length === 5
      );
      const modeGuideEntityBundleOk = Boolean(
        modeGuideText.includes("推荐实体包") &&
          modeGuideText.includes("Hall Motion") &&
          modeGuide?.querySelectorAll(".mode-guide-entity").length === 1
      );
      const strategyEditorOk = Boolean(
        configElement?.shadowRoot?.textContent?.includes("仪表盘模式预设") &&
          configElement?.shadowRoot?.textContent?.includes("中控屏") &&
          configElement?.shadowRoot?.querySelectorAll(".profile-preset").length === 4 &&
          configElement?.shadowRoot?.textContent?.includes("快速位置") &&
          configElement?.shadowRoot?.textContent?.includes("占位预览") &&
          configElement?.shadowRoot?.querySelector(".layout-footprint-track")
      );
      const cardBox = root?.querySelector("ha-card")?.getBoundingClientRect();
      const actionBox = root?.querySelector("button")?.getBoundingClientRect();
      const canvasBox = canvasRoot?.querySelector(".canvas")?.getBoundingClientRect();
      const slotBox = canvasRoot?.querySelector(".slot")?.getBoundingClientRect();
      const fixedShellBox = fixedShell?.getBoundingClientRect();
      const fixedHeroBox = fixedHero?.getBoundingClientRect();
      const fixedBodyBox = fixedHeroBody?.getBoundingClientRect();
      const productResults = productCards.map((item) => {
        const shadow = item.shadowRoot;
        const card = shadow?.querySelector("ha-card")?.getBoundingClientRect();
        const body = shadow?.querySelector(".card")?.getBoundingClientRect();
        const target = shadow?.querySelector("button, .environment-feature, .note-content, .empty")?.getBoundingClientRect();
        const directBody = shadow?.querySelector(".card > .hero-board, .card > .entity-list, .card > .devices-board, .card > .routine-board, .card > .environment-board, .card > .comfort-board, .card > .ops-board, .card > .utility-board, .card > .media-board, .card > .camera-board, .card > .security-board, .card > .presence-board");
        return {
          tag: item.tagName.toLowerCase(),
          text: shadow?.textContent || "",
          width: card?.width ?? 0,
          height: card?.height ?? 0,
          bodyHeight: body?.height ?? 0,
          targetWidth: target?.width ?? 0,
          targetHeight: target?.height ?? 0,
          contentScroll: directBody?.scrollHeight ?? 0,
          contentClient: directBody?.clientHeight ?? 0,
          hasBody: !!body
        };
      });
      return {
        strategy: !!strategy,
        hero: !!customElements.get("yeelight-dashboard-hero-card"),
        canvas: !!customElements.get("yeelight-dashboard-canvas-view"),
        community: strategyMetadata?.strategyType === "dashboard",
        communityName: strategyMetadata?.name === "Yeelight Dashboard",
        communityDocs: strategyMetadata?.documentationURL === "https://github.com/Yeelight/ha_yeelight_dashboard",
        createSuggestion: createSuggestion?.title === "Yeelight Dashboard" && createSuggestion?.icon === "mdi:view-dashboard",
        configElement: configElement?.tagName?.toLowerCase() === "yeelight-dashboard-strategy-editor",
        cardPickerContract: Boolean(
            dashboardCardMeta?.getConfigElement &&
            dashboardCardMeta?.getStubConfig &&
            dashboardCardEditor?.tagName?.toLowerCase() === "yeelight-dashboard-card-editor" &&
            editorForms.length === 3 &&
            ["type", "title", "subtitle", "item_limit", "grid_columns", "grid_rows", "density", "variant", "show_metrics", "show_actions", "show_area_summaries"].every((name) => editorSchemaNames.includes(name)) &&
            !editorSchemaNames.includes("entities") &&
            dashboardCardEditor?.shadowRoot?.querySelector("#entity-picker") &&
            modeGuideText.includes("模式配置") &&
            modeGuideText.includes("覆盖能力") &&
            imageSourceEditorOk &&
            noteContentEditorOk &&
            panelActionsEditorOk &&
            displayPresetOk &&
            modeGuideEntityAction &&
            modeGuideEntityBundleOk &&
            strategyEditorOk &&
            dashboardCardEditor?.shadowRoot?.querySelectorAll(".entity-row").length <= 5
        ),
        modeGuideText,
        hasText: !!root?.textContent?.includes("易来家庭中枢"),
        hasCanvasText: !!canvasCard?.shadowRoot?.textContent?.includes("Canvas Lights"),
        hasDragHandle: !!dragHandle,
        hasResizeHandle: !!resizeHandle,
        cardWidth: cardBox?.width ?? 0,
        cardHeight: cardBox?.height ?? 0,
        actionWidth: actionBox?.width ?? 0,
        actionHeight: actionBox?.height ?? 0,
        canvasWidth: canvasBox?.width ?? 0,
        canvasHeight: canvasBox?.height ?? 0,
        slotWidth: slotBox?.width ?? 0,
        slotHeight: slotBox?.height ?? 0,
        fixedShellHeight: fixedShellBox?.height ?? 0,
        fixedHeroHeight: fixedHeroBox?.height ?? 0,
        fixedBodyHeight: fixedBodyBox?.height ?? 0,
        fixedHeroContentScroll: fixedHeroContent?.scrollHeight ?? 0,
        fixedHeroContentClient: fixedHeroContent?.clientHeight ?? 0,
        productCards: productResults,
        productCardsOk:
          productResults.length === 12 &&
          productResults.every(
            (item) =>
              item.hasBody &&
              item.width > 280 &&
              item.height <= 362 &&
              item.bodyHeight <= 362 &&
              item.bodyHeight > 0 &&
              item.targetWidth > 0 &&
              item.targetHeight >= 28 &&
              item.contentScroll >= item.contentClient
          ) &&
          [
            "设备总览",
            "推荐操作",
            "环境舒适",
            "空气舒适",
            "电源插座",
            "基础设施",
            "影音媒体",
            "安防状态",
            "人员存在",
            "图片展示",
            "便签备注",
            "面板快捷操作",
            "常用快捷"
          ].every((text) => productResults.some((item) => item.text.includes(text))),
        fixedHeroFitsShell: Boolean(
          fixedShellBox &&
            fixedHeroBox &&
            fixedBodyBox &&
            fixedHeroBox.height <= fixedShellBox.height + 2 &&
            fixedBodyBox.height <= fixedShellBox.height + 2 &&
            fixedHeroContent.scrollHeight >= fixedHeroContent.clientHeight
        )
      };
    }));
    await page.close();
  }
  const result = {
    strategy: results.every((item) => item.strategy),
    hero: results.every((item) => item.hero),
    canvas: results.every((item) => item.canvas),
    community: results.every((item) => item.community),
    communityPickerContract: results.every((item) => item.communityName && item.communityDocs && item.createSuggestion && item.configElement && item.cardPickerContract),
    rendered: results.every(
      (item) =>
        item.hasText &&
        item.hasCanvasText &&
        item.hasDragHandle &&
        item.hasResizeHandle &&
        item.productCardsOk &&
        item.cardWidth > 0 &&
        item.cardHeight > 0 &&
        item.actionWidth > 0 &&
        item.actionHeight > 0 &&
        item.canvasWidth > 0 &&
        item.canvasHeight > 0 &&
        item.slotWidth > 0 &&
        item.slotHeight > 0 &&
        item.fixedHeroFitsShell
    ),
    viewports: results
  };
  if (!result.strategy || !result.hero || !result.canvas || !result.community || !result.communityPickerContract) {
    throw new Error(`browser assertion failed: ${JSON.stringify(result)}`);
  }
  if (!result.rendered) {
    throw new Error(`render assertion failed: ${JSON.stringify(result)}`);
  }
  console.log(JSON.stringify({ ok: true, ...result }));
} finally {
  await browser.close();
  server.close();
}

function contentType(file) {
  if (extname(file) === ".js") return "text/javascript";
  if (extname(file) === ".html") return "text/html";
  return "text/plain";
}
