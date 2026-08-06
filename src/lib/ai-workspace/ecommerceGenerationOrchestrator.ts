import { buildGenerationContext, normalizeProductFacts } from "@/lib/ai-workspace/contextBuilder";
import { generateFromWorkspaceRequest } from "@/lib/ai-workspace/aiWorkspaceGenerationService";
import { generateWorkspaceImageCopyCandidates } from "@/lib/ai-workspace/imageCopyGenerationService";
import { getDefaultOutputLanguage } from "@/lib/ai-workspace/languageMap";
import { getRecommendedOutputSpec } from "@/lib/ai-workspace/outputSpecMap";
import { generateWorkspacePromptCandidates } from "@/lib/ai-workspace/promptGenerationService";
import {
  findBrandLogoReferenceImage,
  selectReferenceImagesForTask,
  type ReferenceImageCandidate,
} from "@/lib/ai-workspace/referenceImageSelector";
import { normalizeReferenceImageRole } from "@/lib/ai-workspace/referenceImageRules";
import { loadVisualRule } from "@/lib/ai-workspace/visualSopLoader";
import { defaultModelConfig } from "@/lib/modelDefaults";
import { brandService } from "@/lib/services/brandService";
import { mediaService } from "@/lib/services/mediaService";
import { productService } from "@/lib/services/productService";
import type {
  ImageCopyCandidate,
  ImageType,
  Platform,
  ReferenceImage,
  VisibleCopy,
} from "@/lib/ai-workspace/types";

type EcommerceGenerationMode = "plan_only" | "generate" | "plan_then_generate";
type EcommerceCopyMode = "auto" | "user_confirmed" | "none";
type BrandLogoMode = "auto" | "required" | "forbidden";

export type EcommerceGenerationRequest = {
  source?: "codex" | "web" | "cli";
  mode?: EcommerceGenerationMode;
  sku?: string;
  platform?: Platform;
  imageType?: ImageType;
  theme?: string;
  imageCount?: number;
  scene?: string;
  subject?: string;
  sellingAngle?: string;
  designIntent?: string;
  brandLogoMode?: BrandLogoMode;
  copyMode?: EcommerceCopyMode;
  confirmedCopy?: {
    headline?: string;
    subheadline?: string;
    sellingPoints?: string[];
  };
  promotion?: {
    intent?: string;
    verifiedOffer?: string;
  };
  textModel?: string;
  imageModel?: string;
  options?: {
    returnCopyCandidates?: boolean;
    returnPrompt?: boolean;
  };
};

export type EcommerceGenerationNeedsInputResult = {
  status: "needs_input";
  missingFields: string[];
  questions: string[];
};

type EcommerceGenerationResolvedPlan = {
  designIntent: string;
  imageType: ImageType;
  imageCount: number;
  platform: Platform;
  selectedReferences: ReferenceImage[];
  sku: string;
  subject: string;
  theme: string;
};

function readString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function readImageCount(value: unknown) {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.min(Math.max(Math.floor(value), 1), 6)
    : 0;
}

function unique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

function isPlatform(value: unknown): value is Platform {
  return ["Amazon", "TEMU", "SHEIN", "天猫", "抖店", "独立站"].includes(String(value));
}

function isImageType(value: unknown): value is ImageType {
  return value === "主图" || value === "详情页";
}

function normalizeMode(value: unknown): EcommerceGenerationMode {
  return value === "plan_only" || value === "plan_then_generate" || value === "generate"
    ? value
    : "generate";
}

function normalizeCopyMode(value: unknown): EcommerceCopyMode {
  return value === "user_confirmed" || value === "none" || value === "auto" ? value : "auto";
}

function normalizeLogoMode(value: unknown): BrandLogoMode {
  return value === "required" || value === "forbidden" || value === "auto" ? value : "auto";
}

function containsClaimSensitivePromotion(input: EcommerceGenerationRequest) {
  const text = [
    input.sellingAngle,
    input.designIntent,
    input.promotion?.intent,
    input.confirmedCopy?.headline,
    input.confirmedCopy?.subheadline,
    ...(input.confirmedCopy?.sellingPoints ?? []),
  ]
    .map(readString)
    .join(" ");

  return /限时|促销|折扣|打折|优惠|降价|秒杀|特价|limited\s*time|sale|discount|deal|off\b/i.test(text);
}

function roleFromCandidate(candidate: ReferenceImageCandidate) {
  const directRole = normalizeReferenceImageRole(candidate.type);

  if (directRole) {
    return directRole;
  }

  if (Array.isArray(candidate.tags)) {
    for (const tag of candidate.tags) {
      if (typeof tag !== "string") {
        continue;
      }

      const [, rawValue] = tag.split(":");
      const role = normalizeReferenceImageRole(rawValue || tag);

      if (role) {
        return role;
      }
    }
  }

  return null;
}

function hasVerifiedProductBodyReference(candidates: ReferenceImageCandidate[]) {
  const productBodyRoles = new Set(["front", "back", "side", "detail"]);

  return candidates.some((candidate) => {
    const role = roleFromCandidate(candidate);

    return (
      candidate.url &&
      candidate.source !== "AI" &&
      candidate.source !== "brand_asset" &&
      Boolean(role && productBodyRoles.has(role))
    );
  });
}

function toReferenceCandidate(media: Awaited<ReturnType<typeof mediaService.getAll>>[number]) {
  const url = media.previewImage || media.thumbnail || media.storagePath;

  return {
    filename: media.filename,
    id: media.id,
    mimeType: media.mimeType,
    qualityScore: media.qualityScore,
    source: media.source,
    status: media.status,
    tags: media.tags,
    type: media.imageType || media.type,
    url,
  } satisfies ReferenceImageCandidate;
}

function buildNeedsInput(missingFields: string[]) {
  const questionsByField: Record<string, string> = {
    imageCount: "请提供需要制作的图片数量。",
    imageType: "请确认图片类型，例如主图或详情页。",
    brandLogoReference: "未找到可用品牌 Logo 参考图，请先补充 Logo 素材，或确认不展示 Logo。",
    platform: "请确认使用平台，例如 Amazon、TEMU、SHEIN、天猫、抖店或独立站。",
    promotionFacts: "请提供已验证的促销事实，例如具体活动名称、折扣、价格或截止时间；也可以确认移除促销/限时表述。",
    sku: "请提供准确的产品编号/SKU。",
    skuNotFound: "未找到该产品编号，请确认 SKU 是否正确或先在产品库中创建该产品。",
    verifiedProductReference: "未找到该 SKU 的可用实拍/白底/细节参考图，请先补充产品参考图。",
  };

  return {
    missingFields: unique(missingFields),
    questions: unique(missingFields.map((field) => questionsByField[field] || `请补充 ${field}。`)),
    status: "needs_input" as const,
  };
}

async function validateRequiredFacts(request: EcommerceGenerationRequest) {
  const missingFields: string[] = [];
  const sku = readString(request.sku);
  const imageCount = readImageCount(request.imageCount);
  const platform = request.platform;
  const imageType = request.imageType;

  if (!sku) {
    missingFields.push("sku");
  }

  if (!isPlatform(platform)) {
    missingFields.push("platform");
  }

  if (!isImageType(imageType)) {
    missingFields.push("imageType");
  }

  if (!imageCount) {
    missingFields.push("imageCount");
  }

  if (containsClaimSensitivePromotion(request) && !readString(request.promotion?.verifiedOffer)) {
    missingFields.push("promotionFacts");
  }

  if (missingFields.length > 0) {
    return {
      needsInput: buildNeedsInput(missingFields),
      product: null,
    };
  }

  const product = await productService.getBySku(sku);

  if (!product) {
    return {
      needsInput: buildNeedsInput(["skuNotFound"]),
      product: null,
    };
  }

  return {
    needsInput: null,
    product,
  };
}

function buildDesignIntent(input: {
  brandLogoMode: BrandLogoMode;
  request: EcommerceGenerationRequest;
}) {
  const parts = [
    readString(input.request.designIntent),
    readString(input.request.scene) ? `场景：${readString(input.request.scene)}` : "",
    readString(input.request.subject) ? `主体：${readString(input.request.subject)}` : "",
    readString(input.request.sellingAngle)
      ? `卖点方向：${readString(input.request.sellingAngle)}`
      : "",
    readString(input.request.promotion?.verifiedOffer)
      ? `已验证促销事实：${readString(input.request.promotion?.verifiedOffer)}`
      : "",
    input.brandLogoMode === "required" ? "必须展示品牌 Logo，并使用已验证 Logo 参考图。" : "",
    input.brandLogoMode === "forbidden" ? "不要展示 Logo、品牌字样或品牌标识。" : "",
  ].filter(Boolean);

  return parts.join("\n") || "电商主图设计，突出商品识别度、真实产品比例和购买理由。";
}

function selectBestCopyCandidate(candidates: ImageCopyCandidate[]) {
  return [...candidates].sort(
    (left, right) => (right.qualityScore ?? 0) - (left.qualityScore ?? 0),
  )[0];
}

function buildVisibleCopyFromCandidate(candidate: ImageCopyCandidate): VisibleCopy {
  return {
    candidateId: candidate.id,
    enabled: true,
    headline: candidate.headline,
    model: candidate.model,
    placementHint: candidate.placementHint,
    sellingPoints: candidate.sellingPoints,
    source: "model",
    subheadline: candidate.subheadline,
  };
}

function buildVisibleCopyFromConfirmed(
  confirmedCopy: EcommerceGenerationRequest["confirmedCopy"],
): VisibleCopy {
  return {
    enabled: true,
    headline: readString(confirmedCopy?.headline) || undefined,
    sellingPoints: confirmedCopy?.sellingPoints?.map(readString).filter(Boolean),
    source: "manual",
    subheadline: readString(confirmedCopy?.subheadline) || undefined,
  };
}

async function resolvePlan(request: EcommerceGenerationRequest) {
  const validation = await validateRequiredFacts(request);

  if (validation.needsInput || !validation.product) {
    return validation.needsInput;
  }

  const platform = request.platform as Platform;
  const imageType = request.imageType as ImageType;
  const imageCount = readImageCount(request.imageCount);
  const theme = readString(request.theme) || "产品图";
  const brandLogoMode = normalizeLogoMode(request.brandLogoMode);
  const brand = await brandService.getById(validation.product.brandId);
  const productFacts = normalizeProductFacts({
    ...validation.product,
    brandName: brand?.name,
  });
  const visualRule = await loadVisualRule({ imageType, platform, theme });
  const productMedia = (await mediaService.getBySku(validation.product.sku)).map(toReferenceCandidate);
  const brandMedia = brand
    ? (await mediaService.getAll({ search: brand.name })).map(toReferenceCandidate)
    : [];
  const candidateMap = new Map<string, ReferenceImageCandidate>();

  for (const candidate of [...productMedia, ...brandMedia]) {
    if (candidate.url) {
      candidateMap.set(candidate.id, candidate);
    }
  }

  let candidates = [...candidateMap.values()];

  if (brandLogoMode === "forbidden") {
    candidates = candidates.filter((candidate) => roleFromCandidate(candidate) !== "brand_logo");
  }

  if (!hasVerifiedProductBodyReference(candidates)) {
    return buildNeedsInput(["verifiedProductReference"]);
  }

  const selection = selectReferenceImagesForTask({
    candidates,
    imageType,
    theme,
    visualRule,
  });
  const selected = [...selection.images];

  if (brandLogoMode === "required" && !selected.some((item) => roleFromCandidate(item) === "brand_logo")) {
    const logo = findBrandLogoReferenceImage(candidates);

    if (!logo) {
      return buildNeedsInput(["brandLogoReference"]);
    }

    selected.push(logo);
  }

  if (selected.length === 0 || selected.length < selection.requiredCount) {
    return buildNeedsInput(["verifiedProductReference"]);
  }

  const language = getDefaultOutputLanguage(platform);
  const outputSpecification = getRecommendedOutputSpec(platform, imageType);
  const designIntent = buildDesignIntent({ brandLogoMode, request });
  const baseContext = buildGenerationContext({
    designIntent,
    imageCount,
    imageType,
    language,
    platform,
    productFacts,
    referenceImages: selected,
    theme,
    visualRule,
    outputSpecification,
  });
  const copyMode = normalizeCopyMode(request.copyMode);
  let visibleCopy: VisibleCopy | undefined;
  let copyCandidates: ImageCopyCandidate[] | undefined;

  if (copyMode === "none") {
    visibleCopy = { enabled: false };
  } else if (copyMode === "user_confirmed") {
    visibleCopy = buildVisibleCopyFromConfirmed(request.confirmedCopy);
  } else {
    const copyResult = await generateWorkspaceImageCopyCandidates({
      generationContext: baseContext,
      marketingPositioningOverride: request.sellingAngle,
      promptModel: readString(request.textModel) || "gpt-5.6-terra",
    });
    const selectedCopy = selectBestCopyCandidate(copyResult.candidates);

    copyCandidates = copyResult.candidates;
    visibleCopy = selectedCopy ? buildVisibleCopyFromCandidate(selectedCopy) : undefined;
  }

  const generationContext = buildGenerationContext({
    designIntent,
    imageCount,
    imageType,
    language,
    platform,
    productFacts,
    referenceImages: selected,
    theme,
    visibleCopy,
    visualRule,
    outputSpecification,
  });
  const prompts = await generateWorkspacePromptCandidates({
    generationContext,
    promptModels: [readString(request.textModel) || "gpt-5.6-terra"],
  });
  const prompt = prompts[0];
  const generationGroupId = `codex-${productFacts.sku}-${platform}-${theme}-${Date.now()}`;
  const resolvedPlan: EcommerceGenerationResolvedPlan = {
    designIntent,
    imageCount,
    imageType,
    platform,
    selectedReferences: selected,
    sku: productFacts.sku,
    subject: readString(request.subject),
    theme,
  };

  return {
    copy: {
      candidates: request.options?.returnCopyCandidates ? copyCandidates : undefined,
      mode: copyMode,
      selected: visibleCopy,
    },
    generationContext,
    generationGroupId,
    models: {
      actualTextModel: prompt.promptModel || readString(request.textModel) || "gpt-5.6-terra",
      requestedImageModel: readString(request.imageModel) || defaultModelConfig.imageModel,
      requestedTextModel: readString(request.textModel) || "gpt-5.6-terra",
    },
    plan: resolvedPlan,
    prompt,
    productFacts,
    status: "planned" as const,
    visualRule,
  };
}

export async function runEcommerceImageGeneration(request: EcommerceGenerationRequest) {
  const mode = normalizeMode(request.mode);
  const resolved = await resolvePlan(request);

  if (resolved.status === "needs_input") {
    return resolved;
  }

  if (mode === "plan_only") {
    return resolved;
  }

  const imageModel = readString(request.imageModel) || defaultModelConfig.imageModel;
  const result = await generateFromWorkspaceRequest({
    generationRequest: {
      context: {
        designIntent: resolved.plan.designIntent,
        generationContextId: resolved.generationGroupId,
        sourcePage: "ai-workspace",
        visibleCopy: resolved.generationContext.visibleCopy,
      },
      model: {
        imageModel,
      },
      output: {
        aspectRatio: resolved.generationContext.outputSpecification.aspectRatio,
        imageCount: resolved.plan.imageCount,
        imageType: resolved.plan.imageType,
        language: resolved.generationContext.language.label,
        languageCode: resolved.generationContext.language.code,
        platform: resolved.plan.platform,
        size: resolved.generationContext.outputSpecification.outputSize,
        theme: resolved.plan.theme,
      },
      productFacts: resolved.productFacts,
      prompt: {
        actualPromptModel: resolved.prompt.apiModel,
        chineseSummary: resolved.prompt.chinesePromptSummary,
        englishPrompt: resolved.prompt.englishPrompt,
        fallbackReason: resolved.prompt.fallbackReason,
        promptModel: resolved.prompt.promptModel,
        promptModelLabel: resolved.prompt.promptModelLabel,
        requestedPromptModel: readString(request.textModel) || "gpt-5.6-terra",
        source: resolved.prompt.source === "model" ? "llm" : "builder",
        validation: resolved.prompt.promptValidation,
      },
      referenceImages: resolved.plan.selectedReferences,
      taskType: "generate",
      visualRule: resolved.visualRule,
    },
  });

  return {
    ...resolved,
    generation: result,
    historyVisible: Boolean(result.generationChainDraft),
    models: {
      ...resolved.models,
      actualImageModel: result.generationRecord?.actualImageModel || imageModel,
    },
    status: "succeeded" as const,
  };
}
