import { buildGenerationChainDraft } from "@/lib/ai-workspace/generation-chain";
import type { GenerationRequest } from "@/lib/ai-workspace/generation-protocol";
import { validateGenerationHistoryConsistency } from "@/lib/ai-workspace/generationHistoryConsistency";
import { reviewGeneratedImages } from "@/lib/ai-workspace/generatedImageQualityReview";
import { outputLanguages } from "@/lib/ai-workspace/languageMap";
import { legacyGenerateRequestToGenerationRequest } from "@/lib/ai-workspace/legacy-generation-adapter";
import { buildVisibleCopyInstruction } from "@/lib/ai-workspace/visibleCopyPolicy";
import { normalizeReferenceImagesInput } from "@/lib/aiProviders/referenceImageInput";
import { generateBasePrompt } from "@/lib/promptEngine/pipeline";
import { imageTypeRules, platformRules } from "@/lib/promptEngine/rules";
import type {
  ImageTypeRule,
  PlatformRule,
  ProductProfile,
} from "@/lib/promptEngine/types";
import { aiGenerationService } from "@/lib/services/aiGenerationService";
import { mediaService } from "@/lib/services/mediaService";
import { productService } from "@/lib/services/productService";
import { projectService } from "@/lib/services/projectService";
import type { Product } from "@prisma/client";

type RequestProduct = {
  id?: unknown;
  projectId?: unknown;
  name?: unknown;
  sku?: unknown;
};

type CustomRequirements = {
  background?: unknown;
  environment?: unknown;
  subject?: unknown;
  style?: unknown;
  extra?: unknown;
};

type RequestOutputSpecification = {
  outputSize?: unknown;
  aspectRatio?: unknown;
};

type RequestVisualRule = {
  ruleId?: unknown;
  theme?: unknown;
  designObjective?: unknown;
};

type LegacyGenerationMetadata = {
  batchId?: string;
  mediaId?: string;
  projectId?: string;
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function isGenerationRequest(value: unknown): value is GenerationRequest {
  if (!isRecord(value)) {
    return false;
  }

  return (
    readString(value.taskType) !== "" &&
    isRecord(value.productFacts) &&
    isRecord(value.visualRule) &&
    isRecord(value.prompt) &&
    isRecord(value.output) &&
    isRecord(value.model) &&
    isRecord(value.context)
  );
}

function readRequestProduct(value: unknown): RequestProduct {
  if (!value || typeof value !== "object") {
    return {};
  }

  return value as RequestProduct;
}

function readLegacyMetadata(body: Record<string, unknown>) {
  const product = readRequestProduct(body.product);

  return {
    batchId: readString(body.batchId) || undefined,
    mediaId: readString(body.mediaId) || undefined,
    projectId: readString(product.projectId) || readString(body.projectId) || undefined,
  };
}

function readWorkspaceGenerationRequest(body: unknown) {
  if (isGenerationRequest(body)) {
    return body;
  }

  if (!isRecord(body)) {
    throw new Error("GenerationRequest is required.");
  }

  if (isGenerationRequest(body.generationRequest)) {
    return body.generationRequest;
  }

  throw new Error("GenerationRequest is required.");
}

function normalizeLegacyGenerateInput(body: unknown): {
  generationRequest: GenerationRequest;
  legacyMetadata: LegacyGenerationMetadata;
} {
  if (isGenerationRequest(body)) {
    return {
      generationRequest: body,
      legacyMetadata: {},
    };
  }

  if (!isRecord(body)) {
    throw new Error("GenerationRequest is required.");
  }

  if (isGenerationRequest(body.generationRequest)) {
    return {
      generationRequest: body.generationRequest,
      legacyMetadata: readLegacyMetadata(body),
    };
  }

  return {
    generationRequest: legacyGenerateRequestToGenerationRequest(body),
    legacyMetadata: readLegacyMetadata(body),
  };
}

function buildLanguageSuffix(language: string) {
  const languageRules: Record<string, string> = {
    中文: "include Chinese text",
    英文: "use English text",
    English: "use English text",
    日文: "include Japanese text",
    日语: "include Japanese text",
    西班牙语: "include Spanish text",
    法语: "include French text",
    韩语: "include Korean text",
  };

  return languageRules[language] || "";
}

function buildCustomRequirementPriority(customRequirements: CustomRequirements) {
  const extraRequirements = Array.isArray(customRequirements.extra)
    ? customRequirements.extra.filter((value): value is string => typeof value === "string")
    : [];
  const requirements = [
    readString(customRequirements.subject),
    readString(customRequirements.background),
    readString(customRequirements.environment),
    readString(customRequirements.style),
    ...extraRequirements.map((requirement) => requirement.trim()),
  ].filter(Boolean);

  if (requirements.length === 0) {
    return "";
  }

  return `Primary user requirement, must be clearly visible in the generated image: ${requirements.join("; ")}`;
}

function ensurePromptIncludesCustomRequirement(
  prompt: string,
  customRequirements: CustomRequirements,
) {
  const priorityRequirement = buildCustomRequirementPriority(customRequirements);

  if (!priorityRequirement) {
    return prompt;
  }

  return [prompt, priorityRequirement].filter(Boolean).join(". ").slice(0, 1200);
}

function sanitizePromptForImageGeneration(prompt: string) {
  if (
    prompt.includes("Task:") &&
    prompt.includes("Product Accuracy:") &&
    prompt.includes("Effective Scene Direction:") &&
    prompt.includes("Visible Copy:") &&
    prompt.includes("Compliance Constraints:")
  ) {
    return prompt.replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
  }

  const normalizedPrompt = prompt
    .replace(/Reference style images provided for visual guidance/gi, "")
    .replace(/Style Influence:/gi, "Style guidance:")
    .replace(/keep SKU identity and platform rules as stronger constraints/gi, "")
    .replace(/Do not[^.。]*(\.|。)/gi, "")
    .replace(/Negative Prompt:[^.。]*(\.|。)/gi, "")
    .replace(/\s+/g, " ")
    .trim();

  const sentences = normalizedPrompt
    .split(/(?<=[.。])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
  const preferredSentences = sentences.filter(
    (sentence) =>
      !sentence.toLowerCase().includes("reference") &&
      !sentence.toLowerCase().includes("constraint") &&
      !sentence.toLowerCase().includes("negative"),
  );
  const compactPrompt = (preferredSentences.length > 0 ? preferredSentences : sentences)
    .slice(0, 5)
    .join(" ");

  return compactPrompt.slice(0, 900) || prompt.slice(0, 900);
}

function appendPromptSuffix(prompt: string, suffix: string) {
  return [prompt.trim(), suffix.trim()].filter(Boolean).join(". ");
}

function promptAlreadyCarriesVisibleCopyPolicy(prompt: string) {
  return (
    prompt.includes("Visible Copy:") ||
    /approved visible copy/i.test(prompt) ||
    /Do not render visible marketing copy/i.test(prompt)
  );
}

function summarizeGenerationRequest(request: GenerationRequest) {
  return {
    context: {
      generationContextId: request.context.generationContextId || null,
      sourcePage: request.context.sourcePage,
      visibleCopy: request.context.visibleCopy ?? null,
    },
    model: {
      imageModel: request.model.imageModel || null,
      quality: request.model.quality || null,
    },
    output: {
      aspectRatio: request.output.aspectRatio || null,
      imageCount: request.output.imageCount,
      imageType: request.output.imageType,
      language: request.output.language || null,
      platform: request.output.platform,
      size: request.output.size || null,
      theme: request.output.theme,
    },
    prompt: {
      actualPromptModel: request.prompt.actualPromptModel || null,
      fallbackReason: request.prompt.fallbackReason || null,
      promptModel: request.prompt.promptModel || null,
      promptModelLabel: request.prompt.promptModelLabel || null,
      requestedPromptModel: request.prompt.requestedPromptModel || null,
      source: request.prompt.source,
      validation: request.prompt.validation ?? null,
    },
    protocolVersion: "generation-protocol-v1.0",
    referenceImageCount: request.referenceImages.length,
    taskType: request.taskType,
    visualRuleId: request.visualRule.ruleId || null,
  };
}

function summarizePromptObservability(request: GenerationRequest) {
  return {
    actualModel:
      request.prompt.actualPromptModel || request.prompt.promptModel || null,
    fallbackReason: request.prompt.fallbackReason || null,
    label: request.prompt.promptModelLabel || null,
    requestedModel:
      request.prompt.requestedPromptModel || request.prompt.promptModel || null,
    source: request.prompt.source,
    validation: request.prompt.validation ?? null,
  };
}

function buildProtocolCustomRequirements(request: GenerationRequest): CustomRequirements {
  return {
    background: "",
    environment: "",
    subject: request.output.theme,
    style: request.context.designIntent,
    extra: [
      `Platform: ${request.output.platform}`,
      `Image Type: ${request.output.imageType}`,
      `Theme: ${request.output.theme}`,
      request.output.language ? `Output Language: ${request.output.language}` : "",
      `Reference Images: ${request.referenceImages.length}`,
    ].filter(Boolean),
  };
}

function buildProtocolOutputSpecification(
  request: GenerationRequest,
): RequestOutputSpecification {
  return {
    aspectRatio: request.output.aspectRatio,
    outputSize: request.output.size,
  };
}

function buildProtocolVisualRule(request: GenerationRequest): RequestVisualRule {
  return {
    designObjective: request.visualRule.designObjective,
    ruleId: request.visualRule.ruleId,
    theme: request.visualRule.theme,
  };
}

async function findProductForGeneration(request: GenerationRequest) {
  const sku = request.productFacts.sku;
  const name = request.productFacts.name;
  const products = await productService.getAll();

  return (
    products.find((product) => product.sku === sku) ||
    products.find((product) => product.id === sku) ||
    products.find((product) => name && product.name === name) ||
    null
  );
}

function resolvePlatformRule(taskIntent: string): PlatformRule {
  return (
    platformRules.find(
      (platformRule) =>
        platformRule.platform.toLowerCase() === taskIntent.toLowerCase(),
    ) || platformRules[0]
  );
}

function resolveImageTypeRule(imageType: string): ImageTypeRule {
  return (
    imageTypeRules.find((imageTypeRule) => imageTypeRule.imageType === imageType) ||
    imageTypeRules[0]
  );
}

function buildUserRequirement(customRequirements: CustomRequirements) {
  const extraRequirements = Array.isArray(customRequirements.extra)
    ? customRequirements.extra.filter((value): value is string => typeof value === "string")
    : [];

  return [
    readString(customRequirements.subject)
      ? `Subject requirement: ${readString(customRequirements.subject)}`
      : "",
    readString(customRequirements.background)
      ? `Background requirement: ${readString(customRequirements.background)}`
      : "",
    readString(customRequirements.environment)
      ? `Environment requirement: ${readString(customRequirements.environment)}`
      : "",
    readString(customRequirements.style)
      ? `Style requirement: ${readString(customRequirements.style)}`
      : "",
    ...extraRequirements.map((requirement) => `Custom requirement: ${requirement}`),
  ]
    .filter(Boolean)
    .join(". ");
}

function buildStyleSignals(customRequirements: CustomRequirements) {
  const extraRequirements = Array.isArray(customRequirements.extra)
    ? customRequirements.extra.filter((value): value is string => typeof value === "string")
    : [];

  return {
    subject: readString(customRequirements.subject),
    background: readString(customRequirements.background),
    environment: readString(customRequirements.environment),
    style: readString(customRequirements.style),
    extra: extraRequirements,
  };
}

function buildGenerationMetadata(input: {
  imageCount: number;
  imageModel?: string;
  imageType: string;
  outputSpecification: RequestOutputSpecification;
  platform: string;
  referenceImages: ReturnType<typeof normalizeReferenceImagesInput>;
  theme: string;
  visualRule?: RequestVisualRule;
}) {
  return {
    imageCount: input.imageCount,
    imageModel: input.imageModel || null,
    generatedTime: new Date().toISOString(),
    imageType: input.imageType,
    outputSpecification: {
      aspectRatio: readString(input.outputSpecification.aspectRatio) || null,
      outputSize: readString(input.outputSpecification.outputSize) || null,
    },
    platform: input.platform,
    referenceImagesUsed: input.referenceImages.map((image) => ({
      id: image.id,
      source: image.source,
      type: image.type,
      url: image.url,
    })),
    referenceImageCount: input.referenceImages.length,
    theme: input.theme || null,
    visualRule: input.visualRule
      ? {
          designObjective: readString(input.visualRule.designObjective),
          ruleId: readString(input.visualRule.ruleId),
          theme: readString(input.visualRule.theme),
        }
      : null,
  };
}

function buildProductProfile(product: RequestProduct | Product): ProductProfile {
  const productId = readString(product.id);
  const productName = readString(product.name);
  const productSku = readString(product.sku);
  const category = "category" in product ? readString(product.category) : "";
  const description = "description" in product ? product.description : null;
  const tags = "tags" in product ? product.tags : undefined;

  return {
    productId,
    sku: productSku || productName,
    name: productName || productSku,
    categoryId: category,
    category,
    description,
    tags,
    attributes: [],
    confirmedFields: ["name"],
    inferredFields: [],
    missingFields: [],
  };
}

async function executeGenerationRequest(
  generationRequest: GenerationRequest,
  legacyMetadata: LegacyGenerationMetadata = {},
) {
  const productSku = generationRequest.productFacts.sku;
  const taskIntent = generationRequest.output.platform;
  const imageType = generationRequest.output.imageType;
  const customRequirements = buildProtocolCustomRequirements(generationRequest);
  const externalPrompt = generationRequest.prompt.englishPrompt;
  const language = generationRequest.output.language || "";
  const outputLanguage =
    outputLanguages.find(
      (item) =>
        item.code === generationRequest.output.languageCode ||
        item.label === generationRequest.output.language,
    ) ?? outputLanguages[1];
  const referenceImages = normalizeReferenceImagesInput(generationRequest.referenceImages);
  const outputSpecification = buildProtocolOutputSpecification(generationRequest);
  const visualRule = buildProtocolVisualRule(generationRequest);
  const theme = generationRequest.output.theme || readString(visualRule.theme);

  if (!productSku) {
    throw new Error("GenerationRequest.productFacts.sku is required.");
  }

  const storedProduct = await findProductForGeneration(generationRequest);

  if (!storedProduct) {
    throw new Error("GenerationRequest.productFacts.sku does not exist in the database.");
  }

  const fallbackProject = legacyMetadata.projectId ? null : (await projectService.getAll())[0];
  const projectId = legacyMetadata.projectId || fallbackProject?.id || "";

  if (!projectId) {
    throw new Error("projectId is required for media save.");
  }

  if (!taskIntent) {
    throw new Error("taskIntent is required.");
  }

  if (!imageType) {
    throw new Error("imageType is required.");
  }

  const assetSku = storedProduct.sku || productSku || storedProduct.id;
  const platformRule = resolvePlatformRule(taskIntent);
  const imageTypeRule = resolveImageTypeRule(imageType);
  const promptOutput = externalPrompt
    ? { basePrompt: externalPrompt }
    : generateBasePrompt({
        product: buildProductProfile(storedProduct),
        platformRule,
        imageTypeRule,
        userRequirement: buildUserRequirement(customRequirements),
      });
  const sanitizedBasePrompt = sanitizePromptForImageGeneration(promptOutput.basePrompt);
  const generationPrompt = externalPrompt
    ? sanitizedBasePrompt
    : ensurePromptIncludesCustomRequirement(sanitizedBasePrompt, customRequirements);
  const visibleCopySuffix =
    promptAlreadyCarriesVisibleCopyPolicy(generationPrompt)
      ? ""
      : generationRequest.context.visibleCopy === undefined
      ? buildLanguageSuffix(language)
      : buildVisibleCopyInstruction({
          language: outputLanguage,
          visibleCopy: generationRequest.context.visibleCopy,
          visualRule: generationRequest.visualRule,
        });
  const finalPrompt = appendPromptSuffix(generationPrompt, visibleCopySuffix);
  const imageCount = readCount(generationRequest.output.imageCount);
  const imageModel = readString(generationRequest.model.imageModel) || undefined;

  const result = await aiGenerationService.generate({
    projectId,
    productId: storedProduct.id,
    mediaId: legacyMetadata.mediaId,
    prompt: finalPrompt,
    model: imageModel,
    platform: platformRule.id,
    size: readString(outputSpecification.outputSize) || undefined,
    quality: readString(generationRequest.model.quality) || undefined,
    count: imageCount,
    outputSpecification: {
      aspectRatio: readString(outputSpecification.aspectRatio) || undefined,
      outputSize: readString(outputSpecification.outputSize) || undefined,
    },
    referenceImages,
    visualRule: visualRule
      ? {
          designObjective: readString(visualRule.designObjective),
          ruleId: readString(visualRule.ruleId),
          theme: readString(visualRule.theme),
        }
      : undefined,
  });
  const actualImageModel =
    result.images.find((image) => readString(image.model))?.model || imageModel || null;
  const generationMetadata = buildGenerationMetadata({
    imageCount,
    imageModel,
    imageType,
    outputSpecification,
    platform: platformRule.id,
    referenceImages,
    theme,
    visualRule,
  });
  const generationProtocol = summarizeGenerationRequest(generationRequest);
  const promptObservability = summarizePromptObservability(generationRequest);
  const qualityReview = reviewGeneratedImages({
    actualImageModel,
    imageType,
    images: result.images,
    promptValidation: promptObservability.validation,
    productFacts: generationRequest.productFacts,
    referenceImageCount: referenceImages.length,
    requestedImageCount: imageCount,
    requestedImageModel: imageModel || null,
    theme,
    visualRule: generationRequest.visualRule,
  });

  const generationGroupId =
    readString(generationRequest.context.generationContextId) || result.taskId;
  const generatedMedia = await mediaService.saveGeneratedImagesAsDraft({
    projectId,
    productId: storedProduct.id,
    sku: assetSku,
    generationGroupId,
    prompt: finalPrompt,
    styleSignals: {
      ...buildStyleSignals(customRequirements),
      generationMetadata: {
        ...generationMetadata,
        actualImageModel,
        requestedImageModel: imageModel || null,
      },
      generationProtocol,
      modelObservability: {
        actualImageModel,
        requestedImageModel: imageModel || null,
      },
      promptObservability,
      qualityReview,
    },
    platform: platformRule.id,
    imageType,
    batchId: legacyMetadata.batchId || null,
    images: result.images,
  });
  const responseImages = result.images.map((image, index) => ({
    ...image,
    mediaId: generatedMedia[index]?.id,
    mediaStatus:
      generatedMedia[index]?.status === "final"
        ? ("final" as const)
        : ("draft" as const),
    qualityReview,
  }));
  const responseResult = {
    ...result,
    images: responseImages,
    generationGroupId,
  };
  const generationChainDraft = buildGenerationChainDraft({
    generatedMedia,
    generatedResult: responseResult,
    generationRequest,
    productId: storedProduct.id,
    projectId,
    provider: imageModel || result.images[0]?.model || undefined,
  });
  const generationRecord = {
    actualImageModel,
    generatedTime: new Date().toISOString(),
    imageCount,
    imageModel: actualImageModel,
    outputSpecification: {
      aspectRatio: readString(outputSpecification.aspectRatio) || null,
      outputSize: readString(outputSpecification.outputSize) || null,
    },
    platform: platformRule.id,
    prompt: {
      actualModel: promptObservability.actualModel,
      fallbackReason: promptObservability.fallbackReason,
      requestedModel: promptObservability.requestedModel,
      source: promptObservability.source,
      validation: promptObservability.validation,
    },
    promptValidation: promptObservability.validation,
    qualityReview,
    referenceImageCount: referenceImages.length,
    referenceImagesUsed: referenceImages,
    requestedImageModel: imageModel || null,
    theme: theme || null,
    generationProtocol,
    visualRuleId: readString(visualRule?.ruleId) || null,
  };
  const historyConsistency = validateGenerationHistoryConsistency({
    generationChainDraft,
    generationRecord,
    generationResult: responseResult,
    requested: {
      imageCount,
      imageModel: imageModel || null,
      platform: platformRule.id,
      referenceImageCount: referenceImages.length,
      sku: assetSku,
    },
  });

  return {
    ...result,
    images: responseImages,
    generationGroupId,
    generationChainDraft,
    generatedMediaIds: generatedMedia.map((media) => media.id),
    generationRecord,
    historyConsistency,
    archivedMediaIds: generatedMedia.map((media) => media.id),
  };
}

export async function generateFromWorkspaceRequest(body: unknown) {
  return executeGenerationRequest(readWorkspaceGenerationRequest(body));
}

export async function generateFromLegacyCompatibleRequest(body: unknown) {
  const { generationRequest, legacyMetadata } = normalizeLegacyGenerateInput(body);

  return executeGenerationRequest(generationRequest, legacyMetadata);
}
