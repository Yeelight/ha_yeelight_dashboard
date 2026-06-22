import { beforeAll, describe, expect, it } from "vitest";

import "../src/index";
import { buildEntityOptions, filterEntityOptions } from "../src/cards/entity-picker";
import { entity, hass, type ServiceCall } from "./fixtures";

describe("internal cards", () => {
  beforeAll(() => {
    defineHaFormStub();
  });

  it("exposes HA custom card sizing APIs", () => {
    const element = document.createElement("yeelight-dashboard-hero-card") as HTMLElement & {
      setConfig: (config: Record<string, unknown>) => void;
      getCardSize: () => number;
      getGridOptions: () => Record<string, number>;
    };
    element.setConfig({ type: "custom:yeelight-dashboard-hero-card", entities: ["light.office"] });
    expect(element.getCardSize()).toBe(9);
    expect(element.getGridOptions()).toEqual({ columns: 12, rows: 9 });

    const status = document.createElement("yeelight-dashboard-status-card") as HTMLElement & {
      setConfig: (config: Record<string, unknown>) => void;
      getCardSize: () => number;
      getGridOptions: () => Record<string, number>;
    };
    status.setConfig({ type: "custom:yeelight-dashboard-status-card", entities: ["light.office"] });
    expect(status.getCardSize()).toBe(5);
    expect(status.getGridOptions()).toEqual({ columns: 12, rows: 5 });

    status.setConfig({ type: "custom:yeelight-dashboard-status-card", entities: ["light.office"], grid_options: { columns: 6, rows: 4 } });
    expect(status.getCardSize()).toBe(4);
    expect(status.getGridOptions()).toEqual({ columns: 6, rows: 4 });
  });

  it("renders product metrics and runs safe light actions", async () => {
    const calls: ServiceCall[] = [];
    const element = document.createElement("yeelight-dashboard-light-card") as HTMLElement & {
      setConfig: (config: Record<string, unknown>) => void;
      hass: unknown;
      updateComplete: Promise<boolean>;
      shadowRoot: ShadowRoot;
    };
    element.setConfig({ type: "custom:yeelight-dashboard-light-card", entities: ["light.ceiling"] });
    element.hass = hass({ "light.ceiling": entity("light.ceiling", "on", { friendly_name: "Ceiling" }) }, {}, calls);
    document.body.append(element);
    await element.updateComplete;
    expect(element.shadowRoot.textContent).toContain("灯光总览");
    element.shadowRoot.querySelector<HTMLButtonElement>(".chip-action")!.click();
    expect(calls).toEqual([{ domain: "light", service: "turn_off", data: { entity_id: "light.ceiling" } }]);
  });

  it("builds recommended entity picker options without selected entities", () => {
    const options = buildEntityOptions(
      hass({
        "switch.fan": entity("switch.fan", "off", { friendly_name: "Fan" }),
        "light.ceiling": entity("light.ceiling", "on", { friendly_name: "Ceiling" }),
        "sensor.temp": entity("sensor.temp", "23", { friendly_name: "Temperature" })
      }),
      { type: "custom:yeelight-dashboard-light-card" }
    );
    expect(options[0]).toMatchObject({ entityId: "light.ceiling", recommended: true });

    const filtered = filterEntityOptions(options, { query: "fan", domain: "", selected: ["light.ceiling"] }, 10);
    expect(filtered.options.map((option) => option.entityId)).toEqual(["switch.fan"]);
    expect(filtered.total).toBe(3);
    expect(filtered.filteredTotal).toBe(1);
  });

  it("keeps presence and security picker suggestions semantic-scoped", () => {
    const states = {
      "binary_sensor.motion": entity("binary_sensor.motion", "on", { friendly_name: "Hall Motion", device_class: "motion" }),
      "binary_sensor.battery": entity("binary_sensor.battery", "off", { friendly_name: "Battery Low", device_class: "battery" }),
      "lock.front": entity("lock.front", "locked", { friendly_name: "Front Door" }),
      "sensor.random": entity("sensor.random", "42", { friendly_name: "Random Sensor" })
    };
    const presenceOptions = buildEntityOptions(hass(states), { type: "custom:yeelight-dashboard-presence-card" });
    expect(presenceOptions.find((option) => option.entityId === "binary_sensor.motion")?.recommended).toBe(true);
    expect(presenceOptions.find((option) => option.entityId === "binary_sensor.battery")?.recommended).toBe(false);

    const securityOptions = buildEntityOptions(hass(states), { type: "custom:yeelight-dashboard-security-card" });
    expect(securityOptions.find((option) => option.entityId === "lock.front")?.recommended).toBe(true);
    expect(securityOptions.find((option) => option.entityId === "sensor.random")?.recommended).toBe(false);
  });

  it("keeps climate, air and water picker suggestions semantic-scoped", () => {
    const states = {
      "climate.living": entity("climate.living", "cool", { friendly_name: "Living AC" }),
      "fan.ceiling": entity("fan.ceiling", "on", { friendly_name: "Ceiling Fan" }),
      "humidifier.bedroom": entity("humidifier.bedroom", "off", { friendly_name: "Bedroom Humidifier" }),
      "sensor.pm25": entity("sensor.pm25", "18", { friendly_name: "Air PM25", device_class: "pm25" }),
      "sensor.water_filter": entity("sensor.water_filter", "80", { friendly_name: "Water Filter" }),
      "sensor.random": entity("sensor.random", "42", { friendly_name: "Random Sensor" })
    };

    const climateOptions = buildEntityOptions(hass(states), { type: "custom:yeelight-dashboard-climate-card" });
    expect(climateOptions.find((option) => option.entityId === "climate.living")?.recommended).toBe(true);
    expect(climateOptions.find((option) => option.entityId === "sensor.random")?.recommended).toBe(false);

    const airOptions = buildEntityOptions(hass(states), { type: "custom:yeelight-dashboard-air-card" });
    expect(airOptions.find((option) => option.entityId === "fan.ceiling")?.recommended).toBe(true);
    expect(airOptions.find((option) => option.entityId === "humidifier.bedroom")?.recommended).toBe(true);
    expect(airOptions.find((option) => option.entityId === "sensor.pm25")?.recommended).toBe(true);
    expect(airOptions.find((option) => option.entityId === "sensor.random")?.recommended).toBe(false);

    const waterOptions = buildEntityOptions(hass(states), { type: "custom:yeelight-dashboard-water-card" });
    expect(waterOptions.find((option) => option.entityId === "sensor.water_filter")?.recommended).toBe(true);
    expect(waterOptions.find((option) => option.entityId === "sensor.random")?.recommended).toBe(false);
  });

  it("keeps power, energy and infrastructure picker suggestions semantic-scoped", () => {
    const states = {
      "switch.wall_plug": entity("switch.wall_plug", "on", { friendly_name: "Wall Plug" }),
      "sensor.power": entity("sensor.power", "42", { friendly_name: "Plug Power", device_class: "power" }),
      "sensor.energy": entity("sensor.energy", "12", { friendly_name: "Solar Energy", device_class: "energy" }),
      "sensor.server_cpu": entity("sensor.server_cpu", "32", { friendly_name: "Server CPU" }),
      "sensor.random": entity("sensor.random", "42", { friendly_name: "Random Sensor" })
    };

    const powerOptions = buildEntityOptions(hass(states), { type: "custom:yeelight-dashboard-power-card" });
    expect(powerOptions.find((option) => option.entityId === "switch.wall_plug")?.recommended).toBe(true);
    expect(powerOptions.find((option) => option.entityId === "sensor.power")?.recommended).toBe(true);
    expect(powerOptions.find((option) => option.entityId === "sensor.random")?.recommended).toBe(false);

    const energyOptions = buildEntityOptions(hass(states), { type: "custom:yeelight-dashboard-energy-card" });
    expect(energyOptions.find((option) => option.entityId === "sensor.energy")?.recommended).toBe(true);
    expect(energyOptions.find((option) => option.entityId === "sensor.random")?.recommended).toBe(false);

    const infrastructureOptions = buildEntityOptions(hass(states), { type: "custom:yeelight-dashboard-infrastructure-card" });
    expect(infrastructureOptions.find((option) => option.entityId === "sensor.server_cpu")?.recommended).toBe(true);
    expect(infrastructureOptions.find((option) => option.entityId === "sensor.random")?.recommended).toBe(false);
  });

  it("keeps Phase D picker suggestions focused on actions, cameras and notes", () => {
    const states = {
      "scene.movie": entity("scene.movie", "off", { friendly_name: "Movie Scene" }),
      "camera.door": entity("camera.door", "streaming", { friendly_name: "Door Camera" }),
      "sensor.note": entity("sensor.note", "ok", { friendly_name: "Reminder Note" }),
      "sensor.random": entity("sensor.random", "42", { friendly_name: "Random Sensor" })
    };

    const actionOptions = buildEntityOptions(hass(states), { type: "custom:yeelight-dashboard-panel-actions-card" });
    expect(actionOptions.find((option) => option.entityId === "scene.movie")?.recommended).toBe(true);
    expect(actionOptions.find((option) => option.entityId === "sensor.random")?.recommended).toBe(false);

    const imageOptions = buildEntityOptions(hass(states), { type: "custom:yeelight-dashboard-image-card" });
    expect(imageOptions.find((option) => option.entityId === "camera.door")?.recommended).toBe(true);
    expect(imageOptions.find((option) => option.entityId === "sensor.note")?.recommended).toBe(false);

    const noteOptions = buildEntityOptions(hass(states), { type: "custom:yeelight-dashboard-note-card" });
    expect(noteOptions.find((option) => option.entityId === "sensor.note")?.recommended).toBe(true);
    expect(noteOptions.find((option) => option.entityId === "sensor.random")?.recommended).toBe(false);
  });

  it("respects take-control card display options", async () => {
    const states = {
      "light.one": entity("light.one", "on", { friendly_name: "One" }),
      "light.two": entity("light.two", "on", { friendly_name: "Two" }),
      "light.three": entity("light.three", "off", { friendly_name: "Three" })
    };
    const element = document.createElement("yeelight-dashboard-light-card") as HTMLElement & {
      setConfig: (config: Record<string, unknown>) => void;
      hass: unknown;
      updateComplete: Promise<boolean>;
      shadowRoot: ShadowRoot;
    };
    element.setConfig({
      type: "custom:yeelight-dashboard-light-card",
      entities: Object.keys(states),
      item_limit: 1,
      show_metrics: false,
      show_actions: false,
      density: "compact",
      variant: "panel"
    });
    element.hass = hass(states);
    document.body.append(element);
    await element.updateComplete;

    expect(element.shadowRoot.querySelector(".metrics")).toBeNull();
    expect(element.shadowRoot.querySelector(".primary-action")).toBeNull();
    expect(element.shadowRoot.querySelector(".chip-action")).toBeNull();
    expect(element.shadowRoot.querySelectorAll(".entity-tile")).toHaveLength(1);
    expect(element.shadowRoot.querySelector(".card")?.className).toContain("density-compact");
    expect(element.shadowRoot.querySelector(".card")?.className).toContain("variant-panel");
  });

  it("renders room summaries without repeating entity rows", async () => {
    const element = document.createElement("yeelight-dashboard-rooms-card") as HTMLElement & {
      setConfig: (config: Record<string, unknown>) => void;
      hass: unknown;
      updateComplete: Promise<boolean>;
      shadowRoot: ShadowRoot;
    };
    element.setConfig({
      type: "custom:yeelight-dashboard-rooms-card",
      entities: ["light.living"],
      area_summaries: [{ areaId: "living", name: "客厅", entityCount: 12, lightCount: 5, activeLightCount: 2, routineCount: 1, issueCount: 0 }]
    });
    element.hass = hass({ "light.living": entity("light.living", "on", { friendly_name: "Living" }) });
    document.body.append(element);
    await element.updateComplete;
    expect(element.shadowRoot.textContent).toContain("客厅");
    expect(element.shadowRoot.querySelectorAll(".area-card")).toHaveLength(1);
    expect(element.shadowRoot.querySelector(".entity-row")).toBeNull();
  });

  it("renders status, notice and ecosystem dashboard-only cards", async () => {
    const states = {
      "light.living": entity("light.living", "on", { friendly_name: "Living Light" }),
      "update.gateway": entity("update.gateway", "on", { friendly_name: "Gateway Update" })
    };
    const status = document.createElement("yeelight-dashboard-status-card") as HTMLElement & {
      setConfig: (config: Record<string, unknown>) => void;
      hass: unknown;
      updateComplete: Promise<boolean>;
      shadowRoot: ShadowRoot;
    };
    status.setConfig({
      type: "custom:yeelight-dashboard-status-card",
      entities: Object.keys(states),
      area_summaries: [{ areaId: "living", name: "客厅", entityCount: 2, lightCount: 1, activeLightCount: 1, routineCount: 0, issueCount: 1 }]
    });
    status.hass = hass(states);
    document.body.append(status);
    await status.updateComplete;
    expect(status.shadowRoot.textContent).toContain("家庭状态");
    expect(status.shadowRoot.querySelectorAll(".status-group")).toHaveLength(3);

    const notice = document.createElement("yeelight-dashboard-notice-card") as typeof status;
    notice.setConfig({ type: "custom:yeelight-dashboard-notice-card", entities: Object.keys(states) });
    notice.hass = hass(states);
    document.body.append(notice);
    await notice.updateComplete;
    expect(notice.shadowRoot.textContent).toContain("Gateway Update");

    const calmNotice = document.createElement("yeelight-dashboard-notice-card") as typeof status;
    calmNotice.setConfig({ type: "custom:yeelight-dashboard-notice-card", entities: ["sensor.pending"] });
    calmNotice.hass = hass({ "sensor.pending": entity("sensor.pending", "unknown", { friendly_name: "Pending Sensor" }) });
    document.body.append(calmNotice);
    await calmNotice.updateComplete;
    expect(calmNotice.shadowRoot.textContent).toContain("当前没有明显问题");
    expect(calmNotice.shadowRoot.textContent).not.toContain("Pending Sensor");

    const ecosystem = document.createElement("yeelight-dashboard-ecosystem-card") as typeof status;
    ecosystem.setConfig({
      type: "custom:yeelight-dashboard-ecosystem-card",
      entities: Object.keys(states),
      area_summaries: [{ areaId: "living", name: "客厅", entityCount: 2, lightCount: 1, activeLightCount: 1, routineCount: 0, issueCount: 1 }]
    });
    ecosystem.hass = hass(states);
    document.body.append(ecosystem);
    await ecosystem.updateComplete;
    expect(ecosystem.shadowRoot.textContent).toContain("生态概览");
    expect(ecosystem.shadowRoot.textContent).toContain("客厅");
  });

  it("provides a working take-control editor", async () => {
    const editor = document.createElement("yeelight-dashboard-card-editor") as HTMLElement & {
      setConfig: (config: Record<string, unknown>) => void;
      hass: unknown;
      updateComplete: Promise<boolean>;
      shadowRoot: ShadowRoot;
    };
    editor.hass = hass({
      "light.one": entity("light.one", "on", { friendly_name: "One Light" }),
      "scene.good_night": entity("scene.good_night", "off", { friendly_name: "Good Night" }),
      "switch.fan": entity("switch.fan", "off", { friendly_name: "Fan" })
    });
    editor.setConfig({ type: "custom:yeelight-dashboard-hero-card", title: "Old", entities: ["light.one", "sensor.missing"] });
    document.body.append(editor);
    await editor.updateComplete;
    expect(editor.shadowRoot.textContent).toContain("1 个已选实体当前不存在于 Home Assistant 状态。");
    expect(editor.shadowRoot.textContent).toContain("当前 Home Assistant 状态中不存在");

    const cleanMissingEvent = nextConfigEvent(editor);
    buttonByText(editor.shadowRoot, "移除缺失").click();
    expect((await cleanMissingEvent).detail.config.entities).toEqual(["light.one"]);
    await editor.updateComplete;
    expect(buttonByText(editor.shadowRoot, "移除缺失").disabled).toBe(true);

    const eventPromise = nextConfigEvent(editor);
    fireHaFormValueAt(editor.shadowRoot, 0, { title: "New" });
    expect((await eventPromise).detail.config.title).toBe("New");

    const sceneSearch = inputByText(editor.shadowRoot, "搜索实体");
    sceneSearch.value = "Good Night";
    sceneSearch.dispatchEvent(new Event("input"));
    selectByText(editor.shadowRoot, "领域").value = "";
    selectByText(editor.shadowRoot, "领域").dispatchEvent(new Event("change"));
    await editor.updateComplete;

    const entityEvent = nextConfigEvent(editor);
    selectByText(editor.shadowRoot, "实体选择").value = "scene.good_night";
    buttonByText(editor.shadowRoot, "添加实体").click();
    expect((await entityEvent).detail.config.entities).toEqual(["light.one", "scene.good_night"]);

    const limitEvent = nextConfigEvent(editor);
    fireHaFormValueAt(editor.shadowRoot, 1, { item_limit: 4 });
    expect((await limitEvent).detail.config.item_limit).toBe(4);

    const actionsEvent = nextConfigEvent(editor);
    fireHaFormValueAt(editor.shadowRoot, 2, { show_actions: false });
    expect((await actionsEvent).detail.config.show_actions).toBe(false);
    await editor.updateComplete;

    const search = inputByText(editor.shadowRoot, "搜索实体");
    search.value = "Fan";
    search.dispatchEvent(new Event("input"));
    const domain = selectByText(editor.shadowRoot, "领域");
    domain.value = "";
    domain.dispatchEvent(new Event("change"));
    await editor.updateComplete;

    const addEvent = nextConfigEvent(editor);
    const picker = selectByText(editor.shadowRoot, "实体选择");
    picker.value = "switch.fan";
    buttonByText(editor.shadowRoot, "添加实体").click();
    expect((await addEvent).detail.config.entities).toEqual(["light.one", "scene.good_night", "switch.fan"]);
    await editor.updateComplete;

    const initialRows = [...editor.shadowRoot.querySelectorAll(".entity-row")];
    expect(buttonByText(initialRows[0], "上移").disabled).toBe(true);
    expect(buttonByText(initialRows[2], "下移").disabled).toBe(true);

    const moveUpEvent = nextConfigEvent(editor);
    buttonByText(initialRows[2], "上移").click();
    expect((await moveUpEvent).detail.config.entities).toEqual(["light.one", "switch.fan", "scene.good_night"]);
    await editor.updateComplete;

    const moveDownEvent = nextConfigEvent(editor);
    buttonByText(editor.shadowRoot.querySelectorAll(".entity-row")[0], "下移").click();
    expect((await moveDownEvent).detail.config.entities).toEqual(["switch.fan", "light.one", "scene.good_night"]);
    await editor.updateComplete;

    const dragRows = [...editor.shadowRoot.querySelectorAll(".entity-row")];
    const dragEvent = nextConfigEvent(editor);
    dragRows[2].querySelector<HTMLElement>(".drag-button")?.dispatchEvent(drag("dragstart", "scene.good_night"));
    dragRows[0].dispatchEvent(drag("drop", "scene.good_night"));
    expect((await dragEvent).detail.config.entities).toEqual(["scene.good_night", "switch.fan", "light.one"]);
    await editor.updateComplete;

    const sortEvent = nextConfigEvent(editor);
    buttonByText(editor.shadowRoot, "推荐排序").click();
    expect((await sortEvent).detail.config.entities).toEqual(["light.one", "scene.good_night", "switch.fan"]);
    await editor.updateComplete;

    const removeEvent = nextConfigEvent(editor);
    const rows = [...editor.shadowRoot.querySelectorAll(".entity-row")];
    const sceneRow = rows.find((row) => row.textContent?.includes("scene.good_night"));
    sceneRow?.querySelector<HTMLButtonElement>(".remove-button")?.click();
    expect((await removeEvent).detail.config.entities).toEqual(["light.one", "switch.fan"]);
    await editor.updateComplete;

    const clearEvent = nextConfigEvent(editor);
    buttonByText(editor.shadowRoot, "清空实体").click();
    expect((await clearEvent).detail.config.entities).toEqual([]);
    await editor.updateComplete;
    expect(editor.shadowRoot.textContent).toContain("暂未选择实体");
    expect(buttonByText(editor.shadowRoot, "清空实体").disabled).toBe(true);
  });

  it("keeps large entity pickers searchable and domain scoped", async () => {
    const states = Object.fromEntries(
      Array.from({ length: 60 }, (_, index) => {
        const number = index + 1;
        return [`light.test_${number}`, entity(`light.test_${number}`, "off", { friendly_name: `Test Light ${number}` })];
      })
    );
    states["switch.fan"] = entity("switch.fan", "off", { friendly_name: "Ceiling Fan" });
    const editor = document.createElement("yeelight-dashboard-card-editor") as HTMLElement & {
      setConfig: (config: Record<string, unknown>) => void;
      hass: unknown;
      updateComplete: Promise<boolean>;
      shadowRoot: ShadowRoot;
    };
    editor.hass = hass(states);
    editor.setConfig({ type: "custom:yeelight-dashboard-light-card" });
    document.body.append(editor);
    await editor.updateComplete;

    const domain = selectByText(editor.shadowRoot, "推荐领域");
    expect(domain.value).toBe("light");
    expect([...domain.options].map((option) => option.value)).toEqual(["", "light"]);
    expect(buttonByText(editor.shadowRoot, "light").className).toContain("active");
    expect(editor.shadowRoot.querySelector("#entity-picker")?.querySelectorAll("option")).toHaveLength(50);
    expect(editor.shadowRoot.textContent).toContain("显示 50 / 60 个匹配项，共 61 个实体");
    expect(editor.shadowRoot.textContent).toContain("缩小搜索范围可查看更多匹配实体");

    const search = inputByText(editor.shadowRoot, "搜索实体");
    search.value = "Test Light 59";
    search.dispatchEvent(new Event("input"));
    await editor.updateComplete;
    expect(editor.shadowRoot.querySelector("#entity-picker")?.textContent).toContain("Test Light 59");

    buttonByText(editor.shadowRoot, "全部领域").click();
    await editor.updateComplete;
    expect(domain.value).toBe("");
    expect(buttonByText(editor.shadowRoot, "全部领域").className).toContain("active");
    search.value = "Ceiling Fan";
    search.dispatchEvent(new Event("input"));
    await editor.updateComplete;
    expect(editor.shadowRoot.querySelector("#entity-picker")?.textContent).toContain("Ceiling Fan");

    const addEvent = nextConfigEvent(editor);
    buttonByText(editor.shadowRoot, "添加实体").click();
    expect((await addEvent).detail.config.entities).toEqual(["switch.fan"]);
  });

  it("adds only the currently visible entity picker results", async () => {
    const states = Object.fromEntries(
      Array.from({ length: 60 }, (_, index) => {
        const number = index + 1;
        return [`light.batch_${number}`, entity(`light.batch_${number}`, "off", { friendly_name: `Batch Light ${number}` })];
      })
    );
    states["switch.fan"] = entity("switch.fan", "off", { friendly_name: "Ceiling Fan" });
    const editor = document.createElement("yeelight-dashboard-card-editor") as HTMLElement & {
      setConfig: (config: Record<string, unknown>) => void;
      hass: unknown;
      updateComplete: Promise<boolean>;
      shadowRoot: ShadowRoot;
    };
    editor.hass = hass(states);
    editor.setConfig({ type: "custom:yeelight-dashboard-light-card" });
    document.body.append(editor);
    await editor.updateComplete;

    const visibleEntities = [...editor.shadowRoot.querySelectorAll<HTMLOptionElement>("#entity-picker option")].map((option) => option.value);
    expect(visibleEntities).toHaveLength(50);

    const addEvent = nextConfigEvent(editor);
    buttonByText(editor.shadowRoot, "添加当前结果").click();
    const entities = (await addEvent).detail.config.entities;
    expect(entities).toEqual(visibleEntities);
    expect(entities).toHaveLength(50);
    expect(entities).not.toContain("switch.fan");
  });
});

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

function buttonByText(root: ParentNode, text: string): HTMLButtonElement {
  const button = [...root.querySelectorAll("button")].find((item) => item.textContent?.includes(text));
  if (!button) throw new Error(`button not found: ${text}`);
  return button;
}

function fireHaFormValueAt(root: ShadowRoot, index: number, value: Record<string, unknown>): void {
  const form = root.querySelectorAll("ha-form")[index];
  if (!form) throw new Error(`ha-form not found: ${index}`);
  form.dispatchEvent(new CustomEvent("value-changed", { detail: { value }, bubbles: true, composed: true }));
}

function defineHaFormStub(): void {
  if (!customElements.get("ha-form")) {
    customElements.define("ha-form", class extends HTMLElement {});
  }
}

function drag(type: string, entityId: string): Event {
  const event = new Event(type, { bubbles: true, cancelable: true }) as Event & { dataTransfer: DataTransfer };
  const data = new Map<string, string>();
  event.dataTransfer = {
    dropEffect: "move",
    effectAllowed: "move",
    files: [] as unknown as FileList,
    items: [] as unknown as DataTransferItemList,
    types: ["text/plain"],
    clearData: () => data.clear(),
    getData: (format: string) => data.get(format) || entityId,
    setData: (format: string, value: string) => {
      data.set(format, value);
    },
    setDragImage: () => {}
  };
  return event;
}
