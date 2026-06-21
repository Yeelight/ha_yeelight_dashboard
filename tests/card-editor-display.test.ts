import { beforeAll, describe, expect, it } from "vitest";

import "../src/index";
import { entity, hass } from "./fixtures";

describe("card editor display presets", () => {
  beforeAll(() => {
    defineHaFormStub();
  });

  it("applies display presets through existing card config fields", async () => {
    const editor = document.createElement("yeelight-dashboard-card-editor") as HTMLElement & {
      setConfig: (config: Record<string, unknown>) => void;
      hass: unknown;
      updateComplete: Promise<boolean>;
      shadowRoot: ShadowRoot;
    };
    editor.hass = hass({
      "light.office": entity("light.office", "on", { friendly_name: "Office" }),
      "update.gateway": entity("update.gateway", "on", { friendly_name: "Gateway Update" })
    });
    editor.setConfig({
      type: "custom:yeelight-dashboard-light-card",
      item_limit: 1,
      show_metrics: false,
      show_actions: true,
      show_area_summaries: false,
      density: "comfortable",
      variant: "panel"
    });
    document.body.append(editor);
    await editor.updateComplete;

    expect(editor.shadowRoot.querySelectorAll("ha-form")).toHaveLength(3);
    expect(allSchemaNames(editor.shadowRoot)).toEqual(
      expect.arrayContaining(["type", "title", "subtitle", "item_limit", "grid_columns", "grid_rows", "density", "variant", "show_metrics", "show_actions", "show_area_summaries"])
    );
    expect(allSchemaNames(editor.shadowRoot)).not.toContain("entities");
    expect(editor.shadowRoot.textContent).toContain("适合展示活跃或常用灯光。");
    expect(editor.shadowRoot.textContent).toContain("推荐领域：light");
    expect(buttonByText(editor.shadowRoot, "应用推荐配置")).not.toBeNull();
    expect(selectByText(editor.shadowRoot, "领域").value).toBe("light");
    expect(buttonByText(editor.shadowRoot, "聚焦").className).toContain("active");
    const previewHost = await previewElement(editor.shadowRoot);
    expect(previewHost.shadowRoot.textContent).toContain("实时预览");
    expect(previewHost.shadowRoot.textContent).toContain("只读");
    const preview = await previewCard(editor.shadowRoot);
    expect(preview.shadowRoot?.querySelector(".card")?.className).toContain("variant-panel");

    const statusEvent = nextConfigEvent(editor);
    buttonByText(editor.shadowRoot, "状态").click();
    const statusConfig = (await statusEvent).detail.config;
    expect(statusConfig).toMatchObject({
      item_limit: 3,
      show_metrics: true,
      show_actions: false,
      show_area_summaries: true,
      density: "compact",
      variant: "standard"
    });
    await editor.updateComplete;
    expect(haForms(editor.shadowRoot)[1].data).toMatchObject({ item_limit: 3, density: "compact", variant: "standard" });
    expect(haForms(editor.shadowRoot)[2].data).toMatchObject({ show_metrics: true, show_actions: false, show_area_summaries: true });
    expect(buttonByText(editor.shadowRoot, "状态").className).toContain("active");
    const statusPreview = await previewCard(editor.shadowRoot);
    expect(statusPreview.shadowRoot?.querySelector(".card")?.className).toContain("density-compact");
    expect(statusPreview.shadowRoot?.querySelector(".metrics")).not.toBeNull();
    expect(statusPreview.shadowRoot?.querySelector(".chip-action")).toBeNull();

    const typeEvent = nextConfigEvent(editor);
    fireHaFormValue(editor.shadowRoot, { type: "custom:yeelight-dashboard-health-card" });
    expect((await typeEvent).detail.config.type).toBe("custom:yeelight-dashboard-health-card");
    await editor.updateComplete;
    expect(haForm(editor.shadowRoot).data?.type).toBe("custom:yeelight-dashboard-health-card");
    expect(editor.shadowRoot.textContent).toContain("适合离线、未知和更新相关实体的健康检查。");
    expect(editor.shadowRoot.textContent).toContain("推荐领域：update, sensor, binary_sensor, button");
    expect(selectByText(editor.shadowRoot, "领域").value).toBe("update");
    const healthPreview = await previewCard(editor.shadowRoot, "yeelight-dashboard-health-card");
    expect(healthPreview.shadowRoot?.querySelector(".card")?.className).toContain("health");

    const recommendedEvent = nextConfigEvent(editor);
    buttonByText(editor.shadowRoot, "应用推荐配置").click();
    const recommendedConfig = (await recommendedEvent).detail.config;
    expect(recommendedConfig).toMatchObject({
      type: "custom:yeelight-dashboard-health-card",
      item_limit: 6,
      show_metrics: true,
      show_actions: true,
      show_area_summaries: true,
      density: "compact",
      variant: "standard",
      grid_options: { columns: 12, rows: 6 }
    });
    await editor.updateComplete;
    expect(haForms(editor.shadowRoot)[1].data).toMatchObject({ item_limit: 6, grid_rows: 6, density: "compact" });

    const standardEvent = nextConfigEvent(editor);
    buttonByText(editor.shadowRoot, "标准").click();
    const standardConfig = (await standardEvent).detail.config;
    expect(standardConfig.item_limit).toBeUndefined();
    expect(standardConfig.show_metrics).toBe(true);
    expect(standardConfig.show_actions).toBe(true);
    expect(standardConfig.show_area_summaries).toBe(true);
    expect(standardConfig.density).toBe("comfortable");
    expect(standardConfig.variant).toBe("standard");
    await editor.updateComplete;
    expect(haForms(editor.shadowRoot)[1].data).not.toHaveProperty("item_limit");
    expect(buttonByText(editor.shadowRoot, "标准").className).toContain("active");
  });

  it("renders a full HA visual editor when Home Assistant opens a title-only config", async () => {
    const editor = document.createElement("yeelight-dashboard-card-editor") as HTMLElement & {
      setConfig: (config: Record<string, unknown>) => void;
      hass: unknown;
      updateComplete: Promise<boolean>;
      shadowRoot: ShadowRoot;
    };
    editor.hass = hass({ "light.office": entity("light.office", "on", { friendly_name: "Office" }) });
    editor.setConfig({ type: "custom:yeelight-dashboard-light-card", title: "灯光概览" });
    document.body.append(editor);
    await editor.updateComplete;

    const schema = flattenSchema(editor.shadowRoot);
    expect(editor.shadowRoot.querySelectorAll("ha-form")).toHaveLength(3);
    expect(schema).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: "type", selector: expect.objectContaining({ select: expect.any(Object) }) }),
        expect.objectContaining({ name: "title", selector: { text: {} } }),
        expect.objectContaining({ name: "subtitle", selector: { text: {} } }),
        expect.objectContaining({ name: "item_limit", selector: expect.objectContaining({ number: expect.any(Object) }) }),
        expect.objectContaining({ name: "grid_columns", selector: expect.objectContaining({ number: expect.any(Object) }) }),
        expect.objectContaining({ name: "grid_rows", selector: expect.objectContaining({ number: expect.any(Object) }) }),
        expect.objectContaining({ name: "density", selector: expect.objectContaining({ select: expect.any(Object) }) }),
        expect.objectContaining({ name: "variant", selector: expect.objectContaining({ select: expect.any(Object) }) }),
        expect.objectContaining({ name: "show_metrics", selector: { boolean: {} } }),
        expect.objectContaining({ name: "show_actions", selector: { boolean: {} } }),
        expect.objectContaining({ name: "show_area_summaries", selector: { boolean: {} } })
      ])
    );
    expect(schema.map((item) => item.name)).not.toContain("entities");
    expect(editor.shadowRoot.textContent).toContain("内容");
    expect(editor.shadowRoot.textContent).toContain("实体选择");
    expect(editor.shadowRoot.textContent).toContain("布局");
    expect(editor.shadowRoot.textContent).toContain("可见性");
    expect(buttonByText(editor.shadowRoot, "应用推荐配置")).not.toBeNull();
    expect(allSchemaNames(editor.shadowRoot)).toEqual(expect.arrayContaining(["item_limit", "show_metrics", "show_actions"]));
  });

  it("keeps generated cards with many selected entities usable in the HA dialog", async () => {
    const states = Object.fromEntries(
      Array.from({ length: 24 }, (_, index) => {
        const number = index + 1;
        return [`light.generated_${number}`, entity(`light.generated_${number}`, "on", { friendly_name: `Generated Light ${number}` })];
      })
    );
    const editor = document.createElement("yeelight-dashboard-card-editor") as HTMLElement & {
      setConfig: (config: Record<string, unknown>) => void;
      hass: unknown;
      updateComplete: Promise<boolean>;
      shadowRoot: ShadowRoot;
    };
    editor.hass = hass(states);
    editor.setConfig({ type: "custom:yeelight-dashboard-hero-card", entities: Object.keys(states) });
    document.body.append(editor);
    await editor.updateComplete;

    expect(editor.shadowRoot.querySelectorAll("ha-form")).toHaveLength(3);
    expect(allSchemaNames(editor.shadowRoot)).not.toContain("entities");
    expect(editor.shadowRoot.textContent).toContain("已选 24 个实体");
    expect(editor.shadowRoot.querySelectorAll(".entity-row")).toHaveLength(5);
    expect(buttonByText(editor.shadowRoot, "再显示 19 个")).not.toBeNull();

    buttonByText(editor.shadowRoot, "再显示 19 个").click();
    await editor.updateComplete;
    expect(editor.shadowRoot.querySelectorAll(".entity-row")).toHaveLength(24);
    expect(buttonByText(editor.shadowRoot, "收起列表")).not.toBeNull();
  });
});

type HaFormElement = HTMLElement & {
  data?: Record<string, unknown>;
  schema?: Array<Record<string, unknown>>;
};

function defineHaFormStub(): void {
  if (!customElements.get("ha-form")) {
    customElements.define("ha-form", class extends HTMLElement {});
  }
}

function nextConfigEvent(element: HTMLElement): Promise<CustomEvent> {
  return new Promise((resolve) => element.addEventListener("config-changed", (event) => resolve(event as CustomEvent), { once: true }));
}

function inputByText(root: ShadowRoot, text: string): HTMLInputElement {
  const label = [...root.querySelectorAll("label")].find((item) => item.textContent?.includes(text));
  const input = label?.querySelector<HTMLInputElement>("input");
  if (!input) throw new Error(`input not found: ${text}`);
  return input;
}

function selectByText(root: ShadowRoot, text: string): HTMLSelectElement {
  const label = [...root.querySelectorAll("label")].find((item) => item.textContent?.includes(text));
  const select = label?.querySelector<HTMLSelectElement>("select");
  if (!select) throw new Error(`select not found: ${text}`);
  return select;
}

function checkboxByText(root: ShadowRoot, text: string): HTMLInputElement {
  const label = [...root.querySelectorAll("label")].find((item) => item.textContent?.includes(text));
  const input = label?.querySelector<HTMLInputElement>("input[type='checkbox']");
  if (!input) throw new Error(`checkbox not found: ${text}`);
  return input;
}

function buttonByText(root: ParentNode, text: string): HTMLButtonElement {
  const button = [...root.querySelectorAll("button")].find((item) => item.textContent?.trim() === text);
  if (!button) throw new Error(`button not found: ${text}`);
  return button;
}

function fireHaFormValue(root: ShadowRoot, value: Record<string, unknown>): void {
  haForm(root).dispatchEvent(new CustomEvent("value-changed", { detail: { value }, bubbles: true, composed: true }));
}

function fireHaFormValueAt(root: ShadowRoot, index: number, value: Record<string, unknown>): void {
  haForms(root)[index].dispatchEvent(new CustomEvent("value-changed", { detail: { value }, bubbles: true, composed: true }));
}

function haForm(root: ShadowRoot): HaFormElement {
  const form = haForms(root)[0];
  if (!form) throw new Error("ha-form not found");
  return form;
}

function haForms(root: ShadowRoot): HaFormElement[] {
  return [...root.querySelectorAll<HaFormElement>("ha-form")];
}

function flattenSchema(root: ShadowRoot): Array<Record<string, unknown>> {
  return flatten(haForms(root).flatMap((form) => form.schema || []));
}

function allSchemaNames(root: ShadowRoot): string[] {
  return flattenSchema(root).map((item) => String(item.name));
}

function flatten(schema: Array<Record<string, unknown>>): Array<Record<string, unknown>> {
  return schema.flatMap((item) => (Array.isArray(item.schema) ? flatten(item.schema as Array<Record<string, unknown>>) : [item]));
}

async function previewCard(root: ShadowRoot, selector = "yeelight-dashboard-light-card"): Promise<HTMLElement & { updateComplete?: Promise<boolean>; shadowRoot: ShadowRoot }> {
  const preview = await previewElement(root);
  await preview.updateComplete;
  const card = preview.shadowRoot.querySelector<HTMLElement & { updateComplete?: Promise<boolean>; shadowRoot: ShadowRoot }>(selector);
  if (!card) throw new Error("preview card not found");
  await card.updateComplete;
  return card;
}

async function previewElement(root: ShadowRoot): Promise<HTMLElement & { updateComplete: Promise<boolean>; shadowRoot: ShadowRoot }> {
  const preview = root.querySelector<HTMLElement & { updateComplete: Promise<boolean>; shadowRoot: ShadowRoot }>("yeelight-dashboard-card-editor-preview");
  if (!preview) throw new Error("preview not found");
  await preview.updateComplete;
  return preview;
}
