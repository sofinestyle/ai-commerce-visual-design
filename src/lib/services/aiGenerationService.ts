import { providerFactory } from "@/lib/aiProviders/providerFactory";
import type {
  AIGeneratedImage,
  AIGenerationInput,
  AIGenerationResult,
} from "@/lib/aiProviders/types";

export type { AIGeneratedImage, AIGenerationInput, AIGenerationResult };

export const aiGenerationService = {
  async generate(input: AIGenerationInput): Promise<AIGenerationResult> {
    const provider = providerFactory.getProvider();

    return provider.generateImage(input);
  },
};
