import type { GenerationRequest } from "@/lib/ai-workspace/generation-protocol";

type LegacyReferenceImage = {
  id?: unknown;
  role?: unknown;
  source?: unknown;
  type?: unknown;
  url?: unknown;
};

type LegacyVisualRule = {
  designObjective?: unknown;
  mediaGuidance?: unknown;
  promptGuidance?: unknown;
  ruleId?: unknown;
  theme?: unknown;
  visualSpecification?: unknown;
};

type LegacyGenerateRequest = Record<string, unknown> & {
  customRequirements?: {
    extra?: unknown;
    style?: unknown;
    subject?: unknown;
  };
  generationContextId?: unknown;
  imageCount?: unknown;
  imageType?: unknown;
  language?: unknown;
  model?: unknown;
  outputSpecification?: {
    aspectRatio?: unknown;
    outputSize?: unknown;
  };
  product?: {
    id?: unknown;
    accessories?: unknown;
    brand?: unknown;
    category?: unknown;
    color?: unknown;
    material?: unknown;
    name?: unknown;
    packaging?: unknown;
    projectId?: unknown;
    size?: unknown;
    sku?: unknown;
  };
  prompt?: unknown;
  promptChineseSummary?: unknown;
  promptModel?: unknown;
  promptSource?: unknown;
  quality?: unknown;
  referenceImages?: unknown;
  size?: unknown;
  count?: unknown;
  taskIntent?: unknown;
  theme?: unknown;
  visualRule?: LegacyVisualRule;
};

function readString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function readCount(value: unknown) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return 1;
  }

  return Math.min(5, Math.max(1, Math.floor(value)));
}

function readStringList(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string").map((item) => item.trim()).filter(Boolean)
    : [];
}

function readRecord(value: unknown): Record<string, string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value)
      .map(([key, item]) => [key.trim(), readString(item)])
      .filter(([key, item]) => key && item),
  );
}

function readNestedObject(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function readReferenceImages(value: unknown): GenerationRequest["referenceImages"] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item): LegacyReferenceImage => readNestedObject(item))
    .map((item) => ({
      id: readString(item.id) || undefined,
      role: readString(item.role) || readString(item.source) || readString(item.type) || undefined,
      type: readString(item.type) || undefined,
      url: readString(item.url),
    }))
    .filter((item) => item.url);
}

function readVisualRule(value: LegacyVisualRule | undefined): GenerationRequest["visualRule"] {
  const mediaGuidance = readNestedObject(value?.mediaGuidance);
  const promptGuidance = readNestedObject(value?.promptGuidance);

  return {
    designObjective: readString(value?.designObjective),
    mediaGuidance: {
      primary: readStringList(mediaGuidance.primary),
      secondary: readStringList(mediaGuidance.secondary),
    },
    promptGuidance: {
      avoid: readStringList(promptGuidance.avoid),
      focus: readStringList(promptGuidance.focus),
    },
    ruleId: readString(value?.ruleId),
    theme: readString(value?.theme),
    visualSpecification: readRecord(value?.visualSpecification),
  };
}

function readPromptSource(value: unknown): GenerationRequest["prompt"]["source"] {
  return readString(value) === "llm" ? "llm" : "builder";
}

export function legacyGenerateRequestToGenerationRequest(
  legacyRequest: LegacyGenerateRequest,
): GenerationRequest {
  const product = legacyRequest.product ?? {};
  const customRequirements = legacyRequest.customRequirements ?? {};
  const outputSpecification = legacyRequest.outputSpecification ?? {};
  const visualRule = readVisualRule(legacyRequest.visualRule);
  const theme = readString(legacyRequest.theme) || visualRule.theme;
  const imageCount = readCount(legacyRequest.imageCount ?? legacyRequest.count);

  return {
    context: {
      designIntent: readString(customRequirements.style),
      generationContextId: readString(legacyRequest.generationContextId) || undefined,
      sourcePage: "ai-workspace",
    },
    model: {
      imageModel: readString(legacyRequest.model),
      quality: readString(legacyRequest.quality) || undefined,
    },
    output: {
      aspectRatio: readString(outputSpecification.aspectRatio) || undefined,
      imageCount,
      imageType: readString(legacyRequest.imageType),
      language: readString(legacyRequest.language) || undefined,
      platform: readString(legacyRequest.taskIntent),
      size: readString(legacyRequest.size) || readString(outputSpecification.outputSize) || undefined,
      theme,
    },
    productFacts: {
      accessories: readString(product.accessories) || undefined,
      brand: readString(product.brand) || undefined,
      category: readString(product.category) || undefined,
      color: readString(product.color) || undefined,
      material: readString(product.material) || undefined,
      name: readString(product.name) || undefined,
      packaging: readString(product.packaging) || undefined,
      size: readString(product.size) || undefined,
      sku: readString(product.sku) || readString(product.name) || readString(product.id),
    },
    prompt: {
      chineseSummary: readString(legacyRequest.promptChineseSummary) || undefined,
      englishPrompt: readString(legacyRequest.prompt),
      promptModel: readString(legacyRequest.promptModel) || undefined,
      source: readPromptSource(legacyRequest.promptSource),
    },
    referenceImages: readReferenceImages(legacyRequest.referenceImages),
    taskType: "generate",
    visualRule,
  };
}
