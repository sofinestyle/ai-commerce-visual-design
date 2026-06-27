export type AIProvider = "mock" | "dmxapi" | "openai" | "custom";

function readAIProvider(value: string | undefined): AIProvider {
  if (value === "dmxapi" || value === "openai" || value === "custom") {
    return value;
  }

  return "mock";
}

export const aiConfig = {
  provider: readAIProvider(process.env.AI_PROVIDER),
  baseUrl: process.env.AI_BASE_URL?.trim() || "",
  apiKey: process.env.AI_API_KEY?.trim() || "",
  imageModel: process.env.AI_IMAGE_MODEL?.trim() || "gpt-image-1",
  openaiApiKey: process.env.OPENAI_API_KEY?.trim() || "",
} as const;
