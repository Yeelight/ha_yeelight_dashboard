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
      const strategy = customElements.get("ll-strategy-dashboard-yeelight-dashboard");
      const strategyMetadata = window.customStrategies?.find((item) => item.type === "yeelight-dashboard");
      const createSuggestion = strategy?.getCreateSuggestions?.();
      const configElement = strategy?.getConfigElement?.();
      const dashboardCardMeta = window.customCards?.find((item) => item.type === "yeelight-dashboard-light-card");
      const dashboardCardEditor = dashboardCardMeta?.getConfigElement?.();
      const editorStates = Object.fromEntries(
        Array.from({ length: 12 }, (_, index) => {
          const entityId = `light.test_${index + 1}`;
          return [entityId, { entity_id: entityId, state: "on", attributes: { friendly_name: `Test Light ${index + 1}` } }];
        })
      );
      dashboardCardEditor.hass = { connected: true, locale: { language: "zh-Hans" }, states: editorStates, callService() {} };
      dashboardCardEditor?.setConfig?.({ type: "custom:yeelight-dashboard-light-card", title: "灯光概览", entities: Object.keys(editorStates) });
      document.body.append(dashboardCardEditor);
      await dashboardCardEditor?.updateComplete;
      const flatten = (schema) => schema.flatMap((item) => (Array.isArray(item.schema) ? flatten(item.schema) : [item]));
      const editorForms = [...(dashboardCardEditor?.shadowRoot?.querySelectorAll("ha-form") || [])];
      const editorSchemaNames = editorForms.flatMap((form) => flatten(form.schema || []).map((item) => item.name));
      const cardBox = root?.querySelector("ha-card")?.getBoundingClientRect();
      const actionBox = root?.querySelector("button")?.getBoundingClientRect();
      const canvasBox = canvasRoot?.querySelector(".canvas")?.getBoundingClientRect();
      const slotBox = canvasRoot?.querySelector(".slot")?.getBoundingClientRect();
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
            dashboardCardEditor?.shadowRoot?.querySelectorAll(".entity-row").length <= 5
        ),
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
        slotHeight: slotBox?.height ?? 0
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
        item.cardWidth > 0 &&
        item.cardHeight > 0 &&
        item.actionWidth > 0 &&
        item.actionHeight > 0 &&
        item.canvasWidth > 0 &&
        item.canvasHeight > 0 &&
        item.slotWidth > 0 &&
        item.slotHeight > 0
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
