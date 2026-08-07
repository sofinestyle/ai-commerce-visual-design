export const defaultModelConfig = {
  imageModel: "gpt-image-2-03",
  promptModel: "gpt-5.6-terra",
  visionModel: "gpt-5.4-mini",
} as const;

export const fallbackImageModels = [
  defaultModelConfig.imageModel,
  "gpt-image-2",
  "gemini-2.5-flash-image",
  "gemini-3-pro-image",
  "gemini-3.1-flash-image",
] as const;

export const hiddenImageModels = [
  "doubao-seedream-3-0-t2i-250415",
  "doubao-seedream-4-0-250828",
  "gemini-3.5-flash",
  "gpt-image-1",
  "gpt-image-1.5",
  "qwen-image",
  "qwen-image-edit",
] as const;

export const fallbackPromptModels = [
  defaultModelConfig.promptModel,
  "gpt-5.5",
  "gpt-5.5-ssvip",
  "gemini-3.5-flash",
  "gemini-3.5-flash-ssvip",
  "doubao-seed-2-1-pro-260628",
] as const;

export const fallbackVisionModels = [
  "gpt-5.5",
  "gpt-5.4",
  defaultModelConfig.visionModel,
  "gpt-4.1",
  "gemini-3.5-flash",
  "gemini-3.1-flash-lite",
] as const;
