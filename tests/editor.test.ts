import { describe, expect, it } from "vitest";

import { EDITOR_TAG } from "../src/strategy/config";
import { hass } from "./fixtures";
import "../src/index";

describe("strategy editor", () => {
  it("dispatches HA config-changed events", async () => {
    const editor = document.createElement(EDITOR_TAG) as HTMLElement & {
      setConfig: (config: Record<string, unknown>) => void;
      updateComplete: Promise<boolean>;
      shadowRoot: ShadowRoot;
    };
    editor.setConfig({});
    document.body.append(editor);
    await editor.updateComplete;
    const eventPromise = new Promise<CustomEvent>((resolve) => {
      editor.addEventListener("config-changed", (event) => resolve(event as CustomEvent), { once: true });
    });
    editor.shadowRoot.querySelector("select")!.value = "lighting";
    editor.shadowRoot.querySelector("select")!.dispatchEvent(new Event("change"));
    const event = await eventPromise;
    expect(event.detail.config.profile).toBe("lighting");
    expect(event.detail.config.type).toBe("custom:yeelight-dashboard");
  });

  it("renders localized strategy editor labels", async () => {
    const editor = document.createElement(EDITOR_TAG) as HTMLElement & {
      setConfig: (config: Record<string, unknown>) => void;
      hass: unknown;
      updateComplete: Promise<boolean>;
      shadowRoot: ShadowRoot;
    };
    editor.hass = hass({});
    editor.setConfig({});
    document.body.append(editor);
    await editor.updateComplete;

    expect(editor.shadowRoot.textContent).toContain("模式");
    expect(editor.shadowRoot.textContent).toContain("原生分区");
    expect(editor.shadowRoot.textContent).toContain("场景上限");
    expect(editor.shadowRoot.textContent).not.toContain("Profile");
    expect(editor.shadowRoot.textContent).not.toContain("Scene limit");
  });

  it("applies profile defaults when the HA create dialog switches profile", async () => {
    const editor = document.createElement(EDITOR_TAG) as HTMLElement & {
      setConfig: (config: Record<string, unknown>) => void;
      updateComplete: Promise<boolean>;
      shadowRoot: ShadowRoot;
    };
    editor.setConfig({
      profile: "standard",
      theme: "Yeelight Minimal",
      scope: "yeelight_and_area",
      layout_mode: "sections",
      area_mode: "selected",
      selected_areas: ["living"]
    });
    document.body.append(editor);
    await editor.updateComplete;

    const eventPromise = nextConfigEvent(editor);
    editor.shadowRoot.querySelector("select")!.value = "panel";
    editor.shadowRoot.querySelector("select")!.dispatchEvent(new Event("change"));
    const event = await eventPromise;

    expect(event.detail.config).toMatchObject({
      profile: "panel",
      theme: "Yeelight Panel",
      scope: "yeelight_and_area",
      layout_mode: "canvas",
      area_mode: "selected",
      selected_areas: ["living"],
      preferences: { density: "compact", scene_limit: 6 },
      views: { health: false, media: false }
    });
  });

  it("offers visual dashboard profile presets that preserve scoped settings", async () => {
    const editor = document.createElement(EDITOR_TAG) as HTMLElement & {
      setConfig: (config: Record<string, unknown>) => void;
      hass: unknown;
      updateComplete: Promise<boolean>;
      shadowRoot: ShadowRoot;
    };
    editor.hass = hass({});
    editor.setConfig({
      profile: "standard",
      area_mode: "selected",
      selected_areas: ["living"],
      layout_overrides: { overview: { "overview.hero": { x: 1, y: 2, w: 12, h: 3 } } }
    });
    document.body.append(editor);
    await editor.updateComplete;

    expect(editor.shadowRoot.textContent).toContain("仪表盘模式预设");
    expect(editor.shadowRoot.textContent).toContain("面向墙面平板和中控屏");
    expect(editor.shadowRoot.textContent).toContain("当前模式");
    expect(editor.shadowRoot.querySelectorAll(".profile-preset").length).toBe(4);

    const eventPromise = nextConfigEvent(editor);
    editor.shadowRoot.querySelector<HTMLButtonElement>("[data-profile='panel']")?.click();
    const event = await eventPromise;

    expect(event.detail.config).toMatchObject({
      profile: "panel",
      theme: "Yeelight Panel",
      scope: "yeelight_and_area",
      layout_mode: "canvas",
      area_mode: "selected",
      selected_areas: ["living"],
      layout_overrides: { overview: { "overview.hero": { x: 1, y: 2, w: 12, h: 3 } } },
      preferences: { density: "compact", scene_limit: 6 },
      views: { health: false, media: false }
    });
  });

  it("edits views, preferences and selected areas", async () => {
    const editor = document.createElement(EDITOR_TAG) as HTMLElement & {
      setConfig: (config: Record<string, unknown>) => void;
      hass: unknown;
      updateComplete: Promise<boolean>;
      shadowRoot: ShadowRoot;
    };
    editor.hass = hass(
      {},
      {
        areas: [
          { area_id: "living", name: "Living Room" },
          { area_id: "bedroom", name: "Bedroom" }
        ]
      }
    );
    editor.setConfig({ area_mode: "selected" });
    document.body.append(editor);
    await editor.updateComplete;

    const areaEvent = nextConfigEvent(editor);
    checkboxByText(editor.shadowRoot, "Living Room").click();
    expect((await areaEvent).detail.config.selected_areas).toEqual(["living"]);

    const mediaEvent = nextConfigEvent(editor);
    checkboxByText(editor.shadowRoot, "媒体").click();
    expect((await mediaEvent).detail.config.views.media).toBe(false);

    const limitEvent = nextConfigEvent(editor);
    inputByText(editor.shadowRoot, "场景上限").value = "3";
    inputByText(editor.shadowRoot, "场景上限").dispatchEvent(new Event("change"));
    expect((await limitEvent).detail.config.preferences.scene_limit).toBe(3);
  });

  it("edits managed canvas layout overrides as strategy config", async () => {
    const editor = document.createElement(EDITOR_TAG) as HTMLElement & {
      setConfig: (config: Record<string, unknown>) => void;
      updateComplete: Promise<boolean>;
      shadowRoot: ShadowRoot;
    };
    editor.setConfig({ layout_mode: "canvas" });
    document.body.append(editor);
    await editor.updateComplete;

    expect(editor.shadowRoot.textContent).toContain("画布布局表单");
    expect(editor.shadowRoot.textContent).toContain("快速位置");
    expect(editor.shadowRoot.textContent).toContain("占位预览");
    expect(editor.shadowRoot.textContent).toContain("高级 JSON");

    buttonByText(editor.shadowRoot, "右半").click();
    await editor.updateComplete;
    expect(editor.shadowRoot.textContent).toContain("左 6 · 上 0 · 6 x 4");

    const presetEvent = nextConfigEvent(editor);
    buttonByText(editor.shadowRoot, "应用布局").click();
    expect((await presetEvent).detail.config.layout_overrides).toEqual({
      overview: {
        "overview.hero": { x: 6, y: 0, w: 6, h: 4, z: 0 }
      }
    });
    await editor.updateComplete;

    const formEvent = nextConfigEvent(editor);
    const layoutInputs = layoutNumberInputs(editor.shadowRoot);
    changeInput(layoutInputs[0], "1");
    changeInput(layoutInputs[1], "2");
    changeInput(layoutInputs[2], "12");
    changeInput(layoutInputs[3], "3");
    buttonByText(editor.shadowRoot, "应用布局").click();
    expect((await formEvent).detail.config.layout_overrides).toEqual({
      overview: {
        "overview.hero": { x: 1, y: 2, w: 12, h: 3, z: 0 }
      }
    });
    await editor.updateComplete;
    expect(editor.shadowRoot.textContent).toContain("布局已应用");
    expect(buttonByText(editor.shadowRoot, "overview · overview.hero")).toBeTruthy();

    const removeEvent = nextConfigEvent(editor);
    buttonByText(editor.shadowRoot, "移除该卡片布局").click();
    expect((await removeEvent).detail.config.layout_overrides).toBeUndefined();
    await editor.updateComplete;
    expect(editor.shadowRoot.textContent).toContain("卡片布局已移除");

    const layoutEvent = nextConfigEvent(editor);
    const textarea = editor.shadowRoot.querySelector("textarea");
    if (!textarea) throw new Error("layout overrides textarea not found");
    textarea.value = JSON.stringify({ overview: { "overview.hero": { x: 1, y: 2, w: 12, h: 3 } } });
    textarea.dispatchEvent(new Event("change"));

    expect((await layoutEvent).detail.config.layout_overrides).toEqual({
      overview: {
        "overview.hero": { x: 1, y: 2, w: 12, h: 3 }
      }
    });

    textarea.value = "{";
    textarea.dispatchEvent(new Event("change"));
    await editor.updateComplete;
    expect(editor.shadowRoot.textContent).toContain("JSON 格式无效");
  });

  it("imports copied Layout Studio snippets from clipboard", async () => {
    const editor = document.createElement(EDITOR_TAG) as HTMLElement & {
      setConfig: (config: Record<string, unknown>) => void;
      updateComplete: Promise<boolean>;
      shadowRoot: ShadowRoot;
    };
    editor.setConfig({ layout_mode: "canvas" });
    document.body.append(editor);
    await editor.updateComplete;

    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        readText: async () =>
          JSON.stringify({
            layout_mode: "canvas",
            layout_overrides: { overview: { "overview.status": { x: 0, y: 9, w: 12, h: 5 } } }
          })
      }
    });

    const eventPromise = nextConfigEvent(editor);
    const importButton = [...editor.shadowRoot.querySelectorAll("button")].find((button) => button.textContent?.includes("导入"));
    importButton?.click();

    expect((await eventPromise).detail.config.layout_overrides).toEqual({
      overview: {
        "overview.status": { x: 0, y: 9, w: 12, h: 5 }
      }
    });
    await editor.updateComplete;
    expect(editor.shadowRoot.textContent).toContain("布局已导入");
  });

  it("shows a non-blocking notice when Yeelight themes are missing", async () => {
    const editor = document.createElement(EDITOR_TAG) as HTMLElement & {
      setConfig: (config: Record<string, unknown>) => void;
      hass: unknown;
      updateComplete: Promise<boolean>;
      shadowRoot: ShadowRoot;
    };
    editor.hass = { ...hass({}), themes: { themes: { default: {} } } };
    editor.setConfig({ theme: "Yeelight Panel" });
    document.body.append(editor);
    await editor.updateComplete;

    expect(editor.shadowRoot.textContent).toContain("Home Assistant 当前未暴露易来主题");
  });

  it("does not warn when the selected Yeelight theme is exposed by HA", async () => {
    const editor = document.createElement(EDITOR_TAG) as HTMLElement & {
      setConfig: (config: Record<string, unknown>) => void;
      hass: unknown;
      updateComplete: Promise<boolean>;
      shadowRoot: ShadowRoot;
    };
    editor.hass = { ...hass({}), themes: { themes: { "Yeelight Panel": {}, default: {} } } };
    editor.setConfig({ theme: "Yeelight Panel" });
    document.body.append(editor);
    await editor.updateComplete;

    expect(editor.shadowRoot.textContent).not.toContain("Home Assistant 当前未暴露易来主题");
  });
});

function nextConfigEvent(element: HTMLElement): Promise<CustomEvent> {
  return new Promise((resolve) => element.addEventListener("config-changed", (event) => resolve(event as CustomEvent), { once: true }));
}

function checkboxByText(root: ShadowRoot, text: string): HTMLInputElement {
  const label = [...root.querySelectorAll("label")].find((item) => item.textContent?.includes(text));
  const input = label?.querySelector<HTMLInputElement>("input[type='checkbox']");
  if (!input) throw new Error(`checkbox not found: ${text}`);
  return input;
}

function inputByText(root: ShadowRoot, text: string): HTMLInputElement {
  const label = [...root.querySelectorAll("label")].find((item) => item.querySelector("span")?.textContent?.trim() === text || item.textContent?.includes(text));
  const input = label?.querySelector<HTMLInputElement>("input");
  if (!input) throw new Error(`input not found: ${text}`);
  return input;
}

function layoutNumberInputs(root: ShadowRoot): HTMLInputElement[] {
  const inputs = [...root.querySelectorAll<HTMLInputElement>(".layout-grid input[type='number']")];
  if (inputs.length < 5) throw new Error("layout number inputs not found");
  return inputs;
}

function changeInput(input: HTMLInputElement, value: string): void {
  input.value = value;
  input.dispatchEvent(new Event("change"));
}

function buttonByText(root: ShadowRoot, text: string): HTMLButtonElement {
  const button = [...root.querySelectorAll("button")].find((item) => item.textContent?.trim() === text);
  if (!button) throw new Error(`button not found: ${text}`);
  return button;
}
