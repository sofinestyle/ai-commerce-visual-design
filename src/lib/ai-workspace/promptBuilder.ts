import type { GenerationContext, PromptResult } from "@/lib/ai-workspace/types";
import {
  translateAccessories,
} from "@/lib/ai-workspace/promptEnglishNormalizer";
import {
  buildPromptSemanticPlan,
  formatSemanticValue,
} from "@/lib/ai-workspace/promptSemanticPlan";
import { normalizeReferenceImageRole } from "@/lib/ai-workspace/referenceImageRules";
import {
  buildVisibleCopyInstruction,
  normalizeVisibleCopy,
} from "@/lib/ai-workspace/visibleCopyPolicy";

export type StructuredImagePrompt = {
  task: string;
  productAccuracy: string;
  effectiveSceneDirection: string;
  visibleCopy: string;
  complianceConstraints: string;
};

function compactJoin(parts: Array<string | undefined | null>) {
  return parts
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(" ");
}

function buildConsumerVisibleProductFacts(context: GenerationContext) {
  const plan = buildPromptSemanticPlan(context);
  const facts = context.productFacts;
  const materialText = plan.product.materials.map(formatSemanticValue).filter(Boolean).join(", ");
  const details = [
    facts.brand ? `Brand: ${formatSemanticValue(plan.product.brand)}.` : "",
    facts.name ? `Product: ${formatSemanticValue(plan.product.name)}.` : "",
    facts.category ? `Category: ${formatSemanticValue(plan.product.category)}.` : "",
    facts.color ? `Color: ${formatSemanticValue(plan.product.color)}.` : "",
    facts.size ? `Size: ${formatSemanticValue(plan.product.size)}.` : "",
    facts.material ? `Material: ${materialText}.` : "",
  ];

  return details.filter(Boolean).join(" ");
}

function findVisualSpecValue(context: GenerationContext, pattern: RegExp) {
  const entry = Object.entries(context.visualRule.visualSpecification).find(([key]) =>
    pattern.test(key),
  );

  return entry?.[1]?.trim() ?? "";
}

type ReferenceKind =
  | "accessories"
  | "back"
  | "brandAsset"
  | "brandLogo"
  | "detail"
  | "front"
  | "packaging"
  | "reference"
  | "scene"
  | "side";

const referenceKindLabels: Record<ReferenceKind, string> = {
  accessories: "Accessories",
  back: "Back",
  brandAsset: "Brand Asset",
  brandLogo: "Brand Logo",
  detail: "Detail",
  front: "Front",
  packaging: "Packaging",
  reference: "Reference",
  scene: "Scene",
  side: "Side",
};

function getReferenceKind(value?: string | null): ReferenceKind | null {
  const normalized = value?.trim().toLowerCase() ?? "";
  const role = normalizeReferenceImageRole(value);

  if (!normalized) return null;
  if (role === "brand_logo") return "brandLogo";
  if (role === "brand_asset") return "brandAsset";
  if (role === "front") return "front";
  if (role === "back") return "back";
  if (role === "side") return "side";
  if (role === "detail") return "detail";
  if (role === "accessories") return "accessories";
  if (role === "packaging") return "packaging";
  if (role === "reference") return "reference";
  if (/front|正面/.test(normalized)) return "front";
  if (/back|背面/.test(normalized)) return "back";
  if (/side|侧面/.test(normalized)) return "side";
  if (/detail|细节/.test(normalized)) return "detail";
  if (/accessor|配件/.test(normalized)) return "accessories";
  if (/packag|包装/.test(normalized)) return "packaging";
  if (/scene|lifestyle|场景|生活/.test(normalized)) return "scene";

  return null;
}

function uniqueReferenceKinds(values: Array<string | undefined>) {
  return [
    ...new Set(
      values
        .map(getReferenceKind)
        .filter((kind): kind is ReferenceKind => Boolean(kind)),
    ),
  ];
}

function formatReferenceKinds(kinds: ReferenceKind[]) {
  return kinds.map((kind) => referenceKindLabels[kind]).join(", ");
}

function buildReferenceUsageText(context: GenerationContext) {
  if (context.referenceImages.length === 0) {
    return "No confirmed reference images are provided; use only verified product facts.";
  }

  const availableKinds = uniqueReferenceKinds(context.referenceImages.map((image) => image.type));
  const kindInstruction =
    availableKinds.length > 0
      ? `Provided reference roles: ${formatReferenceKinds(availableKinds)}.`
      : "";

  return compactJoin([
    `Use the ${context.referenceImages.length} confirmed reference image(s) only for visual accuracy.`,
    kindInstruction,
    "Do not copy references as inset images, multi-view layouts, or reference sheets.",
  ]);
}

function buildTaskSection(context: GenerationContext) {
  return compactJoin([
    `Create one standalone complete commercial product image${context.outputSpecification.aspectRatio ? `, ${context.outputSpecification.aspectRatio}` : ""}${context.outputSpecification.outputSize ? `, ${context.outputSpecification.outputSize}` : ""}.`,
    `If approved visible copy is used, it must be in ${context.language.promptName}.`,
    "Each API candidate must be an independent single-canvas image; never depict the output count, numbered variants, panels, collages, contact sheets, comparison views, or multiple canvases.",
  ]);
}

function requiresPureWhiteBackground(context: GenerationContext) {
  return Object.entries(context.visualRule.visualSpecification).some(([key, value]) => {
    const normalizedKey = key.toLowerCase();
    const normalizedValue = value.toLowerCase();

    return (
      /background|背景/.test(normalizedKey) &&
      (/pure white/.test(normalizedValue) || /纯白|白底/.test(value))
    );
  });
}

export function buildEffectiveDesignIntent(context: GenerationContext) {
  const intent = context.designIntent?.trim();

  if (!intent) {
    return "按当前平台与主题生成清晰、真实、可用于电商展示的商品图片。";
  }

  const requestsEnvironment = /背景|场景|环境|工坊|工作室|教室|客厅|舞台|户外|展厅|画廊|书房/.test(intent);

  if (!requiresPureWhiteBackground(context) || !requestsEnvironment) {
    return intent;
  }

  return "严格遵循纯白背景规则，仅以精细光影、真实材质和专业工艺感表达原设计氛围，不呈现任何环境、道具或场景背景。";
}

export function buildSingleOutputCompositionInstruction(context: GenerationContext) {
  const primaryView = context.visualRule.mediaGuidance.primary[0]?.trim();
  const viewInstruction = primaryView
    ? `Use ${primaryView} as the single primary product view for this composition.`
    : "Use one clear front-facing or front three-quarter product view as the single primary composition.";

  return [
    "Generate one standalone composition in each output image.",
    viewInstruction,
    "The API handles the number of independent outputs separately; do not depict the requested output count inside the image.",
    "Reference views are accuracy sources only. Do not combine front, back, side, or logo references into one canvas.",
    "Do not create a collage, triptych, contact sheet, split screen, comparison layout, storyboard, multi-panel image, or multiple views within the same canvas.",
  ].join(" ");
}

export function buildBrandLogoReferenceInstruction(context: GenerationContext) {
  const hasBrandLogoReference = hasVerifiedBrandLogoReference(context);

  if (!hasBrandLogoReference) {
    return "No verified logo reference is provided. Do not create, approximate, redraw, spell, or hallucinate any visible logo, wordmark, brand mark, trademark, or branded label.";
  }

  return "Use the logo reference as the only source of truth when logo display is allowed; do not redraw, restyle, misspell, approximate, or invent branding.";
}

function hasVerifiedBrandLogoReference(context: GenerationContext) {
  return context.referenceImages.some(
    (image) => image.type === "brand_logo" || image.type === "品牌 Logo",
  );
}

function buildProductAccuracySection(context: GenerationContext) {
  const facts = context.productFacts;
  const plan = buildPromptSemanticPlan(context);
  const brandLogoInstruction = buildBrandLogoReferenceInstruction(context);
  const visualSemantics = plan.product.visualSemantics.length
    ? plan.product.visualSemantics
        .filter((semantic) => !/^Accessories are factual boundaries/i.test(semantic))
        .join(" ")
    : "";

  return compactJoin([
    "Product accuracy has highest priority.",
    buildConsumerVisibleProductFacts(context),
    visualSemantics,
    buildReferenceUsageText(context),
    brandLogoInstruction,
  ]);
}

function buildPhotographyProfile(context: GenerationContext) {
  const plan = buildPromptSemanticPlan(context);
  const isDetail = /detail|macro/i.test(plan.imageTypeProfile.theme);
  const isSet = /set-content/i.test(plan.imageTypeProfile.theme);

  if (isDetail) {
    return "Photography profile: commercial macro product photography, close natural perspective, soft directional key light, crisp material micro-detail, realistic reflections, clean focus falloff, natural shadow contact, balanced exposure.";
  }

  if (isSet) {
    return "Photography profile: clear commercial product photography, natural eye-level perspective, broad soft key light, crisp edges, realistic material reflections, controlled shadows, balanced exposure.";
  }

  return "Photography profile: commercial product photography, eye-level natural 50mm perspective, soft window key light, subtle warm rim light, shallow depth of field, crisp product edges, realistic material reflections, natural shadow contact, balanced exposure.";
}

function isCrossBorderPlatform(context: GenerationContext) {
  return context.platform === "Amazon" || context.platform === "TEMU" || context.platform === "SHEIN";
}

function isAmazonFirstImage(context: GenerationContext) {
  return context.platform === "Amazon" && context.imageType === "主图" && context.theme === "首图";
}

function buildPlatformSceneInstruction(context: GenerationContext) {
  if (isAmazonFirstImage(context)) {
    return "For Amazon first image: use a clean white background, no added logo, no marketing copy, and show the product clearly with only verified accessories.";
  }

  if (isCrossBorderPlatform(context)) {
    return context.theme === "产品图"
      ? "For cross-border product image: keep product accuracy and clear ecommerce readability first. Background is flexible; if the user does not specify a background, use a light neutral or light lifestyle setting."
      : "For cross-border image: keep product accuracy, clear ecommerce readability, and restrained styling first.";
  }

  return "For content/self-owned platform image: prioritize product accuracy while allowing brand styling, confirmed logo, approved copy, and the specific product focus described by the design intent.";
}

function intentRequestsSetDisplay(intent: string) {
  return /套装|配件|全套|清单|包含|set|bundle|contents|accessories/i.test(intent);
}

function buildEffectiveSceneDirectionSection(context: GenerationContext) {
  const intent = buildEffectiveDesignIntent(context);
  const plan = buildPromptSemanticPlan({
    ...context,
    designIntent: intent,
  });
  const englishIntent = plan.scene.englishText || plan.scene.sourceText;
  const accessoryText = context.productFacts.accessories
    ? translateAccessories(context.productFacts.accessories)
    : "";
  const shouldShowSet =
    context.theme === "产品图" && accessoryText && intentRequestsSetDisplay(`${intent} ${englishIntent}`);
  const setInstruction = shouldShowSet
    ? compactJoin([
        `Must show only these verified set contents: main product, ${accessoryText}. Do not add extra accessories.`,
        "Render smaller verified accessories in clean, generic, realistic forms based only on their verified names.",
        "Keep all set items readable, with the main product and main container as the hero group.",
      ])
    : "";

  return compactJoin([
    buildPlatformSceneInstruction(context),
    `Image type: ${plan.imageTypeProfile.theme}.`,
    setInstruction,
    englishIntent,
    buildPhotographyProfile(context),
    context.imageType === "详情页"
      ? "Detail page content is driven by the design intent; do not apply main-image composition rules."
      : "Keep the product visually dominant and clearly readable.",
  ]);
}

function buildVisibleCopySection(context: GenerationContext) {
  const visibleCopy = normalizeVisibleCopy(
    context.visibleCopy,
    context.visualRule,
  );

  return buildVisibleCopyInstruction({
    language: context.language,
    visibleCopy,
    visualRule: context.visualRule,
  });
}

function buildComplianceConstraintsSection(context: GenerationContext) {
  return compactJoin([
    "Do not alter verified product facts, brand identity, color, structure, scale, materials, packaging, or confirmed accessories.",
    "Show visible logos or branded labels only from a selected verified logo reference; otherwise keep the image logo-free and unbranded.",
    "Do not add unverified accessories, random text, watermarks, prices, discounts, ratings, certifications, sales claims, or medical/performance guarantees.",
    "Do not create collages, split screens, comparison layouts, contact sheets, storyboards, or multi-view canvases.",
    isAmazonFirstImage(context)
      ? "For Amazon first image: white background only, no added logo, no marketing copy."
      : "",
  ]);
}

export function buildStructuredWorkspacePrompt(context: GenerationContext): StructuredImagePrompt {
  return {
    task: buildTaskSection(context),
    productAccuracy: buildProductAccuracySection(context),
    effectiveSceneDirection: buildEffectiveSceneDirectionSection(context),
    visibleCopy: buildVisibleCopySection(context),
    complianceConstraints: buildComplianceConstraintsSection(context),
  };
}

export function formatStructuredPrompt(prompt: StructuredImagePrompt) {
  return [
    ["Task", prompt.task],
    ["Product Accuracy", prompt.productAccuracy],
    ["Effective Scene Direction", prompt.effectiveSceneDirection],
    ["Visible Copy", prompt.visibleCopy],
    ["Compliance Constraints", prompt.complianceConstraints],
  ]
    .map(([title, content]) => `${title}:\n${content}`)
    .join("\n\n");
}

export function buildWorkspacePrompt(context: GenerationContext): PromptResult {
  const intent = buildEffectiveDesignIntent(context);
  const visibleCopy = normalizeVisibleCopy(
    context.visibleCopy,
    context.visualRule,
  );
  const brandLogoInstruction = buildBrandLogoReferenceInstruction(context);
  const structuredPrompt = buildStructuredWorkspacePrompt(context);

  const chinesePromptSummary = [
    `生成一张独立完整的${context.imageType}商品图，画幅 ${context.outputSpecification.aspectRatio ?? "按模型默认比例"}，尺寸 ${context.outputSpecification.outputSize ?? "按模型默认尺寸"}。系统将独立生成 ${context.outputSpecification.imageCount} 张候选图，但单张画面内不得出现拼图、分屏或多视角画布。`,
    `商品准确性优先：${context.productFacts.brand ? `${context.productFacts.brand} ` : ""}${context.productFacts.name || "当前商品"}${context.productFacts.color ? `，颜色 ${context.productFacts.color}` : ""}${context.productFacts.material ? `，材质 ${context.productFacts.material}` : ""}${context.productFacts.size ? `，尺寸 ${context.productFacts.size}` : ""}；不得改变颜色、结构、尺寸比例、配件、包装或品牌身份。`,
    `生效场景方向：${intent}`,
    visibleCopy.enabled && visibleCopy.headline
      ? `已确认画面文案：主标题“${visibleCopy.headline}”${visibleCopy.subheadline ? `，副标题“${visibleCopy.subheadline}”` : ""}${visibleCopy.sellingPoints?.length ? `，卖点短句：${visibleCopy.sellingPoints.map((point) => `“${point}”`).join("、")}` : ""}${visibleCopy.placementHint ? `，排版位置：${visibleCopy.placementHint}` : ""}。必须准确呈现，不得翻译、改写或增加其他文字。`
      : "本次未启用画面文案，不添加营销标题、副标题或其他可见文字。",
    hasVerifiedBrandLogoReference(context)
      ? "已加载品牌 Logo 原图；如平台规则允许展示，必须以该原图为唯一标准，不得重绘、改字或生成相似标识。"
      : "未加载品牌 Logo 原图；画面不得生成 Logo、品牌字样或相似商标。",
    `平台规则已解析为最终可执行约束：${structuredPrompt.complianceConstraints}`,
  ].join("\n");

  const englishPrompt = formatStructuredPrompt(structuredPrompt);

  return {
    chinesePromptSummary,
    englishPrompt,
  };
}
