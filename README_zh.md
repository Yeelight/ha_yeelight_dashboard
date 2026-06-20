# Yeelight Dashboard

[English](README.md) | [中文](README_zh.md)

Yeelight Dashboard 是一个 Home Assistant Community Dashboard Strategy，用标准 HA registry 和 `hass.states` 自动生成完整的易来家庭中枢仪表盘。

它不是后端设备集成，不运行时依赖 `ha_yeelight_cards`，也不是旧版 Panel runtime 的原样搬运。

## 项目边界

| 项目 | 职责 |
| --- | --- |
| `ha_yeelight_pro` | 易来设备接入、HA 实体、服务和能力语义。 |
| `ha_yeelight_themes` | 易来视觉 token 和 HA 主题变量；推荐安装，但不是硬依赖。 |
| `ha_yeelight_cards` | 给手工配置 HA 仪表盘用户使用的轻量 Lovelace 卡片包。 |
| `ha_yeelight_dashboard` | 产品型自动生成仪表盘、Strategy Editor、Recipe、内部卡片和旧版迁移盘点。 |

## 当前 MVP

- 注册 `ll-strategy-dashboard-yeelight-dashboard`。
- 注册 `window.customStrategies`，可被 HA 2026.5+ 的 Community dashboards 入口发现。
- 生成 Overview、Lighting、Areas、Scenes、Environment、Media、Health 的 HA `sections` 视图。
- 支持 `layout_mode: canvas`，通过 `custom:yeelight-dashboard-canvas-view` 承接自由布局；卡片仍由 Home Assistant 创建和维护，自定义视图根据卡片级 `view_layout` 排布，并提供可视拖拽和缩放控件。
- 通过标准 `hass.callWS` 读取 Area、Floor、Device、Entity、Label registry。
- 通过 `hass.states` 读取实时状态。
- 通过 `entityRegistry.platform === "yeelight_pro"` 或设备元数据识别易来实体，不使用中文名称关键词分类。
- 提供 `custom:yeelight-dashboard-hero-card`、`custom:yeelight-dashboard-light-card`、`custom:yeelight-dashboard-room-card`、`custom:yeelight-dashboard-health-card` 等内部卡片。
- 在 `docs/legacy-inventory/` 保留旧版成果盘点。

## 安装

HACS 前端资源路径：

```yaml
url: /hacsfiles/ha_yeelight_dashboard/ha_yeelight_dashboard.js
type: module
```

手动安装资源路径：

```yaml
url: /local/ha_yeelight_dashboard.js
type: module
```

然后创建仪表盘：

```yaml
strategy:
  type: custom:yeelight-dashboard
```

可选 Canvas 布局模式：

```yaml
strategy:
  type: custom:yeelight-dashboard
  layout_mode: canvas
```

默认 `sections` 仪表盘使用 Home Assistant 原生的 Section 编辑、拖拽排序和卡片尺寸调整。若需要更接近旧版自由拖拽的能力，请使用 `layout_mode: canvas` 或 Panel profile。Managed Canvas 会保留 Strategy 自动生成能力，同时给每张生成卡片稳定 key、移动手柄、缩放手柄和 `x/y/w/h/z` 数值控件。把 Layout Studio 导出的 overrides 写入 Strategy Editor 的 `layout_overrides` 字段即可持久化位置：

```yaml
strategy:
  type: custom:yeelight-dashboard
  layout_mode: canvas
  layout_overrides:
    overview:
      overview.hero:
        x: 0
        y: 0
        w: 12
        h: 4
```

Home Assistant 2026.5+ 中，资源加载后也会在新建仪表盘的 Community dashboards 区域出现。

## 开发

```bash
npm install
npm run lint
npm run test
npm run build
npm run test:browser
```

发布产物是 `dist/ha_yeelight_dashboard.js`。

可选的已登录真实 Home Assistant smoke：

```bash
HA_LIVE_URL=http://localhost:18124 \
HA_LIVE_STORAGE_STATE=/absolute/path/to/storage-state.json \
npm run test:live
```

或使用一次性登录账号：

```bash
HA_LIVE_URL=http://localhost:18124 \
HA_LIVE_USERNAME=your-user \
HA_LIVE_PASSWORD=your-password \
HA_LIVE_SCREENSHOT=output/playwright/ha-live-smoke.png \
npm run test:live
```

没有 `HA_LIVE_URL`，或同时缺少 `HA_LIVE_STORAGE_STATE` 与账号密码时，`test:live` 会按跳过处理。live smoke 只把当前构建产物注入已登录 HA 页面，并通过 `document.querySelector("home-assistant").hass` 调用 dashboard strategy；不会创建仪表盘、调用服务或写入 HA 配置。

如果已经把构建产物安装到 HA `/config/www/ha_yeelight_dashboard.js` 并注册为 Lovelace resource，可验证真实资源加载：

```bash
HA_LIVE_URL=http://localhost:18124 \
HA_LIVE_USERNAME=your-user \
HA_LIVE_PASSWORD=your-password \
npm run test:ha-resource
```

`test:ha-resource` 会校验 `/local/ha_yeelight_dashboard.js` 和本地 `dist/ha_yeelight_dashboard.js` 的 hash 一致，然后打开 Lovelace 仪表盘路径，等待 HA 自己加载资源后检查 `window.customStrategies`。默认路径是 `/lovelace`；如果你的仪表盘路径不同，可以设置 `HA_LIVE_DASHBOARD_PATH`。只打开 HA 2026 的 `/home` 新首页是不够的，因为那个页面不会加载 Lovelace resources。

两个 live smoke 默认都会等到 `hass.states` 至少有 1 个实体后再生成仪表盘。只有明确要测空态 fixture 时才设置 `HA_LIVE_MIN_STATES=0`；本地 HA 较慢时可以用 `HA_LIVE_TIMEOUT_MS` 调整浏览器导航等待，用 `HA_LIVE_RESOURCE_TIMEOUT_MS` 调整前置 `/local/...` 资源拉取超时。

## Legacy Inventory

在 monorepo 根目录重新生成旧版盘点：

```bash
node "extensions/ha_yeelight_dashboard/tools/legacy-migrator/scan-legacy-inventory.mjs"
```

盘点输入覆盖旧版 `config/` 和 `custom_components/yeelight_dashboard/`。

## 许可证

MIT License
