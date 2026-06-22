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
    expect(editor.shadowRoot.textContent).toContain("不用写 YAML");
    expect(editor.shadowRoot.textContent).toContain("突出一个主要对象");
    expect(editor.shadowRoot.querySelectorAll("[data-display-preset]")).toHaveLength(5);
    expect(displayPresetButton(editor.shadowRoot, "focus").className).toContain("active");
    expect(editor.shadowRoot.querySelector("yeelight-dashboard-card-editor-preview")).toBeNull();

    const statusEvent = nextConfigEvent(editor);
    displayPresetButton(editor.shadowRoot, "status").click();
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
    expect(displayPresetButton(editor.shadowRoot, "status").className).toContain("active");
    expect(displayPresetButton(editor.shadowRoot, "status").textContent).toContain("当前");

    const typeEvent = nextConfigEvent(editor);
    fireHaFormValue(editor.shadowRoot, { type: "custom:yeelight-dashboard-health-card" });
    expect((await typeEvent).detail.config.type).toBe("custom:yeelight-dashboard-health-card");
    await editor.updateComplete;
    expect(haForm(editor.shadowRoot).data?.type).toBe("custom:yeelight-dashboard-health-card");
    expect(editor.shadowRoot.textContent).toContain("适合离线、未知和更新相关实体的健康检查。");
    expect(editor.shadowRoot.textContent).toContain("推荐领域：update, sensor, binary_sensor, button");
    expect(selectByText(editor.shadowRoot, "领域").value).toBe("update");

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
    displayPresetButton(editor.shadowRoot, "standard").click();
    const standardConfig = (await standardEvent).detail.config;
    expect(standardConfig.item_limit).toBeUndefined();
    expect(standardConfig.show_metrics).toBe(true);
    expect(standardConfig.show_actions).toBe(true);
    expect(standardConfig.show_area_summaries).toBe(true);
    expect(standardConfig.density).toBe("comfortable");
    expect(standardConfig.variant).toBe("standard");
    await editor.updateComplete;
    expect(haForms(editor.shadowRoot)[1].data).not.toHaveProperty("item_limit");
    expect(displayPresetButton(editor.shadowRoot, "standard").className).toContain("active");
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

  it("adds capped recommended entities from the mode guide", async () => {
    const editor = document.createElement("yeelight-dashboard-card-editor") as HTMLElement & {
      setConfig: (config: Record<string, unknown>) => void;
      hass: unknown;
      updateComplete: Promise<boolean>;
      shadowRoot: ShadowRoot;
    };
    editor.hass = hass({
      "binary_sensor.hall_motion": entity("binary_sensor.hall_motion", "on", { friendly_name: "Hall Motion", device_class: "motion" }),
      "binary_sensor.office_occupancy": entity("binary_sensor.office_occupancy", "off", { friendly_name: "Office Occupancy", device_class: "occupancy" }),
      "lock.front_door": entity("lock.front_door", "locked", { friendly_name: "Front Door" })
    });
    editor.setConfig({
      type: "custom:yeelight-dashboard-presence-card",
      subtype: "motion",
      item_limit: 1
    });
    document.body.append(editor);
    await editor.updateComplete;

    expect(editor.shadowRoot.textContent).toContain("已选 0 · 匹配推荐 2");
    const addRecommended = buttonByText(editor.shadowRoot, "添加 1 个推荐实体");
    expect(addRecommended.disabled).toBe(false);

    const addEvent = nextConfigEvent(editor);
    addRecommended.click();
    const config = (await addEvent).detail.config;
    expect(config.entities).toEqual(["binary_sensor.hall_motion"]);
    expect(config.entities).not.toContain("lock.front_door");

    await editor.updateComplete;
    expect(editor.shadowRoot.textContent).toContain("已选 1 · 匹配推荐 1");
    expect(buttonByText(editor.shadowRoot, "已达到显示上限").disabled).toBe(true);
  });

  it("shows a beginner-friendly recommended entity bundle in the mode guide", async () => {
    const editor = document.createElement("yeelight-dashboard-card-editor") as HTMLElement & {
      setConfig: (config: Record<string, unknown>) => void;
      hass: unknown;
      updateComplete: Promise<boolean>;
      shadowRoot: ShadowRoot;
    };
    editor.hass = hass({
      "lock.front_door": entity("lock.front_door", "locked", { friendly_name: "Front Door" }),
      "alarm_control_panel.home": entity("alarm_control_panel.home", "disarmed", { friendly_name: "Home Alarm" })
    });
    editor.setConfig({
      type: "custom:yeelight-dashboard-security-card",
      subtype: "lock",
      item_limit: 2
    });
    document.body.append(editor);
    await editor.updateComplete;

    expect(editor.shadowRoot.textContent).toContain("推荐实体包");
    expect(editor.shadowRoot.textContent).toContain("按当前卡片模式筛选");
    const rows = editor.shadowRoot.querySelectorAll(".mode-guide-entity");
    expect(rows).toHaveLength(1);
    expect(rows[0].textContent).toContain("Front Door");
    expect(rows[0].textContent).toContain("lock.front_door");
    expect(rows[0].textContent).toContain("lock");
    expect(editor.shadowRoot.textContent).not.toContain("alarm_control_panel.home");

    const addEvent = nextConfigEvent(editor);
    rows[0].querySelector<HTMLButtonElement>("button")!.click();
    expect((await addEvent).detail.config.entities).toEqual(["lock.front_door"]);
  });

  it("exposes card subtype through the HA visual editor for migrated families", async () => {
    const editor = document.createElement("yeelight-dashboard-card-editor") as HTMLElement & {
      setConfig: (config: Record<string, unknown>) => void;
      hass: unknown;
      updateComplete: Promise<boolean>;
      shadowRoot: ShadowRoot;
    };
    editor.hass = hass({
      "media_player.living": entity("media_player.living", "playing", { friendly_name: "Living Speaker" }),
      "binary_sensor.motion": entity("binary_sensor.motion", "on", { friendly_name: "Hall Motion", device_class: "motion" })
    });
    editor.setConfig({ type: "custom:yeelight-dashboard-media-card", title: "媒体" });
    document.body.append(editor);
    await editor.updateComplete;

    const schema = flattenSchema(editor.shadowRoot);
    const subtype = schema.find((item) => item.name === "subtype");
    expect(subtype?.selector).toEqual(expect.objectContaining({ select: expect.any(Object) }));
    expect(haForm(editor.shadowRoot).data).toMatchObject({ type: "custom:yeelight-dashboard-media-card", subtype: "hub" });
    expect(haForm(editor.shadowRoot).computeHelper?.({ name: "subtype" })).toBe("选择这张卡片的用途和布局模式。");
    expect(editor.shadowRoot.textContent).toContain("适合播放器、广播、语音助手和遥控器等媒体中枢。");
    expect(editor.shadowRoot.textContent).toContain("推荐领域：media_player, remote");
    expect(editor.shadowRoot.textContent).toContain("模式预设");
    expect(editor.shadowRoot.textContent).toContain("覆盖 1 个已迁移能力");
    expect(editor.shadowRoot.textContent).toContain("推荐：media_player, remote");
    expect(editor.shadowRoot.textContent).not.toContain("broadcast-radio-card");
    expect(editor.shadowRoot.textContent).toContain("模式配置");
    expect(editor.shadowRoot.textContent).toContain("覆盖能力");
    expect(editor.shadowRoot.textContent).toContain("推荐尺寸");
    expect(editor.shadowRoot.textContent).toContain("操作只使用 Home Assistant 标准服务");
    expect(selectByText(editor.shadowRoot, "领域").value).toBe("media_player");

    const subtypeEvent = nextConfigEvent(editor);
    buttonContainingText(editor.shadowRoot, "广播").click();
    expect((await subtypeEvent).detail.config).toMatchObject({
      subtype: "broadcast",
      item_limit: 3,
      density: "compact",
      variant: "standard",
      grid_options: { columns: 12, rows: 7 }
    });
    await editor.updateComplete;
    expect(haForm(editor.shadowRoot).data).toMatchObject({ subtype: "broadcast" });
    expect(haForms(editor.shadowRoot)[1].data).toMatchObject({ item_limit: 3, density: "compact", variant: "standard", grid_rows: 7 });
    expect(editor.shadowRoot.textContent).toContain("已选 0 · 匹配推荐 0");

    const typeEvent = nextConfigEvent(editor);
    fireHaFormValue(editor.shadowRoot, { type: "custom:yeelight-dashboard-presence-card" });
    const config = (await typeEvent).detail.config;
    expect(config.type).toBe("custom:yeelight-dashboard-presence-card");
    expect(config.subtype).toBe("motion");
    await editor.updateComplete;
    expect(haForm(editor.shadowRoot).data).toMatchObject({ type: "custom:yeelight-dashboard-presence-card", subtype: "motion" });
    expect(selectByText(editor.shadowRoot, "领域").value).toBe("binary_sensor");

    const airTypeEvent = nextConfigEvent(editor);
    fireHaFormValue(editor.shadowRoot, { type: "custom:yeelight-dashboard-air-card" });
    const airConfig = (await airTypeEvent).detail.config;
    expect(airConfig.type).toBe("custom:yeelight-dashboard-air-card");
    expect(airConfig.subtype).toBe("fan");
    await editor.updateComplete;
    expect(haForm(editor.shadowRoot).data).toMatchObject({ type: "custom:yeelight-dashboard-air-card", subtype: "fan" });
    expect(editor.shadowRoot.textContent).toContain("适合风扇、加湿器和空气质量读数的产品型空气卡。");
    expect(editor.shadowRoot.textContent).toContain("推荐领域：fan, sensor, binary_sensor, humidifier");
    expect(editor.shadowRoot.textContent).toContain("覆盖 1 个已迁移能力");
    expect(editor.shadowRoot.textContent).toContain("推荐：humidifier, sensor, binary_sensor");
    expect(editor.shadowRoot.textContent).not.toContain("humidifier-card");
    expect(flattenSchema(editor.shadowRoot).find((item) => item.name === "subtype")).toBeTruthy();

    const humidifierEvent = nextConfigEvent(editor);
    fireHaFormValue(editor.shadowRoot, { subtype: "humidifier" });
    expect((await humidifierEvent).detail.config.subtype).toBe("humidifier");

    const infrastructureTypeEvent = nextConfigEvent(editor);
    fireHaFormValue(editor.shadowRoot, { type: "custom:yeelight-dashboard-infrastructure-card" });
    const infrastructureConfig = (await infrastructureTypeEvent).detail.config;
    expect(infrastructureConfig.type).toBe("custom:yeelight-dashboard-infrastructure-card");
    expect(infrastructureConfig.subtype).toBe("server");
    await editor.updateComplete;
    expect(haForm(editor.shadowRoot).data).toMatchObject({ type: "custom:yeelight-dashboard-infrastructure-card", subtype: "server" });
    expect(editor.shadowRoot.textContent).toContain("适合服务器、路由、NAS 和 PVE 监控实体的基础设施卡。");
    expect(editor.shadowRoot.textContent).toContain("推荐领域：sensor, binary_sensor, update");

    const routerEvent = nextConfigEvent(editor);
    fireHaFormValue(editor.shadowRoot, { subtype: "router" });
    expect((await routerEvent).detail.config.subtype).toBe("router");

    const imageTypeEvent = nextConfigEvent(editor);
    fireHaFormValue(editor.shadowRoot, { type: "custom:yeelight-dashboard-image-card" });
    const imageConfig = (await imageTypeEvent).detail.config;
    expect(imageConfig.type).toBe("custom:yeelight-dashboard-image-card");
    expect(imageConfig.subtype).toBe("single");
    await editor.updateComplete;
    expect(flattenSchema(editor.shadowRoot).map((item) => item.name)).toEqual(expect.arrayContaining(["image_url", "content", "image_urls_text", "url"]));
    expect(editor.shadowRoot.textContent).toContain("适合用可编辑 URL 展示单图或轮播，也可关联摄像头实体。");

    const noteTypeEvent = nextConfigEvent(editor);
    fireHaFormValue(editor.shadowRoot, { type: "custom:yeelight-dashboard-note-card" });
    const noteConfig = (await noteTypeEvent).detail.config;
    expect(noteConfig.type).toBe("custom:yeelight-dashboard-note-card");
    expect(noteConfig.subtype).toBe("standard");
    await editor.updateComplete;
    expect(flattenSchema(editor.shadowRoot).map((item) => item.name)).toContain("content");
  });

  it("exposes subtype choices for legacy core card variants", async () => {
    const editor = document.createElement("yeelight-dashboard-card-editor") as HTMLElement & {
      setConfig: (config: Record<string, unknown>) => void;
      hass: unknown;
      updateComplete: Promise<boolean>;
      shadowRoot: ShadowRoot;
    };
    editor.hass = hass({
      "light.office": entity("light.office", "on", { friendly_name: "Office Light" }),
      "scene.movie": entity("scene.movie", "off", { friendly_name: "Movie" }),
      "weather.home": entity("weather.home", "sunny", { friendly_name: "Home Weather" }),
      "update.gateway": entity("update.gateway", "on", { friendly_name: "Gateway Update" })
    });
    editor.setConfig({ type: "custom:yeelight-dashboard-light-card", title: "灯光" });
    document.body.append(editor);
    await editor.updateComplete;

    expect(haForm(editor.shadowRoot).data).toMatchObject({ type: "custom:yeelight-dashboard-light-card", subtype: "favorites" });
    expect(selectOptions(flattenSchema(editor.shadowRoot).find((item) => item.name === "subtype"))).toEqual(["favorites", "status", "overview", "devices"]);
    expect(haForm(editor.shadowRoot).computeHelper?.({ name: "subtype" })).toBe("选择这张卡片的用途和布局模式。");

    const routinesEvent = nextConfigEvent(editor);
    fireHaFormValue(editor.shadowRoot, { type: "custom:yeelight-dashboard-routines-card" });
    const routinesConfig = (await routinesEvent).detail.config;
    expect(routinesConfig.type).toBe("custom:yeelight-dashboard-routines-card");
    expect(routinesConfig.subtype).toBe("quick");
    await editor.updateComplete;
    expect(selectOptions(flattenSchema(editor.shadowRoot).find((item) => item.name === "subtype"))).toEqual(
      expect.arrayContaining(["quick", "list", "commands", "scripts", "schedule", "automations", "scene-single", "automation-single", "script-single", "button"])
    );

    const environmentEvent = nextConfigEvent(editor);
    fireHaFormValue(editor.shadowRoot, { type: "custom:yeelight-dashboard-environment-card" });
    const environmentConfig = (await environmentEvent).detail.config;
    expect(environmentConfig.type).toBe("custom:yeelight-dashboard-environment-card");
    expect(environmentConfig.subtype).toBe("overview");
    await editor.updateComplete;
    expect(selectOptions(flattenSchema(editor.shadowRoot).find((item) => item.name === "subtype"))).toEqual(["overview", "weather", "sensors", "illuminance"]);
    expect(editor.shadowRoot.textContent).toContain("推荐领域：weather, climate, fan, humidifier, sensor, binary_sensor");

    const healthEvent = nextConfigEvent(editor);
    fireHaFormValue(editor.shadowRoot, { type: "custom:yeelight-dashboard-health-card" });
    const healthConfig = (await healthEvent).detail.config;
    expect(healthConfig.type).toBe("custom:yeelight-dashboard-health-card");
    expect(healthConfig.subtype).toBe("overview");
    await editor.updateComplete;
    expect(selectOptions(flattenSchema(editor.shadowRoot).find((item) => item.name === "subtype"))).toEqual(expect.arrayContaining(["updates", "repairs-backup", "network", "events", "history"]));
    expect(editor.shadowRoot.textContent).toContain("推荐领域：update, sensor, binary_sensor, button, event, calendar, todo");
  });

  it("round-trips Phase D content fields through the HA visual editor", async () => {
    const editor = document.createElement("yeelight-dashboard-card-editor") as HTMLElement & {
      setConfig: (config: Record<string, unknown>) => void;
      hass: unknown;
      updateComplete: Promise<boolean>;
      shadowRoot: ShadowRoot;
    };
    editor.hass = hass({ "camera.door": entity("camera.door", "streaming", { friendly_name: "Door Camera" }) });
    editor.setConfig({
      type: "custom:yeelight-dashboard-image-card",
      image_url: "/local/old.jpg",
      image_urls: ["/local/a.jpg"],
      url: "/lovelace"
    });
    document.body.append(editor);
    await editor.updateComplete;

    const schemaNames = flattenSchema(editor.shadowRoot).map((item) => item.name);
    expect(schemaNames).toEqual(expect.arrayContaining(["type", "subtype", "title", "subtitle", "image_url", "content", "image_urls_text", "url"]));
    expect(haForm(editor.shadowRoot).data).toMatchObject({
      image_url: "/local/old.jpg",
      image_urls_text: "/local/a.jpg",
      url: "/lovelace"
    });
    expect(editor.shadowRoot.textContent).toContain("图片来源");
    expect(editor.shadowRoot.querySelectorAll(".image-source-row")).toHaveLength(2);

    const imageEvent = nextConfigEvent(editor);
    fireHaFormValue(editor.shadowRoot, {
      image_url: "/local/new.jpg",
      content: "客厅相册\n今日精选",
      image_urls_text: "/local/one.jpg\n/local/two.jpg",
      url: "/lovelace/media"
    });
    expect((await imageEvent).detail.config).toMatchObject({
      image_url: "/local/new.jpg",
      content: "客厅相册\n今日精选",
      image_urls: ["/local/one.jpg", "/local/two.jpg"],
      url: "/lovelace/media"
    });
    await editor.updateComplete;

    const titleEvent = nextConfigEvent(editor);
    imageSourceTitleInput(editor.shadowRoot, 0).value = "主封面";
    imageSourceTitleInput(editor.shadowRoot, 0).dispatchEvent(new Event("change", { bubbles: true, composed: true }));
    expect((await titleEvent).detail.config.image_url).toBe("/local/new.jpg | 主封面");
    await editor.updateComplete;

    const moveEvent = nextConfigEvent(editor);
    imageSourceButton(editor.shadowRoot, 1, "上移").click();
    expect((await moveEvent).detail.config).toMatchObject({
      image_url: "/local/one.jpg",
      image_urls: ["/local/new.jpg | 主封面", "/local/two.jpg"]
    });
    await editor.updateComplete;

    const removeEvent = nextConfigEvent(editor);
    imageSourceButton(editor.shadowRoot, 1, "删除").click();
    expect((await removeEvent).detail.config).toMatchObject({
      image_url: "/local/one.jpg",
      image_urls: ["/local/two.jpg"]
    });
    await editor.updateComplete;

    const addEvent = nextConfigEvent(editor);
    const addUrl = editor.shadowRoot.querySelector<HTMLInputElement>("[data-image-source-url]");
    const addTitle = editor.shadowRoot.querySelector<HTMLInputElement>("[data-image-source-title]");
    expect(addUrl).toBeTruthy();
    addUrl!.value = "/local/three.jpg";
    addTitle!.value = "晚安模式";
    buttonByText(editor.shadowRoot, "添加图片").click();
    expect((await addEvent).detail.config).toMatchObject({
      image_url: "/local/one.jpg",
      image_urls: ["/local/two.jpg", "/local/three.jpg | 晚安模式"]
    });

    const noteEvent = nextConfigEvent(editor);
    fireHaFormValue(editor.shadowRoot, { type: "custom:yeelight-dashboard-note-card" });
    expect((await noteEvent).detail.config.type).toBe("custom:yeelight-dashboard-note-card");
    await editor.updateComplete;
    expect(editor.shadowRoot.textContent).toContain("便签清单");
    expect(editor.shadowRoot.querySelector(".note-content-editor")).toBeTruthy();

    const contentEvent = nextConfigEvent(editor);
    fireHaFormValue(editor.shadowRoot, { content: "家庭便签\n- 普通说明\n[ ] 待办任务\n[x] 已完成任务" });
    expect((await contentEvent).detail.config.content).toBe("家庭便签\n- 普通说明\n[ ] 待办任务\n[x] 已完成任务");
    await editor.updateComplete;
    expect(editor.shadowRoot.querySelectorAll(".note-content-row")).toHaveLength(3);

    const noteTitleEvent = nextConfigEvent(editor);
    inputByText(editor.shadowRoot, "便签标题").value = "交接事项";
    inputByText(editor.shadowRoot, "便签标题").dispatchEvent(new Event("change", { bubbles: true, composed: true }));
    expect((await noteTitleEvent).detail.config.content).toBe("交接事项\n- 普通说明\n[ ] 待办任务\n[x] 已完成任务");
    await editor.updateComplete;

    const noteKindEvent = nextConfigEvent(editor);
    noteRowKindSelect(editor.shadowRoot, 0).value = "todo";
    noteRowKindSelect(editor.shadowRoot, 0).dispatchEvent(new Event("change", { bubbles: true, composed: true }));
    expect((await noteKindEvent).detail.config.content).toBe("交接事项\n[ ] 普通说明\n[ ] 待办任务\n[x] 已完成任务");
    await editor.updateComplete;

    const noteMoveEvent = nextConfigEvent(editor);
    noteRowButton(editor.shadowRoot, 2, "上移").click();
    expect((await noteMoveEvent).detail.config.content).toBe("交接事项\n[ ] 普通说明\n[x] 已完成任务\n[ ] 待办任务");
    await editor.updateComplete;

    const noteRemoveEvent = nextConfigEvent(editor);
    noteRowButton(editor.shadowRoot, 1, "删除").click();
    expect((await noteRemoveEvent).detail.config.content).toBe("交接事项\n[ ] 普通说明\n[ ] 待办任务");
    await editor.updateComplete;

    const noteAddEvent = nextConfigEvent(editor);
    editor.shadowRoot.querySelector<HTMLSelectElement>("[data-note-kind]")!.value = "done";
    editor.shadowRoot.querySelector<HTMLInputElement>("[data-note-text]")!.value = "巡检完成";
    buttonByText(editor.shadowRoot, "添加条目").click();
    expect((await noteAddEvent).detail.config.content).toBe("交接事项\n[ ] 普通说明\n[ ] 待办任务\n[x] 巡检完成");

    const panelActionsEvent = nextConfigEvent(editor);
    fireHaFormValue(editor.shadowRoot, { type: "custom:yeelight-dashboard-panel-actions-card" });
    expect((await panelActionsEvent).detail.config.type).toBe("custom:yeelight-dashboard-panel-actions-card");
    await editor.updateComplete;
    expect(flattenSchema(editor.shadowRoot).map((item) => item.name)).toContain("content");
    expect(haForm(editor.shadowRoot).computeHelper?.({ name: "content" })).toContain("快捷操作说明");
    expect(editor.shadowRoot.textContent).toContain("快捷操作说明");
    expect(editor.shadowRoot.querySelector(".panel-action-content-editor")).toBeTruthy();

    const actionContentEvent = nextConfigEvent(editor);
    fireHaFormValue(editor.shadowRoot, { content: "常用快捷\n入户动作\n睡前动作" });
    expect((await actionContentEvent).detail.config.content).toBe("常用快捷\n入户动作\n睡前动作");
    await editor.updateComplete;
    expect(editor.shadowRoot.querySelectorAll(".panel-action-content-row")).toHaveLength(2);

    const actionTitleEvent = nextConfigEvent(editor);
    inputByText(editor.shadowRoot, "说明标题").value = "中控屏快捷";
    inputByText(editor.shadowRoot, "说明标题").dispatchEvent(new Event("change", { bubbles: true, composed: true }));
    expect((await actionTitleEvent).detail.config.content).toBe("中控屏快捷\n- 入户动作\n- 睡前动作");
    await editor.updateComplete;

    const actionDetailEvent = nextConfigEvent(editor);
    panelActionDetailInput(editor.shadowRoot, 0).value = "回家模式";
    panelActionDetailInput(editor.shadowRoot, 0).dispatchEvent(new Event("change", { bubbles: true, composed: true }));
    expect((await actionDetailEvent).detail.config.content).toBe("中控屏快捷\n- 回家模式\n- 睡前动作");
    await editor.updateComplete;

    const actionMoveEvent = nextConfigEvent(editor);
    panelActionDetailButton(editor.shadowRoot, 1, "上移").click();
    expect((await actionMoveEvent).detail.config.content).toBe("中控屏快捷\n- 睡前动作\n- 回家模式");
    await editor.updateComplete;

    const actionRemoveEvent = nextConfigEvent(editor);
    panelActionDetailButton(editor.shadowRoot, 1, "删除").click();
    expect((await actionRemoveEvent).detail.config.content).toBe("中控屏快捷\n- 睡前动作");
    await editor.updateComplete;

    const actionAddEvent = nextConfigEvent(editor);
    editor.shadowRoot.querySelector<HTMLInputElement>("[data-panel-action-new-detail]")!.value = "离家模式";
    buttonByText(editor.shadowRoot, "添加说明").click();
    expect((await actionAddEvent).detail.config.content).toBe("中控屏快捷\n- 睡前动作\n- 离家模式");
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
  computeHelper?: (schema: Record<string, unknown>) => string;
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

function buttonContainingText(root: ParentNode, text: string): HTMLButtonElement {
  const button = [...root.querySelectorAll("button")].find((item) => item.textContent?.includes(text));
  if (!button) throw new Error(`button not found containing: ${text}`);
  return button;
}

function displayPresetButton(root: ParentNode, key: string): HTMLButtonElement {
  const button = root.querySelector<HTMLButtonElement>(`[data-display-preset='${key}']`);
  if (!button) throw new Error(`display preset button not found: ${key}`);
  return button;
}

function imageSourceTitleInput(root: ShadowRoot, index: number): HTMLInputElement {
  const row = root.querySelectorAll(".image-source-row")[index];
  const input = row?.querySelectorAll<HTMLInputElement>("input")[1];
  if (!input) throw new Error(`image source title input not found: ${index}`);
  return input;
}

function imageSourceButton(root: ShadowRoot, index: number, text: string): HTMLButtonElement {
  const row = root.querySelectorAll(".image-source-row")[index];
  const button = [...(row?.querySelectorAll<HTMLButtonElement>("button") || [])].find((item) => item.textContent?.trim() === text);
  if (!button) throw new Error(`image source button not found: ${index} ${text}`);
  return button;
}

function noteRowKindSelect(root: ShadowRoot, index: number): HTMLSelectElement {
  const row = root.querySelectorAll(".note-content-row")[index];
  const select = row?.querySelector<HTMLSelectElement>("select");
  if (!select) throw new Error(`note row kind select not found: ${index}`);
  return select;
}

function noteRowButton(root: ShadowRoot, index: number, text: string): HTMLButtonElement {
  const row = root.querySelectorAll(".note-content-row")[index];
  const button = [...(row?.querySelectorAll<HTMLButtonElement>("button") || [])].find((item) => item.textContent?.trim() === text);
  if (!button) throw new Error(`note row button not found: ${index} ${text}`);
  return button;
}

function panelActionDetailInput(root: ShadowRoot, index: number): HTMLInputElement {
  const row = root.querySelectorAll(".panel-action-content-row")[index];
  const input = row?.querySelector<HTMLInputElement>("[data-panel-action-detail]");
  if (!input) throw new Error(`panel action detail input not found: ${index}`);
  return input;
}

function panelActionDetailButton(root: ShadowRoot, index: number, text: string): HTMLButtonElement {
  const row = root.querySelectorAll(".panel-action-content-row")[index];
  const button = [...(row?.querySelectorAll<HTMLButtonElement>("button") || [])].find((item) => item.textContent?.trim() === text);
  if (!button) throw new Error(`panel action detail button not found: ${index} ${text}`);
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

function selectOptions(schema: Record<string, unknown> | undefined): string[] {
  const selector = schema?.selector as { select?: { options?: Array<{ value?: string }> } } | undefined;
  return selector?.select?.options?.map((option) => String(option.value || "")) || [];
}
