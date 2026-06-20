import { uniqueBy } from "./fs-utils.mjs";

export function parseCatalogWidgets(source) {
  const widgets = [];
  const pattern =
    /widget\(\s*"([^"]+)"\s*,\s*"([^"]+)"\s*,\s*"([^"]+)"\s*,\s*([0-9.]+)\s*,\s*"([^"]+)"\s*,\s*"([^"]+)"\s*,\s*"([^"]+)"\s*,\s*\{([\s\S]*?)\}\s*\)/g;
  let match;
  while ((match = pattern.exec(source))) {
    const [, id, type, title, order, size, layout, sourceKind, optionsSource] =
      match;
    widgets.push({
      id,
      type,
      title,
      order: Number(order),
      size,
      layout,
      source: sourceKind,
      options: parseOptions(optionsSource),
    });
  }
  return widgets.sort((a, b) => a.order - b.order || a.id.localeCompare(b.id));
}

function parseOptions(source) {
  const options = {};
  for (const key of [
    "enabled",
    "group",
    "summary",
    "gridW",
    "gridH",
    "itemLimit",
    "sourceFilter",
    "sourceSort",
    "domainFilter",
    "dataBackground",
    "showHeader",
    "utilityKind",
    "cameraMode",
    "nativeCardType",
    "sourceModule",
  ]) {
    const value = readOption(source, key);
    if (value !== undefined) options[key] = value;
  }
  return options;
}

function readOption(source, key) {
  const pattern = new RegExp(
    `${key}\\s*:\\s*("[^"]*"|'[^']*'|true|false|-?[0-9.]+)`,
  );
  const match = source.match(pattern);
  if (!match) return undefined;
  const raw = match[1];
  if (raw === "true") return true;
  if (raw === "false") return false;
  if (/^-?[0-9.]+$/.test(raw)) return Number(raw);
  return raw.slice(1, -1);
}

export function parseNativeSpecs(source) {
  const specs = [];
  for (const call of parseFunctionCalls(source, "nativeSpec")) {
    const args = splitTopLevelArgs(call);
    if (args.length < 7) continue;
    const [type, label, widgetId, size, layout, binding] = args
      .slice(0, 6)
      .map(readQuotedArg);
    if (!type || !label || !widgetId) continue;
    const sourceTuple = args[6] || "";
    const optionsSource = args[7] || "";
    specs.push({
      type,
      label,
      widgetId,
      size,
      layout,
      binding,
      source: sourceTuple.replace(/\s+/g, " ").trim(),
      custom: /custom\s*:\s*true/.test(optionsSource),
      domains: readArrayOption(optionsSource, "domains"),
      summary: readOption(optionsSource, "summary") || `${label}原生卡`,
    });
  }

  let match;
  const energyPattern = /\[\s*"([^"]+)"\s*,\s*"([^"]+)"\s*\]/g;
  const energySource = source.slice(source.indexOf("function energySpecs()"));
  while ((match = energyPattern.exec(energySource))) {
    const [type, label] = [match[1], match[2]];
    specs.push({
      type,
      label,
      widgetId: `ha-${type}-card`,
      size: "wide",
      layout: "grid",
      binding: "static",
      source: '"energy", ["energy", "power", "electricity", "area"]',
      custom: false,
      domains: [],
      summary: `${label}原生卡`,
    });
  }
  return uniqueBy(specs, (spec) => spec.widgetId);
}

function parseFunctionCalls(source, functionName) {
  const calls = [];
  let index = 0;
  const token = `${functionName}(`;
  while ((index = source.indexOf(token, index)) !== -1) {
    let cursor = index + token.length;
    let depth = 1;
    let inString = "";
    let escaped = false;
    while (cursor < source.length) {
      const char = source[cursor];
      if (inString) {
        if (escaped) escaped = false;
        else if (char === "\\") escaped = true;
        else if (char === inString) inString = "";
      } else if (char === "\"" || char === "'" || char === "`") {
        inString = char;
      } else if (char === "(") {
        depth += 1;
      } else if (char === ")") {
        depth -= 1;
        if (depth === 0) break;
      }
      cursor += 1;
    }
    if (depth === 0) calls.push(source.slice(index + token.length, cursor));
    index = cursor + 1;
  }
  return calls;
}

function splitTopLevelArgs(source) {
  const args = [];
  let start = 0;
  let depth = 0;
  let inString = "";
  let escaped = false;
  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    if (inString) {
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === inString) inString = "";
      continue;
    }
    if (char === "\"" || char === "'" || char === "`") {
      inString = char;
      continue;
    }
    if (char === "[" || char === "{" || char === "(") depth += 1;
    else if (char === "]" || char === "}" || char === ")") depth -= 1;
    else if (char === "," && depth === 0) {
      args.push(source.slice(start, index).trim());
      start = index + 1;
    }
  }
  args.push(source.slice(start).trim());
  return args;
}

function readQuotedArg(source) {
  const match = String(source || "")
    .trim()
    .match(/^["']([^"']*)["']$/);
  return match ? match[1] : "";
}

function readArrayOption(source, key) {
  const match = source.match(new RegExp(`${key}\\s*:\\s*\\[([^\\]]*)\\]`));
  if (!match) return [];
  return [...match[1].matchAll(/"([^"]+)"/g)].map((item) => item[1]);
}
