import { getImageTypePromptProfile } from "@/lib/ai-workspace/imageTypePromptProfiles";
import {
  containsCjk,
  normalizeProductSize,
  translateAccessories,
  translateDesignIntent,
  translatePackaging,
  translateProductCategory,
  translateProductColor,
  translateProductMaterial,
  translateProductName,
} from "@/lib/ai-workspace/promptEnglishNormalizer";
import { inferProductVisualSemantics } from "@/lib/ai-workspace/productVisualSemantics";
import { normalizeReferenceImageRole } from "@/lib/ai-workspace/referenceImageRules";
import type {
  GenerationContext,
  PromptSemanticPlan,
  ReferenceImage,
  SemanticValue,
} from "@/lib/ai-workspace/types";

function semanticValue(sourceText: string | undefined | null, englishText = sourceText ?? ""): SemanticValue | undefined {
  const source = sourceText?.trim() ?? "";
  const english = englishText?.trim() ?? "";

  if (!source) {
    return undefined;
  }

  return {
    englishText: english || undefined,
    sourceText: source,
    translationStatus: !containsCjk(source)
      ? "not-needed"
      : english && !containsCjk(english)
        ? "translated"
        : "unresolved",
  };
}

function splitSemanticList(sourceText: string | undefined | null, translatedText: string) {
  if (!sourceText?.trim()) {
    return [];
  }

  const sourceItems = sourceText
    .split(/[；;、,，]/)
    .map((item) => item.trim())
    .filter(Boolean);
  const translatedItems = translatedText
    .split(/\s*[,;]\s*/)
    .map((item) => item.trim())
    .filter(Boolean);

  return (sourceItems.length ? sourceItems : [sourceText.trim()]).map((source, index) =>
    semanticValue(source, translatedItems[index] ?? translatedText),
  ).filter((value): value is SemanticValue => Boolean(value));
}

function findVisualSpecValue(context: GenerationContext, pattern: RegExp) {
  const entry = Object.entries(context.visualRule.visualSpecification).find(([key]) =>
    pattern.test(key),
  );

  return entry?.[1]?.trim() ?? "";
}

function backgroundMode(context: GenerationContext): PromptSemanticPlan["compliance"]["background"] {
  const background = findVisualSpecValue(context, /background|背景/i);

  return /pure white|纯白|白底/i.test(background) ? "pure-white" : "flexible";
}

function logoMode(context: GenerationContext): PromptSemanticPlan["compliance"]["logo"] {
  const logo = findVisualSpecValue(context, /^logo$|logo/i).toLowerCase();

  if (/forbidden|禁止|不允许/.test(logo)) {
    return "forbidden";
  }

  if (/limited|platform/.test(logo)) {
    return "limited";
  }

  return "allowed";
}

function referenceUsage(image: ReferenceImage): PromptSemanticPlan["references"]["roles"][number]["usage"] {
  const type = image.type?.toLowerCase() ?? "";
  const role = normalizeReferenceImageRole(image.type);

  if (role === "brand_logo" || /logo/.test(type)) return "logo";
  if (/scene|lifestyle|场景/.test(type)) return "scene";
  if (/accessor|配件/.test(type)) return "accessory";

  return "accuracy";
}

function referenceRoleType(image: ReferenceImage) {
  return normalizeReferenceImageRole(image.type) ?? image.type ?? "reference";
}

export function buildPromptSemanticPlan(context: GenerationContext): PromptSemanticPlan {
  const effectiveScene = translateDesignIntent(context.designIntent);
  const profile = getImageTypePromptProfile(context);
  const translatedMaterial = translateProductMaterial(context.productFacts.material);
  const translatedAccessories = translateAccessories(context.productFacts.accessories);

  return {
    compliance: {
      avoid: context.visualRule.promptGuidance.avoid,
      background: backgroundMode(context),
      copySpace: findVisualSpecValue(context, /copy\s*space|文案|留白/i),
      focus: context.visualRule.promptGuidance.focus,
      logo: logoMode(context),
      productRatio: findVisualSpecValue(context, /product\s*ratio|商品占比/i),
    },
    imageTypeProfile: profile,
    product: {
      accessories: splitSemanticList(context.productFacts.accessories, translatedAccessories),
      brand: semanticValue(context.productFacts.brand),
      category: semanticValue(
        context.productFacts.category,
        translateProductCategory(context.productFacts.category),
      ),
      color: semanticValue(context.productFacts.color, translateProductColor(context.productFacts.color)),
      materials: splitSemanticList(context.productFacts.material, translatedMaterial),
      name:
        semanticValue(context.productFacts.name, translateProductName(context.productFacts.name)) ??
        {
          sourceText: "current product",
          translationStatus: "not-needed",
        },
      packaging: semanticValue(
        context.productFacts.packaging,
        translatePackaging(context.productFacts.packaging),
      ),
      size: semanticValue(context.productFacts.size, normalizeProductSize(context.productFacts.size)),
      visualSemantics: inferProductVisualSemantics(context.productFacts),
    },
    references: {
      count: context.referenceImages.length,
      roles: context.referenceImages.map((image, index) => ({
        index: index + 1,
        type: referenceRoleType(image),
        usage: referenceUsage(image),
      })),
    },
    scene: {
      englishText: effectiveScene,
      sourceText: context.designIntent?.trim() || "按当前平台与主题生成清晰、真实、可用于电商展示的商品图片。",
      translationStatus:
        context.designIntent && containsCjk(context.designIntent)
          ? containsCjk(effectiveScene)
            ? "unresolved"
            : "translated"
          : "not-needed",
    },
    task: {
      aspectRatio: context.outputSpecification.aspectRatio,
      outputSize: context.outputSpecification.outputSize,
      singleStandaloneImage: true,
      visibleCopyLanguage: context.language.promptName,
    },
    visibleCopy: context.visibleCopy,
  };
}

export function formatSemanticValue(value?: SemanticValue) {
  if (!value) {
    return "";
  }

  if (value.englishText && value.translationStatus !== "unresolved") {
    return value.englishText;
  }

  return value.englishText || value.sourceText;
}
