export { EN } from "./translations-en";
export { ZH } from "./translations-zh";

export type TranslationKey = keyof typeof import("./translations-en").EN;
