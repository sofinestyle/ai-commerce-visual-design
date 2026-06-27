import { aiConfig } from "@/lib/aiConfig";
import type { AIImageProvider } from "@/lib/aiProviders/types";

export const openaiProvider: AIImageProvider = {
  async generateImage() {
    if (!aiConfig.openaiApiKey) {
      throw new Error(
        "OPENAI_API_KEY is required when AI_PROVIDER is set to openai.",
      );
    }

    throw new Error("OpenAI image generation is not implemented yet.");
  },
};
