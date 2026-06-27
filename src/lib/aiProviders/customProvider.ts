import { aiConfig } from "@/lib/aiConfig";
import type { AIImageProvider } from "@/lib/aiProviders/types";

export const customProvider: AIImageProvider = {
  async generateImage() {
    if (!aiConfig.baseUrl || !aiConfig.apiKey) {
      throw new Error(
        "AI_BASE_URL and AI_API_KEY are required when AI_PROVIDER is set to custom.",
      );
    }

    throw new Error("Custom image generation is not implemented yet.");
  },
};
