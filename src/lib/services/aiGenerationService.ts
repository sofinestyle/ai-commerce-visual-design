export type AIGenerationInput = {
  projectId: string;
  productId: string;
  mediaId?: string;
  prompt: string;
  model?: string;
  platform?: string;
  size?: string;
  quality?: string;
  count?: number;
};

export type AIGeneratedImage = {
  id: string;
  url: string;
  prompt: string;
  model: string;
};

export type AIGenerationResult = {
  taskId: string;
  status: "Completed";
  images: AIGeneratedImage[];
};

export const aiGenerationService = {
  async generate(input: AIGenerationInput): Promise<AIGenerationResult> {
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
  },
};
