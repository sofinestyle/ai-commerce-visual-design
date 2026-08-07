import type { OutputLanguage, OutputLanguageCode, Platform } from "@/lib/ai-workspace/types";

export const outputLanguages: OutputLanguage[] = [
  {
    code: "zh-CN",
    label: "中文",
    promptName: "Simplified Chinese",
    visibleTextInstruction:
      "Visible text in the generated image must be in Simplified Chinese. Do not use English, Japanese, Spanish, or French text unless explicitly requested.",
  },
  {
    code: "en",
    label: "英文",
    promptName: "English",
    visibleTextInstruction:
      "Visible text in the generated image must be in English. Do not use Chinese, Japanese, Spanish, or French text unless explicitly requested.",
  },
  {
    code: "ja",
    label: "日文",
    promptName: "Japanese",
    visibleTextInstruction:
      "Visible text in the generated image must be in Japanese. Do not use Chinese, English, Spanish, or French text unless explicitly requested.",
  },
  {
    code: "es",
    label: "西班牙语",
    promptName: "Spanish",
    visibleTextInstruction:
      "Visible text in the generated image must be in Spanish. Do not use Chinese, English, Japanese, or French text unless explicitly requested.",
  },
  {
    code: "fr",
    label: "法语",
    promptName: "French",
    visibleTextInstruction:
      "Visible text in the generated image must be in French. Do not use Chinese, English, Japanese, or Spanish text unless explicitly requested.",
  },
];

const defaultLanguageByPlatform: Record<Platform, OutputLanguageCode> = {
  Amazon: "en",
  TEMU: "en",
  SHEIN: "en",
  天猫: "zh-CN",
  抖店: "zh-CN",
  独立站: "en",
};

export function getOutputLanguage(code: OutputLanguageCode) {
  return outputLanguages.find((language) => language.code === code) ?? outputLanguages[1];
}

export function getDefaultOutputLanguage(platform: Platform) {
  return getOutputLanguage(defaultLanguageByPlatform[platform]);
}

export function getLanguageTextPolicy(language: OutputLanguage) {
  return [
    language.visibleTextInstruction,
    "If the selected Visual SOP rule forbids copy, text, logo, or visible wording, do not add visible text even if an output language is selected.",
    `If visible text is appropriate for this image type and theme, use ${language.promptName}. Avoid mixing languages unless the user explicitly requests it.`,
  ].join(" ");
}
