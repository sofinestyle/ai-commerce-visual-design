import type {
  AIGenerationInput,
  AIGenerationResult,
  AIImageProvider,
} from "@/lib/aiProviders/types";

function generateMockImages(input: AIGenerationInput): AIGenerationResult {
  const count = Math.max(1, input.count ?? 1);
  const timestamp = Date.now();

  return {
    taskId: `mock-task-${timestamp}`,
    status: "Completed",
    images: Array.from({ length: count }, (_, index) => ({
      id: `mock-image-${timestamp}-${index + 1}`,
      url: `/media/mock/generated-${index + 1}.png`,
      prompt: input.prompt,
      model: "mock-image-model",
    })),
  };
}

export const mockProvider: AIImageProvider = {
  async generateImage(input) {
    return generateMockImages(input);
  },
};
