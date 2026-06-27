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

export type AIImageProvider = {
  generateImage(input: AIGenerationInput): Promise<AIGenerationResult>;
};
