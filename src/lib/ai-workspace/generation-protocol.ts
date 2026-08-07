import type { PromptValidationResult } from "@/lib/ai-workspace/types";

export type GenerationTaskType = "generate" | "regenerate" | "edit";

export type GenerationSourcePage = "ai-workspace" | "batch" | "history";

export interface GenerationRequest {
  taskType: GenerationTaskType;

  productFacts: {
    sku: string;
    name?: string;
    brand?: string;
    category?: string;
    material?: string;
    color?: string;
    size?: string;
    accessories?: string;
    packaging?: string;
  };

  referenceImages: Array<{
    id?: string;
    url: string;
    type?: string;
    role?: string;
  }>;

  visualRule: {
    ruleId: string;
    theme: string;
    designObjective: string;
    visualSpecification: Record<string, string>;
    mediaGuidance: {
      primary: string[];
      secondary: string[];
    };
    promptGuidance: {
      focus: string[];
      avoid: string[];
    };
  };

  prompt: {
    chineseSummary?: string;
    englishPrompt: string;
    actualPromptModel?: string;
    fallbackReason?: string;
    source: "builder" | "llm";
    promptModel?: string;
    promptModelLabel?: string;
    requestedPromptModel?: string;
    validation?: PromptValidationResult;
  };

  output: {
    platform: string;
    imageType: string;
    theme: string;
    imageCount: number;
    size?: string;
    aspectRatio?: string;
    language?: string;
    languageCode?: string;
  };

  model: {
    imageModel: string;
    quality?: string;
  };

  context: {
    designIntent: string;
    visibleCopy?: {
      enabled: boolean;
      headline?: string;
      subheadline?: string;
      sellingPoints?: string[];
      placementHint?: string;
      source?: "model" | "edited" | "manual";
      model?: string;
      candidateId?: string;
    };
    generationContextId?: string;
    sourcePage: GenerationSourcePage;
  };
}
