import type { GenerationRequest } from "@/lib/ai-workspace/generation-protocol";
import type {
  GenerationContext,
  GenerationResult,
  PromptResult,
} from "@/lib/ai-workspace/types";

type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

export async function generateImageFromWorkspace(input: {
  context: GenerationContext;
  prompt: PromptResult;
  imageModel: string;
  quality: string;
}) {
  const generationRequest: GenerationRequest = {
    context: {
      designIntent: input.context.designIntent,
      visibleCopy: input.context.visibleCopy,
      generationContextId: `${input.context.productFacts.sku}-${input.context.platform}-${input.context.imageType}-${input.context.theme}`,
      sourcePage: "ai-workspace",
    },
    model: {
      imageModel: input.imageModel,
      quality: input.quality,
    },
    output: {
      aspectRatio: input.context.outputSpecification.aspectRatio,
      imageCount: input.context.outputSpecification.imageCount,
      imageType: input.context.imageType,
      language: input.context.language.label,
      languageCode: input.context.language.code,
      platform: input.context.platform,
      size: input.context.outputSpecification.outputSize,
      theme: input.context.theme,
    },
    productFacts: {
      accessories: input.context.productFacts.accessories,
      brand: input.context.productFacts.brand,
      category: input.context.productFacts.category,
      color: input.context.productFacts.color,
      material: input.context.productFacts.material,
      name: input.context.productFacts.name,
      packaging: input.context.productFacts.packaging,
      size: input.context.productFacts.size,
      sku: input.context.productFacts.sku,
    },
    prompt: {
      actualPromptModel: input.prompt.apiModel || input.prompt.promptModel,
      chineseSummary: input.prompt.chinesePromptSummary,
      englishPrompt: input.prompt.englishPrompt,
      fallbackReason: input.prompt.fallbackReason,
      promptModel: input.prompt.promptModel || input.prompt.apiModel,
      promptModelLabel: input.prompt.promptModelLabel,
      requestedPromptModel: input.prompt.promptModel,
      source: input.prompt.source === "model" ? "llm" : "builder",
      validation: input.prompt.promptValidation,
    },
    referenceImages: input.context.referenceImages.map((image) => ({
      id: image.id,
      role: "primary",
      type: image.type,
      url: image.url,
    })),
    taskType: "generate",
    visualRule: input.context.visualRule,
  };
  const response = await fetch("/api/ai-workspace/generate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(generationRequest),
  });
  const payload = (await response.json()) as ApiResponse<GenerationResult>;

  if (!response.ok || !payload.success || !payload.data) {
    throw new Error(payload.error || "图片生成失败。");
  }

  return payload.data;
}

export async function editImageFromWorkspace(input: {
  context: GenerationContext;
  currentImage: {
    id: string;
    url: string;
  };
  editIntent: string;
  editReferenceImages?: Array<{
    id: string;
    type?: string;
    url: string;
  }>;
  editSessionId: string;
  editTurns: Array<{
    editIntent: string;
    resultImageUrl?: string;
  }>;
  generationGroupId?: string;
  imageModel: string;
  originalPrompt?: string;
  parentImageId: string;
  preserveExistingText?: boolean;
  providerHistory: Array<{
    assistantImageUrl?: string;
    role: "user" | "model";
    text?: string;
  }>;
  quality: string;
  revisionMode?: "local_edit";
}) {
  const response = await fetch("/api/ai-workspace/edit-image", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      currentImage: {
        id: input.currentImage.id,
        source: "generated-result",
        type: "current-edit-image",
        url: input.currentImage.url,
      },
      designIntent: input.context.designIntent,
      editIntent: input.editIntent,
      editReferenceImages: input.editReferenceImages ?? [],
      editSessionId: input.editSessionId,
      editTurns: input.editTurns,
      generationGroupId: input.generationGroupId,
      imageModel: input.imageModel,
      model: input.imageModel,
      originalPrompt: input.originalPrompt,
      parentImageId: input.parentImageId,
      platform: input.context.platform,
      productFacts: input.context.productFacts,
      projectId: "",
      preserveExistingText: input.preserveExistingText ?? true,
      providerHistory: input.providerHistory,
      quality: input.quality,
      revisionMode: input.revisionMode ?? "local_edit",
      size: input.context.outputSpecification.outputSize,
      visualRule: input.context.visualRule,
    }),
  });
  const payload = (await response.json()) as ApiResponse<GenerationResult>;

  if (!response.ok || !payload.success || !payload.data) {
    throw new Error(payload.error || "局部修改失败。");
  }

  return payload.data;
}
