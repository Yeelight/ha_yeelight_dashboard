import { describe, expect, it } from "vitest";

import { CANVAS_VIEW_TAG } from "../src/views/canvas-view";
import "../src/index";

describe("canvas view", () => {
  it("lays out Home Assistant-created card elements from view_layout", async () => {
    const view = document.createElement(CANVAS_VIEW_TAG) as HTMLElement & {
      setConfig: (config: Record<string, unknown>) => void;
      cards: HTMLElement[];
      updateComplete: Promise<boolean>;
      shadowRoot: ShadowRoot;
    };
    const card = document.createElement("div");
    card.textContent = "Existing HA card";
    view.setConfig({
      title: "Overview",
      path: "overview",
      cards: [{ type: "tile", view_layout: { key: "entity.light.ceiling", x: 2, y: 3, w: 4, h: 2 } }]
    });
    view.cards = [card];
    document.body.append(view);

    await view.updateComplete;

    const slot = view.shadowRoot.querySelector<HTMLElement>(".slot")!;
    expect(slot.textContent).toContain("Existing HA card");
    expect(slot.style.gridColumn).toBe("3 / span 4");
    expect(slot.style.gridRow).toBe("4 / span 2");
  });

  it("exports managed layout overrides from edit mode", async () => {
    const view = document.createElement(CANVAS_VIEW_TAG) as HTMLElement & {
      setConfig: (config: Record<string, unknown>) => void;
      cards: HTMLElement[];
      lovelace: unknown;
      updateComplete: Promise<boolean>;
      shadowRoot: ShadowRoot;
    };
    view.setConfig({
      title: "Overview",
      path: "overview",
      cards: [{ type: "tile", view_layout: { key: "overview.light", x: 0, y: 0, w: 6, h: 2 } }]
    });
    view.cards = [document.createElement("div")];
    view.lovelace = { editMode: true };
    document.body.append(view);
    await view.updateComplete;

    const eventPromise = new Promise<CustomEvent>((resolve) =>
      view.addEventListener("yeelight-layout-overrides-changed", (event) => resolve(event as CustomEvent), { once: true })
    );
    const xInput = [...view.shadowRoot.querySelectorAll("label")].find((label) => label.textContent?.trim().startsWith("x"))?.querySelector("input");
    if (!xInput) throw new Error("x input not found");
    xInput.value = "4";
    xInput.dispatchEvent(new Event("change"));

    const event = await eventPromise;
    expect(event.detail).toMatchObject({
      view: "overview",
      key: "overview.light",
      override: { x: 4, y: 0, w: 6, h: 2 }
    });
  });

  it("supports pointer drag and resize in layout studio", async () => {
    const view = document.createElement(CANVAS_VIEW_TAG) as HTMLElement & {
      setConfig: (config: Record<string, unknown>) => void;
      cards: HTMLElement[];
      lovelace: unknown;
      updateComplete: Promise<boolean>;
      shadowRoot: ShadowRoot;
    };
    view.setConfig({
      title: "Overview",
      path: "overview",
      style: {
        "--yeelight-canvas-columns": "12",
        "--yeelight-canvas-row-height": "72px",
        "--yeelight-canvas-gap": "12px"
      },
      cards: [{ type: "tile", view_layout: { key: "overview.light", x: 0, y: 0, w: 6, h: 2 } }]
    });
    view.cards = [document.createElement("div")];
    view.lovelace = { editMode: true };
    document.body.append(view);
    await view.updateComplete;

    const canvas = view.shadowRoot.querySelector<HTMLElement>(".canvas")!;
    Object.defineProperty(canvas, "getBoundingClientRect", {
      value: () => ({ width: 1008, height: 400, x: 0, y: 0, top: 0, left: 0, right: 1008, bottom: 400, toJSON: () => ({}) })
    });

    const dragEvent = onceLayoutChange(view);
    view.shadowRoot.querySelector<HTMLElement>(".drag-handle")!.dispatchEvent(pointer("pointerdown", 1, 4, 4));
    window.dispatchEvent(pointer("pointermove", 1, 172, 88));
    window.dispatchEvent(pointer("pointerup", 1, 172, 88));
    expect((await dragEvent).detail.override).toMatchObject({ x: 2, y: 1, w: 6, h: 2 });

    const resizeEvent = onceLayoutChange(view);
    view.shadowRoot.querySelector<HTMLElement>(".resize-handle")!.dispatchEvent(pointer("pointerdown", 2, 172, 88));
    window.dispatchEvent(pointer("pointermove", 2, 256, 172));
    window.dispatchEvent(pointer("pointerup", 2, 256, 172));
    expect((await resizeEvent).detail.override).toMatchObject({ x: 2, y: 1, w: 7, h: 3 });
    expect(view.shadowRoot.querySelector(".studio-copy")).toBeTruthy();
  });
});

function onceLayoutChange(element: HTMLElement): Promise<CustomEvent> {
  return new Promise<CustomEvent>((resolve) =>
    element.addEventListener("yeelight-layout-overrides-changed", (event) => resolve(event as CustomEvent), { once: true })
  );
}

function pointer(type: string, pointerId: number, clientX: number, clientY: number): PointerEvent {
  return new PointerEvent(type, { bubbles: true, composed: true, button: 0, pointerId, clientX, clientY });
}
