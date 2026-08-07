import { getRecommendedOutputSpec } from "@/lib/ai-workspace/outputSpecMap";
import type {
  GenerationContext,
  ImageType,
  OutputLanguage,
  OutputSpecification,
  Platform,
  ProductFacts,
  ReferenceImage,
  VisibleCopy,
  VisualRule,
} from "@/lib/ai-workspace/types";
import { normalizeVisibleCopy } from "@/lib/ai-workspace/visibleCopyPolicy";

function readTaggedFact(tags: unknown, keys: string[]) {
  if (!Array.isArray(tags)) {
    return "";
  }

  const normalizedKeys = keys.map((key) => key.toLowerCase());
  const taggedValue = tags.find((tag): tag is string => {
    if (typeof tag !== "string") {
      return false;
    }

    const [tagKey] = tag.split(":");

    return normalizedKeys.includes(tagKey.trim().toLowerCase());
  });

  return taggedValue?.split(":").slice(1).join(":").trim() || "";
}

export function normalizeProductFacts(product: {
  id: string;
  sku?: string;
  name?: string;
  brand?: string;
  brandName?: string;
  category?: string;
  description?: string | null;
  tags?: unknown;
}): ProductFacts {
  return {
    id: product.id,
    sku: product.sku || product.name || product.id,
    name: product.name || product.sku || "未设置",
    brand: product.brand || product.brandName,
    category: product.category,
    material: readTaggedFact(product.tags, ["material", "材质"]),
    color: readTaggedFact(product.tags, ["color", "颜色"]),
    size: readTaggedFact(product.tags, ["size", "尺寸"]),
    accessories: readTaggedFact(product.tags, ["fittings", "accessories", "配件"]),
    packaging: readTaggedFact(product.tags, ["packaging", "包装内容", "包装"]),
    supplier: readTaggedFact(product.tags, ["supplier", "供应商"]),
    costPrice: readTaggedFact(product.tags, ["costPrice", "cost", "成本价"]),
    sellingPoints: readTaggedFact(product.tags, ["sellingPoints", "卖点"]),
    description: product.description,
    tags: product.tags,
  };
}

export function buildGenerationContext(input: {
  productFacts: ProductFacts;
  referenceImages: ReferenceImage[];
  platform: Platform;
  imageType: ImageType;
  theme: string;
  imageCount: number;
  designIntent: string;
  visibleCopy?: VisibleCopy;
  language: OutputLanguage;
  visualRule: VisualRule;
  outputSpecification?: Pick<OutputSpecification, "aspectRatio" | "outputSize">;
}): GenerationContext {
  const outputDefaults =
    input.outputSpecification ?? getRecommendedOutputSpec(input.platform, input.imageType);

  return {
    productFacts: input.productFacts,
    referenceImages: input.referenceImages,
    visualRule: input.visualRule,
    platform: input.platform,
    imageType: input.imageType,
    theme: input.theme,
    designIntent: input.designIntent.trim(),
    visibleCopy: normalizeVisibleCopy(input.visibleCopy, input.visualRule),
    language: input.language,
    outputSpecification: {
      platform: input.platform,
      imageType: input.imageType,
      theme: input.theme,
      imageCount: input.imageCount,
      language: input.language,
      ...outputDefaults,
    },
  };
}
