import { describe, expect, it } from "vitest";

import { localizeLanguage, stateText } from "../src/i18n";
import type { HomeAssistant } from "../src/types";

function hassWithLanguage(language: string): HomeAssistant {
  return { states: {}, locale: { language } } as HomeAssistant;
}

describe("i18n locale handling", () => {
  it("treats Home Assistant Chinese locale variants as Chinese", () => {
    expect(localizeLanguage("zh-CN", "state.playing")).toBe("播放中");
    expect(localizeLanguage("zh_CN", "state.locked")).toBe("已锁定");
    expect(localizeLanguage("zh_Hans", "state.not_home")).toBe("离家");
    expect(localizeLanguage("zh-Hant", "state.unlocked")).toBe("未锁定");
  });

  it("localizes entity states through hass locale variants", () => {
    expect(stateText(hassWithLanguage("zh_CN"), "playing")).toBe("播放中");
    expect(stateText(hassWithLanguage("zh_CN"), "sunny")).toBe("晴");
    expect(stateText(hassWithLanguage("zh_CN"), "cool")).toBe("制冷");
    expect(stateText(hassWithLanguage("zh_CN"), "online")).toBe("在线");
    expect(stateText(hassWithLanguage("zh_CN"), "ok")).toBe("正常");
    expect(stateText(hassWithLanguage("en"), "playing")).toBe("Playing");
  });
});
