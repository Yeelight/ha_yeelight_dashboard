import type { HomeAssistant } from "../types";
import { EN, ZH, type TranslationKey } from "./translations";

export type { TranslationKey } from "./translations";

export function localize(
  hass: HomeAssistant | undefined,
  key: TranslationKey,
  values: Record<string, string | number> = {}
): string {
  return localizeLanguage(hass?.locale?.language, key, values);
}

export function localizeLanguage(
  language: string | undefined,
  key: TranslationKey,
  values: Record<string, string | number> = {}
): string {
  const dictionary = isChinese(language) ? ZH : EN;
  return interpolate(dictionary[key] ?? EN[key], values);
}

export function stateText(hass: HomeAssistant | undefined, state: string): string {
  const key = `state.${state}` as TranslationKey;
  return key in EN ? localize(hass, key) : state;
}

function isChinese(language: string | undefined): boolean {
  return !language || /^zh\b|^zh-/i.test(language);
}

function interpolate(template: string, values: Record<string, string | number>): string {
  return Object.entries(values).reduce((text, [key, value]) => text.replaceAll(`{${key}}`, String(value)), template);
}
