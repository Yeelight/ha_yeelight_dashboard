# Yeelight Dashboard

[English](README.md) | [中文](README_zh.md)

Yeelight-branded fully customizable dashboard panel for Home Assistant.

## Features

- ✅ Yeelight brand exclusive control interface
- ✅ Device management and control UI
- ✅ Scene editing and activation
- ✅ Advanced lighting control (color temperature, color, effects)
- ✅ User preferences storage
- ✅ Responsive design
- ✅ Multi-language support

## Installation

### HACS Installation (Recommended)

1. Open HACS
2. Search for "Yeelight Dashboard"
3. Click Install
4. Restart Home Assistant

### Manual Installation

1. Download the latest release
2. Extract to `custom_components/yeelight_dashboard/`
3. Restart Home Assistant

## Configuration

1. Go to Settings → Devices & Services → Add Integration
2. Search for "Yeelight Dashboard"
3. Complete configuration

## Feature Modules

### Home

- Device overview
- Quick controls
- Scene recommendations
- Status summary

### Rooms

- Room list
- Room details
- Room devices

### Devices

- Device list
- Device details
- Device control

### Scenes

- Scene list
- Scene editing
- Scene activation

### Lighting

- Lighting control
- Color temperature adjustment
- Color adjustment
- Effect presets

### Automation

- Automation list
- Automation editing
- Scheduled tasks

### Settings

- User preferences
- Theme settings
- Device management

## Tech Stack

- **Backend**: Python 3.11+, Home Assistant API
- **Frontend**: Lit 3, TypeScript, Rollup
- **Testing**: pytest, Vitest

## Dependencies

- **ha_yeelight_pro**: Yeelight Pro integration (soft dependency)

## API Endpoints

| Endpoint | Method | Description |
| --- | --- | --- |
| `/api/yeelight_dashboard/devices` | GET | Get device list |
| `/api/yeelight_dashboard/devices/{id}` | GET | Get device details |
| `/api/yeelight_dashboard/devices/{id}/control` | POST | Control device |
| `/api/yeelight_dashboard/scenes` | GET | Get scene list |
| `/api/yeelight_dashboard/scenes` | POST | Create scene |
| `/api/yeelight_dashboard/scenes/{id}/activate` | POST | Activate scene |
| `/api/yeelight_dashboard/preferences` | GET | Get user preferences |
| `/api/yeelight_dashboard/preferences` | PUT | Update user preferences |

## License

MIT License
