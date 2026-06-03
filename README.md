# Yeelight Dashboard

Yeelight 品牌的完全自定义仪表盘面板。

## 功能特性

- ✅ Yeelight 品牌专属控制界面
- ✅ 设备管理和控制 UI
- ✅ 场景编辑和激活
- ✅ 高级灯光控制（色温、色彩、效果）
- ✅ 用户偏好存储
- ✅ 响应式设计
- ✅ 多语言支持

## 安装

### HACS 安装（推荐）

1. 打开 HACS
2. 搜索 "Yeelight Dashboard"
3. 点击安装
4. 重启 Home Assistant

### 手动安装

1. 下载最新版本
2. 解压到 `custom_components/yeelight_dashboard/`
3. 重启 Home Assistant

## 配置

1. 进入 设置 → 设备与服务 → 添加集成
2. 搜索 "Yeelight Dashboard"
3. 完成配置

## 功能模块

### 首页 (Home)

- 设备概览
- 快捷控制
- 场景推荐
- 状态摘要

### 房间 (Rooms)

- 房间列表
- 房间详情
- 房间设备

### 设备 (Devices)

- 设备列表
- 设备详情
- 设备控制

### 场景 (Scenes)

- 场景列表
- 场景编辑
- 场景激活

### 灯光 (Lighting)

- 灯光控制
- 色温调节
- 色彩调节
- 效果预设

### 自动化 (Automation)

- 自动化列表
- 自动化编辑
- 定时任务

### 设置 (Settings)

- 用户偏好
- 主题设置
- 设备管理

## 技术栈

- **后端**：Python 3.11+, Home Assistant API
- **前端**：Lit 3, TypeScript, Rollup
- **测试**：pytest, Vitest

## 依赖

- **ha_yeelight_pro**：Yeelight Pro 集成（软依赖）

## API 端点

| 端点 | 方法 | 描述 |
|------|------|------|
| `/api/yeelight_dashboard/devices` | GET | 获取设备列表 |
| `/api/yeelight_dashboard/devices/{id}` | GET | 获取设备详情 |
| `/api/yeelight_dashboard/devices/{id}/control` | POST | 控制设备 |
| `/api/yeelight_dashboard/scenes` | GET | 获取场景列表 |
| `/api/yeelight_dashboard/scenes` | POST | 创建场景 |
| `/api/yeelight_dashboard/scenes/{id}/activate` | POST | 激活场景 |
| `/api/yeelight_dashboard/preferences` | GET | 获取用户偏好 |
| `/api/yeelight_dashboard/preferences` | PUT | 更新用户偏好 |

## 许可证

MIT License
