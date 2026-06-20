import {
  existsSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { join, resolve } from "node:path";

import { OUTPUT_DIR } from "./paths.mjs";

export function fileExists(path) {
  return existsSync(path);
}

export function readText(path) {
  return fileExists(path) ? readFileSync(path, "utf8") : "";
}

export function writeJson(name, value) {
  writeFileSync(resolve(OUTPUT_DIR, name), `${JSON.stringify(value, null, 2)}\n`);
}

export function writeMarkdown(name, value) {
  writeFileSync(resolve(OUTPUT_DIR, name), `${value}\n`);
}

export function sizeBytes(path) {
  return statSync(path).size;
}

export function walk(root, result = []) {
  if (!fileExists(root)) return result;
  for (const name of readdirSync(root)) {
    if (name === ".DS_Store" || name === "__pycache__") continue;
    const path = join(root, name);
    const stat = statSync(path);
    if (stat.isDirectory()) walk(path, result);
    else result.push(path);
  }
  return result;
}

export function countBy(items, selector) {
  return items.reduce((counts, item) => {
    const key = selector(item);
    counts[key] = (counts[key] || 0) + 1;
    return counts;
  }, {});
}

export function uniqueBy(items, selector) {
  const seen = new Set();
  const result = [];
  for (const item of items) {
    const key = selector(item);
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(item);
  }
  return result;
}
