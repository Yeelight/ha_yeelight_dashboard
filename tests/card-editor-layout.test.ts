import { beforeAll, describe, expect, it } from "vitest";

import "../src/index";
import { entity, hass } from "./fixtures";

describe("card editor layout options", () => {
  beforeAll(() => {
    defineHaFormStub();
  });

  it("edits Home Assistant section card dimensions through grid_options", async () => {
    const editor = document.createElement("yeelight-dashboard-card-editor") as HTMLElement & {
      setConfig: (config: Record<string, unknown>) => void;
      hass: unknown;
      updateComplete: Promise<boolean>;
      shadowRoot: ShadowRoot;
    };
    editor.hass = hass({ "light.office": entity("light.office", "on", { friendly_name: "Office" }) });
    editor.setConfig({ type: "custom:yeelight-dashboard-light-card", grid_options: { columns: 5 } });
    document.body.append(editor);
    await editor.updateComplete;

    expect(layoutForm(editor.shadowRoot).data).toMatchObject({ grid_columns: 5 });
    expect(layoutForm(editor.shadowRoot).data).not.toHaveProperty("grid_rows");
    expect(editor.shadowRoot.textContent).toContain("5 列 x 8 行");

    const columnsEvent = nextConfigEvent(editor);
    fireHaFormValueAt(editor.shadowRoot, 1, { grid_columns: 99 });
    expect((await columnsEvent).detail.config.grid_options).toEqual({ columns: 12 });
    await editor.updateComplete;

    const rowsEvent = nextConfigEvent(editor);
    fireHaFormValueAt(editor.shadowRoot, 1, { grid_rows: 0 });
    expect((await rowsEvent).detail.config.grid_options).toEqual({ columns: 12, rows: 1 });
    await editor.updateComplete;
    expect(editor.shadowRoot.textContent).toContain("12 列 x 1 行");

    const clearColumnsEvent = nextConfigEvent(editor);
    fireHaFormValueAt(editor.shadowRoot, 1, { grid_columns: "" });
    expect((await clearColumnsEvent).detail.config.grid_options).toEqual({ rows: 1 });
  });

  it("offers size presets that still write standard grid_options", async () => {
    const editor = document.createElement("yeelight-dashboard-card-editor") as HTMLElement & {
      setConfig: (config: Record<string, unknown>) => void;
      hass: unknown;
      updateComplete: Promise<boolean>;
      shadowRoot: ShadowRoot;
    };
    editor.hass = hass({ "light.office": entity("light.office", "on", { friendly_name: "Office" }) });
    editor.setConfig({ type: "custom:yeelight-dashboard-light-card", grid_options: { columns: 12, rows: 5 } });
    document.body.append(editor);
    await editor.updateComplete;

    expect(buttonByText(editor.shadowRoot, "宽幅").className).toContain("active");

    const halfEvent = nextConfigEvent(editor);
    buttonByText(editor.shadowRoot, "半宽").click();
    expect((await halfEvent).detail.config.grid_options).toEqual({ columns: 6, rows: 6 });
    await editor.updateComplete;
    expect(layoutForm(editor.shadowRoot).data).toMatchObject({ grid_columns: 6, grid_rows: 6 });
    expect(editor.shadowRoot.querySelector<HTMLElement>(".grid-preview-track span")?.style.getPropertyValue("--preview-columns")).toBe("6");
    expect(editor.shadowRoot.querySelector<HTMLElement>(".grid-preview-track span")?.style.getPropertyValue("--preview-rows")).toBe("6");

    const resetEvent = nextConfigEvent(editor);
    buttonByText(editor.shadowRoot, "默认").click();
    expect((await resetEvent).detail.config.grid_options).toBeUndefined();
    await editor.updateComplete;
    expect(buttonByText(editor.shadowRoot, "默认").className).toContain("active");
    expect(editor.shadowRoot.textContent).toContain("12 列 x 8 行");
  });
});

function nextConfigEvent(element: HTMLElement): Promise<CustomEvent> {
  return new Promise((resolve) => element.addEventListener("config-changed", (event) => resolve(event as CustomEvent), { once: true }));
}

function buttonByText(root: ShadowRoot, text: string): HTMLButtonElement {
  const button = [...root.querySelectorAll("button")].find((item) => item.textContent?.trim() === text);
  if (!button) throw new Error(`button not found: ${text}`);
  return button;
}

type HaFormElement = HTMLElement & {
  data?: Record<string, unknown>;
  schema?: Array<Record<string, unknown>>;
};

function defineHaFormStub(): void {
  if (!customElements.get("ha-form")) {
    customElements.define("ha-form", class extends HTMLElement {});
  }
}

function fireHaFormValueAt(root: ShadowRoot, index: number, value: Record<string, unknown>): void {
  haForms(root)[index].dispatchEvent(new CustomEvent("value-changed", { detail: { value }, bubbles: true, composed: true }));
}

function layoutForm(root: ShadowRoot): HaFormElement {
  const form = haForms(root)[1];
  if (!form) throw new Error("layout ha-form not found");
  return form;
}

function haForms(root: ShadowRoot): HaFormElement[] {
  return [...root.querySelectorAll<HaFormElement>("ha-form")];
}
