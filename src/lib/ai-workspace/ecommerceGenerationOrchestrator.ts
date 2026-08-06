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
import { getVisibleCopyPolicy } from "@/lib/ai-workspace/visibleCopyPolicy";
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
  ProductFacts,
} from "@/lib/ai-workspace/types";

type EcommerceGenerationMode = "plan_only" | "generate" | "plan_then_generate";
type EcommerceCopyMode = "auto" | "user_confirmed" | "none";
type BrandLogoMode = "auto" | "required" | "forbidden";

type EcommerceConfirmedPlanItem = {
  index?: number;
  subject?: string;
  scene?: string;
  sellingAngle?: string;
  designIntent?: string;
  visibleCopy?: {
    headline?: string;
    subheadline?: string;
    sellingPoints?: string[];
    source?: string;
  };
};

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
  confirmedPlanItems?: EcommerceConfirmedPlanItem[];
  textModel?: string;
  imageModel?: string;
  options?: {
    generationConcurrency?: number;
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

type EcommerceDesignPlanItem = {
  index: number;
  imageType: ImageType;
  theme: string;
  subject: string;
  scene: string;
  sellingAngle: string;
  visibleCopy: {
    headline?: string;
    subheadline?: string;
    sellingPoints?: string[];
    source: "ai_candidate" | "user_confirmed" | "none" | "suggested";
  };
  referenceRoles: string[];
  logoMode: BrandLogoMode;
  copyMode: EcommerceCopyMode;
  designIntent: string;
  needsConfirmation: boolean;
  copyConfirmationRequired: boolean;
};

function readString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function readImageCount(value: unknown) {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.min(Math.max(Math.floor(value), 1), 6)
    : 0;
}

function readConcurrency(value: unknown) {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.min(Math.max(Math.floor(value), 1), 3)
    : 2;
}

function unique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

function splitListText(value: string) {
  return value
    .split(/[、,，;；/|]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function readConfirmedPlanItems(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is EcommerceConfirmedPlanItem =>
    Boolean(item && typeof item === "object"),
  );
}

export async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  worker: (item: T, index: number) => Promise<R>,
) {
  const results: R[] = new Array(items.length);
  let nextIndex = 0;
  const workerCount = Math.min(Math.max(Math.floor(concurrency), 1), items.length);

  await Promise.all(
    Array.from({ length: workerCount }, async () => {
      while (nextIndex < items.length) {
        const currentIndex = nextIndex;

        nextIndex += 1;
        results[currentIndex] = await worker(items[currentIndex], currentIndex);
      }
    }),
  );

  return results;
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

function summarizeReferenceRoles(references: ReferenceImage[]) {
  return unique(
    references.map((reference) => {
      const role = normalizeReferenceImageRole(reference.type);

      return role || reference.type || "reference";
    }),
  );
}

function getFallbackDesignAngles(input: {
  imageCount: number;
  productFacts: ProductFacts;
  request: EcommerceGenerationRequest;
  theme: string;
}) {
  const productName = input.productFacts.name || input.productFacts.category || "商品";
  const category = input.productFacts.category || "商品";
  const baseAngles = input.theme === "使用场景图"
    ? [
        {
          scene: readString(input.request.scene) || "真实使用场景",
          sellingAngle: "日常使用信心",
          subject: readString(input.request.subject) || `${productName} 使用场景`,
        },
        {
          scene: "学习、练习或体验场景",
          sellingAngle: "适合入门与日常练习",
          subject: `${category} 与使用者互动`,
        },
        {
          scene: "整洁生活化空间",
          sellingAngle: "收纳携带与套装便利",
          subject: `${productName} 搭配必要配件`,
        },
      ]
    : [
        {
          scene: readString(input.request.scene) || "浅色电商产品背景",
          sellingAngle: readString(input.request.sellingAngle) || "商品整体识别",
          subject: readString(input.request.subject) || `${productName} 主体展示`,
        },
        {
          scene: "细节近景或质感背景",
          sellingAngle: "材质与做工价值",
          subject: `${productName} 关键细节`,
        },
        {
          scene: "套装配件整齐陈列",
          sellingAngle: "一套配齐更省心",
          subject: `${productName} 与已验证配件`,
        },
      ];

  return Array.from({ length: input.imageCount }, (_, index) => baseAngles[index % baseAngles.length]);
}

function buildDesignPlanItems(input: {
  brandLogoMode: BrandLogoMode;
  copyCandidates?: ImageCopyCandidate[];
  copyMode: EcommerceCopyMode;
  imageCount: number;
  imageType: ImageType;
  productFacts: ProductFacts;
  request: EcommerceGenerationRequest;
  selectedReferences: ReferenceImage[];
  theme: string;
  visibleCopy?: VisibleCopy;
}) {
  const fallbackAngles = getFallbackDesignAngles({
    imageCount: input.imageCount,
    productFacts: input.productFacts,
    request: input.request,
    theme: input.theme,
  });
  const sceneList = splitListText(readString(input.request.scene));
  const referenceRoles = summarizeReferenceRoles(input.selectedReferences);

  return Array.from({ length: input.imageCount }, (_, index): EcommerceDesignPlanItem => {
    const candidate = input.copyCandidates?.[index];
    const fallback = fallbackAngles[index];
    const confirmedVisibleCopy =
      input.copyMode === "user_confirmed" ? buildVisibleCopyFromConfirmed(input.request.confirmedCopy) : undefined;
    const copySource: EcommerceDesignPlanItem["visibleCopy"]["source"] =
      input.copyMode === "none" || input.visibleCopy?.enabled === false
        ? "none"
        : input.copyMode === "user_confirmed"
        ? "user_confirmed"
        : candidate
        ? "ai_candidate"
        : "suggested";
    const visibleCopy =
      copySource === "none"
        ? { source: copySource }
        : copySource === "user_confirmed"
        ? {
            headline: confirmedVisibleCopy?.headline,
            sellingPoints: confirmedVisibleCopy?.sellingPoints,
            source: copySource,
            subheadline: confirmedVisibleCopy?.subheadline,
          }
        : {
            headline: candidate?.headline,
            sellingPoints: candidate?.sellingPoints,
            source: copySource,
            subheadline: candidate?.subheadline,
          };
    const scene = sceneList[index] || fallback.scene;
    const sellingAngle = candidate?.angle || candidate?.positioning || fallback.sellingAngle;
    const subject = readString(input.request.subject) || fallback.subject;

    return {
      copyMode: input.copyMode,
      designIntent: [
        `主体：${subject}`,
        `场景：${scene}`,
        `卖点方向：${sellingAngle}`,
        input.brandLogoMode === "required" ? "Logo：必须展示" : "",
        input.brandLogoMode === "forbidden" ? "Logo：不展示" : "",
      ].filter(Boolean).join("\n"),
      imageType: input.imageType,
      index: index + 1,
      logoMode: input.brandLogoMode,
      copyConfirmationRequired: copySource === "ai_candidate" || copySource === "suggested",
      needsConfirmation: true,
      referenceRoles,
      scene,
      sellingAngle,
      subject,
      theme: input.theme,
      visibleCopy,
    };
  });
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

async function resolvePlan(
  request: EcommerceGenerationRequest,
  options: { includePrompt: boolean },
) {
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
  const visibleCopyPolicy = getVisibleCopyPolicy(visualRule);
  let visibleCopy: VisibleCopy | undefined;
  let copyCandidates: ImageCopyCandidate[] | undefined;

  if (copyMode === "none" || !visibleCopyPolicy.allowed) {
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
  const prompt = options.includePrompt
    ? (
        await generateWorkspacePromptCandidates({
          generationContext,
          promptModels: [readString(request.textModel) || "gpt-5.6-terra"],
        })
      )[0]
    : undefined;
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
    designPlan: {
      items: buildDesignPlanItems({
        brandLogoMode,
        copyCandidates,
        copyMode,
        imageCount,
        imageType,
        productFacts,
        request,
        selectedReferences: selected,
        theme,
        visibleCopy,
      }),
      needsUserConfirmation: true,
      summary: `${platform} ${theme} ${imageCount} 张设计方案，产品编号 ${productFacts.sku}。`,
    },
    generationContext,
    generationGroupId,
    models: {
      actualTextModel: prompt?.promptModel || readString(request.textModel) || "gpt-5.6-terra",
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

function hasConfirmedVisibleCopy(item: EcommerceConfirmedPlanItem) {
  return Boolean(
    readString(item.visibleCopy?.headline) ||
      readString(item.visibleCopy?.subheadline) ||
      (item.visibleCopy?.sellingPoints ?? []).some((point) => readString(point)),
  );
}

function buildRequestFromConfirmedPlanItem(input: {
  baseRequest: EcommerceGenerationRequest;
  item: EcommerceConfirmedPlanItem;
}) {
  const hasCopy = hasConfirmedVisibleCopy(input.item);
  const copyMode: EcommerceCopyMode =
    input.item.visibleCopy?.source === "none"
      ? "none"
      : hasCopy
      ? "user_confirmed"
      : normalizeCopyMode(input.baseRequest.copyMode);

  return {
    ...input.baseRequest,
    confirmedPlanItems: undefined,
    confirmedCopy: hasCopy
      ? {
          headline: input.item.visibleCopy?.headline,
          sellingPoints: input.item.visibleCopy?.sellingPoints,
          subheadline: input.item.visibleCopy?.subheadline,
        }
      : input.baseRequest.confirmedCopy,
    copyMode,
    designIntent: readString(input.item.designIntent) || readString(input.baseRequest.designIntent),
    imageCount: 1,
    mode: "generate" as const,
    scene: readString(input.item.scene) || readString(input.baseRequest.scene),
    sellingAngle: readString(input.item.sellingAngle) || readString(input.baseRequest.sellingAngle),
    subject: readString(input.item.subject) || readString(input.baseRequest.subject),
  } satisfies EcommerceGenerationRequest;
}

async function runConfirmedPlanItemsGeneration(input: {
  items: EcommerceConfirmedPlanItem[];
  request: EcommerceGenerationRequest;
}) {
  const validationRequest = {
    ...input.request,
    confirmedPlanItems: undefined,
    copyMode: "none" as const,
    imageCount: input.items.length,
    mode: "plan_only" as const,
  };
  const validation = await resolvePlan(validationRequest, { includePrompt: false });

  if (validation.status === "needs_input") {
    return validation;
  }

  const concurrency = readConcurrency(input.request.options?.generationConcurrency);
  const startedAt = Date.now();
  const settled = await mapWithConcurrency(input.items, concurrency, async (item, index) => {
    try {
      const result = await runSingleEcommerceImageGeneration(
        buildRequestFromConfirmedPlanItem({
          baseRequest: input.request,
          item,
        }),
      );

      if (result.status === "needs_input") {
        return {
          error: result.questions.join("；"),
          index: item.index ?? index + 1,
          missingFields: result.missingFields,
          status: "failed" as const,
        };
      }

      if (result.status !== "succeeded") {
        return {
          error: "已确认方案生成未返回成功状态。",
          index: item.index ?? index + 1,
          status: "failed" as const,
        };
      }

      return {
        generation: result.generation,
        generationGroupId: result.generationGroupId,
        historyVisible: result.historyVisible,
        index: item.index ?? index + 1,
        prompt: result.prompt,
        status: "succeeded" as const,
      };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : String(error),
        index: item.index ?? index + 1,
        status: "failed" as const,
      };
    }
  });
  const successfulItems = settled.filter((item) => item.status === "succeeded");
  const failedItems = settled.filter((item) => item.status === "failed");

  return {
    ...validation,
    batch: {
      concurrency,
      durationMs: Date.now() - startedAt,
      failedCount: failedItems.length,
      items: settled,
      requestedCount: input.items.length,
      succeededCount: successfulItems.length,
    },
    status: failedItems.length > 0 ? ("partial" as const) : ("succeeded" as const),
  };
}

async function runSingleEcommerceImageGeneration(request: EcommerceGenerationRequest) {
  const mode = normalizeMode(request.mode);
  const resolved = await resolvePlan(request, {
    includePrompt: mode !== "plan_only",
  });

  if (resolved.status === "needs_input") {
    return resolved;
  }

  if (mode === "plan_only") {
    return resolved;
  }

  if (!resolved.prompt) {
    throw new Error("生成前必须先生成五段式 Prompt。");
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

export async function runEcommerceImageGeneration(request: EcommerceGenerationRequest) {
  const mode = normalizeMode(request.mode);
  const confirmedPlanItems = readConfirmedPlanItems(request.confirmedPlanItems);

  if (mode !== "plan_only" && confirmedPlanItems.length > 0) {
    return runConfirmedPlanItemsGeneration({
      items: confirmedPlanItems,
      request,
    });
  }

  return runSingleEcommerceImageGeneration(request);
}
